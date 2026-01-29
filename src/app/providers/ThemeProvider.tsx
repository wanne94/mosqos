import { createContext, useContext, useEffect, useState, ReactNode } from 'react'

type Theme = 'light' | 'dark' | 'system'

interface ThemeContextType {
  theme: Theme
  setTheme: (theme: Theme) => void
  resolvedTheme: 'light' | 'dark'
  ramadanMode: boolean
  setRamadanMode: (enabled: boolean) => void
}

const ThemeContext = createContext<ThemeContextType | undefined>(undefined)

function getSystemTheme(): 'light' | 'dark' {
  if (typeof window !== 'undefined') {
    return window.matchMedia('(prefers-color-scheme: dark)').matches ? 'dark' : 'light'
  }
  return 'light'
}

export function ThemeProvider({ children }: { children: ReactNode }) {
  const [theme, setThemeState] = useState<Theme>(() => {
    if (typeof window !== 'undefined') {
      return (localStorage.getItem('mosqos-theme') as Theme) || 'system'
    }
    return 'system'
  })

  const [ramadanMode, setRamadanModeState] = useState(() => {
    if (typeof window !== 'undefined') {
      return localStorage.getItem('mosqos-ramadan') === 'true'
    }
    return false
  })

  const [resolvedTheme, setResolvedTheme] = useState<'light' | 'dark'>(() => {
    if (theme === 'system') {
      return getSystemTheme()
    }
    return theme
  })

  useEffect(() => {
    const root = document.documentElement

    // Handle theme
    if (theme === 'system') {
      const systemTheme = getSystemTheme()
      setResolvedTheme(systemTheme)
      root.classList.remove('light', 'dark')
      root.classList.add(systemTheme)
    } else {
      setResolvedTheme(theme)
      root.classList.remove('light', 'dark')
      root.classList.add(theme)
    }

    // Listen for system theme changes
    const mediaQuery = window.matchMedia('(prefers-color-scheme: dark)')
    const handleChange = () => {
      if (theme === 'system') {
        const newTheme = getSystemTheme()
        setResolvedTheme(newTheme)
        root.classList.remove('light', 'dark')
        root.classList.add(newTheme)
      }
    }

    mediaQuery.addEventListener('change', handleChange)
    return () => mediaQuery.removeEventListener('change', handleChange)
  }, [theme])

  useEffect(() => {
    // Handle Ramadan mode
    const root = document.documentElement
    if (ramadanMode) {
      root.classList.add('ramadan')
    } else {
      root.classList.remove('ramadan')
    }
  }, [ramadanMode])

  const setTheme = (newTheme: Theme) => {
    setThemeState(newTheme)
    localStorage.setItem('mosqos-theme', newTheme)
  }

  const setRamadanMode = (enabled: boolean) => {
    setRamadanModeState(enabled)
    localStorage.setItem('mosqos-ramadan', String(enabled))
  }

  return (
    <ThemeContext.Provider value={{
      theme,
      setTheme,
      resolvedTheme,
      ramadanMode,
      setRamadanMode,
    }}>
      {children}
    </ThemeContext.Provider>
  )
}

export function useTheme() {
  const context = useContext(ThemeContext)
  if (context === undefined) {
    throw new Error('useTheme must be used within a ThemeProvider')
  }
  return context
}
