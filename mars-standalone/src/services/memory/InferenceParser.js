/**
 * ==========================================================
 * MARS SOFTWARE PROJECT
 * ----------------------------------------------------------
 * Module:
 * InferenceParser
 *
 * Purpose:
 * Pure, deterministic heuristics for the v0.15.5 Behaviour
 * Learning engine. Detects casual statements a person makes about
 * themselves (preferences, routines) that were NOT an explicit
 * "remember" command, and turns them into a candidate fact.
 *
 * Deliberately narrow: it only matches clear "I like/love/enjoy…"
 * and "I usually/always…" forms — never "remember …", never
 * "my X is Y" (those are handled explicitly by ChatPanel), and
 * never anything health/medical (that is enforced downstream as a
 * hard never-safety rule).
 *
 * Kept dependency-free so it can be unit-tested in isolation,
 * mirroring MemoryCommandParser.
 *
 * Version:
 * v0.15.5
 * Date Code:
 * 120726
 * ==========================================================
 */

function clean(value) {
  return String(value ?? '').trim().replace(/[.!]+$/, '').trim()
}

/**
 * @returns { key, value } | null
 */
export function parseInferredFact(message) {
  const text = String(message ?? '').trim()

  const likePatterns = [
    /^i (?:really |absolutely )?(?:like|love|enjoy) (?:to )?(.+)$/i,
    /^i(?:'m| am) (?:a )?(?:fan of|keen on) (.+)$/i,
    /^i prefer (.+)$/i,
  ]

  for (const pattern of likePatterns) {
    const match = text.match(pattern)
    if (match) {
      const value = clean(match[1])
      if (value) {
        return { key: 'likes', value }
      }
    }
  }

  const routinePatterns = [
    /^i (?:usually|always|often|normally|tend to|like to) (.+)$/i,
    /^every (?:day|morning|evening|night) i (.+)$/i,
  ]

  for (const pattern of routinePatterns) {
    const match = text.match(pattern)
    if (match) {
      const value = clean(match[1])
      if (value) {
        return { key: 'routine', value }
      }
    }
  }

  return null
}
