const MAX_ESTIMATED_PET_AGE_YEARS = 30;

function parseInteger(value) {
  if (value === null || value === undefined || value === '') {
    return null;
  }

  const number = Number(value);
  return Number.isInteger(number) ? number : null;
}

function padMonth(month) {
  return String(month).padStart(2, '0');
}

function toDateOnly(value) {
  if (!value) {
    return null;
  }

  if (value instanceof Date && !Number.isNaN(value.getTime())) {
    return `${value.getFullYear()}-${padMonth(value.getMonth() + 1)}-01`;
  }

  const text = String(value).trim();
  const match = text.match(/^(\d{4})-(\d{2})/);

  if (!match) {
    return null;
  }

  return `${match[1]}-${match[2]}-01`;
}

function calculateAgeFromEstimatedBirthDate(value, now = new Date()) {
  const dateOnly = toDateOnly(value);

  if (!dateOnly) {
    return null;
  }

  const [year, month] = dateOnly.split('-').map(Number);
  const currentYear = now.getFullYear();
  const currentMonth = now.getMonth() + 1;
  const totalMonths = (currentYear - year) * 12 + (currentMonth - month);

  if (!Number.isInteger(totalMonths) || totalMonths < 0) {
    return null;
  }

  return {
    edadAnios: Math.floor(totalMonths / 12),
    edadMeses: totalMonths % 12
  };
}

function deriveEstimatedBirthDateFromAge(yearsValue, monthsValue, now = new Date()) {
  const parsedYears = parseInteger(yearsValue);
  const parsedMonths = parseInteger(monthsValue);

  if (parsedYears === null && parsedMonths === null) {
    return null;
  }

  const years = parsedYears ?? 0;
  const months = parsedMonths ?? 0;
  const totalMonths = years * 12 + months;

  if (totalMonths < 0) {
    return null;
  }

  const currentYear = now.getFullYear();
  const currentMonth = now.getMonth() + 1;
  const absoluteMonth = currentYear * 12 + (currentMonth - 1) - totalMonths;
  const year = Math.floor(absoluteMonth / 12);
  const month = (absoluteMonth % 12) + 1;

  return `${year}-${padMonth(month)}-01`;
}

function getBirthYearMonth(payload = {}, fallback = {}) {
  const directDate =
    toDateOnly(payload.fecha_nacimiento_estimada) ||
    toDateOnly(payload.fechaNacimientoEstimada);

  if (directDate) {
    const [year, month] = directDate.split('-').map(Number);
    return { year, month };
  }

  const year = parseInteger(
    payload.fecha_nacimiento_anio ??
      payload.fechaNacimientoAnio ??
      payload.anio_nacimiento_estimado ??
      payload.birthYear
  );
  const month = parseInteger(
    payload.fecha_nacimiento_mes ??
      payload.fechaNacimientoMes ??
      payload.mes_nacimiento_estimado ??
      payload.birthMonth
  );

  if (year !== null || month !== null) {
    return { year, month };
  }

  const fallbackDate =
    toDateOnly(fallback.fecha_nacimiento_estimada) || toDateOnly(fallback.fechaNacimientoEstimada);

  if (fallbackDate) {
    const [fallbackYear, fallbackMonth] = fallbackDate.split('-').map(Number);
    return { year: fallbackYear, month: fallbackMonth };
  }

  const fallbackFromLegacyAge = deriveEstimatedBirthDateFromAge(
    fallback.edad_anios,
    fallback.edad_meses
  );

  if (!fallbackFromLegacyAge) {
    return { year: null, month: null };
  }

  const [fallbackYear, fallbackMonth] = fallbackFromLegacyAge.split('-').map(Number);
  return { year: fallbackYear, month: fallbackMonth };
}

function normalizeEstimatedBirthDate(payload = {}, fallback = {}, { required = false } = {}) {
  const { year, month } = getBirthYearMonth(payload, fallback);

  if (year === null && month === null) {
    if (required) {
      const error = new Error('Debes indicar el año y mes estimados de nacimiento.');
      error.statusCode = 400;
      throw error;
    }

    return {
      edadAnios: fallback.edad_anios ?? null,
      edadMeses: fallback.edad_meses ?? null,
      fechaNacimientoEstimada: toDateOnly(fallback.fecha_nacimiento_estimada)
    };
  }

  const now = new Date();
  const currentYear = now.getFullYear();
  const currentMonth = now.getMonth() + 1;
  const minimumYear = currentYear - MAX_ESTIMATED_PET_AGE_YEARS;

  if (!Number.isInteger(year) || year < minimumYear || year > currentYear) {
    const error = new Error(`El año estimado debe estar entre ${minimumYear} y ${currentYear}.`);
    error.statusCode = 400;
    throw error;
  }

  if (!Number.isInteger(month) || month < 1 || month > 12) {
    const error = new Error('El mes estimado de nacimiento debe estar entre enero y diciembre.');
    error.statusCode = 400;
    throw error;
  }

  if (year === currentYear && month > currentMonth) {
    const error = new Error('El mes estimado no puede ser futuro para el año actual.');
    error.statusCode = 400;
    throw error;
  }

  const fechaNacimientoEstimada = `${year}-${padMonth(month)}-01`;
  const age = calculateAgeFromEstimatedBirthDate(fechaNacimientoEstimada, now);

  if (!age) {
    const error = new Error('La fecha estimada de nacimiento no es válida.');
    error.statusCode = 400;
    throw error;
  }

  return {
    ...age,
    fechaNacimientoEstimada
  };
}

function buildAgeYearsSql(alias = 'm', outputAlias = 'edad_anios') {
  const totalMonths = `GREATEST(TIMESTAMPDIFF(MONTH, ${alias}.fecha_nacimiento_estimada, CURDATE()), 0)`;

  return `CASE
      WHEN ${alias}.fecha_nacimiento_estimada IS NOT NULL THEN FLOOR(${totalMonths} / 12)
      ELSE ${alias}.edad_anios
    END AS ${outputAlias}`;
}

function buildAgeMonthsSql(alias = 'm', outputAlias = 'edad_meses') {
  const totalMonths = `GREATEST(TIMESTAMPDIFF(MONTH, ${alias}.fecha_nacimiento_estimada, CURDATE()), 0)`;

  return `CASE
      WHEN ${alias}.fecha_nacimiento_estimada IS NOT NULL THEN MOD(${totalMonths}, 12)
      ELSE ${alias}.edad_meses
    END AS ${outputAlias}`;
}

module.exports = {
  buildAgeMonthsSql,
  buildAgeYearsSql,
  calculateAgeFromEstimatedBirthDate,
  deriveEstimatedBirthDateFromAge,
  normalizeEstimatedBirthDate
};
