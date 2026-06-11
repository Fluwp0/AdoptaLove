import { AppLayout } from '../components/layout/AppLayout';
import { AdoptionFormPage } from '../pages/AdoptionFormPage';
import { HomePage } from '../pages/HomePage';
import { PetDetailPage } from '../pages/PetDetailPage';

export function AppRoutes() {
  const adoptionFormMatch = window.location.pathname.match(/^\/mascotas\/([^/]+)\/postular\/?$/);
  const petDetailMatch = window.location.pathname.match(/^\/mascotas\/([^/]+)\/?$/);

  return (
    <AppLayout>
      {adoptionFormMatch ? (
        <AdoptionFormPage petId={adoptionFormMatch[1]} />
      ) : petDetailMatch ? (
        <PetDetailPage petId={petDetailMatch[1]} />
      ) : (
        <HomePage />
      )}
    </AppLayout>
  );
}
