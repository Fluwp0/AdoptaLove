import { useEffect, useState } from 'react';
import { apiClient } from '../services/apiClient';
import { useBodyScrollLock } from '../hooks/useBodyScrollLock';
import { clearSession, getCurrentUser, getToken, saveSession } from '../services/authSession';
import { displayText } from '../utils/displayText';
import { getMediaUrl } from '../utils/mediaUrl';
import { formatPetAge } from '../utils/petDisplay';

const ACTIVE_ADOPTION_STATUSES = new Set(['pendiente', 'en_revision']);

function formatApplicationStatus(status = '') {
  const labels = {
    aprobada: 'Aprobada',
    cancelada: 'Cancelada',
    en_revision: 'En revisión de administrador',
    pendiente: 'En revisión de fundación',
    rechazada: 'Rechazada'
  };

  return labels[status] || displayText(status).replace(/_/g, ' ');
}

function formatPetSize(size = '') {
  const labels = {
    grande: 'Grande',
    mediano: 'Mediano',
    pequeno: 'Pequeño'
  };

  return labels[size] || displayText(size, 'Tamaño no indicado') || 'Tamaño no indicado';
}

function formatApplicationDate(value) {
  if (!value) {
    return 'Fecha no disponible';
  }

  return new Intl.DateTimeFormat('es-CL', {
    dateStyle: 'medium',
    timeStyle: 'short'
  }).format(new Date(value));
}

function PetProcessImage({ name, url }) {
  const [hasError, setHasError] = useState(false);

  if (!url || hasError) {
    return (
      <div className="profile-adoption-placeholder" aria-hidden="true">
        💗
      </div>
    );
  }

  return (
    <img
      alt={`Foto de ${name}`}
      className="profile-adoption-image"
      onError={() => setHasError(true)}
      src={getMediaUrl(url)}
    />
  );
}

export function ProfilePage() {
  const [user, setUser] = useState(getCurrentUser());
  const [status, setStatus] = useState(getToken() ? 'loading' : 'guest');
  const [feedback, setFeedback] = useState('');
  const [adoptionRequests, setAdoptionRequests] = useState([]);
  const [adoptionStatus, setAdoptionStatus] = useState('idle');
  const [adoptionFeedback, setAdoptionFeedback] = useState('');
  const [cancelTarget, setCancelTarget] = useState(null);
  const [cancelStatus, setCancelStatus] = useState('idle');

  const latestAdoptionRequest = adoptionRequests[0] || null;
  const hasActiveAdoptionRequest = ACTIVE_ADOPTION_STATUSES.has(latestAdoptionRequest?.estado);
  const isAdopter = user?.rol === 'adoptante';

  useBodyScrollLock(Boolean(cancelTarget));

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

          if (freshUser.rol === 'adoptante') {
            setAdoptionStatus('loading');
            try {
              const adoptionResponse = await apiClient('/solicitudes-adopcion/me');
              const adoptionPayload = await adoptionResponse.json();

              if (!adoptionResponse.ok) {
                throw new Error(adoptionPayload.message || 'No se pudieron cargar tus postulaciones.');
              }

              if (isMounted) {
                setAdoptionRequests(adoptionPayload.data ?? []);
                setAdoptionStatus('success');
              }
            } catch (adoptionError) {
              if (isMounted) {
                setAdoptionFeedback(adoptionError.message);
                setAdoptionStatus('error');
              }
            }
          }
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

  async function refreshAdoptionRequests() {
    setAdoptionStatus('loading');
    setAdoptionFeedback('');

    try {
      const response = await apiClient('/solicitudes-adopcion/me');
      const payload = await response.json();

      if (!response.ok) {
        throw new Error(payload.message || 'No se pudieron cargar tus postulaciones.');
      }

      setAdoptionRequests(payload.data ?? []);
      setAdoptionStatus('success');
    } catch (error) {
      setAdoptionFeedback(error.message);
      setAdoptionStatus('error');
    }
  }

  async function confirmCancelApplication() {
    if (!cancelTarget?.id) {
      return;
    }

    setCancelStatus('submitting');
    setAdoptionFeedback('');

    try {
      const response = await apiClient(`/solicitudes-adopcion/${cancelTarget.id}/cancelar`, {
        method: 'PATCH'
      });
      const payload = await response.json();

      if (!response.ok) {
        throw new Error(payload.message || 'No se pudo cancelar la postulación.');
      }

      setAdoptionRequests((currentRequests) =>
        currentRequests.map((request) =>
          request.id === payload.data.id ? payload.data : request
        )
      );
      setAdoptionFeedback('Tu postulación fue cancelada correctamente.');
      setCancelTarget(null);
    } catch (error) {
      setAdoptionFeedback(error.message);
    } finally {
      setCancelStatus('idle');
    }
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
          <p className="auth-feedback auth-feedback-error">{displayText(feedback)}</p>
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
          <h2>Hola, {displayText(user.nombre)}</h2>
          <p className="auth-subtitle">
            Estos son los datos que se usarán para tus postulaciones de adopción.
          </p>

          <dl className="profile-summary-card profile-summary-card-wide">
            <div>
              <dt>Nombre completo</dt>
              <dd>{displayText(user.nombre)}</dd>
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
              <dd>{displayText(user.direccion, 'No indicada') || 'No indicada'}</dd>
            </div>
            <div>
              <dt>Rol</dt>
              <dd>{user.rol}</dd>
            </div>
          </dl>

          {isAdopter && (
            <section className="profile-adoption-card" aria-label="Mi proceso de adopción">
              <div className="profile-adoption-heading">
                <div>
                  <p className="section-kicker">Mi proceso de adopción</p>
                  <h3>Estado de mi postulación</h3>
                </div>
                <button
                  className="profile-adoption-refresh"
                  onClick={refreshAdoptionRequests}
                  type="button"
                >
                  Actualizar
                </button>
              </div>

              {adoptionStatus === 'loading' && (
                <p className="profile-adoption-empty">Cargando tus postulaciones...</p>
              )}

              {adoptionStatus === 'error' && (
                <p className="profile-adoption-feedback profile-adoption-feedback-error">
                  {displayText(adoptionFeedback)}
                </p>
              )}

              {adoptionStatus !== 'loading' && !latestAdoptionRequest && (
                <p className="profile-adoption-empty">Aún no tienes postulaciones activas.</p>
              )}

              {latestAdoptionRequest && (
                <article className="profile-adoption-process">
                  <PetProcessImage
                    name={displayText(latestAdoptionRequest.mascota_nombre)}
                    url={latestAdoptionRequest.mascota_foto_url}
                  />
                  <div className="profile-adoption-detail">
                    <div className="profile-adoption-title-row">
                      <div>
                        <h4>{displayText(latestAdoptionRequest.mascota_nombre)}</h4>
                        <p>
                          {displayText(latestAdoptionRequest.mascota_especie)}
                          {latestAdoptionRequest.mascota_raza
                            ? ` · ${displayText(latestAdoptionRequest.mascota_raza)}`
                            : ''}
                        </p>
                      </div>
                      <span className={`profile-adoption-status profile-adoption-status-${latestAdoptionRequest.estado}`}>
                        {formatApplicationStatus(latestAdoptionRequest.estado)}
                      </span>
                    </div>

                    <dl className="profile-adoption-meta">
                      <div>
                        <dt>Edad</dt>
                        <dd>
                          {formatPetAge({
                            fecha_nacimiento_estimada:
                              latestAdoptionRequest.mascota_fecha_nacimiento_estimada,
                            edad_anios: latestAdoptionRequest.mascota_edad_anios,
                            edad_meses: latestAdoptionRequest.mascota_edad_meses
                          })}
                        </dd>
                      </div>
                      <div>
                        <dt>Tamaño</dt>
                        <dd>{formatPetSize(latestAdoptionRequest.mascota_tamano)}</dd>
                      </div>
                      <div>
                        <dt>Fecha de postulación</dt>
                        <dd>{formatApplicationDate(latestAdoptionRequest.fecha_creacion)}</dd>
                      </div>
                    </dl>

                    {latestAdoptionRequest.motivo_estado && (
                      <p className="profile-adoption-reason">
                        <strong>Motivo:</strong> {displayText(latestAdoptionRequest.motivo_estado)}
                      </p>
                    )}

                    {hasActiveAdoptionRequest && (
                      <button
                        className="profile-cancel-application-button"
                        onClick={() => setCancelTarget(latestAdoptionRequest)}
                        type="button"
                      >
                        Cancelar postulación
                      </button>
                    )}
                  </div>
                </article>
              )}

              {adoptionFeedback && adoptionStatus !== 'error' && (
                <p className="profile-adoption-feedback">{displayText(adoptionFeedback)}</p>
              )}
            </section>
          )}

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

      {cancelTarget && (
        <div className="profile-modal-backdrop" role="presentation">
          <section className="profile-cancel-modal" role="dialog" aria-modal="true">
            <h3>Confirmar cancelación de postulación</h3>
            <p>
              ¿Estás seguro de que deseas cancelar esta postulación? Esta acción dejará
              la solicitud como rechazada.
            </p>
            <div className="profile-cancel-modal-actions">
              <button
                className="profile-modal-secondary"
                disabled={cancelStatus === 'submitting'}
                onClick={() => setCancelTarget(null)}
                type="button"
              >
                Mantener postulación vigente
              </button>
              <button
                className="profile-modal-primary"
                disabled={cancelStatus === 'submitting'}
                onClick={confirmCancelApplication}
                type="button"
              >
                {cancelStatus === 'submitting' ? 'Cancelando...' : 'Confirmar cancelación'}
              </button>
            </div>
          </section>
        </div>
      )}
    </section>
  );
}
