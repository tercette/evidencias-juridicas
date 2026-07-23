import type { ReactNode } from 'react'
import { Link, useNavigate } from 'react-router-dom'
import { supabase } from '../lib/supabase'
import { useAuth } from '../auth/AuthContext'
import { ThemeToggle } from './ThemeToggle'

export function Layout({ children }: { children: ReactNode }) {
  const { user } = useAuth()
  const navigate = useNavigate()

  async function handleLogout() {
    await supabase.auth.signOut()
    navigate('/login')
  }

  return (
    <div className="mx-auto flex min-h-full w-full max-w-lg flex-col">
      <header className="sticky top-0 z-10 flex items-center justify-between border-b border-slate-200 bg-white/90 px-4 py-3 backdrop-blur dark:border-slate-800 dark:bg-slate-900/90">
        <Link to="/" className="flex items-center gap-2 font-bold text-brand-600 dark:text-brand-100">
          <span className="text-xl">🗂️</span>
          <span>Meu Arquivo</span>
        </Link>
        <div className="flex items-center gap-1">
          <ThemeToggle />
          {user && (
            <>
              <Link
                to="/conta"
                className="rounded-lg px-3 py-2 text-sm text-slate-600 hover:bg-slate-100 dark:text-slate-300 dark:hover:bg-slate-800"
              >
                Conta
              </Link>
              <button
                onClick={handleLogout}
                className="rounded-lg px-3 py-2 text-sm text-slate-600 hover:bg-slate-100 dark:text-slate-300 dark:hover:bg-slate-800"
              >
                Sair
              </button>
            </>
          )}
        </div>
      </header>
      {/* pb generoso: no celular o último botão não fica colado no fim da tela */}
      <main className="flex-1 px-4 pt-5 pb-20">{children}</main>
    </div>
  )
}
