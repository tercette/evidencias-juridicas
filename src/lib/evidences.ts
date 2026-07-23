import { supabase } from './supabase'
import { buildStoragePath, uploadFile, publicUrl } from './media'
import type { PdfAttachment, PdfImageSource } from './pdf'
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
      filename: item.filename ?? null,
    })
    if (error) throw error
  }
}

// Gera o PDF da evidência (texto + imagens) e salva no Storage.
// É chamado sempre que a evidência é criada ou editada, para o documento
// refletir o conteúdo atual. Os arquivos originais continuam guardados.
export async function generateAndSavePdf(evidenceId: string): Promise<void> {
  const ev = await getEvidence(evidenceId)
  const media = ev.media ?? []

  const images: PdfImageSource[] = media
    .filter((m) => m.kind === 'foto' && m.storage_path)
    .map((m) => ({ url: publicUrl(m.storage_path) }))

  // Áudio, vídeo, links e documentos não viram página: são listados como anexos.
  const attachments: PdfAttachment[] = media
    .filter((m) => m.kind !== 'foto')
    .map((m) => ({
      kind: m.kind,
      label: m.external_url ?? m.filename ?? 'arquivo enviado',
    }))

  // Import dinâmico: a biblioteca de PDF só é baixada na hora de salvar,
  // mantendo o carregamento inicial do app leve no celular.
  const { buildEvidencePdf } = await import('./pdf')
  const blob = await buildEvidencePdf(
    { title: ev.title, description: ev.description, fact_date: ev.fact_date },
    images,
    attachments,
  )

  const { data: userData } = await supabase.auth.getUser()
  const owner_id = userData.user!.id
  // Caminho fixo por evidência: regerar sobrescreve a versão anterior.
  const path = `${owner_id}/${evidenceId}/evidencia.pdf`
  const { error: upErr } = await uploadFile(path, blob, 'application/pdf', true)
  if (upErr) throw upErr

  const { error } = await supabase.from('evidences').update({ pdf_path: path }).eq('id', evidenceId)
  if (error) throw error
}

export async function deleteMedia(media: MediaAsset): Promise<void> {
  if (media.storage_path) {
    await supabase.storage.from('media').remove([media.storage_path])
  }
  const { error } = await supabase.from('media_assets').delete().eq('id', media.id)
  if (error) throw error
}
