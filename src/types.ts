export type MediaKind = 'foto' | 'video' | 'audio' | 'link' | 'documento'

export interface MediaAsset {
  id: string
  evidence_id: string
  kind: MediaKind
  // Para link: guarda a URL externa. Para arquivos: caminho no Storage.
  storage_path: string | null
  external_url: string | null
  mime_type: string | null
  created_at: string
}

export interface Evidence {
  id: string
  owner_id: string
  title: string
  description: string | null
  // Data em que o fato ocorreu (documentação do acontecido).
  fact_date: string | null
  created_at: string
  updated_at: string
  media?: MediaAsset[]
}

export interface ShareLink {
  id: string
  owner_id: string
  // token público usado na URL de visualização (/v/:token)
  token: string
  label: string | null
  created_at: string
  revoked: boolean
}
