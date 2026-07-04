import { displayText } from './displayText';

function cleanValue(value) {
  return displayText(value, '').trim();
}

function uniqueParts(parts) {
  const seen = new Set();

  return parts.filter((part) => {
    const normalizedPart = part.toLocaleLowerCase('es-CL');

    if (!part || seen.has(normalizedPart)) {
      return false;
    }

    seen.add(normalizedPart);
    return true;
  });
}

export function formatAddress(user = {}, fallback = 'No informado') {
  const street = cleanValue(user.direccion);
  const number = cleanValue(user.numeracion);
  const complement = cleanValue(user.complemento_direccion ?? user.complementoDireccion);
  const city = cleanValue(user.ciudad);
  const commune = cleanValue(user.comuna);
  const region = cleanValue(user.region);
  const streetLine = [street, number].filter(Boolean).join(' ').trim();
  const addressParts = uniqueParts([streetLine || street, complement, city, commune, region]);

  return addressParts.length > 0 ? addressParts.join(', ') : fallback;
}

export function hasRequiredLocation(user = {}) {
  return Boolean(
    cleanValue(user.region) &&
      cleanValue(user.comuna) &&
      cleanValue(user.direccion) &&
      cleanValue(user.numeracion)
  );
}

export function getMissingLocationLabels(user = {}) {
  const labels = [];

  if (!cleanValue(user.region)) labels.push('región');
  if (!cleanValue(user.comuna)) labels.push('comuna');
  if (!cleanValue(user.direccion)) labels.push('dirección');
  if (!cleanValue(user.numeracion)) labels.push('numeración');

  return labels;
}
