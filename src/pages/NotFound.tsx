import { Link } from 'react-router-dom'

export default function NotFound({ what = 'page' }: { what?: string }) {
  return (
    <div className="max-w-prose">
      <h1 className="font-serif text-2xl">No such {what}</h1>
      <p className="mt-3 text-muted">The address does not match any entry in the archive. It may have been mistyped.</p>
      <p className="mt-3">
        <Link to="/archive" className="text-accent underline underline-offset-2">
          Go to the archive
        </Link>
      </p>
    </div>
  )
}
