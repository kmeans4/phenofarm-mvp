/** Shared deletion handling keeps HTML/empty error responses recoverable. */
export async function deleteRecord(url: string, fallback: string) {
  const response = await fetch(url, { method: 'DELETE' });
  if (!response.ok) {
    const data = await response.json().catch(() => ({}));
    throw new Error(typeof data.error === 'string' ? data.error : fallback);
  }
}
