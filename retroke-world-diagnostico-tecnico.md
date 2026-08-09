# RETROKE WORLD — Diagnóstico técnico (Fase de análisis)

Auditoría del proyecto real (código en `/karaoke-app-nuevo` + base de datos Supabase `koaayhnqgcyemnzkzffq`), sin tocar código. Todo lo descrito abajo se verificó leyendo los archivos y consultando la base directamente — nada es supuesto.

Conclusión corta antes de entrar al detalle: tienes razón en el diagnóstico del prompt maestro. La infraestructura de gamificación (XP, niveles, logros, desafíos, rankings) **ya existe y funciona**, pero vive repartida en páginas sueltas con diseño mínimo (fondo oscuro + lista, sin bento, sin Tailwind, sin identidad retro-neón consistente con el resto de la app). La capa social completa (seguir, estados, Instagram, "quién va", actividad, mapa) **no existe todavía** — es 100% construcción nueva. Y hay dos hallazgos que no estaban en tu radar y que conviene resolver antes o durante la Fase 1.

---

## 1. Arquitectura actual

- **Stack real:** React 18 + Vite (SPA cliente, sin SSR) + react-router-dom v6 + Tailwind + Supabase (`@supabase/supabase-js`) + Mercado Pago. No es Next.js — importante porque el prompt maestro asume "React/Next.js" y el modo actual no tiene renderizado en servidor. Esto pega directo en la Sección 38 (World como herramienta de marketing/SEO): hoy cualquier página pública nueva se sirve vacía y se llena vía JS + fetch a Supabase, así que buscadores y previews de redes sociales verán poco contenido salvo que se agreguen meta tags dinámicos o algún tipo de prerenderizado.
- **Dos sistemas de identidad en paralelo**, ambos sobre `auth.users` de Supabase:
  - `profiles` — dueños de bar, DJs, staff, admins de plataforma (login con email/password u OTP vía `AuthContext.jsx`).
  - `participants` — cantantes/karaoke. Identidad liviana por `device_id`, opcionalmente "reclamada" con Google (`user_id` se llena solo si el cantante decide conectar su cuenta en `/perfil`).
  - Ambos comparten la misma tabla `auth.users`: una persona podría ser dueño de un bar y también cantante bajo la misma cuenta. Esto importa mucho para "Seguir usuarios" (Sección 16): **solo los `participants` con `user_id` no nulo tienen una identidad estable entre dispositivos.** Un participante puramente anónimo (solo `device_id`) no se puede seguir de forma confiable — si cambia de celular, es "otra persona" para el sistema.
- **Tres contexts globales:** `AuthContext` (sesión de staff), `KaraokeSessionContext` (el más grande — bar/workspace activo, cola, sesión, plan/features, XP/logros/desafíos al cerrar una presentación), `ThemeContext` (claro/oscuro, hoy poco usado tras quitar el `ThemeToggle` del formulario), `VideoPlayerContext` (reproducción de video en Display).
- **Multi-tenant real:** `workspaces` (tipo BAR/DJ/HOME, plan FREE/PRO) → `bars` (uno o más locales por workspace) → `sessions` (una noche activa) → `queue_entries` → `performances`. Los tres modos (Bar, DJ, Home) comparten el mismo código de flujo de cola/presentación, diferenciados por `workspaceType` y el gate de `plan_features`.
- **Gamificación ya integrada al flujo real:** cuando `KaraokeSessionContext.recordPerformance()` cierra una presentación, en la misma función ya calcula nota final, XP, sube de nivel, evalúa logros nuevos (`evaluateNewAchievements`) y actualiza progreso de desafíos (`evaluateChallengeUpdate`). Es decir, el "loop" que pide la Sección 31 (Presentación → XP → Nivel → Logro → Ranking → Desafío) **ya está cableado de punta a punta a nivel de datos** — lo que falta es la capa visual/social alrededor, no la mecánica.

## 2. Componentes reutilizables (ya existen, no crear de nuevo)

| Componente/lib | Qué hace | Relación con lo pedido |
|---|---|---|
| `ShareResultCard.jsx` + `shareCard.js` | Tarjeta 9:16 capturable como imagen (html2canvas), ya resuelta para IG/TikTok/WhatsApp (frame + auto-alto) | Es el `ShareResultCard` que pide el punto 49 — ya existe y está pulido, reusar tal cual |
| `RetroEqualizer.jsx`, `FloatingDecor.jsx`, `FallingParty.jsx` | Decoración retro-neón animada (usada en `SessionLeaderboard`) | Base visual reusable para el "vivo" de World |
| `gamification.js` | XP, niveles (8 niveles con nombre), logros, desafíos, racha, nota final — funciones puras | Backend de "Tu experiencia", "Logros", "Desafíos", "Misiones" |
| `participant.js` | Identidad de participante, login Google, foto de perfil | Backend de "Tu experiencia" y futura identidad para "Seguir" |
| `analytics.js` | `trackEvent()` genérico a `analytics_events` | Podría alimentar "Actividad Retroke" sin tabla nueva si se cura bien el evento |
| `Rankings.jsx` | Top global por XP + ranking por sala/venue | Es el embrión de "RANKING RETROKE" — hoy sin filtro de ciudad ni tendencia, sin bento |
| `Challenges.jsx` | Lista de desafíos activos + progreso | Embrión de "DESAFÍOS"/"MISIONES" — hoy una sola lista, sin distinguir recibidos/enviados/destacados (ese concepto de desafío 1-a-1 entre personas no existe, ver punto 10) |
| `Profile.jsx` | Nombre, avatar, foto, XP/nivel, racha, logros, historial, conectar Google | Es el embrión real de "TU EXPERIENCIA" — falta posición en ranking, victorias, ciudad |
| `SessionHub.jsx` | Selector de salas activas (pantalla de espera de `/`) | No confundir con "Escenarios" — es interno, para elegir sala al entrar sin parámetros |
| `WorkspaceSelector.jsx`, `QRCode.jsx`, `FullscreenButton.jsx`, `YouTubePlayer.jsx`, `AudioUnlockGate.jsx` | Utilidades de operación de sala | Sin relación directa con World, mantener igual |

Ningún componente de `components/WorldHero`, `WorldLive`, `RankingCard`, `ChallengeCard`, `MissionCard`, `AchievementCard`, `ScenarioCard`, `ActivityFeed`, `StatusCard`, `FollowButton`, `InstagramButton`, `GoingStatus`, `EventCard`, `WorldMap`, etc. (lista del punto 49) existe todavía — son build nuevo, ninguno duplica algo actual.

## 3. Rutas actuales

```
/                 Display.jsx        Pantalla del bar/TV (cola, reacciones, calificación) o SessionHub si no hay parámetros
/registro         RegisterForm.jsx   Inscripción del cantante (con header ya rediseñado esta sesión)
/reaccionar       ReactForm.jsx      Reacciones del público
/calificar        RateForm.jsx       Calificación 5-10 del público
/dj               DjPanel.jsx        Panel de control del DJ/anfitrión
/admin            AdminPanel.jsx     Panel admin global de la plataforma
/precios          PricingPage.jsx    Precios públicos
/comenzar         SignupPage.jsx     Alta de cuenta/workspace + pago
/bienvenido       WelcomePage.jsx    Retorno de Mercado Pago
/inicio           LandingPage.jsx    Portal de ventas actual
/r/:performanceId SharePerformance.jsx  Tarjeta pública de un resultado (recién arreglada)
/ranking          Rankings.jsx       Ranking global + por sala
/desafios         Challenges.jsx     Desafíos activos
/perfil           Profile.jsx        Perfil propio
```

**Hallazgo — código huérfano fuera de rutas:** existen `StorePage.jsx`, `StoreProductDetail.jsx` y `StoreThankYou.jsx` (una tienda con carrito, `/tienda`, `/tienda/producto`), más `api/create-store-preference.js` y `api/import-mercadolibre.js` en el backend, **pero no están registrados en `App.jsx`** — no hay ruta que los sirva, son inalcanzables. Peor aún: consultan tablas `store_products` y `store_settings` que **no existen en la base de datos actual** (confirmado contra `information_schema.tables`). Es una funcionalidad de e-commerce empezada y abandonada, o conectada a otro proyecto Supabase en algún momento. No es parte de Retroke World, pero lo marco como limpieza pendiente porque ensucia el `src/pages` y puede confundir en el futuro.

## 4. Tablas actuales (Supabase, esquema `public`, 24 tablas reales)

**Identidad y comunidad:**
`participants` (device_id, user_id, display_name, avatar, photo_url, username, claimed_at), `participant_stats` (xp, level, level_name, total_performances, best_score, current_streak, best_streak), `profiles` (staff/admin)

**Gamificación:**
`achievements` (catálogo, 8 filas), `participant_achievements` (desbloqueados), `challenges` (catálogo, 4 filas activas), `participant_challenge_progress` (progreso por periodo)

**Karaoke en vivo:**
`sessions`, `queue_entries`, `performances`, `vocal_results`, `ratings`, `reactions`

**Multi-tenant / negocio:**
`workspaces`, `bars`, `bar_members`, `workspace_members`, `plans`, `plan_features`, `subscriptions`, `licenses`, `payment_transactions`, `billing_events`

**Telemetría:**
`analytics_events`

**No existen todavía (0% construidas):** tablas de seguidores/follows, estados/posts, reacciones a estados, Instagram/redes vinculadas, "quién va" por escenario, notificaciones, eventos/torneos, tendencias/canciones más cantadas (hoy no hay tabla de catálogo de canciones — `song`/`artist_name` son texto libre en `performances`/`queue_entries`, no normalizado), ni bloqueos/reportes de moderación.

## 5. Relaciones existentes (las que importan para World)

```
auth.users ─┬─< profiles (staff)
            └─< participants (user_id nullable) ─┬─< participant_stats (1:1)
                                                   ├─< participant_achievements >─ achievements
                                                   ├─< participant_challenge_progress >─ challenges
                                                   ├─< performances
                                                   └─< queue_entries

workspaces ─┬─< bars ─< sessions ─┬─< queue_entries ─< performances
            ├─< workspace_members       ├─< ratings
            ├─< subscriptions ─< payment_transactions    └─< reactions
            └─< licenses

performances.bar_id / performances.workspace_id → permite reconstruir "en qué ciudad/local canté" (bars.city existe y hoy no se usa en ningún ranking ni filtro)
```

`bars.city` es la única columna de ciudad que existe hoy en todo el esquema. Es la base natural para "Mi ciudad" (Sección 11), "Puerto Montt / Chile" (Sección 10, 12) y el mapa (Sección 32) — pero solo cubre presentaciones en modo Bar/DJ con local físico. En modo Home no hay ciudad asociada al workspace todavía (columna inexistente en `workspaces`).

## 6. Funciones existentes reutilizables

- `computeLevel(xp)`, `computeXpForPerformance(nota)`, `computeNotaFinal()`, `evaluateNewAchievements()`, `evaluateChallengeUpdate()`, `isChallengeComplete()`, `getPeriodKey()` — todo en `gamification.js`, puras, sin tocar red. Sirven tal cual para Misiones/Logros/Desafíos evolucionados.
- `getOrCreateParticipant()`, `touchParticipantProfile()`, `updateParticipantPhoto()`, `signInWithGoogle()` — en `participant.js`. Base de identidad para Comunidad.
- `loadSessionLeaderboard()`, `hasFeature()`, `spaceParam` — en `KaraokeSessionContext`. `hasFeature()` en particular es el mecanismo de gating por plan que ya usa toda la app (recién reforzado hoy con sincronización en tiempo real) — cualquier feature de World que sea PRO-only debe pasar por acá, no crear un gate paralelo.
- `buildShareUrl()`, `buildShareText()`, `shareResult()`, `shareCardAsImage()`, `downloadCardAsImage()` — en `shareCard.js`. Es la base de "Viralidad" (Sección 39): compartir Score/logro/desafío como imagen ya tiene la infraestructura, solo faltan las tarjetas nuevas (ranking, logro, desafío) usando el mismo patrón que `ShareResultCard`.
- Funciones SQL `is_platform_admin()`, `is_own_workspace()`, `has_workspace_access()` — patrón ya establecido para RLS. Cualquier tabla nueva de World (follows, estados) debería seguir el mismo patrón en vez de inventar uno nuevo.

## 7. Funciones/UI potencialmente duplicadas si no se coordina bien

- **Rankings:** hoy conviven `Rankings.jsx` (top global + por sala) y la sección de "estadísticas de la noche" dentro de `SessionLeaderboard.jsx` (top 3 de una sesión específica, con podio animado). No son lo mismo (uno es histórico/acumulado, otro es de una noche puntual) pero visualmente hay que dejar claro que uno alimenta al otro, no crear un tercer sistema de ranking para World.
- **Desafíos:** `Challenges.jsx` actual es "desafíos del sistema" (metas contra ti mismo: cantar 2 veces, superar nota 7, etc.). El prompt maestro pide además "desafíos entre personas" (Matías te desafía a superar 94) — es un concepto nuevo que **no debe mezclarse** en la misma tabla `challenges` (que es un catálogo global fijo), sino una tabla nueva de desafíos 1-a-1 o grupales.
- **"Compartir":** ya hay tres puntos de compartir independientes (`ShareResultButton` en RegisterForm, botón de descarga/compartir en `SharePerformance.jsx`, y el de la tarjeta en vivo dentro de `YourTurnScreen`). Al construir viralidad para ranking/logro/desafío, conviene extraer un solo componente `ShareButton` reutilizable en vez de un cuarto botón con su propia lógica.

## 8. Qué debe rediseñarse (visual, no la mecánica de datos)

- `Rankings.jsx` y `Challenges.jsx`: hoy son página suelta, fondo oscuro plano, lista vertical simple, tipografía Space Grotesk cargada aparte, sin Tailwind, sin bento, sin filtros de ciudad/semana/mes. Es exactamente el "interfaces demasiado básicas" que menciona el prompt. Conviene reconstruirlas como módulos bento dentro de World (reusando los datos y queries actuales, que sí sirven).
- `Profile.jsx`: correcto en datos (XP, nivel, racha, logros, historial) pero visualmente es una página larga de scroll único, no un módulo "TU EXPERIENCIA" protagonista tipo tarjeta.
- Navegación: hoy cada página vive aislada con su propio `<Link to="/inicio">← Volver a Retroke</Link>` — no hay navegación contextual entre Ranking/Desafíos/Perfil, cada una es una isla. Esto es el "problema de descubrimiento" que el prompt identifica correctamente como el problema real.

## 9. Qué debe mantenerse intacto

- Todo el flujo de karaoke en vivo (Display, RegisterForm, DjPanel, cola, reacciones, calificación, vocal analysis) — es el corazón operativo, no tiene relación de riesgo con World y no debe tocarse al construirlo.
- El modelo de plan/features (`plan_features` + `hasFeature()`) — reusar, no reemplazar.
- El sistema de identidad de participante por dispositivo — es intencional (sin fricción para inscribirse) y debe seguir funcionando igual; World se construye "encima", con degradación elegante para quien no tiene cuenta conectada.
- `ShareResultCard` y toda la lógica de captura de imagen (html2canvas) — ya está muy pulida tras varias rondas de fixes esta sesión, no reinventar.
- Las rutas actuales (`/ranking`, `/desafios`, `/perfil`, etc.) — mantenerlas como "vistas profundas" tal como pide el punto 50, World las envuelve pero no las reemplaza.

## 10. Nuevas estructuras necesarias

**Tablas nuevas (siguiendo el patrón RLS ya establecido):**
- `follows` (follower_id, following_id, created_at) — sobre `participants.id`, con constraint de que ambos `user_id` no sean nulos (solo identidades reclamadas son seguibles) o al menos advertir en UI que anónimos no aparecen.
- `statuses` / "estados retroke" (participant_id, text, category, bar_id nullable, workspace_id nullable, event_id nullable, created_at) + `status_reactions` (status_id, participant_id, emoji) — reacciones limitadas al set predefinido, sin comentarios, tal como pide el punto 20.
- `going` / "quién va" (participant_id, bar_id o workspace_id, status: VOY/TAL_VEZ, event_date) — separado de `statuses` para poder listar avatares fácilmente.
- `direct_challenges` (from_participant_id, to_participant_id, song opcional, target_score, status: pendiente/aceptado/completado) — el desafío 1-a-1, distinto de la tabla `challenges` actual (que queda como "misiones del sistema").
- `blocks` / `reports` — moderación mínima (punto 55).
- Columna `instagram_handle` + `show_instagram` (boolean) en `participants` — opcional, apagado por defecto (punto 21).
- Columna `city` en `workspaces` (hoy solo `bars.city` existe) para que Home también tenga ciudad.
- Tabla de catálogo de canciones normalizado (o vista agregada sobre `performances.song`/`artist_name`) si se quiere "Lo más cantado" con conteo real y sin depender de que el texto libre coincida exactamente — si no, canciones escritas distinto ("Bohemian Rhapsody" vs "bohemian rhapsody") se cuentan separado. Mínimo: normalizar a minúsculas/trim antes de agrupar.

**Funciones/RPC nuevas recomendadas (no solo tablas):**
- Mover escritura de `participant_stats` (XP/nivel/racha) y `participant_challenge_progress` a una función `SECURITY DEFINER` server-side en vez de `update` directo desde el cliente (ver Riesgos, punto 11) — esto se vuelve más importante en cuanto haya rankings públicos con peso competitivo real.

## 11. Riesgos

1. **RLS demasiado abierta para lo que World implica.** Verificado en Supabase: `participant_stats` tiene política `public update ... USING (true) WITH CHECK (true)` — cualquiera con la clave `anon` (pública, va en el bundle del frontend) puede hacer un `PATCH` directo a la API REST y poner su propio XP/nivel/racha en cualquier valor, sin pasar por la app. Lo mismo con `participant_challenge_progress`. Hoy es un riesgo bajo (es solo un karaoke divertido), pero en cuanto exista un "Top Retroke Chile" público, compartible, con presión social real, se vuelve trivialmente falseable. Recomiendo resolverlo *antes o junto con* la Fase 3 (Rankings), no después.
2. **Identidad anónima vs. redes sociales.** Seguir personas, mostrar Instagram, "quién va" — todo esto requiere identidad estable. Un participante sin Google conectado (device-only) hoy es mayoría probablemente. Si no se comunica bien la diferencia, la sección Comunidad se va a sentir vacía para la mayoría de usuarios nuevos hasta que exista suficiente adopción de login.
3. **SPA sin SSR para contenido público/viral.** Compartir un ranking o un desafío como link (no como imagen) va a tener preview pobre en WhatsApp/Instagram (sin meta tags dinámicos por ruta) a menos que se agregue algo de renderizado en servidor o al menos Open Graph tags inyectados vía Vercel Edge para esas rutas públicas específicas.
4. **`store_products`/`store_settings` no existen** pero el código que los referencia sigue en el repo — si algo llega a importar esas páginas por error (o un futuro refactor las conecta sin revisar), la app crashea. Vale la pena decidir: ¿se retoma la tienda más adelante, o se elimina el código muerto?
5. **Volumen de datos bajo para "tendencias" reales.** `performances` tiene 10 filas, `participant_stats` 4. El punto 46 del prompt ya lo anticipa correctamente ("no inventar datos, mostrar estado vacío atractivo") — importante ejecutarlo desde el día 1 de Fase 3/4, porque con este volumen casi todo va a mostrar el estado vacío al inicio.
6. **Advisors de seguridad de Supabase** (no bloqueantes, pero quedan registrados): funciones `is_platform_admin`, `is_own_workspace`, `has_workspace_access` sin `search_path` fijo, y ejecutables por el rol `anon` vía RPC directo — riesgo bajo hoy (son funciones de solo lectura de permisos), pero conviene endurecer si se van a agregar más funciones `SECURITY DEFINER` para World. También: protección de contraseñas filtradas (HaveIBeenPwned) está desactivada en Auth.

## 12. Orden de implementación recomendado

El prompt maestro ya trae 20 fases bien pensadas; las suscribo con un solo ajuste de orden: mover el endurecimiento de RLS de escritura (XP/desafíos) a la Fase 1, junto con el core, en vez de dejarlo para el final — porque las Fases 3 (Rankings) y 5 (Desafíos) son justamente las que explotan ese hueco si se construyen primero.

1. **Fase 0 (nueva, previa):** endurecer escritura de `participant_stats` y `participant_challenge_progress` (RPC server-side en vez de update abierto). Medio día de trabajo, evita reconstruir confianza después.
2. **Fase 1 — Retroke World Core:** shell de navegación (`WorldNavigation`, `WorldSection`, `WorldSkeleton`, `WorldEmptyState`), ruta `/world` (o reemplazo progresivo de `/inicio`), hero + Retroke Live con datos reales de `sessions`/`performances` actuales.
3. **Fase 2 — Tu Experiencia:** reconstruir visualmente sobre los datos que ya trae `Profile.jsx`, agregar posición en ranking (nuevo query, no nueva tabla).
4. **Fase 3 — Rankings:** evolucionar `Rankings.jsx` con filtro de ciudad (usando `bars.city`), bento, tendencia (▲/▼ requiere guardar snapshot histórico de posición — tabla nueva chica o cálculo semanal).
5. **Fase 4 — Tendencias / Lo más cantado:** requiere decidir normalización de texto de canciones primero (ver punto 10).
6. **Fase 5 — Desafíos:** separar "misiones del sistema" (ya existe) de "desafíos 1 a 1" (tabla nueva).
7. **Fase 6 — Misiones y Logros:** mayormente rediseño visual, datos ya existen.
8. **Fase 7 — Escenarios:** página por bar con actividad, usando datos de `bars`/`sessions`/`performances` ya existentes.
9. **Fases 8-13 — Comunidad, Seguir, Estados, Instagram, Quién va, Actividad:** todo esto depende de las tablas nuevas del punto 10 y de una discusión de producto pendiente: ¿el follow/estados requiere login obligatorio con Google, o se degrada para anónimos? Recomiendo definir esto explícitamente antes de modelar las tablas finales.
10. **Fases 14-20:** viralidad, realtime, responsive, performance, seguridad, testing, optimización — tal como las planteaste, al final.

---

**No se modificó ningún archivo de código en esta fase.** Cuando apruebes el enfoque (o pidas ajustar algo del diagnóstico), empezamos por la Fase 0 + Fase 1.
