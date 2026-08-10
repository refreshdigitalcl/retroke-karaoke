# Retroke Visual System 2.0 — Fase 1: Auditoría visual

*Solo diagnóstico. Ningún archivo de código fue modificado para producir este documento.*

## 1. Pantallas actuales

El proyecto tiene 25 páginas en `src/pages/`, que se agrupan en cuatro familias con tratamientos visuales distintos entre sí:

**Flujo de karaoke en vivo** (no se toca en esta fase): `Display.jsx` y su familia `Display*` (`DisplayQueue`, `DisplayShow`, `DisplayReactions`, `DisplayRating`, `DisplayCountdown`, `DisplayCalled`, `DisplayResult`), `SessionHub.jsx`, `RegisterForm.jsx`, `ReactForm.jsx`, `RateForm.jsx`, `DjPanel.jsx`, `SessionLeaderboard.jsx`.

**Marketing y cuenta**: `LandingPage.jsx`, `PricingPage.jsx`, `SignupPage.jsx`, `WelcomePage.jsx`, `AdminPanel.jsx`.

**Retroke World** (el foco de esta fase): `World.jsx`, `Rankings.jsx`, `Challenges.jsx`, `Escenario.jsx`, `Profile.jsx`, `PublicProfile.jsx`, `SharePerformance.jsx`.

**Compartir**: `ShareResultCard.jsx` (componente, no página) y la familia `components/share/*`.

## 2. Pantallas mejor diseñadas (referencia oficial)

Tres piezas destacan claramente por encima del resto en sofisticación visual, y deberían ser la referencia oficial del sistema nuevo:

**`SessionHub.jsx`** (la pantalla de "elige tu sala" en `/`). Usa `FloatingDecor` y `RetroEqualizer` — dos componentes decorativos ya existentes con iluminación de escenario animada (`StageLights`, con parpadeo tipo reflector), humo ambiental (`StageSmoke`, blobs con blur y deriva), un micrófono vintage y un vinilo dibujados a mano en SVG, y barras de ecualizador con movimiento aleatorio real. El título usa texto con gradiente animado (`background-position` en loop) en vez de color plano. Las tarjetas de sala tienen borde y glow de color distinto según el tipo de sala (bar/DJ/home), con `box-shadow` que replica el color del acento, entrada escalonada (`animationDelay` por índice) y hover con `scale` + brillo. El botón de descarga de la APK flota con una animación 3D (`rotateY`/`rotateX` en loop) y su propio glow de dos colores. Nada de esto es genérico — es exactamente el lenguaje "escenario + neón + música" que pide el prompt maestro, y ya existe en producción.

**`DisplayResult.jsx`** (la pantalla de "así saliste" después de cantar). La nota final tiene shimmer de gradiente animado, el panel entero tiene un glow pulsante que cambia de color, hay un efecto de "glitch" en el título y un "burst" de partículas. Es el mejor ejemplo que existe hoy de tratamiento premium para un número importante — justo lo que el prompt maestro pide para Score/XP/Ranking en las pantallas de World, pero que hoy no se replica ahí.

**`ShareResultCard.jsx`** (la tarjeta que se comparte). Mismo lenguaje: textura de scanlines superpuesta, gradientes de fondo en capas, `text-shadow` con glow en el número de la nota. Tiene además la disciplina de comentarios más cuidada del proyecto (documenta explícitamente qué NO hacer con html2canvas para no romper la captura).

Estas tres piezas comparten una firma reconocible: glow de color con `box-shadow`/`text-shadow` (no solo bordes planos), gradientes animados en vez de estáticos, texturas sutiles (scanlines, humo), y motion con propósito narrativo (el resultado "brilla", la sala "llama la atención").

## 3. Pantallas más débiles

`World.jsx`, `Rankings.jsx`, `Challenges.jsx`, `Escenario.jsx`, `Profile.jsx` y `PublicProfile.jsx` — exactamente las que el prompt maestro señala — comparten un mismo problema de raíz: **las seis usan el mismo componente `WorldSection`**, envuelto en el mismo `WORLD_STYLES`. Cada módulo (esté mostrando el ranking, una racha, una tendencia o el feed de actividad) es visualmente idéntico a los demás: mismo fondo `rgba(255,255,255,0.045)`, mismo borde de 1px blanco translúcido, mismo radio de 22px. La única variación entre secciones es cuánto espacio ocupan en el grid (`sm`/`md`/`lg`), no cómo se ven. Es, literalmente, el problema que describe el punto 14 del prompt: toda la aplicación convertida en `[ CARD ] [ CARD ] [ CARD ]`.

Ninguna de estas seis pantallas usa `FloatingDecor`, `RetroEqualizer`, glow animado, ni el tratamiento de número especial que sí existe en `DisplayResult`. El XP se muestra como `<div className="world-rank-xp">793 XP</div>` — texto amarillo en negrita, sin más. El Top 3 del ranking usa emojis de medalla (🥇🥈🥉) sobre la misma fila plana que el resto, sin composición de podio. Es, en la práctica, un dashboard SaaS con paleta oscura — coincide con exactamente el diagnóstico que hiciste tú mismo.

## 4. Componentes existentes

**Decorativos/ambientales (alto valor, subutilizados)**: `FloatingDecor.jsx`, `RetroEqualizer.jsx`.

**Sistema World (el que hay que evolucionar)**: `WorldSection.jsx`, `WorldHero.jsx`, `WorldLive.jsx`, `WorldEmptyState.jsx`, `WorldSkeleton.jsx`, más el CSS compartido en `worldStyles.js`.

**Compartir (buen nivel, namespace propio)**: `ShareResultCard.jsx`, `ShareCardFrame.jsx`, `ShareRankCard.jsx`, `ShareAchievementCard.jsx`, `ShareChallengeCard.jsx`, `ShareButton.jsx`, `ShareModal.jsx`.

**Utilitarios**: `AudioUnlockGate.jsx`, `ThemeToggle.jsx`, `WorkspaceSelector.jsx`, `YouTubePlayer.jsx`, `QRCode.jsx`, `FullscreenButton.jsx`, `SimilarTrackSearch.jsx`.

No existe hoy ningún componente `Retroke*` (Hero, Panel, Metric, Score, Avatar, Button, Tabs, etc.) como pide el punto 49 — cada pantalla de World define su propio CSS inline por archivo (`.rk-tabs` en Rankings, `.es-stat-grid` en Escenario, etc.) además de compartir `WORLD_STYLES`, lo cual ya es una fuente de inconsistencia menor (variaciones de tamaño de fuente entre 10.5px, 11px, 11.5px, 12px, 13px para roles de texto muy similares, según en qué archivo se definieron).

## 5. Sistema visual actual

Conviven, sin cruzarse, **tres sistemas visuales distintos**:

Un sistema "admin" en `tailwind.config.js` + `src/styles/index.css`: paleta `retro.bg/card/magenta/purple/green/yellow`, tipografía Poppins, soporte claro/oscuro vía `ThemeContext`. Es el sistema base de Tailwind, pero casi ninguna pantalla nueva lo usa de verdad — quedó pensado para un dashboard administrativo clásico.

Un sistema "World" inline (`WORLD_STYLES` en JS, no Tailwind): fondo radial oscuro fijo, tipografía Space Grotesk para títulos y `system-ui` para el cuerpo, tarjetas planas translúcidas. Es el que generó el problema de genericidad.

Un sistema "premium" bespoke, presente solo en `SessionHub`, `DisplayResult` y `ShareResultCard`: mismos 4 colores de acento que los otros dos sistemas, pero con glow, scanlines, gradientes animados y motion real.

El dato importante: **la paleta de color ya es una sola** (magenta `#E91E8C`, morado `#8B5CF6`, verde `#7ED957`, amarillo `#F4D03F`, fondo casi negro) en los tres sistemas. El problema no es de colores — es de *ejecución*: el sistema premium usa esos colores con glow/gradiente/movimiento, y el sistema World los usa planos.

## 6. Logos encontrados

`public/landing/retroke-logo-oficial-neon.png` (1600×724 tras la optimización de Fase 20) — el logo neon completo, usado en `SessionHub.jsx` y como logo de las tarjetas compartibles (`ShareResultCard`, `ShareCardFrame`). `public/landing/retroke-logo.png` (900×407) — versión plana, alternativa. `public/landing/retroke-mic-icon.png` — ícono de micrófono usado en el botón flotante de descarga de la APK.

Hoy **World.jsx y el resto de las pantallas de comunidad no muestran el logo en ningún lado** — el hero de World es solo texto (`WorldHero.jsx`). Coincide con el punto 8 del prompt (usar el logo con criterio, no en todas partes), pero vale la pena evaluar si el hero de World debería llevarlo, dado que hoy es la única familia de pantallas sin ninguna presencia de marca visual.

## 7. Assets encontrados

Fotos de fondo por tipo de local: `bg-bar.jpg`, `bg-dj.jpg`, `bg-home.jpg`, `bg-publico.jpg` (probablemente usadas en Landing/Pricing). Imágenes de marketing: `premium-dj.jpg`, `premium-friends.jpg`, `iphone-registro.jpg` (mockup de producto). 12 stickers animados (`sticker-01.gif` a `sticker-12.gif`) para reacciones. Ninguno de estos assets se usa hoy en las pantallas de World.

## 8. Tipografías

Dos familias en uso: **Poppins** (base de Tailwind/`index.css`, prácticamente sin uso real fuera del sistema admin) y **Space Grotesk** (cargada vía `lib/fonts.js` desde Fase 17, usada en headers de World y en `SessionHub`). No existe hoy una distinción de roles tipográficos (Display/Heading/Body/Label/Numeric) como pide el punto 11 — los números importantes (XP, Score, nota) usan el mismo peso/tamaño que cualquier otro texto, salvo en `DisplayResult`, donde sí tienen tratamiento especial.

## 9. Colores

Un solo set de tokens de color ya está establecido y se repite consistentemente en los tres sistemas — `#E91E8C` (magenta), `#8B5CF6` (morado), `#7ED957` (verde), `#F4D03F` (amarillo), fondo casi negro (`#05030a`/`#0a0a0a`/`#0a0512` — tres negros ligeramente distintos según el archivo, pequeña inconsistencia). No hace falta inventar paleta nueva — el punto 10 del prompt pide exactamente esto: formalizar lo que ya existe en tokens, no crear colores nuevos.

## 10. Efectos

Ya existen en el código (concentrados en las 3 pantallas de referencia): texto con gradiente animado (`background-clip: text` + `background-position` en loop), glow pulsante en `box-shadow`/`text-shadow`, scanlines superpuestas, humo ambiental con blur, animación 3D con `rotateX`/`rotateY`, entrada escalonada de tarjetas, parpadeo tipo reflector de escenario. Todos usan `transform`/`opacity`/`filter` — es decir, ya son GPU-friendly, cumpliendo el punto 17 sin cambios.

En World y el resto de las pantallas débiles: solo `box-shadow` estático puntual (el punto verde de "en vivo"), sin gradientes animados, sin glow en los números, sin texturas.

## 11. Problemas de consistencia

Tres negros de fondo ligeramente distintos entre `WORLD_STYLES`, `tailwind.config.js` y componentes sueltos. Tamaños de fuente para roles equivalentes (eyebrow, label) varían entre 10.5px y 12px según el archivo. La iconografía es 100% emoji en World (🥇🔥🎤🏅⭐🌎➕) mezclada con SVG dibujado a mano en `FloatingDecor`/`RetroEqualizer` — dos lenguajes de ícono distintos que nunca aparecen juntos en pantalla, pero que sí conviven en el mismo proyecto. Los botones "Ver todo →" de cada `WorldSection` son texto+flecha sin tratamiento, mientras que los botones reales de acción (`.world-cta-btn`, `.es-live-btn`) sí tienen gradiente — dos niveles de "botón" sin una jerarquía clara entre ellos.

## 12. Problemas de UX

El tamaño (`sm`/`md`/`lg`) de cada `WorldSection` no se traduce en peso visual real — dos secciones de distinto tamaño se ven igual de "importantes" porque el tratamiento (fondo/borde/radio) es idéntico. Los estados vacíos (`WorldEmptyState`) son honestos pero genéricos: ícono + una frase, sin CTA, contradiciendo el punto 41 (invitar a participar). Los skeletons de carga son barras grises genéricas, no algo que se sienta "Retroke". El feed de Actividad y las filas de ranking/tendencia tienen exactamente la misma composición visual (avatar + texto + dato a la derecha) para tres tipos de contenido distintos (un follow, un logro, una canción), lo que dificulta escanear la página de un vistazo.

## 13. Componentes que pueden reutilizarse tal cual

`FloatingDecor` y `RetroEqualizer` — se pueden importar directo en World sin modificarlos, para dar atmósfera de escenario sin inventar nada nuevo (cumple el punto 9: assets/componentes existentes antes que crear). El patrón de glow animado y gradiente-texto de `SessionHub`/`DisplayResult` se puede extraer a clases CSS reutilizables. `ShareCardFrame` ya tiene un sistema de tarjeta premium (namespace `wcard-*`) que podría inspirar el tratamiento de tarjetas "protagonista" (Top 3, tu progreso) en las pantallas reales, no solo en las compartibles.

## 14. Componentes que deben evolucionar

`WorldSection` necesita diferenciación visual real por tamaño/rol, no solo por ancho de columna. `world-rank-row`/`world-trend-row`/`world-activity-row` deberían dejar de ser la misma fila genérica repetida para tres tipos de contenido. El Top 3 del ranking necesita una composición de podio propia (punto 27), separada de la lista plana del resto. Los números de XP/Score/nota en todas las pantallas de World deberían heredar el tratamiento que ya existe en `DisplayResult` (no inventar uno nuevo).

## 15. Propuesta preliminar — Retroke Visual System 2.0

La propuesta central es simple de enunciar y coherente con todo lo anterior: **llevar el lenguaje visual que ya existe y funciona (SessionHub / DisplayResult / ShareResultCard) a la estructura que ya existe y funciona (World / WorldSection / las 6 pantallas débiles), en vez de inventar una estética nueva.** El sistema no necesita colores nuevos, ni una tipografía nueva, ni logos nuevos — necesita que el vocabulario de glow, gradiente animado, textura y motion deje de estar aislado en tres pantallas y se convierta en el lenguaje formal de toda la app.

Concretamente, para la Fase 2 (que no arranca hasta que apruebes esta auditoría) propondría tokens centralizados (color, tipografía por rol, spacing, radios, shadows/glows con nombre, transiciones, breakpoints — todo tomado de los valores que ya existen, sin inventar), y un set corto de componentes nuevos construidos sobre lo que ya hay: `RetrokeSection` (evolución de `WorldSection`, con variantes de peso visual real), `RetrokeMetric`/`RetrokeScore` (el tratamiento de número de `DisplayResult`, reutilizable), `RetrokePodium` (Top 3), `RetrokeGlow`/`RetrokeAtmosphere` (envoltorio para reutilizar `FloatingDecor`/`RetroEqualizer` en cualquier pantalla), y `RetrokeEmptyState`/`RetrokeSkeleton` con más personalidad. No es necesario un componente por cada cosa que menciona el prompt maestro (punto 49 mismo lo advierte: "no crear componentes innecesarios") — con ese set corto se puede evolucionar las 6 pantallas débiles sin duplicar trabajo.

---

**No se modificó código en esta fase.** Quedo a la espera de tu aprobación (o ajustes) antes de pasar a la Fase 2 (definición formal del sistema de tokens).
