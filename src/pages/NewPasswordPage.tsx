import { useEffect, useState, type FormEvent } from 'react'
import { useNavigate } from 'react-router-dom'
import { supabase } from '../lib/supabase'
import { Button, Input, Card, Alert } from '../components/ui'

// Tela aberta a partir do link enviado por e-mail (fluxo "esqueci a senha").
// O Supabase cria uma sessão temporária de recuperação ao abrir o link.
export function NewPasswordPage() {
  const navigate = useNavigate()
  const [ready, setReady] = useState(false)
  const [password, setPassword] = useState('')
  const [confirm, setConfirm] = useState('')
  const [error, setError] = useState('')
  const [loading, setLoading] = useState(false)

  useEffect(() => {
    // Garante que há uma sessão (vinda do link) antes de permitir trocar a senha.
    supabase.auth.getSession().then(({ data }) => {
      if (!data.session) {
        setError('Link inválido ou expirado. Solicite a recuperação novamente.')
      }
      setReady(true)
    })
  }, [])

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
    const { error } = await supabase.auth.updateUser({ password })
    setLoading(false)
    if (error) {
      setError(error.message)
      return
    }
    navigate('/')
  }

  if (!ready) return null

  return (
    <div className="mt-6 space-y-5">
      <h1 className="text-center text-2xl font-bold text-slate-800 dark:text-slate-100">Definir nova senha</h1>
      <Card>
        <form onSubmit={handleSubmit} className="space-y-4">
          {error && <Alert>{error}</Alert>}
          <Input label="Nova senha" type="password" autoComplete="new-password" required value={password} onChange={(e) => setPassword(e.target.value)} />
          <Input label="Confirmar nova senha" type="password" autoComplete="new-password" required value={confirm} onChange={(e) => setConfirm(e.target.value)} />
          <Button type="submit" className="w-full" disabled={loading}>
            {loading ? 'Salvando…' : 'Salvar nova senha'}
          </Button>
        </form>
      </Card>
    </div>
  )
}
