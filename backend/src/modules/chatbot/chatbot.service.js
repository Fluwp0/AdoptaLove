const openaiClient = require('../../services/openaiClient');
const chatbotModel = require('./chatbot.model');

const FALLBACK_ANSWER =
  'Por ahora no tengo una respuesta exacta para esa pregunta, pero puedo orientarte sobre adopciones, postulaciones, donaciones, compatibilidad y cuidados de mascotas.';

const DEFAULT_QUESTIONS = [
  {
    id: 'default-adopcion',
    pregunta: '¿Cómo puedo adoptar una mascota?',
    categoria: 'adopcion'
  },
  {
    id: 'default-postulacion',
    pregunta: '¿Qué necesito para postular?',
    categoria: 'adopcion'
  },
  {
    id: 'default-donaciones',
    pregunta: '¿Cómo funcionan las donaciones?',
    categoria: 'donaciones'
  },
  {
    id: 'default-compatibilidad',
    pregunta: '¿Para qué sirve el quiz de compatibilidad?',
    categoria: 'compatibilidad'
  },
  {
    id: 'default-cuidados',
    pregunta: '¿Qué cuidados necesita una mascota recién adoptada?',
    categoria: 'cuidados'
  },
  {
    id: 'default-contacto',
    pregunta: '¿Cómo contacto a una fundación?',
    categoria: 'adopcion'
  }
];

const STOP_WORDS = new Set([
  'como',
  'puedo',
  'para',
  'sirve',
  'necesito',
  'tengo',
  'una',
  'uno',
  'unos',
  'unas',
  'sobre',
  'duda',
  'pregunta',
  'mascota',
  'mascotas'
]);

const TOPIC_RULES = [
  {
    category: 'adopcion',
    keywords: ['adoptar', 'adopcion', 'adopción', 'postular', 'postulacion', 'postulación', 'solicitud'],
    answer:
      'Para adoptar, debes elegir una mascota disponible, revisar su información y completar el formulario de postulación. Luego la fundación revisará tu solicitud y podrá contactarte para continuar el proceso.'
  },
  {
    category: 'donaciones',
    keywords: ['donacion', 'donación', 'donar', 'aporte', 'pago', 'webpay', 'transferencia'],
    answer:
      'Las donaciones en AdoptaLove son simuladas por ahora. Puedes elegir un monto, seleccionar un método de pago simulado y registrar tu aporte para ayudar a mantener la plataforma activa y visible para más fundaciones.'
  },
  {
    category: 'compatibilidad',
    keywords: ['compatibilidad', 'match', 'quiz', 'encuesta', 'recomendacion', 'recomendación'],
    answer:
      'El quiz de compatibilidad te ayuda a encontrar mascotas que podrían adaptarse mejor a tu hogar, tu tiempo disponible y tus preferencias. Al terminar, verás recomendaciones ordenadas según tus respuestas.'
  },
  {
    category: 'cuidados',
    keywords: ['cuidado', 'cuidados', 'perro', 'gato', 'vacuna', 'vacunas', 'alimentacion', 'alimentación', 'veterinario'],
    answer:
      'Una mascota recién adoptada necesita paciencia, agua fresca, alimento adecuado, un espacio tranquilo, visitas veterinarias y tiempo para adaptarse. Si notas cambios de conducta o salud, consulta con una fundación o profesional veterinario.'
  },
  {
    category: 'fundaciones',
    keywords: ['fundacion', 'fundación', 'contacto', 'contactar', 'publicar'],
    answer:
      'Puedes contactar a la fundación desde el detalle de cada mascota o avanzar con una postulación. AdoptaLove busca facilitar la conexión entre adoptantes y fundaciones para que más mascotas encuentren hogar.'
  }
];

function normalize(value = '') {
  return String(value)
    .normalize('NFD')
    .replace(/[\u0300-\u036f]/g, '')
    .toLowerCase()
    .trim();
}

function getWords(value) {
  return normalize(value)
    .split(/[^a-z0-9]+/i)
    .filter((word) => word.length >= 4 && !STOP_WORDS.has(word));
}

function scoreQuestion(message, question) {
  const normalizedMessage = normalize(message);
  const normalizedQuestion = normalize(`${question.pregunta} ${question.categoria || ''}`);
  const words = getWords(normalizedQuestion);

  if (normalizedMessage.includes(normalizedQuestion) && normalizedQuestion.length > 0) {
    return 100;
  }

  return words.reduce((score, word) => {
    return normalizedMessage.includes(word) ? score + 1 : score;
  }, 0);
}

function findBestDatabaseAnswer(message, questions) {
  return questions
    .filter((question) => question.respuesta)
    .map((question) => ({
      ...question,
      score: scoreQuestion(message, question)
    }))
    .filter((question) => question.score > 0)
    .sort((first, second) => second.score - first.score)[0];
}

function findExactDatabaseAnswer(message, questions) {
  const normalizedMessage = normalize(message);

  return questions.find((question) => {
    if (!question.respuesta || !question.pregunta) {
      return false;
    }

    const normalizedQuestion = normalize(question.pregunta);
    return (
      normalizedMessage === normalizedQuestion ||
      normalizedMessage.includes(normalizedQuestion) ||
      normalizedQuestion.includes(normalizedMessage)
    );
  });
}

function isSimilarQuestion(questionList, candidate) {
  const candidateWords = getWords(candidate.pregunta);
  const normalizedCandidate = normalize(candidate.pregunta);

  return questionList.some((question) => {
    const normalizedQuestion = normalize(question.pregunta);

    if (
      normalizedQuestion.includes(normalizedCandidate) ||
      normalizedCandidate.includes(normalizedQuestion)
    ) {
      return true;
    }

    const questionWords = getWords(question.pregunta);
    const overlap = candidateWords.filter((word) => questionWords.includes(word)).length;
    return question.categoria === candidate.categoria && overlap >= Math.min(2, candidateWords.length);
  });
}

function findRuleAnswer(message) {
  const normalizedMessage = normalize(message);

  return TOPIC_RULES.find((rule) =>
    rule.keywords.some((keyword) => normalizedMessage.includes(normalize(keyword)))
  );
}

async function getQuestions() {
  const questions = await chatbotModel.findActiveQuestions();
  const uniqueQuestions = questions
    .filter((question) => question.pregunta)
    .map(({ id, pregunta, categoria }) => ({ id, pregunta, categoria }));

  if (uniqueQuestions.length === 0) {
    return DEFAULT_QUESTIONS;
  }

  const completedQuestions = [...uniqueQuestions];

  DEFAULT_QUESTIONS.forEach((question) => {
    if (!isSimilarQuestion(completedQuestions, question)) {
      completedQuestions.push(question);
    }
  });

  return completedQuestions;
}

async function askFaqQuestion(message) {
  const questions = await chatbotModel.findActiveQuestions();
  const exactDatabaseAnswer = findExactDatabaseAnswer(message, questions);

  if (exactDatabaseAnswer) {
    return {
      answer: exactDatabaseAnswer.respuesta,
      faq_source: 'database',
      matched_question: exactDatabaseAnswer.pregunta,
      source: 'faq'
    };
  }

  const ruleAnswer = findRuleAnswer(message);

  if (ruleAnswer) {
    return {
      answer: ruleAnswer.answer,
      category: ruleAnswer.category,
      faq_source: 'rules',
      source: 'faq'
    };
  }

  const databaseAnswer = findBestDatabaseAnswer(message, questions);

  if (databaseAnswer && databaseAnswer.score >= 2) {
    return {
      answer: databaseAnswer.respuesta,
      faq_source: 'database',
      matched_question: databaseAnswer.pregunta,
      source: 'faq'
    };
  }

  return {
    answer: FALLBACK_ANSWER,
    faq_source: 'fallback',
    source: 'faq'
  };
}

async function askQuestion(payload = {}) {
  const message = typeof payload.message === 'string' ? payload.message.trim() : '';

  if (!message) {
    return {
      answer: 'Escríbeme tu duda y te ayudaré con adopciones, postulaciones, donaciones, compatibilidad o cuidados de mascotas.',
      faq_source: 'empty',
      source: 'faq'
    };
  }

  if (openaiClient.isConfigured()) {
    try {
      const aiAnswer = await openaiClient.askAdoptaLoveAssistant(message);

      if (aiAnswer) {
        return aiAnswer;
      }
    } catch (error) {
      console.warn(`OpenAI chatbot fallback: ${error.message}`);
    }
  }

  return askFaqQuestion(message);
}

module.exports = {
  askQuestion,
  getQuestions
};
