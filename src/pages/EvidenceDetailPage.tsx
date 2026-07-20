import { useEffect, useState } from 'react'
import { Link, useNavigate, useParams } from 'react-router-dom'
import type { Evidence } from '../types'
import { getEvidence, deleteEvidence } from '../lib/evidences'
import { formatDate, kindLabel } from '../lib/format'
import { MediaView } from '../components/MediaView'
import { Button, Card, Spinner, Alert } from '../components/ui'

export function EvidenceDetailPage() {
  const { id } = useParams()
  const navigate = useNavigate()
  const [ev, setEv] = useState<Evidence | null>(null)
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState('')

  useEffect(() => {
    if (!id) return
    getEvidence(id)
      .then(setEv)
      .catch((e) => setError(e.message))
      .finally(() => setLoading(false))
  }, [id])

  async function handleDelete() {
    if (!ev) return
    if (!confirm('Excluir esta evidência e todas as suas mídias?')) return
    await deleteEvidence(ev.id)
    navigate('/')
  }

  if (loading) return <Spinner />
  if (error || !ev) return <Alert>{error || 'Evidência não encontrada.'}</Alert>

  return (
    <div className="space-y-4">
      <button onClick={() => navigate('/')} className="text-sm text-brand-600 hover:underline">
        ← Voltar
      </button>

      <Card className="space-y-2">
        <h1 className="text-xl font-bold text-slate-800">{ev.title}</h1>
        <p className="text-sm text-slate-400">📅 {formatDate(ev.fact_date)}</p>
        {ev.description && <p className="whitespace-pre-wrap text-slate-600">{ev.description}</p>}
      </Card>

      {ev.media && ev.media.length > 0 && (
        <div className="space-y-3">
          {ev.media.map((m) => (
            <Card key={m.id} className="space-y-2">
              <span className="text-xs text-slate-400">{kindLabel(m.kind)}</span>
              <MediaView media={m} />
            </Card>
          ))}
        </div>
      )}

      <div className="flex gap-2">
        <Link to={`/item/${ev.id}/editar`} className="flex-1">
          <Button variant="outline" className="w-full">✏️ Editar</Button>
        </Link>
        <Button variant="danger" className="flex-1" onClick={handleDelete}>
          🗑️ Excluir
        </Button>
      </div>
    </div>
  )
}
