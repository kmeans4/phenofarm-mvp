'use client';
export default function GlobalError({
  retry,
}: {
  error: Error & { digest?: string };
  retry: () => void;
}) {
  return (
    <html lang="en">
      <body
        style={{
          background: '#070b09',
          color: '#f1f5f2',
          fontFamily: 'system-ui',
          padding: '3rem',
        }}
      >
        <main>
          <h1>PhenoShop couldn’t load</h1>
          <p>Please try again. Your saved work is still there.</p>
          <button
            onClick={retry}
            style={{
              padding: '12px 20px',
              background: '#34d9a2',
              border: 0,
              borderRadius: 8,
            }}
          >
            Try again
          </button>
          <p>
            <a href="/dashboard" style={{ color: '#34d9a2' }}>
              Back to overview
            </a>
          </p>
        </main>
      </body>
    </html>
  );
}
