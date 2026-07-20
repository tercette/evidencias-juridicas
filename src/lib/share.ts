import { supabase } from './supabase'
import type { ShareLink } from '../types'

export async function listShareLinks(): Promise<ShareLink[]> {
  const { data, error } = await supabase
    .from('share_links')
    .select('*')
    .order('created_at', { ascending: false })
  if (error) throw error
  return data as ShareLink[]
}

export async function createShareLink(label: string): Promise<ShareLink> {
  const { data: userData } = await supabase.auth.getUser()
  const { data, error } = await supabase
    .from('share_links')
    .insert({ owner_id: userData.user!.id, label: label || null })
    .select()
    .single()
  if (error) throw error
  return data as ShareLink
}

export async function revokeShareLink(id: string): Promise<void> {
  const { error } = await supabase.from('share_links').update({ revoked: true }).eq('id', id)
  if (error) throw error
}

// URL pública completa (respeita o base do GitHub Pages).
export function publicViewUrl(token: string): string {
  return `${window.location.origin}${import.meta.env.BASE_URL}v/${token}`
}
