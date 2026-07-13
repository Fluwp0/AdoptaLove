import { useEffect, useMemo, useState } from 'react';
import logoAdoptaLove from '../assets/logo-adoptalove.png';
import { apiClient } from '../services/apiClient';
import { getAssetUrl } from '../utils/assetUrl';
import { displayText } from '../utils/displayText';
import { getMediaUrl } from '../utils/mediaUrl';
import { formatPetAge } from '../utils/petDisplay';

const HOW_IT_WORKS = [
  {
    icon: '🐾',
    title: 'Explora',
    text: 'Revisa los compañeros disponibles según especie, edad, tamaño o comuna.'
  },
  {
    icon: '💗',
    title: 'Postula',
    text: 'Completa una solicitud de adopción para la mascota que quieres conocer.'
  },
  {
    icon: '🏡',
    title: 'Adopta',
    text: 'La fundación revisa tu solicitud y continúa el proceso responsable.'
  }
];

function formatStatus(status = '') {
  return status
    .split('_')
    .map((word) => word.charAt(0).toUpperCase() + word.slice(1))
    .join(' ');
}

function FeaturedPetImage({ name, url }) {
  const [hasError, setHasError] = useState(false);

  useEffect(() => {
    setHasError(false);
  }, [url]);

  if (!url || hasError) {
    return (
      <div className="home-pet-placeholder">
        <span aria-hidden="true">💗</span>
        <strong>Sin imagen</strong>
      </div>
    );
  }

  return (
    <img
      alt={`Foto de ${name}`}
      className="home-pet-image"
      onError={() => setHasError(true)}
      src={getMediaUrl(url)}
    />
  );
}

export function HomePage() {
  const [pets, setPets] = useState([]);
  const [featuredStatus, setFeaturedStatus] = useState('loading');

  useEffect(() => {
    let isMounted = true;

    async function loadFeaturedPets() {
      try {
        const response = await apiClient('/mascotas');
        const payload = await response.json();

        if (!response.ok) {
          throw new Error(payload.message || 'No se pudieron cargar las mascotas.');
        }

        if (isMounted) {
          setPets(Array.isArray(payload.data) ? payload.data : []);
          setFeaturedStatus('success');
        }
      } catch (_error) {
        if (isMounted) {
          setPets([]);
          setFeaturedStatus('error');
        }
      }
    }

    loadFeaturedPets();

    return () => {
      isMounted = false;
    };
  }, []);

  const featuredPets = useMemo(() => {
    const availablePets = pets.filter((pet) => pet.estado === 'disponible');
    const sourcePets = availablePets.length > 0 ? availablePets : pets;

    return sourcePets.slice(0, 3);
  }, [pets]);

  return (
    <section className="home-page">
      <section className="home-hero" aria-labelledby="home-title">
        <div className="home-hero-copy">
          <p className="home-pill">Adopciones responsables</p>
          <h1 id="home-title">Encuentra a tu próximo compañero de vida</h1>
          <p>
            AdoptaLove conecta personas con fundaciones y mascotas que buscan
            un hogar responsable.
          </p>
          <div className="home-hero-actions">
            <a className="home-primary-button" href="/mascotas">
              Ver compañeros disponibles
            </a>
            <a className="home-secondary-button" href="/compatibilidad">
              Hacer quiz de compatibilidad
            </a>
          </div>
        </div>

        <aside className="home-hero-visual" aria-label="AdoptaLove en acción">
          <div className="home-hero-logo-card">
            <img alt="AdoptaLove" src={getAssetUrl(logoAdoptaLove)} />
            <span>Amor que encuentra hogar</span>
          </div>
          <div className="home-visual-grid">
            <div>
              <span aria-hidden="true">🐶</span>
              <strong>Perros</strong>
            </div>
            <div>
              <span aria-hidden="true">🐱</span>
              <strong>Gatos</strong>
            </div>
            <div>
              <span aria-hidden="true">🏡</span>
              <strong>Hogares</strong>
            </div>
          </div>
        </aside>
      </section>

      <section className="home-section" id="como-funciona">
        <div className="home-section-heading">
          <span>¿Cómo funciona?</span>
          <h2>Un proceso simple para adoptar con responsabilidad</h2>
        </div>

        <div className="home-steps-grid">
          {HOW_IT_WORKS.map((step) => (
            <article className="home-info-card" key={step.title}>
              <span aria-hidden="true">{step.icon}</span>
              <h3>{step.title}</h3>
              <p>{step.text}</p>
            </article>
          ))}
        </div>
      </section>

      <section className="home-section home-featured-section">
        <div className="home-section-heading">
          <span>Compañeros destacados</span>
          <h2>Compañeros que esperan un hogar</h2>
        </div>

        {featuredStatus === 'loading' && (
          <p className="home-state">Cargando compañeros destacados...</p>
        )}

        {featuredStatus === 'error' && (
          <div className="home-state">
            <p>No pudimos cargar compañeros destacados por ahora.</p>
            <a className="home-secondary-button" href="/mascotas">
              Ver todos los compañeros disponibles
            </a>
          </div>
        )}

        {featuredStatus === 'success' && featuredPets.length === 0 && (
          <div className="home-state">
            <p>No hay compañeros destacados disponibles en este momento.</p>
            <a className="home-secondary-button" href="/mascotas">
              Ver catálogo
            </a>
          </div>
        )}

        {featuredStatus === 'success' && featuredPets.length > 0 && (
          <>
            <div className="home-featured-grid">
              {featuredPets.map((pet) => (
                <article className="home-pet-card" key={pet.id}>
                  <div className="home-pet-image-wrap">
                    <FeaturedPetImage name={displayText(pet.nombre)} url={pet.foto_url} />
                    <span className={`pet-status pet-status-${pet.estado}`}>
                      {formatStatus(pet.estado)}
                    </span>
                  </div>
                  <div className="home-pet-body">
                    <h3>{displayText(pet.nombre)}</h3>
                    <p>
                      {displayText(pet.especie)} <span>•</span>{' '}
                      {formatPetAge(pet)}
                    </p>
                    <small>{displayText(pet.publicada_por, 'AdoptaLove')}</small>
                    <a className="pet-detail-link home-pet-link" href={`/mascotas/${pet.id}`}>
                      Ver más
                    </a>
                  </div>
                </article>
              ))}
            </div>
            <a className="home-section-link" href="/mascotas">
              Ver todos los compañeros disponibles
            </a>
          </>
        )}
      </section>

      <section className="home-action-grid" id="ayuda" aria-label="Más formas de participar">
        <article className="home-action-card">
          <span aria-hidden="true">💖</span>
          <div>
            <h2>También puedes ayudar</h2>
            <p>
              Tu apoyo ayuda a mantener AdoptaLove activa, disponible y en
              constante mejora para que más fundaciones puedan publicar
              mascotas y más personas puedan encontrarlas.
            </p>
          </div>
          <a className="home-primary-button" href="/donaciones">
            Quiero contribuir
          </a>
        </article>

        <article className="home-action-card">
          <span aria-hidden="true">✨</span>
          <div>
            <h2>¿Tienes dudas?</h2>
            <p>
              Nuestro asistente puede ayudarte con preguntas frecuentes sobre
              adopción, cuidados y uso de la plataforma.
            </p>
          </div>
          <a className="home-secondary-button" href="/chatbot">
            Consultar ayuda
          </a>
        </article>
      </section>

      <section className="home-final-band">
        <p>Cada mascota merece un hogar lleno de amor</p>
      </section>
    </section>
  );
}
