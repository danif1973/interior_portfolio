// Client-side CSRF utilities
export const CSRF_TOKEN_HEADER = 'X-CSRF-Token';

// Get CSRF token from meta tag
export function getCSRFTokenFromMeta(): string | null {
  if (typeof document === 'undefined') return null;
  const token = document.querySelector('meta[name="csrf-token"]')?.getAttribute('content');
  console.log('CSRF Token from meta:', token ? 'present' : 'missing');
  return token || null;
}

// Helper function to add CSRF token to fetch requests
export async function fetchWithCSRF(url: string, options: RequestInit = {}): Promise<Response> {
  const csrfToken = getCSRFTokenFromMeta();
  console.log('Fetch with CSRF:', {
    url,
    method: options.method || 'GET',
    hasToken: !!csrfToken,
    tokenLength: csrfToken?.length
  });

  if (!csrfToken) {
    throw new Error('CSRF token not found in meta tag. Please refresh the page and try again.');
  }

  // Create new headers object to avoid mutating the original
  const headers = new Headers(options.headers);
  headers.set(CSRF_TOKEN_HEADER, csrfToken);

  // Ensure credentials are included
  const fetchOptions: RequestInit = {
    ...options,
    headers,
    credentials: 'same-origin'
  };

  try {
    const response = await fetch(url, fetchOptions);
    if (!response.ok) {
      const errorData = await response.json();
      console.error('CSRF Request failed:', {
        status: response.status,
        statusText: response.statusText,
        error: errorData
      });
    }
    return response;
  } catch (error) {
    console.error('CSRF Request error:', error);
    throw error;
  }
} 