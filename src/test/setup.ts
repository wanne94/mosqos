import '@testing-library/jest-dom/vitest'
import { cleanup } from '@testing-library/react'
import { afterEach, beforeAll, afterAll, vi } from 'vitest'
import { server } from './mocks/server'

// Establish API mocking before all tests
beforeAll(() => {
  server.listen({ onUnhandledRequest: 'warn' })
})

// Reset any request handlers that we may add during the tests
afterEach(() => {
  server.resetHandlers()
  cleanup()
})

// Clean up after the tests are finished
afterAll(() => {
  server.close()
})

// Mock window.matchMedia
Object.defineProperty(window, 'matchMedia', {
  writable: true,
  value: vi.fn().mockImplementation((query) => ({
    matches: false,
    media: query,
    onchange: null,
    addListener: vi.fn(),
    removeListener: vi.fn(),
    addEventListener: vi.fn(),
    removeEventListener: vi.fn(),
    dispatchEvent: vi.fn(),
  })),
})

// Mock IntersectionObserver
class IntersectionObserverMock {
  observe = vi.fn()
  disconnect = vi.fn()
  unobserve = vi.fn()
}

Object.defineProperty(window, 'IntersectionObserver', {
  writable: true,
  value: IntersectionObserverMock,
})

// Mock ResizeObserver
class ResizeObserverMock {
  observe = vi.fn()
  disconnect = vi.fn()
  unobserve = vi.fn()
}

Object.defineProperty(window, 'ResizeObserver', {
  writable: true,
  value: ResizeObserverMock,
})

// Mock scrollTo
window.scrollTo = vi.fn()

// Mock crypto.randomUUID
Object.defineProperty(crypto, 'randomUUID', {
  value: () => 'test-uuid-' + Math.random().toString(36).substring(7),
})
