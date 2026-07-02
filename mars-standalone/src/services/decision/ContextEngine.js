/**
 * ==========================================================
 * MARS SOFTWARE PROJECT
 * ----------------------------------------------------------
 * Engine:
 * ContextEngine
 *
 * Purpose:
 * Converts the current MARS perception output into a clean
 * decision-ready context object.
 *
 * Version:
 * v0.13.0
 *
 * Date Code:
 * 290626
 * ==========================================================
 */

import DecisionContext from '@/models/DecisionContext'

class ContextEngine {
  evaluate(pipelineResult = null) {
    if (!pipelineResult || pipelineResult.status === 'error') {
      return new DecisionContext(this.createEmptyContext(pipelineResult))
    }

    const observations = pipelineResult.observationStream?.observations || []
    const observationIds = new Set(
      observations.map((observation) => observation.id)
    )

    return new DecisionContext({
      status: 'success',
      provider: 'LOCAL_CONTEXT_ENGINE',
      timestamp: Date.now(),

      source: {
        status: pipelineResult.status || 'unknown',
        provider: pipelineResult.provider || 'unknown',
        frameTimestamp: pipelineResult.frame?.timestamp || null,
        pipelineTimestamp: pipelineResult.timestamp || null,
      },

      person: {
        present: observationIds.has('person_present'),
        visible: !observationIds.has('person_not_visible'),
        count: pipelineResult.detections?.people || 0,
      },

      body: {
        state: this.getBodyState(pipelineResult, observationIds),
        confidence: pipelineResult.bodyState?.confidence || 0,
        posture: pipelineResult.bodyState?.posture || 'unknown',
      },

      movement: {
        state: pipelineResult.movement?.movement || 'unknown',
        direction: pipelineResult.movement?.direction || 'unknown',
        delta: pipelineResult.movement?.delta || 0,
        confidence: pipelineResult.movement?.confidence || 0,
      },

      behaviour: {
        state:
          pipelineResult.behaviourHistory?.behaviourState ||
          pipelineResult.behaviourHistory?.behaviourDisplay ||
          'unknown',
        pattern:
          pipelineResult.behaviourPattern?.pattern ||
          pipelineResult.behaviourPattern?.patternDisplay ||
          'unknown',
        transition:
          pipelineResult.behaviourPattern?.transition ||
          pipelineResult.behaviourPattern?.transitionDisplay ||
          'unknown',
        confidence: pipelineResult.behaviourPattern?.confidence || 0,
        sampleCount: pipelineResult.behaviourHistory?.sampleCount || 0,
      },

      activity: {
        state:
          pipelineResult.activityRecognition?.activity ||
          pipelineResult.activityRecognition?.activityDisplay ||
          'unknown',
        direction: pipelineResult.activityRecognition?.direction || 'unknown',
        confidence: pipelineResult.activityRecognition?.confidence || 0,
      },

      face: {
        detected: Boolean(pipelineResult.faceFoundation?.faceDetected),
        count: pipelineResult.faceFoundation?.faceCount || 0,
        headOrientation:
          pipelineResult.faceFoundation?.head?.orientation || 'unknown',
        headPitch: pipelineResult.faceFoundation?.head?.pitch || 'unknown',
        headYaw: pipelineResult.faceFoundation?.head?.yaw || 'unknown',
        headRoll: pipelineResult.faceFoundation?.head?.roll || 'unknown',
        confidence: pipelineResult.faceFoundation?.confidence || 0,
      },

      personal: {
        profileId: pipelineResult.personalObservation?.profile?.id || 'unknown',
        displayName:
          pipelineResult.personalObservation?.profile?.displayName || 'Unknown',
        profileActive: observationIds.has('personal_profile_active'),
        activeMarkerCount:
          pipelineResult.personalObservation?.activeMarkerCount || 0,
        highestPriority:
          pipelineResult.personalObservation?.highestPriority || 'normal',
        markers: pipelineResult.personalObservation?.markers || [],
      },

      risk: {
        level: pipelineResult.risk?.level || 0,
        label: pipelineResult.risk?.label || 'normal',
        confidence: pipelineResult.risk?.confidence || 0,
      },

      observations: {
        count: pipelineResult.observationStream?.observationCount || 0,
        ids: pipelineResult.observationStream?.ids || [],
        labels: pipelineResult.observationStream?.labels || [],
        raw: observations,
      },

      summary: this.createSummary(pipelineResult, observationIds),
    })
  }

  getBodyState(pipelineResult, observationIds) {
    if (observationIds.has('body_standing')) return 'standing'
    if (observationIds.has('body_sitting')) return 'sitting'
    if (observationIds.has('body_lying')) return 'lying'

    return pipelineResult.bodyState?.posture || 'unknown'
  }

  createSummary(pipelineResult, observationIds) {
    const personText = observationIds.has('person_present')
      ? 'Person present'
      : 'No person visible'

    const bodyText =
      pipelineResult.bodyState?.posture ||
      pipelineResult.detections?.pose ||
      'unknown posture'

    const movementText = pipelineResult.movement?.movement || 'unknown movement'

    const activityText =
      pipelineResult.activityRecognition?.activityDisplay ||
      pipelineResult.activityRecognition?.activity ||
      'unknown activity'

    const profileName =
      pipelineResult.personalObservation?.profile?.displayName || 'Unknown profile'

    const identityName =
      pipelineResult.identity?.person?.name ||
      (pipelineResult.identity?.status === 'unknown' ? 'Unknown identity' : 'No identity')

    const riskText = pipelineResult.risk?.label || 'normal'

    return `${personText}. Body ${bodyText}. Movement ${movementText}. Activity ${activityText}. Identity ${identityName}. Profile ${profileName}. Risk ${riskText}.`
  }

  createEmptyContext(pipelineResult) {
    return {
      status: 'not_available',
      provider: 'LOCAL_CONTEXT_ENGINE',
      timestamp: Date.now(),
      source: {
        status: pipelineResult?.status || 'missing',
        provider: pipelineResult?.provider || 'unknown',
        frameTimestamp: null,
        pipelineTimestamp: pipelineResult?.timestamp || null,
      },
      person: {
        present: false,
        visible: false,
        count: 0,
      },
      body: {
        state: 'unknown',
        confidence: 0,
        posture: 'unknown',
      },
      movement: {
        state: 'unknown',
        direction: 'unknown',
        delta: 0,
        confidence: 0,
      },
      behaviour: {
        state: 'unknown',
        pattern: 'unknown',
        transition: 'unknown',
        confidence: 0,
        sampleCount: 0,
      },
      activity: {
        state: 'unknown',
        direction: 'unknown',
        confidence: 0,
      },
      face: {
        detected: false,
        count: 0,
        headOrientation: 'unknown',
        headPitch: 'unknown',
        headYaw: 'unknown',
        headRoll: 'unknown',
        confidence: 0,
      },
      identity: {
        status: 'not_available',
        known: false,
        unknown: false,
        personId: null,
        personName: null,
        confidence: 0,
        tracking: {
          enabled: false,
          personCount: 0,
          multiPerson: false,
        },
        source: 'none',
      },
      personal: {
        profileId: 'unknown',
        displayName: 'Unknown',
        profileActive: false,
        activeMarkerCount: 0,
        highestPriority: 'normal',
        markers: [],
      },
      risk: {
        level: 0,
        label: 'normal',
        confidence: 0,
      },
      observations: {
        count: 0,
        ids: [],
        labels: [],
        raw: [],
      },
      summary: 'Context unavailable. No valid perception result supplied.',
    }
  }
}

export default new ContextEngine()