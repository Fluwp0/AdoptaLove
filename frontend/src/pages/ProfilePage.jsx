import { useEffect, useState } from 'react';
import { apiClient } from '../services/apiClient';
import { clearSession, getCurrentUser, getToken, saveSession } from '../services/authSession';

export function ProfilePage() {
  const [user, setUser] = useState(getCurrentUser());
  const [status, setStatus] = useState(getToken() ? 'loading' : 'guest');
  const [feedback, setFeedback] = useState('');

  useEffect(() => {
    let isMounted = true;

    async function loadProfile() {
      const token = getToken();

      if (!token) {
        setStatus('guest');
        return;
      }

      try {
        const response = await apiClient('/auth/me');
        const payload = await response.json();

        if (!response.ok) {
          throw new Error(payload.message || 'No se pudo cargar tu perfil.');
        }

        if (isMounted) {
          const freshUser = payload.data.user;
          saveSession(token, freshUser);
          setUser(freshUser);
          setStatus('success');
        }
      } catch (error) {
        if (isMounted) {
          setFeedback(error.message);
          setStatus('error');
        }
      }
    }

    loadProfile();

    return () => {
      isMounted = false;
    };
  }, []);

  function handleLogout() {
    clearSession();
    window.location.href = '/login';
  }

  if (status === 'guest') {
    return (
      <section className="auth-page">
        <div className="profile-card">
          <p className="section-kicker">Mi perfil</p>
          <h2>Debes iniciar sesión</h2>
          <p className="auth-subtitle">
            Inicia sesión para ver tus datos y postular a una adopción.
          </p>
          <a className="auth-submit-link" href="/login">Iniciar sesión</a>
        </div>
      </section>
    );
  }

  if (status === 'loading') {
    return (
      <section className="auth-page">
        <div className="profile-card">Cargando perfil...</div>
      </section>
    );
  }

  if (status === 'error') {
    return (
      <section className="auth-page">
        <div className="profile-card">
          <p className="auth-feedback auth-feedback-error">{feedback}</p>
          <button className="auth-submit-button" onClick={handleLogout} type="button">
            Volver a iniciar sesión
          </button>
        </div>
      </section>
    );
  }

  return (
    <section className="auth-page">
      <div className="profile-layout">
        <div className="profile-card">
          <p className="section-kicker">Mi perfil</p>
          <h2>Hola, {user.nombre}</h2>
          <p className="auth-subtitle">
            Estos son los datos que se usarán para tus postulaciones de adopción.
          </p>

          <dl className="profile-summary-card profile-summary-card-wide">
            <div>
              <dt>Nombre completo</dt>
              <dd>{user.nombre}</dd>
            </div>
            <div>
              <dt>Correo electrónico</dt>
              <dd>{user.email}</dd>
            </div>
            <div>
              <dt>RUT</dt>
              <dd>{user.rut || 'No indicado'}</dd>
            </div>
            <div>
              <dt>Teléfono</dt>
              <dd>{user.telefono || 'No indicado'}</dd>
            </div>
            <div>
              <dt>Dirección</dt>
              <dd>{user.direccion || 'No indicada'}</dd>
            </div>
            <div>
              <dt>Rol</dt>
              <dd>{user.rol}</dd>
            </div>
          </dl>

          <div className="profile-actions">
            <a className="auth-submit-link" href="/">Ver compañeros</a>
            <button className="profile-logout-button" onClick={handleLogout} type="button">
              Cerrar sesión
            </button>
          </div>
        </div>

        <aside className="auth-side-card">
          <span>Cuenta activa</span>
          <h3>Tu información acompaña cada solicitud</h3>
          <p>
            Al postular, AdoptaLove usará tu usuario autenticado para registrar
            la solicitud con tu identidad.
          </p>
        </aside>
      </div>
    </section>
  );
}
