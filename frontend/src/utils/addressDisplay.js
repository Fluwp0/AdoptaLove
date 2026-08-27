import { displayText } from './displayText';

function cleanValue(value) {
  return displayText(value, '').trim();
}

function normalizeUser(user) {
  return user && typeof user === 'object' ? user : {};
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
  const safeUser = normalizeUser(user);
  const street = cleanValue(safeUser.direccion);
  const number = cleanValue(safeUser.numeracion);
  const complement = cleanValue(safeUser.complemento_direccion ?? safeUser.complementoDireccion);
  const city = cleanValue(safeUser.ciudad);
  const commune = cleanValue(safeUser.comuna);
  const region = cleanValue(safeUser.region);
  const streetLine = [street, number].filter(Boolean).join(' ').trim();
  const addressParts = uniqueParts([streetLine || street, complement, city, commune, region]);

  return addressParts.length > 0 ? addressParts.join(', ') : fallback;
}

export function hasRequiredLocation(user = {}) {
  const safeUser = normalizeUser(user);

  return Boolean(
    cleanValue(safeUser.region) &&
      cleanValue(safeUser.comuna) &&
      cleanValue(safeUser.direccion) &&
      cleanValue(safeUser.numeracion)
  );
}

export function getMissingLocationLabels(user = {}) {
  const safeUser = normalizeUser(user);
  const labels = [];

  if (!cleanValue(safeUser.region)) labels.push('región');
  if (!cleanValue(safeUser.comuna)) labels.push('comuna');
  if (!cleanValue(safeUser.direccion)) labels.push('dirección');
  if (!cleanValue(safeUser.numeracion)) labels.push('numeración');

  return labels;
}
