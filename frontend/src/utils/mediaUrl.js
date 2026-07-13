const API_ORIGIN = '';

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
