/**
 * ==========================================================
 * MARS SOFTWARE PROJECT
 * ----------------------------------------------------------
 * Smoke Test:
 * ConversationPlannerSmokeTest
 *
 * Purpose:
 * Verifies v0.14.2 deterministic conversation planning.
 *
 * Version:
 * v0.14.2
 * Date Code:
 * 070726
 * ==========================================================
 */

import { describe, expect, test } from 'vitest'
import { ConversationPlanner, CONVERSATION_PLAN_ACTIONS } from '../services/conversation'

describe('Conversation Planner Smoke Test', () => {
  test('routes visual conversation requests to vision', () => {
    const plan = ConversationPlanner.plan({ message: 'who can you see' })

    expect(plan.action).toBe(CONVERSATION_PLAN_ACTIONS.ROUTE_TO_VISION)
    expect(plan.capability).toBe('vision')
  })

  test('continues previous action after confirmation', () => {
    const plan = ConversationPlanner.plan({
      message: 'yes',
      reference: { referenceType: 'confirmation' },
      context: { lastCapability: 'vision' },
    })

    expect(plan.action).toBe(CONVERSATION_PLAN_ACTIONS.CONTINUE_PREVIOUS_ACTION)
    expect(plan.capability).toBe('vision')
  })

  test('does not perform medical diagnosis', () => {
    const plan = ConversationPlanner.plan({ message: 'check protected user' })

    expect(plan.medicalDiagnosis).toBe(false)
    expect(plan.executesHardware).toBe(false)
  })
})
