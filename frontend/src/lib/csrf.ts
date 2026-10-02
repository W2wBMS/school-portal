import { API_BASE } from '@/lib/config';

export async function fetchCsrfToken() {
  // Render free instances can take up to 45-60 seconds to wake up after being idle.
  // Retrying this harmless bootstrap request gives the backend time to cold-start.
  const attempts = 12;
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
      await new Promise((resolve) => window.setTimeout(resolve, 2500));
    }
  }

  console.error('CSRF bootstrap failed', lastError);
  if (lastError instanceof TypeError && lastError.message.includes('fetch')) {
    throw new Error('Unable to connect to the backend server. Please verify your backend service is running and configured on Render.');
  }
  throw new Error('The portal is waking up. Please wait a moment and try again.');
}
