import { useEffect, useState } from 'react';
import { apiClient } from '../services/apiClient';

const API_URL = import.meta.env.VITE_API_URL ?? 'http://localhost:3000/api';

function formatAge(age) {
  if (age === null || age === undefined) {
    return 'Edad no indicada';
  }

  return age === 1 ? '1 año' : `${age} años`;
}

function formatStatus(status) {
  return status
    .split('_')
    .map((word) => word.charAt(0).toUpperCase() + word.slice(1))
    .join(' ');
}

function PetImage({ name, url }) {
  const [hasError, setHasError] = useState(false);

  if (!url || hasError) {
    return <div className="pet-image-placeholder">Sin imagen</div>;
  }

  return (
    <img
      alt={`Foto de ${name}`}
      className="pet-image"
      onError={() => setHasError(true)}
      src={url}
    />
  );
}

export function HomePage() {
  const [pets, setPets] = useState([]);
  const [status, setStatus] = useState('loading');
  const [errorMessage, setErrorMessage] = useState('');

  useEffect(() => {
    let isMounted = true;

    async function loadPets() {
      try {
        const response = await apiClient('/mascotas');

        if (!response.ok) {
          throw new Error('No se pudieron cargar las mascotas.');
        }

        const payload = await response.json();

        if (isMounted) {
          setPets(payload.data ?? []);
          setStatus('success');
        }
      } catch (error) {
        if (isMounted) {
          setErrorMessage(error.message);
          setStatus('error');
        }
      }
    }

    loadPets();

    return () => {
      isMounted = false;
    };
  }, []);

  return (
    <section className="catalog-page">
      <div className="catalog-header">
        <div>
          <p className="section-kicker">Catálogo de mascotas</p>
          <h2>Encuentra una compañía lista para adoptar</h2>
        </div>
        <span className="catalog-count">{pets.length} disponibles</span>
      </div>

      {status === 'loading' && (
        <div className="catalog-state">Cargando mascotas...</div>
      )}

      {status === 'error' && (
        <div className="catalog-state catalog-state-error">{errorMessage}</div>
      )}

      {status === 'success' && (
        <div className="pet-grid">
          {pets.map((pet) => (
            <article className="pet-card" key={pet.id}>
              <div className="pet-image-wrap">
                <PetImage name={pet.nombre} url={pet.foto_url} />
                <span className={`pet-status pet-status-${pet.estado}`}>
                  {formatStatus(pet.estado)}
                </span>
              </div>

              <div className="pet-card-body">
                <div className="pet-title-row">
                  <div>
                    <h3>{pet.nombre}</h3>
                    <p>{pet.publicada_por}</p>
                  </div>
                  <span>{pet.especie}</span>
                </div>

                <dl className="pet-facts">
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

                <p className="pet-description">{pet.descripcion}</p>

                <a
                  className="pet-detail-link"
                  href={`${API_URL}/mascotas/${pet.id}`}
                  rel="noreferrer"
                  target="_blank"
                >
                  Ver detalle
                </a>
              </div>
            </article>
          ))}
        </div>
      )}
    </section>
  );
}
