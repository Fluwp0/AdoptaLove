import logoAdoptaLove from '../../assets/logo-adoptalove.png';

export function AppLayout({ children }) {
  return (
    <div className="app-shell">
      <header className="app-header">
        <a className="brand" href="/" aria-label="Ir al inicio de AdoptaLove">
          <img
            alt=""
            aria-hidden="true"
            className="brand-logo"
            src={logoAdoptaLove}
          />
          <span className="brand-name">AdoptaLove</span>
        </a>

        <nav className="main-nav" aria-label="Navegación principal">
          <a href="/">Inicio</a>
          <a className="active" href="/">Compañeros disponibles</a>
          <a href="/">Sobre nosotros</a>
          <a href="/">Contacto</a>
        </nav>

        <div className="header-actions">
          <a className="header-button header-button-ghost" href="/">Iniciar sesión</a>
          <a className="header-button header-button-solid" href="/">Registrarse</a>
        </div>
      </header>
      <main>{children}</main>
    </div>
  );
}
