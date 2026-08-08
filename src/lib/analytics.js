import { supabase } from './supabase'

// Fase H del roadmap: capa de analitica de eventos.
//
// No reemplaza nada — es una capa de instrumentacion que escucha las
// acciones que YA existen (terminar una cancion, calificar, reaccionar,
// desbloquear un logro, compartir la tarjeta, etc.) y deja un registro
// liviano para que mas adelante el dueno de un bar/DJ pueda ver metricas
// reales de su noche. Igual que recordPerformance/applyGamification en
// KaraokeSessionContext.jsx, es "fire and forget": si falla, no debe
// romper la experiencia del usuario, solo se pierde ese evento puntual.

// Tipos de evento usados hoy en la app (referencia, no es una lista
// cerrada — se puede seguir sumando sin migracion, event_type es texto
// libre en la base de datos):
//   song_completed        — termino una presentacion (se guardo en performances)
//   rating_received       — el publico califico a alguien
//   reaction_received     — llego una reaccion (emoji o sticker)
//   level_up              — un participante subio de nivel
//   achievement_unlocked  — un participante desbloqueo un logro
//   challenge_completed   — se completo un desafio
//   card_shared           — se compartio/descargo la tarjeta de resultado
//   session_started       — el DJ/anfitrion abrio una sesion nueva
//   participant_registered — se creo un perfil liviano de participante nuevo

export function trackEvent(eventType, options) {
  var opts = options || {}
  if (!eventType) return Promise.resolve()

  var row = {
    event_type: eventType,
    participant_id: opts.participantId || null,
    session_id: opts.sessionId || null,
    bar_id: opts.barId || null,
    workspace_id: opts.workspaceId || null,
    payload: opts.payload || {}
  }

  return supabase
    .from('analytics_events')
    .insert(row)
    .then(function (result) {
      if (result.error) {
        // No molestamos al usuario por esto — es instrumentacion, no
        // funcionalidad critica. Solo dejamos rastro en consola para
        // debug si algo esta mal configurado (ej. RLS).
        console.warn('[analytics] no se pudo registrar "' + eventType + '":', result.error.message)
      }
      return result
    })
    .catch(function (err) {
      console.warn('[analytics] error registrando "' + eventType + '":', err && err.message)
    })
}
