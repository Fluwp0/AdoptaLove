import { useCallback, useEffect, useMemo, useState } from 'react';
import { apiClient } from '../../services/apiClient';
import {
  QUICK_QUESTIONS,
  createMessage,
  getInitialMessages,
  getLocalResponseForMessage,
  getNodeResponse,
  getQuickQuestionById,
  getRelatedOptionsForMessage
} from './chatbotFlow';

const CHATBOT_AI_ENABLED =
  import.meta.env?.VITE_CHATBOT_AI_ENABLED === 'true' ||
  (typeof process !== 'undefined' &&
    process.env.NEXT_PUBLIC_CHATBOT_AI_ENABLED === 'true');

function getSessionStorage() {
  if (typeof window === 'undefined') {
    return null;
  }

  try {
    return window.sessionStorage;
  } catch (_error) {
    return null;
  }
}

function getStoredConversation(storageKey) {
  if (!storageKey) {
    return getInitialMessages();
  }

  const storage = getSessionStorage();

  if (!storage) {
    return getInitialMessages();
  }

  try {
    const storedConversation = storage.getItem(storageKey);
    const parsedConversation = storedConversation ? JSON.parse(storedConversation) : null;

    if (Array.isArray(parsedConversation) && parsedConversation.length > 0) {
      return parsedConversation;
    }
  } catch (_error) {
    try {
      storage.removeItem(storageKey);
    } catch (_cleanupError) {
      // Ignore storage cleanup failures; the in-memory conversation remains usable.
    }
  }

  return getInitialMessages();
}

async function askAiIfAvailable(messageText) {
  if (!CHATBOT_AI_ENABLED) {
    return null;
  }

  try {
    const response = await apiClient('/chatbot/ask', {
      body: JSON.stringify({ message: messageText }),
      method: 'POST'
    });
    const payload = await response.json();
    const answer = payload.data?.answer;

    if (!response.ok || !answer) {
      return null;
    }

    return {
      options: getRelatedOptionsForMessage(messageText),
      source: payload.data?.source === 'ai' ? 'ai' : 'faq',
      text: answer
    };
  } catch (_error) {
    return null;
  }
}

export function useChatbotAssistant({ storageKey = null } = {}) {
  const [messages, setMessages] = useState(() => getStoredConversation(storageKey));
  const [input, setInput] = useState('');
  const [status, setStatus] = useState('idle');
  const isLoading = status === 'submitting';
  const quickQuestions = useMemo(() => QUICK_QUESTIONS, []);

  useEffect(() => {
    setMessages(getStoredConversation(storageKey));
    setInput('');
    setStatus('idle');
  }, [storageKey]);

  useEffect(() => {
    if (!storageKey) {
      return;
    }

    const storage = getSessionStorage();

    if (!storage) {
      return;
    }

    try {
      storage.setItem(storageKey, JSON.stringify(messages));
    } catch (_error) {
      // The chatbot still works normally if session storage is unavailable.
    }
  }, [messages, storageKey]);

  const pushBotResponse = useCallback((response, source = 'faq') => {
    setMessages((currentMessages) => [
      ...currentMessages,
      createMessage('bot', response.text, response.options || [], source)
    ]);
  }, []);

  const handleOptionClick = useCallback((option) => {
    if (!option?.nodeId || isLoading) {
      return;
    }

    const response = getNodeResponse(option.nodeId);

    setMessages((currentMessages) => [
      ...currentMessages,
      createMessage('user', option.label),
      createMessage('bot', response.text, response.options || [])
    ]);
  }, [isLoading]);

  const sendQuestion = useCallback(async (questionText) => {
    const messageText = questionText.trim();

    if (!messageText || isLoading) {
      return;
    }

    setInput('');
    setStatus('submitting');
    setMessages((currentMessages) => [
      ...currentMessages,
      createMessage('user', messageText)
    ]);

    const aiResponse = await askAiIfAvailable(messageText);
    const response = aiResponse || getLocalResponseForMessage(messageText);

    pushBotResponse(response, aiResponse?.source || 'faq');
    setStatus('idle');
  }, [isLoading, pushBotResponse]);

  const sendQuickQuestion = useCallback((questionId) => {
    const quickQuestion = getQuickQuestionById(questionId);

    if (!quickQuestion || isLoading) {
      return;
    }

    setInput('');
    setMessages((currentMessages) => [
      ...currentMessages,
      createMessage('user', quickQuestion.label),
      createMessage('bot', quickQuestion.text, quickQuestion.options || [])
    ]);
  }, [isLoading]);

  const resetConversation = useCallback(() => {
    if (storageKey) {
      const storage = getSessionStorage();

      if (storage) {
        try {
          storage.removeItem(storageKey);
        } catch (_error) {
          // Resetting local state is enough if storage cannot be updated.
        }
      }
    }

    setMessages(getInitialMessages());
    setInput('');
    setStatus('idle');
  }, [storageKey]);

  return {
    handleOptionClick,
    input,
    isLoading,
    messages,
    quickQuestions,
    resetConversation,
    sendQuestion,
    sendQuickQuestion,
    setInput,
    status
  };
}
