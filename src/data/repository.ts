// Data access layer. The UI only talks to `DataSource`, so the JSON files can
// later be replaced by an API or database by writing another implementation
// (e.g. `ApiDataSource`) and changing the one line in `dataSource` below.

import type { AppConfig, Development } from '../types'

export interface DataSource {
  loadConfig(): Promise<AppConfig>
  loadDevelopments(): Promise<Development[]>
}

async function getJson<T>(path: string): Promise<T> {
  const res = await fetch(`${import.meta.env.BASE_URL}${path}`, { cache: 'no-cache' })
  if (!res.ok) throw new Error(`Could not load ${path} (HTTP ${res.status})`)
  return (await res.json()) as T
}

export class JsonFileDataSource implements DataSource {
  loadConfig() {
    return getJson<AppConfig>('data/config.json')
  }
  loadDevelopments() {
    return getJson<Development[]>('data/developments.json')
  }
}

export const dataSource: DataSource = new JsonFileDataSource()
