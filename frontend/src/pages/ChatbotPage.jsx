import { useEffect, useRef, useState } from 'react';
import { apiClient } from '../services/apiClient';

const INITIAL_MESSAGES = [
  {
    id: 'welcome',
    role: 'bot',
    source: 'faq',
    text: '¡Hola! Soy el asistente de AdoptaLove 🐾 ¿En qué puedo ayudarte hoy?'
  }
];

const FALLBACK_QUICK_QUESTIONS = [
  '¿Cómo puedo adoptar una mascota?',
  '¿Qué necesito para postular?',
  '¿Cómo funcionan las donaciones?',
  '¿Para qué sirve el quiz de compatibilidad?',
  '¿Qué cuidados necesita una mascota recién adoptada?',
  '¿Cómo contacto a una fundación?'
];

function createMessage(role, text, source = null) {
  return {
    id: `${role}-${Date.now()}-${Math.random().toString(16).slice(2)}`,
    role,
    source,
    text
  };
}

function getAssistantLabel(source) {
  return source === 'ai' ? 'Asistente IA' : 'Asistente FAQ';
}

export function ChatbotPage() {
  const [messages, setMessages] = useState(INITIAL_MESSAGES);
  const [quickQuestions, setQuickQuestions] = useState([]);
  const [input, setInput] = useState('');
  const [status, setStatus] = useState('idle');
  const [error, setError] = useState('');
  const messagesEndRef = useRef(null);

  useEffect(() => {
    let isMounted = true;

    async function loadQuestions() {
      try {
        const response = await apiClient('/chatbot/questions');
        const payload = await response.json();

        if (!response.ok) {
          throw new Error(payload.message || 'No se pudieron cargar las preguntas frecuentes.');
        }

        if (isMounted) {
          const questions = (payload.data ?? [])
            .map((question) => question.pregunta)
            .filter(Boolean);

          setQuickQuestions(questions.length ? questions : FALLBACK_QUICK_QUESTIONS);
        }
      } catch (_error) {
        if (isMounted) {
          setQuickQuestions(FALLBACK_QUICK_QUESTIONS);
        }
      }
    }

    loadQuestions();

    return () => {
      isMounted = false;
    };
  }, []);

  useEffect(() => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth', block: 'end' });
  }, [messages, status]);

  async function sendQuestion(questionText) {
    const messageText = questionText.trim();

    if (!messageText || status === 'submitting') {
      return;
    }

    setError('');
    setInput('');
    setStatus('submitting');
    setMessages((currentMessages) => [
      ...currentMessages,
      createMessage('user', messageText)
    ]);

    try {
      const response = await apiClient('/chatbot/ask', {
        method: 'POST',
        body: JSON.stringify({ message: messageText })
      });
      const payload = await response.json();

      if (!response.ok) {
        throw new Error(payload.message || 'No pude encontrar una respuesta en este momento.');
      }

      setMessages((currentMessages) => [
        ...currentMessages,
        createMessage(
          'bot',
          payload.data?.answer || 'Estoy aquí para ayudarte con AdoptaLove.',
          payload.data?.source || 'faq'
        )
      ]);
      setStatus('idle');
    } catch (requestError) {
      setError(requestError.message);
      setMessages((currentMessages) => [
        ...currentMessages,
        createMessage(
          'bot',
          'Lo siento, tuve un problema buscando la respuesta. Intenta nuevamente en unos segundos.'
        )
      ]);
      setStatus('error');
    }
  }

  function handleSubmit(event) {
    event.preventDefault();
    sendQuestion(input);
  }

  return (
    <section className="chatbot-page">
      <div className="chatbot-hero">
        <span className="chatbot-pill">Centro de ayuda</span>
        <h2>Hola, soy el asistente de AdoptaLove</h2>
        <p>
          Puedo ayudarte con dudas sobre adopción, postulaciones, donaciones,
          compatibilidad y cuidados básicos.
        </p>
      </div>

      <div className="chatbot-layout">
        <article className="chatbot-panel" aria-label="Chat de ayuda">
          <div className="chatbot-window">
            {messages.map((message) => (
              <div
                className={
                  message.role === 'user'
                    ? 'chatbot-message chatbot-message-user'
                    : 'chatbot-message chatbot-message-bot'
                }
                key={message.id}
              >
                <span>{message.role === 'user' ? 'Tú' : '🐾'}</span>
                <p>
                  {message.role === 'bot' && (
                    <small>{getAssistantLabel(message.source)}</small>
                  )}
                  {message.text}
                </p>
              </div>
            ))}

            {status === 'submitting' && (
              <div className="chatbot-message chatbot-message-bot chatbot-message-typing">
                <span>🐾</span>
                <p>Buscando respuesta...</p>
              </div>
            )}

            <div ref={messagesEndRef} />
          </div>

          <form className="chatbot-form" onSubmit={handleSubmit}>
            <label htmlFor="chatbot-input">Escribe tu pregunta</label>
            <div>
              <input
                id="chatbot-input"
                onChange={(event) => setInput(event.target.value)}
                placeholder="Ej: ¿Cómo puedo adoptar?"
                type="text"
                value={input}
              />
              <button disabled={status === 'submitting'} type="submit">
                Enviar
              </button>
            </div>
          </form>

          {error && <p className="chatbot-error">{error}</p>}
        </article>

        <aside className="chatbot-quick-card">
          <h3>Preguntas rápidas</h3>
          <div>
            {quickQuestions.slice(0, 6).map((question) => (
              <button
                disabled={status === 'submitting'}
                key={question}
                onClick={() => sendQuestion(question)}
                type="button"
              >
                <span>♡</span>
                {question}
              </button>
            ))}
          </div>
        </aside>
      </div>
    </section>
  );
}

