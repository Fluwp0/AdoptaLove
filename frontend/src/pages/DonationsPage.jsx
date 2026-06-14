import { useEffect, useMemo, useState } from 'react';
import { apiClient } from '../services/apiClient';
import { getCurrentUser } from '../services/authSession';

const SUGGESTED_AMOUNTS = [2000, 5000, 10000, 20000];

const PAYMENT_METHODS = [
  {
    value: 'webpay',
    label: 'Webpay',
    description: 'Simulación de pago en línea',
    icon: '💳'
  },
  {
    value: 'transferencia',
    label: 'Transferencia',
    description: 'Registro de aporte bancario',
    icon: '🏦'
  },
  {
    value: 'tarjeta',
    label: 'Tarjeta',
    description: 'Simulación de tarjeta',
    icon: '💗'
  }
];

const HELP_ITEMS = [
  {
    icon: '🛠️',
    title: 'Mantención de la plataforma',
    text: 'Tu aporte ayuda a mantener AdoptaLove activa y disponible.'
  },
  {
    icon: '🏡',
    title: 'Más fundaciones visibles',
    text: 'Permite que más fundaciones publiquen sus mascotas en la plataforma.'
  },
  {
    icon: '🐾',
    title: 'Mayor alcance para adopciones',
    text: 'Ayuda a que más personas conozcan mascotas que buscan un hogar.'
  },
  {
    icon: '✦',
    title: 'Mejora continua',
    text: 'Tu donación apoya nuevas funciones y mejoras para la experiencia de adopción.'
  },
  {
    icon: '♡',
    title: 'Más oportunidades para ayudar',
    text: 'Con una plataforma activa, más mascotas pueden ser vistas y adoptadas.'
  }
];

function formatCurrency(value) {
  return new Intl.NumberFormat('es-CL', {
    currency: 'CLP',
    maximumFractionDigits: 0,
    style: 'currency'
  }).format(Number(value) || 0);
}

function getDonationAmount(selectedAmount, customAmount) {
  if (selectedAmount === 'custom') {
    return Number(customAmount);
  }

  return Number(selectedAmount);
}

export function DonationsPage() {
  const [selectedAmount, setSelectedAmount] = useState(5000);
  const [customAmount, setCustomAmount] = useState('');
  const [paymentMethod, setPaymentMethod] = useState('webpay');
  const [message, setMessage] = useState('');
  const [submitStatus, setSubmitStatus] = useState('idle');
  const [feedback, setFeedback] = useState('');
  const [successDonation, setSuccessDonation] = useState(null);
  const [summary, setSummary] = useState(null);

  const currentUser = getCurrentUser();
  const donationAmount = useMemo(
    () => getDonationAmount(selectedAmount, customAmount),
    [customAmount, selectedAmount]
  );
  const isSubmitting = submitStatus === 'submitting';

  useEffect(() => {
    let isMounted = true;

    async function loadSummary() {
      try {
        const response = await apiClient('/donations/summary');
        const payload = await response.json();

        if (response.ok && isMounted) {
          setSummary(payload.data);
        }
      } catch (_error) {
        if (isMounted) {
          setSummary(null);
        }
      }
    }

    loadSummary();

    return () => {
      isMounted = false;
    };
  }, []);

  function selectSuggestedAmount(amount) {
    setSelectedAmount(amount);
    setCustomAmount('');
    setFeedback('');
  }

  function selectCustomAmount() {
    setSelectedAmount('custom');
    setFeedback('');
  }

  function updateCustomAmount(event) {
    setSelectedAmount('custom');
    setCustomAmount(event.target.value.replace(/[^\d]/g, ''));
    setFeedback('');
  }

  async function handleSubmit(event) {
    event.preventDefault();
    setFeedback('');
    setSuccessDonation(null);

    if (!Number.isFinite(donationAmount) || donationAmount <= 0) {
      setSubmitStatus('error');
      setFeedback('Ingresa un monto mayor a 0 para realizar la donación.');
      return;
    }

    if (!paymentMethod) {
      setSubmitStatus('error');
      setFeedback('Selecciona un método de pago simulado.');
      return;
    }

    setSubmitStatus('submitting');

    try {
      const response = await apiClient('/donations', {
        method: 'POST',
        body: JSON.stringify({
          usuario_id: currentUser?.id ?? null,
          monto: donationAmount,
          metodo_pago: paymentMethod,
          mensaje: message
        })
      });
      const payload = await response.json();

      if (!response.ok) {
        throw new Error(payload.message || 'No se pudo registrar la donación.');
      }

      setSubmitStatus('success');
      setSuccessDonation(payload.data);
      setFeedback('Gracias por tu donación. Tu apoyo ayuda a que más mascotas encuentren un hogar.');
      setMessage('');

      const summaryResponse = await apiClient('/donations/summary');
      const summaryPayload = await summaryResponse.json();

      if (summaryResponse.ok) {
        setSummary(summaryPayload.data);
      }
    } catch (error) {
      setSubmitStatus('error');
      setFeedback(error.message);
    }
  }

  return (
    <section className="donations-page">
      <div className="donations-hero">
        <div>
          <span className="donations-pill">Donaciones solidarias</span>
          <h2>Ayuda a cambiar más vidas</h2>
          <p>
            Tu aporte ayuda a alimentar, cuidar y proteger mascotas que esperan
            un hogar.
          </p>
          <a className="donations-hero-action" href="#donation-form">
            Donar ahora
          </a>
        </div>

        <aside className="donations-impact-card" aria-label="Resumen de donaciones">
          <span>♡</span>
          <strong>{formatCurrency(summary?.total_donado ?? 0)}</strong>
          <p>Total donado en aportes simulados</p>
          <small>{summary?.cantidad_donaciones ?? 0} donaciones registradas</small>
        </aside>
      </div>

      <div className="donations-layout">
        <form className="donation-form-card" id="donation-form" onSubmit={handleSubmit}>
          <div className="donation-section-heading">
            <span>🐾</span>
            <div>
              <h3>Elige tu aporte</h3>
              <p>
                {currentUser
                  ? `Esta donación quedará asociada a ${currentUser.nombre}.`
                  : 'Puedes donar como aporte anónimo sin iniciar sesión.'}
              </p>
            </div>
          </div>

          <div className="donation-amount-grid" aria-label="Montos sugeridos">
            {SUGGESTED_AMOUNTS.map((amount) => (
              <button
                className={
                  selectedAmount === amount
                    ? 'donation-amount-card active'
                    : 'donation-amount-card'
                }
                key={amount}
                onClick={() => selectSuggestedAmount(amount)}
                type="button"
              >
                <span>💗</span>
                <strong>{formatCurrency(amount)}</strong>
              </button>
            ))}

            <button
              className={
                selectedAmount === 'custom'
                  ? 'donation-amount-card active'
                  : 'donation-amount-card'
              }
              onClick={selectCustomAmount}
              type="button"
            >
              <span>✦</span>
              <strong>Otro monto</strong>
            </button>
          </div>

          <label className="donation-field">
            Monto
            <input
              inputMode="numeric"
              min="1"
              onChange={updateCustomAmount}
              placeholder="Ingresa un monto en pesos"
              type="text"
              value={selectedAmount === 'custom' ? customAmount : String(selectedAmount)}
            />
          </label>

          <fieldset className="donation-methods">
            <legend>Método de pago simulado</legend>
            {PAYMENT_METHODS.map((method) => (
              <button
                className={
                  paymentMethod === method.value
                    ? 'donation-method-card active'
                    : 'donation-method-card'
                }
                key={method.value}
                onClick={() => setPaymentMethod(method.value)}
                type="button"
              >
                <span>{method.icon}</span>
                <strong>{method.label}</strong>
                <small>{method.description}</small>
              </button>
            ))}
          </fieldset>

          <label className="donation-field">
            Mensaje opcional
            <textarea
              maxLength={1000}
              onChange={(event) => setMessage(event.target.value)}
              placeholder="Puedes dejar un mensaje de apoyo para las mascotas y fundaciones."
              value={message}
            />
          </label>

          <div className="donation-submit-row">
            <div>
              <span>Aporte seleccionado</span>
              <strong>{formatCurrency(donationAmount)}</strong>
            </div>
            <button className="donation-submit-button" disabled={isSubmitting} type="submit">
              {isSubmitting ? 'Procesando donación...' : 'Realizar donación'}
            </button>
          </div>

          {feedback && (
            <p
              className={
                submitStatus === 'success'
                  ? 'donation-feedback donation-feedback-success'
                  : 'donation-feedback donation-feedback-error'
              }
            >
              {feedback}
              {successDonation?.referencia_pago && (
                <strong> Referencia: {successDonation.referencia_pago}</strong>
              )}
            </p>
          )}
        </form>

        <aside className="donations-info-card">
          <h3>¿Qué logras con tu donación?</h3>
          <div className="donations-help-list">
            {HELP_ITEMS.map((item) => (
              <div key={item.title}>
                <span>{item.icon}</span>
                <div>
                  <strong>{item.title}</strong>
                  <p>{item.text}</p>
                </div>
              </div>
            ))}
          </div>

          {summary?.ultimas_donaciones?.length > 0 && (
            <div className="donations-latest">
              <h4>Últimos aportes</h4>
              {summary.ultimas_donaciones.slice(0, 3).map((donation) => (
                <p key={donation.id}>
                  <strong>{formatCurrency(donation.monto)}</strong>
                  <span>{donation.usuario_nombre || 'Donación anónima'}</span>
                </p>
              ))}
            </div>
          )}
        </aside>
      </div>
    </section>
  );
}

