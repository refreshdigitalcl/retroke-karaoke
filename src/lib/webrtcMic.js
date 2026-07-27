import { supabase } from './supabase'

var ICE_SERVERS = [
  { urls: 'stun:stun.l.google.com:19302' },
  { urls: 'stun:stun1.l.google.com:19302' }
]

function channelName(sessionId, entryId) {
  return 'webrtc-mic:' + sessionId + ':' + entryId
}

// Lado del celular (cantante): crea la conexion, agrega el audio del microfono,
// manda la oferta, y espera la respuesta de la TV.
export function startMicSender(sessionId, entryId, stream, onStatusChange) {
  var pc = new RTCPeerConnection({ iceServers: ICE_SERVERS })
  var channel = supabase.channel(channelName(sessionId, entryId))

  stream.getAudioTracks().forEach(function (track) {
    pc.addTrack(track, stream)
  })

  pc.onicecandidate = function (event) {
    if (event.candidate) {
      channel.send({
        type: 'broadcast',
        event: 'ice-sender',
        payload: { candidate: event.candidate }
      })
    }
  }

  pc.onconnectionstatechange = function () {
    if (onStatusChange) onStatusChange(pc.connectionState)
  }

  channel
    .on('broadcast', { event: 'answer' }, function (msg) {
      var answer = msg.payload.answer
      if (pc.signalingState !== 'stable') {
        pc.setRemoteDescription(new RTCSessionDescription(answer)).catch(function () {})
      }
    })
    .on('broadcast', { event: 'ice-receiver' }, function (msg) {
      pc.addIceCandidate(new RTCIceCandidate(msg.payload.candidate)).catch(function () {})
    })
    .subscribe(function (status) {
      if (status === 'SUBSCRIBED') {
        pc.createOffer()
          .then(function (offer) {
            return pc.setLocalDescription(offer).then(function () { return offer })
          })
          .then(function (offer) {
            channel.send({
              type: 'broadcast',
              event: 'offer',
              payload: { offer: offer }
            })
          })
      }
    })

  return {
    close: function () {
      try { pc.close() } catch (e) {}
      supabase.removeChannel(channel)
    }
  }
}

// Lado de la TV / pantalla principal: escucha la oferta del celular del cantante actual,
// contesta, y reproduce el audio recibido.
export function startMicReceiver(sessionId, entryId, onTrack, onStatusChange) {
  var pc = new RTCPeerConnection({ iceServers: ICE_SERVERS })
  var channel = supabase.channel(channelName(sessionId, entryId))

  pc.ontrack = function (event) {
    if (onTrack) onTrack(event.streams[0])
  }

  pc.onicecandidate = function (event) {
    if (event.candidate) {
      channel.send({
        type: 'broadcast',
        event: 'ice-receiver',
        payload: { candidate: event.candidate }
      })
    }
  }

  pc.onconnectionstatechange = function () {
    if (onStatusChange) onStatusChange(pc.connectionState)
  }

  channel
    .on('broadcast', { event: 'offer' }, function (msg) {
      var offer = msg.payload.offer
      pc.setRemoteDescription(new RTCSessionDescription(offer))
        .then(function () { return pc.createAnswer() })
        .then(function (answer) {
          return pc.setLocalDescription(answer).then(function () { return answer })
        })
        .then(function (answer) {
          channel.send({
            type: 'broadcast',
            event: 'answer',
            payload: { answer: answer }
          })
        })
        .catch(function () {})
    })
    .on('broadcast', { event: 'ice-sender' }, function (msg) {
      pc.addIceCandidate(new RTCIceCandidate(msg.payload.candidate)).catch(function () {})
    })
    .subscribe()

  return {
    close: function () {
      try { pc.close() } catch (e) {}
      supabase.removeChannel(channel)
    }
  }
}
