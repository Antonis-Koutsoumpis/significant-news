import { useEffect, useState } from 'react'
import type { Continent } from '../types'

export interface MapCountry {
  iso: string
  name: string
  continent: Continent
  /** Pre-projected SVG path (Equal Earth projection, 1000 × 500 frame) */
  d: string
  bbox: [number, number, number, number]
}

export interface WorldMapData {
  width: number
  height: number
  countries: MapCountry[]
}

let cache: Promise<WorldMapData> | null = null

/** Loads the bundled map geometry on first use (a separate ~170 KB chunk). */
export function loadWorldMap(): Promise<WorldMapData> {
  cache ??= import('../data/world-map.json').then((m) => m.default as unknown as WorldMapData)
  return cache
}

export function useWorldMap(): WorldMapData | null {
  const [data, setData] = useState<WorldMapData | null>(null)
  useEffect(() => {
    let live = true
    loadWorldMap().then((d) => live && setData(d))
    return () => {
      live = false
    }
  }, [])
  return data
}

/** Fixed frames (x, y, width, height) for zooming to each continent. */
export const CONTINENT_VIEW: Record<Continent | 'World', string> = {
  World: '0 0 1000 500',
  Europe: '405 40 250 125',
  Asia: '440 30 580 290',
  Africa: '250 140 600 300',
  'North America': '40 20 460 230',
  'South America': '85 220 500 250',
  Oceania: '690 260 420 210',
}
