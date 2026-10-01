const API_BASE = process.env.NEXT_PUBLIC_API_URL || (process.env.NODE_ENV === 'production' ? '/api' : 'http://localhost:5000/api');

export async function fetchCsrfToken() {
  // Render free instances can take a moment to wake after being idle. Retrying
  // this harmless bootstrap request prevents a cold-start response from being
  // shown to the student as a failed sign-in.
  const attempts = 4;
  let lastError: unknown;

  for (let attempt = 0; attempt < attempts; attempt += 1) {
    try {
      const response = await fetch(`${API_BASE}/csrf-token`, {
        credentials: 'include',
        cache: 'no-store',
      });
      if (response.ok) {
        const data = await response.json();
        if (data.csrfToken) return data.csrfToken as string;
      } else {
        lastError = new Error(`Secure-session request returned ${response.status}`);
      }
    } catch (error) {
      lastError = error;
    }

    if (attempt < attempts - 1) {
      await new Promise((resolve) => window.setTimeout(resolve, 1500 * (attempt + 1)));
    }
  }

  console.error('CSRF bootstrap failed', lastError);
  throw new Error('The portal is waking up. Please wait a moment and try again.');
}
