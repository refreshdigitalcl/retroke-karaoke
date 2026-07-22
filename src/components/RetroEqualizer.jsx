import { useEffect, useRef } from 'react'

const COLORS = ['#E91E8C', '#8B5CF6', '#7ED957', '#F4D03F']
const BAR_COUNT = 6

function EqualizerColumn({ side }) {
    const barsRef = useRef([])

    useEffect(() => {
          const interval = setInterval(() => {
                  barsRef.current.forEach((bar) => {
                            if (bar) {
                                        bar.style.height = `${15 + Math.random() * 70}%`
                                      }
                          })
                }, 450)
          return () => clearInterval(interval)
        }, [])

    return (
          <div
            className={`absolute top-0 bottom-0 ${side === 'left' ? 'left-3' : 'right-3'} w-[70px] flex items-end gap-[5px] opacity-55 pointer-events-none z-0`}
          >
            {Array.from({ length: BAR_COUNT }).map((_, i) => (
                      <div
                        key={i}
                        ref={(el) => (barsRef.current[i] = el)}
                        className="w-2 rounded-sm transition-[height] duration-500 ease-in-out"
                        style={{
                                      background: COLORS[i % COLORS.length],
                                      height: `${20 + Math.random() * 40}%`
                                    }}
                      />
                    ))}
          </div>
        )
  }

export default function RetroEqualizer() {
    return (
          <>
            <EqualizerColumn side="left" />
            <EqualizerColumn side="right" />
          </>
        )
  }
