import { AppLayout } from '../components/layout/AppLayout';
import { HomePage } from '../pages/HomePage';
import { PetDetailPage } from '../pages/PetDetailPage';

export function AppRoutes() {
  const petDetailMatch = window.location.pathname.match(/^\/mascotas\/([^/]+)\/?$/);

  return (
    <AppLayout>
      {petDetailMatch ? (
        <PetDetailPage petId={petDetailMatch[1]} />
      ) : (
        <HomePage />
      )}
    </AppLayout>
  );
}
