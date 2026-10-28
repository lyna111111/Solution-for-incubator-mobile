import { AccueilAdmin } from '@/components/AccueilAdmin';
import { AccueilSuperAdmin } from '@/components/AccueilSuperAdmin';
import { AccueilUtilisateur } from '@/components/AccueilUtilisateur';
import { useAuthStore } from '@/store/auth';

export default function Accueil() {
  const role = useAuthStore((s) => s.user?.role);
  if (role === 'utilisateur') return <AccueilUtilisateur />;
  if (role === 'admin') return <AccueilAdmin />;
  if (role === 'superadmin') return <AccueilSuperAdmin />;
  return null;
}
