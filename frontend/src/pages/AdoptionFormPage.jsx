import { useEffect, useState } from 'react';
import { apiClient } from '../services/apiClient';
import { getCurrentUser } from '../services/authSession';

const INITIAL_FORM = {
  homeType: '',
  outdoorSpace: '',
  householdPeople: '',
  hasOtherPets: '',
  otherPetsDetails: '',
  adoptionReason: '',
  timeAtHome: '',
  responsiblePerson: '',
  canCoverCosts: '',
  acceptsFollowUp: ''
};
const ACTIVE_APPLICATION_MESSAGE =
  'Ya tienes una postulaci?n en proceso. Debes esperar a que sea aprobada, rechazada o cancelarla desde tu perfil para poder postular a otra mascota.';
const ACTIVE_APPLICATION_STATUSES = new Set(['pendiente', 'en_revision']);

function isActiveApplication(application) {
  return ACTIVE_APPLICATION_STATUSES.has(application?.estado);
}

function formatAge(age) {
  if (age === null || age === undefined) {
    return 'Edad no indicada';
  }

  return age === 1 ? '1 año' : `${age} años`;
}

function formatStatus(status = '') {
  return status
    .split('_')
    .map((word) => word.charAt(0).toUpperCase() + word.slice(1))
    .join(' ');
}

function buildApplicationMessage(form) {
  const valueOrFallback = (value) => value || 'No indicado';

  return [
    `Motivo: ${form.adoptionReason.trim()}`,
    `Vivienda: ${valueOrFallback(form.homeType)}`,
    `Patio o espacio al aire libre: ${valueOrFallback(form.outdoorSpace)}`,
    `Personas en el hogar: ${valueOrFallback(form.householdPeople)}`,
    `Otras mascotas: ${valueOrFallback(form.hasOtherPets)}`,
    `Detalle de otras mascotas: ${valueOrFallback(form.otherPetsDetails.trim())}`,
    `Tiempo en casa: ${valueOrFallback(form.timeAtHome)}`,
    `Responsable principal: ${valueOrFallback(form.responsiblePerson)}`,
    `Gastos de alimentación y salud: ${valueOrFallback(form.canCoverCosts)}`,
    `Visitas de seguimiento: ${valueOrFallback(form.acceptsFollowUp)}`
  ].join('\n');
}

function FormField({ children, label, name }) {
  return (
    <label className="adoption-field" htmlFor={name}>
      <span>{label}</span>
      {children}
    </label>
  );
}

function PetImage({ name, url }) {
  const [hasError, setHasError] = useState(false);

  if (!url || hasError) {
    return <div className="adoption-pet-image-placeholder">Sin imagen</div>;
  }

  return (
    <img
      alt={`Foto de ${name}`}
      className="adoption-pet-image"
      onError={() => setHasError(true)}
      src={url}
    />
  );
}

export function AdoptionFormPage({ petId }) {
  const [pet, setPet] = useState(null);
  const [loadStatus, setLoadStatus] = useState('loading');
  const [loadError, setLoadError] = useState('');
  const [form, setForm] = useState(INITIAL_FORM);
  const [submitStatus, setSubmitStatus] = useState('idle');
  const [submitFeedback, setSubmitFeedback] = useState('');
  const [activeApplication, setActiveApplication] = useState(null);
  const [activeApplicationStatus, setActiveApplicationStatus] = useState('idle');

  const currentUser = getCurrentUser();
  const hasCurrentUser = Boolean(currentUser?.id);

  useEffect(() => {
    let isMounted = true;

    async function loadPet() {
      try {
        const response = await apiClient(`/mascotas/${petId}`);
        const payload = await response.json();

        if (!response.ok) {
          throw new Error(payload.message || 'No se pudo cargar la mascota.');
        }

        if (isMounted) {
          setPet(payload.data);
          setLoadStatus('success');
        }
      } catch (error) {
        if (isMounted) {
          setLoadError(error.message);
          setLoadStatus('error');
        }

        return;
      }

      if (hasCurrentUser) {
        setActiveApplicationStatus('loading');

        try {
          const activeResponse = await apiClient('/solicitudes-adopcion/me/activa');
          const activePayload = await activeResponse.json();

          if (!activeResponse.ok) {
            throw new Error(activePayload.message || 'No se pudo revisar tu postulaci?n activa.');
          }

          if (isMounted) {
            setActiveApplication(isActiveApplication(activePayload.data) ? activePayload.data : null);
            setActiveApplicationStatus('success');
          }
        } catch (activeError) {
          if (isMounted) {
            setSubmitStatus('error');
            setSubmitFeedback(activeError.message);
            setActiveApplicationStatus('error');
          }
        }
      }
    }

    loadPet();

    return () => {
      isMounted = false;
    };
  }, [petId]);

  function updateField(field, value) {
    setForm((currentForm) => ({
      ...currentForm,
      [field]: value
    }));
  }

  async function handleSubmit(event) {
    event.preventDefault();

    if (!hasCurrentUser) {
      setSubmitStatus('error');
      setSubmitFeedback('Debes iniciar sesión para postular a una adopción.');
      return;
    }

    if (!form.adoptionReason.trim()) {
      setSubmitStatus('error');
      setSubmitFeedback('Cuéntanos por qué quieres adoptar antes de enviar tu solicitud.');
      return;
    }

    if (isActiveApplication(activeApplication)) {
      setSubmitStatus('error');
      setSubmitFeedback(ACTIVE_APPLICATION_MESSAGE);
      return;
    }

    setSubmitStatus('submitting');
    setSubmitFeedback('Enviando solicitud...');

    try {
      const response = await apiClient('/solicitudes-adopcion', {
        method: 'POST',
        body: JSON.stringify({
          adoptante_usuario_id: currentUser.id,
          mascota_id: pet.id,
          mensaje: buildApplicationMessage(form)
        })
      });
      const payload = await response.json();

      if (!response.ok) {
        throw new Error(payload.message || 'No se pudo enviar la solicitud.');
      }

      setForm(INITIAL_FORM);
      setActiveApplication(payload.data);
      setSubmitStatus('success');
      setSubmitFeedback('Tu solicitud de adopción fue enviada correctamente.');
    } catch (error) {
      setSubmitStatus('error');
      setSubmitFeedback(error.message);
    }
  }

  if (loadStatus === 'loading') {
    return (
      <section className="adoption-page">
        <div className="detail-state">Cargando formulario de adopción...</div>
      </section>
    );
  }

  if (loadStatus === 'error') {
    return (
      <section className="adoption-page">
        <div className="detail-state detail-state-error">
          <p>{loadError}</p>
          <a className="detail-back-link" href="/">Volver a compañeros</a>
        </div>
      </section>
    );
  }

  return (
    <section className="adoption-page">
      <div className="adoption-hero">
        <div>
          <p className="section-kicker">Formulario de adopción</p>
          <h2>Gracias por querer cambiar una vida</h2>
          <p>
            Completa esta postulación para que la fundación conozca mejor tu
            hogar y pueda revisar tu solicitud con cariño y responsabilidad.
          </p>
        </div>
        <a className="detail-back-link" href={`/mascotas/${pet.id}`}>
          Volver a {pet.nombre}
        </a>
      </div>

      <div className="adoption-layout">
        <form className="adoption-form-card" onSubmit={handleSubmit}>
          <section className="adoption-form-section">
            <div className="adoption-section-heading">
              <span>01</span>
              <div>
                <h3>Información de tu perfil</h3>
                <p>Estos datos vienen de tu sesión actual en AdoptaLove.</p>
              </div>
            </div>

            {!hasCurrentUser && (
              <div className="adoption-login-required">
                <p className="adoption-feedback adoption-feedback-error">
                  Debes iniciar sesión para postular a una adopción.
                </p>
                <a href="/login">Iniciar sesión</a>
              </div>
            )}

            {hasCurrentUser && (
              <dl className="profile-summary-card">
                <div>
                  <dt>Nombre completo</dt>
                  <dd>{currentUser.nombre}</dd>
                </div>
                <div>
                  <dt>Correo electrónico</dt>
                  <dd>{currentUser.email}</dd>
                </div>
                <div>
                  <dt>RUT</dt>
                  <dd>{currentUser.rut || 'No indicado'}</dd>
                </div>
                <div>
                  <dt>Teléfono</dt>
                  <dd>{currentUser.telefono}</dd>
                </div>
                <div>
                  <dt>Dirección</dt>
                  <dd>{currentUser.direccion}</dd>
                </div>
              </dl>
            )}

            {hasCurrentUser && activeApplicationStatus === 'loading' && (
              <p className="adoption-feedback adoption-feedback-submitting">
                Revisando si tienes una postulaci?n activa...
              </p>
            )}

            {hasCurrentUser && isActiveApplication(activeApplication) && (
              <p className="adoption-feedback adoption-feedback-error">
                {ACTIVE_APPLICATION_MESSAGE}
              </p>
            )}
          </section>

          <section className="adoption-form-section">
            <div className="adoption-section-heading">
              <span>02</span>
              <div>
                <h3>Información sobre tu hogar</h3>
                <p>Ayúdanos a entender el entorno donde vivirá tu nuevo compañero.</p>
              </div>
            </div>

            <div className="adoption-fields-grid">
              <FormField label="¿Vives en casa o departamento?" name="home-type">
                <select
                  id="home-type"
                  onChange={(event) => updateField('homeType', event.target.value)}
                  value={form.homeType}
                >
                  <option value="">Selecciona una opción</option>
                  <option value="Casa">Casa</option>
                  <option value="Departamento">Departamento</option>
                  <option value="Otro tipo de vivienda">Otro tipo de vivienda</option>
                </select>
              </FormField>

              <FormField label="¿Tienes patio o espacio al aire libre?" name="outdoor-space">
                <select
                  id="outdoor-space"
                  onChange={(event) => updateField('outdoorSpace', event.target.value)}
                  value={form.outdoorSpace}
                >
                  <option value="">Selecciona una opción</option>
                  <option value="Sí, tengo patio o espacio al aire libre">Sí</option>
                  <option value="No tengo patio, pero tengo espacio interior">No</option>
                  <option value="Tengo acceso a áreas verdes cercanas">Áreas verdes cercanas</option>
                </select>
              </FormField>

              <FormField label="¿Cuántas personas viven en tu hogar?" name="household-people">
                <select
                  id="household-people"
                  onChange={(event) => updateField('householdPeople', event.target.value)}
                  value={form.householdPeople}
                >
                  <option value="">Selecciona una opción</option>
                  <option value="Vivo solo/a">Vivo solo/a</option>
                  <option value="2 personas">2 personas</option>
                  <option value="3 a 4 personas">3 a 4 personas</option>
                  <option value="5 o más personas">5 o más personas</option>
                </select>
              </FormField>

              <FormField label="¿Tienes otras mascotas actualmente?" name="other-pets">
                <select
                  id="other-pets"
                  onChange={(event) => updateField('hasOtherPets', event.target.value)}
                  value={form.hasOtherPets}
                >
                  <option value="">Selecciona una opción</option>
                  <option value="Sí, tengo otras mascotas">Sí</option>
                  <option value="No tengo otras mascotas">No</option>
                </select>
              </FormField>
            </div>

            <FormField label="Cuéntanos sobre ellas" name="other-pets-details">
              <textarea
                id="other-pets-details"
                onChange={(event) => updateField('otherPetsDetails', event.target.value)}
                placeholder="Tipo de mascota, edad, carácter, convivencia..."
                rows="3"
                value={form.otherPetsDetails}
              />
            </FormField>
          </section>

          <section className="adoption-form-section">
            <div className="adoption-section-heading">
              <span>03</span>
              <div>
                <h3>Sobre la adopción</h3>
                <p>Queremos conocer tu motivación y compromiso.</p>
              </div>
            </div>

            <FormField label="¿Por qué quieres adoptar?" name="adoption-reason">
              <textarea
                id="adoption-reason"
                onChange={(event) => updateField('adoptionReason', event.target.value)}
                placeholder="Cuéntanos tus motivos para adoptar..."
                rows="5"
                value={form.adoptionReason}
              />
            </FormField>

            <div className="adoption-fields-grid">
              <FormField label="¿Cuánto tiempo sueles estar en casa?" name="time-at-home">
                <select
                  id="time-at-home"
                  onChange={(event) => updateField('timeAtHome', event.target.value)}
                  value={form.timeAtHome}
                >
                  <option value="">Selecciona una opción</option>
                  <option value="Menos de 4 horas al día">Menos de 4 horas al día</option>
                  <option value="Entre 4 y 8 horas al día">Entre 4 y 8 horas al día</option>
                  <option value="La mayor parte del día">La mayor parte del día</option>
                  <option value="Trabajo desde casa o tengo alta disponibilidad">
                    Trabajo desde casa
                  </option>
                </select>
              </FormField>

              <FormField
                label="¿Quién será el principal responsable de la mascota?"
                name="responsible-person"
              >
                <select
                  id="responsible-person"
                  onChange={(event) => updateField('responsiblePerson', event.target.value)}
                  value={form.responsiblePerson}
                >
                  <option value="">Selecciona una opción</option>
                  <option value="Yo seré el principal responsable">Yo</option>
                  <option value="Mi familia compartirá la responsabilidad">Mi familia</option>
                  <option value="Otra persona del hogar será responsable">Otra persona</option>
                </select>
              </FormField>
            </div>

            <fieldset className="adoption-radio-group">
              <legend>¿Estás dispuesto/a a cubrir gastos de alimentación y salud?</legend>
              <label>
                <input
                  checked={form.canCoverCosts === 'Sí, puedo cubrir alimentación y salud'}
                  name="can-cover-costs"
                  onChange={(event) => updateField('canCoverCosts', event.target.value)}
                  type="radio"
                  value="Sí, puedo cubrir alimentación y salud"
                />
                Sí, estoy dispuesto/a
              </label>
              <label>
                <input
                  checked={form.canCoverCosts === 'Necesito más información sobre gastos'}
                  name="can-cover-costs"
                  onChange={(event) => updateField('canCoverCosts', event.target.value)}
                  type="radio"
                  value="Necesito más información sobre gastos"
                />
                Necesito más información
              </label>
            </fieldset>

            <fieldset className="adoption-radio-group">
              <legend>¿Aceptas visitas de seguimiento después de la adopción?</legend>
              <label>
                <input
                  checked={form.acceptsFollowUp === 'Sí, acepto visitas de seguimiento'}
                  name="accepts-follow-up"
                  onChange={(event) => updateField('acceptsFollowUp', event.target.value)}
                  type="radio"
                  value="Sí, acepto visitas de seguimiento"
                />
                Sí, por supuesto
              </label>
              <label>
                <input
                  checked={form.acceptsFollowUp === 'Prefiero hablarlo después'}
                  name="accepts-follow-up"
                  onChange={(event) => updateField('acceptsFollowUp', event.target.value)}
                  type="radio"
                  value="Prefiero hablarlo después"
                />
                Prefiero hablarlo después
              </label>
            </fieldset>
          </section>

          {submitFeedback && (
            <p className={`adoption-feedback adoption-feedback-${submitStatus}`}>
              {submitFeedback}
            </p>
          )}

          <button
            className="adoption-submit-button"
            disabled={submitStatus === 'submitting' || !hasCurrentUser || isActiveApplication(activeApplication)}
            type="submit"
          >
            {submitStatus === 'submitting'
              ? 'Enviando solicitud...'
              : 'Enviar solicitud de adopción'}
          </button>
        </form>

        <aside className="adoption-sidebar" aria-label="Información de la postulación">
          <div className="adoption-info-card">
            <h3>Información importante</h3>
            <ul>
              <li>
                <strong>Adoptar es un compromiso</strong>
                <span>Una mascota necesita amor, tiempo y cuidados durante muchos años.</span>
              </li>
              <li>
                <strong>Proceso responsable</strong>
                <span>La fundación revisará tu solicitud antes de confirmar una adopción.</span>
              </li>
              <li>
                <strong>Seguimiento</strong>
                <span>La idea es acompañar la adaptación y asegurar que todo vaya bien.</span>
              </li>
            </ul>
          </div>

          <div className="adoption-pet-card">
            <span>Mascota que te interesa</span>
            <div className="adoption-pet-image-wrap">
              <PetImage name={pet.nombre} url={pet.foto_url} />
            </div>
            <h3>{pet.nombre}</h3>
            <p>
              {pet.especie} <span>•</span> {formatAge(pet.edad_anios)} <span>•</span>{' '}
              {formatStatus(pet.tamano)}
            </p>
            <small>Publicada por {pet.publicada_por}</small>
          </div>

          <div className="adoption-help-card">
            <h3>¿Dudas?</h3>
            <p>Estamos aquí para ayudarte durante el proceso de adopción.</p>
            <a href="/">Volver a compañeros</a>
          </div>
        </aside>
      </div>
    </section>
  );
}
