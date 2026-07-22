# Karaoke Bar — plataforma de karaoke para bares

## Cómo correrlo localmente

```bash
npm install
npm run dev
```

Se abre en `http://localhost:5173`

## Rutas del sistema

| Ruta | Qué es | Quién la usa |
|---|---|---|
| `/` | Display principal — rota entre cola, reacciones y calificación | Pantalla/TV del bar |
| `/registro` | Formulario para anotarse a cantar | Cantante, escaneando el QR |
| `/reaccionar` | Botones de reacción en vivo | Público, desde su celular |
| `/calificar` | Votación 5-10 al terminar la canción | Público, desde su celular |
| `/dj` | Panel de control de la noche | El DJ |

## Cómo probarlo tú mismo ahora

1. Corre `npm run dev`
2. Abre `/dj` en una pestaña — este es tu panel de control
3. Abre `/registro` en otra pestaña y anótate con un nombre y canción
4. Vuelve a `/dj` y presiona "Llamar al siguiente"
5. Abre `/reaccionar` en otra pestaña y toca los emojis
6. En `/dj`, presiona "Terminar canción, pedir votos"
7. Abre `/calificar` y vota

Cada pestaña tiene su propio estado por ahora, no están conectadas entre sí en tiempo real todavía.

## Lo que falta para producción real

1. Backend con base de datos (Supabase, Firebase, etc.)
2. WebSockets o Supabase Realtime para conexión en tiempo real entre dispositivos
3. Sistema de autenticación para cada DJ/bar
4. Generación real de códigos QR por sesión
5. Integración de pago con Webpay para las membresías
6. Moderación de contenido antes de mostrar en pantalla

## Identidad visual

La paleta y el ecualizador vintage animado ya están integrados como sistema. El modo claro/oscuro funciona con el botón en cada pantalla y persiste en localStorage.
