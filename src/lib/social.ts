export const SOCIAL_LABELS: Record<string, string> = {
  instagram: 'Instagram',
  linkedin: 'LinkedIn',
  twitter: 'Twitter / X',
  whatsapp: 'WhatsApp',
  website: 'Site pessoal',
}

/** Aceita @handle, telefone ou URL completa e devolve um href utilizável. */
export function socialHref(platform: string, value: string): string {
  const v = value.trim()
  if (!v) return ''
  if (v.startsWith('http://') || v.startsWith('https://')) return v

  if (platform === 'instagram') {
    return `https://instagram.com/${v.replace(/^@/, '')}`
  }
  if (platform === 'twitter') {
    return `https://x.com/${v.replace(/^@/, '')}`
  }
  if (platform === 'whatsapp') {
    const digits = v.replace(/\D/g, '')
    return `https://wa.me/${digits}`
  }
  return `https://${v}`
}
