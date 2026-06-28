/**
 * ==========================================================
 * MARS SOFTWARE PROJECT
 * ----------------------------------------------------------
 * Service:
 * BehaviourPatternEngine
 *
 * Purpose:
 * Evaluates short-term behaviour history and identifies useful
 * behaviour patterns for the MARS Vision Pipeline.
 *
 * This engine deliberately contains NO MediaPipe code.
 * It reads structured behaviour history and converts it into
 * higher-level pattern information for future Decision and Risk
 * engines.
 *
 * Version:
 * v0.10.8
 *
 * Date Code:
 * 280626
 * ==========================================================
 */

class BehaviourPatternEngine {

  evaluate(behaviourHistory) {

    if (!behaviourHistory || behaviourHistory.status !== 'success') {

      return this.emptyResult('No behaviour history available for pattern analysis.')

    }

    const timeline = behaviourHistory.timeline || []

    if (timeline.length < 2) {

      return {
        status: 'success',
        provider: 'BEHAVIOUR_PATTERN_ENGINE',
        pattern: 'initialising',
        patternDisplay: 'Learning behaviour pattern',
        transition: 'none',
        transitionDisplay: 'No transition yet',
        confidence: 35,
        riskModifier: 0,
        summary: 'Behaviour pattern engine is collecting enough history to identify patterns.',
      }

    }

    const previous = timeline[timeline.length - 2]
    const latest = timeline[timeline.length - 1]

    const transition = this.detectTransition(previous, latest)
    const pattern = this.detectPattern(behaviourHistory, latest, transition)
    const riskModifier = this.calculateRiskModifier(pattern, transition, behaviourHistory)
    const confidence = this.calculateConfidence(behaviourHistory, pattern, transition)

    return {
      status: 'success',
      provider: 'BEHAVIOUR_PATTERN_ENGINE',
      pattern,
      patternDisplay: this.getPatternDisplay(pattern),
      transition,
      transitionDisplay: this.getTransitionDisplay(transition),
      confidence,
      riskModifier,
      summary:
        `Behaviour pattern: ${this.getPatternDisplay(pattern)}. ` +
        `Transition: ${this.getTransitionDisplay(transition)}.`,
    }

  }

  detectTransition(previous, latest) {

    if (!previous.bodyVisible && latest.bodyVisible) {

      return 'entered_view'

    }

    if (previous.bodyVisible && !latest.bodyVisible) {

      return 'left_view'

    }

    if (previous.posture !== latest.posture) {

      if (previous.posture === 'standing' && latest.posture === 'sitting') {

        return 'sat_down'

      }

      if (previous.posture === 'sitting' && latest.posture === 'standing') {

        return 'stood_up'

      }

      if (latest.posture === 'lying') {

        return 'moved_to_lying'

      }

      return 'posture_changed'

    }

    if (previous.movement === 'stationary' && this.isMoving(latest.movement)) {

      return 'movement_started'

    }

    if (this.isMoving(previous.movement) && latest.movement === 'stationary') {

      return 'movement_stopped'

    }

    return 'stable'

  }

  detectPattern(behaviourHistory, latest, transition) {

    if (!latest.bodyVisible) {

      return 'person_not_visible'

    }

    if (transition === 'moved_to_lying') {

      return 'lying_transition'

    }

    if (behaviourHistory.behaviourState === 'lying_sustained') {

      return 'sustained_lying'

    }

    if (behaviourHistory.behaviourState === 'stationary_sustained') {

      return 'sustained_stationary'

    }

    if (transition === 'sat_down') {

      return 'sitting_down'

    }

    if (transition === 'stood_up') {

      return 'standing_up'

    }

    if (transition === 'movement_started') {

      return 'activity_started'

    }

    if (transition === 'movement_stopped') {

      return 'activity_stopped'

    }

    if (this.isMoving(latest.movement)) {

      return 'active_movement'

    }

    if (latest.posture === 'standing') {

      return 'standing_observed'

    }

    if (latest.posture === 'sitting') {

      return 'sitting_observed'

    }

    return 'observing'

  }

  calculateRiskModifier(pattern, transition, behaviourHistory) {

    let modifier = 0

    if (pattern === 'sustained_lying') {

      modifier += 2

    }

    if (pattern === 'lying_transition') {

      modifier += 1

    }

    if (transition === 'left_view' && behaviourHistory.ratios?.visibility < 0.4) {

      modifier += 1

    }

    return modifier

  }

  calculateConfidence(behaviourHistory, pattern, transition) {

    const sampleScore = Math.min(70, behaviourHistory.sampleCount * 4)
    const visibilityScore = Math.round((behaviourHistory.ratios?.visibility || 0) * 30)
    const transitionBonus = transition === 'stable' ? 0 : 10
    const patternBonus = pattern === 'observing' ? 0 : 10

    return Math.min(100, sampleScore + visibilityScore + transitionBonus + patternBonus)

  }

  isMoving(movement) {

    return movement === 'moving' || movement === 'moving_fast' || movement === 'active_movement'

  }

  getPatternDisplay(pattern) {

    const labels = {
      initialising: 'Learning behaviour pattern',
      person_not_visible: 'Person not visible',
      lying_transition: 'Moved towards lying position',
      sustained_lying: 'Lying down for sustained period',
      sustained_stationary: 'Standing still for sustained period',
      sitting_down: 'Sitting down',
      standing_up: 'Standing up',
      activity_started: 'Movement started',
      activity_stopped: 'Movement stopped',
      active_movement: 'Active movement',
      standing_observed: 'Standing observed',
      sitting_observed: 'Sitting observed',
      observing: 'Observing behaviour',
    }

    return labels[pattern] || 'Unknown behaviour pattern'

  }

  getTransitionDisplay(transition) {

    const labels = {
      none: 'No transition yet',
      entered_view: 'Person entered camera view',
      left_view: 'Person left camera view',
      sat_down: 'Standing to sitting',
      stood_up: 'Sitting to standing',
      moved_to_lying: 'Moved to lying posture',
      posture_changed: 'Posture changed',
      movement_started: 'Movement started',
      movement_stopped: 'Movement stopped',
      stable: 'Stable behaviour',
    }

    return labels[transition] || 'Unknown transition'

  }

  emptyResult(message) {

    return {
      status: 'empty',
      provider: 'BEHAVIOUR_PATTERN_ENGINE',
      pattern: 'unknown',
      patternDisplay: 'Unknown behaviour pattern',
      transition: 'none',
      transitionDisplay: 'No transition yet',
      confidence: 0,
      riskModifier: 0,
      summary: message,
    }

  }

}

export default new BehaviourPatternEngine()
