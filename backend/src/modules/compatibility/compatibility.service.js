const compatibilityModel = require('./compatibility.model');

const QUESTIONS = [
  {
    id: 'tipoMascota',
    title: '¿Qué tipo de mascota prefieres?',
    description: 'Elige el tipo de compañero que imaginas en tu hogar.',
    icon: 'heart',
    options: [
      { value: 'perro', label: 'Perro', icon: 'dog' },
      { value: 'gato', label: 'Gato', icon: 'cat' },
      { value: 'indiferente', label: 'Me da igual', icon: 'openHeart' },
      { value: 'otro', label: 'Otro', icon: 'paw' }
    ]
  },
  {
    id: 'tipoMascotaOtro',
    title: '¿Qué otro tipo de compañero prefieres?',
    description: 'También puedes encontrar otros animales que necesitan un hogar responsable.',
    icon: 'paw',
    dependsOn: { questionId: 'tipoMascota', value: 'otro' },
    options: [
      { value: 'conejo', label: 'Conejo', icon: 'rabbit' },
      { value: 'hamster', label: 'Hámster', icon: 'hamster' },
      { value: 'aves', label: 'Aves', icon: 'bird' },
      { value: 'tortuga', label: 'Tortuga', icon: 'turtle' }
    ]
  },
  {
    id: 'tieneNinos',
    title: '¿Tienes niños en casa?',
    description: 'Esto ayuda a priorizar mascotas con una convivencia adecuada.',
    icon: 'family',
    options: [
      { value: 'si', label: 'Sí', icon: 'kids' },
      { value: 'no', label: 'No', icon: 'quietHome' }
    ]
  },
  {
    id: 'edadNinos',
    title: '¿Qué rango de edad tienen los niños?',
    description: 'Cada etapa necesita un tipo de acompañamiento distinto.',
    icon: 'kids',
    dependsOn: { questionId: 'tieneNinos', value: 'si' },
    options: [
      { value: '0-3', label: '0 a 3 años', icon: 'baby' },
      { value: '4-7', label: '4 a 7 años', icon: 'toy' },
      { value: '8-12', label: '8 a 12 años', icon: 'backpack' },
      { value: '12+', label: 'Más de 12 años', icon: 'teen' }
    ]
  },
  {
    id: 'nivelActividad',
    title: '¿Qué nivel de actividad prefieres?',
    description: 'Piensa en el ritmo que mejor encaja con tu vida diaria.',
    icon: 'compass',
    options: [
      { value: 'tranquila', label: 'Mascota tranquila', icon: 'moon' },
      { value: 'moderada', label: 'Actividad moderada', icon: 'paw' },
      { value: 'activa', label: 'Mascota activa', icon: 'bolt' },
      { value: 'indiferente', label: 'Me da igual', icon: 'openHeart' }
    ]
  },
  {
    id: 'vivienda',
    title: '¿Dónde vives?',
    description: 'El espacio disponible influye en la comodidad de la mascota.',
    icon: 'home',
    options: [
      { value: 'casa', label: 'Casa', icon: 'home' },
      { value: 'departamento', label: 'Departamento', icon: 'building' },
      { value: 'parcela', label: 'Parcela o espacio amplio', icon: 'tree' }
    ]
  },
  {
    id: 'tiempoDisponible',
    title: '¿Cuánto tiempo tienes al día para tu mascota?',
    description: 'Algunas mascotas necesitan más compañía, juego o paseos.',
    icon: 'clock',
    layout: 'vertical',
    options: [
      {
        value: 'poco-tiempo',
        label: 'Poco tiempo',
        description: 'Menos de 2 horas',
        icon: 'hourglass'
      },
      {
        value: 'tiempo-medio',
        label: 'Tiempo medio',
        description: 'Entre 2 y 4 horas',
        icon: 'heartClock'
      },
      {
        value: 'mucho-tiempo',
        label: 'Mucho tiempo',
        description: 'Más de 4 horas',
        icon: 'sun'
      }
    ]
  }
];

function createServiceError(statusCode, message) {
  const error = new Error(message);
  error.statusCode = statusCode;
  return error;
}

function normalize(value = '') {
  return String(value)
    .normalize('NFD')
    .replace(/[\u0300-\u036f]/g, '')
    .toLowerCase()
    .trim();
}

function includesAny(value, words) {
  const normalizedValue = normalize(value);
  return words.some((word) => normalizedValue.includes(normalize(word)));
}

function isDog(pet) {
  return includesAny(pet.especie, ['perro']);
}

function isCat(pet) {
  return includesAny(pet.especie, ['gato']);
}

function isSmall(pet) {
  return includesAny(pet.tamano, ['pequeno', 'pequena']);
}

function isMedium(pet) {
  return includesAny(pet.tamano, ['mediano', 'mediana']);
}

function isLarge(pet) {
  return includesAny(pet.tamano, ['grande']);
}

function addReason(reasons, condition, reason) {
  if (condition) {
    reasons.push(reason);
  }
}

function answerIs(value, acceptedValues) {
  const normalizedValue = normalize(value);
  return acceptedValues.some((acceptedValue) => normalizedValue === normalize(acceptedValue));
}

function getOtherPetKeywords(preference) {
  const normalizedPreference = normalize(preference);

  if (normalizedPreference === 'conejo') {
    return ['conejo'];
  }

  if (normalizedPreference === 'hamster') {
    return ['hamster', 'hámster'];
  }

  if (normalizedPreference === 'aves') {
    return ['ave', 'aves', 'pajaro', 'pájaro'];
  }

  if (normalizedPreference === 'tortuga') {
    return ['tortuga'];
  }

  return preference ? [preference] : [];
}

function isSpecificOtherPetPreference(preference) {
  return ['conejo', 'hamster', 'aves', 'tortuga'].includes(normalize(preference));
}

function scorePet(pet, answers) {
  let score = 0;
  const reasons = [];
  const description = pet.descripcion || '';
  const preferredPet = answers.tipoMascota;

  if (preferredPet === 'perro') {
    score += isDog(pet) ? 55 : -15;
    addReason(reasons, isDog(pet), 'coincide con tu preferencia por perros');
  } else if (preferredPet === 'gato') {
    score += isCat(pet) ? 55 : -15;
    addReason(reasons, isCat(pet), 'coincide con tu preferencia por gatos');
  } else if (preferredPet === 'indiferente') {
    score += 18;
    reasons.push('dejaste abierta la opción de conocer distintos compañeros');
  } else if (preferredPet === 'otro' || isSpecificOtherPetPreference(preferredPet)) {
    const otherPreference = preferredPet === 'otro' ? answers.tipoMascotaOtro : preferredPet;
    const otherKeywords = getOtherPetKeywords(otherPreference);
    const matchesOther = otherKeywords.length > 0 && includesAny(pet.especie, otherKeywords);
    score += matchesOther ? 55 : 5;
    addReason(
      reasons,
      matchesOther,
      `coincide con tu interés por ${otherPreference}`
    );
  }

  if (answers.vivienda === 'departamento') {
    if (isSmall(pet)) score += 30;
    if (isMedium(pet)) score += 18;
    if (isLarge(pet)) score -= 8;
    addReason(
      reasons,
      isSmall(pet) || isMedium(pet),
      'su tamaño puede adaptarse bien a departamento'
    );
  }

  if (answers.vivienda === 'casa') {
    if (isSmall(pet) || isMedium(pet)) score += 16;
    if (isLarge(pet)) score += 12;
    reasons.push('puede adaptarse a una casa con rutina familiar');
  }

  if (answers.vivienda === 'parcela') {
    if (isLarge(pet)) score += 28;
    if (isMedium(pet)) score += 22;
    if (isDog(pet)) score += 10;
    addReason(reasons, isDog(pet) || isMedium(pet) || isLarge(pet), 'podría disfrutar un espacio amplio');
  }

  if (answers.nivelActividad === 'tranquila') {
    if (includesAny(description, ['tranquila', 'independiente', 'limpio', 'departamento'])) score += 24;
    if (isSmall(pet)) score += 12;
    addReason(reasons, includesAny(description, ['tranquila', 'independiente']), 'su descripción suena calmada');
  }

  if (answers.nivelActividad === 'moderada') {
    if (isMedium(pet)) score += 16;
    if (includesAny(description, ['sociable', 'curioso', 'carinosa', 'carinoso'])) score += 14;
    addReason(reasons, includesAny(description, ['sociable', 'curioso']), 'parece tener una energía equilibrada');
  }

  if (answers.nivelActividad === 'activa') {
    if (isDog(pet)) score += 18;
    if (isLarge(pet)) score += 14;
    if (includesAny(description, ['jugueton', 'juguetona', 'patio', 'activa', 'activo'])) score += 20;
    addReason(reasons, includesAny(description, ['jugueton', 'juguetona', 'patio']), 'su perfil encaja con una vida más activa');
  }

  if (answers.nivelActividad === 'indiferente') {
    score += 8;
  }

  if (answers.tieneNinos === 'si') {
    if (includesAny(description, ['ninos', 'familia', 'carinosa', 'carinoso', 'sociable'])) score += 26;
    addReason(reasons, includesAny(description, ['ninos', 'familia', 'sociable']), 'su descripción menciona buena convivencia familiar');
    if (answers.edadNinos === '0-3' && isLarge(pet)) score -= 4;
  }

  if (answerIs(answers.tiempoDisponible, ['poco-tiempo', 'Poco tiempo', 'menos-1'])) {
    if (isCat(pet)) score += 22;
    if (includesAny(description, ['independiente', 'tranquila', 'limpio'])) score += 16;
    if (isLarge(pet) && isDog(pet)) score -= 8;
    addReason(reasons, isCat(pet) || includesAny(description, ['independiente', 'tranquila']), 'podría adaptarse a una rutina con menos tiempo diario');
  }

  if (answerIs(answers.tiempoDisponible, ['tiempo-medio', 'Tiempo medio', '1-3'])) {
    if (isSmall(pet) || isMedium(pet)) score += 15;
    if (includesAny(description, ['sociable', 'curioso', 'carinosa', 'carinoso'])) score += 10;
    reasons.push('encaja con una dedicación diaria moderada');
  }

  if (answerIs(answers.tiempoDisponible, ['mucho-tiempo', 'Mucho tiempo', 'mas-3'])) {
    if (isDog(pet)) score += 20;
    if (includesAny(description, ['jugueton', 'juguetona', 'familia', 'patio'])) score += 16;
    addReason(reasons, isDog(pet), 'tendrías tiempo para juego, paseos y acompañamiento');
  }

  const uniqueReasons = [...new Set(reasons)].slice(0, 3);
  const compatibilityScore = Math.max(45, Math.min(98, Math.round((score / 150) * 100)));

  return {
    ...pet,
    compatibility_score: compatibilityScore,
    compatibility_reasons: uniqueReasons.length
      ? uniqueReasons
      : ['podría ser una buena opción para conocer con calma']
  };
}

function getQuestions() {
  return QUESTIONS;
}

async function matchPets(payload = {}) {
  const answers = payload.respuestas;

  if (!answers || typeof answers !== 'object') {
    throw createServiceError(400, 'Las respuestas son obligatorias');
  }

  const pets = await compatibilityModel.findMatchablePets();
  const recommendations = pets
    .map((pet) => scorePet(pet, answers))
    .sort((firstPet, secondPet) => {
      if (secondPet.compatibility_score !== firstPet.compatibility_score) {
        return secondPet.compatibility_score - firstPet.compatibility_score;
      }

      return secondPet.id - firstPet.id;
    });

  return {
    usuario_id: payload.usuario_id ?? null,
    respuestas: answers,
    recomendaciones: recommendations
  };
}

module.exports = {
  getQuestions,
  matchPets
};
