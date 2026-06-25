import { AppLayout } from '../components/layout/AppLayout';
import { useEffect, useState } from 'react';
import { AdminDashboardPage } from '../pages/AdminDashboardPage';
import { AdminModificationsPage } from '../pages/AdminModificationsPage';
import { AdminPublicationsPage } from '../pages/AdminPublicationsPage';
import { AdminUsersPage } from '../pages/AdminUsersPage';
import { AdoptionFormPage } from '../pages/AdoptionFormPage';
import { AboutPage } from '../pages/AboutPage';
import { ChatbotPage } from '../pages/ChatbotPage';
import { CompatibilityQuizPage } from '../pages/CompatibilityQuizPage';
import { DonationsPage } from '../pages/DonationsPage';
import { FoundationDashboardPage } from '../pages/FoundationDashboardPage';
import { HomePage } from '../pages/HomePage';
import { LoginPage } from '../pages/LoginPage';
import { PetDetailPage } from '../pages/PetDetailPage';
import { PetCatalogPage } from '../pages/PetCatalogPage';
import { ProfilePage } from '../pages/ProfilePage';
import { RegisterPage } from '../pages/RegisterPage';

export function AppRoutes() {
  const [path, setPath] = useState(() => window.location.pathname);
  const adoptionFormMatch = path.match(/^\/mascotas\/([^/]+)\/postular\/?$/);
  const petDetailMatch = path.match(/^\/mascotas\/([^/]+)\/?$/);

  useEffect(() => {
    function syncPath() {
      setPath(window.location.pathname);
    }

    function handleLinkClick(event) {
      if (
        event.defaultPrevented ||
        event.button !== 0 ||
        event.metaKey ||
        event.altKey ||
        event.ctrlKey ||
        event.shiftKey
      ) {
        return;
      }

      const link = event.target.closest?.('a[href]');

      if (!link || link.target || link.hasAttribute('download')) {
        return;
      }

      const url = new URL(link.href);

      if (url.origin !== window.location.origin) {
        return;
      }

      const currentUrl = new URL(window.location.href);
      const isSameRoute =
        url.pathname === currentUrl.pathname &&
        url.search === currentUrl.search &&
        url.hash === currentUrl.hash;

      if (isSameRoute) {
        return;
      }

      event.preventDefault();
      window.history.pushState({}, '', `${url.pathname}${url.search}${url.hash}`);
      setPath(url.pathname);

      if (url.hash) {
        window.requestAnimationFrame(() => {
          document.querySelector(url.hash)?.scrollIntoView({ behavior: 'smooth', block: 'start' });
        });
      } else {
        window.scrollTo({ top: 0, left: 0, behavior: 'auto' });
      }
    }

    window.addEventListener('popstate', syncPath);
    document.addEventListener('click', handleLinkClick);

    return () => {
      window.removeEventListener('popstate', syncPath);
      document.removeEventListener('click', handleLinkClick);
    };
  }, []);

  return (
    <AppLayout>
      <div className="route-surface" key={path}>
        {path === '/' ? (
          <HomePage />
        ) : path === '/mascotas' ? (
          <PetCatalogPage />
        ) : path === '/sobre-nosotros' || path === '/contacto' ? (
          <AboutPage />
        ) : path === '/login' ? (
          <LoginPage />
        ) : path === '/registro' ? (
          <RegisterPage />
        ) : path === '/perfil' ? (
          <ProfilePage />
        ) : path === '/compatibilidad' ? (
          <CompatibilityQuizPage />
        ) : path === '/donaciones' ? (
          <DonationsPage />
        ) : path === '/admin/usuarios' ? (
          <AdminUsersPage />
        ) : path === '/admin/publicaciones' ? (
          <AdminPublicationsPage />
        ) : path === '/admin/modificaciones' ? (
          <AdminModificationsPage />
        ) : path === '/admin' || path === '/admin/inicio' ? (
          <AdminDashboardPage />
        ) : path === '/fundacion' || path === '/panel-fundacion' ? (
          <FoundationDashboardPage />
        ) : path === '/chatbot' ? (
          <ChatbotPage />
        ) : adoptionFormMatch ? (
          <AdoptionFormPage petId={adoptionFormMatch[1]} />
        ) : petDetailMatch ? (
          <PetDetailPage petId={petDetailMatch[1]} />
        ) : (
          <HomePage />
        )}
      </div>
    </AppLayout>
  );
}

