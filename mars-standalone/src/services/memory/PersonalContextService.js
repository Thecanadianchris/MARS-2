/**
 * ==========================================================
 * MARS SOFTWARE PROJECT
 * ----------------------------------------------------------
 * Service:
 * PersonalContextService
 *
 * Purpose:
 * The v0.15.4 Personal Context layer. Assembles a per-person
 * context block (who MARS is helping + their salience-ranked
 * facts) that can be injected into the v0.14.4 AI reasoning chain
 * so MARS's spoken/LLM answers are person-aware.
 *
 * Privacy posture (Christian's decision): ON-PREM ONLY.
 *   - Personal context is built for the on-prem tiers (Local +
 *     Home) only.
 *   - The Cloud tier (Claude API over the internet) receives NO
 *     personal context — buildContext(..., { tier: 'cloud' })
 *     always returns an empty string.
 *   - Safety-category facts therefore never leave the device under
 *     any circumstance.
 *
 * It reads memory and identity; it stores nothing and diagnoses
 * nothing.
 *
 * Version:
 * v0.15.4
 * Date Code:
 * 120726
 * ==========================================================
 */

import PersonRegistry from '@/services/identity/PersonRegistry'
import LongTermMemoryEngine from './LongTermMemoryEngine'
import { isSafetyCategory } from './MemoryClassifier'

export const CLOUD_POSTURE = 'on_prem_only'
const MAX_CONTEXT_FACTS = 8

class PersonalContextService {
  /**
   * Build the personal-context block for a tier.
   * @param {string} personId
   * @param {{ tier?: 'onPrem'|'cloud', maxFacts?: number }} options
   * @returns {string} context text, or '' when there is nothing to send
   */
  buildContext(personId, { tier = 'onPrem', maxFacts = MAX_CONTEXT_FACTS } = {}) {
    if (!personId) {
      return ''
    }

    // ON-PREM ONLY: the cloud tier never receives personal context.
    if (tier === 'cloud') {
      return ''
    }

    const ranked = LongTermMemoryEngine.getRankedEntriesForPerson(personId)

    if (ranked.length === 0) {
      return ''
    }

    const profile = PersonRegistry.getProfile(personId)
    const name = profile?.displayName || personId

    const facts = ranked
      .slice(0, maxFacts)
      .map((entry) => `- ${entry.key}: ${entry.value}${isSafetyCategory(entry.category) ? ' [safety-critical]' : ''}`)

    return [
      `The person you are currently helping is ${name}. Known facts about them ` +
        `(use these to personalise your reply; do not recite them verbatim, and never give medical advice):`,
      ...facts,
    ].join('\n')
  }

  /** Convenience: the { onPrem, cloud } bundle the reasoning chain consumes. */
  buildTierBundle(personId) {
    return {
      onPrem: this.buildContext(personId, { tier: 'onPrem' }),
      cloud: this.buildContext(personId, { tier: 'cloud' }),
    }
  }

  /** Diagnostics preview for the MEM-I panel. */
  getPreview(personId) {
    const ranked = personId ? LongTermMemoryEngine.getRankedEntriesForPerson(personId) : []
    const onPrem = this.buildContext(personId, { tier: 'onPrem' })
    const cloud = this.buildContext(personId, { tier: 'cloud' })

    return {
      version: 'v0.15.4',
      service: 'PersonalContextService',
      activePersonId: personId || null,
      cloudPosture: CLOUD_POSTURE,
      onPrem,
      cloud,
      factCount: Math.min(ranked.length, MAX_CONTEXT_FACTS),
      safetyCount: ranked.filter((entry) => isSafetyCategory(entry.category)).length,
      sentToCloud: Boolean(cloud), // always false under on-prem-only
      medicalDiagnosis: false,
    }
  }
}

export default new PersonalContextService()
