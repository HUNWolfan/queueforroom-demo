/**
 * Get the base URL for the application
 * Priority: BASE_URL env var > request.url origin
 * 
 * This is important for platforms like Railway where the request URL 
 * might not always reflect the correct public URL
 */
export function getBaseUrl(request: Request): string {
  // If BASE_URL is set in environment, use that (for Railway, Vercel, etc.)
  if (process.env.BASE_URL) {
    return process.env.BASE_URL.replace(/\/$/, ''); // Remove trailing slash
  }
  
  // Otherwise, derive from request
  const url = new URL(request.url);
  return `${url.protocol}//${url.host}`;
}
