const DISPLAY_REPLACEMENTS = [
  [/á/g, 'á'],
  [/é/g, 'é'],
  [/í/g, 'í'],
  [/ó/g, 'ó'],
  [/ú/g, 'ú'],
  [/ñ/g, 'ñ'],
  [/Á/g, 'Á'],
  [/É/g, 'É'],
  [/Í/g, 'Í'],
  [/Ó/g, 'Ó'],
  [/Ú/g, 'Ú'],
  [/Ñ/g, 'Ñ'],
  [/¿/g, '¿'],
  [/¡/g, '¡'],
  [/•/g, '•'],
  [/♡/g, '♡'],
  [/Fundaci[\uFFFD?]n/g, 'Fundación'],
  [/fundaci[\uFFFD?]n/g, 'fundación'],
  [/Adopci[\uFFFD?]n/g, 'Adopción'],
  [/adopci[\uFFFD?]n/g, 'adopción'],
  [/Postulaci[\uFFFD?]n/g, 'Postulación'],
  [/postulaci[\uFFFD?]n/g, 'postulación'],
  [/Compa[\uFFFD?]ero/g, 'Compañero'],
  [/compa[\uFFFD?]ero/g, 'compañero'],
  [/Compa[\uFFFD?]eros/g, 'Compañeros'],
  [/compa[\uFFFD?]eros/g, 'compañeros'],
  [/Cat[\uFFFD?]logo/g, 'Catálogo'],
  [/cat[\uFFFD?]logo/g, 'catálogo'],
  [/P[\uFFFD?]blico/g, 'Público'],
  [/p[\uFFFD?]blico/g, 'público'],
  [/Revisi[\uFFFD?]n/g, 'Revisión'],
  [/revisi[\uFFFD?]n/g, 'revisión'],
  [/Descripci[\uFFFD?]n/g, 'Descripción'],
  [/descripci[\uFFFD?]n/g, 'descripción']
];

export function displayText(value, fallback = '') {
  if (value === null || value === undefined) {
    return fallback;
  }

  return DISPLAY_REPLACEMENTS.reduce(
    (text, [pattern, replacement]) => text.replace(pattern, replacement),
    String(value)
  );
}

