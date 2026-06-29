/**
 * ==========================================================
 * MARS SOFTWARE PROJECT
 * ----------------------------------------------------------
 * Test:
 * DecisionIntelligenceSmokeTest
 *
 * Purpose:
 * Quick runtime smoke test for the MARS Decision Intelligence
 * Layer.
 *
 * Version:
 * v0.12.1
 *
 * Date Code:
 * 290626
 * ==========================================================
 */

import DecisionIntelligenceService from '@/services/decision/DecisionIntelligenceService'

export default function runDecisionIntelligenceSmokeTest() {
  const mockPipelineResult = {
    status: 'success',
    provider: 'LOCAL_VISION_PIPELINE',
    timestamp: Date.now(),

    detections: {
      people: 1,
      faces: 1,
      objects: 0,
      pose: 'standing',
    },

    bodyState: {
      posture: 'standing',
      confidence: 85,
    },

    movement: {
      movement: 'moving',
      direction: 'right',
      delta: 12,
      confidence: 82,
    },

    behaviourHistory: {
      behaviourState: 'moving',
      behaviourDisplay: 'Moving',
      sampleCount: 30,
    },

    behaviourPattern: {
      pattern: 'normal_movement',
      patternDisplay: 'Normal Movement',
      transition: 'none',
      transitionDisplay: 'No Transition',
      confidence: 80,
    },

    activityRecognition: {
      activity: 'walking',
      activityDisplay: 'Walking',
      direction: 'right',
      confidence: 78,
    },

    faceFoundation: {
      faceDetected: true,
      faceCount: 1,
      confidence: 75,
      head: {
        orientation: 'forward',
        pitch: 'neutral',
        yaw: 'neutral',
        roll: 'neutral',
      },
    },

    observationStream: {
      observationCount: 3,
      ids: ['person_present', 'body_standing', 'movement_moving'],
      labels: ['Person Present', 'Standing', 'Moving'],
      observations: [
        { id: 'person_present', label: 'Person Present' },
        { id: 'body_standing', label: 'Standing' },
        { id: 'movement_moving', label: 'Moving' },
      ],
    },

    personalObservation: {
      profile: {
        id: 'christian',
        displayName: 'Christian',
      },
      activeMarkerCount: 0,
      highestPriority: 'normal',
      markers: [],
    },

    risk: {
      level: 2,
      label: 'normal',
      confidence: 80,
    },
  }

  const result = DecisionIntelligenceService.evaluate(mockPipelineResult)

  console.log('MARS Decision Intelligence Smoke Test:', result)

  return result
}