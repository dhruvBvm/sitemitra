import { LogOut } from 'lucide-react';
import { useAuthStore } from '../../store/authStore';
import NotificationBell from '../common/NotificationBell';

export default function Navbar() {
  const { logout, user } = useAuthStore();

  return (
    <header className="sticky top-0 z-50 h-14 bg-white shadow-[0_2px_10px_rgba(0,0,0,0.05)] flex items-center justify-between px-4 w-full">
      <div className="flex items-center">
        <h1 className="text-[19px] font-bold text-[#2563EB] capitalize tracking-tight">
          {user?.role} Portal
        </h1>
      </div>

      <div className="flex items-center space-x-3">
        {user && <NotificationBell />}

        <div className="h-6 w-px bg-[#F3F4F6] mx-1"></div>

        <button
          onClick={logout}
          className="flex items-center justify-center p-2 rounded-[16px] text-[#6B7280] hover:bg-red-50 hover:text-[#EF4444] transition-colors"
        >
          <LogOut className="h-5 w-5" />
        </button>
      </div>
    </header>
  );
}
