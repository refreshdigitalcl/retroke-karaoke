import { createContext, useContext } from 'react'

// Selector de idioma para las pantallas de TV (las que ve el publico en el
// bar: Display.jsx y todo lo que rota adentro -- DisplayQueue, DisplayCalled,
// DisplayCountdown, DisplayReactions, DisplayRating, DisplayResult,
// SessionLeaderboard). Pedido explicito: "que transformara toda la interfaz
// a ingles, todas las pantallas que se muestran en la tv".
//
// NO cubre: RegisterForm/ReactForm/RateForm (lo que ve el CELULAR del
// publico), el panel del DJ, ni nada de World/marketing -- el pedido fue
// especificamente sobre las pantallas de TV, y esas viven todas dentro de
// Display.jsx.
//
// Diseño: un solo modulo con el diccionario COMPLETO (no un archivo por
// idioma) para que sea imposible que un array quede con distinta cantidad de
// items entre es/en -- varios de estos textos son arrays rotados por indice
// o por un "seed" determinista (ej. RESULT_TITLES en DisplayResult.jsx), asi
// que es/en tienen que tener EXACTAMENTE el mismo largo en el mismo orden o
// el indice de un idioma no correspondería con el del otro.
//
// Lo que NO se traduce nunca (son datos reales, no texto de interfaz): el
// nombre del bar, nombres de cantantes, nombres/artistas de canciones, y el
// feedback de vocalAnalysis.js (texto generado server-side a partir del
// analisis de voz -- traducirlo es un cambio de otro alcance, en la libreria
// de analisis, no en las pantallas).
export const LANG_STORAGE_KEY = 'retroke_tv_lang'

export const translations = {
  es: {
    common: {
      searching: 'Buscando artista...'
    },
    display: {
      loadingRoom: 'Cargando tu sala...',
      tapToUnmute: 'Toca para activar el sonido',
      performanceDone: '🎉 Presentación completada'
    },
    queue: {
      eyebrow: '✨ La Evolución del Karaoke',
      heroPhrases: [
        'UNA NUEVA FORMA DE VIVIR EL KARAOKE.',
        'EL ESCENARIO TE ESPERA. LA EXPERIENCIA ES TUYA.',
        'EL KARAOKE COMO NUNCA LO HAS VIVIDO.',
        'EL SHOW LO HACEMOS ENTRE TODOS.',
        'CANTAR ES SOLO EL COMIENZO, VIVIRLO ES DE TODOS.',
        'LA CANCIÓN ES TUYA. LA EXPERIENCIA ES DE TODOS.'
      ],
      subtitle: 'Escanea el QR, anota tu nombre y canción, y sube al escenario.',
      sungTonight: 'Ya cantaron esta noche',
      waitingListTitle: 'Lista de espera',
      waitingListEmpty: 'Aún no hay nadie anotado. Escanea el QR y sé el primero en subir al escenario.',
      ready: 'LISTO',
      muteOn: 'Activar musica de fondo',
      muteOff: 'Silenciar musica de fondo',
      speedTestTitle: 'Test de velocidad de internet',
      changeRoom: 'Cambiar sala',
      langToggleTitle: 'Switch to English',
      speedModal: {
        title: '📶 Test de velocidad',
        subtitle: 'Conexión de esta pantalla',
        measuring: 'Midiendo...',
        mbpsLabel: 'Mbps de bajada',
        excellent: 'Excelente para video en vivo',
        enough: 'Suficiente, sin margen de sobra',
        maybeCuts: 'Puede cortarse el video',
        error: 'No se pudo medir la velocidad. Revisa la conexión.',
        close: 'Cerrar'
      }
    },
    called: {
      badge: 'Prepárate para cantar'
    },
    countdown: {
      getReady: 'Preparate...'
    },
    reactions: {
      phrases: [
        'está cantando con todo.', 'está rompiendo el escenario.', 'está rockeando como nunca.',
        'está en su prime.', 'está dando cátedra.', 'está dejando todo en el escenario.',
        'está encendiendo la noche.', 'está haciendo vibrar el lugar.', 'está simplemente increíble.',
        'está en modo estrella.', 'está demostrando por qué es uno de los grandes.',
        'está entregando un show de otro nivel.', 'está haciendo historia esta noche.',
        'está conquistando al público.', 'está haciendo cantar a todos.', 'está prendiendo el ambiente.',
        'está dejando la energía arriba.', 'está demostrando todo su talento.',
        'está brillando sobre el escenario.', 'está en su mejor momento.', 'está entregando pura energía.',
        'está haciendo vibrar cada rincón.', 'está desatando la fiesta.', 'está dominando el escenario.',
        'está cantando como los grandes.', 'está regalando un show inolvidable.',
        'está haciendo explotar el ambiente.', 'está entregando una presentación espectacular.',
        'está cantando con el alma.', 'está en modo leyenda.', 'está brillando con luz propia.',
        'está haciendo vibrar la noche.', 'está haciendo disfrutar a todos.', 'está en llamas.',
        'está simplemente en otro nivel.'
      ],
      tapToPlay: 'Toca para reproducir el video',
      listening: 'Escuchando',
      liveNow: 'En vivo',
      scanToReact: 'Escanea para reaccionar',
      reactQr: '¡Reacciona a esta presentacion!',
      registerQr: '¿Aun no te anotas? ¡Escanea aqui!'
    },
    rating: {
      audienceReaction: 'Reaccion del publico',
      zoneEnthusiastic: 'Publico muy entusiasta',
      zoneMixed: 'Reacciones mixtas',
      zoneCalm: 'Reacciones tranquilas',
      scanToVote: 'Escanea para votar',
      finalScore: 'Calificacion final',
      voteSingular: 'voto emitido',
      votePlural: 'votos emitidos',
      waitingJudges: 'Esperando la calificacion del jurado...'
    },
    result: {
      titles: [
        '¡Gran Presentación! 🎤👏',
        '¡Excelente Presentación! ⭐🎶',
        '¡Tremenda Presentación! 🔥🎤',
        '¡Fantástica Presentación! 🌟👏',
        '¡Increíble Presentación! 🤩🎤',
        '¡Brillante Presentación! ✨🎶',
        '¡Espectacular Presentación! 💥👏',
        '¡Magnífica Presentación! 🌟🎤',
        '¡Qué Gran Presentación! 👏🔥',
        '¡Una Presentación Inolvidable! 🎶⭐',
        '¡Presentación de Lujo! 👑🎤',
        '¡Puro Talento! 🎤✨',
        '¡Te Luciste! 🔥👏',
        '¡La Rompiste! 💥🎤',
        '¡El Escenario Fue Tuyo! 👑🎶',
        '¡Una Presentación para Recordar! 🌟👏',
        '¡El Público lo Disfrutó! 🙌🎤',
        '¡Voz y Actitud! 🔥🎶',
        '¡Te Pasaste! 👏⭐',
        '¡Nivel Estrella! 🌟🎤'
      ],
      phrases: [
        '¡Gran presentación! 🎤👏',
        '¡Te luciste en el escenario! 🔥🎤',
        '¡El público lo disfrutó muchísimo! 👏❤️',
        '¡Qué tremenda interpretación! ⭐🎶',
        '¡Voz, actitud y espectáculo! 🔥🎤',
        '¡Nos regalaste una gran presentación! 🎵👏',
        '¡El escenario fue tuyo! 👑🎤',
        '¡Una actuación para recordar! 🌟🎶',
        '¡Te pasaste! Tremenda presentación 🔥👏',
        '¡El público habló y te aplaudió! 👏🙌',
        '¡Puro talento sobre el escenario! 🎤✨',
        '¡Cantaste con todo el corazón! ❤️🎶',
        '¡Qué manera de cantar! 🔥🎤',
        '¡Una presentación llena de energía! ⚡👏',
        '¡El micrófono fue tuyo y lo disfrutaste! 🎤😎',
        '¡Nos sorprendiste! Gran presentación 😮⭐',
        '¡La rompiste esta noche! 💥🎤',
        '¡Una presentación digna de aplausos! 👏🌟',
        '¡El público disfrutó cada segundo! 🎶❤️',
        '¡Gracias por dejarlo todo en el escenario! 🙌🔥'
      ],
      audience: '👥 Público',
      voteSingular: 'voto',
      votePlural: 'votos',
      notEnoughVotes: 'Sin votos suficientes',
      finalScore: '⭐ Nota Final',
      averageBoth: 'Promedio Público + Retroke',
      retrokeScore: '🎤 Retroke Score',
      confidence: { alta: 'alta', media: 'media', baja: 'baja' },
      metrics: {
        pitch: '🎯 Afinación',
        rhythm: '🥁 Ritmo',
        stability: '🎵 Estabilidad',
        energy: '🔥 Energía'
      },
      reactions: '🔥 Reacciones',
      noReactions: 'Sin reacciones esta vez'
    },
    leaderboard: {
      loading: 'Cargando resultados...',
      goToRooms: 'Ir a selección de salas',
      title: '🏆 Mejores del karaoke',
      noRatings: 'No hubo calificaciones esta noche.',
      genreOfNight: 'Genero de la noche',
      genreVaried: 'Variado',
      performancesCount: 'presentaciones',
      mostReacted: 'Mas reaccionado',
      noDataYet: 'Sin datos aun',
      reactionsCount: 'reacciones',
      averageScore: 'Promedio general',
      reactionsTotal: 'reacciones en total',
      proLocked: '🔒 Las estadisticas de la noche estan disponibles en el plan',
      proLabel: 'PRO'
    }
  },
  en: {
    common: {
      searching: 'Looking up artist...'
    },
    display: {
      loadingRoom: 'Loading your room...',
      tapToUnmute: 'Tap to turn on sound',
      performanceDone: '🎉 Performance complete'
    },
    queue: {
      eyebrow: '✨ The Evolution of Karaoke',
      heroPhrases: [
        'A NEW WAY TO EXPERIENCE KARAOKE.',
        'THE STAGE IS WAITING. THE EXPERIENCE IS YOURS.',
        'KARAOKE LIKE YOU\'VE NEVER LIVED IT.',
        'WE MAKE THE SHOW TOGETHER.',
        'SINGING IS JUST THE START, LIVING IT IS FOR EVERYONE.',
        'THE SONG IS YOURS. THE EXPERIENCE BELONGS TO EVERYONE.'
      ],
      subtitle: 'Scan the QR code, enter your name and song, and take the stage.',
      sungTonight: 'Sung tonight',
      waitingListTitle: 'Waiting list',
      waitingListEmpty: 'No one signed up yet. Scan the QR code and be the first on stage.',
      ready: 'READY',
      muteOn: 'Turn on background music',
      muteOff: 'Mute background music',
      speedTestTitle: 'Internet speed test',
      changeRoom: 'Change room',
      langToggleTitle: 'Cambiar a español',
      speedModal: {
        title: '📶 Speed test',
        subtitle: 'This screen\'s connection',
        measuring: 'Measuring...',
        mbpsLabel: 'Mbps download',
        excellent: 'Excellent for live video',
        enough: 'Enough, with no room to spare',
        maybeCuts: 'Video may stutter',
        error: 'Could not measure speed. Check the connection.',
        close: 'Close'
      }
    },
    called: {
      badge: 'Get ready to sing'
    },
    countdown: {
      getReady: 'Get ready...'
    },
    reactions: {
      phrases: [
        'is singing with everything.', 'is tearing up the stage.', 'is rocking like never before.',
        'is in their prime.', 'is giving a masterclass.', 'is leaving it all on the stage.',
        'is lighting up the night.', 'is making the place shake.', 'is simply incredible.',
        'is in full star mode.', 'is showing why they\'re one of the greats.',
        'is delivering a show on another level.', 'is making history tonight.',
        'is winning over the crowd.', 'is getting everyone singing along.', 'is setting the mood on fire.',
        'is keeping the energy sky high.', 'is showing off all their talent.',
        'is shining on stage.', 'is at their best.', 'is delivering pure energy.',
        'is making every corner move.', 'is unleashing the party.', 'is owning the stage.',
        'is singing like the greats.', 'is giving an unforgettable show.',
        'is making the whole place explode.', 'is delivering a spectacular performance.',
        'is singing with heart and soul.', 'is in legend mode.', 'is shining with their own light.',
        'is making the night come alive.', 'is making everyone have a blast.', 'is on fire.',
        'is simply on another level.'
      ],
      tapToPlay: 'Tap to play the video',
      listening: 'Listening',
      liveNow: 'Live now',
      scanToReact: 'Scan to react',
      reactQr: 'React to this performance!',
      registerQr: 'Haven\'t signed up yet? Scan here!'
    },
    rating: {
      audienceReaction: 'Audience reaction',
      zoneEnthusiastic: 'Very enthusiastic crowd',
      zoneMixed: 'Mixed reactions',
      zoneCalm: 'Calm reactions',
      scanToVote: 'Scan to vote',
      finalScore: 'Final score',
      voteSingular: 'vote cast',
      votePlural: 'votes cast',
      waitingJudges: 'Waiting for the judges\' score...'
    },
    result: {
      titles: [
        'Great Performance! 🎤👏',
        'Excellent Performance! ⭐🎶',
        'Tremendous Performance! 🔥🎤',
        'Fantastic Performance! 🌟👏',
        'Incredible Performance! 🤩🎤',
        'Brilliant Performance! ✨🎶',
        'Spectacular Performance! 💥👏',
        'Magnificent Performance! 🌟🎤',
        'What a Great Performance! 👏🔥',
        'An Unforgettable Performance! 🎶⭐',
        'A Deluxe Performance! 👑🎤',
        'Pure Talent! 🎤✨',
        'You Shined! 🔥👏',
        'You Nailed It! 💥🎤',
        'The Stage Was Yours! 👑🎶',
        'A Performance to Remember! 🌟👏',
        'The Crowd Loved It! 🙌🎤',
        'Voice and Attitude! 🔥🎶',
        'You Outdid Yourself! 👏⭐',
        'Star Level! 🌟🎤'
      ],
      phrases: [
        'Great performance! 🎤👏',
        'You shined on stage! 🔥🎤',
        'The crowd loved it! 👏❤️',
        'What an incredible performance! ⭐🎶',
        'Voice, attitude and showmanship! 🔥🎤',
        'You gave us a great performance! 🎵👏',
        'The stage was yours! 👑🎤',
        'A performance to remember! 🌟🎶',
        'You outdid yourself! Tremendous performance 🔥👏',
        'The crowd spoke and cheered for you! 👏🙌',
        'Pure talent on stage! 🎤✨',
        'You sang with all your heart! ❤️🎶',
        'What a way to sing! 🔥🎤',
        'A performance full of energy! ⚡👏',
        'The mic was yours and you owned it! 🎤😎',
        'You surprised us! Great performance 😮⭐',
        'You nailed it tonight! 💥🎤',
        'A performance worthy of applause! 👏🌟',
        'The crowd enjoyed every second! 🎶❤️',
        'Thanks for leaving it all on stage! 🙌🔥'
      ],
      audience: '👥 Audience',
      voteSingular: 'vote',
      votePlural: 'votes',
      notEnoughVotes: 'Not enough votes',
      finalScore: '⭐ Final Score',
      averageBoth: 'Audience + Retroke average',
      retrokeScore: '🎤 Retroke Score',
      confidence: { alta: 'high', media: 'medium', baja: 'low' },
      metrics: {
        pitch: '🎯 Pitch',
        rhythm: '🥁 Rhythm',
        stability: '🎵 Stability',
        energy: '🔥 Energy'
      },
      reactions: '🔥 Reactions',
      noReactions: 'No reactions this time'
    },
    leaderboard: {
      loading: 'Loading results...',
      goToRooms: 'Go to room selection',
      title: '🏆 Karaoke champions',
      noRatings: 'No ratings tonight.',
      genreOfNight: 'Genre of the night',
      genreVaried: 'Varied',
      performancesCount: 'performances',
      mostReacted: 'Most reacted to',
      noDataYet: 'No data yet',
      reactionsCount: 'reactions',
      averageScore: 'Overall average',
      reactionsTotal: 'total reactions',
      proLocked: '🔒 Night statistics are available on the',
      proLabel: 'PRO plan'
    }
  }
}

var LanguageContext = createContext({
  lang: 'es',
  setLang: function () {},
  toggleLang: function () {},
  T: translations.es
})

export function readStoredLang() {
  if (typeof window === 'undefined') return 'es'
  try {
    var stored = localStorage.getItem(LANG_STORAGE_KEY)
    return stored === 'en' ? 'en' : 'es'
  } catch (e) {
    return 'es'
  }
}

export function storeLang(lang) {
  try {
    localStorage.setItem(LANG_STORAGE_KEY, lang)
  } catch (e) {}
}

export var LanguageProvider = LanguageContext.Provider

// T = el diccionario completo del idioma actual (translations[lang]),
// para que cada pantalla pueda leer sus propias claves como
// `T.queue.subtitle` sin repetir el import de `translations` en todos
// lados.
export function useLanguage() {
  return useContext(LanguageContext)
}
