import { useState, type FormEvent } from 'react'
import { Link } from 'react-router-dom'
import { supabase } from '../lib/supabase'
import { Button, Input, Card, Alert } from '../components/ui'

export function ForgotPasswordPage() {
  const [email, setEmail] = useState('')
  const [sent, setSent] = useState(false)
  const [error, setError] = useState('')
  const [loading, setLoading] = useState(false)

  async function handleSubmit(e: FormEvent) {
    e.preventDefault()
    setError('')
    setLoading(true)
    // Redireciona de volta ao app (respeitando o base do GitHub Pages) na tela de nova senha.
    const redirectTo = `${window.location.origin}${import.meta.env.BASE_URL}nova-senha`
    const { error } = await supabase.auth.resetPasswordForEmail(email, { redirectTo })
    setLoading(false)
    if (error) {
      setError(error.message)
      return
    }
    setSent(true)
  }

  return (
    <div className="mt-6 space-y-5">
      <h1 className="text-center text-2xl font-bold text-slate-800">Recuperar senha</h1>
      <Card>
        {sent ? (
          <Alert type="success">
            Se existir uma conta com esse e-mail, enviamos um link para redefinir a senha. Confira sua caixa de entrada.
          </Alert>
        ) : (
          <form onSubmit={handleSubmit} className="space-y-4">
            {error && <Alert>{error}</Alert>}
            <p className="text-sm text-slate-500">Informe seu e-mail e enviaremos um link para criar uma nova senha.</p>
            <Input label="E-mail" type="email" required value={email} onChange={(e) => setEmail(e.target.value)} />
            <Button type="submit" className="w-full" disabled={loading}>
              {loading ? 'Enviando…' : 'Enviar link'}
            </Button>
          </form>
        )}
        <Link to="/login" className="mt-4 block text-center text-sm text-brand-600 hover:underline">
          Voltar ao login
        </Link>
      </Card>
    </div>
  )
}
