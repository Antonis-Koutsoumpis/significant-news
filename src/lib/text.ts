import type { Development } from '../types'

export function countWords(text: string): number {
  const t = text.trim()
  return t ? t.split(/\s+/).length : 0
}

export function accountText(d: Development): string {
  return [d.account.outcome, d.account.significance, d.account.longTerm].join(' ')
}

export function accountWords(d: Development): number {
  return countWords(accountText(d))
}

/** Whole minutes, never below one. */
export function readingMinutes(words: number, wpm: number): number {
  return Math.max(1, Math.round(words / wpm))
}

const MONTHS = [
  'January', 'February', 'March', 'April', 'May', 'June',
  'July', 'August', 'September', 'October', 'November', 'December',
]

/** "2025-07-23" -> "23 July 2025". Parsed as a calendar date, no time zone shift. */
export function formatDate(iso: string): string {
  const [y, m, d] = iso.split('-').map(Number)
  return `${d} ${MONTHS[m - 1]} ${y}`
}
