import { supabase } from './supabase'
import type { MediaKind } from '../types'

export function publicUrl(storagePath: string | null): string {
  if (!storagePath) return ''
  return supabase.storage.from('media').getPublicUrl(storagePath).data.publicUrl
}

export function kindFromMime(mime: string): MediaKind {
  if (mime.startsWith('image/')) return 'foto'
  if (mime.startsWith('video/')) return 'video'
  if (mime.startsWith('audio/')) return 'audio'
  return 'documento'
}

// Gera um caminho único dentro da "pasta" do usuário: <userId>/<evidenceId>/<random>.<ext>
export function buildStoragePath(userId: string, evidenceId: string, filename: string): string {
  const ext = filename.includes('.') ? filename.split('.').pop() : 'bin'
  const rand =
    typeof crypto !== 'undefined' && 'randomUUID' in crypto
      ? crypto.randomUUID()
      : `${performance.now()}`.replace('.', '')
  return `${userId}/${evidenceId}/${rand}.${ext}`
}

export async function uploadFile(path: string, file: Blob, contentType?: string) {
  return supabase.storage.from('media').upload(path, file, {
    contentType: contentType || (file as File).type || 'application/octet-stream',
    upsert: false,
  })
}
