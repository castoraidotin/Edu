// Verifies the trackEvent wrapper forwards to Vercel's track() in the browser
// and is a safe no-op on the server.
jest.mock('@vercel/analytics', () => ({ track: jest.fn() }))

import { trackEvent } from '@/lib/analytics'
import { track } from '@vercel/analytics'

const mockTrack = track as jest.Mock

describe('trackEvent', () => {
  beforeEach(() => {
    jest.clearAllMocks()
    window.sessionStorage.clear()
  })
  afterEach(() => {
    delete (window as unknown as { va?: unknown }).va
    delete (window as unknown as { vaq?: unknown }).vaq
  })

  it('forwards a no-prop event to Vercel track()', () => {
    trackEvent('landing_viewed')
    expect(mockTrack).toHaveBeenCalledWith('landing_viewed', undefined)
  })

  it('forwards event name and props to Vercel track()', () => {
    trackEvent('quiz_completed', { domain: 'ai', score: 8 })
    expect(mockTrack).toHaveBeenCalledWith('quiz_completed', { domain: 'ai', score: 8 })
  })

  // Regression test: @vercel/analytics/next wraps its real component in a
  // Suspense boundary (it reads useSearchParams), so its effect that creates
  // window.va commits in a later React pass than an ordinary mount effect
  // (e.g. PageViewTracker firing landing_viewed). Before this fix, calling
  // track() while window.va didn't exist yet silently dropped the event —
  // confirmed live in the browser before the fix, and fixed by having
  // trackEvent create the same queue stub Vercel's own inject() creates.
  it('creates a window.va queue stub itself, so an event fired before Vercel\'s <Analytics /> mounts is not silently dropped', () => {
    delete (window as unknown as { va?: unknown }).va
    trackEvent('landing_viewed')
    expect(typeof (window as unknown as { va?: unknown }).va).toBe('function')
  })

  it('does not overwrite an existing window.va, so it stays compatible with the queue Vercel\'s own <Analytics /> creates', () => {
    const existingVa = jest.fn()
    ;(window as unknown as { va?: unknown }).va = existingVa
    trackEvent('domain_selected', { domain: 'ai' })
    expect((window as unknown as { va?: unknown }).va).toBe(existingVa)
  })

  // Server no-op test lives in analytics-server.test.ts (@jest-environment node),
  // because jsdom's window is non-configurable and cannot be shadowed here.

  // Vercel Web Analytics gates custom events behind a Pro plan, so every
  // trackEvent() call also beacons the same event to our own Supabase-backed
  // sink. These tests cover that delivery path independently of track().
  describe('sendToSupabase (Supabase event sink)', () => {
    const originalSendBeacon = navigator.sendBeacon
    const originalFetch = global.fetch

    afterEach(() => {
      Object.defineProperty(navigator, 'sendBeacon', { value: originalSendBeacon, configurable: true })
      global.fetch = originalFetch
    })

    it('beacons the event name and props to /api/analytics/track via sendBeacon', () => {
      const sendBeacon = jest.fn().mockReturnValue(true)
      Object.defineProperty(navigator, 'sendBeacon', { value: sendBeacon, configurable: true })

      trackEvent('quiz_completed', { domain: 'ai', score: 8 })

      expect(sendBeacon).toHaveBeenCalledTimes(1)
      const [url, blob] = sendBeacon.mock.calls[0]
      expect(url).toBe('/api/analytics/track')
      expect(blob).toBeInstanceOf(Blob)
    })

    it('falls back to fetch with keepalive when sendBeacon is unavailable', () => {
      Object.defineProperty(navigator, 'sendBeacon', { value: undefined, configurable: true })
      const mockFetch = jest.fn().mockResolvedValue({ ok: true })
      global.fetch = mockFetch

      trackEvent('domain_selected', { domain: 'cloud' })

      expect(mockFetch).toHaveBeenCalledTimes(1)
      const [url, init] = mockFetch.mock.calls[0]
      expect(url).toBe('/api/analytics/track')
      expect(init.keepalive).toBe(true)
      const body = JSON.parse(init.body)
      expect(body.name).toBe('domain_selected')
      expect(body.props).toEqual({ domain: 'cloud' })
    })

    it('does not throw when both sendBeacon and fetch are unavailable', () => {
      Object.defineProperty(navigator, 'sendBeacon', { value: undefined, configurable: true })
      // @ts-expect-error - simulate fetch missing entirely
      delete global.fetch

      expect(() => trackEvent('landing_viewed')).not.toThrow()
    })
  })
})
