import type { MediaAsset } from '../types'
import { publicUrl, downloadUrl } from '../lib/media'

// `filename` é opcional: a visualização pública recebe menos campos que o app.
type ViewableMedia = Pick<MediaAsset, 'kind' | 'storage_path' | 'external_url' | 'mime_type'> & {
  filename?: string | null
}

// Botão de download — aparece igual para o dono e para quem abre o link compartilhado.
function DownloadLink({ media, label }: { media: ViewableMedia; label: string }) {
  const href = downloadUrl(media.storage_path, media.filename)
  if (!href) return null
  return (
    <a
      href={href}
      className="inline-flex items-center gap-1.5 text-xs font-medium text-brand-600 hover:underline dark:text-brand-100"
    >
      ⬇️ {label}
    </a>
  )
}

// Renderiza uma mídia (foto/vídeo/áudio/link/documento) tanto no app quanto na página pública.
export function MediaView({ media }: { media: ViewableMedia }) {
  if (media.kind === 'link' && media.external_url) {
    return (
      <a
        href={media.external_url}
        target="_blank"
        rel="noreferrer"
        className="flex items-center gap-2 rounded-xl bg-slate-50 px-4 py-3 text-sm text-brand-600 ring-1 ring-slate-100 hover:bg-slate-100 dark:bg-slate-900 dark:text-brand-100 dark:ring-slate-700 dark:hover:bg-slate-700"
      >
        🔗 <span className="truncate">{media.external_url}</span>
      </a>
    )
  }

  const url = publicUrl(media.storage_path)
  if (!url) return null

  switch (media.kind) {
    case 'foto':
      return <img src={url} alt="Evidência" className="w-full rounded-xl object-cover" loading="lazy" />
    case 'video':
      return (
        <div className="space-y-1.5">
          <video src={url} controls className="w-full rounded-xl" />
          <DownloadLink media={media} label="Baixar vídeo" />
        </div>
      )
    case 'audio':
      return (
        <div className="space-y-1.5">
          <audio src={url} controls className="w-full" />
          <DownloadLink media={media} label="Baixar áudio" />
        </div>
      )
    default:
      return (
        <a
          href={url}
          target="_blank"
          rel="noreferrer"
          className="flex items-center gap-2 rounded-xl bg-slate-50 px-4 py-3 text-sm text-brand-600 ring-1 ring-slate-100 hover:bg-slate-100 dark:bg-slate-900 dark:text-brand-100 dark:ring-slate-700 dark:hover:bg-slate-700"
        >
          📄 <span className="truncate">Abrir documento</span>
        </a>
      )
  }
}
