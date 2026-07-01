import { ChatbotConversation } from '../components/chatbot/ChatbotConversation';
import { useChatbotAssistant } from '../components/chatbot/useChatbotAssistant';

export function ChatbotPage() {
  const assistant = useChatbotAssistant();

  return (
    <section className="chatbot-page">
      <div className="chatbot-hero">
        <span className="chatbot-pill">Centro de ayuda</span>
        <h2>Asistente AdoptaLove</h2>
        <p>
          Puedo ayudarte con dudas sobre adopción, postulaciones, donaciones,
          compatibilidad y cuidados básicos.
        </p>
      </div>

      <div className="chatbot-layout">
        <article className="chatbot-panel" aria-label="Chat de ayuda">
          <ChatbotConversation
            assistant={assistant}
            inputId="chatbot-input"
            variant="page"
          />
        </article>

        <aside className="chatbot-quick-card">
          <h3>Preguntas rápidas</h3>
          <div>
            {assistant.quickQuestions.map((question) => (
              <button
                disabled={assistant.isLoading}
                key={question.id}
                onClick={() => assistant.sendQuickQuestion(question.id)}
                type="button"
              >
                <span aria-hidden="true">💗</span>
                {question.label}
              </button>
            ))}
          </div>
        </aside>
      </div>
    </section>
  );
}
