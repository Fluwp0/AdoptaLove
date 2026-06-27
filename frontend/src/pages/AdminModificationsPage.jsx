import { useEffect, useState } from 'react';
import { apiClient } from '../services/apiClient';
import { useBodyScrollLock } from '../hooks/useBodyScrollLock';
import { getCurrentUser } from '../services/authSession';
import { getMediaUrl } from '../utils/mediaUrl';
import { formatPetAge } from '../utils/petDisplay';

const ADMIN_ROLES = new Set(['administrador', 'admin']);
const MODIFICATIONS_PER_PAGE = 5;
const MODIFICATION_STATUS_LABELS = {
  aprobada: 'Aprobada',
  descartada: 'Descartada',
  en_revision: 'En revisión',
  rechazada: 'Rechazada'
};

function displayText(value, fallback = 'No indicado') {
  const text = typeof value === 'string' ? value.trim() : value;
  return text || fallback;
}

function formatDate(value) {
  if (!value) {
    return 'Fecha no disponible';
  }

  return new Intl.DateTimeFormat('es-CL', {
    day: '2-digit',
    month: 'short',
    year: 'numeric'
  }).format(new Date(value));
}

function getProposed(modification, field, fallback = '') {
  return modification?.datos_propuestos?.[field] ?? fallback;
}

function ModificationImage({ alt, url }) {
  const [hasError, setHasError] = useState(false);

  useEffect(() => {
    setHasError(false);
  }, [url]);

  if (!url || hasError) {
    return <span>AL</span>;
  }

  return (
    <img
      alt={alt}
      onError={() => setHasError(true)}
      src={getMediaUrl(url)}
    />
  );
}

export function AdminModificationsPage() {
  const currentUser = getCurrentUser();
  const isAdmin = ADMIN_ROLES.has(currentUser?.rol);
  const [feedback, setFeedback] = useState('');
  const [modifications, setModifications] = useState([]);
  const [status, setStatus] = useState('idle');
  const [page, setPage] = useState(1);
  const [pagination, setPagination] = useState({
    limit: MODIFICATIONS_PER_PAGE,
    page: 1,
    total: 0,
    totalPages: 1
  });
  const [searchDraft, setSearchDraft] = useState('');
  const [search, setSearch] = useState('');
  const [expandedId, setExpandedId] = useState(null);
  const [actionModal, setActionModal] = useState(null);
  const [reason, setReason] = useState('');
  const [reasonError, setReasonError] = useState('');
  const [actionStatus, setActionStatus] = useState('idle');

  const isActing = actionStatus === 'submitting';

  useBodyScrollLock(Boolean(actionModal));

  async function loadModifications(nextPage = page, nextSearch = search) {
    if (!isAdmin) {
      return;
    }

    setStatus('loading');
    setFeedback('');

    try {
      const params = new URLSearchParams({
        limit: String(MODIFICATIONS_PER_PAGE),
        page: String(nextPage)
      });

      if (nextSearch.trim()) {
        params.set('search', nextSearch.trim());
      }

      const response = await apiClient(`/admin/pet-modifications?${params.toString()}`);
      const payload = await response.json();

      if (!response.ok) {
        throw new Error(payload.message || 'No se pudieron cargar las modificaciones.');
      }

      setModifications(payload.data || []);
      setPagination(payload.pagination || {
        limit: MODIFICATIONS_PER_PAGE,
        page: nextPage,
        total: 0,
        totalPages: 1
      });
      setStatus('success');
    } catch (error) {
      setStatus('error');
      setFeedback(error.message);
    }
  }

  useEffect(() => {
    loadModifications(page, search);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [currentUser?.id, currentUser?.rol, page, search]);

  function handleSearch(event) {
    event.preventDefault();
    setPage(1);
    setSearch(searchDraft);
  }

  function clearSearch() {
    setSearchDraft('');
    setSearch('');
    setPage(1);
  }

  function openActionModal(modification, action) {
    setActionModal({ action, modification });
    setReason('');
    setReasonError('');
    setActionStatus('idle');
  }

  function closeActionModal() {
    setActionModal(null);
    setReason('');
    setReasonError('');
    setActionStatus('idle');
  }

  async function confirmAction() {
    if (!actionModal?.modification) {
      return;
    }

    const isDiscard = actionModal.action === 'discard';
    const trimmedReason = reason.trim();

    if (!isDiscard && !trimmedReason) {
      setReasonError('Debes ingresar un motivo para cambiar el estado de la modificación.');
      return;
    }

    setActionStatus('submitting');
    setReasonError('');

    try {
      const endpointByAction = {
        approve: `/admin/pet-modifications/${actionModal.modification.id}/approve`,
        reject: `/admin/pet-modifications/${actionModal.modification.id}/reject`,
        discard: `/admin/pet-modifications/${actionModal.modification.id}`
      };
      const response = await apiClient(endpointByAction[actionModal.action], {
        body: isDiscard ? undefined : JSON.stringify({ motivo_revision: trimmedReason }),
        method: isDiscard ? 'DELETE' : 'PATCH'
      });
      const payload = await response.json();

      if (!response.ok) {
        throw new Error(payload.message || 'No se pudo actualizar la modificación.');
      }

      closeActionModal();
      await loadModifications(page, search);
      setFeedback(payload.message || 'Modificación actualizada correctamente.');
    } catch (error) {
      setActionStatus('error');
      setReasonError(error.message);
    }
  }

  if (!currentUser?.id) {
    return (
      <section className="admin-page">
        <div className="admin-access-card">
          <span>AD</span>
          <h2>Inicia sesión para acceder al panel administrador</h2>
          <p>Esta sección está disponible solo para administradores de AdoptaLove.</p>
          <a className="admin-primary-link" href="/login">Iniciar sesión</a>
        </div>
      </section>
    );
  }

  if (!isAdmin) {
    return (
      <section className="admin-page">
        <div className="admin-access-card">
          <span>AD</span>
          <h2>Panel no disponible</h2>
          <p>Solo usuarios con rol administrador pueden acceder a esta sección.</p>
          <a className="admin-primary-link" href="/">Volver al inicio</a>
        </div>
      </section>
    );
  }

  return (
    <section className="admin-page">
      <div className="admin-hero">
        <div>
          <p className="section-kicker">Panel administrador</p>
          <h2>Modificaciones</h2>
          <p>Revisa cambios propuestos por fundaciones sin alterar la publicación pública hasta aprobarlos.</p>
        </div>
      </div>

      {feedback && (
        <p className={status === 'error' ? 'admin-feedback admin-feedback-error' : 'admin-feedback'}>
          {feedback}
        </p>
      )}

      <section className="admin-form-card admin-publications-panel">
        <div className="admin-section-heading">
          <span>MD</span>
          <div>
            <h3>Solicitudes de modificación</h3>
            <p>Aprueba o rechaza cambios enviados por fundaciones. La publicación original se mantiene hasta aprobar.</p>
          </div>
        </div>

        <form className="admin-publication-toolbar" onSubmit={handleSearch}>
          <label>
            Buscar modificaciones
            <input
              onChange={(event) => setSearchDraft(event.target.value)}
              placeholder="Mascota, fundación, especie o estado"
              value={searchDraft}
            />
          </label>
          <div>
            <button className="admin-secondary-button" type="submit">
              Buscar
            </button>
            <button className="admin-secondary-button" onClick={clearSearch} type="button">
              Limpiar
            </button>
          </div>
        </form>

        {status === 'loading' && (
          <p className="admin-empty-state">Cargando modificaciones...</p>
        )}

        {status !== 'loading' && modifications.length === 0 && (
          <p className="admin-empty-state">No hay solicitudes de modificación con esos filtros.</p>
        )}

        {status !== 'loading' && modifications.length > 0 && (
          <div className="admin-publication-list">
            {modifications.map((modification) => {
              const proposedName = getProposed(modification, 'nombre', modification.mascota_nombre_actual);
              const proposedSpecies = getProposed(modification, 'especie', modification.mascota_especie_actual);
              const isExpanded = expandedId === modification.id;
              const isPending = modification.estado === 'en_revision';

              return (
                <article className="admin-publication-card" key={modification.id}>
                  <div className="admin-publication-image">
                    <ModificationImage
                      alt={displayText(proposedName)}
                      url={getProposed(modification, 'foto_url', modification.mascota_foto_url_actual)}
                    />
                  </div>
                  <div className="admin-publication-summary">
                    <div className="admin-publication-title-row">
                      <div>
                        <strong>{displayText(proposedName)}</strong>
                        <small>
                          {displayText(proposedSpecies)} · {formatDate(modification.updated_at)}
                        </small>
                      </div>
                      <span className={`admin-publication-status admin-publication-status-${modification.estado}`}>
                        {MODIFICATION_STATUS_LABELS[modification.estado] || modification.estado}
                      </span>
                    </div>
                    <div className="admin-publication-meta">
                      <span>Mascota original: {displayText(modification.mascota_nombre_actual)}</span>
                      <span>Fundación: {displayText(modification.fundacion_nombre)}</span>
                      <span>Correo: {displayText(modification.fundacion_email)}</span>
                    </div>
                    {modification.motivo_revision && (
                      <p className="admin-publication-reason">
                        <strong>Motivo:</strong> {displayText(modification.motivo_revision)}
                      </p>
                    )}
                    {isExpanded && (
                      <div className="admin-publication-detail">
                        <dl>
                          <div>
                            <dt>Nombre actual</dt>
                            <dd>{displayText(modification.mascota_nombre_actual)}</dd>
                          </div>
                          <div>
                            <dt>Nombre propuesto</dt>
                            <dd>{displayText(proposedName)}</dd>
                          </div>
                          <div>
                            <dt>Raza actual</dt>
                            <dd>{displayText(modification.mascota_raza_actual)}</dd>
                          </div>
                          <div>
                            <dt>Raza propuesta</dt>
                            <dd>{displayText(getProposed(modification, 'raza', modification.mascota_raza_actual))}</dd>
                          </div>
                          <div>
                            <dt>Edad actual</dt>
                            <dd>{formatPetAge({
                              fecha_nacimiento_estimada: modification.mascota_fecha_nacimiento_estimada_actual,
                              edad_anios: modification.mascota_edad_anios_actual,
                              edad_meses: modification.mascota_edad_meses_actual
                            })}</dd>
                          </div>
                          <div>
                            <dt>Edad propuesta</dt>
                            <dd>{formatPetAge({
                              fecha_nacimiento_estimada: getProposed(
                                modification,
                                'fecha_nacimiento_estimada',
                                modification.mascota_fecha_nacimiento_estimada_actual
                              ),
                              edad_anios: getProposed(modification, 'edad_anios', modification.mascota_edad_anios_actual),
                              edad_meses: getProposed(modification, 'edad_meses', modification.mascota_edad_meses_actual)
                            })}</dd>
                          </div>
                          <div>
                            <dt>Tamaño actual</dt>
                            <dd>{displayText(modification.mascota_tamano_actual)}</dd>
                          </div>
                          <div>
                            <dt>Tamaño propuesto</dt>
                            <dd>{displayText(getProposed(modification, 'tamano', modification.mascota_tamano_actual))}</dd>
                          </div>
                          <div>
                            <dt>Sexo actual</dt>
                            <dd>{displayText(modification.mascota_sexo_actual)}</dd>
                          </div>
                          <div>
                            <dt>Sexo propuesto</dt>
                            <dd>{displayText(getProposed(modification, 'sexo', modification.mascota_sexo_actual))}</dd>
                          </div>
                          <div>
                            <dt>Estado anterior</dt>
                            <dd>{displayText(modification.estado_mascota_anterior, 'Disponible')}</dd>
                          </div>
                          <div>
                            <dt>Estado actual</dt>
                            <dd>{displayText(modification.mascota_estado_actual)}</dd>
                          </div>
                        </dl>
                        <div>
                          <strong>Imágenes</strong>
                          <div className="admin-modification-images">
                            <div>
                              <span>Imagen actual</span>
                              <div className="admin-publication-image">
                                <ModificationImage
                                  alt={`Imagen actual de ${displayText(modification.mascota_nombre_actual)}`}
                                  url={modification.mascota_foto_url_actual}
                                />
                              </div>
                            </div>
                            <div>
                              <span>Imagen propuesta</span>
                              <div className="admin-publication-image">
                                <ModificationImage
                                  alt={`Imagen propuesta de ${displayText(proposedName)}`}
                                  url={getProposed(modification, 'foto_url', modification.mascota_foto_url_actual)}
                                />
                              </div>
                            </div>
                          </div>
                        </div>
                        <p>
                          <strong>Descripción actual:</strong>{' '}
                          {displayText(modification.mascota_descripcion_actual, 'Sin descripción registrada.')}
                        </p>
                        <p>
                          <strong>Descripción propuesta:</strong>{' '}
                          {displayText(getProposed(modification, 'descripcion', modification.mascota_descripcion_actual), 'Sin descripción registrada.')}
                        </p>
                      </div>
                    )}
                  </div>
                  <div className="admin-publication-actions">
                    <button
                      className="admin-secondary-button"
                      onClick={() => setExpandedId(isExpanded ? null : modification.id)}
                      type="button"
                    >
                      {isExpanded ? 'Ocultar detalle' : 'Ver detalle'}
                    </button>
                    {isPending && (
                      <>
                        <button
                          className="admin-primary-button"
                          onClick={() => openActionModal(modification, 'approve')}
                          type="button"
                        >
                          Aprobar
                        </button>
                        <button
                          className="admin-secondary-button admin-danger-button"
                          onClick={() => openActionModal(modification, 'reject')}
                          type="button"
                        >
                          Rechazar
                        </button>
                      </>
                    )}
                    <button
                      className="admin-secondary-button"
                      onClick={() => openActionModal(modification, 'discard')}
                      type="button"
                    >
                      Descartar
                    </button>
                  </div>
                </article>
              );
            })}
          </div>
        )}

        <div className="admin-pagination">
          <button
            className="admin-secondary-button"
            disabled={pagination.page <= 1 || status === 'loading'}
            onClick={() => setPage((currentPage) => Math.max(1, currentPage - 1))}
            type="button"
          >
            Anterior
          </button>
          <span>
            Página {pagination.page} de {pagination.totalPages}
          </span>
          <button
            className="admin-secondary-button"
            disabled={pagination.page >= pagination.totalPages || status === 'loading'}
            onClick={() => setPage((currentPage) => currentPage + 1)}
            type="button"
          >
            Siguiente
          </button>
        </div>
      </section>

      {actionModal && (
        <div className="admin-modal-backdrop">
          <div className="admin-modal">
            <h3>
              {actionModal.action === 'approve'
                ? 'Confirmar aprobación de modificación'
                : actionModal.action === 'reject'
                  ? 'Confirmar rechazo de modificación'
                  : 'Descartar solicitud de modificación'}
            </h3>
            <p>
              {actionModal.action === 'discard'
                ? 'Esta solicitud dejará de aparecer como pendiente para revisión.'
                : 'Escribe el motivo que quedará asociado a la solicitud de modificación.'}
            </p>
            {actionModal.action !== 'discard' && (
              <label className="admin-modal-field">
                Motivo de revisión
                <textarea
                  onChange={(event) => setReason(event.target.value)}
                  placeholder="Ej: Los cambios cumplen con la información requerida."
                  value={reason}
                />
              </label>
            )}
            {reasonError && <p className="admin-modal-error">{reasonError}</p>}
            <div className="admin-modal-actions">
              <button className="admin-secondary-button" disabled={isActing} onClick={closeActionModal} type="button">
                Cancelar
              </button>
              <button
                className={actionModal.action === 'approve' ? 'admin-primary-button' : 'admin-secondary-button admin-danger-button'}
                disabled={isActing}
                onClick={confirmAction}
                type="button"
              >
                {isActing
                  ? 'Guardando...'
                  : actionModal.action === 'approve'
                    ? 'Confirmar aprobación'
                    : actionModal.action === 'reject'
                      ? 'Confirmar rechazo'
                      : 'Descartar solicitud'}
              </button>
            </div>
          </div>
        </div>
      )}
    </section>
  );
}
