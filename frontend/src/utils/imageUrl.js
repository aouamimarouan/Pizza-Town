/**
 * Utility to resolve dish image URLs reliably across all environments.
 * Supports:
 * 1. Absolute URLs (e.g. https://... or http://...)
 * 2. Uploaded backend images (/api/images/uploaded/:id) -> prefixes VITE_BACKEND_URL
 * 3. Base64 data URLs (data:image/...) for instant preview
 * 4. Local static assets (/images/...)
 * 5. High-quality category fallback images
 */

export const CATEGORY_FALLBACKS = {
  'Drinks': 'https://images.unsplash.com/photo-1551024709-8f23befc6f87?w=600&auto=format&fit=crop&q=80',
  'Pizzas': 'https://images.unsplash.com/photo-1513104890138-7c749659a591?w=600&auto=format&fit=crop&q=80',
  'Pastas': 'https://images.unsplash.com/photo-1551183053-bf91a1d81141?w=600&auto=format&fit=crop&q=80',
  'Desserts': 'https://images.unsplash.com/photo-1551024506-0bccd828d307?w=600&auto=format&fit=crop&q=80',
  'Salads': 'https://images.unsplash.com/photo-1512621776951-a57141f2eefd?w=600&auto=format&fit=crop&q=80',
  'Starters': 'https://images.unsplash.com/photo-1541529086526-db283c563270?w=600&auto=format&fit=crop&q=80',
  'Menu Deals': 'https://images.unsplash.com/photo-1544982503-9f984c14501a?w=600&auto=format&fit=crop&q=80',
  'Sauces': 'https://images.unsplash.com/photo-1472476443507-c7a5948772fc?w=600&auto=format&fit=crop&q=80',
};

export const getCategoryFallback = (category) => {
  return CATEGORY_FALLBACKS[category] || 'https://images.unsplash.com/photo-1513104890138-7c749659a591?w=600&auto=format&fit=crop&q=80';
};

export const resolveImageUrl = (path, category = null) => {
  if (!path) {
    return category ? getCategoryFallback(category) : null;
  }

  // Absolute URLs & Data URLs
  if (path.startsWith('http://') || path.startsWith('https://') || path.startsWith('data:')) {
    return encodeURI(path);
  }

  // Uploaded backend images (e.g. /api/images/uploaded/...)
  if (path.startsWith('/api/images/')) {
    const backendUrl = import.meta.env.VITE_BACKEND_URL || '';
    return encodeURI(`${backendUrl}${path}`);
  }

  // Local static bundled image (e.g. /images/pizzas/...)
  const cleanPath = path.startsWith('/') ? path : `/${path}`;
  return encodeURI(cleanPath);
};

export default {
  resolveImageUrl,
  getCategoryFallback,
  CATEGORY_FALLBACKS,
};
