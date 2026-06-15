import logoAdoptaLove from '../assets/logo-adoptalove.png';

const SOCIAL_LINKS = [
  {
    label: 'Instagram',
    href: 'https://www.instagram.com/adopta.love2026'
  },
  {
    label: 'TikTok',
    href: 'https://www.tiktok.com/@adopta.love'
  }
];

export function Footer() {
  return (
    <footer className="site-footer">
      <div className="site-footer-grid">
        <section className="site-footer-brand" aria-label="AdoptaLove">
          <a className="site-footer-logo" href="/">
            <img alt="" aria-hidden="true" src={logoAdoptaLove} />
            <span>AdoptaLove</span>
          </a>
          <p>
            Conectamos mascotas con personas que buscan adoptar con
            responsabilidad y amor.
          </p>
        </section>

        <nav className="site-footer-column" aria-label="Explorar">
          <h2>Explorar</h2>
          <a href="/">Inicio</a>
          <a href="/mascotas">Compañeros disponibles</a>
          <a href="/sobre-nosotros">Sobre nosotros</a>
          <a href="/donaciones">Donaciones</a>
        </nav>

        <nav className="site-footer-column" aria-label="Ayuda">
          <h2>Ayuda</h2>
          <a href="/sobre-nosotros#contacto">Contacto</a>
          <a href="/sobre-nosotros#preguntas-frecuentes">Preguntas frecuentes</a>
          <a href="/chatbot">Chatbot o Ayuda</a>
        </nav>

        <nav className="site-footer-column" aria-label="Redes sociales">
          <h2>Redes sociales</h2>
          {SOCIAL_LINKS.map((link) => (
            <a
              href={link.href}
              key={link.href}
              rel="noopener noreferrer"
              target="_blank"
            >
              {link.label}
            </a>
          ))}
        </nav>
      </div>

      <div className="site-footer-bottom">
        <span>© 2026 AdoptaLove. Todos los derechos reservados.</span>
        <span>Cada mascota merece un hogar lleno de amor.</span>
      </div>
    </footer>
  );
}
