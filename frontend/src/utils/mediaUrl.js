const API_URL = import.meta.env.VITE_API_URL ?? '/api';
const isAbsoluteApiUrl = /^https?:\/\//i.test(API_URL);
const API_ORIGIN = isAbsoluteApiUrl
  ? API_URL.replace(/\/api\/?$/, '')
  : (import.meta.env.VITE_API_ORIGIN ?? '');

export function getMediaUrl(url = '') {
  if (!url) {
    return '';
  }

  if (/^(blob:|data:|https?:\/\/)/i.test(url)) {
    return url;
  }

  if (url.startsWith('/uploads')) {
    return `${API_ORIGIN}${url}`;
  }

  if (url.startsWith('uploads/')) {
    return `${API_ORIGIN}/${url}`;
  }

  return url;
}
