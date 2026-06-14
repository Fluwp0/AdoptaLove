import { AppLayout } from '../components/layout/AppLayout';
import { AdminDashboardPage } from '../pages/AdminDashboardPage';
import { AdminModificationsPage } from '../pages/AdminModificationsPage';
import { AdminPublicationsPage } from '../pages/AdminPublicationsPage';
import { AdminUsersPage } from '../pages/AdminUsersPage';
import { AdoptionFormPage } from '../pages/AdoptionFormPage';
import { ChatbotPage } from '../pages/ChatbotPage';
import { CompatibilityQuizPage } from '../pages/CompatibilityQuizPage';
import { DonationsPage } from '../pages/DonationsPage';
import { FoundationDashboardPage } from '../pages/FoundationDashboardPage';
import { HomePage } from '../pages/HomePage';
import { LoginPage } from '../pages/LoginPage';
import { PetDetailPage } from '../pages/PetDetailPage';
import { ProfilePage } from '../pages/ProfilePage';
import { RegisterPage } from '../pages/RegisterPage';

export function AppRoutes() {
  const path = window.location.pathname;
  const adoptionFormMatch = window.location.pathname.match(/^\/mascotas\/([^/]+)\/postular\/?$/);
  const petDetailMatch = window.location.pathname.match(/^\/mascotas\/([^/]+)\/?$/);

  return (
    <AppLayout>
      {path === '/login' ? (
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
    </AppLayout>
  );
}

