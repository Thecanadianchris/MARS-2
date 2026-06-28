/**
 * ==========================================================
 * MARS SOFTWARE PROJECT
 * ----------------------------------------------------------
 * Module:
 * VisionPipeline
 *
 * Purpose:
 * Central processing pipeline for camera frames.
 *
 * Version:
 * v0.10.3
 *
 * Date Code:
 * 280626
 * ==========================================================
 */

import MovementAnalysisService from './MovementAnalysisService'
import PoseDetectionService from './PoseDetectionService'

class VisionPipeline {
  async processFrame(frame) {
    if (!frame) {
      return {
        status: 'error',
        provider: 'LOCAL_PIPELINE',
        timestamp: Date.now(),
        summary: 'No frame supplied to VisionPipeline.',
      }
    }

    const startTime = performance.now()

    //----------------------------------------------------------
    // Pose Detection
    //----------------------------------------------------------

    const poseResult = await PoseDetectionService.detectPose(frame)

    //----------------------------------------------------------
    // Base Vision Result
    //----------------------------------------------------------

    const baseResult = {
      status: 'success',
      provider: 'LOCAL_PIPELINE',
      timestamp: Date.now(),

      frame: {
        width: frame.width,
        height: frame.height,
        timestamp: frame.timestamp,
      },

      performance: {
        fps: 30,
        latencyMs: Math.round(performance.now() - startTime),
      },

      detections: {
        people: poseResult.poseDetected ? 1 : 0,
        faces: 0,
        objects: 0,
        pose: poseResult.pose,
      },

      pose: poseResult,

      risk: {
        level: 0,
        label: 'normal',
        confidence: 0,
      },

      summary: poseResult.summary,
    }

    //----------------------------------------------------------
    // Movement Analysis
    //----------------------------------------------------------

    const movement = MovementAnalysisService.analyse(baseResult)

    return {
      ...baseResult,

      movement,

      summary:
        `${poseResult.summary}\n` +
        `Movement: ${movement.movement}\n` +
        `Posture: ${movement.posture}`,
    }
  }
}

export default new VisionPipeline()