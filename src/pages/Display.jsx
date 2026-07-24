import { useKaraokeSession } from '../contexts/KaraokeSessionContext'
import DisplayQueue from './DisplayQueue'
import DisplayCalled from './DisplayCalled'
import DisplayCountdown from './DisplayCountdown'
import DisplayReactions from './DisplayReactions'
import DisplayRating from './DisplayRating'
import DisplayResult from './DisplayResult'
import SessionLeaderboard from './SessionLeaderboard'

export default function Display() {
  const { screenMode, hasActiveSession, lastClosedSession } = useKaraokeSession()

  if (!hasActiveSession && lastClosedSession) return <SessionLeaderboard />

  if (screenMode === 'called') return <DisplayCalled />
  if (screenMode === 'countdown') return <DisplayCountdown />
  if (screenMode === 'reactions') return <DisplayReactions />
  if (screenMode === 'rating') return <DisplayRating />
  if (screenMode === 'result') return <DisplayResult />
  return <DisplayQueue />
}
