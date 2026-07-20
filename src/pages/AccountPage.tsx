import { useState, type FormEvent } from 'react'
import { supabase } from '../lib/supabase'
import { useAuth } from '../auth/AuthContext'
import { Button, Input, Card, Alert } from '../components/ui'

export function AccountPage() {
  const { user } = useAuth()
  const [password, setPassword] = useState('')
  const [confirm, setConfirm] = useState('')
  const [msg, setMsg] = useState('')
  const [error, setError] = useState('')
  const [loading, setLoading] = useState(false)

  async function handleSubmit(e: FormEvent) {
    e.preventDefault()
    setError('')
    setMsg('')
    if (password.length < 6) {
      setError('A senha precisa ter pelo menos 6 caracteres.')
      return
    }
    if (password !== confirm) {
      setError('As senhas não conferem.')
      return
    }
    setLoading(true)
    const { error } = await supabase.auth.updateUser({ password })
    setLoading(false)
    if (error) {
      setError(error.message)
      return
    }
    setPassword('')
    setConfirm('')
    setMsg('Senha alterada com sucesso.')
  }

  return (
    <div className="space-y-5">
      <h1 className="text-xl font-bold text-slate-800">Minha conta</h1>
      <Card>
        <div className="text-sm text-slate-500">Conectado como</div>
        <div className="font-medium text-slate-800">{user?.email}</div>
      </Card>

      <Card>
        <h2 className="mb-3 font-semibold text-slate-800">Trocar senha</h2>
        <form onSubmit={handleSubmit} className="space-y-4">
          {error && <Alert>{error}</Alert>}
          {msg && <Alert type="success">{msg}</Alert>}
          <Input label="Nova senha" type="password" autoComplete="new-password" required value={password} onChange={(e) => setPassword(e.target.value)} />
          <Input label="Confirmar nova senha" type="password" autoComplete="new-password" required value={confirm} onChange={(e) => setConfirm(e.target.value)} />
          <Button type="submit" className="w-full" disabled={loading}>
            {loading ? 'Salvando…' : 'Salvar'}
          </Button>
        </form>
      </Card>
    </div>
  )
}
