import { useState } from 'react';
import { apiClient } from '../services/apiClient';
import { saveSession } from '../services/authSession';

export function LoginPage() {
  const [form, setForm] = useState({ email: '', password: '' });
  const [status, setStatus] = useState('idle');
  const [feedback, setFeedback] = useState('');

  function updateField(field, value) {
    setForm((currentForm) => ({
      ...currentForm,
      [field]: value
    }));
  }

  async function handleSubmit(event) {
    event.preventDefault();
    setStatus('submitting');
    setFeedback('Iniciando sesión...');

    try {
      const response = await apiClient('/auth/login', {
        method: 'POST',
        body: JSON.stringify(form)
      });
      const payload = await response.json();

      if (!response.ok) {
        throw new Error(payload.message || 'No se pudo iniciar sesión.');
      }

      saveSession(payload.data.token, payload.data.user);
      setStatus('success');
      setFeedback('Sesión iniciada correctamente.');
      window.location.href = '/perfil';
    } catch (error) {
      setStatus('error');
      setFeedback(error.message);
    }
  }

  return (
    <section className="auth-page">
      <div className="auth-layout">
        <div className="auth-card">
          <p className="section-kicker">Iniciar sesión</p>
          <h2>Vuelve a AdoptaLove</h2>
          <p className="auth-subtitle">
            Inicia sesión para seguir ayudando a cambiar vidas y postular de
            forma responsable.
          </p>

          <form className="auth-form" onSubmit={handleSubmit}>
            <label htmlFor="login-email">
              Correo electrónico
              <input
                id="login-email"
                onChange={(event) => updateField('email', event.target.value)}
                placeholder="tu.correo@email.com"
                type="email"
                value={form.email}
              />
            </label>

            <label htmlFor="login-password">
              Contraseña
              <input
                id="login-password"
                onChange={(event) => updateField('password', event.target.value)}
                placeholder="Tu contraseña"
                type="password"
                value={form.password}
              />
            </label>

            {feedback && (
              <p className={`auth-feedback auth-feedback-${status}`}>{feedback}</p>
            )}

            <button className="auth-submit-button" disabled={status === 'submitting'} type="submit">
              {status === 'submitting' ? 'Entrando...' : 'Entrar'}
            </button>
          </form>

          <p className="auth-switch">
            ¿Aún no tienes cuenta? <a href="/registro">Crear cuenta</a>
          </p>
        </div>

        <aside className="auth-side-card">
          <span>Adopción responsable</span>
          <h3>Tu cuenta ayuda a cuidar mejor cada postulación</h3>
          <p>
            Así las fundaciones saben quién está detrás de cada solicitud y
            pueden acompañar mejor el proceso.
          </p>
        </aside>
      </div>
    </section>
  );
}
