import { useEffect, useState } from 'react';
import { apiClient } from '../services/apiClient';

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

function DetailImage({ name, url }) {
  const [hasError, setHasError] = useState(false);

  if (!url || hasError) {
    return <div className="detail-image-placeholder">Sin imagen</div>;
  }

  return (
    <img
      alt={`Foto de ${name}`}
      className="detail-image"
      onError={() => setHasError(true)}
      src={url}
    />
  );
}

export function PetDetailPage({ petId }) {
  const [pet, setPet] = useState(null);
  const [status, setStatus] = useState('loading');
  const [errorMessage, setErrorMessage] = useState('');

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
          setStatus('success');
        }
      } catch (error) {
        if (isMounted) {
          setErrorMessage(error.message);
          setStatus('error');
        }
      }
    }

    loadPet();

    return () => {
      isMounted = false;
    };
  }, [petId]);

  if (status === 'loading') {
    return (
      <section className="pet-detail-page">
        <div className="detail-state">Cargando información de la mascota...</div>
      </section>
    );
  }

  if (status === 'error') {
    return (
      <section className="pet-detail-page">
        <div className="detail-state detail-state-error">
          <p>{errorMessage}</p>
          <a className="detail-back-link" href="/">Volver a compañeros</a>
        </div>
      </section>
    );
  }

  return (
    <section className="pet-detail-page">
      <div className="detail-hero">
        <a className="detail-back-link" href="/">Volver a compañeros</a>
        <div>
          <p className="section-kicker">Información compañero</p>
          <h2>{pet.nombre}</h2>
          <p>
            Conoce sus datos principales antes de iniciar una postulación de
            adopción.
          </p>
        </div>
      </div>

      <div className="detail-layout">
        <div className="detail-main">
          <div className="detail-image-card">
            <DetailImage name={pet.nombre} url={pet.foto_url} />
            <span className={`pet-status pet-status-${pet.estado}`}>
              {formatStatus(pet.estado)}
            </span>
          </div>

          <article className="detail-info-card">
            <div className="detail-title-row">
              <div>
                <h3>{pet.nombre}</h3>
                <p>{pet.especie}</p>
              </div>
              <span>{formatStatus(pet.estado)}</span>
            </div>

            <p className="detail-published-by">
              Publicada por <strong>{pet.publicada_por}</strong>
            </p>

            <dl className="detail-facts">
              <div>
                <dt>Especie</dt>
                <dd>{pet.especie}</dd>
              </div>
              <div>
                <dt>Raza</dt>
                <dd>{pet.raza || 'No indicada'}</dd>
              </div>
              <div>
                <dt>Sexo</dt>
                <dd>{formatStatus(pet.sexo)}</dd>
              </div>
              <div>
                <dt>Edad</dt>
                <dd>{formatAge(pet.edad_anios)}</dd>
              </div>
              <div>
                <dt>Tamaño</dt>
                <dd>{formatStatus(pet.tamano)}</dd>
              </div>
            </dl>

            <div className="detail-description">
              <h4>Descripción</h4>
              <p>{pet.descripcion || 'Aún no hay descripción disponible.'}</p>
            </div>
          </article>
        </div>

        <aside className="detail-sidebar" aria-label="Acciones de adopción">
          <div className="adoption-card">
            <p>¿Quieres adoptar a {pet.nombre}?</p>
            <a className="detail-primary-action" href={`/mascotas/${pet.id}/postular`}>
              Postular adopción
            </a>
            <a className="detail-secondary-action" href="/">
              Volver a compañeros
            </a>
          </div>

          <div className="publisher-card">
            <span>Publicado por</span>
            <strong>{pet.publicada_por}</strong>
            <p>
              Puedes revisar más compañeros disponibles en AdoptaLove.
            </p>
          </div>
        </aside>
      </div>
    </section>
  );
}
