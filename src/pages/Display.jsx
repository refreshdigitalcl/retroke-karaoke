import { useKaraokeSession } from '../contexts/KaraokeSessionContext'
import DisplayQueue from './DisplayQueue'
import DisplayReactions from './DisplayReactions'
import DisplayRating from './DisplayRating'

export default function Display() {
  const { screenMode } = useKaraokeSession()

    if (screenMode === 'reactions') return <DisplayReactions />
      if (screenMode === 'rating') return <DisplayRating />
        return <DisplayQueue />
        }
        
