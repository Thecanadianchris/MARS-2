/**
 * ==========================================================
 * MARS SOFTWARE PROJECT
 * ----------------------------------------------------------
 * Service:
 * BehaviourHistoryEngine
 *
 * Purpose:
 * Maintains short-term behaviour history for the MARS Vision
 * Pipeline.
 *
 * This engine deliberately contains NO MediaPipe code.
 * It receives structured pipeline results and tracks behaviour
 * patterns over time.
 *
 * Version:
 * v0.10.8
 *
 * Date Code:
 * 280626
 * ==========================================================
 */

class BehaviourHistoryEngine {

  constructor() {

    this.history = []
    this.maxHistory = 20
    this.stationaryThresholdMs = 5000
    this.lyingRiskThresholdMs = 5000

  }

  record(pipelineResult) {

    if (!pipelineResult) {

      return this.createEmptyResult('No pipeline result supplied.')

    }

    const entry = this.createHistoryEntry(pipelineResult)

    this.history.push(entry)

    if (this.history.length > this.maxHistory) {

      this.history.shift()

    }

    return this.evaluateHistory()

  }

  createHistoryEntry(pipelineResult) {

    return {

      timestamp: pipelineResult.timestamp || Date.now(),
      bodyVisible: Boolean(pipelineResult.poseSummary?.bodyVisible),
      posture: pipelineResult.bodyState?.posture || 'unknown',
      bodyState: pipelineResult.bodyState?.state || 'unknown',
      movement: pipelineResult.movement?.movement || 'unknown',
      movementDirection: pipelineResult.movement?.direction || 'unknown',
      movementDelta: pipelineResult.movement?.delta || 0,
      movementConfidence: pipelineResult.movement?.confidence || 0,
      riskLevel: pipelineResult.risk?.level || 0,
      centre: pipelineResult.poseSummary?.centre || null,

    }

  }

  evaluateHistory() {

    if (this.history.length === 0) {

      return this.createEmptyResult('No behaviour history available.')

    }

    const latest = this.history[this.history.length - 1]
    const visibleEntries = this.history.filter((entry) => entry.bodyVisible)
    const lyingEntries = this.history.filter((entry) => entry.posture === 'lying')
    const stationaryEntries = this.history.filter(
      (entry) => entry.movement === 'stationary'
    )
    const movingEntries = this.history.filter((entry) => this.isMoving(entry.movement))

    const historyDurationMs = this.calculateDuration(this.history)
    const lyingDurationMs = this.calculateContinuousDuration('posture', 'lying')
    const stationaryDurationMs = this.calculateContinuousDuration(
      'movement',
      'stationary'
    )
    const movingDurationMs = this.calculateContinuousMovingDuration()

    const visibilityRatio = this.calculateRatio(
      visibleEntries.length,
      this.history.length
    )

    const lyingRatio = this.calculateRatio(
      lyingEntries.length,
      this.history.length
    )

    const stationaryRatio = this.calculateRatio(
      stationaryEntries.length,
      this.history.length
    )

    const movingRatio = this.calculateRatio(
      movingEntries.length,
      this.history.length
    )

    const behaviourState = this.estimateBehaviourState({
      latest,
      lyingDurationMs,
      stationaryDurationMs,
      movingDurationMs,
      visibilityRatio,
    })

    const riskModifier = this.calculateRiskModifier({
      latest,
      lyingDurationMs,
      stationaryDurationMs,
      visibilityRatio,
    })

    return {

      status: 'success',
      provider: 'BEHAVIOUR_HISTORY_ENGINE',
      sampleCount: this.history.length,
      historyDurationMs,
      latestPosture: latest.posture,
      latestMovement: latest.movement,
      behaviourState,
      behaviourDisplay: this.getBehaviourDisplay(behaviourState),
      riskModifier,
      timeline: this.getTimeline(),

      ratios: {
        visibility: visibilityRatio,
        lying: lyingRatio,
        stationary: stationaryRatio,
        moving: movingRatio,
      },

      durations: {
        lyingMs: lyingDurationMs,
        stationaryMs: stationaryDurationMs,
        movingMs: movingDurationMs,
      },

      summary: this.createSummary({
        behaviourState,
        latest,
        lyingDurationMs,
        stationaryDurationMs,
        movingDurationMs,
        visibilityRatio,
      }),

    }

  }

  estimateBehaviourState(data) {

    const {
      latest,
      lyingDurationMs,
      stationaryDurationMs,
      movingDurationMs,
      visibilityRatio,
    } = data

    if (!latest.bodyVisible && visibilityRatio < 0.2) {

      return 'not_visible'

    }

    if (
      latest.posture === 'lying' &&
      lyingDurationMs >= this.lyingRiskThresholdMs
    ) {

      return 'lying_sustained'

    }

    if (
      latest.movement === 'stationary' &&
      stationaryDurationMs >= this.stationaryThresholdMs
    ) {

      return 'stationary_sustained'

    }

    if (this.isMoving(latest.movement) && movingDurationMs >= 1000) {

      return 'active_movement'

    }

    if (latest.bodyVisible) {

      return 'body_visible'

    }

    return 'unknown'

  }

  calculateRiskModifier(data) {

    const {
      latest,
      lyingDurationMs,
      stationaryDurationMs,
      visibilityRatio,
    } = data

    let modifier = 0

    if (!latest.bodyVisible && visibilityRatio < 0.2) {

      modifier += 1

    }

    if (
      latest.posture === 'lying' &&
      lyingDurationMs >= this.lyingRiskThresholdMs
    ) {

      modifier += 2

    }

    if (
      latest.movement === 'stationary' &&
      stationaryDurationMs >= this.stationaryThresholdMs
    ) {

      modifier += 1

    }

    return modifier

  }

  calculateContinuousDuration(key, value) {

    if (this.history.length === 0) {

      return 0

    }

    const latest = this.history[this.history.length - 1]

    if (latest[key] !== value) {

      return 0

    }

    let startTimestamp = latest.timestamp

    for (let index = this.history.length - 1; index >= 0; index -= 1) {

      const entry = this.history[index]

      if (entry[key] !== value) {

        break

      }

      startTimestamp = entry.timestamp

    }

    return latest.timestamp - startTimestamp

  }

  calculateContinuousMovingDuration() {

    if (this.history.length === 0) {

      return 0

    }

    const latest = this.history[this.history.length - 1]

    if (!this.isMoving(latest.movement)) {

      return 0

    }

    let startTimestamp = latest.timestamp

    for (let index = this.history.length - 1; index >= 0; index -= 1) {

      const entry = this.history[index]

      if (!this.isMoving(entry.movement)) {

        break

      }

      startTimestamp = entry.timestamp

    }

    return latest.timestamp - startTimestamp

  }

  calculateDuration(entries) {

    if (!entries || entries.length < 2) {

      return 0

    }

    return entries[entries.length - 1].timestamp - entries[0].timestamp

  }

  calculateRatio(part, total) {

    if (!total) {

      return 0

    }

    return Number((part / total).toFixed(2))

  }

  isMoving(movement) {

    return movement === 'moving' || movement === 'moving_fast' || movement === 'active_movement'

  }

  getTimeline() {

    return this.history.slice(-8).map((entry) => ({
      timestamp: entry.timestamp,
      bodyVisible: entry.bodyVisible,
      posture: entry.posture,
      movement: entry.movement,
      direction: entry.movementDirection,
      centre: entry.centre,
    }))

  }

  getBehaviourDisplay(behaviourState) {

    const labels = {
      not_visible: 'Person not visible',
      lying_sustained: 'Lying down for sustained period',
      stationary_sustained: 'Standing still for sustained period',
      active_movement: 'Moving',
      body_visible: 'Person visible',
      unknown: 'Analysing behaviour',
    }

    return labels[behaviourState] || 'Analysing behaviour'

  }

  createSummary(data) {

    const {
      behaviourState,
      latest,
      lyingDurationMs,
      stationaryDurationMs,
      movingDurationMs,
      visibilityRatio,
    } = data

    return (
      `Behaviour state: ${this.getBehaviourDisplay(behaviourState)}. ` +
      `Latest posture: ${latest.posture}. ` +
      `Latest movement: ${latest.movement}. ` +
      `Moving duration: ${Math.round(movingDurationMs / 1000)}s. ` +
      `Lying duration: ${Math.round(lyingDurationMs / 1000)}s. ` +
      `Stationary duration: ${Math.round(stationaryDurationMs / 1000)}s. ` +
      `Visible ratio: ${Math.round(visibilityRatio * 100)}%.`
    )

  }

  createEmptyResult(message) {

    return {
      status: 'empty',
      provider: 'BEHAVIOUR_HISTORY_ENGINE',
      sampleCount: 0,
      historyDurationMs: 0,
      latestPosture: 'unknown',
      latestMovement: 'unknown',
      behaviourState: 'unknown',
      behaviourDisplay: 'Analysing behaviour',
      riskModifier: 0,
      timeline: [],
      ratios: {
        visibility: 0,
        lying: 0,
        stationary: 0,
        moving: 0,
      },
      durations: {
        lyingMs: 0,
        stationaryMs: 0,
        movingMs: 0,
      },
      summary: message,
    }

  }

  reset() {

    this.history = []

  }

}

export default new BehaviourHistoryEngine()
