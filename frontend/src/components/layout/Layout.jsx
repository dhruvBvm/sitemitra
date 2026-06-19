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
    <div className="max-h-screen bg-[#f8faff] w-full max-w-[428px] mx-auto fixed top-0 bottom-0 min-h-screen ">
      <Navbar />
      <main className="w-full">
        <Outlet />
      </main>
      <BottomNavigation />
    </div>
  );
}
