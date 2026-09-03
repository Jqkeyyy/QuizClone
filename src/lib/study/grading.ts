export function normalize(input: string): string {
  return input
    .toLocaleLowerCase()
    .trim()
    .replace(/[^\p{L}\p{N}\s]/gu, '')
    .replace(/^(?:a|an|the)\s+/u, '')
    .replace(/\s+/g, ' ')
    .trim()
}

export function levenshteinDistance(a: string, b: string): number {
  if (!a.length) return b.length
  if (!b.length) return a.length

  let previous = Array.from({ length: b.length + 1 }, (_, index) => index)
  for (let row = 1; row <= a.length; row++) {
    const current = [row]
    for (let column = 1; column <= b.length; column++) {
      const substitutionCost = a[row - 1] === b[column - 1] ? 0 : 1
      current[column] = Math.min(
        current[column - 1] + 1,
        previous[column] + 1,
        previous[column - 1] + substitutionCost,
      )
    }
    previous = current
  }
  return previous[b.length]
}

export function levenshteinRatio(a: string, b: string): number {
  const longest = Math.max(a.length, b.length)
  return longest === 0 ? 1 : 1 - levenshteinDistance(a, b) / longest
}

export interface TypedGradeResult {
  correct: boolean
  near: boolean
}

export function gradeTyped(userAnswer: string, correctAnswer: string): TypedGradeResult {
  const user = normalize(userAnswer)
  const expected = normalize(correctAnswer)
  if (user === expected) return { correct: true, near: false }
  if (user && levenshteinRatio(user, expected) >= 0.85) return { correct: true, near: true }
  return { correct: false, near: false }
}
