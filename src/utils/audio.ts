/**
 * Lightweight text-to-speech helpers for Japanese pronunciation drills.
 */

/** Speak a kana aloud using the browser's native speech synthesis. */
export function speakKana(kana: string): void {
  if (typeof window === 'undefined' || !('speechSynthesis' in window)) {
    return
  }

  try {
    // Cancel anything still playing so rapid answers never clip or overlap.
    window.speechSynthesis.cancel()

    const utterance = new SpeechSynthesisUtterance(kana)
    utterance.lang = 'ja-JP'
    utterance.rate = 0.9
    window.speechSynthesis.speak(utterance)
  } catch {
    // Speech synthesis is a nice-to-have: fail silently if unsupported.
  }
}
