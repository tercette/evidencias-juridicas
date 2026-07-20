export function formatDate(value: string | null): string {
  if (!value) return 'Sem data'
  // value vem como "YYYY-MM-DD"; evita problema de fuso tratando como data local.
  const [y, m, d] = value.split('T')[0].split('-').map(Number)
  if (!y || !m || !d) return value
  return new Date(y, m - 1, d).toLocaleDateString('pt-BR', {
    day: '2-digit',
    month: 'long',
    year: 'numeric',
  })
}

export function kindLabel(kind: string): string {
  return (
    {
      foto: '📷 Foto',
      video: '🎥 Vídeo',
      audio: '🎙️ Áudio',
      link: '🔗 Link',
      documento: '📄 Documento',
    } as Record<string, string>
  )[kind] ?? kind
}
