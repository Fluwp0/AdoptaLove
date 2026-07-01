const ADOPTALOVE_SUPPORT_EMAIL = 'Adopta.Love2026@gmail.com';

const MAIN_MENU_OPTIONS = [
  option('Adoptar una mascota', 'adoption'),
  option('Postulaciones', 'applications'),
  option('Donaciones', 'donations'),
  option('Quiz de compatibilidad', 'compatibility'),
  option('Cuidados básicos', 'care'),
  option('Fundaciones', 'foundations')
];

function option(label, nodeId) {
  return { label, nodeId };
}

function normalize(value = '') {
  return String(value)
    .normalize('NFD')
    .replace(/[\u0300-\u036f]/g, '')
    .toLowerCase()
    .trim();
}

function includesAny(normalizedText, keywords) {
  return keywords.some((keyword) => normalizedText.includes(normalize(keyword)));
}

export const CHATBOT_NODES = {
  main: {
    text:
      '¡Hola! Soy el asistente de AdoptaLove 🐾\n\n' +
      'Puedo ayudarte con dudas sobre adopción, postulaciones, donaciones, compatibilidad y cuidados básicos.\n\n' +
      'Elige una opción para comenzar:',
    options: MAIN_MENU_OPTIONS
  },
  adoption: {
    text:
      'Para adoptar una mascota en AdoptaLove debes revisar los compañeros disponibles, entrar al perfil de la mascota que te interese y completar el formulario de postulación.\n\n' +
      '¿Qué necesitas saber?',
    options: [
      option('Ver pasos para adoptar', 'adoption.steps'),
      option('Qué necesito para postular', 'adoption.requirements'),
      option('Dónde veo las mascotas', 'adoption.catalog'),
      option('Volver al menú principal', 'main')
    ]
  },
  'adoption.steps': {
    text:
      'Los pasos para adoptar son:\n\n' +
      '1. Revisar los compañeros disponibles.\n' +
      '2. Entrar al perfil de la mascota.\n' +
      '3. Leer sus datos, edad, tamaño y descripción.\n' +
      '4. Iniciar sesión o registrarte.\n' +
      '5. Completar el formulario de postulación.\n' +
      '6. Esperar la revisión de la fundación.\n' +
      '7. Revisar el estado de tu postulación desde tu perfil.\n\n' +
      'La fundación será quien apruebe o rechace la solicitud según sus criterios de adopción.',
    options: [
      option('Qué necesito para postular', 'adoption.requirements'),
      option('Dónde veo las mascotas', 'adoption.catalog'),
      option('Volver a adopción', 'adoption'),
      option('Volver al menú principal', 'main')
    ]
  },
  'adoption.requirements': {
    text:
      'Para postular a una adopción necesitas tener una cuenta de adoptante y completar el formulario con información sobre tu hogar, experiencia con mascotas y motivo de adopción.\n\n' +
      'Estos datos ayudan a la fundación a evaluar si la mascota puede adaptarse bien a tu entorno.',
    options: [
      option('Ver pasos para adoptar', 'adoption.steps'),
      option('Dónde veo las mascotas', 'adoption.catalog'),
      option('Volver a adopción', 'adoption'),
      option('Volver al menú principal', 'main')
    ]
  },
  'adoption.catalog': {
    text:
      'Puedes revisar las mascotas en la sección ‘Compañeros disponibles’.\n\n' +
      'Ahí encontrarás tarjetas con información básica de cada mascota y podrás usar filtros para buscar según tus preferencias.',
    options: [
      option('Ver pasos para adoptar', 'adoption.steps'),
      option('Qué necesito para postular', 'adoption.requirements'),
      option('Volver a adopción', 'adoption'),
      option('Volver al menú principal', 'main')
    ]
  },
  applications: {
    text:
      'Las postulaciones permiten que una fundación revise tu solicitud antes de aprobar una adopción.\n\n' +
      '¿Qué quieres consultar?',
    options: [
      option('Cómo postular', 'applications.how'),
      option('Dónde veo mi postulación', 'applications.where'),
      option('Qué significa en revisión', 'applications.review'),
      option('Por qué pueden rechazarme', 'applications.rejected'),
      option('Volver al menú principal', 'main')
    ]
  },
  'applications.how': {
    text:
      'Para postular debes ingresar al perfil de una mascota y completar el formulario de adopción.\n\n' +
      'Después de enviarlo, la solicitud queda registrada para que la fundación pueda revisarla.',
    options: [
      option('Dónde veo mi postulación', 'applications.where'),
      option('Qué significa en revisión', 'applications.review'),
      option('Volver a postulaciones', 'applications'),
      option('Volver al menú principal', 'main')
    ]
  },
  'applications.where': {
    text:
      'Puedes revisar tus postulaciones desde tu perfil de adoptante.\n\n' +
      'Ahí verás el estado de cada solicitud y, si corresponde, el motivo indicado por la fundación.',
    options: [
      option('Qué significa en revisión', 'applications.review'),
      option('Por qué pueden rechazarme', 'applications.rejected'),
      option('Volver a postulaciones', 'applications'),
      option('Volver al menú principal', 'main')
    ]
  },
  'applications.review': {
    text:
      'El estado ‘en revisión’ significa que la fundación aún está evaluando tu solicitud.\n\n' +
      'Durante esta etapa, la mascota no queda adoptada automáticamente. La fundación debe revisar los datos y decidir si aprueba o rechaza la postulación.',
    options: [
      option('Dónde veo mi postulación', 'applications.where'),
      option('Por qué pueden rechazarme', 'applications.rejected'),
      option('Volver a postulaciones', 'applications'),
      option('Volver al menú principal', 'main')
    ]
  },
  'applications.rejected': {
    text:
      'Una postulación puede ser rechazada si la fundación considera que las condiciones del hogar, disponibilidad, experiencia o necesidades de la mascota no son compatibles.\n\n' +
      'El rechazo no siempre significa que no puedas adoptar otra mascota. Puedes revisar otros compañeros disponibles y postular nuevamente.',
    options: [
      option('Dónde veo mi postulación', 'applications.where'),
      option('Cómo postular', 'applications.how'),
      option('Volver a postulaciones', 'applications'),
      option('Volver al menú principal', 'main')
    ]
  },
  donations: {
    text:
      'Las donaciones en AdoptaLove ayudan a mantener la plataforma funcionando.\n\n' +
      'Estas contribuciones apoyan los costos técnicos del sistema, como hosting, base de datos, mantenimiento y mejoras futuras.\n\n' +
      '¿Qué quieres saber?',
    options: [
      option('Para qué sirven las donaciones', 'donations.purpose'),
      option('Cómo puedo donar', 'donations.how'),
      option('Las donaciones son obligatorias', 'donations.required'),
      option('Volver al menú principal', 'main')
    ]
  },
  'donations.purpose': {
    text:
      'Las donaciones ayudan a sostener la plataforma AdoptaLove.\n\n' +
      'Se pueden usar para cubrir gastos técnicos como servidor, dominio, base de datos, mantenimiento, seguridad y mejoras del sistema.\n\n' +
      'No están pensadas como pago directo para mantener mascotas específicas.',
    options: [
      option('Cómo puedo donar', 'donations.how'),
      option('Las donaciones son obligatorias', 'donations.required'),
      option('Volver a donaciones', 'donations'),
      option('Volver al menú principal', 'main')
    ]
  },
  'donations.how': {
    text:
      'Puedes realizar una donación desde la sección de donaciones de la plataforma.\n\n' +
      'El proceso está pensado para apoyar voluntariamente la continuidad y mejora de AdoptaLove.',
    options: [
      option('Para qué sirven las donaciones', 'donations.purpose'),
      option('Las donaciones son obligatorias', 'donations.required'),
      option('Volver a donaciones', 'donations'),
      option('Volver al menú principal', 'main')
    ]
  },
  'donations.required': {
    text:
      'No. Las donaciones son voluntarias.\n\n' +
      'Puedes usar la plataforma para revisar mascotas y postular a una adopción sin estar obligado a donar.',
    options: [
      option('Para qué sirven las donaciones', 'donations.purpose'),
      option('Cómo puedo donar', 'donations.how'),
      option('Volver a donaciones', 'donations'),
      option('Volver al menú principal', 'main')
    ]
  },
  compatibility: {
    text:
      'El quiz de compatibilidad ayuda a encontrar mascotas que podrían adaptarse mejor a tu estilo de vida, hogar y preferencias.\n\n' +
      '¿Qué quieres saber?',
    options: [
      option('Para qué sirve el quiz', 'compatibility.purpose'),
      option('Cómo funciona el quiz', 'compatibility.how'),
      option('El resultado es obligatorio', 'compatibility.required'),
      option('Volver al menú principal', 'main')
    ]
  },
  'compatibility.purpose': {
    text:
      'El quiz sirve para orientar al adoptante y mostrar mascotas que podrían ser más compatibles con su hogar.\n\n' +
      'Considera datos como tipo de mascota, tamaño preferido, edad de niños en casa y nivel de actividad del hogar.',
    options: [
      option('Cómo funciona el quiz', 'compatibility.how'),
      option('El resultado es obligatorio', 'compatibility.required'),
      option('Volver a compatibilidad', 'compatibility'),
      option('Volver al menú principal', 'main')
    ]
  },
  'compatibility.how': {
    text:
      'El quiz realiza una serie de preguntas simples sobre tus preferencias y condiciones del hogar.\n\n' +
      'Con esas respuestas, el sistema puede recomendar compañeros disponibles que tengan mejor relación con tu perfil.',
    options: [
      option('Para qué sirve el quiz', 'compatibility.purpose'),
      option('El resultado es obligatorio', 'compatibility.required'),
      option('Volver a compatibilidad', 'compatibility'),
      option('Volver al menú principal', 'main')
    ]
  },
  'compatibility.required': {
    text:
      'No. El resultado del quiz es una orientación.\n\n' +
      'Puedes revisar otras mascotas aunque no aparezcan como tu principal coincidencia. La decisión final siempre depende del proceso de postulación y revisión de la fundación.',
    options: [
      option('Para qué sirve el quiz', 'compatibility.purpose'),
      option('Cómo funciona el quiz', 'compatibility.how'),
      option('Volver a compatibilidad', 'compatibility'),
      option('Volver al menú principal', 'main')
    ]
  },
  care: {
    text:
      'Puedo orientarte con cuidados generales para mascotas recién adoptadas.\n\n' +
      'Elige una opción:',
    options: [
      option('Cuidados de perro', 'care.dog'),
      option('Cuidados de gato', 'care.cat'),
      option('Primeros días en casa', 'care.firstDays'),
      option('Alimentación básica', 'care.feeding'),
      option('Volver al menú principal', 'main')
    ]
  },
  'care.dog': {
    text:
      'Un perro recién adoptado necesita adaptación, paciencia y una rutina estable.\n\n' +
      'Recomendaciones básicas:\n\n' +
      '1. Dale un espacio tranquilo para descansar.\n' +
      '2. Mantén agua limpia disponible.\n' +
      '3. Usa alimento adecuado a su edad y tamaño.\n' +
      '4. Evita forzarlo a interactuar si está nervioso.\n' +
      '5. Agenda una revisión veterinaria.\n' +
      '6. Sácalo a pasear de forma gradual y segura.',
    options: [
      option('Primeros días en casa', 'care.firstDays'),
      option('Alimentación básica', 'care.feeding'),
      option('Cuidados de gato', 'care.cat'),
      option('Volver a cuidados', 'care'),
      option('Volver al menú principal', 'main')
    ]
  },
  'care.cat': {
    text:
      'Un gato recién adoptado necesita un espacio seguro y tiempo para adaptarse.\n\n' +
      'Recomendaciones básicas:\n\n' +
      '1. Déjalo explorar poco a poco.\n' +
      '2. Prepara agua, alimento y arenero.\n' +
      '3. No lo obligues a salir de su escondite.\n' +
      '4. Mantén ventanas y balcones seguros.\n' +
      '5. Agenda una revisión veterinaria.\n' +
      '6. Usa juguetes o rascadores para reducir estrés.',
    options: [
      option('Primeros días en casa', 'care.firstDays'),
      option('Alimentación básica', 'care.feeding'),
      option('Cuidados de perro', 'care.dog'),
      option('Volver a cuidados', 'care'),
      option('Volver al menú principal', 'main')
    ]
  },
  'care.firstDays': {
    text:
      'Los primeros días son una etapa de adaptación.\n\n' +
      'Es normal que una mascota esté nerviosa, tímida o explore poco. Lo mejor es darle calma, rutina y un espacio propio.\n\n' +
      'Evita visitas excesivas, ruidos fuertes o cambios bruscos durante los primeros días.',
    options: [
      option('Cuidados de perro', 'care.dog'),
      option('Cuidados de gato', 'care.cat'),
      option('Alimentación básica', 'care.feeding'),
      option('Volver a cuidados', 'care'),
      option('Volver al menú principal', 'main')
    ]
  },
  'care.feeding': {
    text:
      'La alimentación debe adaptarse a la especie, edad, tamaño y condición de salud de la mascota.\n\n' +
      'Evita darle comida humana sin orientación, especialmente alimentos como chocolate, cebolla, ajo, huesos cocidos o productos muy condimentados.\n\n' +
      'Ante dudas específicas, lo más recomendable es consultar con un veterinario.',
    options: [
      option('Cuidados de perro', 'care.dog'),
      option('Cuidados de gato', 'care.cat'),
      option('Primeros días en casa', 'care.firstDays'),
      option('Volver a cuidados', 'care'),
      option('Volver al menú principal', 'main')
    ]
  },
  foundations: {
    text:
      'Las fundaciones pueden usar AdoptaLove para publicar mascotas, revisar postulaciones y gestionar el proceso de adopción.\n\n' +
      '¿Qué quieres saber?',
    options: [
      option('Cómo publicar una mascota', 'foundations.publish'),
      option('Qué pasa al editar una publicación', 'foundations.edit'),
      option('Cómo revisar postulaciones', 'foundations.applications'),
      option('Volver al menú principal', 'main')
    ]
  },
  'foundations.publish': {
    text:
      'Una fundación puede crear una publicación con los datos de la mascota, descripción, edad, tamaño, especie, estado e imagen.\n\n' +
      'Después de crearla, la publicación queda en revisión hasta que el administrador la apruebe.',
    options: [
      option('Qué pasa al editar una publicación', 'foundations.edit'),
      option('Cómo revisar postulaciones', 'foundations.applications'),
      option('Volver a fundaciones', 'foundations'),
      option('Volver al menú principal', 'main')
    ]
  },
  'foundations.edit': {
    text:
      'Cuando una fundación edita una publicación, el cambio puede quedar pendiente de revisión.\n\n' +
      'Esto permite que el administrador revise la modificación antes de que se actualice la información pública de la mascota.',
    options: [
      option('Cómo publicar una mascota', 'foundations.publish'),
      option('Cómo revisar postulaciones', 'foundations.applications'),
      option('Volver a fundaciones', 'foundations'),
      option('Volver al menú principal', 'main')
    ]
  },
  'foundations.applications': {
    text:
      'La fundación puede revisar las postulaciones recibidas para sus mascotas.\n\n' +
      'Desde su panel puede aprobar o rechazar solicitudes, indicando un motivo cuando corresponda.',
    options: [
      option('Cómo publicar una mascota', 'foundations.publish'),
      option('Qué pasa al editar una publicación', 'foundations.edit'),
      option('Volver a fundaciones', 'foundations'),
      option('Volver al menú principal', 'main')
    ]
  }
};

export const QUICK_QUESTIONS = [
  {
    id: 'quick-adopt',
    label: '¿Cómo puedo adoptar una mascota?',
    text:
      'Para adoptar una mascota debes revisar los compañeros disponibles, entrar al perfil de la mascota y completar el formulario de postulación.\n\n' +
      'Luego la fundación revisará tu solicitud y actualizará el estado de la postulación.',
    options: [
      option('Ver pasos para adoptar', 'adoption.steps'),
      option('Qué necesito para postular', 'adoption.requirements'),
      option('Volver al menú principal', 'main')
    ]
  },
  {
    id: 'quick-requirements',
    label: '¿Qué necesito para postular a una adopción?',
    text:
      'Necesitas tener una cuenta de adoptante y completar el formulario de postulación con información sobre tu hogar, experiencia y motivo de adopción.\n\n' +
      'La fundación usará esos datos para evaluar si la adopción es adecuada.',
    options: [
      option('Cómo postular', 'applications.how'),
      option('Dónde veo mi postulación', 'applications.where'),
      option('Volver al menú principal', 'main')
    ]
  },
  {
    id: 'quick-donations-platform',
    label: '¿Cómo funcionan las donaciones?',
    text:
      'Las donaciones en AdoptaLove ayudan a mantener la plataforma funcionando.\n\n' +
      'Se enfocan en cubrir costos técnicos como hosting, base de datos, mantenimiento, seguridad y futuras mejoras del sistema.',
    options: [
      option('Para qué sirven las donaciones', 'donations.purpose'),
      option('Las donaciones son obligatorias', 'donations.required'),
      option('Volver al menú principal', 'main')
    ]
  },
  {
    id: 'quick-dog-care',
    label: '¿Cómo cuido a un perro recién adoptado?',
    text:
      'Un perro recién adoptado necesita paciencia, rutina y un espacio tranquilo.\n\n' +
      'Dale tiempo para adaptarse, mantén agua disponible, usa alimento adecuado, evita forzarlo a interactuar y agenda una revisión veterinaria.',
    options: [
      option('Primeros días en casa', 'care.firstDays'),
      option('Alimentación básica', 'care.feeding'),
      option('Cuidados de gato', 'care.cat'),
      option('Volver al menú principal', 'main')
    ]
  },
  {
    id: 'quick-donations-voluntary',
    label: '¿Las donaciones son voluntarias?',
    text:
      'Las donaciones son voluntarias y ayudan a sostener AdoptaLove.\n\n' +
      'Su objetivo es apoyar los costos técnicos de la plataforma y permitir mejoras futuras.',
    options: [
      option('Para qué sirven las donaciones', 'donations.purpose'),
      option('Las donaciones son obligatorias', 'donations.required'),
      option('Volver al menú principal', 'main')
    ]
  },
  {
    id: 'quick-compatibility',
    label: '¿Para qué sirve el quiz de compatibilidad?',
    text:
      'El quiz de compatibilidad ayuda a orientar al adoptante según sus preferencias y condiciones del hogar.\n\n' +
      'El resultado sugiere mascotas que podrían adaptarse mejor, pero no limita la posibilidad de revisar otros compañeros disponibles.',
    options: [
      option('Cómo funciona el quiz', 'compatibility.how'),
      option('El resultado es obligatorio', 'compatibility.required'),
      option('Volver al menú principal', 'main')
    ]
  }
];

const INTENT_RULES = [
  {
    id: 'account',
    keywords: [
      'cuenta',
      'contraseña',
      'login',
      'iniciar sesión',
      'no puedo entrar',
      'correo',
      'rut',
      'desactivada'
    ]
  },
  {
    id: 'adoption',
    keywords: ['adoptar', 'adopción', 'mascota', 'compañero', 'perro', 'gato', 'postular', 'formulario']
  },
  {
    id: 'applications',
    keywords: ['postulación', 'solicitud', 'estado', 'revisión', 'rechazado', 'aprobado', 'fundación revisa']
  },
  {
    id: 'donations',
    keywords: ['donar', 'donación', 'donaciones', 'pago', 'apoyo', 'mantener página', 'mantener plataforma', 'costos']
  },
  {
    id: 'compatibility',
    keywords: ['quiz', 'compatibilidad', 'match', 'recomendación', 'compatible', 'encuesta']
  },
  {
    id: 'care',
    keywords: ['cuidados', 'cuidar', 'alimentación', 'perro recién adoptado', 'gato recién adoptado', 'primeros días', 'veterinario']
  },
  {
    id: 'foundations',
    keywords: ['fundación', 'publicar', 'publicación', 'editar mascota', 'postulaciones recibidas', 'aprobar solicitud', 'rechazar solicitud']
  }
];

export function createMessage(role, text, options = [], source = 'faq') {
  return {
    id: `${role}-${Date.now()}-${Math.random().toString(16).slice(2)}`,
    options,
    role,
    source,
    text
  };
}

export function getInitialMessages() {
  return [
    createMessage('bot', CHATBOT_NODES.main.text, CHATBOT_NODES.main.options)
  ];
}

export function getNodeResponse(nodeId) {
  return CHATBOT_NODES[nodeId] || CHATBOT_NODES.main;
}

export function getQuickQuestionById(questionId) {
  return QUICK_QUESTIONS.find((question) => question.id === questionId);
}

export function getFallbackResponse() {
  return {
    text: 'No encontré una respuesta exacta, pero puedo ayudarte con estas opciones:',
    options: MAIN_MENU_OPTIONS
  };
}

export function getAccountResponse() {
  return {
    text:
      'Por ahora el chatbot no gestiona problemas de cuenta directamente.\n\n' +
      'Si tienes inconvenientes con el acceso, contraseña o datos de tu cuenta, puedes contactar al equipo de AdoptaLove al correo:\n\n' +
      `${ADOPTALOVE_SUPPORT_EMAIL}\n\n` +
      'Incluye tu nombre, correo registrado y una breve descripción del problema.',
    options: [
      option('Volver al menú principal', 'main'),
      option('Adoptar una mascota', 'adoption'),
      option('Postulaciones', 'applications')
    ]
  };
}

export function detectIntent(messageText) {
  const normalizedText = normalize(messageText);
  const matches = INTENT_RULES
    .map((rule) => ({
      id: rule.id,
      score: rule.keywords.filter((keyword) => includesAny(normalizedText, [keyword])).length
    }))
    .filter((match) => match.score > 0)
    .sort((first, second) => second.score - first.score);

  return matches[0]?.id || null;
}

export function getLocalResponseForMessage(messageText) {
  const quickQuestion = QUICK_QUESTIONS.find(
    (question) => normalize(question.label) === normalize(messageText)
  );

  if (quickQuestion) {
    return {
      options: quickQuestion.options,
      text: quickQuestion.text
    };
  }

  const intent = detectIntent(messageText);

  if (intent === 'account') {
    return getAccountResponse();
  }

  if (intent && CHATBOT_NODES[intent]) {
    return CHATBOT_NODES[intent];
  }

  return getFallbackResponse();
}

export function getRelatedOptionsForMessage(messageText) {
  const response = getLocalResponseForMessage(messageText);

  return response.options || MAIN_MENU_OPTIONS;
}
