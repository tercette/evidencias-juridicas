import { useEffect, useState } from 'react'
import { useNavigate } from 'react-router-dom'
import { QRCodeCanvas } from 'qrcode.react'
import type { ShareLink } from '../types'
import { listShareLinks, createShareLink, revokeShareLink, publicViewUrl } from '../lib/share'
import { Button, Input, Card, Spinner, Alert } from '../components/ui'

export function SharePage() {
  const navigate = useNavigate()
  const [links, setLinks] = useState<ShareLink[]>([])
  const [label, setLabel] = useState('')
  const [loading, setLoading] = useState(true)
  const [creating, setCreating] = useState(false)
  const [error, setError] = useState('')

  useEffect(() => {
    listShareLinks()
      .then(setLinks)
      .catch((e) => setError(e.message))
      .finally(() => setLoading(false))
  }, [])

  async function handleCreate() {
    setCreating(true)
    try {
      const link = await createShareLink(label.trim())
      setLinks((prev) => [link, ...prev])
      setLabel('')
    } catch (e) {
      setError((e as Error).message)
    } finally {
      setCreating(false)
    }
  }

  async function handleRevoke(id: string) {
    if (!confirm('Revogar este link? Quem tiver o link/QR deixará de ver as evidências.')) return
    await revokeShareLink(id)
    setLinks((prev) => prev.map((l) => (l.id === id ? { ...l, revoked: true } : l)))
  }

  if (loading) return <Spinner />

  const active = links.filter((l) => !l.revoked)

  return (
    <div className="space-y-4">
      <button onClick={() => navigate('/')} className="text-sm text-brand-600 hover:underline dark:text-brand-100">
        ← Voltar
      </button>
      <h1 className="text-xl font-bold text-slate-800 dark:text-slate-100">Compartilhar arquivo</h1>
      <p className="text-sm text-slate-500 dark:text-slate-400">
        Gere um link de <b>somente leitura</b> para juízes, advogados ou quem precisar. Compartilhe pelo QR code, WhatsApp
        ou e-mail. Você pode revogar a qualquer momento.
      </p>

      {error && <Alert>{error}</Alert>}

      <Card className="space-y-3">
        <Input
          label="Nome do link (opcional)"
          placeholder="Ex.: Advogado Dr. João"
          value={label}
          onChange={(e) => setLabel(e.target.value)}
        />
        <Button className="w-full" onClick={handleCreate} disabled={creating}>
          {creating ? 'Gerando…' : '➕ Gerar novo link'}
        </Button>
      </Card>

      {active.length === 0 && <p className="text-center text-sm text-slate-400 dark:text-slate-500">Nenhum link ativo.</p>}

      {active.map((link) => (
        <ShareCard key={link.id} link={link} onRevoke={() => handleRevoke(link.id)} />
      ))}
    </div>
  )
}

function ShareCard({ link, onRevoke }: { link: ShareLink; onRevoke: () => void }) {
  const url = publicViewUrl(link.token)
  const [copied, setCopied] = useState(false)

  const waText = encodeURIComponent(`Segue meu arquivo de evidências (somente leitura): ${url}`)
  const whatsapp = `https://wa.me/?text=${waText}`
  const emailSubject = encodeURIComponent('Arquivo de evidências')
  const emailBody = encodeURIComponent(`Acesse o arquivo de evidências (somente leitura):\n${url}`)
  const email = `mailto:?subject=${emailSubject}&body=${emailBody}`

  async function copy() {
    await navigator.clipboard.writeText(url)
    setCopied(true)
    setTimeout(() => setCopied(false), 1500)
  }

  return (
    <Card className="space-y-4">
      {link.label && <p className="font-semibold text-slate-800 dark:text-slate-100">{link.label}</p>}

      <div className="flex justify-center">
        {/* Mantém o fundo branco para o QR permanecer legível/escaneável no tema escuro */}
        <div className="rounded-2xl bg-white p-3 ring-1 ring-slate-100">
          <QRCodeCanvas value={url} size={180} includeMargin />
        </div>
      </div>

      <div className="break-all rounded-xl bg-slate-50 px-3 py-2 text-center text-xs text-slate-500 dark:bg-slate-900 dark:text-slate-400">{url}</div>

      <div className="grid grid-cols-2 gap-2">
        <Button variant="outline" onClick={copy}>
          {copied ? '✓ Copiado' : '📋 Copiar link'}
        </Button>
        <a href={whatsapp} target="_blank" rel="noreferrer">
          <Button variant="outline" className="w-full">💬 WhatsApp</Button>
        </a>
        <a href={email}>
          <Button variant="outline" className="w-full">✉️ E-mail</Button>
        </a>
        <Button variant="ghost" className="text-red-500 dark:text-red-400" onClick={onRevoke}>
          🚫 Revogar
        </Button>
      </div>
    </Card>
  )
}
