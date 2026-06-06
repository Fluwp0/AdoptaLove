import { useEffect, useMemo, useState } from 'react';
import { apiClient } from '../services/apiClient';

const API_URL = import.meta.env.VITE_API_URL ?? 'http://localhost:3000/api';

const FILTERS = [
  { label: 'Todos', value: 'all' },
  { label: 'Perros', value: 'perro' },
  { label: 'Gatos', value: 'gato' },
  { label: 'Otros', value: 'otros' }
];

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

function matchesFilter(pet, activeFilter) {
  const species = pet.especie?.toLowerCase() ?? '';

  if (activeFilter === 'all') {
    return true;
  }

  if (activeFilter === 'perro') {
    return species.includes('perro');
  }

  if (activeFilter === 'gato') {
    return species.includes('gato');
  }

  return !species.includes('perro') && !species.includes('gato');
}

function matchesSearch(pet, searchTerm) {
  const normalizedTerm = searchTerm.trim().toLowerCase();

  if (!normalizedTerm) {
    return true;
  }

  return [
    pet.nombre,
    pet.especie,
    pet.raza,
    pet.sexo,
    pet.tamano,
    pet.estado,
    pet.descripcion,
    pet.publicada_por
  ]
    .filter(Boolean)
    .some((value) => value.toLowerCase().includes(normalizedTerm));
}

export function HomePage() {
  const [pets, setPets] = useState([]);
  const [status, setStatus] = useState('loading');
  const [errorMessage, setErrorMessage] = useState('');
  const [activeFilter, setActiveFilter] = useState('all');
  const [searchTerm, setSearchTerm] = useState('');

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

  const visiblePets = useMemo(
    () =>
      pets.filter(
        (pet) => matchesFilter(pet, activeFilter) && matchesSearch(pet, searchTerm)
      ),
    [activeFilter, pets, searchTerm]
  );

  return (
    <section className="catalog-page">
      <div className="catalog-hero">
        <div>
          <p className="section-kicker">Compañeros disponibles</p>
          <h2>Encuentra a tu nuevo mejor amigo</h2>
          <p className="catalog-subtitle">
            Mascotas reales conectadas desde AdoptaLove, listas para conocer una
            familia con mucho amor.
          </p>
        </div>

        <form className="catalog-search" role="search">
          <label htmlFor="pet-search">Buscar mascota</label>
          <input
            id="pet-search"
            onChange={(event) => setSearchTerm(event.target.value)}
            placeholder="Buscar mascota..."
            type="search"
            value={searchTerm}
          />
        </form>
      </div>

      <div className="catalog-toolbar" aria-label="Filtros de mascotas">
        <div className="filter-tabs">
          {FILTERS.map((filter) => (
            <button
              className={activeFilter === filter.value ? 'filter-tab active' : 'filter-tab'}
              key={filter.value}
              onClick={() => setActiveFilter(filter.value)}
              type="button"
            >
              {filter.label}
            </button>
          ))}
        </div>
        <button className="filter-button" type="button">Filtrar</button>
      </div>

      {status === 'loading' && (
        <div className="catalog-state">Cargando mascotas...</div>
      )}

      {status === 'error' && (
        <div className="catalog-state catalog-state-error">{errorMessage}</div>
      )}

      {status === 'success' && (
        <>
          <div className="catalog-summary">
            <span>{visiblePets.length} mascotas encontradas</span>
            <span>Cada mascota merece un hogar lleno de amor</span>
          </div>

          <div className="pet-grid">
            {visiblePets.map((pet) => (
              <article className="pet-card" key={pet.id}>
                <div className="pet-image-wrap">
                  <PetImage name={pet.nombre} url={pet.foto_url} />
                  <span className={`pet-status pet-status-${pet.estado}`}>
                    {formatStatus(pet.estado)}
                  </span>
                  <button
                    aria-label={`Guardar ${pet.nombre} como favorito`}
                    className="favorite-button"
                    type="button"
                  >
                    Favorito
                  </button>
                </div>

                <div className="pet-card-body">
                  <div className="pet-title-row">
                    <div>
                      <h3>{pet.nombre}</h3>
                      <p>{pet.especie}</p>
                    </div>
                    <span>{pet.publicada_por}</span>
                  </div>

                  <p className="pet-quick-info">
                    {formatAge(pet.edad_anios)} <span>•</span> {formatStatus(pet.tamano)}
                  </p>

                  <dl className="pet-facts">
                    <div>
                      <dt>Raza</dt>
                      <dd>{pet.raza || 'No indicada'}</dd>
                    </div>
                    <div>
                      <dt>Sexo</dt>
                      <dd>{formatStatus(pet.sexo)}</dd>
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

          {!visiblePets.length && (
            <div className="catalog-state">
              No encontramos mascotas con esos filtros por ahora.
            </div>
          )}
        </>
      )}
    </section>
  );
}
