import { LogOut } from 'lucide-react';
import { useAuthStore } from '../../store/authStore';
import NotificationBell from '../common/NotificationBell';

export default function Navbar() {
  const { logout, user } = useAuthStore();

  return (
    <header className="sticky w-full top-0 left-0 right-0 mx-auto max-w-[428px] z-50 bg-white shadow-sm border-b border-[#E5E7EB] overflow-x-hidden">
      <div className="max-w-[428px] mx-auto h-14 flex items-center justify-between px-4">
        <div className="flex items-center">
          <h1 className="text-[18px] font-bold text-[#2563EB] capitalize tracking-tight">
            {user?.role} Portal
          </h1>
        </div>

        <div className="flex items-center space-x-3">
          {user && <NotificationBell />}

          <div className="h-6 w-px bg-[#F3F4F6] mx-1"></div>

          <button
            onClick={logout}
            className="flex items-center justify-center p-2 rounded-md text-[#6B7280] hover:bg-red-50 hover:text-[#EF4444] transition-colors"
          >
            <LogOut className="h-5 w-5" />
          </button>
        </div>
      </div>
    </header>
  );
}
