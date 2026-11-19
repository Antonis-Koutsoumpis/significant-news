import type { CategoryId, Continent, Scope, SourceType } from '../types'

export const CATEGORIES: { id: CategoryId; label: string }[] = [
  { id: 'politics', label: 'Politics and governance' },
  { id: 'economy', label: 'Economy and finance' },
  { id: 'business', label: 'Business and industry' },
  { id: 'technology', label: 'Technology and artificial intelligence' },
  { id: 'science', label: 'Science and research' },
  { id: 'climate', label: 'Climate and environment' },
  { id: 'health', label: 'Health and medicine' },
  { id: 'international', label: 'International relations and conflicts' },
  { id: 'society', label: 'Society and demographics' },
  { id: 'energy', label: 'Energy and infrastructure' },
  { id: 'sports', label: 'Sports' },
  { id: 'culture', label: 'Culture and arts' },
]

export const CATEGORY_LABEL: Record<CategoryId, string> = Object.fromEntries(
  CATEGORIES.map((c) => [c.id, c.label]),
) as Record<CategoryId, string>

export const CATEGORY_IDS = CATEGORIES.map((c) => c.id)

export const CONTINENTS: Continent[] = [
  'Europe',
  'Asia',
  'Africa',
  'North America',
  'South America',
  'Oceania',
]

export const SCOPE_LABEL: Record<Scope, string> = {
  global: 'Global',
  international: 'International / cross-border',
  national: 'National',
}

export const SOURCE_TYPE_LABEL: Record<SourceType, string> = {
  official: 'Official document',
  intergovernmental: 'International organisation',
  'peer-reviewed': 'Peer-reviewed publication',
  news: 'Independent news organisation',
  analysis: 'Specialist analysis',
}

export const SOURCE_TYPES = Object.keys(SOURCE_TYPE_LABEL) as SourceType[]
