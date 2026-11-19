// Core data model. Every development in public/data/developments.json must
// match `Development`. The same shape is what a future API or database
// should return, so the frontend does not need to change when storage does.

export type CategoryId =
  | 'politics'
  | 'economy'
  | 'business'
  | 'technology'
  | 'science'
  | 'climate'
  | 'health'
  | 'international'
  | 'society'
  | 'energy'
  | 'sports'
  | 'culture'

export type Continent =
  | 'Europe'
  | 'Asia'
  | 'Africa'
  | 'North America'
  | 'South America'
  | 'Oceania'

/**
 * global        – consequences are worldwide (e.g. a UN treaty)
 * international – consequences span several named countries or a region
 * national      – consequences fall mainly within one country
 */
export type Scope = 'global' | 'international' | 'national'

export type SourceType =
  | 'official' // government or institutional primary document
  | 'intergovernmental' // UN, WHO, ICJ, ECB, etc.
  | 'peer-reviewed'
  | 'news' // independent news organisation
  | 'analysis' // law firm, think tank, NGO or specialist publication

export interface Source {
  title: string
  publisher: string
  url: string
  type: SourceType
  /** ISO date of the source, if known */
  date?: string
}

export interface DevelopmentImage {
  /** Direct image URL (Wikimedia Commons or another openly licensed host) */
  src: string
  alt: string
  caption?: string
  author: string
  license: string
  licenseUrl?: string
  /** File description page, where the licence can be checked */
  sourceUrl: string
}

export interface Development {
  /** Permanent identifier; also the URL slug. Never change once published. */
  id: string
  title: string
  /** ISO date (YYYY-MM-DD) on which the definitive stage was reached */
  date: string
  /** Optional one-line note when later stages remain open */
  statusNote?: string
  geography: {
    scope: Scope
    continents: Continent[]
    countries: string[]
  }
  categories: CategoryId[]
  goodNews: boolean
  /** Required when goodNews is true: the demonstrable benefit */
  goodNewsRationale?: string
  scores: {
    immediate: number // 1–10
    longTerm: number // 1–10
    rationale: string
  }
  account: {
    /** Established facts: what happened and the definitive outcome */
    outcome: string
    /** Editorial assessment: why it matters */
    significance: string
    /** Editorial assessment: long-term significance */
    longTerm: string
  }
  image?: DevelopmentImage
  sources: Source[]
  /** True for clearly labelled demonstration entries that are not real events */
  demonstration?: boolean
  /** ISO date the entry was added or last reviewed by an editor */
  reviewed: string
}

export interface AppConfig {
  /** Score at or above which a dimension counts as "high" in the matrix */
  highThreshold: number
  /** Weights for the combined priority score used to order within a quadrant */
  weights: { immediate: number; longTerm: number }
  /** Words per minute used for reading-time estimates */
  wordsPerMinute: number
  /** Maximum words allowed in an account */
  maxWords: number
  /** Optional fixed "today" (YYYY-MM-DD) for reproducible demos; null = real date */
  referenceDate: string | null
  /** Date the dataset as a whole was last reviewed */
  datasetReviewed: string
}
