import { useEffect, useMemo, useState } from 'react';
import { apiClient } from '../services/apiClient';
import { getCurrentUser } from '../services/authSession';
import { getMediaUrl } from '../utils/mediaUrl';
import {
  BIRTH_MONTH_OPTIONS,
  buildEstimatedBirthDate,
  formatPetAge,
  getEstimatedBirthYearOptions,
  validateEstimatedBirthDate
} from '../utils/petDisplay';

const ADMIN_ROLES = new Set(['administrador', 'admin']);
const MAX_PET_NAME_LENGTH = 40;
const MIN_DESCRIPTION_WORDS = 20;
const MAX_IMAGE_SIZE = 3 * 1024 * 1024;
const PUBLICATIONS_PER_PAGE = 5;
const ALLOWED_IMAGE_TYPES = ['image/jpeg', 'image/png', 'image/webp'];
const PET_STATUS_LABELS = {
  adoptada: 'Adoptada',
  disponible: 'Disponible',
  en_revision: 'En revisión',
  inactiva: 'Inactiva',
  rechazada: 'Rechazada'
};

const EMPTY_ADMIN_PET_FORM = {
  publicado_por_nombre: '',
  nombre: '',
  especie: '',
  raza: '',
  fecha_nacimiento_anio: '',
  fecha_nacimiento_mes: '',
  tamano: 'mediano',
  sexo: 'desconocido',
  descripcion: '',
  foto_url: ''
};

const SECTION_COPY = {
  usuarios: {
    title: 'Administración de usuarios',
    text: 'Sección en preparación para la siguiente parte.'
  },
  publicaciones: {
    title: 'Publicaciones',
    text: 'Sección en preparación para revisar publicaciones en detalle.'
  },
  modificaciones: {
    title: 'Modificaciones de publicaciones',
    text: 'Sección en preparación para revisar cambios enviados por fundaciones.'
  }
};

function getAdminSection() {
  const path = window.location.pathname;

  if (path.startsWith('/admin/usuarios')) {
    return 'usuarios';
  }

  if (path.startsWith('/admin/publicaciones')) {
    return 'publicaciones';
  }

  if (path.startsWith('/admin/modificaciones')) {
    return 'modificaciones';
  }

  return 'inicio';
}

function countWords(value = '') {
  return value
    .trim()
    .split(/\s+/)
    .filter(Boolean).length;
}

function formatMoney(value) {
  return new Intl.NumberFormat('es-CL', {
    currency: 'CLP',
    maximumFractionDigits: 0,
    style: 'currency'
  }).format(Number(value || 0));
}

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

function validateImageFile(file) {
  if (!file) {
    return '';
  }

  if (!ALLOWED_IMAGE_TYPES.includes(file.type)) {
    return 'La imagen debe ser JPG, JPEG, PNG o WEBP.';
  }

  if (file.size > MAX_IMAGE_SIZE) {
    return 'La imagen no puede superar los 3 MB.';
  }

  return '';
}

function metricCards(metrics) {
  return [
    {
      label: 'Usuarios registrados',
      value: metrics?.usuariosRegistrados ?? 0
    },
    {
      label: 'Mascotas publicadas',
      value: metrics?.mascotasPublicadas ?? 0
    },
    {
      label: 'Mascotas disponibles',
      value: metrics?.mascotasDisponibles ?? 0
    },
    {
      label: 'Postulaciones total',
      value: metrics?.postulacionesTotal ?? 0
    },
    {
      label: 'Postulaciones pendientes',
      value: metrics?.postulacionesPendientes ?? 0
    },
    {
      label: 'Total donado',
      value: formatMoney(metrics?.totalDonado ?? 0)
    }
  ];
}

export function AdminDashboardPage() {
  const currentUser = getCurrentUser();
  const isAdmin = ADMIN_ROLES.has(currentUser?.rol);
  const section = getAdminSection();
  const [metrics, setMetrics] = useState(null);
  const [loadStatus, setLoadStatus] = useState('idle');
  const [feedback, setFeedback] = useState('');
  const [form, setForm] = useState(EMPTY_ADMIN_PET_FORM);
  const [selectedImage, setSelectedImage] = useState(null);
  const [imagePreview, setImagePreview] = useState('');
  const [submitStatus, setSubmitStatus] = useState('idle');
  const [publications, setPublications] = useState([]);
  const [publicationsStatus, setPublicationsStatus] = useState('idle');
  const [publicationsPage, setPublicationsPage] = useState(1);
  const [publicationsPagination, setPublicationsPagination] = useState({
    limit: PUBLICATIONS_PER_PAGE,
    page: 1,
    total: 0,
    totalPages: 1
  });
  const [publicationSearchDraft, setPublicationSearchDraft] = useState('');
  const [publicationSearch, setPublicationSearch] = useState('');
  const [expandedPublicationId, setExpandedPublicationId] = useState(null);
  const [reviewModal, setReviewModal] = useState(null);
  const [reviewReason, setReviewReason] = useState('');
  const [reviewError, setReviewError] = useState('');
  const [reviewStatus, setReviewStatus] = useState('idle');

  const cards = useMemo(() => metricCards(metrics), [metrics]);
  const nameLength = form.nombre.length;
  const descriptionWordCount = countWords(form.descripcion);
  const isSubmitting = submitStatus === 'submitting';
  const isReviewing = reviewStatus === 'submitting';
  const birthYearOptions = useMemo(() => getEstimatedBirthYearOptions(), []);

  async function loadMetrics() {
    if (!isAdmin) {
      return;
    }

    setLoadStatus('loading');
    setFeedback('');

    try {
      const response = await apiClient('/admin/metrics');
      const payload = await response.json();

      if (!response.ok) {
        throw new Error(payload.message || 'No se pudieron cargar las métricas.');
      }

      setMetrics(payload.data ?? null);
      setLoadStatus('success');
    } catch (error) {
      setLoadStatus('error');
      setFeedback(error.message);
    }
  }

  async function loadPublications(page = publicationsPage, search = publicationSearch) {
    if (!isAdmin) {
      return;
    }

    setPublicationsStatus('loading');
    setFeedback('');

    try {
      const params = new URLSearchParams({
        limit: String(PUBLICATIONS_PER_PAGE),
        page: String(page)
      });

      if (search.trim()) {
        params.set('search', search.trim());
      }

      const response = await apiClient(`/admin/pets/review?${params.toString()}`);
      const payload = await response.json();

      if (!response.ok) {
        throw new Error(payload.message || 'No se pudieron cargar las publicaciones.');
      }

      setPublications(payload.data || []);
      setPublicationsPagination(payload.pagination || {
        limit: PUBLICATIONS_PER_PAGE,
        page,
        total: 0,
        totalPages: 1
      });
      setPublicationsStatus('success');
    } catch (error) {
      setPublicationsStatus('error');
      setFeedback(error.message);
    }
  }

  useEffect(() => {
    if (section === 'inicio') {
      loadMetrics();
    } else if (section === 'publicaciones') {
      loadPublications(publicationsPage, publicationSearch);
    } else {
      setLoadStatus('idle');
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [currentUser?.id, currentUser?.rol, section, publicationsPage, publicationSearch]);

  useEffect(() => {
    if (!selectedImage) {
      setImagePreview('');
      return undefined;
    }

    const previewUrl = URL.createObjectURL(selectedImage);
    setImagePreview(previewUrl);

    return () => {
      URL.revokeObjectURL(previewUrl);
    };
  }, [selectedImage]);

  function updateFormField(field, value) {
    setForm((currentForm) => ({
      ...currentForm,
      [field]: value
    }));
  }

  function resetForm() {
    setForm(EMPTY_ADMIN_PET_FORM);
    setSelectedImage(null);
    setImagePreview('');
    setSubmitStatus('idle');
  }

  function handleImageFile(file) {
    const validationError = validateImageFile(file);

    if (validationError) {
      setSubmitStatus('error');
      setFeedback(validationError);
      setSelectedImage(null);
      return;
    }

    setFeedback('');
    setSelectedImage(file || null);
  }

  function handleDropImage(event) {
    event.preventDefault();
    const file = event.dataTransfer.files?.[0];

    if (file) {
      handleImageFile(file);
    }
  }

  function buildPetFormData() {
    const formData = new FormData();

    formData.append('publicado_por_nombre', form.publicado_por_nombre.trim());
    formData.append('nombre', form.nombre.trim());
    formData.append('especie', form.especie.trim());
    formData.append('raza', form.raza.trim());
    formData.append('fecha_nacimiento_anio', form.fecha_nacimiento_anio);
    formData.append('fecha_nacimiento_mes', form.fecha_nacimiento_mes);
    formData.append(
      'fecha_nacimiento_estimada',
      buildEstimatedBirthDate(form.fecha_nacimiento_anio, form.fecha_nacimiento_mes)
    );
    formData.append('tamano', form.tamano);
    formData.append('sexo', form.sexo);
    formData.append('descripcion', form.descripcion.trim());
    formData.append('foto_url', form.foto_url || '');

    if (selectedImage) {
      formData.append('imagen', selectedImage);
    }

    return formData;
  }

  async function handleSubmit(event) {
    event.preventDefault();
    setFeedback('');

    if (!form.publicado_por_nombre.trim()) {
      setSubmitStatus('error');
      setFeedback('Publicado por / Fundación o responsable es obligatorio.');
      return;
    }

    if (!form.nombre.trim() || !form.especie.trim()) {
      setSubmitStatus('error');
      setFeedback('Nombre y especie son obligatorios.');
      return;
    }

    if (form.nombre.trim().length > MAX_PET_NAME_LENGTH) {
      setSubmitStatus('error');
      setFeedback('El nombre de la mascota no puede superar los 40 caracteres.');
      return;
    }

    const birthDateValidationError = validateEstimatedBirthDate(
      form.fecha_nacimiento_anio,
      form.fecha_nacimiento_mes
    );

    if (birthDateValidationError) {
      setSubmitStatus('error');
      setFeedback(birthDateValidationError);
      return;
    }

    if (descriptionWordCount < MIN_DESCRIPTION_WORDS) {
      setSubmitStatus('error');
      setFeedback('La descripción debe tener al menos 20 palabras.');
      return;
    }

    const imageValidationError = validateImageFile(selectedImage);

    if (imageValidationError) {
      setSubmitStatus('error');
      setFeedback(imageValidationError);
      return;
    }

    setSubmitStatus('submitting');

    try {
      const response = await apiClient('/admin/pets', {
        method: 'POST',
        body: buildPetFormData()
      });
      const payload = await response.json();

      if (!response.ok) {
        throw new Error(payload.message || 'No se pudo publicar la mascota.');
      }

      resetForm();
      setSubmitStatus('success');
      setFeedback(payload.message || 'Mascota publicada correctamente desde el panel administrador.');
    } catch (error) {
      setSubmitStatus('error');
      setFeedback(error.message);
    }
  }

  function handleSearchPublications(event) {
    event.preventDefault();
    setPublicationsPage(1);
    setPublicationSearch(publicationSearchDraft);
  }

  function clearPublicationSearch() {
    setPublicationSearchDraft('');
    setPublicationSearch('');
    setPublicationsPage(1);
  }

  function openReviewModal(publication, action) {
    setReviewModal({ action, publication });
    setReviewReason('');
    setReviewError('');
    setReviewStatus('idle');
  }

  function closeReviewModal() {
    setReviewModal(null);
    setReviewReason('');
    setReviewError('');
    setReviewStatus('idle');
  }

  async function confirmReviewAction() {
    if (!reviewModal?.publication) {
      return;
    }

    const reason = reviewReason.trim();

    if (!reason) {
      setReviewError('Debes ingresar un motivo para cambiar el estado de la publicación.');
      return;
    }

    setReviewStatus('submitting');
    setReviewError('');

    try {
      const endpoint =
        reviewModal.action === 'approve'
          ? `/admin/pets/${reviewModal.publication.id}/approve`
          : `/admin/pets/${reviewModal.publication.id}/reject`;
      const response = await apiClient(endpoint, {
        body: JSON.stringify({ motivo_revision: reason }),
        method: 'PATCH'
      });
      const payload = await response.json();

      if (!response.ok) {
        throw new Error(payload.message || 'No se pudo actualizar la publicación.');
      }

      closeReviewModal();
      await loadPublications(publicationsPage, publicationSearch);
      setFeedback(payload.message || 'Publicación actualizada correctamente.');
    } catch (error) {
      setReviewStatus('error');
      setReviewError(error.message);
    }
  }

  function renderPublishForm() {
    return (
      <form className="admin-form-card" onSubmit={handleSubmit}>
        <div className="admin-section-heading">
          <span>PM</span>
          <div>
            <h3>Publicar mascota como administrador</h3>
            <p>Esta publicación se crea directamente como disponible en el catálogo público.</p>
          </div>
        </div>

        <div className="admin-form-grid">
          <label>
            Publicado por / Fundación o responsable
            <input
              onChange={(event) => updateFormField('publicado_por_nombre', event.target.value)}
              placeholder="Ej: Fundación Patitas del Sur"
              value={form.publicado_por_nombre}
            />
          </label>
          <label>
            Nombre
            <input
              maxLength={MAX_PET_NAME_LENGTH}
              onChange={(event) => updateFormField('nombre', event.target.value)}
              placeholder="Ej: Luna"
              value={form.nombre}
            />
            <span className={nameLength > MAX_PET_NAME_LENGTH ? 'admin-counter admin-counter-error' : 'admin-counter'}>
              {nameLength}/{MAX_PET_NAME_LENGTH}
            </span>
          </label>
          <label>
            Especie
            <input
              onChange={(event) => updateFormField('especie', event.target.value)}
              placeholder="Perro, gato..."
              value={form.especie}
            />
          </label>
          <label>
            Raza
            <input
              onChange={(event) => updateFormField('raza', event.target.value)}
              placeholder="Mestiza, doméstico..."
              value={form.raza}
            />
          </label>
          <fieldset className="admin-age-field">
            <legend>Fecha estimada de nacimiento</legend>
            <div>
              <label>
                Año estimado de nacimiento
                <select
                  onChange={(event) => updateFormField('fecha_nacimiento_anio', event.target.value)}
                  value={form.fecha_nacimiento_anio}
                >
                  <option value="">Selecciona un año</option>
                  {birthYearOptions.map((year) => (
                    <option key={year} value={year}>
                      {year}
                    </option>
                  ))}
                </select>
              </label>
              <label>
                Mes estimado de nacimiento
                <select
                  onChange={(event) => updateFormField('fecha_nacimiento_mes', event.target.value)}
                  value={form.fecha_nacimiento_mes}
                >
                  <option value="">Selecciona un mes</option>
                  {BIRTH_MONTH_OPTIONS.map((month) => (
                    <option key={month.value} value={month.value}>
                      {month.label}
                    </option>
                  ))}
                </select>
              </label>
            </div>
          </fieldset>
          <label>
            Tamaño
            <select
              onChange={(event) => updateFormField('tamano', event.target.value)}
              value={form.tamano}
            >
              <option value="pequeno">Pequeño</option>
              <option value="mediano">Mediano</option>
              <option value="grande">Grande</option>
            </select>
          </label>
          <label>
            Sexo
            <select
              onChange={(event) => updateFormField('sexo', event.target.value)}
              value={form.sexo}
            >
              <option value="desconocido">Desconocido</option>
              <option value="macho">Macho</option>
              <option value="hembra">Hembra</option>
            </select>
          </label>
          <div className="admin-publish-note">
            <strong>Publicación directa</strong>
            <span>El administrador puede crear esta mascota como disponible sin revisión de fundación.</span>
          </div>
        </div>

        <div
          className="admin-image-dropzone"
          onDragOver={(event) => event.preventDefault()}
          onDrop={handleDropImage}
        >
          <div className="admin-image-preview">
            {imagePreview ? (
              <img alt="Vista previa de la mascota" src={getMediaUrl(imagePreview)} />
            ) : (
              <span aria-hidden="true">AL</span>
            )}
          </div>
          <div>
            <strong>Arrastra o selecciona una imagen de tu computadora</strong>
            <p>JPG, JPEG, PNG o WEBP. Tamaño máximo: 3 MB.</p>
            <label className="admin-file-button">
              Seleccionar imagen
              <input
                accept="image/jpeg,image/png,image/webp"
                onChange={(event) => handleImageFile(event.target.files?.[0])}
                type="file"
              />
            </label>
          </div>
        </div>

        <label className="admin-wide-field">
          Descripción
          <textarea
            onChange={(event) => updateFormField('descripcion', event.target.value)}
            placeholder="Describe personalidad, cuidados, historia y tipo de hogar ideal."
            value={form.descripcion}
          />
          <span className={descriptionWordCount < MIN_DESCRIPTION_WORDS ? 'admin-counter admin-counter-error' : 'admin-counter'}>
            {descriptionWordCount}/{MIN_DESCRIPTION_WORDS} palabras mínimo
          </span>
        </label>

        <div className="admin-form-actions">
          <button className="admin-secondary-button" onClick={resetForm} type="button">
            Limpiar
          </button>
          <button className="admin-primary-button" disabled={isSubmitting} type="submit">
            {isSubmitting ? 'Publicando...' : 'Publicar mascota'}
          </button>
        </div>
      </form>
    );
  }

  function renderPublicationsReview() {
    return (
      <section className="admin-form-card admin-publications-panel">
        <div className="admin-section-heading">
          <span>RV</span>
          <div>
            <h3>Revisión de publicaciones</h3>
            <p>Aprueba o rechaza publicaciones enviadas por fundaciones antes de mostrarlas en el catálogo público.</p>
          </div>
        </div>

        <form className="admin-publication-toolbar" onSubmit={handleSearchPublications}>
          <label>
            Buscar publicaciones
            <input
              onChange={(event) => setPublicationSearchDraft(event.target.value)}
              placeholder="Nombre, especie, fundación o estado"
              value={publicationSearchDraft}
            />
          </label>
          <div>
            <button className="admin-secondary-button" type="submit">
              Buscar
            </button>
            <button className="admin-secondary-button" onClick={clearPublicationSearch} type="button">
              Limpiar
            </button>
          </div>
        </form>

        {publicationsStatus === 'loading' && (
          <p className="admin-empty-state">Cargando publicaciones...</p>
        )}

        {publicationsStatus !== 'loading' && publications.length === 0 && (
          <p className="admin-empty-state">No hay publicaciones para revisar con esos filtros.</p>
        )}

        {publicationsStatus !== 'loading' && publications.length > 0 && (
          <div className="admin-publication-list">
            {publications.map((publication) => {
              const isExpanded = expandedPublicationId === publication.id;
              const isPending = publication.estado === 'en_revision';

              return (
                <article className="admin-publication-card" key={publication.id}>
                  <div className="admin-publication-image">
                    {publication.foto_url ? (
                      <img alt={publication.nombre} src={getMediaUrl(publication.foto_url)} />
                    ) : (
                      <span>AL</span>
                    )}
                  </div>
                  <div className="admin-publication-summary">
                    <div className="admin-publication-title-row">
                      <div>
                        <strong>{displayText(publication.nombre)}</strong>
                        <small>
                          {displayText(publication.especie)} · {formatPetAge(publication)}
                        </small>
                      </div>
                      <span className={`admin-publication-status admin-publication-status-${publication.estado}`}>
                        {PET_STATUS_LABELS[publication.estado] || publication.estado}
                      </span>
                    </div>
                    <div className="admin-publication-meta">
                      <span>Fundación: {displayText(publication.publicada_por)}</span>
                      <span>Actualizada: {formatDate(publication.updated_at)}</span>
                    </div>
                    {publication.motivo_revision && (
                      <p className="admin-publication-reason">
                        <strong>Motivo:</strong> {displayText(publication.motivo_revision)}
                      </p>
                    )}
                    {isExpanded && (
                      <div className="admin-publication-detail">
                        <dl>
                          <div>
                            <dt>Raza</dt>
                            <dd>{displayText(publication.raza)}</dd>
                          </div>
                          <div>
                            <dt>Tamaño</dt>
                            <dd>{displayText(publication.tamano)}</dd>
                          </div>
                          <div>
                            <dt>Sexo</dt>
                            <dd>{displayText(publication.sexo)}</dd>
                          </div>
                          <div>
                            <dt>Correo fundación</dt>
                            <dd>{displayText(publication.fundacion_email)}</dd>
                          </div>
                        </dl>
                        <p>{displayText(publication.descripcion, 'Sin descripción registrada.')}</p>
                      </div>
                    )}
                  </div>
                  <div className="admin-publication-actions">
                    <button
                      className="admin-secondary-button"
                      onClick={() => setExpandedPublicationId(isExpanded ? null : publication.id)}
                      type="button"
                    >
                      {isExpanded ? 'Ocultar detalle' : 'Ver detalle'}
                    </button>
                    <button
                      className="admin-primary-button"
                      disabled={!isPending}
                      onClick={() => openReviewModal(publication, 'approve')}
                      type="button"
                    >
                      Aprobar
                    </button>
                    <button
                      className="admin-secondary-button admin-danger-button"
                      disabled={!isPending}
                      onClick={() => openReviewModal(publication, 'reject')}
                      type="button"
                    >
                      Rechazar
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
            disabled={publicationsPagination.page <= 1 || publicationsStatus === 'loading'}
            onClick={() => setPublicationsPage((currentPage) => Math.max(1, currentPage - 1))}
            type="button"
          >
            Anterior
          </button>
          <span>
            Página {publicationsPagination.page} de {publicationsPagination.totalPages}
          </span>
          <button
            className="admin-secondary-button"
            disabled={
              publicationsPagination.page >= publicationsPagination.totalPages ||
              publicationsStatus === 'loading'
            }
            onClick={() => setPublicationsPage((currentPage) => currentPage + 1)}
            type="button"
          >
            Siguiente
          </button>
        </div>
      </section>
    );
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

  if (section === 'publicaciones') {
    const copy = SECTION_COPY.publicaciones;

    return (
      <section className="admin-page">
        <div className="admin-hero">
          <div>
            <p className="section-kicker">Panel administrador</p>
            <h2>{copy.title}</h2>
            <p>Publica mascotas desde administración y revisa las publicaciones enviadas por fundaciones.</p>
          </div>
        </div>

        {feedback && (
          <p className={
            submitStatus === 'error' || publicationsStatus === 'error'
              ? 'admin-feedback admin-feedback-error'
              : 'admin-feedback'
          }>
            {feedback}
          </p>
        )}

        {renderPublishForm()}

        {renderPublicationsReview()}

        {reviewModal && (
          <div className="admin-modal-backdrop">
            <div className="admin-modal">
              <h3>
                {reviewModal.action === 'approve'
                  ? 'Confirmar aprobación'
                  : 'Confirmar rechazo'}
              </h3>
              <p>
                Escribe el motivo que quedará asociado a la publicación de{' '}
                <strong>{displayText(reviewModal.publication.nombre)}</strong>.
              </p>
              <label className="admin-modal-field">
                Motivo de revisión
                <textarea
                  onChange={(event) => setReviewReason(event.target.value)}
                  placeholder="Ej: La publicación cumple con la información requerida."
                  value={reviewReason}
                />
              </label>
              {reviewError && (
                <p className="admin-modal-error">{reviewError}</p>
              )}
              <div className="admin-modal-actions">
                <button
                  className="admin-secondary-button"
                  disabled={isReviewing}
                  onClick={closeReviewModal}
                  type="button"
                >
                  Cancelar
                </button>
                <button
                  className={
                    reviewModal.action === 'approve'
                      ? 'admin-primary-button'
                      : 'admin-secondary-button admin-danger-button'
                  }
                  disabled={isReviewing}
                  onClick={confirmReviewAction}
                  type="button"
                >
                  {isReviewing
                    ? 'Guardando...'
                    : reviewModal.action === 'approve'
                      ? 'Confirmar aprobación'
                      : 'Confirmar rechazo'}
                </button>
              </div>
            </div>
          </div>
        )}
      </section>
    );
  }

  if (section !== 'inicio') {
    const copy = SECTION_COPY[section];

    return (
      <section className="admin-page">
        <div className="admin-hero">
          <div>
            <p className="section-kicker">Panel administrador</p>
            <h2>{copy.title}</h2>
            <p>{copy.text}</p>
          </div>
        </div>
        <article className="admin-placeholder-card">
          <span>AD</span>
          <h3>{copy.title}</h3>
          <p>Sección en preparación para la siguiente parte.</p>
        </article>
      </section>
    );
  }

  return (
    <section className="admin-page">
      <div className="admin-hero">
        <div>
          <p className="section-kicker">Panel administrador</p>
          <h2>Inicio administrador</h2>
          <p>Revisa el estado general de AdoptaLove con métricas actualizadas del sistema.</p>
        </div>
      </div>

      {loadStatus === 'error' && feedback && (
        <p className="admin-feedback admin-feedback-error">
          {feedback}
        </p>
      )}

      <div className="admin-metrics-grid">
        {cards.map((card) => (
          <article className="admin-metric-card" key={card.label}>
            <span>{card.label}</span>
            <strong>{loadStatus === 'loading' ? '...' : card.value}</strong>
          </article>
        ))}
      </div>
    </section>
  );
}
