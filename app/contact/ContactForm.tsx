'use client';
import { useState } from 'react';
export function ContactForm({
  name = '',
  email = '',
}: {
  name?: string;
  email?: string;
}) {
  const [values, setValues] = useState({
    name,
    email,
    message: '',
    website: '',
  });
  const [busy, setBusy] = useState(false);
  const [done, setDone] = useState(false);
  const [error, setError] = useState('');
  async function submit(event: React.FormEvent) {
    event.preventDefault();
    if (busy) return;
    setBusy(true);
    setError('');
    try {
      const response = await fetch('/api/contact', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(values),
      });
      const result = await response.json().catch(() => null);
      if (!response.ok)
        throw Error(result?.error || 'Could not send. Try again.');
      setDone(true);
    } catch (err) {
      setError(
        err instanceof TypeError
          ? 'Could not connect. Please try again.'
          : err instanceof Error
            ? err.message
            : 'Could not connect.'
      );
    } finally {
      setBusy(false);
    }
  }
  if (done)
    return (
      <div
        role="status"
        className="rounded-xl border border-pf-accent-line bg-pf-accent-bg p-5"
      >
        <h2 className="text-lg font-semibold">Message sent</h2>
        <p className="mt-2 text-sm">We’ll reply to {values.email}.</p>
      </div>
    );
  return (
    <form
      onSubmit={submit}
      className="space-y-4 rounded-xl border border-pf-line bg-pf-surface p-5"
    >
      {(['name', 'email', 'message'] as const).map((key) => (
        <div key={key}>
          <label
            htmlFor={`contact-${key}`}
            className="mb-1 block text-sm font-medium"
          >
            {{ name: 'Name', email: 'Email', message: 'Message' }[key]}
          </label>
          {key === 'message' ? (
            <textarea
              id="contact-message"
              required
              maxLength={5000}
              rows={6}
              value={values.message}
              onChange={(e) =>
                setValues({ ...values, message: e.target.value })
              }
              className="w-full rounded-lg border p-3 text-base"
            />
          ) : (
            <input
              id={`contact-${key}`}
              required
              type={key === 'email' ? 'email' : 'text'}
              autoComplete={key}
              value={values[key]}
              maxLength={key === 'email' ? 254 : 200}
              onChange={(e) => setValues({ ...values, [key]: e.target.value })}
              className="w-full rounded-lg border p-3 text-base"
            />
          )}
        </div>
      ))}
      <input
        name="website"
        aria-hidden="true"
        tabIndex={-1}
        autoComplete="off"
        className="hidden"
        value={values.website}
        onChange={(e) => setValues({ ...values, website: e.target.value })}
      />
      {error && (
        <p role="alert" className="text-sm text-pf-danger">
          {error}
        </p>
      )}
      <button
        disabled={busy}
        className="min-h-11 w-full rounded-lg bg-emerald-500 px-4 py-3 text-sm font-semibold text-pf-canvas"
      >
        {busy ? 'Sending…' : 'Send message'}
      </button>
    </form>
  );
}
