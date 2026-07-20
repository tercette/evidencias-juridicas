import { useState, type FormEvent } from 'react'
import { Link, useNavigate } from 'react-router-dom'
import { supabase } from '../lib/supabase'
import { Button, Input, Card, Alert } from '../components/ui'

// Recuperação de senha por CÓDIGO de 6 dígitos (verifyOtp), e não por link.
// Motivo: filtros de segurança de e-mail (ex.: Safe Links do Outlook/Office365)
// pré-abrem os links e consomem o token de uso único, fazendo o link chegar
// "expirado". Um código digitado pelo usuário não sofre esse problema.
export function ForgotPasswordPage() {
  const navigate = useNavigate()
  const [step, setStep] = useState<'email' | 'code'>('email')
  const [email, setEmail] = useState('')
  const [code, setCode] = useState('')
  const [password, setPassword] = useState('')
  const [confirm, setConfirm] = useState('')
  const [error, setError] = useState('')
  const [loading, setLoading] = useState(false)

  // Passo 1: envia o e-mail de recuperação (que agora inclui o código {{ .Token }}).
  async function requestCode(e: FormEvent) {
    e.preventDefault()
    setError('')
    setLoading(true)
    const { error } = await supabase.auth.resetPasswordForEmail(email.trim())
    setLoading(false)
    if (error) {
      setError(error.message)
      return
    }
    setStep('code')
  }

  // Passo 2: valida o código e, com a sessão criada, troca a senha.
  async function verifyAndReset(e: FormEvent) {
    e.preventDefault()
    setError('')
    if (!/^\d{6}$/.test(code.trim())) {
      setError('Digite o código de 6 dígitos que enviamos por e-mail.')
      return
    }
    if (password.length < 6) {
      setError('A senha precisa ter pelo menos 6 caracteres.')
      return
    }
    if (password !== confirm) {
      setError('As senhas não conferem.')
      return
    }
    setLoading(true)
    const { error: otpError } = await supabase.auth.verifyOtp({
      email: email.trim(),
      token: code.trim(),
      type: 'recovery',
    })
    if (otpError) {
      setLoading(false)
      setError('Código inválido ou expirado. Verifique os dígitos ou solicite um novo código.')
      return
    }
    const { error: updateError } = await supabase.auth.updateUser({ password })
    setLoading(false)
    if (updateError) {
      setError(updateError.message)
      return
    }
    navigate('/')
  }

  async function resendCode() {
    setError('')
    setLoading(true)
    const { error } = await supabase.auth.resetPasswordForEmail(email.trim())
    setLoading(false)
    if (error) setError(error.message)
  }

  return (
    <div className="mt-6 space-y-5">
      <h1 className="text-center text-2xl font-bold text-slate-800 dark:text-slate-100">Recuperar senha</h1>
      <Card>
        {step === 'email' ? (
          <form onSubmit={requestCode} className="space-y-4">
            {error && <Alert>{error}</Alert>}
            <p className="text-sm text-slate-500 dark:text-slate-400">
              Informe seu e-mail e enviaremos um <b>código de 6 dígitos</b> para criar uma nova senha.
            </p>
            <Input
              label="E-mail"
              type="email"
              autoComplete="email"
              required
              value={email}
              onChange={(e) => setEmail(e.target.value)}
            />
            <Button type="submit" className="w-full" disabled={loading}>
              {loading ? 'Enviando…' : 'Enviar código'}
            </Button>
          </form>
        ) : (
          <form onSubmit={verifyAndReset} className="space-y-4">
            {error && <Alert>{error}</Alert>}
            <Alert type="success">
              Enviamos um código de 6 dígitos para <b>{email}</b>. Confira sua caixa de entrada (e o spam).
            </Alert>
            <Input
              label="Código de 6 dígitos"
              inputMode="numeric"
              autoComplete="one-time-code"
              maxLength={6}
              placeholder="000000"
              required
              value={code}
              onChange={(e) => setCode(e.target.value.replace(/\D/g, ''))}
            />
            <Input
              label="Nova senha"
              type="password"
              autoComplete="new-password"
              required
              value={password}
              onChange={(e) => setPassword(e.target.value)}
            />
            <Input
              label="Confirmar nova senha"
              type="password"
              autoComplete="new-password"
              required
              value={confirm}
              onChange={(e) => setConfirm(e.target.value)}
            />
            <Button type="submit" className="w-full" disabled={loading}>
              {loading ? 'Salvando…' : 'Salvar nova senha'}
            </Button>
            <div className="flex items-center justify-between text-sm">
              <button
                type="button"
                onClick={() => {
                  setStep('email')
                  setCode('')
                  setError('')
                }}
                className="text-slate-500 hover:underline dark:text-slate-400"
              >
                ← Trocar e-mail
              </button>
              <button
                type="button"
                onClick={resendCode}
                disabled={loading}
                className="text-brand-600 hover:underline disabled:opacity-50 dark:text-brand-100"
              >
                Reenviar código
              </button>
            </div>
          </form>
        )}
        <Link to="/login" className="mt-4 block text-center text-sm text-brand-600 hover:underline dark:text-brand-100">
          Voltar ao login
        </Link>
      </Card>
    </div>
  )
}
