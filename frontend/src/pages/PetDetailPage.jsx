import { useEffect, useState } from 'react';
import { apiClient } from '../services/apiClient';
import { displayText } from '../utils/displayText';
import { getMediaUrl } from '../utils/mediaUrl';
import { formatPetAge } from '../utils/petDisplay';

function formatStatus(status = '') {
  return status
    .split('_')
    .map((word) => word.charAt(0).toUpperCase() + word.slice(1))
    .join(' ');
}

function DetailImage({ name, url }) {
  const [hasError, setHasError] = useState(false);

  useEffect(() => {
    setHasError(false);
  }, [url]);

  if (!url || hasError) {
    return (
      <div className="detail-image-placeholder">
        <span aria-hidden="true">♡</span>
        <strong>Sin imagen</strong>
      </div>
    );
  }

  return (
    <img
      alt={`Foto de ${name}`}
      className="detail-image"
      onError={() => setHasError(true)}
      src={getMediaUrl(url)}
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
            <p>{displayText(errorMessage)}</p>
          <a className="detail-back-link" href="/mascotas">Volver a compañeros</a>
        </div>
      </section>
    );
  }

  return (
    <section className="pet-detail-page">
      <div className="detail-hero">
        <a className="detail-back-link" href="/mascotas">Volver a compañeros</a>
        <div>
          <p className="section-kicker">Información compañero</p>
          <h2>{displayText(pet.nombre)}</h2>
          <p>
            Conoce sus datos principales antes de iniciar una postulación de
            adopción.
          </p>
        </div>
      </div>

      <div className="detail-layout">
        <div className="detail-main">
          <div className="detail-image-card">
            <DetailImage name={displayText(pet.nombre)} url={pet.foto_url} />
            <span className={`pet-status pet-status-${pet.estado}`}>
              {formatStatus(pet.estado)}
            </span>
          </div>

          <article className="detail-info-card">
            <div className="detail-title-row">
              <div>
                <h3>{displayText(pet.nombre)}</h3>
                <p>{displayText(pet.especie)}</p>
              </div>
              <span>{formatStatus(pet.estado)}</span>
            </div>

            <p className="detail-published-by">
              Publicada por <strong>{displayText(pet.publicada_por)}</strong>
            </p>

            <dl className="detail-facts">
              <div>
                <dt>Especie</dt>
                <dd>{displayText(pet.especie)}</dd>
              </div>
              <div>
                <dt>Raza</dt>
                <dd>{displayText(pet.raza, 'No indicada') || 'No indicada'}</dd>
              </div>
              <div>
                <dt>Sexo</dt>
                <dd>{formatStatus(pet.sexo)}</dd>
              </div>
              <div>
                <dt>Edad</dt>
                <dd>{formatPetAge(pet.edad_anios, pet.edad_meses)}</dd>
              </div>
              <div>
                <dt>Tamaño</dt>
                <dd>{formatStatus(pet.tamano)}</dd>
              </div>
            </dl>

            <div className="detail-description">
              <h4>Descripción</h4>
              <p>{displayText(pet.descripcion, 'Aún no hay descripción disponible.') || 'Aún no hay descripción disponible.'}</p>
            </div>
          </article>
        </div>

        <aside className="detail-sidebar" aria-label="Acciones de adopción">
          <div className="adoption-card">
            <p>¿Quieres adoptar a {displayText(pet.nombre)}?</p>
            <a className="detail-primary-action" href={`/mascotas/${pet.id}/postular`}>
              Postular adopción
            </a>
            <a className="detail-secondary-action" href="/mascotas">
              Volver a compañeros
            </a>
          </div>

          <div className="publisher-card">
            <span>Publicado por</span>
            <strong>{displayText(pet.publicada_por)}</strong>
            <p>
              Puedes revisar más compañeros disponibles en AdoptaLove.
            </p>
          </div>
        </aside>
      </div>
    </section>
  );
}
