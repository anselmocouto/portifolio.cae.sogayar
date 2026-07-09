const MESES_ABREV = [
  'Jan', 'Fev', 'Mar', 'Abr', 'Mai', 'Jun', 'Jul', 'Ago', 'Set', 'Out', 'Nov', 'Dez',
]

/** published_at é `date` — parse manual evita conversão de timezone (spec seção 8). */
function parseDateOnly(dateStr: string): { year: number; month: number; day: number } {
  const [y, m, d] = dateStr.split('-').map(Number)
  return { year: y, month: m, day: d }
}

export function formatMesAno(dateStr: string | null): string {
  if (!dateStr) return ''
  const { year, month } = parseDateOnly(dateStr)
  return `${MESES_ABREV[month - 1]} ${year}`
}

export function formatDataCompleta(dateStr: string | null): string {
  if (!dateStr) return '—'
  const { year, month, day } = parseDateOnly(dateStr)
  return new Intl.DateTimeFormat('pt-BR').format(new Date(year, month - 1, day))
}

export function iniciaisDoNome(nome: string): string {
  return nome
    .split(' ')
    .filter(Boolean)
    .map((n) => n[0])
    .slice(0, 2)
    .join('')
    .toUpperCase()
}
