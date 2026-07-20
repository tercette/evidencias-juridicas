import { useEffect, useState } from 'react'
import { Link } from 'react-router-dom'
import type { Evidence } from '../types'
import { listEvidences } from '../lib/evidences'
import { formatDate } from '../lib/format'
import { Button, Card, Spinner, Alert } from '../components/ui'

export function DashboardPage() {
  const [items, setItems] = useState<Evidence[]>([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState('')

  useEffect(() => {
    listEvidences()
      .then(setItems)
      .catch((e) => setError(e.message ?? 'Erro ao carregar'))
      .finally(() => setLoading(false))
  }, [])

  if (loading) return <Spinner />

  return (
    <div className="space-y-4">
      <div className="flex items-center justify-between">
        <h1 className="text-xl font-bold text-slate-800 dark:text-slate-100">Minhas evidências</h1>
        <Link to="/compartilhar">
          <Button variant="outline" className="px-3 py-2">🔗 Compartilhar</Button>
        </Link>
      </div>

      <Link to="/nova">
        <Button className="w-full">➕ Nova evidência</Button>
      </Link>

      {error && <Alert>{error}</Alert>}

      {items.length === 0 && !error && (
        <Card className="text-center text-slate-500 dark:text-slate-400">
          <p className="text-3xl">🗃️</p>
          <p className="mt-2">Você ainda não cadastrou evidências.</p>
          <p className="text-sm">Toque em “Nova evidência” para começar.</p>
        </Card>
      )}

      <div className="space-y-3">
        {items.map((ev) => (
          <Link key={ev.id} to={`/item/${ev.id}`}>
            <Card className="transition hover:ring-brand-100 dark:hover:ring-slate-600">
              <div className="flex items-start justify-between gap-3">
                <div className="min-w-0">
                  <h2 className="truncate font-semibold text-slate-800 dark:text-slate-100">{ev.title}</h2>
                  <p className="mt-0.5 text-xs text-slate-400 dark:text-slate-500">{formatDate(ev.fact_date)}</p>
                  {ev.description && (
                    <p className="mt-1 line-clamp-2 text-sm text-slate-500 dark:text-slate-400">{ev.description}</p>
                  )}
                </div>
                {ev.media && ev.media.length > 0 && (
                  <span className="shrink-0 rounded-full bg-brand-50 px-2 py-1 text-xs font-medium text-brand-600 dark:bg-brand-500/15 dark:text-brand-100">
                    {ev.media.length} mídia{ev.media.length > 1 ? 's' : ''}
                  </span>
                )}
              </div>
            </Card>
          </Link>
        ))}
      </div>
    </div>
  )
}
