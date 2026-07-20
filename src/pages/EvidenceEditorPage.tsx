import { useEffect, useState, type FormEvent } from 'react'
import { useNavigate, useParams } from 'react-router-dom'
import type { MediaAsset } from '../types'
import {
  createEvidence,
  updateEvidence,
  getEvidence,
  saveMedia,
  deleteMedia,
} from '../lib/evidences'
import { MediaCapture, type PendingMedia } from '../components/MediaCapture'
import { MediaView } from '../components/MediaView'
import { kindLabel } from '../lib/format'
import { Button, Input, Textarea, Card, Alert, Spinner } from '../components/ui'

export function EvidenceEditorPage() {
  const { id } = useParams()
  const isEdit = Boolean(id)
  const navigate = useNavigate()

  const [title, setTitle] = useState('')
  const [description, setDescription] = useState('')
  const [factDate, setFactDate] = useState('')
  const [pending, setPending] = useState<PendingMedia[]>([])
  const [existing, setExisting] = useState<MediaAsset[]>([])
  const [loading, setLoading] = useState(isEdit)
  const [saving, setSaving] = useState(false)
  const [error, setError] = useState('')

  useEffect(() => {
    if (!id) return
    getEvidence(id)
      .then((ev) => {
        setTitle(ev.title)
        setDescription(ev.description ?? '')
        setFactDate(ev.fact_date ?? '')
        setExisting(ev.media ?? [])
      })
      .catch((e) => setError(e.message))
      .finally(() => setLoading(false))
  }, [id])

  function addPending(m: PendingMedia) {
    setPending((prev) => [...prev, m])
  }

  function removePending(localId: string) {
    setPending((prev) => prev.filter((p) => p.localId !== localId))
  }

  async function removeExisting(media: MediaAsset) {
    if (!confirm('Remover esta mídia?')) return
    await deleteMedia(media)
    setExisting((prev) => prev.filter((m) => m.id !== media.id))
  }

  async function handleSubmit(e: FormEvent) {
    e.preventDefault()
    setError('')
    if (!title.trim()) {
      setError('Dê um nome para a evidência.')
      return
    }
    setSaving(true)
    try {
      const input = {
        title: title.trim(),
        description: description.trim(),
        fact_date: factDate || null,
      }
      let evidenceId = id
      if (isEdit) {
        await updateEvidence(id!, input)
      } else {
        const created = await createEvidence(input)
        evidenceId = created.id
      }
      if (pending.length > 0) {
        await saveMedia(evidenceId!, pending)
      }
      navigate(`/item/${evidenceId}`)
    } catch (err) {
      setError((err as Error).message ?? 'Erro ao salvar')
      setSaving(false)
    }
  }

  if (loading) return <Spinner />

  return (
    <div className="space-y-4">
      <h1 className="text-xl font-bold text-slate-800">{isEdit ? 'Editar evidência' : 'Nova evidência'}</h1>
      {error && <Alert>{error}</Alert>}

      <form onSubmit={handleSubmit} className="space-y-4">
        <Card className="space-y-4">
          <Input label="Nome" placeholder="Ex.: Mensagem de ameaça" required value={title} onChange={(e) => setTitle(e.target.value)} />
          <Textarea label="Descrição" rows={4} placeholder="Descreva o que é esta evidência" value={description} onChange={(e) => setDescription(e.target.value)} />
          <Input label="Data do fato" type="date" value={factDate} onChange={(e) => setFactDate(e.target.value)} />
        </Card>

        {/* Mídias já salvas (no modo edição) */}
        {existing.length > 0 && (
          <Card className="space-y-3">
            <p className="text-sm font-medium text-slate-600">Mídias salvas</p>
            {existing.map((m) => (
              <div key={m.id} className="space-y-2">
                <div className="flex items-center justify-between">
                  <span className="text-xs text-slate-400">{kindLabel(m.kind)}</span>
                  <button type="button" onClick={() => removeExisting(m)} className="text-xs text-red-500 hover:underline">
                    Remover
                  </button>
                </div>
                <MediaView media={m} />
              </div>
            ))}
          </Card>
        )}

        {/* Novas mídias pendentes */}
        {pending.length > 0 && (
          <Card className="space-y-3">
            <p className="text-sm font-medium text-slate-600">A adicionar ({pending.length})</p>
            {pending.map((p) => (
              <div key={p.localId} className="flex items-center justify-between gap-2 rounded-xl bg-slate-50 px-3 py-2">
                <span className="truncate text-sm text-slate-600">
                  {kindLabel(p.kind)} — {p.filename ?? p.externalUrl}
                </span>
                <button type="button" onClick={() => removePending(p.localId)} className="text-xs text-red-500 hover:underline">
                  Tirar
                </button>
              </div>
            ))}
          </Card>
        )}

        <MediaCapture onAdd={addPending} />

        <div className="flex gap-2">
          <Button type="button" variant="ghost" className="flex-1" onClick={() => navigate(-1)}>
            Cancelar
          </Button>
          <Button type="submit" className="flex-1" disabled={saving}>
            {saving ? 'Salvando…' : 'Salvar'}
          </Button>
        </div>
      </form>
    </div>
  )
}
