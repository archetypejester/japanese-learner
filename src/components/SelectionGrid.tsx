import { useState } from 'react'
import type { KanaCharacter, KanaScript } from '../types/kana'
import { getKanaGroups } from '../utils/kanaGroups'
import type { KanaRow } from '../utils/kanaGroups'
import { kanaId, useKanaStore } from '../store/useKanaStore'

type ActiveTab = 'hiragana' | 'katakana' | 'both'

const TABS: readonly { id: ActiveTab; label: string }[] = [
  { id: 'hiragana', label: 'Hiragana' },
  { id: 'katakana', label: 'Katakana' },
  { id: 'both', label: 'Both' },
]

export function SelectionGrid() {
  const [activeTab, setActiveTab] = useState<ActiveTab>('hiragana')

  const selectedCount = useKanaStore((state) => state.selectedIds.length)
  const selectAll = useKanaStore((state) => state.selectAll)
  const clearAll = useKanaStore((state) => state.clearAll)
  const setCurrentView = useKanaStore((state) => state.setCurrentView)

  const scripts: KanaScript[] =
    activeTab === 'both' ? ['hiragana', 'katakana'] : [activeTab]

  const handleSelectAll = () => {
    selectAll(activeTab === 'both' ? undefined : activeTab)
  }

  const handleClearAll = () => {
    clearAll(activeTab === 'both' ? undefined : activeTab)
  }

  return (
    <div className="pb-28">
      <div className="flex gap-1 rounded-xl bg-slate-100 p-1">
        {TABS.map((tab) => (
          <button
            key={tab.id}
            type="button"
            onClick={() => setActiveTab(tab.id)}
            className={`flex-1 rounded-lg px-4 py-2 text-sm font-medium transition sm:flex-none sm:px-6 ${
              activeTab === tab.id
                ? 'bg-white text-slate-900 shadow'
                : 'text-slate-600 hover:text-slate-900'
            }`}
          >
            {tab.label}
          </button>
        ))}
      </div>

      <div className={activeTab === 'both' ? 'mt-8 grid gap-8 lg:grid-cols-2' : 'mt-8'}>
        {scripts.map((script) => (
          <ScriptGrid key={script} script={script} />
        ))}
      </div>

      <div className="fixed inset-x-0 bottom-0 border-t border-slate-200 bg-white/95 backdrop-blur">
        <div className="mx-auto flex max-w-5xl flex-wrap items-center gap-3 px-4 py-3 sm:px-6">
          <button
            type="button"
            onClick={handleSelectAll}
            className="rounded-lg border border-slate-200 bg-white px-4 py-2 text-sm font-medium text-slate-700 transition hover:bg-slate-50"
          >
            Select All
          </button>
          <button
            type="button"
            onClick={handleClearAll}
            className="rounded-lg border border-slate-200 bg-white px-4 py-2 text-sm font-medium text-slate-700 transition hover:bg-slate-50"
          >
            Clear All
          </button>
          <span className="ml-auto text-sm text-slate-600">
            {selectedCount} character{selectedCount === 1 ? '' : 's'} selected
          </span>
          <button
            type="button"
            onClick={() => setCurrentView('practice')}
            disabled={selectedCount === 0}
            className="rounded-lg bg-indigo-600 px-5 py-2 text-sm font-semibold text-white transition hover:bg-indigo-500 disabled:cursor-not-allowed disabled:opacity-40"
          >
            Start Practice
          </button>
        </div>
      </div>
    </div>
  )
}

function ScriptGrid({ script }: { script: KanaScript }) {
  const groups = getKanaGroups(script)

  return (
    <section>
      <h2 className="text-lg font-semibold text-slate-700">
        {script === 'hiragana' ? 'Hiragana' : 'Katakana'}
      </h2>
      {groups.map((group) => (
        <div key={group.id} className="mt-5">
          <h3 className="text-xs font-semibold uppercase tracking-wider text-slate-400">
            {group.title}
          </h3>
          <div className="mt-2 space-y-2">
            {group.rows.map((row) => (
              <KanaRowView key={row.id} row={row} />
            ))}
          </div>
        </div>
      ))}
    </section>
  )
}

function KanaRowView({ row }: { row: KanaRow }) {
  const ids = row.characters.map(kanaId)
  const allSelected = useKanaStore((state) =>
    ids.every((id) => state.selectedIds.includes(id)),
  )
  const someSelected = useKanaStore((state) =>
    ids.some((id) => state.selectedIds.includes(id)),
  )
  const toggleRow = useKanaStore((state) => state.toggleRow)

  const rowClass = allSelected
    ? 'border-indigo-600 bg-indigo-600 text-white'
    : someSelected
      ? 'border-indigo-200 bg-indigo-100 text-indigo-700'
      : 'border-slate-200 bg-white text-slate-500 hover:bg-slate-100'

  return (
    <div className="flex items-center gap-2">
      <button
        type="button"
        onClick={() => toggleRow(ids)}
        aria-pressed={allSelected}
        className={`flex w-14 shrink-0 items-center justify-center rounded-lg border py-2 text-sm font-semibold transition ${rowClass}`}
      >
        {row.label}
      </button>
      <div className="flex flex-1 flex-wrap gap-1.5">
        {row.characters.map((character) => (
          <KanaTile key={kanaId(character)} character={character} />
        ))}
      </div>
    </div>
  )
}

function KanaTile({ character }: { character: KanaCharacter }) {
  const id = kanaId(character)
  const selected = useKanaStore((state) => state.selectedIds.includes(id))
  const toggleCharacter = useKanaStore((state) => state.toggleCharacter)

  return (
    <button
      type="button"
      onClick={() => toggleCharacter(id)}
      aria-pressed={selected}
      className={`flex aspect-square w-16 flex-col items-center justify-center gap-0.5 rounded-xl border shadow-sm transition ${
        selected
          ? 'border-indigo-600 bg-indigo-600 text-white'
          : 'border-slate-200 bg-white text-slate-900 hover:border-indigo-300 hover:bg-indigo-50'
      }`}
    >
      <span className="text-2xl leading-none">{character.kana}</span>
      <span
        className={`text-[11px] leading-none ${
          selected ? 'text-indigo-100' : 'text-slate-400'
        }`}
      >
        {character.romaji}
      </span>
    </button>
  )
}

