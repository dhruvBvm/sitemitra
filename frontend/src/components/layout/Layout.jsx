import { Outlet, Navigate } from 'react-router-dom';
import Navbar from './Navbar';
import BottomNavigation from './BottomNavigation';
import { useAuthStore } from '../../store/authStore';

export default function Layout() {
  const { user } = useAuthStore();

  if (!user) {
    return <Navigate to="/login" replace />;
  }

  return (
    <div className="fixed inset-0 max-w-[428px] mx-auto bg-[#f8faff] flex flex-col overflow-y-auto">
      <Navbar />
      <main className="flex-1 w-full overflow-y-auto pb-20">
        <Outlet />
      </main>
      <BottomNavigation />
    </div>
  );
}
