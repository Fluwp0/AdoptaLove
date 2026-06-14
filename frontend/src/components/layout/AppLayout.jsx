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
  const isAdminUser = ['administrador', 'admin'].includes(user?.rol);
  const isAdminHomeActive = currentPath === '/admin' || currentPath === '/admin/inicio';
  const isAdminUsersActive = currentPath.startsWith('/admin/usuarios');
  const isAdminPublicationsActive = currentPath.startsWith('/admin/publicaciones');
  const isAdminChangesActive = currentPath.startsWith('/admin/modificaciones');
  const canAccessFoundationPanel = !isAdminUser && ['fundacion'].includes(user?.rol);
  const userName = displayText(user?.nombre);
  const greetingText = isAdminUser || canAccessFoundationPanel ? 'Hola' : `Hola, ${userName}`;

  useEffect(() => onSessionChange(setUser), []);

  function handleLogout() {
    clearSession();
    window.location.href = '/';
  }

  return (
    <div className="app-shell">
      <header className="app-header">
        <a className="brand" href={isAdminUser ? '/admin' : '/'} aria-label="Ir al inicio de AdoptaLove">
          <img
            alt=""
            aria-hidden="true"
            className="brand-logo"
            src={logoAdoptaLove}
          />
          <span className="brand-name">AdoptaLove</span>
        </a>

        <nav className={isAdminUser ? 'main-nav admin-nav' : 'main-nav'} aria-label={isAdminUser ? 'Navegación administrador' : 'Navegación principal'}>
          {isAdminUser ? (
            <>
              <a
                aria-current={isAdminHomeActive ? 'page' : undefined}
                className={isAdminHomeActive ? 'active' : ''}
                href="/admin"
              >
                Inicio admin
              </a>
              <a
                aria-current={isAdminUsersActive ? 'page' : undefined}
                className={isAdminUsersActive ? 'active' : ''}
                href="/admin/usuarios"
              >
                Administración de usuarios
              </a>
              <a
                aria-current={isAdminPublicationsActive ? 'page' : undefined}
                className={isAdminPublicationsActive ? 'active' : ''}
                href="/admin/publicaciones"
              >
                Publicaciones
              </a>
              <a
                aria-current={isAdminChangesActive ? 'page' : undefined}
                className={isAdminChangesActive ? 'active' : ''}
                href="/admin/modificaciones"
              >
                Modificaciones
              </a>
            </>
          ) : (
            <>
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
            </>
          )}
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
