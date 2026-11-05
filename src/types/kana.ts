/**
 * Type models for Japanese kana (Hiragana and Katakana).
 */

/** The writing system a kana character belongs to. */
export type KanaScript = 'hiragana' | 'katakana';

/**
 * The classification of a kana character.
 *
 * - `basic`:       Seion — unvoiced, single-mora characters from the gojūon table.
 * - `dakuten`:     Voiced, single-mora characters marked with ゛ (dakuten).
 * - `handakuten`:  Semi-voiced, single-mora characters marked with ゜ (handakuten).
 * - `yoon`:        Contracted sounds formed with a small ゃ/ゅ/ょ (e.g. きゃ, じゃ, ぴょ).
 *                  This includes voiced and semi-voiced yoon such as ぎゃ and ぴゃ.
 */
export type KanaCategory = 'basic' | 'dakuten' | 'handakuten' | 'yoon';

/** A single kana character with its romanization(s). */
export interface KanaCharacter {
  /** The kana glyph(s), e.g. "し" or "しゃ". */
  kana: string;

  /**
   * Primary romanization in Hepburn romanization, e.g. "shi".
   * This is the spelling a learner will most commonly encounter.
   */
  romaji: string;

  /**
   * Alternative romanizations, e.g. ["si"] for "shi".
   * These are typically Kunrei-shiki / Nihon-shiki variants
   * (し → si, ち → ti, つ → tu, ふ → hu, じ → zi, ぢ → di, づ → du,
   *  しゃ → sya, ちゃ → tya, じゃ → zya, を → o, etc.).
   */
  alternativeRomaji?: string[];

  /** Whether this is Hiragana or Katakana. */
  script: KanaScript;

  /** The classification of this kana. */
  category: KanaCategory;
}
