# Retroke Live — Fase 2.5: Validación técnica y económica multi-bar

Antes de pasar a mockups (Fase 3), este documento responde a lo pedido: costos y límites de Supabase Pro + LiveKit Cloud en 1, 5, 10, 20, 50 y 100 bares simultáneos (DJ, cantante/TV, espectadores), y si la arquitectura actual de Supabase soporta multi-bar y World sin migración.

## 0. Metodología y una advertencia honesta

Hoy la base de datos tiene **0 filas en `bars`** y **2 en `workspaces`** — el producto no ha operado en multi-bar real todavía. No existe telemetría propia de "cuántos espectadores mira un bar en vivo" o "cuántas personas navegan World mientras un DJ está activo". Todo lo que sigue combina:

- Límites y precios **oficiales y verificados hoy** (Supabase `pricing.md`, LiveKit `pricing.md` y `docs/deploy/admin/quotas-and-limits`, consultados en vivo).
- Datos **medidos en tu código** (cuántos canales Realtime abre cada pantalla, qué tablas están indexadas, qué advisors reporta Supabase).
- **Supuestos de planificación explícitos** para todo lo que depende de comportamiento real de usuarios (espectadores por bar, minutos de sesión, noches activas al mes). Estos están marcados como *(supuesto)* y deberían recalibrarse con datos reales apenas Live tenga sus primeras semanas de uso.

Los supuestos base usados en el modelo:
- **15 espectadores concurrentes** en World/Escenario por bar con sesión activa *(supuesto)*
- **8 espectadores concurrentes** viendo Retroke Live por bar con sesión activa *(supuesto, más conservador que World porque es una función nueva)*
- **Bitrate de video promedio 600 kbps** por espectador de Live — promedio ponderado porque LiveKit sirve automáticamente capas de menor resolución a la mayoría de los móviles vía simulcast/dynacast *(supuesto)*
- **3 horas de sesión activa por noche, 20 noches activas al mes por bar** *(supuesto — un bar/DJ típico, no todos los días del mes)*

## 1. Dos ejes de carga que NO se mezclan

Esto es la aclaración más importante del análisis: **DJ Panel y TV/Display no consumen conexiones Realtime de Supabase**, y **los espectadores de Retroke Live no tocan Supabase en absoluto** (van por LiveKit). Son tres sistemas de carga independientes:

**Eje A — DJ Panel + TV/Display (por bar activo).** Auditoría de código confirmó: `DjPanel.jsx` usa 0 canales Realtime, solo 2 `setInterval` (cada 1.5s y cada 8s). Las pantallas `Display*` (Queue/Result/Called/Reactions/Countdown/Show) también usan 0 canales Realtime, solo polling HTTP vía PostgREST/Supavisor. Esto significa que escalar bares NO agota el límite de 500 conexiones Realtime de Supabase Pro — solo genera más queries cortas contra el pooler de conexiones.

**Eje B1 — Espectadores en World/Escenario (Supabase Realtime).** `World.jsx` abre 2 canales por usuario, `Escenario.jsx` 2, `Rankings.jsx` 1, `PublicProfile.jsx` 2, `Challenges.jsx` 0. Esto sí consume el pool de 500 conexiones Realtime concurrentes de Supabase Pro.

**Eje B2 — Espectadores en Retroke Live (LiveKit, sistema aparte).** Cada espectador de Live es un "participante WebRTC" contado contra los límites de LiveKit Cloud, totalmente desacoplado de Supabase. El contador de espectadores en pantalla debería venir de la propia API de LiveKit (participantes en la room), no de escrituras a Supabase — así lo propuso ya el documento de Fase 2, y este hallazgo lo confirma como la decisión correcta.

## 2. Límites oficiales verificados hoy

**Supabase Pro** ($25/mes base + compute):
| Recurso | Incluido | Overage |
|---|---|---|
| Conexiones Realtime concurrentes | 500 | $10 / 1,000 adicionales |
| Mensajes Realtime / mes | 5,000,000 | $2.50 / millón adicional |
| Conexiones directas a DB (compute Micro, incluido en el plan) | 60 | — |
| Conexiones pooler/Supavisor (compute Micro) | 200 | Sube con el tamaño de compute (Small=400, Medium=600, Large=800...) |
| Egress general | 250 GB | $0.09/GB |

**LiveKit Cloud** (Build=$0, Ship=$50/mes, Scale=$500/mes):
| Recurso | Build | Ship | Scale |
|---|---|---|---|
| Participantes concurrentes (límite duro) | 100 | 1,000 | 5,000 |
| Minutos WebRTC incluidos | 5,000 | 150,000 | 1,500,000 |
| Minuto WebRTC adicional | — (tope duro) | $0.0005 | $0.0004 |
| Transferencia de datos descendente incluida | 50 GB | 250 GB | 3,000 GB |
| GB adicional | — (tope duro) | $0.12 | $0.10 |

El dato clave: en el plan gratis y en Ship, **el límite de participantes concurrentes es un tope duro** — al llegarlo, nuevas conexiones simplemente fallan. No es un costo que se dispara, es un apagón del feature si no se sube de plan a tiempo.

## 3. Modelo de carga y costo por escala

| Bares activos | Espectadores World/Escenario | Conexiones Realtime | Costo overage Realtime | Espectadores Live + DJs | Participantes LiveKit concurrentes | Plan LiveKit necesario | GB descendente/mes (Live) | Costo LiveKit total/mes | Costo Supabase total/mes* |
|---|---|---|---|---|---|---|---|---|---|
| 1 | 15 | 30 | $0 | 9 | 9 | Build (gratis, pero ver nota GB) | ~126 GB | $0 (Build) → ~$0 si upgradeas a Ship por margen | $35 |
| 5 | 75 | 150 | $0 | 45 | 45 | Build cerca del límite (100) | ~630 GB | Ship recomendado: ~$96 | $35 |
| 10 | 150 | 300 | $0 | 90 | 90 | Build al límite — pasar a Ship | ~1,260 GB | Ship: ~$171 | $35 |
| 20 | 300 | 600 | ~$1 | 180 | 180 | Ship (bien dentro de 1,000) | ~2,520 GB | Ship: ~$322 | $36 |
| 50 | 750 | 1,500 | ~$10 | 450 | 450 | Ship (dentro de 1,000, sin margen para picos) | ~6,300 GB | Ship: ~$776 | $45 |
| 100 | 1,500 | 3,000 | ~$25 | 900 | 900 | Ship al límite (900/1,000, sin margen) → **Scale recomendado** | ~12,600 GB | Scale: ~$1,460 (más barato y más seguro que Ship en el límite: ~$1,532) | $60 |

*Costo Supabase = $25 base + $10 compute Micro + overage Realtime. No incluye overage de egress general (tráfico normal de la app, separado de LiveKit) ni el compute adicional que probablemente necesites por volumen de queries (ver sección 5).

**Lectura del modelo:** el costo de Supabase se mantiene trivial en todos los escenarios — el verdadero costo de escalar Retroke Live es 100% LiveKit, y dentro de LiveKit, la transferencia de datos (video descendente) domina por encima del costo por minuto de conexión. A 100 bares, LiveKit es ~25x el costo de Supabase.

## 4. Cuellos de botella y costos inesperados, en orden de riesgo real

**#1 — Transferencia de datos de video (LiveKit).** Es, por lejos, el componente que más puede sorprender en la factura. No escala con "cuántos bares" sino con "espectadores × horas × bitrate", y bitrate depende de qué tan bien funcione el simulcast en la práctica (móviles con mala señal piden capas más altas de retransmisión más seguido de lo esperado). Recomendación: monitorear GB/mes desde la primera semana real de uso y ajustar el bitrate objetivo antes de prometer una calidad de imagen fija.

**#2 — Tope duro de participantes concurrentes de LiveKit.** A diferencia de Supabase (que cobra overage), LiveKit corta conexiones nuevas al llegar al límite del plan. Con el crecimiento proyectado, Ship (1,000) alcanza su límite alrededor de 100 bares simultáneos activos — hay que monitorear esto activamente y subir a Scale *antes* de tocar el techo, no después.

**#3 — Mensajes Realtime de Supabase (no las conexiones).** El pool de conexiones nunca es el problema, pero los canales `world-social` (reacciones, follows, estados, logros) retransmiten un mensaje por cada escritura a cada socket abierto suscrito. Con miles de conexiones World abiertas y actividad social alta en horas pico, esto puede acercarse a los 5M de mensajes incluidos antes que las conexiones se acerquen a su límite de 500. Es barato de resolver con overage ($2.50/millón) pero vale la pena vigilarlo con métricas reales.

**#4 — Ineficiencia de RLS ya presente hoy (`auth_rls_initplan`).** Supabase Advisors reporta **34 casos** de este patrón en tablas calientes para multi-bar: `sessions`, `queue_entries`, `bars`, `workspaces`, `bar_members`, `workspace_members`, `profiles`, `participants`, `direct_challenges`, `follows`, `statuses`, `status_reactions`. El problema: las políticas RLS llaman `auth.uid()` sin envolverlo en `(select auth.uid())`, lo que hace que Postgres lo re-evalúe fila por fila en vez de una sola vez por query. Invisible hoy con pocas filas; a 50-100 bares con volumen real, encarece cada query protegida por RLS. Es un fix de SQL puro, sin cambio de esquema, sin downtime — recomendado antes de escalar en serio.

**#5 — Foreign keys sin índice (`unindexed_foreign_keys`).** **17 casos**, incluyendo `sessions`, `queue_entries`, `performances` — tablas centrales para World y multi-bar. Hoy con pocas filas no se nota; a medida que `sessions`/`queue_entries` acumulen historial de meses con 100 bares activos, los JOINs y validaciones de FK en cada insert se vuelven más lentos. Fix aditivo (agregar índices), sin downtime, sin migración destructiva.

**#6 — Políticas RLS permisivas duplicadas (`multiple_permissive_policies`).** **145 casos** — varias tablas (`bars`, `profiles`, `licenses`, `plans`, `bar_members`, etc.) tienen más de una política permisiva para la misma combinación de rol/acción, y Postgres evalúa todas y las combina con OR. Costo secundario, menor prioridad que #4 y #5, pero consolidable.

**#7 — Tormenta de reconexión.** Si el wifi de un bar cae y vuelve, todos los espectadores de ese Live (Eje B2, LiveKit) y todos los navegadores de World de ese momento (Eje B1, Supabase) intentan reconectar a la vez. LiveKit maneja esto de forma nativa (reconexión con backoff en el SDK); en Supabase Realtime, el cliente ya usa reconexión automática de la librería, pero conviene confirmar que el frontend no dispare múltiples suscripciones duplicadas en el reintento (revisar en Fase 3/implementación, no es un problema de capacidad sino de código cliente).

## 5. ¿La arquitectura de Supabase está lista para multi-bar y World sin migración?

**Sí, estructuralmente.** Confirmado por auditoría directa del esquema y RLS:

- `bar_id`/`workspace_id` ya son columnas de primera clase en `sessions`, `performances`, y se propagan a `queue_entries` vía `session_id`. El modelo de datos ya fue diseñado multi-tenant desde el principio, no como un caso especial de un solo bar.
- Las políticas RLS de escritura (`staff update`, `workspace staff update sessions`, `staff update queue_entries`, etc.) ya están scoped por membership (`bar_members`, `has_workspace_access(workspace_id, 'DJ')`) — no hardcoded a un bar específico. Un DJ o bar nuevo funciona con las mismas políticas sin tocar código ni RLS.
- La restricción "una sesión activa por bar" (`one_active_session_per_bar`, índice único parcial sobre `bar_id`) ya es multi-bar-safe por diseño — permite N bares con una sesión activa cada uno, no una sola sesión activa global.
- Los índices ya existentes en `sessions` (`idx_sessions_bar_status`, `idx_sessions_workspace_status`, compuestos por `bar_id`/`workspace_id` + `status`) son exactamente el patrón de acceso que World, Escenario y DjPanel necesitan ("dame la sesión activa de este bar") — ya están cubiertos.

**No se requiere ninguna migración de esquema** para pasar de 2 workspaces/0 bares hoy a 100 bares. Las 3 optimizaciones de la sección 4 (#4, #5, #6) son cambios aditivos vía `apply_migration` en el sentido técnico de Supabase, pero no son "una migración" en el sentido que preocupa — no reestructuran datos, no tienen downtime, no arriesgan romper nada existente. Son ajustes de performance que conviene aplicar antes de escalar, no una condición bloqueante para empezar.

## 6. Recomendación antes de Fase 3

1. Aplicar los 3 fixes de performance (RLS initplan, índices FK faltantes, consolidar políticas duplicadas) — bajo riesgo, alto beneficio, no toca ninguna función existente.
2. Diseñar `live_sessions` (ya propuesto en Fase 2) siguiendo el mismo patrón multi-bar ya probado: `bar_id`/`workspace_id` + RLS scoped por membership, igual que `sessions`.
3. Contar espectadores de Live vía la API de LiveKit (participantes en la room), nunca escribiendo a Supabase por cada join/leave — evita convertir Eje B2 en tráfico de Eje B1.
4. Empezar con LiveKit **Ship** ($50/mes) desde el lanzamiento de Retroke Live, no Build — el límite de 100 participantes concurrentes de Build se alcanza con muy pocos bares activos a la vez, y el costo de transferencia de datos ya empuja a un plan pago desde el primer bar con uso real.
5. Instrumentar y monitorear desde el día uno: espectadores concurrentes reales por bar, GB de video servidos, mensajes Realtime/mes — para reemplazar los supuestos de este documento con datos reales antes de comprometerse a proyecciones de costo a 50-100 bares.

Con esto, la arquitectura y el modelo de costos quedan validados para pasar a Fase 3 (mockups), sujeto a tu aprobación.
