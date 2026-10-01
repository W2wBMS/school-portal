const API_BASE = process.env.NEXT_PUBLIC_API_URL || (process.env.NODE_ENV === 'production' ? '/api' : 'http://localhost:5000/api');

export async function fetchCsrfToken() {
  const response = await fetch(`${API_BASE}/csrf-token`, { credentials: 'include' });
  if (!response.ok) throw new Error('Unable to start a secure session. Please try again.');
  const data = await response.json();
  return data.csrfToken as string;
}
