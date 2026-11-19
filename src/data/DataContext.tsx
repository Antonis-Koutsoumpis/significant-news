import { createContext, useContext, useEffect, useState, type ReactNode } from 'react'
import type { AppConfig, Development } from '../types'
import { dataSource } from './repository'
import { validateDataset, type Issue } from '../lib/validate'

interface DataState {
  status: 'loading' | 'ready' | 'error'
  error?: string
  config: AppConfig
  items: Development[]
  issues: Issue[]
}

const DEFAULT_CONFIG: AppConfig = {
  highThreshold: 6,
  weights: { immediate: 0.4, longTerm: 0.6 },
  wordsPerMinute: 200,
  maxWords: 200,
  referenceDate: null,
  datasetReviewed: '',
}

const Ctx = createContext<DataState | null>(null)

export function DataProvider({ children }: { children: ReactNode }) {
  const [state, setState] = useState<DataState>({ status: 'loading', config: DEFAULT_CONFIG, items: [], issues: [] })

  useEffect(() => {
    let cancelled = false
    Promise.all([dataSource.loadConfig(), dataSource.loadDevelopments()])
      .then(([config, raw]) => {
        if (cancelled) return
        const issues = validateDataset(raw, config)
        issues.forEach((i) => console[i.level === 'error' ? 'error' : 'warn'](`[dataset] ${i.id}: ${i.message}`))
        // Entries with errors are not published; warnings are shown on the methodology page.
        const broken = new Set(issues.filter((i) => i.level === 'error').map((i) => i.id))
        const items = raw.filter((d) => !broken.has(d.id))
        setState({ status: 'ready', config: { ...DEFAULT_CONFIG, ...config }, items, issues })
      })
      .catch((e: Error) => {
        if (!cancelled) setState((s) => ({ ...s, status: 'error', error: e.message }))
      })
    return () => {
      cancelled = true
    }
  }, [])

  return <Ctx.Provider value={state}>{children}</Ctx.Provider>
}

export function useData(): DataState {
  const v = useContext(Ctx)
  if (!v) throw new Error('useData must be used inside DataProvider')
  return v
}
