import { create } from 'zustand'
import { persist } from 'zustand/middleware'
import { hiragana, katakana } from '../data/kana'
import type { KanaCharacter, KanaScript } from '../types/kana'

/** Which screen the learner is currently on. */
export type KanaView = 'select' | 'practice'

/** Which practice drill the learner is currently running. */
export type PracticeMode = 'single' | 'chunk' | 'vocab'

/**
 * Build the stable, unique id used to identify a single kana character
 * across scripts, e.g. `hiragana-あ` or `katakana-ア`.
 */
export function kanaId(character: KanaCharacter): string {
  return `${character.script}-${character.kana}`
}

interface KanaStore {
  /** Unique ids for every selected character. */
  selectedIds: string[]
  currentView: KanaView
  practiceMode: PracticeMode
  chunkLength: number
  toggleCharacter: (id: string) => void
  toggleRow: (ids: string[]) => void
  selectAll: (script?: KanaScript) => void
  clearAll: (script?: KanaScript) => void
  setCurrentView: (view: KanaView) => void
  setPracticeMode: (mode: PracticeMode) => void
  setChunkLength: (length: number) => void
}

const HIRAGANA_IDS = hiragana.map(kanaId)
const KATAKANA_IDS = katakana.map(kanaId)
const ALL_IDS = [...HIRAGANA_IDS, ...KATAKANA_IDS]

/** All ids for a script, or every id when no script is provided. */
function idsForScript(script?: KanaScript): string[] {
  if (script === 'hiragana') return HIRAGANA_IDS
  if (script === 'katakana') return KATAKANA_IDS
  return ALL_IDS
}

export const useKanaStore = create<KanaStore>()(
  persist(
    (set) => ({
      selectedIds: [],
      currentView: 'select',
      practiceMode: 'single',
      chunkLength: 3,

      toggleCharacter: (id) =>
        set((state) => ({
          selectedIds: state.selectedIds.includes(id)
            ? state.selectedIds.filter((existing) => existing !== id)
            : [...state.selectedIds, id],
        })),

      toggleRow: (ids) =>
        set((state) => {
          const allSelected =
            ids.length > 0 && ids.every((id) => state.selectedIds.includes(id))

          if (allSelected) {
            const removable = new Set(ids)
            return {
              selectedIds: state.selectedIds.filter((id) => !removable.has(id)),
            }
          }

          const next = new Set(state.selectedIds)
          for (const id of ids) next.add(id)
          return { selectedIds: [...next] }
        }),

      selectAll: (script) =>
        set((state) => {
          const next = new Set(state.selectedIds)
          for (const id of idsForScript(script)) next.add(id)
          return { selectedIds: [...next] }
        }),

      clearAll: (script) =>
        set((state) => {
          const removable = new Set(idsForScript(script))
          return {
            selectedIds: state.selectedIds.filter((id) => !removable.has(id)),
          }
        }),

      setCurrentView: (currentView) => set({ currentView }),

      setPracticeMode: (practiceMode) => set({ practiceMode }),

      setChunkLength: (chunkLength) =>
        set({ chunkLength: Math.min(6, Math.max(1, Math.round(chunkLength))) }),
    }),
    { name: 'kana-selection' },
  ),
)
