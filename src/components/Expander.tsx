import { useId, useState, type ReactNode } from 'react'

/**
 * A collapsible panel: a full-width button that opens or closes its content.
 * Collapsed by default so the page leads with the ranked list.
 */
export default function Expander({
  label,
  hint,
  defaultOpen = false,
  children,
}: {
  label: string
  hint?: string
  defaultOpen?: boolean
  children: ReactNode
}) {
  const [open, setOpen] = useState(defaultOpen)
  const id = useId()
  return (
    <section>
      <button
        type="button"
        aria-expanded={open}
        aria-controls={id}
        onClick={() => setOpen((o) => !o)}
        className={`w-full flex items-center justify-between gap-4 rounded-xl border px-4 py-3 text-left transition-colors ${
          open ? 'border-accent bg-accent-soft/60' : 'border-rule hover:border-accent hover:bg-paper-deep'
        }`}
      >
        <span>
          <span className="block font-display font-semibold text-ink">{open ? label.replace(/^Show/, 'Hide') : label}</span>
          {hint && <span className="block text-xs text-muted mt-0.5">{hint}</span>}
        </span>
        <span aria-hidden className={`text-accent text-lg transition-transform ${open ? 'rotate-180' : ''}`}>
          ▾
        </span>
      </button>
      {open && (
        <div id={id} className="mt-4">
          {children}
        </div>
      )}
    </section>
  )
}
