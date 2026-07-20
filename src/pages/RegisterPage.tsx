import { useState, type FormEvent } from 'react'
import { Link } from 'react-router-dom'
import { supabase } from '../lib/supabase'
import { Button, Input, Card, Alert } from '../components/ui'

export function RegisterPage() {
  const [email, setEmail] = useState('')
  const [password, setPassword] = useState('')
  const [confirm, setConfirm] = useState('')
  const [error, setError] = useState('')
  const [done, setDone] = useState(false)
  const [loading, setLoading] = useState(false)

  async function handleSubmit(e: FormEvent) {
    e.preventDefault()
    setError('')
    if (password.length < 6) {
      setError('A senha precisa ter pelo menos 6 caracteres.')
      return
    }
    if (password !== confirm) {
      setError('As senhas não conferem.')
      return
    }
    setLoading(true)
    const { error } = await supabase.auth.signUp({ email, password })
    setLoading(false)
    if (error) {
      setError(error.message)
      return
    }
    setDone(true)
  }

  if (done) {
    return (
      <div className="mt-10">
        <Card>
          <Alert type="success">
            Conta criada! Verifique seu e-mail para confirmar o cadastro (se a confirmação por e-mail estiver ativada) e
            depois faça login.
          </Alert>
          <Link to="/login" className="mt-4 block text-center text-brand-600 hover:underline">
            Ir para o login
          </Link>
        </Card>
      </div>
    )
  }

  return (
    <div className="mt-6 space-y-5">
      <h1 className="text-center text-2xl font-bold text-slate-800">Criar conta</h1>
      <Card>
        <form onSubmit={handleSubmit} className="space-y-4">
          {error && <Alert>{error}</Alert>}
          <Input label="E-mail" type="email" autoComplete="email" required value={email} onChange={(e) => setEmail(e.target.value)} />
          <Input label="Senha" type="password" autoComplete="new-password" required value={password} onChange={(e) => setPassword(e.target.value)} />
          <Input label="Confirmar senha" type="password" autoComplete="new-password" required value={confirm} onChange={(e) => setConfirm(e.target.value)} />
          <Button type="submit" className="w-full" disabled={loading}>
            {loading ? 'Criando…' : 'Criar conta'}
          </Button>
        </form>
        <Link to="/login" className="mt-4 block text-center text-sm text-brand-600 hover:underline">
          Já tenho conta
        </Link>
      </Card>
    </div>
  )
}
