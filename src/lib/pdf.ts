import { jsPDF } from 'jspdf'
import type { MediaKind } from '../types'
import { formatDate } from './format'

// Gera um PDF por evidência: texto (nome, descrição, data do fato) + as imagens
// embutidas, e uma seção final listando os anexos que não cabem em PDF
// (áudio, vídeo, links e documentos já enviados como arquivo).

export interface PdfEvidenceInfo {
  title: string
  description: string | null
  fact_date: string | null
}

// Uma imagem pode vir de um arquivo ainda não salvo (blob) ou já do Storage (url).
export interface PdfImageSource {
  blob?: Blob
  url?: string
}

export interface PdfAttachment {
  kind: MediaKind
  label: string
}

const A4_WIDTH = 210
const A4_HEIGHT = 297
const MARGIN = 15
const CONTENT_WIDTH = A4_WIDTH - MARGIN * 2
// Limita a maior dimensão da imagem para o PDF não ficar gigante.
const MAX_IMAGE_PX = 1600

function loadImage(src: string): Promise<HTMLImageElement> {
  return new Promise((resolve, reject) => {
    const img = new Image()
    img.onload = () => resolve(img)
    img.onerror = () => reject(new Error('Falha ao carregar imagem'))
    img.src = src
  })
}

interface RasterImage {
  dataUrl: string
  width: number
  height: number
}

// Passa a imagem por um canvas: normaliza qualquer formato que o navegador
// abra (HEIC do iPhone, webp, png…) para JPEG, que o jsPDF sempre aceita.
async function rasterize(blob: Blob): Promise<RasterImage | null> {
  const objectUrl = URL.createObjectURL(blob)
  try {
    const img = await loadImage(objectUrl)
    const scale = Math.min(1, MAX_IMAGE_PX / Math.max(img.naturalWidth, img.naturalHeight))
    const width = Math.max(1, Math.round(img.naturalWidth * scale))
    const height = Math.max(1, Math.round(img.naturalHeight * scale))
    const canvas = document.createElement('canvas')
    canvas.width = width
    canvas.height = height
    const ctx = canvas.getContext('2d')
    if (!ctx) return null
    // Fundo branco: imagens com transparência não ficam pretas no PDF.
    ctx.fillStyle = '#ffffff'
    ctx.fillRect(0, 0, width, height)
    ctx.drawImage(img, 0, 0, width, height)
    return { dataUrl: canvas.toDataURL('image/jpeg', 0.85), width, height }
  } catch {
    return null
  } finally {
    URL.revokeObjectURL(objectUrl)
  }
}

async function resolveImage(source: PdfImageSource): Promise<RasterImage | null> {
  if (source.blob) return rasterize(source.blob)
  if (!source.url) return null
  try {
    // Baixa via fetch e usa blob URL: evita "tainted canvas" por CORS.
    const res = await fetch(source.url)
    if (!res.ok) return null
    return rasterize(await res.blob())
  } catch {
    return null
  }
}

export async function buildEvidencePdf(
  info: PdfEvidenceInfo,
  images: PdfImageSource[],
  attachments: PdfAttachment[],
): Promise<Blob> {
  const doc = new jsPDF({ unit: 'mm', format: 'a4' })
  let y = MARGIN

  // ---- Cabeçalho ----
  doc.setFont('helvetica', 'normal')
  doc.setFontSize(9)
  doc.setTextColor(120)
  doc.text('ARQUIVO DE EVIDÊNCIAS', MARGIN, y)
  y += 4
  doc.setDrawColor(200)
  doc.line(MARGIN, y, A4_WIDTH - MARGIN, y)
  y += 10

  // ---- Título ----
  doc.setTextColor(20)
  doc.setFont('helvetica', 'bold')
  doc.setFontSize(16)
  const titleLines = doc.splitTextToSize(info.title, CONTENT_WIDTH) as string[]
  doc.text(titleLines, MARGIN, y)
  y += titleLines.length * 7 + 3

  // ---- Datas ----
  doc.setFont('helvetica', 'normal')
  doc.setFontSize(10)
  doc.setTextColor(90)
  doc.text(`Data do fato: ${formatDate(info.fact_date)}`, MARGIN, y)
  y += 5
  doc.text(`Documento gerado em: ${new Date().toLocaleString('pt-BR')}`, MARGIN, y)
  y += 10

  // ---- Descrição ----
  if (info.description?.trim()) {
    doc.setFont('helvetica', 'bold')
    doc.setFontSize(11)
    doc.setTextColor(20)
    doc.text('Descrição', MARGIN, y)
    y += 6
    doc.setFont('helvetica', 'normal')
    doc.setTextColor(40)
    const lines = doc.splitTextToSize(info.description.trim(), CONTENT_WIDTH) as string[]
    for (const line of lines) {
      if (y > A4_HEIGHT - MARGIN - 10) {
        doc.addPage()
        y = MARGIN
      }
      doc.text(line, MARGIN, y)
      y += 5
    }
    y += 6
  }

  // ---- Imagens (uma por página) ----
  let imageNumber = 0
  for (const source of images) {
    const raster = await resolveImage(source)
    if (!raster) continue
    imageNumber += 1
    doc.addPage()
    let imgY = MARGIN
    doc.setFont('helvetica', 'bold')
    doc.setFontSize(10)
    doc.setTextColor(90)
    doc.text(`Imagem ${imageNumber}`, MARGIN, imgY)
    imgY += 6

    // Encaixa a imagem na área útil preservando a proporção.
    const availableHeight = A4_HEIGHT - imgY - MARGIN - 8
    const ratio = raster.width / raster.height
    let drawWidth = CONTENT_WIDTH
    let drawHeight = drawWidth / ratio
    if (drawHeight > availableHeight) {
      drawHeight = availableHeight
      drawWidth = drawHeight * ratio
    }
    const x = MARGIN + (CONTENT_WIDTH - drawWidth) / 2
    doc.addImage(raster.dataUrl, 'JPEG', x, imgY, drawWidth, drawHeight)
  }

  // ---- Anexos não convertíveis ----
  if (attachments.length > 0) {
    doc.addPage()
    let attY = MARGIN
    doc.setFont('helvetica', 'bold')
    doc.setFontSize(12)
    doc.setTextColor(20)
    doc.text('Anexos', MARGIN, attY)
    attY += 5
    doc.setFont('helvetica', 'normal')
    doc.setFontSize(9)
    doc.setTextColor(120)
    doc.text('Arquivos que acompanham esta evidência e não podem ser exibidos em PDF.', MARGIN, attY)
    attY += 8
    doc.setFontSize(10)
    doc.setTextColor(40)
    for (const item of attachments) {
      if (attY > A4_HEIGHT - MARGIN - 10) {
        doc.addPage()
        attY = MARGIN
      }
      const lines = doc.splitTextToSize(`• ${kindText(item.kind)}: ${item.label}`, CONTENT_WIDTH) as string[]
      doc.text(lines, MARGIN, attY)
      attY += lines.length * 5 + 2
    }
  }

  // ---- Rodapé com numeração em todas as páginas ----
  const total = doc.getNumberOfPages()
  for (let page = 1; page <= total; page += 1) {
    doc.setPage(page)
    doc.setFont('helvetica', 'normal')
    doc.setFontSize(8)
    doc.setTextColor(140)
    doc.text(`Página ${page} de ${total}`, A4_WIDTH - MARGIN, A4_HEIGHT - 8, { align: 'right' })
  }

  return doc.output('blob')
}

// Rótulo sem emoji: as fontes padrão do PDF não desenham emoji.
function kindText(kind: MediaKind): string {
  return (
    {
      foto: 'Foto',
      video: 'Vídeo',
      audio: 'Áudio',
      link: 'Link',
      documento: 'Documento',
    } as Record<string, string>
  )[kind] ?? kind
}
