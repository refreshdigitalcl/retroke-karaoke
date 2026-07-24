import { useKaraokeSession } from '../contexts/KaraokeSessionContext'
import DisplayQueue from './DisplayQueue'
import DisplayCalled from './DisplayCalled'
import DisplayCountdown from './DisplayCountdown'
import DisplayShow from './DisplayShow'
import DisplayReactions from './DisplayReactions'
import DisplayRating from './DisplayRating'
import DisplayResult from './DisplayResult'

export default function Display() {
  const { screenMode, currentSinger } = useKaraokeSession()
  const hasVideo = !!(currentSinger && currentSinger.videoId)

  if (screenMode === 'called') return <DisplayCalled />
  if (screenMode === 'countdown') return hasVideo ? <DisplayShow /> : <DisplayCountdown />
  if (screenMode === 'reactions') return hasVideo ? <DisplayShow /> : <DisplayReactions />
  if (screenMode === 'rating') return <DisplayRating />
  if (screenMode === 'result') return <DisplayResult />
  return <DisplayQueue />
}
