# RETROKE LIVE — Arquitectura Propuesta

**Fase 1 (Auditoría) + Fase 2 (Arquitectura), sin código escrito.**
Este documento se entrega para aprobación antes de implementar nada, tal como se pidió.

---

## FASE 1 — AUDITORÍA

### 1.1 Lo que ya existe y Retroke Live debe respetar tal cual

| Pieza | Archivo | Rol |
|---|---|---|
| Pantalla del local (TV) | `src/pages/Display.jsx` + `DisplayQueue/DisplayCalled/DisplayCountdown/DisplayReactions/DisplayRating/DisplayResult` | Router puro por `screenMode`, sin lógica de red propia — todo llega resuelto por `KaraokeSessionContext` vía Supabase Realtime (`postgres_changes`). **Cero solapamiento** con streaming: no hay `RTCPeerConnection` ni `getUserMedia` en ninguno de estos archivos. |
| Centro de control del DJ | `src/pages/DjPanel.jsx` | Un componente largo (`DjPanelInner`) sin sistema de tabs — usa flags `showX/setShowX` que abren modales/paneles (`showHistory`, `showProfile`, etc.). El header (L1278-1408) ya tiene un botón que abre `/` en pestaña nueva ("🖥️ Sala de espera") — **ahí encaja naturalmente un botón hermano "🔴 Retroke Live"** que abra un panel nuevo, sin tocar el resto. |
| Identidad de quién opera | `useKaraokeSession()` (`KaraokeSessionContext.jsx`) | Da `barId`, `workspaceId`, `barName`, `workspacePlan`, `workspaceType`, `sessionId`, `hasFeature()`. Es el ancla natural para asociar un Live a un bar/workspace. |
| Ownership | `workspaces.owner_id`, `bar_members`/`workspace_members` (`role: OWNER/ADMIN/DJ/OPERATOR/MEMBER`) | Ya existe una función RPC **`has_workspace_access(ws_id, min_role)`** en Supabase — reutilizable tal cual para autorizar quién puede iniciar/detener un Live. |
| Realtime actual | `src/lib/realtime.js` | Solo `postgres_changes` (cambios en tablas), con debounce. Sin Presence ni Broadcast todavía. |
| Precedente WebRTC | `src/lib/webrtcMic.js` | **Ya existe señalización WebRTC nativa** (oferta/respuesta/ICE) usando `supabase.channel().send({type:'broadcast', ...})`, hoy 1:1 (mic del cantante → TV). Es la prueba de que WebRTC + Supabase Broadcast ya se usó y funciona en este proyecto — pero está pensado para 1 emisor→1 receptor, no 1→N espectadores, así que **no se reutiliza directamente**, solo confirma que el patrón de señalización por Supabase es viable si hiciera falta.
| Reacciones | `src/lib/statuses.js` → `toggleReaction()` | Atado 1:1 a la tabla `status_reactions` (columna fija `status_id`). No es genérico — para Live se necesita un mecanismo aparte (ver 2.11). |
| Planes | `workspaces.type` (`BAR/DJ/HOME`) × `plan` (`FREE/PRO` reales; `PREMIUM` es solo un badge visual sin lógica detrás) | Gating real hoy: límite de **2 sesiones/mes en plan DJ Free** (`DjPanel.jsx` L395-419) + feature flags por `plan_features` vía `hasFeature()`. No hay límite de "espectadores" ni "minutos de streaming" todavía — habría que sumarlo como feature nueva, no modificar lo existente. |
| Hosting | `vercel.json` | Solo rewrites SPA + 1 cron. Sin funciones edge ni configuración de streaming. Vercel es 100% serverless: **no puede alojar un servidor de media persistente** (SFU), eso descarta cualquier opción de "self-host en nuestra propia infra" para el MVP. |
| Dependencias | `package.json` | Ninguna librería de WebRTC/streaming instalada (nada de LiveKit, Agora, Daily, Mux). Vía libre para elegir sin migrar nada. |
| Auth | `AuthContext.jsx` (DJ, magic-link/password) + `lib/participant.js` (espectador anónimo por dispositivo, con upgrade opcional a Google) | Confirma el modelo dual ya usado en toda la app: **Live reutiliza exactamente este mismo modelo** — DJ autenticado inicia, espectador anónimo mira. |

### 1.2 El hallazgo de seguridad de la conversación anterior

Ya detectamos que `/registro?bar=slug` / `?ws=id` no valida el PIN de sesión en backend (solo se pide si se navega sin parámetros por el selector de salas). Esto es un problema **independiente de Retroke Live** — no lo introduce ni lo agrava esta funcionalidad, porque el camino de Retroke Live (ver 2.2 más abajo) **nunca toca `/registro`**: el espectador de Live no se anota a nada. Sigue siendo una tarea pendiente aparte, a decisión tuya, y no bloquea esta propuesta.

### 1.3 Conclusión de la auditoría

No hay conflictos estructurales. Retroke Live puede construirse como módulo nuevo (tabla nueva en Supabase + 1 botón nuevo en DJ Panel + 1 componente nuevo en World) sin tocar cola, registro, Display, rankings, misiones, logros, desafíos, autenticación existente, RLS existente, Retroke Score, ni planes actuales.

---

## FASE 2 — ARQUITECTURA PROPUESTA

### 2.1 Diagrama de arquitectura

```
                         ┌─────────────────────────┐
                         │   DJ PANEL (navegador)   │
                         │  getUserMedia(cam+mic)   │
                         └────────────┬─────────────┘
                                      │ WHIP/WebRTC (publica)
                                      │ token firmado (backend)
                                      ▼
                         ┌─────────────────────────┐
                         │   SERVICIO DE MEDIA      │
                         │   (SFU administrado —    │
                         │    LiveKit Cloud)         │
                         │  1 "room" = 1 sesión Live │
                         └────────────┬─────────────┘
                                      │ WebRTC (suscribe, sólo lectura)
                     ┌────────────────┼────────────────┐
                     ▼                ▼                ▼
              Espectador 1     Espectador 2      Espectador N
              (Retroke World)  (Retroke World)   (Retroke World)

   ── Metadatos y estado (NO video/audio) ──

  DJ Panel ──insert/update──▶  Supabase `live_sessions`  ──postgres_changes──▶ Retroke World
                                       │
                                       ├── Presence (Supabase Realtime) → contador de espectadores
                                       └── Broadcast (Supabase Realtime) → reacciones efímeras al Live

  Vercel Serverless Function (/api/live-token)
        valida: ¿usuario autenticado es dueño/miembro del workspace? (has_workspace_access)
        → firma token de LiveKit con permiso "publish" scoped a esa room, expira en minutos

  Vercel Serverless Function (/api/live-viewer-token)
        sin auth (World es público) → firma token de LiveKit "subscribe-only" scoped a esa room
```

**Puntos clave del diagrama:** el video/audio NUNCA pasa por Vercel ni por Supabase — viaja directo entre el navegador del DJ, el SFU administrado, y los navegadores de los espectadores. Vercel y Supabase solo mueven metadatos (texto, JSON) — exactamente el mismo patrón de bajo tráfico que ya usa toda la app.

### 2.2 Flujo DJ → Media → Viewer

**Iniciar (DJ):**
1. DJ abre "Retroke Live" en su panel → pide permiso de cámara/micrófono (nunca automático).
2. Preview 100% local (nada se transmite todavía).
3. DJ elige cámara y fuente de audio de las que el navegador detecte.
4. DJ presiona "INICIAR RETROKE LIVE".
5. Frontend pide un token a `/api/live-token` (Vercel function). Esa función valida con `has_workspace_access()` que quien pide el token realmente opera ese bar/workspace.
6. Con el token, el navegador del DJ publica sus tracks al SFU (WHIP/WebRTC).
7. Se crea una fila en `live_sessions` (`status: 'active'`).

**Ver (espectador, desde Retroke World):**
1. En `/world`, la sección "Escenarios" ahora muestra "🔴 EN VIVO" para locales con `live_sessions.status = 'active'` (dato real, vía `postgres_changes`, igual que el resto de World).
2. Click en **"VER EN VIVO"** (nunca "Entrar en vivo" — ver 2.9).
3. El visor pide un token de solo-lectura a `/api/live-viewer-token` (sin login, igual de abierto que el resto de World).
4. Se conecta al SFU en modo suscriptor — nunca puede publicar, nunca se le pide cámara/mic propio.
5. Ve video + escucha audio + ve reacciones + puede reaccionar (Broadcast) + puede seguir al cantante actual (dato ya existente en `sessions.current_singer`).

**Finalizar (DJ):**
1. DJ presiona "FINALIZAR LIVE".
2. Se cierran los tracks locales (`track.stop()`), se cierra la conexión al SFU, se libera cámara/mic.
3. `live_sessions.status = 'ended'`, `ended_at = now()`.
4. Todos los espectadores ven el cambio de estado al instante (misma suscripción `postgres_changes`) y la sala pasa a "offline".

### 2.3 Tecnología propuesta

**Recomendación: SFU administrado (managed), no self-host, no P2P puro.**

- **P2P directo descartado**: con más de 2-3 espectadores por sala, cada conexión adicional duplica el ancho de banda de subida del DJ — su propio computador se vuelve el cuello de botella exacto que el punto 14 del prompt maestro pide evitar.
- **Self-host de un SFU propio descartado para el MVP**: Vercel no aloja procesos persistentes; habría que sumar un proveedor de servidores (Fly.io/Railway/AWS) solo para esto, multiplicando la superficie de operación antes de validar que la función se usa.
- **Servicio administrado**: la opción correcta para partir. Comparé 3 candidatos serios (agosto 2026):

| Proveedor | Modelo de precio | A favor | En contra |
|---|---|---|---|
| **LiveKit Cloud** (recomendado) | Tier gratis con 5.000 min WebRTC + 50GB egress/mes; sobre eso $0.004-0.024 por track-minuto según resolución; subida gratis desde 2026, bajada $0.12/GB | SDK de React maduro, WHIP/WebRTC nativo, reconexión y ajuste de calidad automáticos (simulcast/dynacast) ya incluidos — resuelve gran parte de los puntos 11-13 del prompt maestro sin código extra. Open source: existe camino de self-host futuro sin reescribir todo. | Curva de precio sube con volumen alto; hay que monitorear. |
| **Daily.co** | Tier gratis 10.000 min/mes; desde $0.004/min bajando a $0.0015/min por volumen | DX simple, buena documentación. | Ecosistema algo más chico que LiveKit para este patrón específico (1→N). |
| **Cloudflare Realtime (Calls)** | $0.05/GB egress con 1.000GB gratis/mes; RealtimeKit $0.002/participante-minuto | El más barato en teoría a escala grande, 100% edge (335 ubicaciones) — atractivo si Retroke crece a muchas ciudades/países. | SDK y documentación para el patrón "1 transmite, muchos miran" menos probados que LiveKit hoy; quedaría como candidato de re-evaluación cuando el volumen justifique el ahorro. |
| Mux | — | Es un servicio de encoding/entrega de video, no una plataforma WebRTC de tiempo real — no calza con el requisito de "está pasando ahora" (punto 32). | Descartado para este caso de uso. |

**Fuentes:** [LiveKit Pricing 2026 — Fora Soft](https://www.forasoft.com/blog/article/livekit-vs-agora-cost-analysis) · [LiveKit Pricing 2026 — checkthat.ai](https://checkthat.ai/brands/livekit/pricing) · [Cloudflare Calls anycast WebRTC](https://x.com/Cloudflare/status/1775882274124312642) · [Cloudflare TURN/SFU](https://www.cloudflare.com/products/turn-sfu/) · [WebRTC Platforms Compared 2026 — RTC Insights](https://www.rtcinsights.com/blog/webrtc-platforms-compared/) · [Low Latency Live Streaming 2026 — Fora Soft](https://www.forasoft.com/blog/article/edge-computing-live-streaming-guide)

**Dato de arquitectura importante:** Retroke Live no es "un canal con miles de espectadores" — es **muchas salas pequeñas en paralelo** (una por local activo). Escalar a 100 locales no significa 1 sala con 100x espectadores, significa 100 salas independientes con decenas/cientos de espectadores cada una. Eso significa que un SFU estándar (sin necesidad de HLS/CDN en cascada) alcanza cómodamente incluso en el escenario de "100 locales, miles de espectadores" del punto 15 — HLS solo se justificaría si UNA sala puntual se vuelve viral con miles de espectadores simultáneos, algo que se puede agregar después sin rediseñar nada (ver 2.12).

### 2.4 Justificación WebRTC/SFU vs. alternativas

- **WebRTC** es el único estándar de navegador que da latencia sub-segundo real (punto 32: "está ocurriendo ahora", no "voy con retraso"). HLS/DASH típicamente agregan 6-30 segundos de buffer.
- **SFU** (Selective Forwarding Unit) en vez de P2P: el DJ sube su video/audio **una sola vez** al servidor, y el servidor lo reenvía a cada espectador — el ancho de banda de subida del DJ no crece con la cantidad de espectadores.
- **Administrado** en vez de propio: el problema de "escalar un SFU con buena calidad global" ya está resuelto por estos proveedores; construirlo desde cero no aporta ventaja competitiva a Retroke, solo riesgo y tiempo.

### 2.5 Manejo de audio

- Fuente seleccionable por el DJ entre cualquier dispositivo de entrada que el navegador detecte (mic integrado, USB, o **interfaz de audio** conectada a la consola/mixer del DJ, que el sistema operativo expone como "dispositivo de entrada" normal — no requiere driver especial de Retroke).
- Cadena recomendada para instalaciones profesionales: `Consola/Mixer → Interfaz de audio → Computador del DJ → Retroke Live` (documentado en la UI como recomendación, no como requisito).
- **Cancelación de eco y reducción de ruido activadas solo para mic directo** (`echoCancellation`/`noiseSuppression` de `getUserMedia`, que son las opciones estándar del navegador). Cuando el DJ selecciona una interfaz de audio profesional, estas opciones se **desactivan por defecto** (con toggle manual) para no degradar una señal de línea limpia — eso es justo lo que el prompt maestro pide en el punto 9.
- Prioridad **audio sobre video** en todo momento (ver 2.7).

### 2.6 Manejo de video

- Resolución inicial objetivo: **720p**, con escalones de caída 720p → 540p → 480p → 360p según conexión.
- Captura vía `getUserMedia({video: {deviceId, width: 1280, height: 720}})`, seleccionable entre cualquier cámara detectada (integrada, USB, profesional vía captura UVC).
- **Simulcast** (LiveKit lo da de fábrica): el navegador del DJ publica automáticamente 2-3 capas de calidad; el SFU le entrega a cada espectador la capa que su conexión aguante, sin que el DJ tenga que hacer nada.

### 2.7 Adaptación de bitrate — prioridad Audio > Video

Orden de degradación automática cuando la conexión empeora (esto ya lo maneja el SDK del SFU elegido, no hay que reinventarlo, solo configurarlo así):
1. Bajar resolución/bitrate de video (720p → 360p).
2. Bajar framerate de video.
3. Si sigue mal: **apagar video, mantener solo audio** (estado `LIVE_AUDIO_ONLY`, ver 2.20).
4. El audio nunca se sacrifica antes que el video — es la señal mínima viable de "esto está pasando ahora".

### 2.8 Reconexión

- Al detectar pérdida (evento de estado del SDK del SFU): el visor y el DJ Panel muestran **"Reconexión en curso"**, nunca un error inmediato.
- Reintentos automáticos con backoff (nativo del SDK).
- Si la reconexión demora, se degrada calidad antes de cortar del todo.
- Solo se marca `LIVE_ERROR`/offline si la reconexión falla repetidamente durante un tiempo configurable (ej. 30-45s).

### 2.9 Nomenclatura ("Ver en vivo", no "Entrar en vivo")

Confirmado y ya alineado con la decisión tomada en la conversación anterior sobre el problema de sobrecarga de cola: el CTA en Retroke World para Retroke Live se llama **"VER EN VIVO"**, inequívocamente distinto de cualquier acción de inscripción. El camino de cantar sigue siendo, sin excepción: `usuario → local físico → QR del local → /registro → cola`.

### 2.10 Seguridad

- **Quién puede iniciar/detener un Live**: validado en backend (`/api/live-token`) contra `has_workspace_access(ws_id, 'DJ')` — la misma función RPC que ya protege el resto del panel. Nunca se confía en que el botón esté oculto en el frontend.
- **Quién puede publicar video/audio**: solo quien recibió un token de LiveKit con permiso `canPublish: true`, emitido exclusivamente por `/api/live-token` tras la validación anterior.
- **Quién puede ver**: cualquiera (público, sin login) — mismo modelo abierto que el resto de Retroke World — pero el token que reciben tiene `canPublish: false` siempre, así que aunque alguien inspeccione el tráfico y reutilice su propio token, no puede publicar nada a esa sala.
- Los tokens expiran en minutos y están scoped a una sola room — no sirven para otra sala ni se pueden reutilizar después de expirar.

### 2.11 Privacidad

- **Live apagado por defecto**, siempre. Nunca se activa cámara/mic automáticamente.
- Indicadores visibles en el DJ Panel: "Cámara activa" / "Micrófono activo" / "Transmisión activa", todo el tiempo que el Live esté corriendo.
- Al finalizar: se detienen los tracks (`MediaStreamTrack.stop()`), se cierra la conexión al SFU, se liberan cámara y micrófono — sin conexión fantasma.
- Identidad del cantante actual: se muestra en el visor **solo si ya es información pública hoy** (viene de `sessions.current_singer`, que ya se expone en Display/World) — Retroke Live no agrega ninguna exposición nueva de datos de participantes, y respeta cualquier configuración de privacidad que el participante ya tenga (ej. `show_instagram`).
- **Sin grabación**: la primera versión es *live only*. No hay VOD, no se guarda video ni audio en ningún lado — reduce costo, riesgo legal/privacidad, y complejidad de storage.

### 2.12 Supabase — diseño propuesto (no crear todavía)

Reutilizando relaciones existentes en vez de duplicar:

```sql
create table live_sessions (
  id uuid primary key default gen_random_uuid(),
  workspace_id uuid references workspaces(id),
  bar_id uuid references bars(id),
  session_id text references sessions(id),   -- reutiliza la sesión de karaoke activa, no duplica "quién canta"
  room_name text not null unique,             -- identificador de la room en el SFU
  status text not null default 'offline',     -- offline | starting | active | reconnecting | degraded | audio_only | ended | error
  camera_enabled boolean default true,
  audio_enabled boolean default true,
  started_at timestamptz,
  ended_at timestamptz,
  created_at timestamptz default now(),
  updated_at timestamptz default now()
);
```

Notas de diseño:
- **No** se agrega `viewer_count` como columna persistida — se calcula en vivo con **Supabase Realtime Presence** (una sala de presencia por `room_name`), evitando escrituras constantes a la base de datos (esto es justo lo que pide el punto 31).
- **No** se agregan `current_singer_id`/`current_song_id` — ya existen en `sessions.current_singer` (jsonb), se leen de ahí.
- **Reacciones al Live**: se proponen vía **Supabase Realtime Broadcast** (efímero, no persistido) en vez de una tabla nueva tipo `status_reactions` — las reacciones a un momento en vivo son por naturaleza pasajeras (igual que el punto 29 pide "no guardar grabaciones"), así que no tiene sentido guardarlas permanentemente. Si más adelante se quiere un conteo agregado histórico ("cuántas reacciones tuvo este Live"), se puede sumar un contador simple sin guardar cada reacción individual.
- **RLS propuesta**: `select` público (`anon` + `authenticated`), igual que `bars`/`sessions` hoy; `insert`/`update` solo si `has_workspace_access(workspace_id, 'DJ')` es verdadero para el usuario autenticado — reutilizando la función existente, no una nueva.

### 2.13 Escalabilidad

| Etapa | Salas simultáneas | Espectadores | Qué cambia técnicamente |
|---|---|---|---|
| MVP | 1 local | 1-5 | Nada especial — un SFU administrado ya soporta esto sin configuración extra. |
| Temprano | 10 locales | hasta ~10 c/u | Sigue siendo SFU puro, sin cambios. |
| Crecimiento | 50 locales | hasta ~100 c/u | Monitorear costo de egress por sala; posible mover locales de alto tráfico a un plan/tier superior del proveedor. |
| Escala | 100 locales | miles (repartidos en 100 salas) | Evaluar Cloudflare Realtime como alternativa de costo si el volumen lo justifica; considerar HLS como *fallback* solo para la sala puntual que se vuelva viral (no como default). |

### 2.14 Costos aproximados (LiveKit Cloud, estimación agosto 2026)

Estimación con audio+video 720p promedio por espectador, redondeando a favor de la prudencia:

| Escenario | Minutos-espectador/mes aprox. | Costo estimado/mes |
|---|---|---|
| 10 locales, 5 espectadores promedio, 4h/día activos | ~36.000 min | Dentro o cerca del tier gratis (5.000 min incluidos) + unos $50-150 |
| 50 locales, 20 espectadores promedio | ~720.000 min | Del orden de $500-1.500 (según mezcla de resolución, con la mayoría en 480p/540p) |
| 100 locales, 50 espectadores promedio | ~3.600.000 min | Del orden de $2.000-5.000 — este es el punto donde vale la pena cotizar Cloudflare Realtime en paralelo y/o negociar un plan enterprise |

**Esto es una estimación gruesa para presupuestar, no una cotización — antes de habilitar Live en producción real conviene pedir una simulación directa al proveedor elegido con los números reales de uso.**

### 2.15 Impacto en infraestructura actual

- **Vercel**: se agregan 2 funciones serverless livianas (`/api/live-token`, `/api/live-viewer-token`) — no afecta el resto del build ni el hosting del sitio.
- **Supabase**: 1 tabla nueva (`live_sessions`) + 1 política RLS reutilizando una función existente. Cero cambios a tablas actuales.
- **Frontend**: 1 dependencia nueva (`livekit-client` + `@livekit/components-react` o equivalente), aislada en un módulo propio (`src/components/live/` o similar) — no se toca ningún componente existente de World/DJ Panel/Display salvo para *agregar* el botón/card nuevo.
- **Rendimiento**: el streaming corre en el navegador del DJ y de cada espectador, no en el servidor de Retroke — no compite por recursos con la reproducción de karaoke, la cola, ni el Display (punto 25 y 42 del prompt maestro).

### 2.16 Riesgos

- **Dependencia de un proveedor externo**: si LiveKit Cloud tiene una caída, Retroke Live cae con ella (no el resto de Retroke). Mitigación: elegir un proveedor con SLA público y buen historial; la app sigue funcionando 100% sin Live si el proveedor falla.
- **Costo variable**: a diferencia del resto de la infraestructura (Vercel/Supabase con planes predecibles), el costo de streaming escala con uso real. Mitigación: alertas de consumo + límite de minutos por plan (BAR/DJ FREE vs PRO) desde el día 1.
- **Calidad de red del local**: un DJ con mal WiFi va a tener un Live pobre sin importar la arquitectura — esto se comunica como requisito (conexión cableada o WiFi 5GHz recomendado), no se puede resolver solo con software.
- **Compatibilidad de navegador**: Safari históricamente ha sido más restrictivo con `getUserMedia`/autoplay con audio — se prueba explícitamente antes de lanzar (Fase 7 de implementación) y se documentan limitaciones reales, sin prometer compatibilidad universal.

### 2.17 Plan de implementación por fases

1. **Fase 1 — Auditoría** ✅ (este documento).
2. **Fase 2 — Arquitectura** ✅ (este documento) — pendiente tu aprobación.
3. **Fase 3 — UX/UI**: mockups del módulo "Retroke Live" en DJ Panel (siguiendo Retroke Visual System 2.0: `RetrokeSection`, `RetrokeIcon`, tokens `rk-*`), del visor en World, de la card "EN VIVO AHORA", y de los 8 estados (offline/starting/active/reconnecting/degraded/audio-only/ended/error).
4. **Fase 4 — MVP**: cuenta en LiveKit Cloud, las 2 funciones serverless, tabla `live_sessions`, botón en DJ Panel (cámara + audio + preview + iniciar/finalizar), card + visor básico en World (video + audio + nombre + cantante actual).
5. **Fase 5 — Adaptación de red**: confirmar que simulcast/reconexión automática del SDK se comporta como se espera en pruebas reales; afinar los 8 estados visuales.
6. **Fase 6 — Integración social**: reacciones vía Broadcast, contador de espectadores vía Presence, link a perfil del cantante actual.
7. **Fase 7 — Testing**: WiFi bueno/malo, 4G, pérdida de paquetes, desconexión de cámara/mic en pleno Live, cambio de dispositivo, Chrome/Safari/Edge/Brave.
8. **Fase 8 — Escalabilidad**: pruebas de carga progresivas (5 → 20 → 50 → 100 espectadores por sala; luego multi-local).

### 2.18 Plan de rollback

Como Retroke Live es un módulo aislado (tabla nueva + funciones nuevas + componentes nuevos, sin modificar código existente), el rollback es simple en cualquier etapa:
- **Desactivar sin desplegar nada**: un flag (`hasFeature('retroke_live')` reutilizando el sistema de `plan_features` ya existente) puede ocultar el botón en DJ Panel y la card en World instantáneamente, sin tocar ninguna otra funcionalidad.
- **Revertir el deploy**: al no haber cambios en componentes existentes, un revert de los commits de Retroke Live no deja rastros en el resto de la app.
- **Datos**: `live_sessions` puede vaciarse o eliminarse sin afectar `sessions`/`queue_entries`/`performances` (no hay relación obligatoria en sentido inverso).
- **Proveedor externo**: si se decide cambiar de LiveKit a otro proveedor más adelante, el cambio queda contenido al módulo `src/components/live/` y a las 2 funciones serverless — el resto de Retroke no se entera.

---

## Resumen para decidir

- **Tecnología recomendada**: LiveKit Cloud (SFU administrado), con Cloudflare Realtime como alternativa de menor costo a reevaluar si el volumen crece mucho.
- **Nada de esto toca** cola, registro, Display, rankings, misiones, logros, desafíos, autenticación, RLS existente, Retroke Score, ni planes actuales — se suma como capa nueva.
- **"Entrar en vivo" pasa a ser "Ver en vivo"**, coherente con la decisión ya tomada de que Retroke World es espectador, no cola remota.
- **Sin grabación, sin VOD**, solo transmisión en vivo.
- **Próximo paso si apruebas**: Fase 3 (mockups UX/UI, dentro del sistema visual ya construido) antes de escribir una sola línea de código de implementación.
