import { useEffect, useState } from 'react';
import logoAdoptaLove from '../assets/logo-adoptalove.png';
import { apiClient } from '../services/apiClient';

const CONTACT_EMAIL = 'Adopta.Love2026@gmail.com';

const FAQ_ITEMS = [
  {
    question: '¿Cómo puedo adoptar una mascota?',
    answer:
      'Selecciona la mascota que te interese, revisa su información y presiona el botón Contactar. Te pondremos en contacto con el refugio o persona responsable.'
  },
  {
    question: '¿Las mascotas están vacunadas y esterilizadas?',
    answer:
      'Depende de cada caso. En la ficha de cada mascota se indican sus datos de salud disponibles, como vacunas, esterilización, desparasitación o microchip.'
  },
  {
    question: '¿Puedo adoptar si vivo en departamento?',
    answer:
      'Sí. Lo importante es elegir una mascota compatible con tu espacio, tiempo disponible y estilo de vida.'
  },
  {
    question: '¿Qué costo tiene adoptar una mascota?',
    answer:
      'AdoptaLove no vende mascotas. Si una fundación solicita algún aporte propio dentro de su proceso, debe informarlo directamente y con claridad. Las donaciones de AdoptaLove apoyan la mantención y mejora de la plataforma.'
  },
  {
    question: '¿Qué pasa después de enviar una solicitud?',
    answer:
      'La fundación revisa la información enviada y se comunica contigo para continuar el proceso de adopción responsable.'
  }
];

const CONTACT_ITEMS = [
  {
    icon: '💌',
    label: 'Correo',
    value: CONTACT_EMAIL,
    href: `mailto:${CONTACT_EMAIL}`
  },
  {
    icon: '📍',
    label: 'Ubicación',
    value: 'Santiago, Chile'
  }
];

const SOCIAL_LINKS = [
  {
    icon: 'instagram',
    label: 'Instagram',
    handle: '@adopta.love2026',
    href: 'https://www.instagram.com/adopta.love2026'
  },
  {
    icon: 'tiktok',
    label: 'TikTok',
    handle: '@adopta.love',
    href: 'https://www.tiktok.com/@adopta.love'
  }
];

const COMMITMENT_ITEMS = [
  'Hogares responsables',
  'Bienestar animal',
  'Apoyo a refugios',
  'Comunidad con amor'
];

function InstagramIcon() {
  return (
    <svg
      aria-hidden="true"
      className="about-instagram-icon"
      focusable="false"
      viewBox="0 0 64 64"
    >
      <rect className="about-instagram-frame" height="42" rx="12" width="42" x="11" y="11" />
      <circle className="about-instagram-lens" cx="32" cy="32" r="10" />
      <circle className="about-instagram-dot" cx="44" cy="20" r="3.2" />
    </svg>
  );
}

function TikTokIcon() {
  return (
    <svg
      aria-hidden="true"
      className="about-tiktok-icon"
      focusable="false"
      viewBox="0 0 64 64"
    >
      <path
        className="about-tiktok-soft-shadow"
        d="M38.3 13.5c1.4 6.1 5.9 10.4 12.2 11.5v8.7a22.5 22.5 0 0 1-12-3.8v13.7c0 8.2-6.4 14.8-14.6 14.8-7.7 0-13.9-5.8-13.9-13 0-8.1 6.8-13.9 15.2-12.8v8.8c-3.7-.9-6.7 1.2-6.7 4.3 0 2.9 2.4 5 5.4 5 3.3 0 5.6-2.5 5.6-6V13.5h8.8Z"
      />
      <path
        className="about-tiktok-accent"
        d="M35.8 11.5c1.5 6 6 10.2 12.2 11.4v7.2a21.6 21.6 0 0 1-11.8-3.9v14.9c0 7.6-5.8 13.8-13.3 13.8-6.9 0-12.4-5.1-12.4-11.5 0-7.4 6.1-12.5 13.6-11.4v7.4c-3.5-1-6.4 1-6.4 4.1 0 2.8 2.3 4.9 5.3 4.9 3.4 0 5.6-2.5 5.6-6V11.5h7.2Z"
      />
    </svg>
  );
}

function SocialIcon({ icon }) {
  if (icon === 'instagram') {
    return <InstagramIcon />;
  }

  if (icon === 'tiktok') {
    return <TikTokIcon />;
  }

  return <span aria-hidden="true">{icon}</span>;
}

export function AboutPage() {
  const [stats, setStats] = useState({
    familiasFelices: 0,
    mascotasAdoptadas: 0
  });

  useEffect(() => {
    const targetId = window.location.hash.replace('#', '') ||
      (window.location.pathname === '/contacto' ? 'contacto' : '');

    if (!targetId) {
      return;
    }

    window.requestAnimationFrame(() => {
      document.getElementById(targetId)?.scrollIntoView({ block: 'start' });
    });
  }, []);

  useEffect(() => {
    let isMounted = true;

    async function loadStats() {
      try {
        const response = await apiClient('/about/stats');
        const payload = await response.json();

        if (!response.ok) {
          throw new Error(payload.message || 'No se pudieron cargar las estadísticas.');
        }

        if (isMounted) {
          setStats({
            familiasFelices: Number(payload.data?.familiasFelices || 0),
            mascotasAdoptadas: Number(payload.data?.mascotasAdoptadas || 0)
          });
        }
      } catch (_error) {
        if (isMounted) {
          setStats({
            familiasFelices: 0,
            mascotasAdoptadas: 0
          });
        }
      }
    }

    loadStats();

    return () => {
      isMounted = false;
    };
  }, []);

  return (
    <section className="about-page">
      <section className="about-hero" aria-labelledby="about-title">
        <div>
          <span className="about-pill">Sobre nosotros</span>
          <h1 id="about-title">Sobre AdoptaLove</h1>
          <p>
            Somos una plataforma dedicada a conectar mascotas que buscan un
            hogar con personas que quieren dar y recibir amor.
          </p>

          <div className="about-indicators" aria-label="Indicadores de AdoptaLove">
            <article>
              <strong>{stats.mascotasAdoptadas}</strong>
              <span>Mascotas adoptadas</span>
            </article>
            <article>
              <strong>{stats.familiasFelices}</strong>
              <span>Familias felices</span>
            </article>
            <article>
              <strong>100%</strong>
              <span>Compromiso y amor</span>
            </article>
          </div>
        </div>

        <aside className="about-visual-card" aria-label="AdoptaLove conecta hogares">
          <div className="about-logo-badge">
            <img alt="AdoptaLove" src={logoAdoptaLove} />
          </div>
          <div className="about-visual-icons">
            <span aria-hidden="true">🐾</span>
            <span aria-hidden="true">💗</span>
            <span aria-hidden="true">🏡</span>
          </div>
          <p>Historias de adopción responsable, cuidado y comunidad.</p>
        </aside>
      </section>

      <section className="about-section about-faq-card" id="preguntas-frecuentes">
        <div className="about-section-heading">
          <span>Ayuda rápida</span>
          <h2>Preguntas frecuentes</h2>
        </div>

        <div className="about-faq-list">
          {FAQ_ITEMS.map((item, index) => (
            <details className="about-faq-item" key={item.question} open={index === 0}>
              <summary>{item.question}</summary>
              <p>{item.answer}</p>
            </details>
          ))}
        </div>
      </section>

      <section className="about-section about-contact-section" id="contacto">
        <div className="about-section-heading">
          <span>Contacto</span>
          <h2>Contáctanos</h2>
          <p>Estamos aquí para ayudarte en lo que necesites.</p>
        </div>

        <div className="about-contact-grid">
          {CONTACT_ITEMS.map((item) => (
            <article className="about-contact-card" key={item.label}>
              <span aria-hidden="true">{item.icon}</span>
              <div>
                <strong>{item.label}</strong>
                {item.href ? (
                  <a href={item.href}>{item.value}</a>
                ) : (
                  <p>{item.value}</p>
                )}
              </div>
            </article>
          ))}
        </div>

        <a className="about-primary-button" href={`mailto:${CONTACT_EMAIL}`}>
          Enviar mensaje
        </a>
      </section>

      <section className="about-section">
        <div className="about-section-heading">
          <span>Redes</span>
          <h2>Síguenos en nuestras redes</h2>
        </div>

        <div className="about-social-grid">
          {SOCIAL_LINKS.map((link) => (
            <a
              className="about-social-card"
              href={link.href}
              key={link.href}
              rel="noopener noreferrer"
              target="_blank"
            >
              <SocialIcon icon={link.icon} />
              <strong>{link.label}</strong>
              <small>{link.handle}</small>
            </a>
          ))}
        </div>
      </section>

      <section className="about-section about-commitment-card">
        <div>
          <span className="about-pill">Nuestro compromiso</span>
          <h2>Nuestro compromiso</h2>
          <p>
            Promovemos la adopción responsable, el respeto animal y el
            bienestar de todos los compañeros peludos.
          </p>
        </div>

        <div className="about-commitment-grid">
          {COMMITMENT_ITEMS.map((item) => (
            <article key={item}>
              <span aria-hidden="true">💗</span>
              <strong>{item}</strong>
            </article>
          ))}
        </div>
      </section>

      <section className="about-final-band">
        <p>Cada mascota merece un hogar lleno de amor</p>
      </section>
    </section>
  );
}
