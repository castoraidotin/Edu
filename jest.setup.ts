import '@testing-library/jest-dom'

// jsdom doesn't implement navigator.sendBeacon. lib/analytics.ts's trackEvent()
// calls it on every fire-and-forget event to our Supabase sink, falling back to
// fetch() only when sendBeacon is unavailable — without this stub, every
// component test that triggers a trackEvent() call would silently consume a
// slot in that test's own mocked fetch() call sequence. Some suites opt into
// `@jest-environment node` (no window/navigator at all), so guard for that.
if (typeof window !== 'undefined') {
  Object.defineProperty(window.navigator, 'sendBeacon', {
    value: jest.fn().mockReturnValue(true),
    configurable: true,
    writable: true,
  })
}
