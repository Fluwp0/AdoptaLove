import { AppLayout } from '../components/layout/AppLayout';
import { AdoptionFormPage } from '../pages/AdoptionFormPage';
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
