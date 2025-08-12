import React from 'react'
import { describe, expect, it, vi, beforeAll } from 'vitest'
import { render } from '@testing-library/react'

// Mock next-themes to avoid environment-specific issues in tests
vi.mock('next-themes', () => ({
  useTheme: () => ({ theme: 'light' }),
  ThemeProvider: ({ children }: any) => <>{children}</>,
}))

// Mock matchMedia for libraries that rely on it (e.g., Radix, media queries)
beforeAll(() => {
  if (!('matchMedia' in window)) {
    // @ts-expect-error add mock for JSDOM
    window.matchMedia = vi.fn().mockImplementation((query: string) => ({
      matches: false,
      media: query,
      onchange: null,
      addListener: vi.fn(),
      removeListener: vi.fn(),
      addEventListener: vi.fn(),
      removeEventListener: vi.fn(),
      dispatchEvent: vi.fn(),
    }))
  }
})

describe('App default export and render', () => {
  it('has a default export', async () => {
    const AppModule = await import('@/App')
    expect(AppModule).toHaveProperty('default')
    expect(typeof AppModule.default).toBe('function')
  })

  it('renders without crashing', async () => {
    const { default: App } = await import('@/App')
    const { unmount } = render(<App />)
    // If render succeeds, unmount to clean up
    unmount()
    expect(true).toBe(true)
  })
})
