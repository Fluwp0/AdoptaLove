import { useEffect, useMemo, useState } from 'react';
import { apiClient } from '../services/apiClient';
import { getCurrentUser } from '../services/authSession';
import { getMediaUrl } from '../utils/mediaUrl';

const ADMIN_ROLES = new Set(['administrador', 'admin']);
const MAX_PET_NAME_LENGTH = 40;
const MIN_DESCRIPTION_WORDS = 20;
const MAX_IMAGE_SIZE = 3 * 1024 * 1024;
const ALLOWED_IMAGE_TYPES = ['image/jpeg', 'image/png', 'image/webp'];

const EMPTY_ADMIN_PET_FORM = {
  publicado_por_nombre: '',
  nombre: '',
  especie: '',
  raza: '',
  edad_anios: '',
  edad_meses: '',
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

  const cards = useMemo(() => metricCards(metrics), [metrics]);
  const nameLength = form.nombre.length;
  const descriptionWordCount = countWords(form.descripcion);
  const isSubmitting = submitStatus === 'submitting';

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

  useEffect(() => {
    if (section === 'inicio') {
      loadMetrics();
    } else {
      setLoadStatus('idle');
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [currentUser?.id, currentUser?.rol, section]);

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
    formData.append('edad_anios', form.edad_anios === '' ? '0' : String(Number(form.edad_anios)));
    formData.append('edad_meses', form.edad_meses === '' ? '0' : String(Number(form.edad_meses)));
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

    const years = form.edad_anios === '' ? null : Number(form.edad_anios);
    const months = form.edad_meses === '' ? null : Number(form.edad_meses);

    if (years === null && months === null) {
      setSubmitStatus('error');
      setFeedback('Debes indicar la edad en años, meses o ambos.');
      return;
    }

    if (years !== null && (!Number.isInteger(years) || years < 0 || years > 30)) {
      setSubmitStatus('error');
      setFeedback('La edad en años debe estar entre 0 y 30.');
      return;
    }

    if (months !== null && (!Number.isInteger(months) || months < 0 || months > 11)) {
      setSubmitStatus('error');
      setFeedback('La edad en meses debe estar entre 0 y 11.');
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
            <legend>Edad</legend>
            <div>
              <label>
                Edad en años
                <input
                  max="30"
                  min="0"
                  onChange={(event) => updateFormField('edad_anios', event.target.value)}
                  placeholder="0"
                  type="number"
                  value={form.edad_anios}
                />
              </label>
              <label>
                Edad en meses
                <input
                  max="11"
                  min="0"
                  onChange={(event) => updateFormField('edad_meses', event.target.value)}
                  placeholder="0"
                  type="number"
                  value={form.edad_meses}
                />
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
            <p>Publica mascotas directamente desde administración y deja preparada la revisión completa para la siguiente parte.</p>
          </div>
        </div>

        {feedback && (
          <p className={submitStatus === 'error' ? 'admin-feedback admin-feedback-error' : 'admin-feedback'}>
            {feedback}
          </p>
        )}

        {renderPublishForm()}

        <article className="admin-placeholder-card">
          <span>AD</span>
          <h3>Revisión de publicaciones</h3>
          <p>Revisión de publicaciones enviada por fundaciones se implementará en la siguiente parte.</p>
        </article>
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
