/**
 * ==========================================================
 * MARS SOFTWARE PROJECT
 * ----------------------------------------------------------
 * Module:
 * MemoryClassifier
 *
 * Purpose:
 * Pure, deterministic heuristic classifier for the v0.15.3
 * Long-Term Memory Engine. Maps a memory key/value to one of the
 * v0.15 categories. Kept dependency-free so it can be reused by
 * both the store (auto-classify on write) and the engine
 * (backfill pass), and unit-tested in isolation.
 *
 * The `safety` category is the important one for an assistive
 * system: it flags care-critical facts (medication, allergy,
 * emergency contact, safe word …) so the engine can protect them
 * from any retention/decay and rank them first. Classification is
 * a labelling aid only — it never assesses or diagnoses health.
 *
 * Version:
 * v0.15.3
 * Date Code:
 * 120726
 * ==========================================================
 */

export const MEMORY_CATEGORY = Object.freeze({
  SAFETY: 'safety',
  PERSONAL: 'personal',
  PREFERENCE: 'preference',
  FACT: 'fact',
  UNCATEGORISED: 'uncategorised',
})

// Care-critical — never auto-forgotten, always ranked first.
const SAFETY_KEYWORDS = [
  'medication', 'medicine', 'meds', 'dose', 'dosage', 'prescription', 'insulin', 'epipen',
  'allergy', 'allergic', 'allergies',
  'emergency', 'emergency contact', 'next of kin', 'ice contact',
  'safe word', 'safeword', 'code word',
  'doctor', 'gp', 'nurse', 'carer', 'caregiver', 'care plan', 'care instructions',
  'blood type', 'blood group', 'condition', 'diagnosis', 'pacemaker', 'wheelchair',
  'fall', 'seizure', 'diabetic', 'asthma',
]

const PREFERENCE_KEYWORDS = [
  'favourite', 'favorite', 'prefer', 'preferred', 'likes', 'dislikes', 'enjoys',
  'hobby', 'hobbies', 'interest', 'loves', 'hates',
]

const PERSONAL_KEYWORDS = [
  'birthday', 'birthdate', 'date of birth', 'dob', 'age', 'name', 'nickname',
  'address', 'home', 'phone', 'mobile', 'email', 'anniversary',
  'family', 'spouse', 'partner', 'husband', 'wife', 'child', 'children', 'pet',
]

function containsAny(haystack, keywords) {
  return keywords.some((keyword) => haystack.includes(keyword))
}

/**
 * Classify a memory entry. Precedence: safety > personal > preference > fact.
 * Matches against the key primarily, with the value as a secondary signal for
 * the safety category (so "note: give insulin at 8pm" is still flagged).
 */
export function classify(key = '', value = '') {
  const k = String(key).toLowerCase()
  const v = String(value).toLowerCase()

  if (containsAny(k, SAFETY_KEYWORDS) || containsAny(v, SAFETY_KEYWORDS)) {
    return MEMORY_CATEGORY.SAFETY
  }

  if (containsAny(k, PERSONAL_KEYWORDS)) {
    return MEMORY_CATEGORY.PERSONAL
  }

  if (containsAny(k, PREFERENCE_KEYWORDS)) {
    return MEMORY_CATEGORY.PREFERENCE
  }

  return MEMORY_CATEGORY.FACT
}

export function isSafetyCategory(category) {
  return category === MEMORY_CATEGORY.SAFETY
}
