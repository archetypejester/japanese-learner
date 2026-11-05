import { hiragana, katakana } from '../data/kana'
import type { KanaCharacter, KanaScript } from '../types/kana'

export type KanaGroupId = 'basic' | 'dakuten' | 'yoon'

/** A traditional kana row, e.g. the "Ka" row (か・き・く・け・こ). */
export interface KanaRow {
  id: string
  label: string
  characters: KanaCharacter[]
}

/** A visual section of the selection grid. */
export interface KanaGroup {
  id: KanaGroupId
  title: string
  rows: KanaRow[]
}

interface RowDefinition {
  id: string
  label: string
}

// ── Row order / labels ──────────────────────────────────────────────────────

const BASIC_ROWS: RowDefinition[] = [
  { id: 'a', label: 'A' },
  { id: 'ka', label: 'Ka' },
  { id: 'sa', label: 'Sa' },
  { id: 'ta', label: 'Ta' },
  { id: 'na', label: 'Na' },
  { id: 'ha', label: 'Ha' },
  { id: 'ma', label: 'Ma' },
  { id: 'ya', label: 'Ya' },
  { id: 'ra', label: 'Ra' },
  { id: 'wa', label: 'Wa' },
  { id: 'n', label: 'N' },
]

const DAKUTEN_ROWS: RowDefinition[] = [
  { id: 'ga', label: 'Ga' },
  { id: 'za', label: 'Za' },
  { id: 'da', label: 'Da' },
  { id: 'ba', label: 'Ba' },
  { id: 'pa', label: 'Pa' },
]

const YOON_ROWS: RowDefinition[] = [
  { id: 'kya', label: 'Kya' },
  { id: 'sha', label: 'Sha' },
  { id: 'cha', label: 'Cha' },
  { id: 'nya', label: 'Nya' },
  { id: 'hya', label: 'Hya' },
  { id: 'mya', label: 'Mya' },
  { id: 'rya', label: 'Rya' },
  { id: 'gya', label: 'Gya' },
  { id: 'ja', label: 'Ja' },
  // ぢゃ・ぢゅ・ぢょ are rare but present in the dataset, so they get their own row.
  { id: 'dya', label: 'Dya' },
  { id: 'bya', label: 'Bya' },
  { id: 'pya', label: 'Pya' },
]

// ── Romaji → row key resolution ─────────────────────────────────────────────

const BASIC_ROW_KEYS: Record<string, string> = {
  a: 'a', i: 'a', u: 'a', e: 'a', o: 'a',
  ka: 'ka', ki: 'ka', ku: 'ka', ke: 'ka', ko: 'ka',
  sa: 'sa', shi: 'sa', su: 'sa', se: 'sa', so: 'sa',
  ta: 'ta', chi: 'ta', tsu: 'ta', te: 'ta', to: 'ta',
  na: 'na', ni: 'na', nu: 'na', ne: 'na', no: 'na',
  ha: 'ha', hi: 'ha', fu: 'ha', he: 'ha', ho: 'ha',
  ma: 'ma', mi: 'ma', mu: 'ma', me: 'ma', mo: 'ma',
  ya: 'ya', yu: 'ya', yo: 'ya',
  ra: 'ra', ri: 'ra', ru: 'ra', re: 'ra', ro: 'ra',
  wa: 'wa', wo: 'wa',
  n: 'n',
}

const DAKUTEN_ROW_KEYS: Record<string, string> = {
  ga: 'ga', gi: 'ga', gu: 'ga', ge: 'ga', go: 'ga',
  za: 'za', ze: 'za', zo: 'za',
  da: 'da', de: 'da', do: 'da',
  ba: 'ba', bi: 'ba', bu: 'ba', be: 'ba', bo: 'ba',
  pa: 'pa', pi: 'pa', pu: 'pa', pe: 'pa', po: 'pa',
}

const YOON_ROW_KEYS: Record<string, string> = {
  kya: 'kya', kyu: 'kya', kyo: 'kya',
  gya: 'gya', gyu: 'gya', gyo: 'gya',
  sha: 'sha', shu: 'sha', sho: 'sha',
  cha: 'cha', chu: 'cha', cho: 'cha',
  nya: 'nya', nyu: 'nya', nyo: 'nya',
  hya: 'hya', hyu: 'hya', hyo: 'hya',
  mya: 'mya', myu: 'mya', myo: 'mya',
  rya: 'rya', ryu: 'rya', ryo: 'rya',
  bya: 'bya', byu: 'bya', byo: 'bya',
  pya: 'pya', pyu: 'pya', pyo: 'pya',
}

/**
 * Resolve the row a character belongs to. Some romanizations are shared
 * across rows (じ/ぢ, ず/づ, じゃ/ぢゃ), so `alternativeRomaji` is used to
 * disambiguate them.
 */
function resolveRowKey(character: KanaCharacter): string {
  const { romaji, category, alternativeRomaji } = character
  const alternatives = alternativeRomaji ?? []

  if (category === 'basic') {
    return BASIC_ROW_KEYS[romaji] ?? `basic:${romaji}`
  }

  if (category === 'dakuten' || category === 'handakuten') {
    if (romaji === 'ji') return alternatives.includes('di') ? 'da' : 'za'
    if (romaji === 'zu') return alternatives.includes('du') ? 'da' : 'za'
    return DAKUTEN_ROW_KEYS[romaji] ?? `${category}:${romaji}`
  }

  // Yōon. ぢゃ/ぢゅ/ぢょ use "dy…" alternatives, while じゃ/じゅ/じょ use "zy…".
  if (romaji === 'ja' || romaji === 'ju' || romaji === 'jo') {
    return alternatives.some((alt) => alt.startsWith('dy')) ? 'dya' : 'ja'
  }

  return YOON_ROW_KEYS[romaji] ?? `yoon:${romaji}`
}

function buildRows(
  definitions: RowDefinition[],
  byRow: Map<string, KanaCharacter[]>,
): KanaRow[] {
  return definitions.map((definition) => ({
    id: definition.id,
    label: definition.label,
    characters: byRow.get(definition.id) ?? [],
  }))
}

/** Group a script's characters into the Basic, Dakuten and Yōon sections. */
export function getKanaGroups(script: KanaScript): KanaGroup[] {
  const characters = script === 'hiragana' ? hiragana : katakana

  const byRow = new Map<string, KanaCharacter[]>()
  for (const character of characters) {
    const key = resolveRowKey(character)
    const row = byRow.get(key) ?? []
    row.push(character)
    byRow.set(key, row)
  }

  return [
    { id: 'basic', title: 'Basic', rows: buildRows(BASIC_ROWS, byRow) },
    {
      id: 'dakuten',
      title: 'Dakuten / Handakuten',
      rows: buildRows(DAKUTEN_ROWS, byRow),
    },
    { id: 'yoon', title: 'Yōon', rows: buildRows(YOON_ROWS, byRow) },
  ]
}
