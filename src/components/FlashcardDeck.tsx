import { useState, useRef, useEffect, useCallback, type ReactNode } from 'react'

export type Flashcard = {
  id: string
  front: ReactNode
  back: ReactNode
}

interface FlashcardDeckProps {
  cards: Flashcard[]
  title?: string
  subtitle?: string
}

const FlashcardDeck = ({ cards, title, subtitle }: FlashcardDeckProps) => {
  const [currentIndex, setCurrentIndex] = useState(0)
  const [showBack, setShowBack] = useState(false)
  const [isFlipping, setIsFlipping] = useState(false)
  const [phase, setPhase] = useState<'idle' | 'exiting' | 'entering'>('idle')
  const [direction, setDirection] = useState<1 | -1>(1)
  const [enterActive, setEnterActive] = useState(false)
  const frontRef = useRef<HTMLDivElement>(null)
  const backRef = useRef<HTMLDivElement>(null)
  const [frontTextColor, setFrontTextColor] = useState('#0f172a')
  const [backTextColor, setBackTextColor] = useState('#f8fafc')
  const exitTimerRef = useRef<ReturnType<typeof setTimeout> | null>(null)
  const idleTimerRef = useRef<ReturnType<typeof setTimeout> | null>(null)
  const enterFrameRef = useRef<number | null>(null)

  const computeContrastColor = useCallback((background: string) => {
    if (!background) return '#0f172a'
    const match = background.match(/rgba?\((\d+),\s*(\d+),\s*(\d+)(?:,\s*([0-9.]+))?\)/)
    if (!match) return '#0f172a'
    const r = Number(match[1]) / 255
    const g = Number(match[2]) / 255
    const b = Number(match[3]) / 255

    const channel = (value: number) =>
      value <= 0.03928 ? value / 12.92 : Math.pow((value + 0.055) / 1.055, 2.4)

    const luminance = 0.2126 * channel(r) + 0.7152 * channel(g) + 0.0722 * channel(b)
    return luminance > 0.55 ? '#0f172a' : '#f8fafc'
  }, [])

  const updateTextColors = useCallback(() => {
    if (frontRef.current) {
      const bg = window.getComputedStyle(frontRef.current).backgroundColor
      setFrontTextColor(computeContrastColor(bg))
    }
    if (backRef.current) {
      const bg = window.getComputedStyle(backRef.current).backgroundColor
      setBackTextColor(computeContrastColor(bg))
    }
  }, [computeContrastColor])

  const total = cards.length

  useEffect(() => {
    updateTextColors()
  }, [currentIndex, cards, updateTextColors])

  useEffect(() => {
    const handleResize = () => updateTextColors()
    window.addEventListener('resize', handleResize)
    return () => window.removeEventListener('resize', handleResize)
  }, [updateTextColors])

  useEffect(() => {
    if (phase === 'entering') {
      setEnterActive(false)
      const frame1 = requestAnimationFrame(() => {
        const frame2 = requestAnimationFrame(() => {
          setEnterActive(true)
        })
        if (enterFrameRef.current !== null) {
          cancelAnimationFrame(enterFrameRef.current)
        }
        enterFrameRef.current = frame2
      })
      if (enterFrameRef.current !== null) {
        cancelAnimationFrame(enterFrameRef.current)
      }
      enterFrameRef.current = frame1
      return () => {
        cancelAnimationFrame(frame1)
        if (enterFrameRef.current !== null) {
          cancelAnimationFrame(enterFrameRef.current)
          enterFrameRef.current = null
        }
      }
    } else {
      setEnterActive(false)
    }
    return () => {
      if (enterFrameRef.current !== null) {
        cancelAnimationFrame(enterFrameRef.current)
        enterFrameRef.current = null
      }
    }
  }, [phase])

  useEffect(() => {
    return () => {
      if (exitTimerRef.current) {
        clearTimeout(exitTimerRef.current)
      }
      if (idleTimerRef.current) {
        clearTimeout(idleTimerRef.current)
      }
      if (enterFrameRef.current !== null) {
        cancelAnimationFrame(enterFrameRef.current)
      }
    }
  }, [])

  const EXIT_DURATION = 90
  const ENTER_DURATION = 150

  const move = (dir: 1 | -1) => {
    if (!total || phase !== 'idle') return
    setDirection(dir)
    setPhase('exiting')

    if (exitTimerRef.current) {
      clearTimeout(exitTimerRef.current)
    }
    if (idleTimerRef.current) {
      clearTimeout(idleTimerRef.current)
    }

    exitTimerRef.current = setTimeout(() => {
      setCurrentIndex((prev) => {
        const next = (prev + dir + total) % total
        return next
      })
      setShowBack(false)
      setPhase('entering')
    }, EXIT_DURATION)

    idleTimerRef.current = setTimeout(() => {
      setPhase('idle')
    }, EXIT_DURATION + ENTER_DURATION)
  }

  const handleFlip = () => {
    if (!total || isFlipping || phase !== 'idle') return
    setIsFlipping(true)
    setTimeout(() => {
      setShowBack((prev) => !prev)
      setIsFlipping(false)
    }, 150)
  }

  if (!total) {
    return null
  }

  const currentCard = cards[currentIndex]

  const { translateX, opacity } = (() => {
    if (phase === 'exiting') {
      return {
        translateX: direction === 1 ? '-8%' : '8%',
        opacity: 0
      }
    }
    if (phase === 'entering') {
      return {
        translateX: enterActive ? '0%' : direction === 1 ? '8%' : '-8%',
        opacity: enterActive ? 1 : 0
      }
    }
    return { translateX: '0%', opacity: 1 }
  })()

  return (
    <div className="bg-white rounded-2xl p-8 shadow-sm">
      {title && (
        <div className="mb-6">
          <h3 className="text-lg font-semibold text-slate-800">{title}</h3>
          {subtitle && <p className="text-sm text-slate-500">{subtitle}</p>}
        </div>
      )}

      <div className="flex flex-col items-center gap-6">
        {/* Flashcard Container with 3D perspective */}
        <div className="w-full" style={{ perspective: '1000px' }}>
          <div
            className="relative w-full min-h-[400px]"
            style={{
              transform: `translateX(${translateX})`,
              opacity,
              transition: 'transform 0.18s ease, opacity 0.18s ease'
            }}
          >
            <div
              className="relative w-full min-h-[400px] cursor-pointer"
              onClick={handleFlip}
              role="button"
              tabIndex={0}
              onKeyDown={(event) => {
                if (event.key === 'Enter' || event.key === ' ') {
                  event.preventDefault()
                  handleFlip()
                }
              }}
              style={{
                transformStyle: 'preserve-3d',
                transform: showBack ? 'rotateX(180deg)' : 'rotateX(0deg)',
                transition: 'transform 0.6s cubic-bezier(0.4, 0.0, 0.2, 1)'
              }}
            >
            {/* Front of Card */}
            <div
              ref={frontRef}
              className="absolute inset-0 rounded-2xl p-8 flex flex-col justify-center items-center text-center border border-slate-200 bg-slate-50"
              style={{
                backfaceVisibility: 'hidden',
                minHeight: '400px',
                color: frontTextColor
              }}
            >
              <span
                className="text-xs uppercase tracking-wide mb-4 font-semibold"
                style={{ color: frontTextColor, opacity: 0.75 }}
              >
                Question
              </span>
              <div className="text-lg leading-relaxed font-semibold px-4">
                {currentCard.front}
              </div>
              <div className="mt-6 text-xs" style={{ color: frontTextColor, opacity: 0.65 }}>
                Click to reveal answer
              </div>
            </div>

            {/* Back of Card */}
            <div
              ref={backRef}
              className="absolute inset-0 rounded-2xl p-8 flex flex-col justify-center items-center text-center border border-slate-300 bg-slate-800"
              style={{
                backfaceVisibility: 'hidden',
                transform: 'rotateX(180deg)',
                minHeight: '400px',
                color: backTextColor
              }}
            >
              <span
                className="text-xs uppercase tracking-wide mb-4 font-semibold"
                style={{ color: backTextColor, opacity: 0.75 }}
              >
                Answer
              </span>
              <div className="text-lg leading-relaxed font-medium px-4">
                {currentCard.back}
              </div>
              <div className="mt-6 text-xs" style={{ color: backTextColor, opacity: 0.65 }}>
                Click to flip back
              </div>
            </div>
          </div>
        </div>
        </div>

        {/* Controls */}
        <div className="flex items-center gap-4">
          <button
            type="button"
            onClick={() => move(-1)}
            className="px-5 py-2.5 bg-slate-100 text-slate-700 rounded-xl hover:bg-slate-200 transition-all text-sm font-medium shadow-sm hover:shadow"
          >
            ← Previous
          </button>
          <button
            type="button"
            onClick={handleFlip}
            className="px-5 py-2.5 bg-slate-800 text-white rounded-xl hover:bg-slate-700 transition-all text-sm font-medium shadow-md hover:shadow-lg"
          >
            Flip Card
          </button>
          <button
            type="button"
            onClick={() => move(1)}
            className="px-5 py-2.5 bg-slate-100 text-slate-700 rounded-xl hover:bg-slate-200 transition-all text-sm font-medium shadow-sm hover:shadow"
          >
            Next →
          </button>
        </div>

        {/* Progress Indicator */}
        <div className="flex items-center gap-3">
          <div className="text-sm font-medium text-slate-600">
            Card {currentIndex + 1} of {total}
          </div>
          <div className="w-32 h-1.5 bg-slate-200 rounded-full overflow-hidden">
            <div
              className="h-full bg-slate-800 transition-all duration-300"
              style={{ width: `${((currentIndex + 1) / total) * 100}%` }}
            />
          </div>
        </div>
      </div>
    </div>
  )
}

export default FlashcardDeck
