/**
 * ==========================================================
 * MARS SOFTWARE PROJECT
 * ----------------------------------------------------------
 * Module:
 * MemoryCommandParser
 *
 * Purpose:
 * Pure, side-effect-free parsing of EXPLICIT person-tagged memory
 * commands (v0.15.1), e.g. "remember Finley's medication is 8pm"
 * or "what is Finley's medication". Kept separate from ChatPanel so
 * it can be unit-tested without rendering, and so ChatPanel's
 * existing untagged "my …" commands are left completely untouched
 * (they still resolve to the owner/default person via the shim).
 *
 * These parsers only match the POSSESSIVE-NAME form (name + 's).
 * "remember my birthday is June 5th" has no apostrophe-s and will
 * never match here, so the owner path is unaffected.
 *
 * Name resolution (name → personId) is deliberately NOT done here;
 * that belongs to the caller via PersonRegistry.
 *
 * Version:
 * v0.15.1
 * Date Code:
 * 120726
 * ==========================================================
 */

/**
 * Parse an explicit person-tagged write.
 * @returns { personName, key, value } | null
 */
export function parsePersonMemoryWrite(content) {
  const cleaned = String(content ?? '').trim()

  const patterns = [
    /^remember (?:that )?(\w+)'s (.+?) (?:is|are) (.+)$/i,
  ]

  for (const pattern of patterns) {
    const match = cleaned.match(pattern)

    if (match) {
      const personName = match[1].trim()

      // Guard: "my/your/their/his/her" are pronouns, not names — let the
      // existing owner-scoped path handle those.
      if (isPronoun(personName)) {
        return null
      }

      return {
        personName,
        key: match[2].trim().toLowerCase(),
        value: match[3].trim(),
      }
    }
  }

  return null
}

/**
 * Parse an explicit person-tagged recall.
 * @returns { personName, key } | null
 */
export function parsePersonMemoryRecall(content) {
  const cleaned = String(content ?? '').trim()

  const patterns = [
    /^what(?:'s| is| are) (\w+)'s (.+?)\??$/i,
    /^do you (?:know|remember) (\w+)'s (.+?)\??$/i,
    /^tell me (\w+)'s (.+?)\??$/i,
  ]

  for (const pattern of patterns) {
    const match = cleaned.match(pattern)

    if (match) {
      const personName = match[1].trim()

      if (isPronoun(personName)) {
        return null
      }

      return {
        personName,
        key: match[2].trim().toLowerCase().replace(/\?$/, ''),
      }
    }
  }

  return null
}

function isPronoun(word) {
  return ['my', 'your', 'their', 'his', 'her', 'our', 'its'].includes(
    String(word).toLowerCase()
  )
}
