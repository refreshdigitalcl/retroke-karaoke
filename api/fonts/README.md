# Fuente local para Momento Retroke

Este archivo momento-card.js lee los .ttf de Space Grotesk directo de esta
carpeta (sin pedirlos a Google Fonts en cada invocacion). Los 3 archivos
reales (400/600/700 -- Space Grotesk no tiene un peso 800 real en Google
Fonts) no se suben a este README porque son binarios; se descargan una vez
con estos comandos, corridos desde la raiz del repo:

```
mkdir -p api/fonts
curl -sL -o api/fonts/SpaceGrotesk-400.ttf "https://fonts.gstatic.com/s/spacegrotesk/v22/V8mQoQDjQSkFtoMM3T6r8E7mF71Q-gOoraIAEj7oUUsj.ttf"
curl -sL -o api/fonts/SpaceGrotesk-600.ttf "https://fonts.gstatic.com/s/spacegrotesk/v22/V8mQoQDjQSkFtoMM3T6r8E7mF71Q-gOoraIAEj42Vksj.ttf"
curl -sL -o api/fonts/SpaceGrotesk-700.ttf "https://fonts.gstatic.com/s/spacegrotesk/v22/V8mQoQDjQSkFtoMM3T6r8E7mF71Q-gOoraIAEj4PVksj.ttf"
```

Si estos archivos no estan presentes, momento-card.js sigue funcionando
igual: cae automaticamente al fetch a Google Fonts de siempre (ver
loadFonts() en momento-card.js).
