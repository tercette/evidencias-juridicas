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

// Escolhe um formato de áudio suportado pelo navegador (varia entre Chrome/Firefox/Safari).
function pickAudioMime(): string {
  const candidates = ['audio/webm;codecs=opus', 'audio/webm', 'audio/mp4', 'audio/ogg']
  const supported =
    typeof MediaRecorder !== 'undefined' && typeof MediaRecorder.isTypeSupported === 'function'
  for (const t of candidates) {
    if (supported && MediaRecorder.isTypeSupported(t)) return t
  }
  return ''
}

// Traduz o erro do getUserMedia para uma mensagem clara em português.
function micErrorMessage(err: unknown): string {
  const e = err as { name?: string; message?: string }
  switch (e?.name) {
    case 'NotAllowedError':
    case 'SecurityError':
      return 'Permissão do microfone negada. Clique no cadeado da barra de endereço e permita o microfone.'
    case 'NotFoundError':
    case 'DevicesNotFoundError':
      return 'Nenhum microfone encontrado. Verifique se há um microfone conectado e habilitado no sistema.'
    case 'NotReadableError':
      return 'O microfone está em uso por outro programa (Zoom, Meet, etc.). Feche-o e tente de novo.'
    default:
      return `Não foi possível gravar (${e?.name || 'erro'}): ${e?.message || 'tente novamente'}.`
  }
}

// Gravador de áudio direto pelo microfone (usa MediaRecorder).
function AudioRecorder({ onAdd }: { onAdd: (m: PendingMedia) => void }) {
  const [recording, setRecording] = useState(false)
  const [seconds, setSeconds] = useState(0)
  const [error, setError] = useState('')
  const recorderRef = useRef<MediaRecorder | null>(null)
  const chunksRef = useRef<Blob[]>([])
  const timerRef = useRef<number | null>(null)
  const fallbackInput = useRef<HTMLInputElement>(null)

  function stopTimer() {
    if (timerRef.current) {
      clearInterval(timerRef.current)
      timerRef.current = null
    }
  }

  async function toggle() {
    setError('')
    if (recording) {
      recorderRef.current?.stop()
      return
    }
    // getUserMedia só existe em contexto seguro (https ou localhost).
    if (!navigator.mediaDevices?.getUserMedia) {
      setError('Este navegador/endereço não permite gravar (precisa ser HTTPS). Use “Arquivo do dispositivo” abaixo.')
      return
    }
    try {
      const stream = await navigator.mediaDevices.getUserMedia({ audio: true })
      const mime = pickAudioMime()
      const rec = new MediaRecorder(stream, mime ? { mimeType: mime } : undefined)
      chunksRef.current = []
      rec.ondataavailable = (e) => e.data.size > 0 && chunksRef.current.push(e.data)
      rec.onerror = () => setError('Falha durante a gravação. Tente novamente.')
      rec.onstop = () => {
        stopTimer()
        const type = rec.mimeType || mime || 'audio/webm'
        const blob = new Blob(chunksRef.current, { type })
        stream.getTracks().forEach((t) => t.stop())
        setRecording(false)
        setSeconds(0)
        if (blob.size === 0) {
          setError('A gravação ficou vazia. Verifique o microfone e tente novamente.')
          return
        }
        const ext = type.includes('mp4') ? 'm4a' : type.includes('ogg') ? 'ogg' : 'webm'
        onAdd({
          localId: uid(),
          kind: 'audio',
          file: blob,
          filename: `gravacao-${Date.now()}.${ext}`,
          mime: type,
          previewUrl: URL.createObjectURL(blob),
        })
      }
      rec.start()
      recorderRef.current = rec
      setRecording(true)
      setSeconds(0)
      timerRef.current = window.setInterval(() => setSeconds((s) => s + 1), 1000)
    } catch (err) {
      setError(micErrorMessage(err))
    }
  }

  function handleFallback(files: FileList | null) {
    if (!files || !files[0]) return
    const file = files[0]
    onAdd({
      localId: uid(),
      kind: 'audio',
      file,
      filename: file.name,
      mime: file.type,
      previewUrl: URL.createObjectURL(file),
    })
    setError('')
  }

  const mm = String(Math.floor(seconds / 60)).padStart(2, '0')
  const ss = String(seconds % 60).padStart(2, '0')

  return (
    <>
      <Button type="button" variant={recording ? 'danger' : 'outline'} onClick={toggle}>
        {recording ? `⏹️ Parar ${mm}:${ss}` : '🎙️ Gravar áudio'}
      </Button>
      {error && (
        <div className="col-span-2 space-y-2">
          <p className="text-xs text-red-600">{error}</p>
          <Button type="button" variant="outline" onClick={() => fallbackInput.current?.click()}>
            🎧 Enviar um áudio do dispositivo
          </Button>
          <input
            ref={fallbackInput}
            type="file"
            accept="audio/*"
            hidden
            onChange={(e) => handleFallback(e.target.files)}
          />
        </div>
      )}
    </>
  )
}
