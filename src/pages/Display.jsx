import { useKaraokeSession } from '../contexts/KaraokeSessionContext'
import DisplayQueue from './DisplayQueue'
import DisplayCalled from './DisplayCalled'
import DisplayCountdown from './DisplayCountdown'
import DisplayReactions from './DisplayReactions'
import DisplayRating from './DisplayRating'

export default function Display() {
  const { screenMode } = useKaraokeSession()

  if (screenMode === 'called') return <DisplayCalled />
  if (screenMode === 'countdown') return <DisplayCountdown />
  if (screenMode === 'reactions') return <DisplayReactions />
  if (screenMode === 'rating') return <DisplayRating />
  return <DisplayQueue />
}
