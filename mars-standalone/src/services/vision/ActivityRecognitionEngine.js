/**
 * ==========================================================
 * MARS SOFTWARE PROJECT
 * ----------------------------------------------------------
 * Service:
 * ActivityRecognitionEngine
 *
 * Purpose:
 * Converts behaviour history and behaviour patterns into a
 * higher-level activity estimate for the MARS Vision Pipeline.
 *
 * This engine deliberately contains NO MediaPipe code.
 * It receives structured Vision Pipeline data and identifies
 * human-readable activities such as walking, waiting,
 * approaching, leaving view, sitting down and resting.
 *
 * Version:
 * v0.10.9
 *
 * Date Code:
 * 280626
 * ==========================================================
 */

class ActivityRecognitionEngine {

  evaluate(behaviourHistory, behaviourPattern) {

    if (!behaviourHistory || behaviourHistory.status !== 'success') {

      return this.emptyResult('No behaviour history available for activity recognition.')

    }

    const timeline = behaviourHistory.timeline || []
    const latest = timeline[timeline.length - 1]

    if (!latest) {

      return this.emptyResult('No timeline entries available for activity recognition.')

    }

    if (timeline.length < 3) {

      return {
        status: 'success',
        provider: 'ACTIVITY_RECOGNITION_ENGINE',
        activity: 'learning',
        activityDisplay: 'Learning activity',
        direction: latest.direction || 'unknown',
        confidence: 35,
        riskModifier: 0,
        summary: 'Activity recognition engine is collecting enough history to identify activity.',
      }

    }

    const activity = this.detectActivity(behaviourHistory, behaviourPattern, timeline)
    const confidence = this.calculateConfidence(activity, behaviourHistory, behaviourPattern, timeline)
    const riskModifier = this.calculateRiskModifier(activity, behaviourHistory)

    return {
      status: 'success',
      provider: 'ACTIVITY_RECOGNITION_ENGINE',
      activity,
      activityDisplay: this.getActivityDisplay(activity),
      direction: this.detectDominantDirection(timeline),
      confidence,
      riskModifier,
      summary:
        `Activity: ${this.getActivityDisplay(activity)}. ` +
        `Direction: ${this.getDirectionDisplay(this.detectDominantDirection(timeline))}.`,
    }

  }

  detectActivity(behaviourHistory, behaviourPattern, timeline) {

    const latest = timeline[timeline.length - 1]
    const transition = behaviourPattern?.transition || 'none'
    const pattern = behaviourPattern?.pattern || 'unknown'
    const movingRatio = behaviourHistory.ratios?.moving || 0
    const stationaryRatio = behaviourHistory.ratios?.stationary || 0
    const visibleRatio = behaviourHistory.ratios?.visibility || 0
    const movingMs = behaviourHistory.durations?.movingMs || 0
    const stationaryMs = behaviourHistory.durations?.stationaryMs || 0
    const lyingMs = behaviourHistory.durations?.lyingMs || 0
    const scaleTrend = this.detectScaleTrend(timeline)

    if (!latest.bodyVisible || visibleRatio < 0.25 || transition === 'left_view') {

      return 'left_or_not_visible'

    }

    if (transition === 'entered_view') {

      return 'entered_view'

    }

    if (transition === 'sat_down' || pattern === 'sitting_down') {

      return 'sitting_down'

    }

    if (transition === 'stood_up' || pattern === 'standing_up') {

      return 'standing_up'

    }

    if (pattern === 'sustained_lying' || lyingMs >= 5000) {

      return 'resting_or_lying'

    }

    if (this.isMoving(latest.movement) && scaleTrend === 'approaching') {

      return 'approaching_camera'

    }

    if (this.isMoving(latest.movement) && scaleTrend === 'moving_away') {

      return 'moving_away'

    }

    if (this.isMoving(latest.movement) && movingMs >= 1000) {

      return 'walking'

    }

    if (movingRatio >= 0.45) {

      return 'active_movement'

    }

    if (stationaryMs >= 10000 || stationaryRatio >= 0.75) {

      return 'waiting_or_standing'

    }

    if (latest.posture === 'sitting') {

      return 'sitting'

    }

    if (latest.posture === 'standing') {

      return 'standing'

    }

    return 'observing'

  }

  detectScaleTrend(timeline) {

    const visibleEntries = timeline.filter(
      (entry) => entry.bodyVisible && typeof entry.bodyScale === 'number'
    )

    if (visibleEntries.length < 4) {

      return 'stable'

    }

    const firstWindow = visibleEntries.slice(0, 3)
    const lastWindow = visibleEntries.slice(-3)

    const firstAverage = this.average(firstWindow.map((entry) => entry.bodyScale))
    const lastAverage = this.average(lastWindow.map((entry) => entry.bodyScale))
    const delta = lastAverage - firstAverage

    if (delta >= 0.035) {

      return 'approaching'

    }

    if (delta <= -0.035) {

      return 'moving_away'

    }

    return 'stable'

  }

  detectDominantDirection(timeline) {

    const directions = timeline
      .map((entry) => entry.direction)
      .filter((direction) => direction && direction !== 'unknown' && direction !== 'none')

    if (directions.length === 0) {

      return 'none'

    }

    const counts = directions.reduce((result, direction) => {
      result[direction] = (result[direction] || 0) + 1
      return result
    }, {})

    return Object.entries(counts).sort((a, b) => b[1] - a[1])[0][0]

  }

  calculateRiskModifier(activity, behaviourHistory) {

    let modifier = 0

    if (activity === 'resting_or_lying') {

      modifier += 1

    }

    if (
      activity === 'left_or_not_visible' &&
      (behaviourHistory.ratios?.visibility || 0) < 0.25
    ) {

      modifier += 1

    }

    return modifier

  }

  calculateConfidence(activity, behaviourHistory, behaviourPattern, timeline) {

    const sampleScore = Math.min(40, (behaviourHistory.sampleCount || 0) * 2)
    const visibilityScore = Math.round((behaviourHistory.ratios?.visibility || 0) * 25)
    const patternScore = Math.round((behaviourPattern?.confidence || 0) * 0.25)
    const activityBonus = activity === 'observing' ? 0 : 10
    const timelineBonus = timeline.length >= 6 ? 10 : 0

    return Math.min(
      100,
      sampleScore + visibilityScore + patternScore + activityBonus + timelineBonus
    )

  }

  average(values) {

    if (!values.length) {

      return 0

    }

    return values.reduce((sum, value) => sum + value, 0) / values.length

  }

  isMoving(movement) {

    return movement === 'moving' || movement === 'moving_fast' || movement === 'active_movement'

  }

  getActivityDisplay(activity) {

    const labels = {
      learning: 'Learning activity',
      entered_view: 'Entered camera view',
      left_or_not_visible: 'Person not visible',
      sitting_down: 'Sitting down',
      standing_up: 'Standing up',
      resting_or_lying: 'Resting or lying down',
      approaching_camera: 'Approaching camera',
      moving_away: 'Moving away',
      walking: 'Walking',
      active_movement: 'Moving around',
      waiting_or_standing: 'Waiting or standing still',
      sitting: 'Sitting',
      standing: 'Standing',
      observing: 'Observing activity',
    }

    return labels[activity] || 'Unknown activity'

  }

  getDirectionDisplay(direction) {

    const labels = {
      left: 'left',
      right: 'right',
      up: 'up',
      down: 'down',
      none: 'none',
      unknown: 'unknown',
    }

    return labels[direction] || 'unknown'

  }

  emptyResult(message) {

    return {
      status: 'empty',
      provider: 'ACTIVITY_RECOGNITION_ENGINE',
      activity: 'unknown',
      activityDisplay: 'Unknown activity',
      direction: 'unknown',
      confidence: 0,
      riskModifier: 0,
      summary: message,
    }

  }

}

export default new ActivityRecognitionEngine()
