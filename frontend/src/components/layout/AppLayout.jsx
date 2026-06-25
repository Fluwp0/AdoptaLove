import { useEffect, useState } from 'react';
import logoAdoptaLove from '../../assets/logo-adoptalove.png';
import { ChatbotWidget } from '../ChatbotWidget';
import { Footer } from '../Footer';
import { clearSession, getCurrentUser, onSessionChange } from '../../services/authSession';
import {
  DARK_THEME,
  LIGHT_THEME,
  THEME_STORAGE_KEY,
  applyTheme,
  getStoredTheme,
  saveTheme
} from '../../services/themePreference';
import { displayText } from '../../utils/displayText';

export function AppLayout({ children }) {
  const [user, setUser] = useState(getCurrentUser());
  const [theme, setTheme] = useState(getStoredTheme);
  const currentPath = window.location.pathname;
  const isHomeActive = currentPath === '/';
  const isCatalogActive = currentPath === '/mascotas' || currentPath.startsWith('/mascotas/');
  const isCompatibilityActive = currentPath.startsWith('/compatibilidad');
  const isDonationsActive = currentPath.startsWith('/donaciones');
  const isAboutActive = currentPath.startsWith('/sobre-nosotros') || currentPath.startsWith('/contacto');
  const isAdminRoute = currentPath.startsWith('/admin');
  const isFoundationActive = currentPath.startsWith('/fundacion') || currentPath.startsWith('/panel-fundacion');
  const isAdminUser = ['administrador', 'admin'].includes(user?.rol);
  const isAdminHomeActive = currentPath === '/admin' || currentPath === '/admin/inicio';
  const isAdminUsersActive = currentPath.startsWith('/admin/usuarios');
  const isAdminPublicationsActive = currentPath.startsWith('/admin/publicaciones');
  const isAdminChangesActive = currentPath.startsWith('/admin/modificaciones');
  const canAccessFoundationPanel = !isAdminUser && ['fundacion'].includes(user?.rol);
  const userName = displayText(user?.nombre);
  const greetingText = isAdminUser || canAccessFoundationPanel ? 'Hola' : `Hola, ${userName}`;
  const isDarkTheme = theme === DARK_THEME;

  useEffect(() => onSessionChange(setUser), []);

  useEffect(() => {
    function handleThemeStorage(event) {
      if (event.key === THEME_STORAGE_KEY) {
        setTheme(applyTheme(getStoredTheme()));
      }
    }

    window.addEventListener('storage', handleThemeStorage);

    return () => {
      window.removeEventListener('storage', handleThemeStorage);
    };
  }, []);

  function handleLogout() {
    clearSession();
    window.location.href = '/';
  }

  function handleThemeToggle() {
    setTheme(saveTheme(isDarkTheme ? LIGHT_THEME : DARK_THEME));
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
              <a
                aria-current={isHomeActive ? 'page' : undefined}
                className={isHomeActive ? 'active' : ''}
                href="/"
              >
                Inicio
              </a>
              <a
                aria-current={isCatalogActive ? 'page' : undefined}
                className={isCatalogActive ? 'active' : ''}
                href="/mascotas"
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
              <a
                aria-current={isAboutActive && !window.location.hash ? 'page' : undefined}
                className={isAboutActive && !window.location.hash ? 'active' : ''}
                href="/sobre-nosotros"
              >
                Sobre nosotros
              </a>
            </>
          )}
        </nav>

        <div className="header-actions">
          <button
            aria-label={isDarkTheme ? 'Cambiar a tema claro' : 'Cambiar a tema oscuro'}
            aria-pressed={isDarkTheme}
            className="theme-toggle"
            onClick={handleThemeToggle}
            title={isDarkTheme ? 'Tema claro' : 'Tema oscuro'}
            type="button"
          >
            <span className="theme-toggle-track" aria-hidden="true">
              <span className="theme-toggle-icon theme-toggle-icon-sun">☀</span>
              <span className="theme-toggle-icon theme-toggle-icon-moon">☾</span>
              <span className="theme-toggle-thumb" />
            </span>
          </button>
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
      {!isAdminRoute && <Footer />}
      <ChatbotWidget />
    </div>
  );
}
