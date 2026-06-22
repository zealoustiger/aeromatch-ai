'use client'

// Root error boundary: only fires when the ROOT layout itself throws, so it must
// render its own <html>/<body> (the layout is what failed). This also makes the
// app OWN the `global-error` build chunk rather than relying on Next's built-in
// default — the default's chunk is exactly what went missing (ChunkLoadError) and
// masked the real error during the airport-500 investigation.
import { useEffect } from 'react'

export default function GlobalError({
  error,
  reset,
}: {
  error: Error & { digest?: string }
  reset: () => void
}) {
  useEffect(() => {
    console.error(error)
  }, [error])

  return (
    <html lang="en">
      <body
        style={{
          margin: 0,
          minHeight: '100vh',
          display: 'flex',
          flexDirection: 'column',
          alignItems: 'center',
          justifyContent: 'center',
          padding: '2rem 1rem',
          textAlign: 'center',
          fontFamily:
            'system-ui, -apple-system, "Segoe UI", Roboto, Helvetica, Arial, sans-serif',
          background: '#f8fafc',
          color: '#0f172a',
        }}
      >
        <h1 style={{ fontSize: '1.5rem', fontWeight: 700, margin: 0 }}>
          Something went wrong
        </h1>
        <p style={{ marginTop: '0.5rem', color: '#64748b', maxWidth: '32rem' }}>
          ClubHanger hit an unexpected error. Please try again.
        </p>
        <div style={{ marginTop: '1.5rem', display: 'flex', gap: '0.75rem' }}>
          <button
            onClick={reset}
            style={{
              borderRadius: '0.5rem',
              border: 'none',
              background: '#0284c7',
              color: '#fff',
              padding: '0.625rem 1.25rem',
              fontSize: '0.875rem',
              fontWeight: 600,
              cursor: 'pointer',
            }}
          >
            Try again
          </button>
          <a
            href="/"
            style={{
              borderRadius: '0.5rem',
              border: '1px solid #e2e8f0',
              background: '#fff',
              color: '#334155',
              padding: '0.625rem 1.25rem',
              fontSize: '0.875rem',
              fontWeight: 600,
              textDecoration: 'none',
            }}
          >
            Go home
          </a>
        </div>
        {error.digest && (
          <p style={{ marginTop: '1.5rem', fontSize: '0.75rem', color: '#94a3b8' }}>
            Reference: {error.digest}
          </p>
        )}
      </body>
    </html>
  )
}
