import type { MediaAsset } from '../types'
import { publicUrl } from '../lib/media'

// Renderiza uma mídia (foto/vídeo/áudio/link/documento) tanto no app quanto na página pública.
export function MediaView({ media }: { media: Pick<MediaAsset, 'kind' | 'storage_path' | 'external_url' | 'mime_type'> }) {
  if (media.kind === 'link' && media.external_url) {
    return (
      <a
        href={media.external_url}
        target="_blank"
        rel="noreferrer"
        className="flex items-center gap-2 rounded-xl bg-slate-50 px-4 py-3 text-sm text-brand-600 ring-1 ring-slate-100 hover:bg-slate-100"
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
      return <video src={url} controls className="w-full rounded-xl" />
    case 'audio':
      return <audio src={url} controls className="w-full" />
    default:
      return (
        <a
          href={url}
          target="_blank"
          rel="noreferrer"
          className="flex items-center gap-2 rounded-xl bg-slate-50 px-4 py-3 text-sm text-brand-600 ring-1 ring-slate-100 hover:bg-slate-100"
        >
          📄 <span className="truncate">Abrir documento</span>
        </a>
      )
  }
}
