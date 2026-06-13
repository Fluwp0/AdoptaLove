const API_URL = import.meta.env.VITE_API_URL ?? 'http://localhost:3000/api';
const API_ORIGIN = API_URL.replace(/\/api\/?$/, '');

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

  return url;
}
