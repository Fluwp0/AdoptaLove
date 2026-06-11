import { useEffect, useState } from 'react';
import logoAdoptaLove from '../../assets/logo-adoptalove.png';
import { clearSession, getCurrentUser, onSessionChange } from '../../services/authSession';

export function AppLayout({ children }) {
  const [user, setUser] = useState(getCurrentUser());

  useEffect(() => onSessionChange(setUser), []);

  function handleLogout() {
    clearSession();
    window.location.href = '/';
  }

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
          {user ? (
            <>
              <span className="header-user">Hola, {user.nombre}</span>
              <a className="header-button header-button-ghost" href="/perfil">Mi perfil</a>
              <button className="header-button header-button-solid" onClick={handleLogout} type="button">
                Cerrar sesión
              </button>
            </>
          ) : (
            <>
              <a className="header-button header-button-ghost" href="/login">Iniciar sesión</a>
              <a className="header-button header-button-solid" href="/registro">Registrarse</a>
            </>
          )}
        </div>
      </header>
      <main>{children}</main>
    </div>
  );
}
