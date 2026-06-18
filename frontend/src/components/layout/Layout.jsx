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
    <div className="min-h-screen bg-[#f8faff] w-full max-w-[428px] mx-auto relative shadow-md pb-16">
      <Navbar />
      <main className="w-full">
        <Outlet />
      </main>
      <BottomNavigation />
    </div>
  );
}
