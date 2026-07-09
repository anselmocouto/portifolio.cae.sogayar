import { supabase } from './supabase'

const MAX_FILE_SIZE = 50 * 1024 * 1024 // 50 MB (spec seção 8)

export function validateFileSize(file: File): string | null {
  if (file.size > MAX_FILE_SIZE) {
    return `"${file.name}" excede o limite de 50 MB.`
  }
  return null
}

function extensionOf(fileName: string): string {
  const dot = fileName.lastIndexOf('.')
  return dot >= 0 ? fileName.slice(dot) : ''
}

/** Nome de arquivo aleatório para evitar colisão e problemas de acento (spec seção 8). */
export function randomStoragePath(fileName: string): string {
  return `${crypto.randomUUID()}${extensionOf(fileName)}`
}

export async function uploadToBucket(bucket: string, file: File): Promise<string> {
  const path = randomStoragePath(file.name)
  const { error } = await supabase.storage.from(bucket).upload(path, file)
  if (error) throw error
  return path
}

export function publicUrl(bucket: string, path: string | null | undefined): string | null {
  if (!path) return null
  return supabase.storage.from(bucket).getPublicUrl(path).data.publicUrl
}

export async function removeFromBucket(bucket: string, paths: string[]): Promise<void> {
  if (!paths.length) return
  await supabase.storage.from(bucket).remove(paths)
}
