const OpenAI = require('openai');
const env = require('../config/env');

const SYSTEM_PROMPT = [
  'Eres el asistente virtual de AdoptaLove, una plataforma web de adopción responsable de mascotas.',
  'Responde en español chileno, de forma amable, breve y clara.',
  'Puedes orientar sobre adopciones, postulaciones, compatibilidad, donaciones y cuidados básicos de mascotas.',
  'Si la consulta está fuera de AdoptaLove o de mascotas, redirige amablemente a esos temas.',
  'No inventes datos específicos de fundaciones, pagos reales o diagnósticos veterinarios.',
  'Si la consulta requiere atención veterinaria, recomienda acudir a un veterinario.',
  'Si no sabes algo, dilo claramente.'
].join(' ');

const OPENAI_TIMEOUT_MS = 8000;

let client;

function isConfigured() {
  return Boolean(env.openaiApiKey && env.openaiApiKey.trim());
}

function getClient() {
  if (!isConfigured()) {
    return null;
  }

  if (!client) {
    client = new OpenAI({
      apiKey: env.openaiApiKey,
      maxRetries: 0,
      timeout: 8000
    });
  }

  return client;
}

async function askAdoptaLoveAssistant(message) {
  const openai = getClient();

  if (!openai) {
    return null;
  }

  const controller = new AbortController();
  const timeout = setTimeout(() => controller.abort(), OPENAI_TIMEOUT_MS);

  let response;

  try {
    response = await openai.responses.create(
      {
        model: env.openaiModel,
        instructions: SYSTEM_PROMPT,
        input: message,
        max_output_tokens: 220
      },
      {
        signal: controller.signal,
        timeout: OPENAI_TIMEOUT_MS
      }
    );
  } finally {
    clearTimeout(timeout);
  }

  const answer = response.output_text?.trim();

  if (!answer) {
    return null;
  }

  return {
    answer,
    model: env.openaiModel,
    source: 'ai'
  };
}

module.exports = {
  askAdoptaLoveAssistant,
  isConfigured
};
