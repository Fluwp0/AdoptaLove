export function getAssetUrl(asset) {
  return typeof asset === 'string' ? asset : asset?.src || '';
}
