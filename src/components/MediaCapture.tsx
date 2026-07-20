import { useRef, useState } from 'react'
import type { MediaKind } from '../types'
import { kindFromMime } from '../lib/media'
import { Button, Input } from './ui'

// Item de mídia ainda não salvo (fica na memória até o usuário salvar a evidência).
export interface PendingMedia {
  localId: string
  kind: MediaKind
  file?: Blob
  filename?: string
  mime?: string
  externalUrl?: string
  previewUrl?: string
}

function uid() {
  return typeof crypto !== 'undefined' && 'randomUUID' in crypto
    ? crypto.randomUUID()
    : `${performance.now()}`.replace('.', '')
}

export function MediaCapture({ onAdd }: { onAdd: (m: PendingMedia) => void }) {
  const photoInput = useRef<HTMLInputElement>(null)
  const videoInput = useRef<HTMLInputElement>(null)
  const fileInput = useRef<HTMLInputElement>(null)
  const [linkUrl, setLinkUrl] = useState('')

  function handleFiles(files: FileList | null) {
    if (!files) return
    Array.from(files).forEach((file) => {
      onAdd({
        localId: uid(),
        kind: kindFromMime(file.type),
        file,
        filename: file.name,
        mime: file.type,
        previewUrl: URL.createObjectURL(file),
      })
    })
  }

  function addLink() {
    const url = linkUrl.trim()
    if (!url) return
    onAdd({ localId: uid(), kind: 'link', externalUrl: url })
    setLinkUrl('')
  }

  return (
    <div className="space-y-4 rounded-2xl border border-dashed border-slate-300 p-4">
      <p className="text-sm font-medium text-slate-600">Adicionar mídia</p>

      {/* Câmera do celular abre direto com o atributo "capture". No desktop, abre o seletor de arquivos. */}
      <div className="grid grid-cols-2 gap-2">
        <Button type="button" variant="outline" onClick={() => photoInput.current?.click()}>
          📷 Foto
        </Button>
        <Button type="button" variant="outline" onClick={() => videoInput.current?.click()}>
          🎥 Vídeo
        </Button>
        <Button type="button" variant="outline" onClick={() => fileInput.current?.click()}>
          📎 Arquivo do dispositivo
        </Button>
        <AudioRecorder onAdd={onAdd} />
      </div>

      <input
        ref={photoInput}
        type="file"
        accept="image/*"
        capture="environment"
        hidden
        onChange={(e) => handleFiles(e.target.files)}
      />
      <input
        ref={videoInput}
        type="file"
        accept="video/*"
        capture="environment"
        hidden
        onChange={(e) => handleFiles(e.target.files)}
      />
      <input
        ref={fileInput}
        type="file"
        multiple
        hidden
        onChange={(e) => handleFiles(e.target.files)}
      />

      {/* Link externo (ex.: notícia, post, vídeo do YouTube) */}
      <div className="flex items-end gap-2">
        <div className="flex-1">
          <Input
            label="Ou cole um link"
            placeholder="https://…"
            value={linkUrl}
            onChange={(e) => setLinkUrl(e.target.value)}
          />
        </div>
        <Button type="button" variant="outline" onClick={addLink}>
          Adicionar
        </Button>
      </div>
    </div>
  )
}

// Gravador de áudio direto pelo microfone (usa MediaRecorder).
function AudioRecorder({ onAdd }: { onAdd: (m: PendingMedia) => void }) {
  const [recording, setRecording] = useState(false)
  const recorderRef = useRef<MediaRecorder | null>(null)
  const chunksRef = useRef<Blob[]>([])

  async function toggle() {
    if (recording) {
      recorderRef.current?.stop()
      return
    }
    try {
      const stream = await navigator.mediaDevices.getUserMedia({ audio: true })
      const rec = new MediaRecorder(stream)
      chunksRef.current = []
      rec.ondataavailable = (e) => e.data.size > 0 && chunksRef.current.push(e.data)
      rec.onstop = () => {
        const blob = new Blob(chunksRef.current, { type: rec.mimeType || 'audio/webm' })
        stream.getTracks().forEach((t) => t.stop())
        setRecording(false)
        onAdd({
          localId: uid(),
          kind: 'audio',
          file: blob,
          filename: `gravacao-${Date.now()}.webm`,
          mime: blob.type,
          previewUrl: URL.createObjectURL(blob),
        })
      }
      rec.start()
      recorderRef.current = rec
      setRecording(true)
    } catch {
      alert('Não foi possível acessar o microfone. Verifique as permissões do navegador.')
    }
  }

  return (
    <Button type="button" variant={recording ? 'danger' : 'outline'} onClick={toggle}>
      {recording ? '⏹️ Parar' : '🎙️ Gravar áudio'}
    </Button>
  )
}
