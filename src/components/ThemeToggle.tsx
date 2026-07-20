import { useTheme } from '../theme/ThemeContext'

// Botão reutilizável de alternância de tema (sol/lua).
export function ThemeToggle({ className = '' }: { className?: string }) {
  const { theme, toggle } = useTheme()
  const isDark = theme === 'dark'
  return (
    <button
      type="button"
      onClick={toggle}
      aria-label={isDark ? 'Ativar tema claro' : 'Ativar tema escuro'}
      title={isDark ? 'Tema claro' : 'Tema escuro'}
      className={`rounded-lg px-3 py-2 text-lg leading-none text-slate-600 hover:bg-slate-100 dark:text-slate-300 dark:hover:bg-slate-800 ${className}`}
    >
      {isDark ? '☀️' : '🌙'}
    </button>
  )
}
