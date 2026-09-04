import { describe, expect, it } from 'vitest'
import { MAX_CARD_IMAGE_BYTES, validateCardImage } from './cardImages'

describe('card image validation', () => {
  it('accepts image formats allowed by the storage bucket', () => {
    for (const type of ['image/jpeg', 'image/png', 'image/webp', 'image/gif']) {
      expect(validateCardImage({ type, size: 1024 })).toBeNull()
    }
  })

  it('rejects unsupported, oversized, and empty files', () => {
    expect(validateCardImage({ type: 'image/svg+xml', size: 1024 })).toContain('JPEG')
    expect(validateCardImage({ type: 'image/png', size: MAX_CARD_IMAGE_BYTES + 1 })).toContain('5 MB')
    expect(validateCardImage({ type: 'image/png', size: 0 })).toContain('empty')
  })
})
