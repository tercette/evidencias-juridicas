import { supabase } from './supabase'
import { buildStoragePath, uploadFile } from './media'
import type { Evidence, MediaAsset } from '../types'
import type { PendingMedia } from '../components/MediaCapture'

export async function listEvidences(): Promise<Evidence[]> {
  const { data, error } = await supabase
    .from('evidences')
    .select('*, media:media_assets(*)')
    .order('fact_date', { ascending: false, nullsFirst: false })
    .order('created_at', { ascending: false })
  if (error) throw error
  return data as Evidence[]
}

export async function getEvidence(id: string): Promise<Evidence> {
  const { data, error } = await supabase
    .from('evidences')
    .select('*, media:media_assets(*)')
    .eq('id', id)
    .single()
  if (error) throw error
  return data as Evidence
}

export async function createEvidence(input: {
  title: string
  description: string
  fact_date: string | null
}): Promise<Evidence> {
  const { data: userData } = await supabase.auth.getUser()
  const owner_id = userData.user!.id
  const { data, error } = await supabase
    .from('evidences')
    .insert({ ...input, owner_id })
    .select()
    .single()
  if (error) throw error
  return data as Evidence
}

export async function updateEvidence(
  id: string,
  input: { title: string; description: string; fact_date: string | null },
): Promise<void> {
  const { error } = await supabase.from('evidences').update(input).eq('id', id)
  if (error) throw error
}

export async function deleteEvidence(id: string): Promise<void> {
  const { error } = await supabase.from('evidences').delete().eq('id', id)
  if (error) throw error
}

// Envia os arquivos pendentes para o Storage e cria os registros em media_assets.
export async function saveMedia(evidenceId: string, items: PendingMedia[]): Promise<void> {
  const { data: userData } = await supabase.auth.getUser()
  const owner_id = userData.user!.id

  for (const item of items) {
    let storage_path: string | null = null
    if (item.file) {
      const path = buildStoragePath(owner_id, evidenceId, item.filename || 'arquivo.bin')
      const { error: upErr } = await uploadFile(path, item.file, item.mime)
      if (upErr) throw upErr
      storage_path = path
    }
    const { error } = await supabase.from('media_assets').insert({
      evidence_id: evidenceId,
      owner_id,
      kind: item.kind,
      storage_path,
      external_url: item.externalUrl ?? null,
      mime_type: item.mime ?? null,
    })
    if (error) throw error
  }
}

export async function deleteMedia(media: MediaAsset): Promise<void> {
  if (media.storage_path) {
    await supabase.storage.from('media').remove([media.storage_path])
  }
  const { error } = await supabase.from('media_assets').delete().eq('id', media.id)
  if (error) throw error
}
