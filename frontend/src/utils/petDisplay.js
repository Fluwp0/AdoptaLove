export function formatPetAge(yearsValue, monthsValue) {
  const years = Number.isInteger(Number(yearsValue)) ? Number(yearsValue) : null;
  const months = Number.isInteger(Number(monthsValue)) ? Number(monthsValue) : null;
  const safeYears = years !== null && years >= 0 ? years : null;
  const safeMonths = months !== null && months >= 0 ? months : null;
  const parts = [];

  if (safeYears === null && safeMonths === null) {
    return 'Edad no indicada';
  }

  if (safeYears > 0) {
    parts.push(safeYears === 1 ? '1 año' : `${safeYears} años`);
  }

  if (safeMonths > 0) {
    parts.push(safeMonths === 1 ? '1 mes' : `${safeMonths} meses`);
  }

  if (parts.length === 0 && safeYears === 0 && safeMonths === 0) {
    return '0 meses';
  }

  return parts.join(' y ') || 'Edad no indicada';
}
