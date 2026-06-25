import { useEffect, useMemo, useState } from 'react';
import { apiClient } from '../services/apiClient';
import { getCurrentUser } from '../services/authSession';
import { displayText } from '../utils/displayText';
import { getMediaUrl } from '../utils/mediaUrl';
import {
  BIRTH_MONTH_OPTIONS,
  buildEstimatedBirthDate,
  formatPetAge,
  getEstimatedBirthDateParts,
  getEstimatedBirthYearOptions,
  validateEstimatedBirthDate
} from '../utils/petDisplay';

const EMPTY_FORM = {
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

const FOUNDATION_ROLES = new Set(['fundacion', 'administrador', 'admin']);
const MAX_PET_NAME_LENGTH = 40;
const MIN_DESCRIPTION_WORDS = 20;
const MAX_IMAGE_SIZE = 3 * 1024 * 1024;
const ALLOWED_IMAGE_TYPES = ['image/jpeg', 'image/png', 'image/webp'];
const ITEMS_PER_PAGE = 5;
const PET_REVIEW_MESSAGE =
  'Tus cambios fueron enviados correctamente. Un administrador de AdoptaLove revisará la publicación antes de que sea visible para los adoptantes.';

const STATUS_LABELS = {
  adoptada: 'Adoptada',
  aprobada: 'Aprobada',
  disponible: 'Disponible',
  en_revision: 'En revisión',
  grande: 'Grande',
  hembra: 'Hembra',
  inactiva: 'Inactiva',
  macho: 'Macho',
  mediano: 'Mediano',
  pendiente: 'Pendiente',
  pequeno: 'Pequeño',
  rechazada: 'Rechazada'
};

const REQUEST_ACTIONS = [
  { value: 'en_revision', label: 'En revisión' },
  { value: 'aprobada', label: 'Aprobar' },
  { value: 'rechazada', label: 'Rechazar' }
];

function formatStatus(status = '') {
  if (STATUS_LABELS[status]) {
    return STATUS_LABELS[status];
  }

  return displayText(status)
    .replace(/_/g, ' ')
    .replace(/\b\w/g, (letter) => letter.toUpperCase());
}

function formatPetStatus(status = '') {
  if (status === 'en_revision') {
    return 'En revisión por administrador';
  }

  return formatStatus(status);
}

function formatDate(value) {
  if (!value) {
    return 'Fecha no disponible';
  }

  return new Intl.DateTimeFormat('es-CL', {
    dateStyle: 'medium',
    timeStyle: 'short'
  }).format(new Date(value));
}

function formatPhone(value) {
  const phone = displayText(value, '').trim();

  if (!phone) {
    return 'No indicado';
  }

  return phone.replace(/^\+56\s*56\s*/u, '+56 ').trim();
}

function mapPetToForm(pet) {
  const estimatedBirthDate = getEstimatedBirthDateParts(pet);

  return {
    nombre: pet.nombre || '',
    especie: pet.especie || '',
    raza: pet.raza || '',
    fecha_nacimiento_anio: estimatedBirthDate.year,
    fecha_nacimiento_mes: estimatedBirthDate.month,
    tamano: pet.tamano || 'mediano',
    sexo: pet.sexo || 'desconocido',
    descripcion: pet.descripcion || '',
    foto_url: pet.foto_url || ''
  };
}

function countWords(value = '') {
  return value
    .trim()
    .split(/\s+/)
    .filter(Boolean).length;
}

function getPageItems(items, page) {
  const start = (page - 1) * ITEMS_PER_PAGE;
  return items.slice(start, start + ITEMS_PER_PAGE);
}

function getTotalPages(items) {
  return Math.max(1, Math.ceil(items.length / ITEMS_PER_PAGE));
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

function PetImage({ name, url }) {
  const [hasError, setHasError] = useState(false);

  if (!url || hasError) {
    return (
      <div className="foundation-pet-placeholder">
        <span aria-hidden="true">AL</span>
      </div>
    );
  }

  return (
    <img
      alt={`Foto de ${name}`}
      className="foundation-pet-image"
      onError={() => setHasError(true)}
      src={getMediaUrl(url)}
    />
  );
}

function PaginationControls({ page, totalPages, onChange }) {
  return (
    <div className="foundation-pagination">
      <button
        disabled={page <= 1}
        onClick={() => onChange(page - 1)}
        type="button"
      >
        Anterior
      </button>
      <span>Página {page} de {totalPages}</span>
      <button
        disabled={page >= totalPages}
        onClick={() => onChange(page + 1)}
        type="button"
      >
        Siguiente
      </button>
    </div>
  );
}

export function FoundationDashboardPage() {
  const currentUser = getCurrentUser();
  const canAccessPanel = FOUNDATION_ROLES.has(currentUser?.rol);
  const [summary, setSummary] = useState(null);
  const [pets, setPets] = useState([]);
  const [requests, setRequests] = useState([]);
  const [loadStatus, setLoadStatus] = useState('idle');
  const [feedback, setFeedback] = useState('');
  const [isFormOpen, setIsFormOpen] = useState(false);
  const [editingPet, setEditingPet] = useState(null);
  const [form, setForm] = useState(EMPTY_FORM);
  const [selectedImage, setSelectedImage] = useState(null);
  const [imagePreview, setImagePreview] = useState('');
  const [submitStatus, setSubmitStatus] = useState('idle');
  const [petPage, setPetPage] = useState(1);
  const [requestPage, setRequestPage] = useState(1);
  const [expandedRequests, setExpandedRequests] = useState(() => new Set());
  const [petToDelete, setPetToDelete] = useState(null);
  const [requestAction, setRequestAction] = useState(null);
  const [requestReason, setRequestReason] = useState('');
  const [requestReasonError, setRequestReasonError] = useState('');
  const [requestUpdatingId, setRequestUpdatingId] = useState(null);
  const [deleteStatus, setDeleteStatus] = useState('idle');

  const isSubmitting = submitStatus === 'submitting';
  const isDeleting = deleteStatus === 'deleting';
  const nameLength = form.nombre.length;
  const descriptionWordCount = countWords(form.descripcion);
  const petTotalPages = getTotalPages(pets);
  const requestTotalPages = getTotalPages(requests);
  const paginatedPets = getPageItems(pets, petPage);
  const paginatedRequests = getPageItems(requests, requestPage);
  const birthYearOptions = useMemo(() => getEstimatedBirthYearOptions(), []);

  const summaryCards = useMemo(
    () => [
      {
        label: 'Mascotas publicadas',
        value: summary?.mascotas_publicadas ?? pets.length,
        icon: 'M'
      },
      {
        label: 'Mascotas disponibles',
        value: summary?.mascotas_disponibles ?? pets.filter((pet) => pet.estado === 'disponible').length,
        icon: 'D'
      },
      {
        label: 'Postulaciones recibidas',
        value: summary?.postulaciones_recibidas ?? requests.length,
        icon: 'P'
      },
      {
        label: 'Postulaciones pendientes',
        value: summary?.postulaciones_pendientes ?? requests.filter((request) => request.estado === 'pendiente').length,
        icon: 'R'
      }
    ],
    [pets, requests, summary]
  );

  async function loadDashboard() {
    if (!currentUser?.id || !canAccessPanel) {
      return;
    }

    setLoadStatus('loading');
    setFeedback('');

    try {
      const response = await apiClient('/foundation/dashboard');
      const payload = await response.json();

      if (!response.ok) {
        throw new Error(payload.message || 'No se pudo cargar el panel.');
      }

      setSummary(payload.data?.resumen ?? null);
      setPets(payload.data?.mascotas ?? []);
      setRequests(payload.data?.postulaciones ?? []);
      setLoadStatus('success');
    } catch (error) {
      setLoadStatus('error');
      setFeedback(error.message);
    }
  }

  useEffect(() => {
    loadDashboard();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [currentUser?.id, currentUser?.rol]);

  useEffect(() => {
    setPetPage((page) => Math.min(page, getTotalPages(pets)));
  }, [pets]);

  useEffect(() => {
    setRequestPage((page) => Math.min(page, getTotalPages(requests)));
  }, [requests]);

  useEffect(() => {
    if (!selectedImage) {
      setImagePreview(editingPet?.foto_url || '');
      return undefined;
    }

    const previewUrl = URL.createObjectURL(selectedImage);
    setImagePreview(previewUrl);

    return () => {
      URL.revokeObjectURL(previewUrl);
    };
  }, [editingPet?.foto_url, selectedImage]);

  function openCreateForm() {
    setEditingPet(null);
    setForm(EMPTY_FORM);
    setSelectedImage(null);
    setImagePreview('');
    setIsFormOpen(true);
    setFeedback('');
  }

  function openEditForm(pet) {
    setEditingPet(pet);
    setForm(mapPetToForm(pet));
    setSelectedImage(null);
    setImagePreview(pet.foto_url || '');
    setIsFormOpen(true);
    setFeedback('');
  }

  function closeForm() {
    setEditingPet(null);
    setForm(EMPTY_FORM);
    setSelectedImage(null);
    setImagePreview('');
    setIsFormOpen(false);
    setSubmitStatus('idle');
  }

  function updateFormField(field, value) {
    setForm((currentForm) => ({
      ...currentForm,
      [field]: value
    }));
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
    setSelectedImage(file);
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

  async function handlePetSubmit(event) {
    event.preventDefault();
    setFeedback('');

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
      setFeedback('La descripción debe tener al menos 20 palabras para que los adoptantes conozcan mejor a la mascota.');
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
      const response = await apiClient(
        editingPet ? `/foundation/pets/${editingPet.id}` : '/foundation/pets',
        {
          method: editingPet ? 'PUT' : 'POST',
          body: buildPetFormData()
        }
      );
      const payload = await response.json();

      if (!response.ok) {
        throw new Error(payload.message || 'No se pudo guardar la mascota.');
      }

      closeForm();
      setSubmitStatus('success');
      setFeedback(payload.message || PET_REVIEW_MESSAGE);
      await loadDashboard();
    } catch (error) {
      setSubmitStatus('error');
      setFeedback(error.message);
    }
  }

  function toggleRequestDetails(requestId) {
    setExpandedRequests((current) => {
      const next = new Set(current);

      if (next.has(requestId)) {
        next.delete(requestId);
      } else {
        next.add(requestId);
      }

      return next;
    });
  }

  function openRequestAction(request, nextStatus) {
    if (nextStatus === 'en_revision') {
      changeRequestStatus(request, nextStatus);
      return;
    }

    setRequestAction({ request, nextStatus });
    setRequestReason('');
    setRequestReasonError('');
  }

  function closeRequestAction() {
    setRequestAction(null);
    setRequestReason('');
    setRequestReasonError('');
  }

  async function changeRequestStatus(request, estado, motivoEstado = null) {
    setFeedback('');
    setRequestUpdatingId(request.id);

    try {
      const response = await apiClient(`/foundation/adoption-requests/${request.id}/status`, {
        method: 'PATCH',
        body: JSON.stringify({ estado, motivo_estado: motivoEstado })
      });
      const payload = await response.json();

      if (!response.ok) {
        throw new Error(payload.message || 'No se pudo actualizar la postulación.');
      }

      setFeedback(`Postulación de ${displayText(request.postulante_nombre)} marcada como ${formatStatus(estado)}.`);
      closeRequestAction();
      await loadDashboard();
    } catch (error) {
      if (requestAction) {
        setRequestReasonError(error.message);
      } else {
        setFeedback(error.message);
      }
    } finally {
      setRequestUpdatingId(null);
    }
  }

  function confirmRequestAction() {
    const reason = requestReason.trim();

    if (!reason) {
      setRequestReasonError('Debes ingresar un motivo antes de continuar.');
      return;
    }

    changeRequestStatus(requestAction.request, requestAction.nextStatus, reason);
  }

  async function deletePet() {
    if (!petToDelete) {
      return;
    }

    setDeleteStatus('deleting');
    setFeedback('');

    try {
      const response = await apiClient(`/foundation/pets/${petToDelete.id}`, {
        method: 'DELETE'
      });
      const payload = await response.json();

      if (!response.ok) {
        throw new Error(payload.message || 'No se pudo eliminar la publicación.');
      }

      setFeedback(payload.message || 'Publicación eliminada correctamente.');
      setPetToDelete(null);
      await loadDashboard();
    } catch (error) {
      setFeedback(error.message);
    } finally {
      setDeleteStatus('idle');
    }
  }

  if (!currentUser?.id) {
    return (
      <section className="foundation-page">
        <div className="foundation-access-card">
          <span>AL</span>
          <h2>Inicia sesión para acceder al panel</h2>
          <p>Las fundaciones registradas pueden gestionar sus mascotas y postulaciones desde aquí.</p>
          <a className="foundation-primary-link" href="/login">Iniciar sesión</a>
        </div>
      </section>
    );
  }

  if (!canAccessPanel) {
    return (
      <section className="foundation-page">
        <div className="foundation-access-card">
          <span>AL</span>
          <h2>Panel no disponible</h2>
          <p>Este panel está disponible solo para fundaciones registradas.</p>
          <a className="foundation-primary-link" href="/">Ver compañeros disponibles</a>
        </div>
      </section>
    );
  }

  return (
    <section className="foundation-page">
      <div className="foundation-hero">
        <div>
          <p className="section-kicker">Gestión de fundación</p>
          <h2>Panel de Fundación</h2>
          <p>Gestiona tus mascotas publicadas y revisa las postulaciones recibidas.</p>
        </div>
        <button className="foundation-primary-button" onClick={openCreateForm} type="button">
          Publicar mascota
        </button>
      </div>

      {feedback && (
        <p className={submitStatus === 'error' ? 'foundation-feedback foundation-feedback-error' : 'foundation-feedback'}>
          {displayText(feedback)}
        </p>
      )}

      <div className="foundation-summary-grid">
        {summaryCards.map((card) => (
          <article className="foundation-summary-card" key={card.label}>
            <span>{card.icon}</span>
            <strong>{card.value}</strong>
            <p>{card.label}</p>
          </article>
        ))}
      </div>

      {loadStatus === 'loading' && (
        <div className="foundation-state">Cargando información del panel...</div>
      )}

      {loadStatus === 'error' && (
        <div className="foundation-state foundation-state-error">{displayText(feedback)}</div>
      )}

      {isFormOpen && (
        <form className="foundation-form-card" onSubmit={handlePetSubmit}>
          <div className="foundation-section-heading">
            <span>{editingPet ? 'ED' : 'NU'}</span>
            <div>
              <h3>{editingPet ? `Editar a ${displayText(editingPet.nombre)}` : 'Publicar nueva mascota'}</h3>
              <p>La publicación quedará en revisión antes de mostrarse en el catálogo público.</p>
            </div>
          </div>

          <div className="foundation-form-grid">
            <label>
              Nombre
              <input
                maxLength={MAX_PET_NAME_LENGTH}
                onChange={(event) => updateFormField('nombre', event.target.value)}
                placeholder="Ej: Luna"
                value={form.nombre}
              />
              <span className={nameLength > MAX_PET_NAME_LENGTH ? 'foundation-counter foundation-counter-error' : 'foundation-counter'}>
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
            <fieldset className="foundation-age-field">
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
            <div className="foundation-review-note">
              <strong>Revisión obligatoria</strong>
              <span>Un administrador revisará esta publicación antes de que sea visible.</span>
            </div>
          </div>

          <div
            className="foundation-image-dropzone"
            onDragOver={(event) => event.preventDefault()}
            onDrop={handleDropImage}
          >
            <div className="foundation-image-preview">
              {imagePreview ? (
                <img alt="Vista previa de la mascota" src={getMediaUrl(imagePreview)} />
              ) : (
                <span aria-hidden="true">AL</span>
              )}
            </div>
            <div>
              <strong>Arrastra o selecciona una imagen de tu computadora</strong>
              <p>JPG, JPEG, PNG o WEBP. Tamaño máximo: 3 MB.</p>
              <label className="foundation-file-button">
                Seleccionar imagen
                <input
                  accept="image/jpeg,image/png,image/webp"
                  onChange={(event) => handleImageFile(event.target.files?.[0])}
                  type="file"
                />
              </label>
            </div>
          </div>

          <label className="foundation-wide-field">
            Descripción
            <textarea
              onChange={(event) => updateFormField('descripcion', event.target.value)}
              placeholder="Cuéntanos sobre su personalidad, cuidados y tipo de hogar ideal."
              value={form.descripcion}
            />
            <span className={descriptionWordCount < MIN_DESCRIPTION_WORDS ? 'foundation-counter foundation-counter-error' : 'foundation-counter'}>
              {descriptionWordCount}/{MIN_DESCRIPTION_WORDS} palabras mínimo
            </span>
          </label>

          <div className="foundation-form-actions">
            <button className="foundation-secondary-button" onClick={closeForm} type="button">
              Cancelar
            </button>
            <button className="foundation-primary-button" disabled={isSubmitting} type="submit">
              {isSubmitting ? 'Guardando...' : editingPet ? 'Guardar cambios' : 'Publicar mascota'}
            </button>
          </div>
        </form>
      )}

      <div className="foundation-layout">
        <section className="foundation-card">
          <div className="foundation-section-heading">
            <span>MP</span>
            <div>
              <h3>Mis mascotas publicadas</h3>
              <p>{pets.length} mascotas registradas en AdoptaLove.</p>
            </div>
          </div>

          <div className="foundation-pet-list">
            {pets.length === 0 ? (
              <div className="foundation-empty-state">Aún no hay mascotas publicadas.</div>
            ) : (
              paginatedPets.map((pet) => (
                <article className="foundation-pet-card" key={pet.id}>
                  <PetImage name={displayText(pet.nombre)} url={pet.foto_url} />
                  <div>
                    <strong>{displayText(pet.nombre)}</strong>
                    <p>{displayText(pet.especie)} · {formatPetAge(pet)} · {formatStatus(pet.tamano)}</p>
                    <span className={`foundation-status foundation-status-${pet.estado}`}>
                      {formatPetStatus(pet.estado)}
                    </span>
                  </div>
                  <div className="foundation-pet-actions">
                    <button className="foundation-secondary-button" onClick={() => openEditForm(pet)} type="button">
                      Editar
                    </button>
                    <button className="foundation-danger-button" onClick={() => setPetToDelete(pet)} type="button">
                      Eliminar
                    </button>
                  </div>
                </article>
              ))
            )}
          </div>

          {pets.length > ITEMS_PER_PAGE && (
            <PaginationControls page={petPage} totalPages={petTotalPages} onChange={setPetPage} />
          )}
        </section>

        <section className="foundation-card">
          <div className="foundation-section-heading">
            <span>PR</span>
            <div>
              <h3>Postulaciones recibidas</h3>
              <p>Revisa cada solicitud, despliega el detalle y guarda el motivo de tu decisión.</p>
            </div>
          </div>

          <div className="foundation-request-list">
            {requests.length === 0 ? (
              <div className="foundation-empty-state">Aún no hay postulaciones recibidas.</div>
            ) : (
              paginatedRequests.map((request) => {
                const isExpanded = expandedRequests.has(request.id);

                return (
                  <article className="foundation-request-card" key={request.id}>
                    <div className="foundation-request-header">
                      <div>
                        <strong>{displayText(request.mascota_nombre)}</strong>
                        <span>{displayText(request.postulante_nombre)} · {formatDate(request.created_at)}</span>
                        <span>{displayText(request.postulante_email, 'Correo no indicado')}</span>
                      </div>
                      <span className={`foundation-status foundation-status-${request.estado}`}>
                        {formatStatus(request.estado)}
                      </span>
                    </div>

                    <button
                      className="foundation-detail-toggle"
                      onClick={() => toggleRequestDetails(request.id)}
                      type="button"
                    >
                      {isExpanded ? 'Ocultar detalle' : 'Ver detalle'}
                    </button>

                    {isExpanded && (
                      <div className="foundation-request-detail">
                        <dl>
                          <div>
                            <dt>Postulante</dt>
                            <dd>{displayText(request.postulante_nombre)}</dd>
                          </div>
                          <div>
                            <dt>Email</dt>
                            <dd>{displayText(request.postulante_email, 'No indicado')}</dd>
                          </div>
                          <div>
                            <dt>Teléfono</dt>
                            <dd>{formatPhone(request.postulante_telefono)}</dd>
                          </div>
                          <div>
                            <dt>RUT</dt>
                            <dd>{displayText(request.postulante_rut, 'No indicado')}</dd>
                          </div>
                          <div>
                            <dt>Mascota</dt>
                            <dd>{displayText(request.mascota_nombre)} ({displayText(request.mascota_especie)})</dd>
                          </div>
                          <div>
                            <dt>Fecha</dt>
                            <dd>{formatDate(request.created_at)}</dd>
                          </div>
                        </dl>

                        <div className="foundation-request-message">
                          <strong>Respuestas o mensaje de postulación</strong>
                          <p>{displayText(request.mensaje, 'No se ingresó mensaje adicional.')}</p>
                        </div>

                        {request.motivo_estado && (
                          <div className="foundation-request-reason">
                            <strong>Motivo del estado</strong>
                            <p>{displayText(request.motivo_estado)}</p>
                          </div>
                        )}

                        <div className="foundation-request-actions">
                          {REQUEST_ACTIONS.map((action) => (
                            <button
                              className={request.estado === action.value ? 'active' : ''}
                              disabled={request.estado === action.value || requestUpdatingId === request.id}
                              key={action.value}
                              onClick={() => openRequestAction(request, action.value)}
                              type="button"
                            >
                              {action.label}
                            </button>
                          ))}
                        </div>
                      </div>
                    )}
                  </article>
                );
              })
            )}
          </div>

          {requests.length > ITEMS_PER_PAGE && (
            <PaginationControls page={requestPage} totalPages={requestTotalPages} onChange={setRequestPage} />
          )}
        </section>
      </div>

      {petToDelete && (
        <div className="foundation-modal-backdrop" role="presentation">
          <div aria-modal="true" className="foundation-modal" role="dialog">
            <h3>Confirmar eliminación de publicación</h3>
            <p>¿Estás seguro de que deseas eliminar esta publicación? Esta acción no se puede deshacer.</p>
            <div className="foundation-modal-actions">
              <button
                className="foundation-secondary-button"
                disabled={isDeleting}
                onClick={() => setPetToDelete(null)}
                type="button"
              >
                Cancelar
              </button>
              <button
                className="foundation-danger-button"
                disabled={isDeleting}
                onClick={deletePet}
                type="button"
              >
                {isDeleting ? 'Eliminando...' : 'Eliminar publicación'}
              </button>
            </div>
          </div>
        </div>
      )}

      {requestAction && (
        <div className="foundation-modal-backdrop" role="presentation">
          <div aria-modal="true" className="foundation-modal" role="dialog">
            <h3>{requestAction.nextStatus === 'aprobada' ? 'Confirmar aprobación' : 'Confirmar rechazo'}</h3>
            <p>
              Escribe el motivo que verá el adoptante en su perfil antes de guardar este cambio.
            </p>
            <label className="foundation-modal-field">
              Motivo
              <textarea
                onChange={(event) => {
                  setRequestReason(event.target.value);
                  setRequestReasonError('');
                }}
                placeholder="Ej: La solicitud cumple con los requisitos de adopción."
                value={requestReason}
              />
            </label>
            {requestReasonError && <p className="foundation-modal-error">{displayText(requestReasonError)}</p>}
            <div className="foundation-modal-actions">
              <button
                className="foundation-secondary-button"
                disabled={requestUpdatingId === requestAction.request.id}
                onClick={closeRequestAction}
                type="button"
              >
                Cancelar
              </button>
              <button
                className="foundation-primary-button"
                disabled={requestUpdatingId === requestAction.request.id}
                onClick={confirmRequestAction}
                type="button"
              >
                {requestUpdatingId === requestAction.request.id ? 'Guardando...' : 'Confirmar cambio'}
              </button>
            </div>
          </div>
        </div>
      )}
    </section>
  );
}
