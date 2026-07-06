/**
 * ==========================================================
 * MARS SOFTWARE PROJECT
 * ----------------------------------------------------------
 * Smoke Test:
 * WakeWordServiceSmokeTest
 *
 * Purpose:
 * Verifies the v0.14.1 simulated wake word service without
 * live microphone dependencies.
 *
 * Version:
 * v0.14.1
 * Date Code:
 * 060726
 * ==========================================================
 */

import { beforeEach, describe, expect, test } from 'vitest'
import { WakeWordService, WAKE_WORD_STATUS } from '../services/voice'

beforeEach(() => {
  WakeWordService.reset()
})

describe('Wake Word Service Smoke Test', () => {
  test('starts in a sleeping non-audio state', () => {
    const status = WakeWordService.getStatus()

    expect(status.version).toBe('v0.14.1')
    expect(status.state).toBe(WAKE_WORD_STATUS.SLEEPING)
    expect(status.liveAudio).toBe(false)
    expect(status.simulated).toBe(true)
    expect(status.ready).toBe(true)
  })

  test('detects registered MARS wake phrases', () => {
    const result = WakeWordService.evaluate('Hey MARS, wake up')
    const status = WakeWordService.getStatus()

    expect(result.activated).toBe(true)
    expect(result.status).toBe('wake-word-detected')
    expect(status.state).toBe(WAKE_WORD_STATUS.LISTENING)
    expect(status.listening).toBe(true)
  })

  test('rejects unrelated phrases safely', () => {
    const result = WakeWordService.evaluate('hello kitchen')

    expect(result.activated).toBe(false)
    expect(result.status).toBe('not-wake-word')
    expect(WakeWordService.getStatus().state).toBe(WAKE_WORD_STATUS.SLEEPING)
  })
})
