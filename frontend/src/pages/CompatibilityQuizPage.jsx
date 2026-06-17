import { useEffect, useMemo, useState } from 'react';
import { apiClient } from '../services/apiClient';
import { getCurrentUser } from '../services/authSession';
import { displayText } from '../utils/displayText';
import { getMediaUrl } from '../utils/mediaUrl';
import { formatPetAge } from '../utils/petDisplay';

const ICONS = {
  baby: '👶',
  backpack: '🎒',
  bird: '🐦',
  bolt: '⚡',
  building: '🏢',
  cat: '🐱',
  clock: '⏰',
  compass: '🧭',
  dog: '🐶',
  family: '👨‍👩‍👧',
  hamster: '🐹',
  heart: '💗',
  heartClock: '💕',
  home: '🏡',
  hourglass: '⏳',
  kids: '🧒',
  moon: '🌙',
  openHeart: '💖',
  paw: '🐾',
  quietHome: '🏠',
  rabbit: '🐰',
  spark: '✨',
  sun: '☀️',
  teen: '🌟',
  toy: '🧸',
  tree: '🌳',
  turtle: '🐢'
};

function formatStatus(status = '') {
  return status
    .split('_')
    .map((word) => word.charAt(0).toUpperCase() + word.slice(1))
    .join(' ');
}

function isQuestionVisible(question, answers) {
  if (!question.dependsOn) {
    return true;
  }

  return answers[question.dependsOn.questionId] === question.dependsOn.value;
}

function RecommendationImage({ name, url }) {
  const [hasError, setHasError] = useState(false);

  if (!url || hasError) {
    return <div className="quiz-pet-image-placeholder">Sin imagen</div>;
  }

  return (
    <img
      alt={`Foto de ${name}`}
      className="quiz-pet-image"
      onError={() => setHasError(true)}
      src={getMediaUrl(url)}
    />
  );
}

function getSelectedLabel(question, value) {
  return question.options.find((option) => option.value === value)?.label || '';
}

function getAnswerLabel(question, answers, questions = []) {
  if (question.id === 'tipoMascota' && answers.tipoMascota === 'otro') {
    const otherPetQuestion = questions.find((candidate) => candidate.id === 'tipoMascotaOtro');
    return getSelectedLabel(otherPetQuestion ?? { options: [] }, answers.tipoMascotaOtro) || 'Pendiente';
  }

  return getSelectedLabel(question, answers[question.id]) || 'Pendiente';
}

function getSubmissionAnswers(answers) {
  if (answers.tipoMascota === 'otro' && answers.tipoMascotaOtro) {
    return {
      ...answers,
      tipoMascota: answers.tipoMascotaOtro
    };
  }

  return answers;
}

export function CompatibilityQuizPage() {
  const [questions, setQuestions] = useState([]);
  const [loadStatus, setLoadStatus] = useState('loading');
  const [loadError, setLoadError] = useState('');
  const [stage, setStage] = useState('intro');
  const [currentIndex, setCurrentIndex] = useState(0);
  const [answers, setAnswers] = useState({});
  const [matchStatus, setMatchStatus] = useState('idle');
  const [matchError, setMatchError] = useState('');
  const [recommendations, setRecommendations] = useState([]);

  const currentUser = getCurrentUser();
  const visibleQuestions = useMemo(
    () => questions.filter((question) => isQuestionVisible(question, answers)),
    [answers, questions]
  );
  const currentQuestion = visibleQuestions[currentIndex];
  const progress = visibleQuestions.length
    ? Math.round(((currentIndex + 1) / visibleQuestions.length) * 100)
    : 0;
  const summaryQuestions = useMemo(
    () => visibleQuestions.filter((question) => question.id !== 'tipoMascotaOtro'),
    [visibleQuestions]
  );

  useEffect(() => {
    let isMounted = true;

    async function loadQuestions() {
      try {
        const response = await apiClient('/compatibility/questions');
        const payload = await response.json();

        if (!response.ok) {
          throw new Error(payload.message || 'No se pudieron cargar las preguntas.');
        }

        if (isMounted) {
          setQuestions(payload.data ?? []);
          setLoadStatus('success');
        }
      } catch (error) {
        if (isMounted) {
          setLoadError(error.message);
          setLoadStatus('error');
        }
      }
    }

    loadQuestions();

    return () => {
      isMounted = false;
    };
  }, []);

  useEffect(() => {
    if (currentIndex >= visibleQuestions.length && visibleQuestions.length > 0) {
      setCurrentIndex(visibleQuestions.length - 1);
    }
  }, [currentIndex, visibleQuestions.length]);

  function startQuiz() {
    setStage('questions');
    setCurrentIndex(0);
    setMatchError('');
  }

  function restartQuiz() {
    setStage('intro');
    setCurrentIndex(0);
    setAnswers({});
    setRecommendations([]);
    setMatchStatus('idle');
    setMatchError('');
  }

  function updateAnswer(questionId, value) {
    setAnswers((currentAnswers) => {
      const nextAnswers = {
        ...currentAnswers,
        [questionId]: value
      };

      if (questionId === 'tipoMascota' && value !== 'otro') {
        delete nextAnswers.tipoMascotaOtro;
      }

      if (questionId === 'tieneNinos' && value !== 'si') {
        delete nextAnswers.edadNinos;
      }

      return nextAnswers;
    });
  }

  function canContinue() {
    if (!currentQuestion) {
      return false;
    }

    if (!answers[currentQuestion.id]) {
      return false;
    }

    return true;
  }

  async function finishQuiz() {
    setMatchStatus('submitting');
    setMatchError('');

    try {
      const response = await apiClient('/compatibility/match', {
        method: 'POST',
        body: JSON.stringify({
          usuario_id: currentUser?.id ?? null,
          respuestas: getSubmissionAnswers(answers)
        })
      });
      const payload = await response.json();

      if (!response.ok) {
        throw new Error(payload.message || 'No se pudieron calcular recomendaciones.');
      }

      setRecommendations(payload.data?.recomendaciones ?? []);
      setMatchStatus('success');
      setStage('results');
    } catch (error) {
      setMatchStatus('error');
      setMatchError(error.message);
    }
  }

  function goNext() {
    if (!canContinue()) {
      return;
    }

    if (currentIndex < visibleQuestions.length - 1) {
      setCurrentIndex((nextIndex) => nextIndex + 1);
      return;
    }

    finishQuiz();
  }

  function goBack() {
    if (currentIndex > 0) {
      setCurrentIndex((nextIndex) => nextIndex - 1);
      return;
    }

    setStage('intro');
  }

  if (loadStatus === 'loading') {
    return (
      <section className="quiz-page">
        <div className="catalog-state">Preparando encuesta de compatibilidad...</div>
      </section>
    );
  }

  if (loadStatus === 'error') {
    return (
      <section className="quiz-page">
        <div className="catalog-state catalog-state-error">{loadError}</div>
      </section>
    );
  }

  if (stage === 'intro') {
    return (
      <section className="quiz-page">
        <div className="quiz-intro">
          <div className="quiz-intro-copy">
            <span className="quiz-pill">Match de compatibilidad</span>
            <h2>Encuentra tu compañero ideal</h2>
            <p>
              Responde unas preguntas y te ayudaremos a encontrar mascotas
              compatibles contigo, tu hogar y tu ritmo de vida.
            </p>
            <button className="quiz-primary-button" onClick={startQuiz} type="button">
              Comenzar encuesta
            </button>
          </div>

          <aside className="quiz-intro-card" aria-label="Resumen del quiz">
            <span className="quiz-card-icon" aria-hidden="true">💗</span>
            <h3>Un match pensado con cariño</h3>
            <p>
              La recomendación prioriza especie, tamaño, vivienda, niños en casa,
              nivel de actividad y tiempo disponible.
            </p>
          </aside>
        </div>
      </section>
    );
  }

  if (stage === 'results') {
    return (
      <section className="quiz-page">
        <div className="quiz-results-hero">
          <div>
            <p className="section-kicker">Estos compañeros podrían ser compatibles contigo</p>
            <p>
              Ordenamos las mascotas disponibles según tus respuestas. Puedes ver
              su detalle o volver a responder la encuesta cuando quieras.
            </p>
          </div>
          <div className="quiz-result-actions">
            <a className="detail-secondary-action" href="/">Ver compañeros disponibles</a>
            <button className="detail-primary-action" onClick={restartQuiz} type="button">
              Volver a hacer encuesta
            </button>
          </div>
        </div>

        <div className="quiz-recommendation-grid">
          {recommendations.map((pet) => (
            <article className="quiz-recommendation-card" key={pet.id}>
              <div className="quiz-pet-image-wrap">
                <RecommendationImage name={displayText(pet.nombre)} url={pet.foto_url} />
                <span className="quiz-score">{pet.compatibility_score}% match</span>
              </div>
              <div className="quiz-recommendation-body">
                <div>
                  <h3>{displayText(pet.nombre)}</h3>
                  <p>
                    {displayText(pet.especie)} <span>•</span> {formatPetAge(pet.edad_anios, pet.edad_meses)} <span>•</span>{' '}
                    {formatStatus(pet.tamano)}
                  </p>
                </div>
                <ul>
                  {(pet.compatibility_reasons ?? []).map((reason) => (
                    <li key={reason}>{displayText(reason)}</li>
                  ))}
                </ul>
                <a className="pet-detail-link" href={`/mascotas/${pet.id}`}>
                  Ver detalle
                </a>
              </div>
            </article>
          ))}
        </div>

        {!recommendations.length && (
          <div className="catalog-state">
            No encontramos recomendaciones por ahora, pero puedes revisar los
            compañeros disponibles.
          </div>
        )}
      </section>
    );
  }

  return (
      <section className="quiz-page">
        <div className="quiz-step-layout">
        <article
          className={
            currentQuestion.layout === 'vertical'
              ? 'quiz-question-card quiz-question-card-focus'
              : 'quiz-question-card'
          }
        >
          <div className="quiz-progress-row">
            <span>
              Pregunta {currentIndex + 1} de {visibleQuestions.length}
            </span>
            <strong>{progress}%</strong>
          </div>
          <div className="quiz-progress-track" aria-hidden="true">
            <span style={{ width: `${progress}%` }} />
          </div>

          <div className="quiz-question-heading">
            <span aria-hidden="true">{ICONS[currentQuestion.icon] ?? ICONS.heart}</span>
            <div>
              <h2>{currentQuestion.title}</h2>
              <p>{currentQuestion.description}</p>
            </div>
          </div>

          <div
            className={
              currentQuestion.layout === 'vertical'
                ? 'quiz-option-grid quiz-option-grid-vertical'
                : 'quiz-option-grid'
            }
          >
            {currentQuestion.options.map((option) => {
              const isSelected = answers[currentQuestion.id] === option.value;

              return (
                <button
                  className={[
                    'quiz-option-card',
                    currentQuestion.layout === 'vertical' ? 'quiz-option-card-vertical' : '',
                    option.description ? 'quiz-option-card-with-detail' : '',
                    isSelected ? 'active' : ''
                  ]
                    .filter(Boolean)
                    .join(' ')}
                  key={option.value}
                  onClick={() => updateAnswer(currentQuestion.id, option.value)}
                  type="button"
                >
                  <span className="quiz-option-icon" aria-hidden="true">
                    {ICONS[option.icon] ?? ICONS.paw}
                  </span>
                  <span className="quiz-option-copy">
                    <strong>{option.label}</strong>
                    {option.description && <small>{option.description}</small>}
                  </span>
                  {currentQuestion.layout === 'vertical' && (
                    <span className="quiz-option-radio" aria-hidden="true" />
                  )}
                </button>
              );
            })}
          </div>

          <div className="quiz-step-actions">
            <button className="detail-secondary-action" onClick={goBack} type="button">
              Volver
            </button>
            <button
              className="detail-primary-action"
              disabled={!canContinue() || matchStatus === 'submitting'}
              onClick={goNext}
              type="button"
            >
              {matchStatus === 'submitting'
                ? 'Buscando recomendaciones...'
                : currentIndex === visibleQuestions.length - 1
                  ? 'Ver recomendaciones'
                  : 'Siguiente'}
            </button>
          </div>

          {matchError && (
            <p className="adoption-feedback adoption-feedback-error">{matchError}</p>
          )}
        </article>

        <aside className="quiz-summary-card">
          <span>Tu encuesta</span>
          <h3>Respuestas hasta ahora</h3>
          <dl>
            {summaryQuestions.map((question) => (
              <div key={question.id}>
                <dt>{question.title}</dt>
                <dd>{getAnswerLabel(question, answers, questions)}</dd>
              </div>
            ))}
          </dl>
        </aside>
      </div>
    </section>
  );
}
