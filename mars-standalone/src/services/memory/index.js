/**
 * ==========================================================
 * MARS SOFTWARE PROJECT
 * ----------------------------------------------------------
 * Module Exports:
 * Memory Intelligence
 *
 * Purpose:
 * Public interface for the v0.15 Memory Intelligence Foundation.
 *
 * Version:
 * v0.15
 * Date Code:
 * 120726
 * ==========================================================
 */

export {
  default as MemoryIntelligenceService,
  MEMORY_CATEGORIES,
  MEMORY_SOURCES,
  DEFAULT_PERSON_ID,
  buildEntriesFromLegacy,
} from './MemoryIntelligenceService'

export {
  parsePersonMemoryWrite,
  parsePersonMemoryRecall,
} from './MemoryCommandParser'

export { default as WorkingMemoryService, ITEM_ORIGIN } from './WorkingMemoryService'

export { default as LongTermMemoryEngine } from './LongTermMemoryEngine'
export { classify, isSafetyCategory, MEMORY_CATEGORY } from './MemoryClassifier'
export { default as PersonalContextService, CLOUD_POSTURE } from './PersonalContextService'
