import { Link, useLocation } from 'react-router-dom';
import { LayoutDashboard, Box, ClipboardList, ArrowRightLeft } from 'lucide-react';
import { useAuthStore } from '../../store/authStore';
import { cn } from '../../utils/helpers';

export default function BottomNavigation() {
  const location = useLocation();
  const { user } = useAuthStore();

  const getRolePrefix = () => {
    if (!user) return '';
    return `/${user.role}`;
  };

  const rolePrefix = getRolePrefix();

  const navItems = user?.role === 'staff'
    ? [
      { name: 'Dashboard', path: `${rolePrefix}/dashboard`, icon: LayoutDashboard },
      { name: 'Requests', path: `${rolePrefix}/requests`, icon: ClipboardList },
    ]
    : user?.role === 'manager'
      ? [
        { name: 'Dashboard', path: `${rolePrefix}/dashboard`, icon: LayoutDashboard },
        { name: 'Transactions', path: `${rolePrefix}/transactions`, icon: ArrowRightLeft },
        { name: 'Materials', path: `${rolePrefix}/materials`, icon: Box },
        { name: 'Site View', path: `${rolePrefix}/sites`, icon: LayoutDashboard },
        { name: 'Team', path: `${rolePrefix}/team`, icon: ClipboardList },
      ]
      : [
        { name: 'Dashboard', path: `${rolePrefix}/dashboard`, icon: LayoutDashboard },
        { name: 'Transactions', path: `${rolePrefix}/transactions`, icon: ArrowRightLeft },
        { name: 'Materials', path: `${rolePrefix}/materials`, icon: Box },
        { name: 'Sites', path: `${rolePrefix}/sites`, icon: LayoutDashboard },
        { name: 'Users', path: `${rolePrefix}/users`, icon: ClipboardList },
      ];

  const checkActive = (itemPath, itemName) => {
    const currentPath = location.pathname.toLowerCase();
    const targetPath = itemPath.toLowerCase();

    // Exact match
    if (currentPath === targetPath) return true;

    // Standard subpaths
    if (targetPath !== '/' && currentPath.startsWith(targetPath)) return true;

    // Special cases mappings
    if (itemName === 'Dashboard') {
      return currentPath.includes('/dashboard') || currentPath.includes('/inventory');
    }
    if (itemName === 'Sites' || itemName === 'Site View') {
      return currentPath.includes('/sites');
    }
    if (itemName === 'Transactions' || itemName === 'Requests') {
      return currentPath.includes('/transactions') || currentPath.includes('/requests') || currentPath.includes('/received') || currentPath.includes('/used') || currentPath.includes('create-order') || currentPath.includes('/entries');
    }
    if (itemName === 'Materials') {
      return currentPath.includes('/materials');
    }
    if (itemName === 'Users' || itemName === 'Team') {
      return currentPath.includes('/users') || currentPath.includes('/team') || (currentPath.includes('/staff') && !currentPath.includes('/dashboard') && !currentPath.includes('/requests') && !currentPath.includes('/materials') && !currentPath.includes('/inventory') && !currentPath.includes('create-order'));
    }

    return false;
  };

  return <div className="sticky bottom-0 left-0 right-0 mx-auto max-w-[428px] z-50 bg-white border-t border-[#E5E7EB] overflow-x-hidden">
    <div className="mx-auto max-w-[428px] flex justify-around items-center h-14 px-3">
      {navItems.map((item) => {
        const isActive = checkActive(item.path, item.name);

        return (
          <Link
            key={item.name}
            to={item.path}
            className={cn(
              "flex flex-col items-center justify-center w-full h-full space-y-1 relative transition-colors duration-200",
              isActive ? "text-[#2563EB] active" : "text-[#9E9E9E] hover:text-[#1F2937]"
            )}
          >
            {isActive && (
              <div className="absolute top-0 left-1/2 -translate-x-1/2 w-10 h-1 bg-[#2563EB] rounded-b-full shadow-[0_2px_6px_rgba(37,99,235,0.4)]" />
            )}
            <item.icon className={cn("w-6 h-6 transition-all duration-200", isActive && "stroke-[2.5] scale-110")} />
            <span className="text-[10px] font-bold">{item.name}</span>
          </Link>
        );
      })}
    </div>
  </div>

}
