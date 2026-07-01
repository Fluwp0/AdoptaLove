import { useEffect, useRef } from 'react';

function getMessageClass(variant, role) {
  const baseClass = variant === 'widget' ? 'chatbot-widget-message' : 'chatbot-message';
  const roleClass =
    role === 'user'
      ? `${baseClass}-user`
      : `${baseClass}-bot`;

  return `${baseClass} ${roleClass}`;
}

export function ChatbotConversation({
  assistant,
  inputId,
  isActive = true,
  variant = 'page'
}) {
  const messagesContainerRef = useRef(null);
  const isWidget = variant === 'widget';
  const threadClass = isWidget
    ? 'chatbot-widget-messages chatbot-thread'
    : 'chatbot-window chatbot-thread';
  const formClass = isWidget
    ? 'chatbot-widget-form chatbot-input-form'
    : 'chatbot-form chatbot-input-form';

  useEffect(() => {
    if (!isActive || !messagesContainerRef.current) {
      return undefined;
    }

    const scrollToBottom = (behavior = 'smooth') => {
      messagesContainerRef.current?.scrollTo({
        behavior,
        top: messagesContainerRef.current.scrollHeight
      });
    };

    const animationFrame = window.requestAnimationFrame(() => scrollToBottom('smooth'));
    const finalScroll = window.setTimeout(() => scrollToBottom('auto'), 180);

    return () => {
      window.cancelAnimationFrame(animationFrame);
      window.clearTimeout(finalScroll);
    };
  }, [assistant.messages, assistant.status, isActive]);

  function handleSubmit(event) {
    event.preventDefault();
    assistant.sendQuestion(assistant.input);
  }

  return (
    <>
      <div className={threadClass} ref={messagesContainerRef}>
        {assistant.messages.map((message) => (
          <div
            className={
              message.role === 'user'
                ? 'chatbot-message-group chatbot-message-group-user'
                : 'chatbot-message-group chatbot-message-group-bot'
            }
            key={message.id}
          >
            <div className={getMessageClass(variant, message.role)}>
              {!isWidget && (
                <span aria-hidden="true">
                  {message.role === 'user' ? 'Tú' : '🐾'}
                </span>
              )}
              <p>
                {message.role === 'bot' && !isWidget && (
                  <small>Asistente AdoptaLove</small>
                )}
                {message.text}
              </p>
            </div>

            {message.role === 'bot' && message.options?.length > 0 && (
              <div className="chatbot-message-options" aria-label="Opciones del asistente">
                {message.options.map((option) => (
                  <button
                    disabled={assistant.isLoading}
                    key={`${message.id}-${option.label}-${option.nodeId}`}
                    onClick={() => assistant.handleOptionClick(option)}
                    type="button"
                  >
                    {option.label}
                  </button>
                ))}
              </div>
            )}
          </div>
        ))}

        {assistant.isLoading && (
          <div className="chatbot-message-group chatbot-message-group-bot">
            <div className={getMessageClass(variant, 'bot')}>
              {!isWidget && <span aria-hidden="true">🐾</span>}
              <p>Preparando respuesta...</p>
            </div>
          </div>
        )}
      </div>

      <form className={formClass} onSubmit={handleSubmit}>
        <label htmlFor={inputId}>Escribe tu pregunta</label>
        <div>
          <input
            id={inputId}
            onChange={(event) => assistant.setInput(event.target.value)}
            placeholder="Ej: quiero adoptar un perro"
            type="text"
            value={assistant.input}
          />
          <button disabled={assistant.isLoading} type="submit">
            Enviar
          </button>
        </div>
      </form>
    </>
  );
}
