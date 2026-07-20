import { useState, type FormEvent } from 'react'
import { Link, useNavigate } from 'react-router-dom'
import { supabase, isSupabaseConfigured } from '../lib/supabase'
import { Button, Input, Card, Alert } from '../components/ui'

export function LoginPage() {
  const navigate = useNavigate()
  const [email, setEmail] = useState('')
  const [password, setPassword] = useState('')
  const [error, setError] = useState('')
  const [loading, setLoading] = useState(false)

  async function handleSubmit(e: FormEvent) {
    e.preventDefault()
    setError('')
    setLoading(true)
    const { error } = await supabase.auth.signInWithPassword({ email, password })
    setLoading(false)
    if (error) {
      setError('E-mail ou senha inválidos.')
      return
    }
    navigate('/')
  }

  return (
    <div className="mt-6 space-y-5">
      <div className="text-center">
        <div className="text-4xl">🗂️</div>
        <h1 className="mt-2 text-2xl font-bold text-slate-800">Arquivo de Evidências</h1>
        <p className="mt-1 text-sm text-slate-500">Entre para acessar seu arquivo pessoal</p>
      </div>

      {!isSupabaseConfigured && (
        <Alert type="info">Configure o arquivo <b>.env</b> com as chaves do Supabase para ativar o login.</Alert>
      )}

      <Card>
        <form onSubmit={handleSubmit} className="space-y-4">
          {error && <Alert>{error}</Alert>}
          <Input
            label="E-mail"
            type="email"
            autoComplete="email"
            required
            value={email}
            onChange={(e) => setEmail(e.target.value)}
          />
          <Input
            label="Senha"
            type="password"
            autoComplete="current-password"
            required
            value={password}
            onChange={(e) => setPassword(e.target.value)}
          />
          <Button type="submit" className="w-full" disabled={loading}>
            {loading ? 'Entrando…' : 'Entrar'}
          </Button>
        </form>
        <div className="mt-4 flex items-center justify-between text-sm">
          <Link to="/recuperar" className="text-brand-600 hover:underline">
            Esqueci a senha
          </Link>
          <Link to="/cadastro" className="text-brand-600 hover:underline">
            Criar conta
          </Link>
        </div>
      </Card>
    </div>
  )
}
