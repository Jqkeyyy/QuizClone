import { supabase } from '../supabase'

export type CardImageSide = 'term' | 'definition'

export const MAX_CARD_IMAGE_BYTES = 5 * 1024 * 1024

const EXTENSIONS_BY_TYPE: Record<string, string> = {
  'image/jpeg': 'jpg',
  'image/png': 'png',
  'image/webp': 'webp',
  'image/gif': 'gif',
}

export function validateCardImage(file: Pick<File, 'size' | 'type'>): string | null {
  if (!Object.hasOwn(EXTENSIONS_BY_TYPE, file.type)) {
    return 'Choose a JPEG, PNG, WebP, or GIF image.'
  }
  if (file.size > MAX_CARD_IMAGE_BYTES) return 'Images must be 5 MB or smaller.'
  if (file.size === 0) return 'The selected image is empty.'
  return null
}

export async function createCardImageUrl(path: string): Promise<string> {
  const { data, error } = await supabase.storage.from('card-images').createSignedUrl(path, 3600)
  if (error) throw error
  return data.signedUrl
}

export async function uploadCardImage(
  setId: string,
  cardId: string,
  side: CardImageSide,
  file: File,
  previousPath: string | null,
): Promise<string> {
  const validationError = validateCardImage(file)
  if (validationError) throw new Error(validationError)

  const extension = EXTENSIONS_BY_TYPE[file.type]
  const path = `${setId}/${cardId}-${side}-${crypto.randomUUID()}.${extension}`
  const { error: uploadError } = await supabase.storage
    .from('card-images')
    .upload(path, file, { contentType: file.type, upsert: false })
  if (uploadError) throw uploadError

  const patch = side === 'term' ? { term_image: path } : { definition_image: path }
  const { error: updateError } = await supabase
    .from('cards')
    .update(patch)
    .eq('id', cardId)
    .eq('set_id', setId)
  if (updateError) {
    await supabase.storage.from('card-images').remove([path])
    throw updateError
  }

  if (previousPath && previousPath !== path) {
    const { error } = await supabase.storage.from('card-images').remove([previousPath])
    if (error) console.error('Could not remove replaced card image:', error)
  }

  return path
}

export async function removeCardImage(
  setId: string,
  cardId: string,
  side: CardImageSide,
  path: string,
): Promise<void> {
  const patch = side === 'term' ? { term_image: null } : { definition_image: null }
  const { error: updateError } = await supabase
    .from('cards')
    .update(patch)
    .eq('id', cardId)
    .eq('set_id', setId)
  if (updateError) throw updateError

  const { error: removeError } = await supabase.storage.from('card-images').remove([path])
  if (removeError) console.error('Could not remove card image file:', removeError)
}
