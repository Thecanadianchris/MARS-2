/**
 * ==========================================================
 * MARS SOFTWARE PROJECT
 * ----------------------------------------------------------
 * Service:
 * ReferenceResolver
 *
 * Purpose:
 * Resolves simple short-term conversational references such as
 * pronouns, repeat words and yes/no continuation markers.
 *
 * Version:
 * v0.14.2
 * Date Code:
 * 070726
 * ==========================================================
 */

export const REFERENCE_TYPES = Object.freeze({
  NONE: 'none',
  PRONOUN: 'pronoun',
  REPEAT: 'repeat',
  CONFIRMATION: 'confirmation',
  CANCELLATION: 'cancellation',
})

const PRONOUNS = ['he', 'she', 'they', 'them', 'him', 'her', 'it', 'that', 'this', 'there']
const REPEAT_WORDS = ['again', 'same', 'repeat', 'continue', 'previous', 'last one', 'before']
const YES_WORDS = ['yes', 'yeah', 'yep', 'ok', 'okay', 'do it', 'continue']
const NO_WORDS = ['no', 'nope', 'cancel', 'stop', 'never mind', 'sleep']

function includesAny(text, list) {
  return list.some((word) => text === word || text.includes(` ${word} `) || text.startsWith(`${word} `) || text.endsWith(` ${word}`))
}

class ReferenceResolver {
  resolve(message = '', context = {}) {
    const normalised = ` ${String(message).toLowerCase().trim()} `
    const compact = String(message).toLowerCase().trim()

    if (!compact) {
      return this.createResult(message, REFERENCE_TYPES.NONE, null, 0, 'No message supplied.')
    }

    if (includesAny(normalised, NO_WORDS)) {
      return this.createResult(message, REFERENCE_TYPES.CANCELLATION, 'cancel-current-action', 0.92, 'Cancellation reference resolved.')
    }

    if (includesAny(normalised, YES_WORDS)) {
      return this.createResult(message, REFERENCE_TYPES.CONFIRMATION, context.lastPlan || context.lastIntent || 'continue-previous-action', 0.84, 'Confirmation reference resolved.')
    }

    if (includesAny(normalised, REPEAT_WORDS)) {
      return this.createResult(message, REFERENCE_TYPES.REPEAT, context.lastIntent || context.lastPlan || 'previous-action', 0.8, 'Repeat reference resolved against recent context.')
    }

    if (includesAny(normalised, PRONOUNS)) {
      const target = context.currentPerson || context.currentSubject || context.currentLocation || null
      return this.createResult(
        message,
        REFERENCE_TYPES.PRONOUN,
        target,
        target ? 0.76 : 0.35,
        target ? 'Pronoun resolved against current context.' : 'Pronoun found but no strong context target exists.'
      )
    }

    return this.createResult(message, REFERENCE_TYPES.NONE, null, 1, 'No conversational reference detected.')
  }

  createResult(originalText, referenceType, resolvedTarget, confidence, summary) {
    return {
      version: 'v0.14.2',
      service: 'ReferenceResolver',
      originalText,
      referenceType,
      resolvedTarget,
      confidence,
      summary,
      resolved: referenceType === REFERENCE_TYPES.NONE ? false : Boolean(resolvedTarget),
      timestamp: Date.now(),
    }
  }

  getStatus() {
    return {
      version: 'v0.14.2',
      service: 'ReferenceResolver',
      status: 'ready',
      supportedReferences: [...PRONOUNS, ...REPEAT_WORDS, ...YES_WORDS, ...NO_WORDS],
      persistentMemory: false,
    }
  }
}

export default new ReferenceResolver()
