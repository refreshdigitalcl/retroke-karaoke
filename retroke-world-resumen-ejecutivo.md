# Retroke World — Resumen ejecutivo

*Cierre del roadmap de 20 fases, agosto 2026*

## El proyecto

Retroke nació como una plataforma de karaoke para bares y DJs: cola de cantantes, calificación en vivo, reacciones del público y un panel de control para el operador. Sobre esa base ya probada en producción, este roadmap agregó "Retroke World": una capa social y competitiva (rankings, desafíos entre cantantes, seguir a otros usuarios, estados, tarjetas compartibles) sin tocar ni arriesgar el flujo de karaoke en vivo, que siguió funcionando exactamente igual durante todo el proceso.

El trabajo partió de una auditoría técnica completa (arquitectura, esquema de base de datos, y un mapeo de qué tan cubiertas estaban las 65 secciones del prompt original) que quedó documentada en `retroke-world-diagnostico-tecnico.md`, y de ahí se ejecutó fase por fase.

## Fase 0 — Cerrar la puerta trasera

Antes de construir nada nuevo, se blindó lo más sensible: la escritura de XP y progreso de desafíos. Antes, cualquier cliente podía, en teoría, escribir directo a `participant_stats` o `participant_challenge_progress` vía la API pública de Supabase. Se reemplazó ese camino por una función `apply_performance_gamification` server-side (RPC), que es la única vía autorizada para otorgar XP, niveles, rachas y logros — verificado en vivo que la escritura directa ya no es posible.

## Core y progreso individual (Fases 1-2)

Se construyó la base de Retroke World: una landing con lo que está pasando ahora mismo (escenario activo, artistas en escena, reacciones), y el módulo "Tu Experiencia" — nivel, XP, racha y posición en el ranking global del propio cantante, calculado en vivo contra la base real, nunca inventado.

## Rankings, tendencias y desafíos (Fases 3-7)

Se agregaron rankings por período (histórico, semana, mes) con reskin visual retro-neon; una sección de tendencias ("Lo más cantado") agregando datos reales de presentaciones; desafíos 1 a 1 entre cantantes (distintos de las misiones del sistema, que ya existían); un reskin de misiones y logros; y una página dedicada por escenario/sala con su propio mini-ranking y estado en vivo.

## Comunidad (Fases 8-12)

Esta fue la parte más delicada por tocar identidad de usuarios: seguir a otros cantantes y un perfil público, estados cortos con reacciones limitadas a un set fijo de emojis (sin comentarios ni DMs, para no convertir Retroke en otra red social), y un puente opcional para mostrar el Instagram del cantante en su perfil. La Fase 11 iba a ser "Quién va" (quién asiste a qué evento), pero tras una corrección del usuario en el camino —era solo un ejemplo de post de estado, no una función aparte— se revirtió por completo: código, componente y la tabla en base de datos. La Fase 12 cerró este bloque con un feed de "Actividad Retroke" que agrega en un solo lugar nuevos seguidores, estados, logros desbloqueados y desafíos, siempre con estado vacío honesto cuando no hay datos reales que mostrar.

## Viralidad y tiempo real (Fases 14-15)

Se construyeron tarjetas compartibles nuevas (posición en ranking, logro desbloqueado, desafío) reutilizando el mismo patrón ya probado de la tarjeta de resultado original, con un botón de compartir consolidado en tres modos (imagen, descarga, link). Y se conectó Supabase Realtime a las páginas de World, Rankings, Escenario y Perfil público, para que ranking, actividad y estado de un escenario se actualicen solos sin recargar la página.

## Calidad: responsive, performance, seguridad y testing (Fases 16-19)

Se auditó el comportamiento responsive de todas las páginas nuevas (sin cambios de código necesarios). En performance, se consolidó la carga de fuentes (antes 7 archivos pedían la misma tipografía por separado), se agregaron índices de base de datos que faltaban, se sumó debounce a las suscripciones en tiempo real, y se dividió el bundle con `React.lazy` para que las rutas del flujo en vivo carguen sin depender del resto de la app.

La auditoría de seguridad confirmó que las políticas de RLS de todas las tablas nuevas exigen identidad verificada (`auth.uid()`) para publicar, seguir o reaccionar en nombre propio, sin huecos. Quedó un solo pendiente fuera de mi alcance: activar "Leaked password protection" en Supabase Auth, disponible solo en plan Pro (el proyecto está en plan Free).

Por último, se instaló Vitest y se escribieron 54 tests unitarios sobre la lógica de `lib/*.js` — el sistema de XP y niveles, el filtro de lenguaje ofensivo del registro, las tarjetas compartibles, el cálculo de ranking y las suscripciones en tiempo real — todos pasando.

## Optimización final (Fase 20)

Se eliminó código muerto que quedaba de un intento de tienda anterior (`StorePage.jsx`, `StoreProductDetail.jsx`, `StoreThankYou.jsx`), inalcanzable desde cualquier ruta y que referenciaba tablas que no existen en la base. Y se optimizó el logo neon de 2.1MB a 1.27MB sin pérdida visible, sin tocar ninguna línea de código.

## Estado actual y pendientes conocidos

La aplicación está desplegada y verificada en `retroke.cl`, con las 20 fases completas. Quedan tres cosas documentadas pero sin resolver, porque requieren una decisión o acceso que no me corresponde a mí:

Los endpoints server-side `api/create-store-preference.js` e `import-mercadolibre.js` todavía referencian las tablas de tienda que ya no existen — no rompen nada porque nadie los llama, pero son candidatos a limpiar si se descarta retomar la tienda. La protección contra contraseñas filtradas en Supabase Auth sigue desactivada por el plan Free del proyecto. Y `npm install` reportó 9 vulnerabilidades (una crítica) en dependencias de terceros, que no llegué a revisar en detalle — vale la pena correr `npm audit` cuando haya tiempo.

También queda documentado, no como una tarea pendiente sino como una limitación de diseño conocida: los participantes anónimos (sin cuenta de Google conectada, identificados solo por `device_id`) pueden en teoría ser editados por cualquiera a nivel de base de datos, porque sin autenticación no hay forma de verificar el dueño del dispositivo del lado del servidor. Es un trade-off inherente al modelo de identidad liviana que ya traía la app desde antes de este proyecto.
