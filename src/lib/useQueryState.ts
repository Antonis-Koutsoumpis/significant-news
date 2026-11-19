import { useSearchParams } from 'react-router-dom'

/**
 * Filters live in the URL query string, so any filtered view can be
 * bookmarked or shared. Default values are omitted from the URL.
 */
export function useQueryState() {
  const [params, setParams] = useSearchParams()

  const get = (key: string) => params.get(key) ?? undefined

  const set = (updates: Record<string, string | undefined>) => {
    setParams(
      (prev) => {
        const next = new URLSearchParams(prev)
        for (const [k, v] of Object.entries(updates)) {
          if (v === undefined || v === '') next.delete(k)
          else next.set(k, v)
        }
        return next
      },
      { replace: true },
    )
  }

  const reset = () => setParams(new URLSearchParams(), { replace: true })

  return { get, set, reset, hasAny: params.toString().length > 0 }
}
