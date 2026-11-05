import { useCallback, useEffect, useMemo, useRef, useState } from 'react'
import { allKana } from '../data/kana'
import { vocabulary } from '../data/vocabulary'
import type { VocabWord } from '../data/vocabulary'
import { kanaId, useKanaStore } from '../store/useKanaStore'
import type { PracticeMode } from '../store/useKanaStore'
import type { KanaCharacter } from '../types/kana'
import { speakKana } from '../utils/audio'

/** How the answer is currently being revealed below the card. */
type RevealKind = 'error' | 'hint' | null

/** A transient flash acknowledgment (green for correct, red for miss). */
type Flash = { type: 'correct' | 'error'; nonce: number }

/** The structural shape of an input ref used by the shared helpers. */
type InputRef = { current: HTMLInputElement | null }

/** Normalize what the user typed so casing and stray whitespace never matter. */
function normalize(value: string): string {
  return value.toLowerCase().trim()
}

/** True when the typed value is the primary or an alternative romanization. */
function isMatch(character: KanaCharacter, value: string): boolean {
  return (
    value === character.romaji ||
    character.alternativeRomaji?.includes(value) === true
  )
}

/** True when the typed value matches a vocabulary word's romanization. */
function isVocabMatch(word: VocabWord, value: string): boolean {
  return (
    value === word.romaji ||
    word.alternativeRomaji?.includes(value) === true
  )
}

/** Minimum queue length before we top it back up with another shuffled batch. */
const REPLENISH_THRESHOLD = 5

/** Fisher–Yates shuffle that returns a new array and leaves the input intact. */
function shuffle<T>(items: readonly T[]): T[] {
  const result = [...items]
  for (let i = result.length - 1; i > 0; i--) {
    const j = Math.floor(Math.random() * (i + 1))
    ;[result[i], result[j]] = [result[j], result[i]]
  }
  return result
}

/** Insert `item` at `index`, clamping to the end of the array. */
function insertAt<T>(items: readonly T[], index: number, item: T): T[] {
  const next = [...items]
  next.splice(Math.min(index, next.length), 0, item)
  return next
}

/** Append shuffled batches of `pool` until the queue reaches the threshold. */
function replenish<T>(queue: readonly T[], pool: readonly T[]): T[] {
  let next = [...queue]
  while (next.length < REPLENISH_THRESHOLD && pool.length > 0) {
    next = [...next, ...shuffle(pool)]
  }
  return next
}

/** Read the persisted audio preference (defaults to enabled). */
function readAudioPreference(): boolean {
  if (typeof window === 'undefined') return true
  try {
    return window.localStorage.getItem('kana-audio-enabled') !== '0'
  } catch {
    return true
  }
}

/** Pick `length` random characters (with replacement) from the selected pool. */
function randomChunk(pool: readonly KanaCharacter[], length: number): KanaCharacter[] {
  const chunk: KanaCharacter[] = []
  for (let i = 0; i < length; i++) {
    chunk.push(pool[Math.floor(Math.random() * pool.length)])
  }
  return chunk
}

/**
 * Every acceptable romanization for a chunk: the cartesian product of each
 * character's primary + alternative romanizations, concatenated in order.
 */
function chunkAnswers(characters: readonly KanaCharacter[]): string[] {
  let acc: string[] = ['']
  for (const character of characters) {
    const options = [character.romaji, ...(character.alternativeRomaji ?? [])]
    const next: string[] = []
    for (const prefix of acc) {
      for (const option of options) next.push(prefix + option)
    }
    acc = next
  }
  return acc
}

/** The primary romanization used for the reveal line. */
function chunkRomaji(characters: readonly KanaCharacter[]): string {
  return characters.map((character) => character.romaji).join('')
}

/** Shared flash state + timer for the correct/error acknowledgment overlay. */
function useFlash() {
  const [flash, setFlash] = useState<Flash | null>(null)
  const flashTimerRef = useRef<number | null>(null)
  const nonceRef = useRef(0)

  const triggerFlash = useCallback((type: Flash['type']) => {
    if (flashTimerRef.current !== null) window.clearTimeout(flashTimerRef.current)
    nonceRef.current += 1
    setFlash({ type, nonce: nonceRef.current })
    flashTimerRef.current = window.setTimeout(
      () => setFlash(null),
      type === 'correct' ? 320 : 500,
    )
  }, [])

  useEffect(() => {
    return () => {
      if (flashTimerRef.current !== null) window.clearTimeout(flashTimerRef.current)
    }
  }, [])

  return { flash, triggerFlash }
}

/** Refocus the input on stray keystrokes/clicks and wire up the "?" hint key. */
function useDrillKeybindings(inputRef: InputRef, handleHint: () => void) {
  useEffect(() => {
    const handleGlobalKeyDown = (event: KeyboardEvent) => {
      if (event.key === '?') {
        event.preventDefault()
        handleHint()
        return
      }
      if (event.key === 'Escape') return
      const target = event.target as HTMLElement | null
      if (
        target &&
        (target.tagName === 'INPUT' ||
          target.tagName === 'TEXTAREA' ||
          target.isContentEditable)
      ) {
        return
      }
      inputRef.current?.focus()
    }

    const handleGlobalClick = (event: MouseEvent) => {
      const target = event.target as HTMLElement | null
      if (
        target?.closest('button, a, input, textarea, select, [contenteditable="true"]')
      ) {
        return
      }
      inputRef.current?.focus()
    }

    window.addEventListener('keydown', handleGlobalKeyDown)
    window.addEventListener('click', handleGlobalClick)
    return () => {
      window.removeEventListener('keydown', handleGlobalKeyDown)
      window.removeEventListener('click', handleGlobalClick)
    }
  }, [inputRef, handleHint])
}

function FlashOverlay({ flash }: { flash: Flash | null }) {
  return (
    <div
      key={flash ? flash.nonce : 'idle'}
      aria-hidden="true"
      className={`pointer-events-none absolute inset-0 rounded-3xl ${
        flash?.type === 'correct'
          ? 'animate-flash-green'
          : flash?.type === 'error'
            ? 'animate-flash-red'
            : ''
      }`}
    />
  )
}

function RevealLine({ revealed, text }: { revealed: RevealKind; text: string }) {
  return (
    <div className="mt-5 flex h-6 items-center">
      {revealed && (
        <span
          className={`text-lg font-semibold ${
            revealed === 'error' ? 'text-red-600' : 'text-amber-600'
          }`}
        >
          {text}
        </span>
      )}
    </div>
  )
}

function AnswerInput({
  inputRef,
  value,
  disabled,
  onChange,
  onEnter,
}: {
  inputRef: InputRef
  value: string
  disabled: boolean
  onChange: (value: string) => void
  onEnter: () => void
}) {
  return (
    <input
      ref={inputRef}
      value={value}
      disabled={disabled}
      onChange={(event) => onChange(event.target.value)}
      onKeyDown={(event) => {
        if (event.key === 'Enter') {
          event.preventDefault()
          onEnter()
        }
      }}
      placeholder="Type the romaji…"
      autoCapitalize="none"
      autoCorrect="off"
      autoComplete="off"
      spellCheck={false}
      className="mt-3 w-64 rounded-xl border border-slate-300 bg-white px-4 py-3 text-center text-lg font-medium text-slate-900 outline-none transition focus:border-indigo-500 focus:ring-2 focus:ring-indigo-200 disabled:cursor-not-allowed disabled:opacity-60"
    />
  )
}

function HintButton({ onClick }: { onClick: () => void }) {
  return (
    <button
      type="button"
      onClick={onClick}
      className="mt-4 text-sm text-slate-400 transition hover:text-slate-700"
      title="Reveal the romaji (press ?)"
    >
      Show hint (?)
    </button>
  )
}

function FooterShortcuts() {
  return (
    <p className="mt-6 text-xs text-slate-400">
      Press <span className="font-semibold">Enter</span> to submit ·{' '}
      <span className="font-semibold">Esc</span> to return to menu ·{' '}
      <span className="font-semibold">Ctrl+S</span> /{' '}
      <span className="font-semibold">Alt+A</span> to toggle audio
    </p>
  )
}

const MODES: readonly { id: PracticeMode; label: string }[] = [
  { id: 'single', label: 'Single' },
  { id: 'chunk', label: 'Random Chunks' },
  { id: 'vocab', label: 'Vocab Words' },
]

const CHUNK_LENGTHS = [1, 2, 3, 4, 5, 6] as const

export function PracticeView() {
  const practiceMode = useKanaStore((state) => state.practiceMode)
  const setPracticeMode = useKanaStore((state) => state.setPracticeMode)
  const chunkLength = useKanaStore((state) => state.chunkLength)
  const setChunkLength = useKanaStore((state) => state.setChunkLength)
  const setCurrentView = useKanaStore((state) => state.setCurrentView)

  const [audioEnabled, setAudioEnabled] = useState<boolean>(readAudioPreference)

  const toggleAudio = useCallback(() => {
    setAudioEnabled((enabled) => !enabled)
  }, [])

  // Persist the audio preference so it survives reloads.
  useEffect(() => {
    try {
      window.localStorage.setItem('kana-audio-enabled', audioEnabled ? '1' : '0')
    } catch {
      // Ignore storage failures (private browsing, quota, etc.).
    }
  }, [audioEnabled])

  // Global shortcuts shared by every mode: Escape exits, Ctrl+S / Alt+A toggles audio.
  useEffect(() => {
    const handleGlobalKeyDown = (event: KeyboardEvent) => {
      if (event.key === 'Escape') {
        event.preventDefault()
        setCurrentView('select')
      } else if (
        (event.ctrlKey && event.code === 'KeyS') ||
        (event.altKey && event.code === 'KeyA')
      ) {
        event.preventDefault()
        toggleAudio()
      }
    }
    window.addEventListener('keydown', handleGlobalKeyDown)
    return () => window.removeEventListener('keydown', handleGlobalKeyDown)
  }, [setCurrentView, toggleAudio])

  return (
    <main className="min-h-screen bg-slate-50 text-slate-900">
      <header className="flex items-center justify-between gap-3 border-b border-slate-200 bg-white/80 px-4 py-3 backdrop-blur sm:px-6">
        <button
          type="button"
          onClick={() => setCurrentView('select')}
          className="rounded-lg border border-slate-200 bg-white px-3 py-1.5 text-sm font-medium text-slate-700 transition hover:bg-slate-50"
        >
          ← Back to Menu
        </button>
        <button
          type="button"
          onClick={toggleAudio}
          aria-label={audioEnabled ? 'Disable pronunciation audio' : 'Enable pronunciation audio'}
          aria-pressed={audioEnabled}
          title="Toggle audio (Ctrl+S or Alt+A)"
          className="rounded-lg border border-slate-200 bg-white px-2.5 py-1.5 text-base leading-none transition hover:bg-slate-50"
        >
          {audioEnabled ? '🔊' : '🔇'}
        </button>
      </header>

      <div className="mx-auto max-w-2xl px-4 pt-6 sm:px-6">
        <div className="flex gap-1 rounded-xl bg-slate-100 p-1">
          {MODES.map((mode) => (
            <button
              key={mode.id}
              type="button"
              onClick={() => setPracticeMode(mode.id)}
              className={`flex-1 rounded-lg px-3 py-2 text-sm font-medium transition ${
                practiceMode === mode.id
                  ? 'bg-white text-slate-900 shadow'
                  : 'text-slate-600 hover:text-slate-900'
              }`}
            >
              {mode.label}
            </button>
          ))}
        </div>

        {practiceMode === 'chunk' && (
          <div className="mt-3 flex flex-wrap items-center gap-2">
            <span className="text-sm font-medium text-slate-600">Length:</span>
            <div className="flex gap-1 rounded-xl bg-slate-100 p-1">
              {CHUNK_LENGTHS.map((length) => (
                <button
                  key={length}
                  type="button"
                  onClick={() => setChunkLength(length)}
                  className={`h-8 w-8 rounded-lg text-sm font-medium transition ${
                    chunkLength === length
                      ? 'bg-white text-slate-900 shadow'
                      : 'text-slate-600 hover:text-slate-900'
                  }`}
                >
                  {length}
                </button>
              ))}
            </div>
          </div>
        )}
      </div>

      {practiceMode === 'single' && <SinglePractice audioEnabled={audioEnabled} />}
      {practiceMode === 'chunk' && (
        <ChunkPractice audioEnabled={audioEnabled} chunkLength={chunkLength} />
      )}
      {practiceMode === 'vocab' && <VocabPractice audioEnabled={audioEnabled} />}
    </main>
  )
}

function SinglePractice({ audioEnabled }: { audioEnabled: boolean }) {
  const selectedIds = useKanaStore((state) => state.selectedIds)
  const setCurrentView = useKanaStore((state) => state.setCurrentView)

  const selectedIdsSet = useMemo(() => new Set(selectedIds), [selectedIds])
  const pool = useMemo(
    () => allKana.filter((character) => selectedIdsSet.has(kanaId(character))),
    [selectedIdsSet],
  )

  const [queue, setQueue] = useState<KanaCharacter[]>(() => shuffle(pool))
  const [input, setInput] = useState('')
  const [revealed, setRevealed] = useState<RevealKind>(null)
  const [shakeNonce, setShakeNonce] = useState(0)
  const [correctCount, setCorrectCount] = useState(0)
  const [answeredCount, setAnsweredCount] = useState(0)
  const [missedIds, setMissedIds] = useState<Set<string>>(() => new Set())
  const [masteredIds, setMasteredIds] = useState<Set<string>>(() => new Set())

  const { flash, triggerFlash } = useFlash()

  const inputRef = useRef<HTMLInputElement>(null)
  const missedIdsRef = useRef<Set<string>>(new Set())
  const currentMissedRef = useRef(false)

  const current: KanaCharacter | null = queue.length > 0 ? queue[0] : null

  // Longest valid answer length: used to auto-miss the moment typing overshoots.
  const targetLength = useMemo(() => {
    if (!current) return 0
    const alternatives = current.alternativeRomaji ?? []
    return Math.max(current.romaji.length, ...alternatives.map((alt) => alt.length))
  }, [current])

  // Register a miss (wrong answer or hint). The card stays on screen so the
  // answer can be revealed, then two extra copies are re-queued 3 and 7 cards
  // ahead for the "fix-my-mistakes" loop.
  const registerMiss = useCallback(
    (kind: 'error' | 'hint') => {
      if (!current) return

      if (kind === 'error') {
        setInput('')
        setRevealed('error')
        setShakeNonce((nonce) => nonce + 1)
        triggerFlash('error')
      } else {
        setRevealed('hint')
        if (audioEnabled) speakKana(current.kana)
      }

      // Only the first miss for a given card starts a new remediation cycle.
      if (currentMissedRef.current) return
      currentMissedRef.current = true

      const id = kanaId(current)
      setAnsweredCount((count) => count + 1)

      if (!missedIdsRef.current.has(id)) {
        const nextMissed = new Set(missedIdsRef.current).add(id)
        missedIdsRef.current = nextMissed
        setMissedIds(nextMissed)
      }

      setMasteredIds((previous) => {
        if (!previous.has(id)) return previous
        const next = new Set(previous)
        next.delete(id)
        return next
      })

      setQueue((previous) => {
        let next = [...previous]
        next = insertAt(next, 7, current)
        next = insertAt(next, 3, current)
        return next
      })
    },
    [current, audioEnabled, triggerFlash],
  )

  // Register a correct answer: master it if clean, advance, then replenish.
  const registerCorrect = useCallback(() => {
    if (!current) return
    const id = kanaId(current)

    setInput('')
    setRevealed(null)
    setCorrectCount((count) => count + 1)
    setAnsweredCount((count) => count + 1)

    if (!missedIdsRef.current.has(id)) {
      setMasteredIds((previous) => new Set(previous).add(id))
    }

    if (audioEnabled) speakKana(current.kana)

    currentMissedRef.current = false
    setQueue((previous) => replenish(previous.slice(1), pool))
    triggerFlash('correct')
  }, [current, audioEnabled, pool, triggerFlash])

  const handleHint = useCallback(() => {
    registerMiss('hint')
    inputRef.current?.focus()
  }, [registerMiss])

  useDrillKeybindings(inputRef, handleHint)

  useEffect(() => {
    inputRef.current?.focus()
  }, [])

  // With nothing selected there is nothing to practice: fall back to selection.
  useEffect(() => {
    if (pool.length === 0) setCurrentView('select')
  }, [pool.length, setCurrentView])

  if (pool.length === 0 || !current) return null

  const handleTyping = (raw: string) => {
    const value = normalize(raw)
    setInput(value)

    if (value === '') return
    if (isMatch(current, value)) {
      registerCorrect()
      return
    }
    if (value.length > targetLength) {
      registerMiss('error')
    }
  }

  const handleSubmit = () => {
    const value = normalize(input)
    if (value === '') return
    if (isMatch(current, value)) {
      registerCorrect()
    } else {
      registerMiss('error')
    }
  }

  const accuracy = answeredCount === 0 ? 0 : Math.round((correctCount / answeredCount) * 100)
  const remainingToMaster = Math.max(0, pool.length - masteredIds.size)
  const isReview = missedIds.has(kanaId(current))
  const scriptLabel = current.script === 'hiragana' ? 'Hiragana' : 'Katakana'

  return (
    <div className="mx-auto flex max-w-2xl flex-col items-center px-4 pt-8 sm:pt-12">
      <div className="flex items-center gap-2">
        <span className="rounded-full bg-indigo-100 px-2.5 py-1 text-xs font-semibold text-indigo-700">
          Remaining to Master: {remainingToMaster}
        </span>
        <span className="rounded-full bg-slate-100 px-3 py-1 text-xs font-medium uppercase tracking-wider text-slate-500">
          {scriptLabel}
        </span>
      </div>

      <div className="mt-4 text-xs text-slate-500 sm:text-sm">
        Answered: {answeredCount} | Accuracy: {accuracy}%
        {missedIds.size > 0 && <> · Missed: {missedIds.size}</>}
      </div>

      <div className="relative mt-6">
        {isReview && (
          <span className="absolute -top-3 left-1/2 z-10 -translate-x-1/2 rounded-full bg-amber-100 px-2.5 py-0.5 text-[11px] font-semibold uppercase tracking-wide text-amber-700">
            Review
          </span>
        )}
        <div
          key={shakeNonce}
          className={`flex h-56 w-56 items-center justify-center rounded-3xl border bg-white shadow-sm sm:h-64 sm:w-64 ${
            isReview ? 'border-amber-400 ring-2 ring-amber-200' : 'border-slate-200'
          } ${shakeNonce > 0 ? 'animate-shake' : ''}`}
        >
          <span className="text-[8rem] font-semibold leading-none sm:text-[9rem]">
            {current.kana}
          </span>
        </div>
        <FlashOverlay flash={flash} />
      </div>

      <RevealLine revealed={revealed} text={current.romaji} />

      <AnswerInput
        inputRef={inputRef}
        value={input}
        disabled={false}
        onChange={handleTyping}
        onEnter={handleSubmit}
      />

      <HintButton onClick={handleHint} />
      <FooterShortcuts />
    </div>
  )
}

function ChunkPractice({
  audioEnabled,
  chunkLength,
}: {
  audioEnabled: boolean
  chunkLength: number
}) {
  const selectedIds = useKanaStore((state) => state.selectedIds)
  const setCurrentView = useKanaStore((state) => state.setCurrentView)

  const selectedIdsSet = useMemo(() => new Set(selectedIds), [selectedIds])
  const pool = useMemo(
    () => allKana.filter((character) => selectedIdsSet.has(kanaId(character))),
    [selectedIdsSet],
  )

  const [chunk, setChunk] = useState<KanaCharacter[]>(() => randomChunk(pool, chunkLength))
  const [input, setInput] = useState('')
  const [revealed, setRevealed] = useState<RevealKind>(null)
  const [shakeNonce, setShakeNonce] = useState(0)
  const [correctCount, setCorrectCount] = useState(0)
  const [answeredCount, setAnsweredCount] = useState(0)

  const { flash, triggerFlash } = useFlash()
  const inputRef = useRef<HTMLInputElement>(null)

  const answers = useMemo(() => chunkAnswers(chunk), [chunk])
  const romaji = useMemo(() => chunkRomaji(chunk), [chunk])
  const chunkKana = useMemo(() => chunk.map((character) => character.kana).join(''), [chunk])
  const targetLength = useMemo(
    () => answers.reduce((max, answer) => Math.max(max, answer.length), 0),
    [answers],
  )

  // Regenerate the chunk whenever the requested length changes.
  useEffect(() => {
    if (pool.length > 0) setChunk(randomChunk(pool, chunkLength))
  }, [pool, chunkLength])

  const registerCorrect = useCallback(() => {
    setInput('')
    setRevealed(null)
    setCorrectCount((count) => count + 1)
    setAnsweredCount((count) => count + 1)
    if (audioEnabled) speakKana(chunkKana)
    setChunk(randomChunk(pool, chunkLength))
    triggerFlash('correct')
  }, [audioEnabled, chunkKana, pool, chunkLength, triggerFlash])

  const registerMiss = useCallback(() => {
    setInput('')
    setRevealed('error')
    setShakeNonce((nonce) => nonce + 1)
    setAnsweredCount((count) => count + 1)
    triggerFlash('error')
  }, [triggerFlash])

  const handleHint = useCallback(() => {
    setRevealed('hint')
    if (audioEnabled) speakKana(chunkKana)
    inputRef.current?.focus()
  }, [audioEnabled, chunkKana])

  useDrillKeybindings(inputRef, handleHint)

  useEffect(() => {
    inputRef.current?.focus()
  }, [])

  useEffect(() => {
    if (pool.length === 0) setCurrentView('select')
  }, [pool.length, setCurrentView])

  if (pool.length === 0 || chunk.length === 0) return null

  const handleTyping = (raw: string) => {
    const value = normalize(raw)
    setInput(value)

    if (value === '') return
    if (answers.includes(value)) {
      registerCorrect()
      return
    }
    if (value.length > targetLength) {
      registerMiss()
    }
  }

  const handleSubmit = () => {
    const value = normalize(input)
    if (value === '') return
    if (answers.includes(value)) {
      registerCorrect()
    } else {
      registerMiss()
    }
  }

  const accuracy = answeredCount === 0 ? 0 : Math.round((correctCount / answeredCount) * 100)

  return (
    <div className="mx-auto flex max-w-2xl flex-col items-center px-4 pt-8 sm:pt-12">
      <div className="text-xs text-slate-500 sm:text-sm">
        Answered: {answeredCount} | Accuracy: {accuracy}%
      </div>

      <div className="relative mt-6">
        <div
          key={shakeNonce}
          className={`flex h-56 min-w-[18rem] items-center justify-center gap-3 rounded-3xl border bg-white px-8 shadow-sm sm:h-64 ${
            shakeNonce > 0 ? 'animate-shake border-red-300' : 'border-slate-200'
          }`}
        >
          {chunk.map((character, index) => (
            <span key={index} className="text-5xl font-semibold leading-none sm:text-6xl">
              {character.kana}
            </span>
          ))}
        </div>
        <FlashOverlay flash={flash} />
      </div>

      <RevealLine revealed={revealed} text={romaji} />

      <AnswerInput
        inputRef={inputRef}
        value={input}
        disabled={false}
        onChange={handleTyping}
        onEnter={handleSubmit}
      />

      <HintButton onClick={handleHint} />
      <FooterShortcuts />
    </div>
  )
}

function VocabPractice({ audioEnabled }: { audioEnabled: boolean }) {
  const selectedIds = useKanaStore((state) => state.selectedIds)
  const setCurrentView = useKanaStore((state) => state.setCurrentView)

  const selectedIdsSet = useMemo(() => new Set(selectedIds), [selectedIds])
  const vocabPool = useMemo(
    () => vocabulary.filter((word) => word.characterIds.every((id) => selectedIdsSet.has(id))),
    [selectedIdsSet],
  )

  const [queue, setQueue] = useState<VocabWord[]>(() => replenish([], vocabPool))
  const [input, setInput] = useState('')
  const [revealed, setRevealed] = useState<RevealKind>(null)
  const [shakeNonce, setShakeNonce] = useState(0)
  const [meaningShown, setMeaningShown] = useState(false)
  const [locked, setLocked] = useState(false)
  const [correctCount, setCorrectCount] = useState(0)
  const [answeredCount, setAnsweredCount] = useState(0)

  const { flash, triggerFlash } = useFlash()
  const inputRef = useRef<HTMLInputElement>(null)
  const advanceTimerRef = useRef<number | null>(null)
  const missedRef = useRef(false)

  const current: VocabWord | null = queue.length > 0 ? queue[0] : null

  const targetLength = useMemo(() => {
    if (!current) return 0
    const alternatives = current.alternativeRomaji ?? []
    return Math.max(current.romaji.length, ...alternatives.map((alt) => alt.length))
  }, [current])

  const registerCorrect = useCallback(() => {
    if (!current) return

    setInput('')
    setRevealed(null)
    setMeaningShown(true)
    setCorrectCount((count) => count + 1)
    setAnsweredCount((count) => count + 1)
    missedRef.current = false

    if (audioEnabled) speakKana(current.kana)
    triggerFlash('correct')

    setLocked(true)
    if (advanceTimerRef.current !== null) window.clearTimeout(advanceTimerRef.current)
    advanceTimerRef.current = window.setTimeout(() => {
      setMeaningShown(false)
      setLocked(false)
      setQueue((previous) => replenish(previous.slice(1), vocabPool))
      advanceTimerRef.current = null
    }, 600)
  }, [current, audioEnabled, vocabPool, triggerFlash])

  const registerMiss = useCallback(
    (kind: 'error' | 'hint') => {
      if (!current) return

      if (kind === 'error') {
        setInput('')
        setRevealed('error')
        setShakeNonce((nonce) => nonce + 1)
        triggerFlash('error')
      } else {
        setRevealed('hint')
        if (audioEnabled) speakKana(current.kana)
      }

      if (missedRef.current) return
      missedRef.current = true
      setAnsweredCount((count) => count + 1)

      setQueue((previous) => {
        let next = [...previous]
        next = insertAt(next, 7, current)
        next = insertAt(next, 3, current)
        return next
      })
    },
    [current, audioEnabled, triggerFlash],
  )

  const handleHint = useCallback(() => {
    if (locked) return
    registerMiss('hint')
    inputRef.current?.focus()
  }, [locked, registerMiss])

  useDrillKeybindings(inputRef, handleHint)

  useEffect(() => {
    inputRef.current?.focus()
  }, [])

  useEffect(() => {
    return () => {
      if (advanceTimerRef.current !== null) window.clearTimeout(advanceTimerRef.current)
    }
  }, [])

  if (vocabPool.length === 0) {
    return (
      <div className="mx-auto flex max-w-2xl flex-col items-center px-4 pt-16 text-center sm:pt-24">
        <div className="w-full rounded-3xl border border-slate-200 bg-white p-10 shadow-sm">
          <p className="text-lg text-slate-700">
            No vocabulary words match your selected kana. Select more rows in the menu!
          </p>
          <button
            type="button"
            onClick={() => setCurrentView('select')}
            className="mt-6 rounded-lg bg-indigo-600 px-5 py-2 text-sm font-semibold text-white transition hover:bg-indigo-500"
          >
            Back to Selection
          </button>
        </div>
      </div>
    )
  }

  if (!current) return null

  const handleTyping = (raw: string) => {
    const value = normalize(raw)
    setInput(value)

    if (value === '') return
    if (isVocabMatch(current, value)) {
      registerCorrect()
      return
    }
    if (value.length > targetLength) {
      registerMiss('error')
    }
  }

  const handleSubmit = () => {
    const value = normalize(input)
    if (value === '') return
    if (isVocabMatch(current, value)) {
      registerCorrect()
    } else {
      registerMiss('error')
    }
  }

  const accuracy = answeredCount === 0 ? 0 : Math.round((correctCount / answeredCount) * 100)

  return (
    <div className="mx-auto flex max-w-2xl flex-col items-center px-4 pt-8 sm:pt-12">
      <div className="text-xs text-slate-500 sm:text-sm">
        Answered: {answeredCount} | Accuracy: {accuracy}%
      </div>

      <div className="relative mt-6">
        <div
          key={shakeNonce}
          className={`flex h-56 min-w-[18rem] items-center justify-center rounded-3xl border bg-white px-8 shadow-sm sm:h-64 ${
            shakeNonce > 0 ? 'animate-shake border-red-300' : 'border-slate-200'
          }`}
        >
          <span className="text-5xl font-semibold leading-none sm:text-6xl">
            {current.kana}
          </span>
        </div>
        <FlashOverlay flash={flash} />
      </div>

      <div className="mt-5 flex h-8 items-center">
        {meaningShown && (
          <span className="text-xl font-bold text-green-600">{current.meaning}</span>
        )}
      </div>

      <RevealLine revealed={revealed} text={current.romaji} />

      <AnswerInput
        inputRef={inputRef}
        value={input}
        disabled={locked}
        onChange={handleTyping}
        onEnter={handleSubmit}
      />

      <HintButton onClick={handleHint} />
      <FooterShortcuts />
    </div>
  )
}
