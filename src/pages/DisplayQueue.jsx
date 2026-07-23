import { useKaraokeSession } from '../contexts/KaraokeSessionContext'

export default function DisplayQueue() {
          var session = useKaraokeSession()
          return (
                      <div className="min-h-screen bg-black text-white p-10">
                            <p>{session.barName}</p>p>
                      </div>div>
                    )
}
</div>
