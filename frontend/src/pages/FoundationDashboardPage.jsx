import { useEffect, useMemo, useState } from 'react';
import { apiClient } from '../services/apiClient';
import { useBodyScrollLock } from '../hooks/useBodyScrollLock';
import { getCurrentUser } from '../services/authSession';
import { ModalPortal } from '../components/ModalPortal';
import { formatAddress } from '../utils/addressDisplay';
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

const REQUEST_STATUS_ALIASES = {
  aprobado: 'aprobada',
  aprobada: 'aprobada',
  pendiente: 'pendiente',
  rechazado: 'rechazada',
  rechazada: 'rechazada',
  en_revision: 'en_revision'
};

const REQUEST_ACTIONS = [
  { value: 'en_revision', label: 'En revisión' },
  { value: 'aprobada', label: 'Aprobar' },
  { value: 'rechazada', label: 'Rechazar' }
];

const REQUEST_STATUS_FILTERS = [
  {
    emptyMessage: 'Aún no hay postulaciones recibidas.',
    label: 'Todas',
    value: 'todas'
  },
  {
    emptyMessage: 'No hay postulaciones pendientes por ahora.',
    label: 'Pendientes',
    value: 'pendiente'
  },
  {
    emptyMessage: 'No hay postulaciones en revisión por ahora.',
    label: 'En revisión',
    value: 'en_revision'
  },
  {
    emptyMessage: 'No hay postulaciones aprobadas por ahora.',
    label: 'Aprobadas',
    value: 'aprobada'
  },
  {
    emptyMessage: 'No hay postulaciones rechazadas por ahora.',
    label: 'Rechazadas',
    value: 'rechazada'
  }
];

const DEFAULT_OPEN_REQUEST_SECTION = 'postulante';
const FINAL_REQUEST_STATUSES = new Set(['aprobada', 'rechazada']);
const FULL_WIDTH_RESPONSE_LABELS = new Set([
  'detalle de otras mascotas',
  'mensaje',
  'motivo',
  'respuesta'
]);
const LONG_RESPONSE_PREVIEW_LENGTH = 220;

function normalizeRequestStatus(status = '') {
  const normalizedStatus = displayText(status, '')
    .trim()
    .toLowerCase()
    .normalize('NFD')
    .replace(/[\u0300-\u036f]/g, '')
    .replace(/[\s-]+/g, '_');

  return REQUEST_STATUS_ALIASES[normalizedStatus] ?? normalizedStatus;
}

function isFinalRequestStatus(status = '') {
  return FINAL_REQUEST_STATUSES.has(normalizeRequestStatus(status));
}

function formatStatus(status = '') {
  const normalizedStatus = normalizeRequestStatus(status);

  if (STATUS_LABELS[normalizedStatus]) {
    return STATUS_LABELS[normalizedStatus];
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
    return 'No informado';
  }

  return phone.replace(/^\+56\s*56\s*/u, '+56 ').trim();
}

function formatRequestValue(value, fallback = 'No informado') {
  const text = displayText(value, '').trim();

  return text || fallback;
}

function formatLocationSummary(comuna, region) {
  const parts = [
    formatRequestValue(comuna, ''),
    formatRequestValue(region, '')
  ].filter(Boolean);

  return parts.length > 0 ? parts.join(', ') : 'No informado';
}

function normalizeResponseLabel(label = '') {
  return label
    .normalize('NFD')
    .replace(/[\u0300-\u036f]/g, '')
    .toLowerCase()
    .trim();
}

function shouldUseFullWidthResponse(label, value) {
  const normalizedLabel = normalizeResponseLabel(label);

  return (
    FULL_WIDTH_RESPONSE_LABELS.has(normalizedLabel) ||
    value.length > LONG_RESPONSE_PREVIEW_LENGTH
  );
}

function formatRequestResponses(message) {
  const text = displayText(message, '').trim();

  if (!text) {
    const fallback = 'No se ingresó mensaje adicional.';

    return [{
      fullWidth: true,
      label: 'Mensaje',
      value: fallback
    }];
  }

  const lines = text
    .split(/\r?\n/u)
    .map((line) => line.trim())
    .filter(Boolean);

  if (lines.length <= 1) {
    return [{
      fullWidth: true,
      label: 'Mensaje',
      value: text
    }];
  }

  return lines.map((line, index) => {
    const separatorIndex = line.indexOf(':');

    if (separatorIndex > 0 && separatorIndex <= 48) {
      const label = line.slice(0, separatorIndex).trim();
      const value = line.slice(separatorIndex + 1).trim();
      const responseValue = value || 'No informado';

      return {
        fullWidth: shouldUseFullWidthResponse(label, responseValue),
        label,
        value: responseValue
      };
    }

    const label = `Respuesta ${index + 1}`;

    return {
      fullWidth: shouldUseFullWidthResponse(label, line),
      label,
      value: line
    };
  });
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

function RequestDetailSection({ children, className = '', isOpen, onToggle, title }) {
  return (
    <section className={`foundation-request-info-block${className ? ` ${className}` : ''}`}>
      <h4>
        <button
          aria-expanded={isOpen}
          className="foundation-request-section-toggle"
          onClick={onToggle}
          type="button"
        >
          <span>{title}</span>
          <span aria-hidden="true" className="foundation-request-accordion-icon" />
        </button>
      </h4>

      {isOpen && (
        <div className="foundation-request-section-body">
          {children}
        </div>
      )}
    </section>
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
  const [requestStatusFilter, setRequestStatusFilter] = useState('todas');
  const [expandedRequestId, setExpandedRequestId] = useState(null);
  const [expandedRequestSections, setExpandedRequestSections] = useState({});
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
  const requestStatusCounts = useMemo(() => {
    const counts = {
      aprobada: 0,
      en_revision: 0,
      pendiente: 0,
      rechazada: 0,
      todas: requests.length
    };

    requests.forEach((request) => {
      const status = normalizeRequestStatus(request.estado);

      if (Object.prototype.hasOwnProperty.call(counts, status)) {
        counts[status] += 1;
      }
    });

    return counts;
  }, [requests]);
  const filteredRequests = useMemo(() => {
    if (requestStatusFilter === 'todas') {
      return requests;
    }

    return requests.filter(
      (request) => normalizeRequestStatus(request.estado) === requestStatusFilter
    );
  }, [requestStatusFilter, requests]);
  const activeRequestFilter = REQUEST_STATUS_FILTERS.find(
    (filter) => filter.value === requestStatusFilter
  ) ?? REQUEST_STATUS_FILTERS[0];
  const petTotalPages = getTotalPages(pets);
  const requestTotalPages = getTotalPages(filteredRequests);
  const paginatedPets = getPageItems(pets, petPage);
  const paginatedRequests = getPageItems(filteredRequests, requestPage);
  const birthYearOptions = useMemo(() => getEstimatedBirthYearOptions(), []);

  useBodyScrollLock(Boolean(petToDelete || requestAction));

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
    setRequestPage((page) => Math.min(page, getTotalPages(filteredRequests)));
  }, [filteredRequests]);

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
    setExpandedRequestId((currentId) => (currentId === requestId ? null : requestId));
  }

  function changeRequestStatusFilter(nextFilter) {
    setRequestStatusFilter(nextFilter);
    setRequestPage(1);
    setExpandedRequestId(null);
  }

  function getOpenRequestSection(requestId) {
    const hasSelection = Object.prototype.hasOwnProperty.call(
      expandedRequestSections,
      requestId
    );
    const section = hasSelection
      ? expandedRequestSections[requestId]
      : DEFAULT_OPEN_REQUEST_SECTION;

    return Array.isArray(section) ? section[0] ?? null : section;
  }

  function isRequestSectionOpen(requestId, sectionId) {
    return getOpenRequestSection(requestId) === sectionId;
  }

  function toggleRequestSection(requestId, sectionId) {
    setExpandedRequestSections((current) => {
      const hasSelection = Object.prototype.hasOwnProperty.call(current, requestId);
      const currentSelection = hasSelection
        ? current[requestId]
        : DEFAULT_OPEN_REQUEST_SECTION;
      const currentSection = Array.isArray(currentSelection)
        ? currentSelection[0] ?? null
        : currentSelection;

      return {
        ...current,
        [requestId]: currentSection === sectionId ? null : sectionId
      };
    });
  }

  function openRequestAction(request, nextStatus) {
    const currentStatus = normalizeRequestStatus(request.estado);

    if (
      isFinalRequestStatus(currentStatus) ||
      currentStatus === nextStatus ||
      requestUpdatingId === request.id
    ) {
      return;
    }

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

          <div className="foundation-request-filter-bar" aria-label="Filtrar postulaciones por estado">
            {REQUEST_STATUS_FILTERS.map((filter) => {
              const isActiveFilter = requestStatusFilter === filter.value;

              return (
                <button
                  aria-pressed={isActiveFilter}
                  className={isActiveFilter ? 'active' : ''}
                  key={filter.value}
                  onClick={() => changeRequestStatusFilter(filter.value)}
                  type="button"
                >
                  <span>{filter.label}</span>
                  <strong>{requestStatusCounts[filter.value] ?? 0}</strong>
                </button>
              );
            })}
          </div>

          <div className="foundation-request-list">
            {filteredRequests.length === 0 ? (
              <div className="foundation-empty-state">{activeRequestFilter.emptyMessage}</div>
            ) : (
              paginatedRequests.map((request) => {
                const requestState = normalizeRequestStatus(request.estado);
                const isExpanded = expandedRequestId === request.id;
                const areDecisionActionsLocked = isFinalRequestStatus(requestState);
                const addressComplement = displayText(
                  request.postulante_complemento_direccion,
                  ''
                ).trim();
                const completeAddress = formatAddress({
                  comuna: request.postulante_comuna,
                  complemento_direccion: addressComplement,
                  direccion: request.postulante_direccion,
                  numeracion: request.postulante_numeracion,
                  region: request.postulante_region
                });
                const applicantName = formatRequestValue(request.postulante_nombre);
                const applicantEmail = formatRequestValue(request.postulante_email);
                const detailId = `foundation-request-detail-${request.id}`;
                const locationSummary = formatLocationSummary(
                  request.postulante_comuna,
                  request.postulante_region
                );
                const petName = formatRequestValue(request.mascota_nombre);
                const petType = formatRequestValue(request.mascota_especie, '');
                const requestDate = formatDate(request.created_at);
                const requestStatus = formatStatus(request.estado);
                const isApplicantSectionOpen = isRequestSectionOpen(request.id, 'postulante');
                const isLocationSectionOpen = isRequestSectionOpen(request.id, 'ubicacion');
                const isPetSectionOpen = isRequestSectionOpen(request.id, 'mascota');
                const isResponseSectionOpen = isRequestSectionOpen(request.id, 'respuestas');
                const responseItems = formatRequestResponses(request.mensaje);

                return (
                  <article className="foundation-request-card" key={request.id}>
                    <div className="foundation-request-summary">
                      <div className="foundation-request-summary-heading">
                        <div className="foundation-request-summary-title">
                          <strong>{petName}</strong>
                          {petType && <span>Tipo: {petType}</span>}
                        </div>
                        <span className={`foundation-status foundation-status-${requestState}`}>
                          {requestStatus}
                        </span>
                      </div>

                      <dl className="foundation-request-summary-list">
                        <div>
                          <dt>Postulante</dt>
                          <dd>{applicantName}</dd>
                        </div>
                        <div>
                          <dt>Correo</dt>
                          <dd>{applicantEmail}</dd>
                        </div>
                        <div>
                          <dt>Ubicación</dt>
                          <dd>{locationSummary}</dd>
                        </div>
                        <div>
                          <dt>Fecha de postulación</dt>
                          <dd>{requestDate}</dd>
                        </div>
                      </dl>
                    </div>

                    <div className="foundation-request-toolbar">
                      <button
                        aria-controls={detailId}
                        aria-expanded={isExpanded}
                        className="foundation-detail-toggle"
                        onClick={() => toggleRequestDetails(request.id)}
                        type="button"
                      >
                        {isExpanded ? 'Ocultar detalle' : 'Ver detalle'}
                      </button>

                      <div className="foundation-request-actions">
                        {REQUEST_ACTIONS.map((action) => {
                          const isCurrentAction = requestState === action.value;
                          const isActionDisabled =
                            areDecisionActionsLocked ||
                            isCurrentAction ||
                            requestUpdatingId === request.id;

                          return (
                            <button
                              className={isCurrentAction ? 'active' : ''}
                              disabled={isActionDisabled}
                              key={action.value}
                              onClick={() => openRequestAction(request, action.value)}
                              type="button"
                            >
                              {action.label}
                            </button>
                          );
                        })}
                      </div>
                    </div>

                    {isExpanded && (
                      <div className="foundation-request-detail" id={detailId}>
                        <div className="foundation-request-detail-grid">
                          <RequestDetailSection
                            isOpen={isApplicantSectionOpen}
                            onToggle={() => toggleRequestSection(request.id, 'postulante')}
                            title="Datos del postulante"
                          >
                            <dl className="foundation-request-field-list">
                              <div>
                                <dt>Nombre completo</dt>
                                <dd>{applicantName}</dd>
                              </div>
                              <div>
                                <dt>Correo electrónico</dt>
                                <dd>{applicantEmail}</dd>
                              </div>
                              <div>
                                <dt>Teléfono</dt>
                                <dd>{formatPhone(request.postulante_telefono)}</dd>
                              </div>
                              <div>
                                <dt>RUT</dt>
                                <dd>{formatRequestValue(request.postulante_rut)}</dd>
                              </div>
                            </dl>
                          </RequestDetailSection>

                          <RequestDetailSection
                            isOpen={isLocationSectionOpen}
                            onToggle={() => toggleRequestSection(request.id, 'ubicacion')}
                            title="Ubicación del adoptante"
                          >
                            <dl className="foundation-request-field-list">
                              <div>
                                <dt>Región</dt>
                                <dd>{formatRequestValue(request.postulante_region)}</dd>
                              </div>
                              <div>
                                <dt>Comuna</dt>
                                <dd>{formatRequestValue(request.postulante_comuna)}</dd>
                              </div>
                              <div>
                                <dt>Dirección / calle</dt>
                                <dd>{formatRequestValue(request.postulante_direccion)}</dd>
                              </div>
                              <div>
                                <dt>Numeración</dt>
                                <dd>{formatRequestValue(request.postulante_numeracion)}</dd>
                              </div>
                              {addressComplement && (
                                <div>
                                  <dt>Complemento</dt>
                                  <dd>{addressComplement}</dd>
                                </div>
                              )}
                            </dl>
                            <div className="foundation-request-address-summary">
                              <span>Dirección completa</span>
                              <p>{completeAddress}</p>
                            </div>
                          </RequestDetailSection>

                          <RequestDetailSection
                            isOpen={isPetSectionOpen}
                            onToggle={() => toggleRequestSection(request.id, 'mascota')}
                            title="Mascota postulada"
                          >
                            <dl className="foundation-request-field-list">
                              <div>
                                <dt>Mascota</dt>
                                <dd>{petName}</dd>
                              </div>
                              <div>
                                <dt>Estado actual</dt>
                                <dd>{requestStatus}</dd>
                              </div>
                              <div>
                                <dt>Tipo</dt>
                                <dd>{petType || 'No informado'}</dd>
                              </div>
                              <div>
                                <dt>Fecha de postulación</dt>
                                <dd>{requestDate}</dd>
                              </div>
                            </dl>
                          </RequestDetailSection>

                          <RequestDetailSection
                            className="foundation-request-response-block"
                            isOpen={isResponseSectionOpen}
                            onToggle={() => toggleRequestSection(request.id, 'respuestas')}
                            title="Respuestas o mensaje de postulación"
                          >
                            <div className="foundation-request-response-list">
                              {responseItems.map((item, index) => {
                                const shouldCollapseResponse =
                                  item.fullWidth && item.value.length > LONG_RESPONSE_PREVIEW_LENGTH;
                                const previewText = `${item.value
                                  .slice(0, LONG_RESPONSE_PREVIEW_LENGTH)
                                  .trim()}...`;

                                return (
                                  <div
                                    className={`foundation-request-response-item${
                                      item.fullWidth ? ' foundation-request-response-item-wide' : ''
                                    }`}
                                    key={`${item.label}-${index}`}
                                  >
                                    <span>{item.label}</span>
                                    {shouldCollapseResponse ? (
                                      <details className="foundation-request-response-expand">
                                        <summary>
                                          <span>{previewText}</span>
                                          <strong>Ver motivo completo</strong>
                                        </summary>
                                        <p>{item.value}</p>
                                      </details>
                                    ) : (
                                      <p>{item.value}</p>
                                    )}
                                  </div>
                                );
                              })}
                            </div>
                          </RequestDetailSection>
                        </div>

                        {request.motivo_estado && (
                          <div className={`foundation-request-reason foundation-request-reason-${requestState}`}>
                            <strong>Motivo del estado</strong>
                            <p>{displayText(request.motivo_estado)}</p>
                          </div>
                        )}
                      </div>
                    )}
                  </article>
                );
              })
            )}
          </div>

          {filteredRequests.length > ITEMS_PER_PAGE && (
            <PaginationControls page={requestPage} totalPages={requestTotalPages} onChange={setRequestPage} />
          )}
        </section>
      </div>

      {petToDelete && (
        <ModalPortal>
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
        </ModalPortal>
      )}

      {requestAction && (
        <ModalPortal>
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
        </ModalPortal>
      )}
    </section>
  );
}
