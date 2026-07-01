import { useEffect, useMemo, useState } from 'react';
import { getCurrentUser, onSessionChange } from '../services/authSession';
import { ChatbotConversation } from './chatbot/ChatbotConversation';
import { useChatbotAssistant } from './chatbot/useChatbotAssistant';

function getChatStorageKey(user) {
  return user?.id
    ? `adoptalove_chat_v2_messages_user_${user.id}`
    : 'adoptalove_chat_v2_messages_anon';
}

export function ChatbotWidget() {
  const [user, setUser] = useState(getCurrentUser());
  const [isOpen, setIsOpen] = useState(false);
  const storageKey = useMemo(() => getChatStorageKey(user), [user?.id]);
  const assistant = useChatbotAssistant({ storageKey });

  useEffect(() => onSessionChange(setUser), []);

  return (
    <div className={`chatbot-widget ${isOpen ? 'chatbot-widget-open' : ''}`}>
      {isOpen && (
        <section className="chatbot-widget-panel" aria-label="Asistente AdoptaLove">
          <header className="chatbot-widget-header">
            <div>
              <strong>Asistente AdoptaLove</strong>
              <span>Guía interactiva</span>
            </div>
            <div className="chatbot-widget-header-actions">
              <button
                className="chatbot-widget-reset"
                onClick={assistant.resetConversation}
                type="button"
              >
                Nuevo chat
              </button>
              <button
                aria-label="Cerrar chat"
                className="chatbot-widget-close"
                onClick={() => setIsOpen(false)}
                type="button"
              >
                ×
              </button>
            </div>
          </header>

          <ChatbotConversation
            assistant={assistant}
            inputId="chatbot-widget-input"
            isActive={isOpen}
            variant="widget"
          />

        </section>
      )}

      <button
        aria-expanded={isOpen}
        aria-label={isOpen ? 'Cerrar asistente de ayuda' : 'Abrir asistente de ayuda'}
        className="chatbot-widget-toggle"
        onClick={() => setIsOpen((currentValue) => !currentValue)}
        type="button"
      >
        <span aria-hidden="true">🐾</span>
        <strong>Ayuda</strong>
      </button>
    </div>
  );
}
