import { useState } from 'react'
import { useKaraokeSession } from '../contexts/KaraokeSessionContext'
import DisplayQueue from './DisplayQueue'
import DisplayCalled from './DisplayCalled'
import DisplayCountdown from './DisplayCountdown'
import DisplayReactions from './DisplayReactions'
import DisplayRating from './DisplayRating'
import DisplayResult from './DisplayResult'
import SessionLeaderboard from './SessionLeaderboard'
import SessionHub from './SessionHub'
import AudioUnlockGate from '../components/AudioUnlockGate'

function checkNoParams() {
  if (typeof window === 'undefined') return false
  var params = new URLSearchParams(window.location.search)
  return !params.has('ws') && !params.has('bar')
}

export default function Display() {
  const { screenMode, hasActiveSession, lastClosedSession } = useKaraokeSession()
  const [showHub] = useState(checkNoParams)

  if (showHub) {
    return <SessionHub />
  }

  return (
    <AudioUnlockGate>
      {!hasActiveSession && lastClosedSession ? (
        <SessionLeaderboard />
      ) : screenMode === 'called' ? (
        <DisplayCalled />
      ) : screenMode === 'countdown' ? (
        <DisplayCountdown />
      ) : screenMode === 'reactions' ? (
        <DisplayReactions />
      ) : screenMode === 'rating' ? (
        <DisplayRating />
      ) : screenMode === 'result' ? (
        <DisplayResult />
      ) : (
        <DisplayQueue />
      )}
    </AudioUnlockGate>
  )
}
