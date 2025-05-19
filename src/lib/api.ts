import { CSRF_TOKEN_HEADER } from './csrf-server';

// Helper function to get CSRF token from meta tag
function getCSRFTokenFromMeta(): string | null {
  const metaTag = document.querySelector('meta[name="csrf-token"]');
  return metaTag?.getAttribute('content') || null;
}

// Enhanced fetch function with CSRF token
export async function fetchWithCSRF(url: string, options: RequestInit = {}): Promise<Response> {
  const csrfToken = getCSRFTokenFromMeta();
  
  // Add CSRF token to headers if it exists
  const headers = new Headers(options.headers);
  if (csrfToken) {
    headers.set(CSRF_TOKEN_HEADER, csrfToken);
  }

  // Merge headers with existing options
  const enhancedOptions = {
    ...options,
    headers,
    credentials: 'same-origin' as RequestCredentials
  };

  return fetch(url, enhancedOptions);
}

// Helper function to handle API responses
export async function handleAPIResponse<T>(response: Response): Promise<T> {
  if (!response.ok) {
    const error = await response.json().catch(() => ({ error: 'Unknown error' }));
    throw new Error(error.error || `HTTP error! status: ${response.status}`);
  }
  return response.json();
}

// Example usage:
// const data = await handleAPIResponse<Project[]>(
//   await fetchWithCSRF('/api/projects')
// ); 