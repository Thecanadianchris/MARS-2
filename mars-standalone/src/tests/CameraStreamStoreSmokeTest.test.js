/**
 * ==========================================================
 * MARS SOFTWARE PROJECT
 * ----------------------------------------------------------
 * Smoke Test:
 * CameraStreamStoreSmokeTest
 *
 * Purpose:
 * Vitest smoke test for CameraStreamStore (v0.16.6 shared-stream
 * store, v0.16.9 registered start-handler). Carried over from the
 * v0.16.9 backlog as "not yet built" — pure logic, no real
 * MediaStream/DOM required, so it's fully testable with plain mock
 * objects/functions, same convention as every other singleton
 * service test in this suite.
 *
 * Version:
 * v0.16.15
 *
 * Date Code:
 * 170726
 * ==========================================================
 */

import { beforeEach, describe, expect, it, vi } from 'vitest'
import CameraStreamStore from '../services/vision/CameraStreamStore.js'

describe('CameraStreamStore Smoke Test', () => {
  beforeEach(() => {
    CameraStreamStore.reset()
  })

  describe('stream storage', () => {
    it('has no stream initially', () => {
      expect(CameraStreamStore.getStream()).toBe(null)
    })

    it('setStream stores and returns the same stream reference', () => {
      const mockStream = { id: 'mock-stream-1' }

      CameraStreamStore.setStream(mockStream)

      expect(CameraStreamStore.getStream()).toBe(mockStream)
    })

    it('setStream(null) or setStream() clears the stream, same as clearStream()', () => {
      CameraStreamStore.setStream({ id: 'mock-stream-2' })
      CameraStreamStore.setStream(null)

      expect(CameraStreamStore.getStream()).toBe(null)
    })

    it('clearStream removes a previously set stream', () => {
      CameraStreamStore.setStream({ id: 'mock-stream-3' })
      CameraStreamStore.clearStream()

      expect(CameraStreamStore.getStream()).toBe(null)
    })
  })

  describe('subscribe/emit', () => {
    it('notifies subscribers with the current stream when it changes', () => {
      const listener = vi.fn()
      CameraStreamStore.subscribe(listener)

      const mockStream = { id: 'mock-stream-4' }
      CameraStreamStore.setStream(mockStream)

      expect(listener).toHaveBeenCalledWith(mockStream)
    })

    it('notifies subscribers with null on clearStream', () => {
      const listener = vi.fn()
      CameraStreamStore.setStream({ id: 'mock-stream-5' })
      CameraStreamStore.subscribe(listener)

      CameraStreamStore.clearStream()

      expect(listener).toHaveBeenCalledWith(null)
    })

    it('unsubscribe stops further notifications', () => {
      const listener = vi.fn()
      const unsubscribe = CameraStreamStore.subscribe(listener)

      unsubscribe()
      CameraStreamStore.setStream({ id: 'mock-stream-6' })

      expect(listener).not.toHaveBeenCalled()
    })

    it('ignores a non-function passed to subscribe without throwing', () => {
      expect(() => CameraStreamStore.subscribe('not-a-function')).not.toThrow()
      expect(() => CameraStreamStore.setStream({ id: 'mock-stream-7' })).not.toThrow()
    })

    it("a listener that throws doesn't break emit() for other listeners or the caller", () => {
      const badListener = () => {
        throw new Error('listener blew up')
      }
      const goodListener = vi.fn()

      CameraStreamStore.subscribe(badListener)
      CameraStreamStore.subscribe(goodListener)

      expect(() => CameraStreamStore.setStream({ id: 'mock-stream-8' })).not.toThrow()
      expect(goodListener).toHaveBeenCalled()
    })
  })

  describe('requestStart() — the v0.16.9 Enroll-can-start-the-camera fix', () => {
    it('resolves already-active immediately when a stream already exists, without calling the handler', async () => {
      const handler = vi.fn()
      CameraStreamStore.setStartHandler(handler)
      CameraStreamStore.setStream({ id: 'mock-stream-9' })

      const result = await CameraStreamStore.requestStart()

      expect(result).toEqual({ status: 'already-active' })
      expect(handler).not.toHaveBeenCalled()
    })

    it('resolves no-handler when nothing is registered yet', async () => {
      const result = await CameraStreamStore.requestStart()

      expect(result).toEqual({ status: 'no-handler' })
    })

    it('setStartHandler ignores a non-function, leaving no handler registered', async () => {
      CameraStreamStore.setStartHandler('not-a-function')

      const result = await CameraStreamStore.requestStart()

      expect(result).toEqual({ status: 'no-handler' })
    })

    it('calls the registered handler and resolves started once it actually sets a stream', async () => {
      const handler = vi.fn(async () => {
        CameraStreamStore.setStream({ id: 'mock-stream-10' })
      })
      CameraStreamStore.setStartHandler(handler)

      const result = await CameraStreamStore.requestStart()

      expect(handler).toHaveBeenCalledTimes(1)
      expect(result).toEqual({ status: 'started' })
    })

    it('resolves start-failed when the handler runs but no stream ever lands', async () => {
      const handler = vi.fn(async () => {
        // Simulates permission denied / camera unavailable: handler
        // completes without ever calling setStream().
      })
      CameraStreamStore.setStartHandler(handler)

      const result = await CameraStreamStore.requestStart()

      expect(result).toEqual({ status: 'start-failed' })
    })

    it('resolves start-failed (never throws) when the handler itself throws', async () => {
      const handler = vi.fn(async () => {
        throw new Error('camera permission denied')
      })
      CameraStreamStore.setStartHandler(handler)

      await expect(CameraStreamStore.requestStart()).resolves.toEqual({ status: 'start-failed' })
    })

    it('a fresh registered handler replaces a stale one (ref-indirection pattern used by VisionPanel)', async () => {
      const staleHandler = vi.fn(async () => {
        CameraStreamStore.setStream({ id: 'from-stale-handler' })
      })
      const freshHandler = vi.fn(async () => {
        CameraStreamStore.setStream({ id: 'from-fresh-handler' })
      })

      CameraStreamStore.setStartHandler(staleHandler)
      CameraStreamStore.setStartHandler(freshHandler)

      await CameraStreamStore.requestStart()

      expect(freshHandler).toHaveBeenCalledTimes(1)
      expect(staleHandler).not.toHaveBeenCalled()
      expect(CameraStreamStore.getStream()).toEqual({ id: 'from-fresh-handler' })
    })
  })

  describe('reset()', () => {
    it('clears stream, start handler and listeners back to a clean slate', async () => {
      const listener = vi.fn()
      CameraStreamStore.setStream({ id: 'mock-stream-11' })
      CameraStreamStore.setStartHandler(vi.fn())
      CameraStreamStore.subscribe(listener)

      CameraStreamStore.reset()

      expect(CameraStreamStore.getStream()).toBe(null)
      expect(await CameraStreamStore.requestStart()).toEqual({ status: 'no-handler' })
      CameraStreamStore.setStream({ id: 'mock-stream-12' })
      expect(listener).not.toHaveBeenCalled()
    })
  })
})
