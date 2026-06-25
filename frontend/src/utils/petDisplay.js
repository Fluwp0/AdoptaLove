const MAX_ESTIMATED_PET_AGE_YEARS = 30;

export const BIRTH_MONTH_OPTIONS = [
  { value: '1', label: 'Enero' },
  { value: '2', label: 'Febrero' },
  { value: '3', label: 'Marzo' },
  { value: '4', label: 'Abril' },
  { value: '5', label: 'Mayo' },
  { value: '6', label: 'Junio' },
  { value: '7', label: 'Julio' },
  { value: '8', label: 'Agosto' },
  { value: '9', label: 'Septiembre' },
  { value: '10', label: 'Octubre' },
  { value: '11', label: 'Noviembre' },
  { value: '12', label: 'Diciembre' }
];

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

export function calculatePetAgeFromEstimatedBirthDate(value, now = new Date()) {
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
    edad_anios: Math.floor(totalMonths / 12),
    edad_meses: totalMonths % 12
  };
}

export function deriveEstimatedBirthDateFromAge(yearsValue, monthsValue, now = new Date()) {
  const parsedYears = parseInteger(yearsValue);
  const parsedMonths = parseInteger(monthsValue);

  if (parsedYears === null && parsedMonths === null) {
    return null;
  }

  const totalMonths = (parsedYears ?? 0) * 12 + (parsedMonths ?? 0);

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

export function buildEstimatedBirthDate(yearValue, monthValue) {
  const year = parseInteger(yearValue);
  const month = parseInteger(monthValue);

  if (!Number.isInteger(year) || !Number.isInteger(month)) {
    return '';
  }

  return `${year}-${padMonth(month)}-01`;
}

export function getEstimatedBirthDateParts(source = {}) {
  const directDate =
    toDateOnly(source.fecha_nacimiento_estimada) ||
    toDateOnly(source.fechaNacimientoEstimada) ||
    toDateOnly(source.mascota_fecha_nacimiento_estimada) ||
    toDateOnly(source.mascota_fecha_nacimiento_estimada_actual);

  if (directDate) {
    const [year, month] = directDate.split('-').map(Number);
    return { year: String(year), month: String(month) };
  }

  const legacyDate = deriveEstimatedBirthDateFromAge(
    source.edad_anios ?? source.edadAnios ?? source.mascota_edad_anios ?? source.mascota_edad_anios_actual,
    source.edad_meses ?? source.edadMeses ?? source.mascota_edad_meses ?? source.mascota_edad_meses_actual
  );

  if (!legacyDate) {
    return { year: '', month: '' };
  }

  const [year, month] = legacyDate.split('-').map(Number);
  return { year: String(year), month: String(month) };
}

export function getEstimatedBirthYearOptions() {
  const currentYear = new Date().getFullYear();

  return Array.from({ length: MAX_ESTIMATED_PET_AGE_YEARS + 1 }, (_, index) =>
    String(currentYear - index)
  );
}

export function validateEstimatedBirthDate(yearValue, monthValue, { required = true } = {}) {
  const hasYear = yearValue !== '' && yearValue !== null && yearValue !== undefined;
  const hasMonth = monthValue !== '' && monthValue !== null && monthValue !== undefined;

  if (!hasYear && !hasMonth && !required) {
    return '';
  }

  if (!hasYear || !hasMonth) {
    return 'Selecciona el año y mes estimados de nacimiento.';
  }

  const year = parseInteger(yearValue);
  const month = parseInteger(monthValue);
  const currentYear = new Date().getFullYear();
  const currentMonth = new Date().getMonth() + 1;
  const minimumYear = currentYear - MAX_ESTIMATED_PET_AGE_YEARS;

  if (!Number.isInteger(year) || year < minimumYear || year > currentYear) {
    return `El año estimado debe estar entre ${minimumYear} y ${currentYear}.`;
  }

  if (!Number.isInteger(month) || month < 1 || month > 12) {
    return 'Selecciona un mes estimado válido.';
  }

  if (year === currentYear && month > currentMonth) {
    return 'El mes estimado no puede ser futuro para el año actual.';
  }

  return '';
}

function formatAgeParts(yearsValue, monthsValue) {
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

export function formatPetAge(yearsValue, monthsValue) {
  if (yearsValue && typeof yearsValue === 'object') {
    const calculated = calculatePetAgeFromEstimatedBirthDate(
      yearsValue.fecha_nacimiento_estimada ??
        yearsValue.fechaNacimientoEstimada ??
        yearsValue.mascota_fecha_nacimiento_estimada ??
        yearsValue.mascota_fecha_nacimiento_estimada_actual
    );

    if (calculated) {
      return formatAgeParts(calculated.edad_anios, calculated.edad_meses);
    }

    return formatAgeParts(
      yearsValue.edad_anios ??
        yearsValue.edadAnios ??
        yearsValue.mascota_edad_anios ??
        yearsValue.mascota_edad_anios_actual,
      yearsValue.edad_meses ??
        yearsValue.edadMeses ??
        yearsValue.mascota_edad_meses ??
        yearsValue.mascota_edad_meses_actual
    );
  }

  return formatAgeParts(yearsValue, monthsValue);
}
