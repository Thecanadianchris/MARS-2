/**
 * ==========================================================
 * MARS SOFTWARE PROJECT
 * ----------------------------------------------------------
 * Module:
 * memory.js (compatibility shim)
 *
 * Purpose:
 * Since v0.15 (Memory Intelligence Foundation) the authoritative
 * store lives in `services/memory/MemoryIntelligenceService`. This
 * file is kept as a thin shim with the exact same public API it
 * had before, so ChatPanel's remember/recall/clear commands and the
 * Notes tab (Control.jsx) keep working with zero changes — they now
 * read and write the richer v0.15 store underneath.
 *
 * Do not add logic here. New memory behaviour belongs in the service.
 *
 * Version:
 * v0.15
 * Date Code:
 * 120726
 * ==========================================================
 */

import MemoryIntelligenceService from '@/services/memory/MemoryIntelligenceService'

export function loadMemory() {
  return MemoryIntelligenceService.recallAll()
}

export function saveMemory(memory = {}) {
  // Preserved for API compatibility. Writes each key through the
  // service so persistence stays consistent with the v0.15 schema.
  for (const [key, value] of Object.entries(memory || {})) {
    MemoryIntelligenceService.remember(key, value)
  }
}

export function remember(key, value) {
  MemoryIntelligenceService.remember(key, value)
}

export function recall(key) {
  return MemoryIntelligenceService.recall(key)
}

export function recallAll() {
  return MemoryIntelligenceService.recallAll()
}

export function clearMemory() {
  MemoryIntelligenceService.clearMemory()
}
