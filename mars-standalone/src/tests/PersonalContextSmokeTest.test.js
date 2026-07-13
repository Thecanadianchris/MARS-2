/**
 * ==========================================================
 * MARS SOFTWARE PROJECT
 * ----------------------------------------------------------
 * Smoke Test:
 * PersonalContextSmokeTest
 *
 * Purpose:
 * Verifies the v0.15.4 Personal Context layer and, critically,
 * the ON-PREM-ONLY privacy posture: personal context is built for
 * the on-prem tiers but the cloud tier receives NOTHING, and
 * safety facts never leave the device. Also checks that the chat
 * reasoning bridge only attaches context when there is something
 * to send (so memory-less turns are unchanged from v0.14.4).
 *
 * Version:
 * v0.15.4
 * Date Code:
 * 120726
 * ==========================================================
 */

import { beforeEach, describe, expect, test, vi } from 'vitest'
import MemoryIntelligenceService from '../services/memory/MemoryIntelligenceService'
import PersonalContextService, { CLOUD_POSTURE } from '../services/memory/PersonalContextService'
import { buildReasonedChatReply } from '../services/conversation/ChatReasoningBridge'
import { GENERIC_FALLBACK_MARKER } from '../services/conversation/ChatConversationBridge'

const GENERIC_REPLY = `Understood, Christian. ${GENERIC_FALLBACK_MARKER}`

beforeEach(() => {
  MemoryIntelligenceService.resetForTests()
})

describe('PersonalContextService — assembly', () => {
  test('returns empty context when the person has no facts', () => {
    expect(PersonalContextService.buildContext('finley', { tier: 'onPrem' })).toBe('')
  })

  test('on-prem context names the person and lists facts, flagging safety-critical ones', () => {
    MemoryIntelligenceService.remember('medication', '8pm', { personId: 'finley' })
    MemoryIntelligenceService.remember('favourite colour', 'red', { personId: 'finley' })

    const ctx = PersonalContextService.buildContext('finley', { tier: 'onPrem' })
    expect(ctx).toContain('Finley')
    expect(ctx).toContain('medication: 8pm')
    expect(ctx).toContain('[safety-critical]')
    expect(ctx).toContain('favourite colour: red')
  })
})

describe('PersonalContextService — ON-PREM-ONLY privacy posture', () => {
  test('the cloud tier receives NO personal context, even with safety facts', () => {
    MemoryIntelligenceService.remember('medication', '8pm', { personId: 'finley' })
    MemoryIntelligenceService.remember('allergy', 'penicillin', { personId: 'finley' })

    expect(PersonalContextService.buildContext('finley', { tier: 'cloud' })).toBe('')
  })

  test('buildTierBundle sends context on-prem but nothing to cloud', () => {
    MemoryIntelligenceService.remember('safe word', 'bluebird', { personId: 'finley' })

    const bundle = PersonalContextService.buildTierBundle('finley')
    expect(bundle.onPrem).toContain('safe word: bluebird')
    expect(bundle.cloud).toBe('')
  })

  test('preview reports the posture and that nothing is sent to cloud', () => {
    MemoryIntelligenceService.remember('medication', '8pm', { personId: 'finley' })

    const preview = PersonalContextService.getPreview('finley')
    expect(preview.cloudPosture).toBe(CLOUD_POSTURE)
    expect(preview.sentToCloud).toBe(false)
    expect(preview.cloud).toBe('')
    expect(preview.safetyCount).toBe(1)
  })
})

describe('Chat reasoning bridge — context injection', () => {
  test('attaches on-prem context (and empty cloud) when the active person has facts', async () => {
    // Default active person is the owner (christian).
    MemoryIntelligenceService.remember('favourite colour', 'red') // owner scope

    const reasoningService = {
      reason: vi.fn(async () => ({ status: 'success', provider: 'HOME_AI_SERVER', response: 'ok' })),
    }

    await buildReasonedChatReply({ bridgedReply: GENERIC_REPLY, content: 'hi', reasoningService })

    const args = reasoningService.reason.mock.calls[0][0]
    expect(args.prompt).toBe('hi')
    expect(args.personalContext.onPrem).toContain('favourite colour: red')
    expect(args.personalContext.cloud).toBe('')
  })

  test('REGRESSION GUARD: a memory-less turn calls reason exactly as before (no personalContext)', async () => {
    const reasoningService = {
      reason: vi.fn(async () => ({ status: 'success', provider: 'HOME_AI_SERVER', response: 'ok' })),
    }

    await buildReasonedChatReply({ bridgedReply: GENERIC_REPLY, content: 'hi', reasoningService })

    expect(reasoningService.reason).toHaveBeenCalledWith({ prompt: 'hi' })
  })
})
