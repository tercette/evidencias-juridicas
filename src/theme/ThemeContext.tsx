import { createContext, useContext, useEffect, useState, type ReactNode } from 'react'

type Theme = 'light' | 'dark'

interface ThemeContextValue {
  theme: Theme
  toggle: () => void
}

const ThemeContext = createContext<ThemeContextValue | undefined>(undefined)

// Lê o tema inicial na mesma ordem do script anti-flash do index.html:
// preferência salva → preferência do sistema → claro.
function getInitialTheme(): Theme {
  if (typeof window === 'undefined') return 'light'
  try {
    const saved = localStorage.getItem('theme')
    if (saved === 'dark' || saved === 'light') return saved
    if (window.matchMedia('(prefers-color-scheme: dark)').matches) return 'dark'
  } catch {
    /* localStorage indisponível (modo privado, etc.) */
  }
  return 'light'
}

export function ThemeProvider({ children }: { children: ReactNode }) {
  const [theme, setTheme] = useState<Theme>(getInitialTheme)

  useEffect(() => {
    const root = document.documentElement
    root.classList.toggle('dark', theme === 'dark')
    try {
      localStorage.setItem('theme', theme)
    } catch {
      /* ignora falha de persistência */
    }
    // Ajusta a cor da barra do navegador (mobile) conforme o tema.
    const meta = document.querySelector('meta[name="theme-color"]')
    if (meta) meta.setAttribute('content', theme === 'dark' ? '#0f172a' : '#3b5bdb')
  }, [theme])

  function toggle() {
    setTheme((t) => (t === 'dark' ? 'light' : 'dark'))
  }

  return <ThemeContext.Provider value={{ theme, toggle }}>{children}</ThemeContext.Provider>
}

// eslint-disable-next-line react-refresh/only-export-components
export function useTheme() {
  const ctx = useContext(ThemeContext)
  if (!ctx) throw new Error('useTheme deve ser usado dentro de <ThemeProvider>')
  return ctx
}
