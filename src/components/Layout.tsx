import type { ReactNode } from 'react'
import { Link, useNavigate } from 'react-router-dom'
import { supabase } from '../lib/supabase'
import { useAuth } from '../auth/AuthContext'

export function Layout({ children }: { children: ReactNode }) {
  const { user } = useAuth()
  const navigate = useNavigate()

  async function handleLogout() {
    await supabase.auth.signOut()
    navigate('/login')
  }

  return (
    <div className="mx-auto flex min-h-full w-full max-w-lg flex-col">
      <header className="sticky top-0 z-10 flex items-center justify-between border-b border-slate-200 bg-white/90 px-4 py-3 backdrop-blur">
        <Link to="/" className="flex items-center gap-2 font-bold text-brand-600">
          <span className="text-xl">🗂️</span>
          <span>Meu Arquivo</span>
        </Link>
        {user && (
          <div className="flex items-center gap-1">
            <Link to="/conta" className="rounded-lg px-3 py-2 text-sm text-slate-600 hover:bg-slate-100">
              Conta
            </Link>
            <button onClick={handleLogout} className="rounded-lg px-3 py-2 text-sm text-slate-600 hover:bg-slate-100">
              Sair
            </button>
          </div>
        )}
      </header>
      <main className="flex-1 px-4 py-5">{children}</main>
    </div>
  )
}
