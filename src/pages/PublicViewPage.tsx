import { useEffect, useState } from 'react'
import { useParams } from 'react-router-dom'
import { supabase } from '../lib/supabase'
import type { MediaAsset } from '../types'
import { formatDate, kindLabel } from '../lib/format'
import { MediaView } from '../components/MediaView'
import { Card, Spinner, Alert } from '../components/ui'

interface SharedEvidence {
  id: string
  title: string
  description: string | null
  fact_date: string | null
  created_at: string
  media: Pick<MediaAsset, 'id' | 'kind' | 'storage_path' | 'external_url' | 'mime_type'>[]
}

export function PublicViewPage() {
  const { token } = useParams()
  const [items, setItems] = useState<SharedEvidence[] | null>(null)
  const [error, setError] = useState('')

  useEffect(() => {
    if (!token) return
    // Chama a função pública (RPC) que valida o token e devolve as evidências.
    supabase
      .rpc('get_shared_archive', { p_token: token })
      .then(({ data, error }) => {
        if (error) {
          setError('Não foi possível carregar o arquivo.')
          return
        }
        if (!data) {
          setError('Link inválido ou revogado.')
          return
        }
        setItems((data as { evidences: SharedEvidence[] }).evidences)
      })
  }, [token])

  if (error) {
    return (
      <div className="mx-auto max-w-lg px-4 py-10">
        <Alert>{error}</Alert>
      </div>
    )
  }

  if (!items) return <Spinner />

  return (
    <div className="mx-auto max-w-lg px-4 py-6">
      <header className="mb-4 text-center">
        <div className="text-3xl">🗂️</div>
        <h1 className="mt-1 text-xl font-bold text-slate-800">Arquivo de Evidências</h1>
        <p className="text-sm text-slate-400">Visualização somente leitura</p>
      </header>

      {items.length === 0 && (
        <Card className="text-center text-slate-500">Este arquivo ainda não possui evidências.</Card>
      )}

      <div className="space-y-4">
        {items.map((ev) => (
          <Card key={ev.id} className="space-y-3">
            <div>
              <h2 className="font-semibold text-slate-800">{ev.title}</h2>
              <p className="text-xs text-slate-400">📅 {formatDate(ev.fact_date)}</p>
            </div>
            {ev.description && <p className="whitespace-pre-wrap text-sm text-slate-600">{ev.description}</p>}
            {ev.media.map((m) => (
              <div key={m.id} className="space-y-1">
                <span className="text-xs text-slate-400">{kindLabel(m.kind)}</span>
                <MediaView media={m} />
              </div>
            ))}
          </Card>
        ))}
      </div>

      <footer className="mt-8 text-center text-xs text-slate-300">Gerado pelo app Arquivo de Evidências</footer>
    </div>
  )
}
