import type { KanaCategory, KanaCharacter, KanaScript } from '../types/kana'

/**
 * A single kana mora, expressed with both its Hiragana and Katakana forms.
 * Each entry appears once here; the exported Hiragana/Katakana arrays are
 * derived from this list so the romanization data stays in one place.
 */
interface KanaEntry {
  hiragana: string
  katakana: string
  romaji: string
  alternativeRomaji?: string[]
  category: KanaCategory
}

/**
 * The complete set of standard kana, in gojūon order.
 *
 * Coverage:
 *   - 46 basic (seion) mora
 *   - 20 dakuten (voiced) mora
 *   -  5 handakuten (semi-voiced) mora
 *   - 36 yoon (contracted) mora, including voiced/semi-voiced forms
 *
 * Total: 107 mora per script (214 characters across Hiragana + Katakana).
 *
 * Notes:
 *   - Obsolete kana (ゐ/ゑ) and the small っ/ー marks are intentionally excluded.
 *   - ぢゃ・ぢゅ・ぢょ are included for completeness but are rare in modern Japanese.
 *   - `alternativeRomaji` lists Kunrei-shiki / Nihon-shiki spellings.
 */
const kanaEntries: KanaEntry[] = [
  // ── Vowels ────────────────────────────────────────────────────────────────
  { hiragana: 'あ', katakana: 'ア', romaji: 'a', category: 'basic' },
  { hiragana: 'い', katakana: 'イ', romaji: 'i', category: 'basic' },
  { hiragana: 'う', katakana: 'ウ', romaji: 'u', category: 'basic' },
  { hiragana: 'え', katakana: 'エ', romaji: 'e', category: 'basic' },
  { hiragana: 'お', katakana: 'オ', romaji: 'o', category: 'basic' },

  // ── K row (か行) ──────────────────────────────────────────────────────────
  { hiragana: 'か', katakana: 'カ', romaji: 'ka', category: 'basic' },
  { hiragana: 'き', katakana: 'キ', romaji: 'ki', category: 'basic' },
  { hiragana: 'く', katakana: 'ク', romaji: 'ku', category: 'basic' },
  { hiragana: 'け', katakana: 'ケ', romaji: 'ke', category: 'basic' },
  { hiragana: 'こ', katakana: 'コ', romaji: 'ko', category: 'basic' },
  // Dakuten (が行)
  { hiragana: 'が', katakana: 'ガ', romaji: 'ga', category: 'dakuten' },
  { hiragana: 'ぎ', katakana: 'ギ', romaji: 'gi', category: 'dakuten' },
  { hiragana: 'ぐ', katakana: 'グ', romaji: 'gu', category: 'dakuten' },
  { hiragana: 'げ', katakana: 'ゲ', romaji: 'ge', category: 'dakuten' },
  { hiragana: 'ご', katakana: 'ゴ', romaji: 'go', category: 'dakuten' },
  // Yoon
  { hiragana: 'きゃ', katakana: 'キャ', romaji: 'kya', category: 'yoon' },
  { hiragana: 'きゅ', katakana: 'キュ', romaji: 'kyu', category: 'yoon' },
  { hiragana: 'きょ', katakana: 'キョ', romaji: 'kyo', category: 'yoon' },
  // Yoon + dakuten (ぎゃ行)
  { hiragana: 'ぎゃ', katakana: 'ギャ', romaji: 'gya', category: 'yoon' },
  { hiragana: 'ぎゅ', katakana: 'ギュ', romaji: 'gyu', category: 'yoon' },
  { hiragana: 'ぎょ', katakana: 'ギョ', romaji: 'gyo', category: 'yoon' },

  // ── S row (さ行) ──────────────────────────────────────────────────────────
  { hiragana: 'さ', katakana: 'サ', romaji: 'sa', category: 'basic' },
  { hiragana: 'し', katakana: 'シ', romaji: 'shi', alternativeRomaji: ['si'], category: 'basic' },
  { hiragana: 'す', katakana: 'ス', romaji: 'su', category: 'basic' },
  { hiragana: 'せ', katakana: 'セ', romaji: 'se', category: 'basic' },
  { hiragana: 'そ', katakana: 'ソ', romaji: 'so', category: 'basic' },
  // Dakuten (ざ行)
  { hiragana: 'ざ', katakana: 'ザ', romaji: 'za', category: 'dakuten' },
  { hiragana: 'じ', katakana: 'ジ', romaji: 'ji', alternativeRomaji: ['zi'], category: 'dakuten' },
  { hiragana: 'ず', katakana: 'ズ', romaji: 'zu', category: 'dakuten' },
  { hiragana: 'ぜ', katakana: 'ゼ', romaji: 'ze', category: 'dakuten' },
  { hiragana: 'ぞ', katakana: 'ゾ', romaji: 'zo', category: 'dakuten' },
  // Yoon (しゃ行)
  { hiragana: 'しゃ', katakana: 'シャ', romaji: 'sha', alternativeRomaji: ['sya'], category: 'yoon' },
  { hiragana: 'しゅ', katakana: 'シュ', romaji: 'shu', alternativeRomaji: ['syu'], category: 'yoon' },
  { hiragana: 'しょ', katakana: 'ショ', romaji: 'sho', alternativeRomaji: ['syo'], category: 'yoon' },
  // Yoon + dakuten (じゃ行)
  { hiragana: 'じゃ', katakana: 'ジャ', romaji: 'ja', alternativeRomaji: ['zya'], category: 'yoon' },
  { hiragana: 'じゅ', katakana: 'ジュ', romaji: 'ju', alternativeRomaji: ['zyu'], category: 'yoon' },
  { hiragana: 'じょ', katakana: 'ジョ', romaji: 'jo', alternativeRomaji: ['zyo'], category: 'yoon' },

  // ── T row (た行) ──────────────────────────────────────────────────────────
  { hiragana: 'た', katakana: 'タ', romaji: 'ta', category: 'basic' },
  { hiragana: 'ち', katakana: 'チ', romaji: 'chi', alternativeRomaji: ['ti'], category: 'basic' },
  { hiragana: 'つ', katakana: 'ツ', romaji: 'tsu', alternativeRomaji: ['tu'], category: 'basic' },
  { hiragana: 'て', katakana: 'テ', romaji: 'te', category: 'basic' },
  { hiragana: 'と', katakana: 'ト', romaji: 'to', category: 'basic' },
  // Dakuten (だ行)
  { hiragana: 'だ', katakana: 'ダ', romaji: 'da', category: 'dakuten' },
  { hiragana: 'ぢ', katakana: 'ヂ', romaji: 'ji', alternativeRomaji: ['di'], category: 'dakuten' },
  { hiragana: 'づ', katakana: 'ヅ', romaji: 'zu', alternativeRomaji: ['du'], category: 'dakuten' },
  { hiragana: 'で', katakana: 'デ', romaji: 'de', category: 'dakuten' },
  { hiragana: 'ど', katakana: 'ド', romaji: 'do', category: 'dakuten' },
  // Yoon (ちゃ行)
  { hiragana: 'ちゃ', katakana: 'チャ', romaji: 'cha', alternativeRomaji: ['tya'], category: 'yoon' },
  { hiragana: 'ちゅ', katakana: 'チュ', romaji: 'chu', alternativeRomaji: ['tyu'], category: 'yoon' },
  { hiragana: 'ちょ', katakana: 'チョ', romaji: 'cho', alternativeRomaji: ['tyo'], category: 'yoon' },
  // Yoon + dakuten (ぢゃ行 — rare in modern Japanese)
  { hiragana: 'ぢゃ', katakana: 'ヂャ', romaji: 'ja', alternativeRomaji: ['dya'], category: 'yoon' },
  { hiragana: 'ぢゅ', katakana: 'ヂュ', romaji: 'ju', alternativeRomaji: ['dyu'], category: 'yoon' },
  { hiragana: 'ぢょ', katakana: 'ヂョ', romaji: 'jo', alternativeRomaji: ['dyo'], category: 'yoon' },

  // ── N row (な行) ──────────────────────────────────────────────────────────
  { hiragana: 'な', katakana: 'ナ', romaji: 'na', category: 'basic' },
  { hiragana: 'に', katakana: 'ニ', romaji: 'ni', category: 'basic' },
  { hiragana: 'ぬ', katakana: 'ヌ', romaji: 'nu', category: 'basic' },
  { hiragana: 'ね', katakana: 'ネ', romaji: 'ne', category: 'basic' },
  { hiragana: 'の', katakana: 'ノ', romaji: 'no', category: 'basic' },
  // Yoon (にゃ行)
  { hiragana: 'にゃ', katakana: 'ニャ', romaji: 'nya', category: 'yoon' },
  { hiragana: 'にゅ', katakana: 'ニュ', romaji: 'nyu', category: 'yoon' },
  { hiragana: 'にょ', katakana: 'ニョ', romaji: 'nyo', category: 'yoon' },

  // ── H row (は行) ──────────────────────────────────────────────────────────
  { hiragana: 'は', katakana: 'ハ', romaji: 'ha', category: 'basic' },
  { hiragana: 'ひ', katakana: 'ヒ', romaji: 'hi', category: 'basic' },
  { hiragana: 'ふ', katakana: 'フ', romaji: 'fu', alternativeRomaji: ['hu'], category: 'basic' },
  { hiragana: 'へ', katakana: 'ヘ', romaji: 'he', category: 'basic' },
  { hiragana: 'ほ', katakana: 'ホ', romaji: 'ho', category: 'basic' },
  // Dakuten (ば行)
  { hiragana: 'ば', katakana: 'バ', romaji: 'ba', category: 'dakuten' },
  { hiragana: 'び', katakana: 'ビ', romaji: 'bi', category: 'dakuten' },
  { hiragana: 'ぶ', katakana: 'ブ', romaji: 'bu', category: 'dakuten' },
  { hiragana: 'べ', katakana: 'ベ', romaji: 'be', category: 'dakuten' },
  { hiragana: 'ぼ', katakana: 'ボ', romaji: 'bo', category: 'dakuten' },
  // Handakuten (ぱ行)
  { hiragana: 'ぱ', katakana: 'パ', romaji: 'pa', category: 'handakuten' },
  { hiragana: 'ぴ', katakana: 'ピ', romaji: 'pi', category: 'handakuten' },
  { hiragana: 'ぷ', katakana: 'プ', romaji: 'pu', category: 'handakuten' },
  { hiragana: 'ぺ', katakana: 'ペ', romaji: 'pe', category: 'handakuten' },
  { hiragana: 'ぽ', katakana: 'ポ', romaji: 'po', category: 'handakuten' },
  // Yoon (ひゃ行)
  { hiragana: 'ひゃ', katakana: 'ヒャ', romaji: 'hya', category: 'yoon' },
  { hiragana: 'ひゅ', katakana: 'ヒュ', romaji: 'hyu', category: 'yoon' },
  { hiragana: 'ひょ', katakana: 'ヒョ', romaji: 'hyo', category: 'yoon' },
  // Yoon + dakuten (びゃ行)
  { hiragana: 'びゃ', katakana: 'ビャ', romaji: 'bya', category: 'yoon' },
  { hiragana: 'びゅ', katakana: 'ビュ', romaji: 'byu', category: 'yoon' },
  { hiragana: 'びょ', katakana: 'ビョ', romaji: 'byo', category: 'yoon' },
  // Yoon + handakuten (ぴゃ行)
  { hiragana: 'ぴゃ', katakana: 'ピャ', romaji: 'pya', category: 'yoon' },
  { hiragana: 'ぴゅ', katakana: 'ピュ', romaji: 'pyu', category: 'yoon' },
  { hiragana: 'ぴょ', katakana: 'ピョ', romaji: 'pyo', category: 'yoon' },

  // ── M row (ま行) ──────────────────────────────────────────────────────────
  { hiragana: 'ま', katakana: 'マ', romaji: 'ma', category: 'basic' },
  { hiragana: 'み', katakana: 'ミ', romaji: 'mi', category: 'basic' },
  { hiragana: 'む', katakana: 'ム', romaji: 'mu', category: 'basic' },
  { hiragana: 'め', katakana: 'メ', romaji: 'me', category: 'basic' },
  { hiragana: 'も', katakana: 'モ', romaji: 'mo', category: 'basic' },
  // Yoon (みゃ行)
  { hiragana: 'みゃ', katakana: 'ミャ', romaji: 'mya', category: 'yoon' },
  { hiragana: 'みゅ', katakana: 'ミュ', romaji: 'myu', category: 'yoon' },
  { hiragana: 'みょ', katakana: 'ミョ', romaji: 'myo', category: 'yoon' },

  // ── Y row (や行) ──────────────────────────────────────────────────────────
  { hiragana: 'や', katakana: 'ヤ', romaji: 'ya', category: 'basic' },
  { hiragana: 'ゆ', katakana: 'ユ', romaji: 'yu', category: 'basic' },
  { hiragana: 'よ', katakana: 'ヨ', romaji: 'yo', category: 'basic' },

  // ── R row (ら行) ──────────────────────────────────────────────────────────
  { hiragana: 'ら', katakana: 'ラ', romaji: 'ra', category: 'basic' },
  { hiragana: 'り', katakana: 'リ', romaji: 'ri', category: 'basic' },
  { hiragana: 'る', katakana: 'ル', romaji: 'ru', category: 'basic' },
  { hiragana: 'れ', katakana: 'レ', romaji: 're', category: 'basic' },
  { hiragana: 'ろ', katakana: 'ロ', romaji: 'ro', category: 'basic' },
  // Yoon (りゃ行)
  { hiragana: 'りゃ', katakana: 'リャ', romaji: 'rya', category: 'yoon' },
  { hiragana: 'りゅ', katakana: 'リュ', romaji: 'ryu', category: 'yoon' },
  { hiragana: 'りょ', katakana: 'リョ', romaji: 'ryo', category: 'yoon' },

  // ── W row (わ行) + ん ─────────────────────────────────────────────────────
  { hiragana: 'わ', katakana: 'ワ', romaji: 'wa', category: 'basic' },
  { hiragana: 'を', katakana: 'ヲ', romaji: 'wo', alternativeRomaji: ['o'], category: 'basic' },
  { hiragana: 'ん', katakana: 'ン', romaji: 'n', category: 'basic' },
]

/**
 * Convert a single `KanaEntry` into a `KanaCharacter` for the given script.
 */
function toKanaCharacter(entry: KanaEntry, script: KanaScript): KanaCharacter {
  const { hiragana, katakana, ...rest } = entry
  return {
    kana: script === 'hiragana' ? hiragana : katakana,
    script,
    ...rest,
  }
}

/** All standard Hiragana characters (107), in gojūon order. */
export const hiragana: KanaCharacter[] = kanaEntries.map((entry) =>
  toKanaCharacter(entry, 'hiragana'),
)

/** All standard Katakana characters (107), in gojūon order. */
export const katakana: KanaCharacter[] = kanaEntries.map((entry) =>
  toKanaCharacter(entry, 'katakana'),
)

/** The combined Hiragana + Katakana dataset (214 characters). */
export const allKana: KanaCharacter[] = [...hiragana, ...katakana]
