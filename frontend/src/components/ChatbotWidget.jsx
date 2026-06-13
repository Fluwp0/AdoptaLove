import { useEffect, useRef, useState } from 'react';
import { apiClient } from '../services/apiClient';

const STORAGE_KEY = 'adoptalove-chatbot-messages';
const SOURCE_KEY = 'adoptalove-chatbot-source';

const INITIAL_MESSAGES = [
  {
    id: 'welcome',
    role: 'bot',
    source: 'faq',
    text: '¡Hola! Soy el asistente de AdoptaLove 🐾 ¿En qué puedo ayudarte?'
  }
];

const QUICK_QUESTIONS = [
  '¿Cómo puedo adoptar?',
  '¿Cómo funcionan las donaciones?',
  '¿Para qué sirve el quiz?',
  '¿Qué cuidados necesita una mascota?'
];

function createMessage(role, text, source = null) {
  return {
    id: `${role}-${Date.now()}-${Math.random().toString(16).slice(2)}`,
    role,
    source,
    text
  };
}

function getStoredMessages() {
  try {
    const storedMessages = window.sessionStorage.getItem(STORAGE_KEY);
    const parsedMessages = storedMessages ? JSON.parse(storedMessages) : null;

    if (Array.isArray(parsedMessages) && parsedMessages.length > 0) {
      return parsedMessages;
    }
  } catch (_error) {
    window.sessionStorage.removeItem(STORAGE_KEY);
  }

  return INITIAL_MESSAGES;
}

function getStoredSource() {
  try {
    return window.sessionStorage.getItem(SOURCE_KEY) || 'faq';
  } catch (_error) {
    return 'faq';
  }
}

function getAssistantLabel(source) {
  return source === 'ai' ? 'Asistente IA' : 'Asistente FAQ';
}

export function ChatbotWidget() {
  const [messages, setMessages] = useState(getStoredMessages);
  const [input, setInput] = useState('');
  const [isOpen, setIsOpen] = useState(false);
  const [isLoading, setIsLoading] = useState(false);
  const [assistantSource, setAssistantSource] = useState(getStoredSource);
  const [error, setError] = useState('');
  const messagesContainerRef = useRef(null);
  const messagesEndRef = useRef(null);

  function scrollToLatestMessage(behavior = 'smooth') {
    if (messagesContainerRef.current) {
      if (behavior === 'smooth') {
        messagesContainerRef.current.scrollTo({
          behavior,
          top: messagesContainerRef.current.scrollHeight
        });
      } else {
        messagesContainerRef.current.scrollTop = messagesContainerRef.current.scrollHeight;
      }
    }
  }

  useEffect(() => {
    try {
      window.sessionStorage.setItem(STORAGE_KEY, JSON.stringify(messages));
    } catch (_error) {
      // The chat still works if storage is unavailable.
    }
  }, [messages]);

  useEffect(() => {
    try {
      window.sessionStorage.setItem(SOURCE_KEY, assistantSource);
    } catch (_error) {
      // The source label can safely reset if storage is unavailable.
    }
  }, [assistantSource]);

  useEffect(() => {
    if (isOpen) {
      const animationFrame = window.requestAnimationFrame(() => {
        scrollToLatestMessage('smooth');
      });
      const finalScroll = window.setTimeout(() => scrollToLatestMessage('auto'), 220);

      return () => {
        window.cancelAnimationFrame(animationFrame);
        window.clearTimeout(finalScroll);
      };
    }
  }, [isOpen, messages, isLoading]);

  async function sendQuestion(questionText) {
    const messageText = questionText.trim();

    if (!messageText || isLoading) {
      return;
    }

    setError('');
    setInput('');
    setIsLoading(true);
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

      const source = payload.data?.source === 'ai' ? 'ai' : 'faq';
      setAssistantSource(source);
      setMessages((currentMessages) => [
        ...currentMessages,
        createMessage(
          'bot',
          payload.data?.answer || 'Estoy aquí para ayudarte con AdoptaLove.',
          source
        )
      ]);
    } catch (requestError) {
      setError(requestError.message);
      setAssistantSource('faq');
      setMessages((currentMessages) => [
        ...currentMessages,
        createMessage(
          'bot',
          'Lo siento, tuve un problema buscando la respuesta. Intenta nuevamente en unos segundos.',
          'faq'
        )
      ]);
    } finally {
      setIsLoading(false);
    }
  }

  function handleSubmit(event) {
    event.preventDefault();
    sendQuestion(input);
  }

  return (
    <div className={`chatbot-widget ${isOpen ? 'chatbot-widget-open' : ''}`}>
      {isOpen && (
        <section className="chatbot-widget-panel" aria-label="Asistente AdoptaLove">
          <header className="chatbot-widget-header">
            <div>
              <strong>Asistente AdoptaLove</strong>
              <span>{getAssistantLabel(assistantSource)}</span>
            </div>
            <button
              aria-label="Cerrar chat"
              className="chatbot-widget-close"
              onClick={() => setIsOpen(false)}
              type="button"
            >
              ×
            </button>
          </header>

          <div className="chatbot-widget-messages" ref={messagesContainerRef}>
            {messages.map((message) => (
              <div
                className={
                  message.role === 'user'
                    ? 'chatbot-widget-message chatbot-widget-message-user'
                    : 'chatbot-widget-message chatbot-widget-message-bot'
                }
                key={message.id}
              >
                <p>{message.text}</p>
              </div>
            ))}

            {isLoading && (
              <div className="chatbot-widget-message chatbot-widget-message-bot">
                <p>Buscando respuesta...</p>
              </div>
            )}

            <div ref={messagesEndRef} />
          </div>

          <footer className="chatbot-widget-footer">
            <div className="chatbot-widget-quick" aria-label="Preguntas rápidas">
              {QUICK_QUESTIONS.map((question) => (
                <button
                  disabled={isLoading}
                  key={question}
                  onClick={() => sendQuestion(question)}
                  type="button"
                >
                  {question}
                </button>
              ))}
            </div>

            <form className="chatbot-widget-form" onSubmit={handleSubmit}>
              <label htmlFor="chatbot-widget-input">Escribe tu pregunta</label>
              <div>
                <input
                  id="chatbot-widget-input"
                  onChange={(event) => setInput(event.target.value)}
                  placeholder="Escribe tu duda..."
                  type="text"
                  value={input}
                />
                <button disabled={isLoading} type="submit">
                  Enviar
                </button>
              </div>
            </form>

            {error && <p className="chatbot-widget-error">{error}</p>}
          </footer>
        </section>
      )}

      <button
        aria-expanded={isOpen}
        aria-label={isOpen ? 'Cerrar asistente de ayuda' : 'Abrir asistente de ayuda'}
        className="chatbot-widget-toggle"
        onClick={() => setIsOpen((currentValue) => !currentValue)}
        type="button"
      >
        <span>🐾</span>
        <strong>Ayuda</strong>
      </button>
    </div>
  );
}
