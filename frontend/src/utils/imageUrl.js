/**
 * Resolves menu item image paths to absolute or correctly encoded URLs.
 * Handles:
 * 1. Fully-qualified URLs (http:// or https://)
 * 2. Uploaded backend API paths (/api/images/uploaded/...) -> prepends VITE_BACKEND_URL
 * 3. Static local paths (/images/...) -> properly encodes URI components (handling spaces, ampersands like "Ben & Jerry.jpg")
 */
export const resolveImageUrl = (path) => {
  if (!path) return null;
  const trimmed = String(path).trim();
  if (!trimmed) return null;

  if (trimmed.startsWith('http://') || trimmed.startsWith('https://')) {
    return encodeURI(trimmed);
  }

  // Prepend backend URL for API routes (uploaded images, dynamic image endpoint)
  if (trimmed.startsWith('/api/') || trimmed.startsWith('api/')) {
    let rawBackend = import.meta.env.VITE_BACKEND_URL;
    if (!rawBackend) {
      const isBrowser = typeof window !== 'undefined';
      const isLocalhost = isBrowser && (window.location.hostname === 'localhost' || window.location.hostname === '127.0.0.1');
      rawBackend = isLocalhost ? 'http://localhost:5000' : 'https://app-736fedd4-3a26-44ac-a5cc-6b340c821ab3.cleverapps.io';
    }
    const backendUrl = rawBackend.replace(/\/$/, '');
    const cleanPath = trimmed.startsWith('/') ? trimmed : `/${trimmed}`;
    return `${backendUrl}${cleanPath}`;
  }

  // For static local images under /images/...
  const cleanPath = trimmed.startsWith('/') ? trimmed : `/${trimmed}`;
  return cleanPath
    .split('/')
    .map(segment => encodeURIComponent(segment))
    .join('/');
};

export default resolveImageUrl;
