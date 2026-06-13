import { useEffect, useState } from 'react';
import logoAdoptaLove from '../../assets/logo-adoptalove.png';
import { ChatbotWidget } from '../ChatbotWidget';
import { clearSession, getCurrentUser, onSessionChange } from '../../services/authSession';
import { displayText } from '../../utils/displayText';

export function AppLayout({ children }) {
  const [user, setUser] = useState(getCurrentUser());
  const currentPath = window.location.pathname;
  const isHomeActive = currentPath === '/' || currentPath.startsWith('/mascotas');
  const isCompatibilityActive = currentPath.startsWith('/compatibilidad');
  const isDonationsActive = currentPath.startsWith('/donaciones');
  const isFoundationActive = currentPath.startsWith('/fundacion') || currentPath.startsWith('/panel-fundacion');
  const canAccessFoundationPanel = ['fundacion', 'administrador', 'admin'].includes(user?.rol);
  const userName = displayText(user?.nombre);
  const greetingText = canAccessFoundationPanel ? 'Hola' : `Hola, ${userName}`;

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
          <a
            aria-current={isHomeActive ? 'page' : undefined}
            className={isHomeActive ? 'active' : ''}
            href="/"
          >
            Compañeros disponibles
          </a>
          <a
            aria-current={isCompatibilityActive ? 'page' : undefined}
            className={isCompatibilityActive ? 'active' : ''}
            href="/compatibilidad"
          >
            Encuentra tu match
          </a>
          <a
            aria-current={isDonationsActive ? 'page' : undefined}
            className={isDonationsActive ? 'active' : ''}
            href="/donaciones"
          >
            Donaciones
          </a>
          <a href="/">Sobre nosotros</a>
          <a href="/">Contacto</a>
        </nav>

        <div className="header-actions">
          {user ? (
            <>
              <span className="header-user" title={`Hola, ${userName}`}>{greetingText}</span>
              {canAccessFoundationPanel && (
                <a
                  aria-current={isFoundationActive ? 'page' : undefined}
                  className={`header-button header-button-panel${isFoundationActive ? ' active' : ''}`}
                  href="/fundacion"
                >
                  Mi panel
                </a>
              )}
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
      <ChatbotWidget />
    </div>
  );
}
