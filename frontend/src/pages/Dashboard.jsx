import { useState, useEffect } from 'react';
import { Card, CardContent } from '../components/common/Card';
import { MapPin, Building, ChevronRight, Hash, Clock, Users, CheckCircle, FileText, Star } from 'lucide-react';
import { inventoryService } from '../services/inventory';
import { staffService } from '../services/staff';
import Loader from '../components/common/Loader';
import { requestService } from '../services/requestService';
import { managerService } from '../services/manager';
import { ownerService } from '../services/owner';
import { authService } from '../services/auth';
import { useAuthStore } from '../store/authStore';
import toast from 'react-hot-toast';

import { useNavigate } from 'react-router-dom';
import StatusBadge from '../components/common/StatusBadge';

export default function Dashboard() {
  const [loading, setLoading] = useState(true);
  const [sites, setSites] = useState([]);
  const { user, updateBookmark } = useAuthStore();
  const navigate = useNavigate();

  const [stats, setStats] = useState([]);
  const bookmarkedSiteId = user?.bookmarkedSiteId || null;
  const [refreshKey, setRefreshKey] = useState(0);

  const toggleBookmark = async (e, siteId) => {
    e.stopPropagation();
    try {
      const newBookmarkId = bookmarkedSiteId === siteId ? null : siteId;
      await authService.bookmarkSite(newBookmarkId);
      updateBookmark(newBookmarkId);
      toast.success(newBookmarkId ? 'Site bookmarked' : 'Bookmark removed');
      // Store in localStorage for cross-tab sync
      localStorage.setItem('lastBookmarkChange', Date.now().toString());
      // Broadcast change to other tabs
      const bc = new BroadcastChannel('bookmark');
      bc.postMessage({ siteId: newBookmarkId });
      bc.close();
    } catch (err) {
      toast.error('Failed to bookmark site');
    }
  };

  // Listen for bookmark updates from other tabs via BroadcastChannel
  useEffect(() => {
    const bc = new BroadcastChannel('bookmark');
    const handler = (event) => {
      updateBookmark(event.data.siteId);
    };
    bc.addEventListener('message', handler);
    return () => {
      bc.removeEventListener('message', handler);
      bc.close();
    };
  }, [updateBookmark]);

  // Listen for storage events (cross-browser tabs)
  useEffect(() => {
    const storageHandler = (e) => {
      if (e.key === 'lastBookmarkChange') {
        // Refetch bookmark from backend
        authService.getBookmarkedSite().then((res) => {
          const sId = res?.site?._id || res?.site || null;
          updateBookmark(sId);
        }).catch((err) => console.error('Failed to sync bookmark', err));
      }
    };
    window.addEventListener('storage', storageHandler);
    return () => window.removeEventListener('storage', storageHandler);
  }, [updateBookmark]);

  // Poll bookmark every 30 seconds as fallback
  useEffect(() => {
    const interval = setInterval(() => {
      authService.getBookmarkedSite().then((res) => {
        const sId = res?.site?._id || res?.site || null;
        updateBookmark(sId);
      }).catch(() => { });
    }, 30000);
    return () => clearInterval(interval);
  }, [updateBookmark]);

  useEffect(() => {
    let active = true;
    const fetchData = async () => {
      try {
        let fetchedSites = [];
        let statsData = [];

        if (user?.role === 'staff') {
          fetchedSites = await staffService.getSites();
          try {
            const reqs = await requestService.getAllRequests();
            const pendingCount = reqs.filter(r => r.status?.startsWith('pending')).length;
            const approvedCount = reqs.filter(r => r.status === 'approved').length;
            if (!active) return;
            statsData = [
              { label: 'MY REQUESTS', value: reqs.length, path: '/staff/requests', icon: FileText, color: 'border-blue-100', iconColor: 'text-blue-600', labelColor: 'text-blue-600' },
              { label: 'PENDING', value: pendingCount, path: '/staff/requests?status=pending_manager', icon: Clock, color: 'border-orange-100', iconColor: 'text-[#F59E0B]', labelColor: 'text-[#F59E0B]' },
              { label: 'APPROVED', value: approvedCount, path: '/staff/requests?status=approved', icon: CheckCircle, color: 'border-emerald-100', iconColor: 'text-[#10B981]', labelColor: 'text-[#10B981]' }
            ];
          } catch (e) { }
        } else if (user?.role === 'manager') {
          const data = await inventoryService.getSitesInventory();
          if (!active) return;
          fetchedSites = data.data || [];
          try {
            const team = await managerService.getTeam();
            const reqs = await requestService.getAllRequests();
            const pendingCount = reqs.filter(r => r.status === 'pending_manager').length;
            if (!active) return;
            statsData = [
              { label: 'APPROVALS', value: pendingCount, path: '/manager/transactions?status=pending_manager', icon: Clock, color: 'border-blue-100', iconColor: 'text-blue-600', labelColor: 'text-blue-600' },
              { label: 'ASSIGNED SITES', value: fetchedSites.length, path: '/manager/sites', icon: Building, color: 'border-emerald-100', iconColor: 'text-[#10B981]', labelColor: 'text-[#10B981]' },
              { label: 'TEAM SIZE', value: team?.length || 0, path: '/manager/team', icon: Users, color: 'border-orange-100', iconColor: 'text-[#F59E0B]', labelColor: 'text-[#F59E0B]' }
            ];
          } catch (e) { }
        } else if (user?.role === 'owner') {
          const data = await inventoryService.getSitesInventory();
          if (!active) return;
          fetchedSites = data.data || [];
          try {
            const ownerStats = await ownerService.getDashboardStats();
            if (!active) return;
            statsData = [
              { label: 'PENDING', value: ownerStats?.pendingApprovals || 0, path: '/owner/transactions?status=pending_owner', icon: Clock, color: 'border-blue-100', iconColor: 'text-blue-600', labelColor: 'text-blue-600' },
              { label: 'TOTAL SITES', value: ownerStats?.totalSites || fetchedSites.length, path: '/owner/sites', icon: Building, color: 'border-emerald-100', iconColor: 'text-[#10B981]', labelColor: 'text-[#10B981]' },
              { label: 'TOTAL STAFF', value: ownerStats?.totalStaff || 0, path: '/owner/users?tab=staff', icon: Users, color: 'border-orange-100', iconColor: 'text-[#F59E0B]', labelColor: 'text-[#F59E0B]' }
            ];
          } catch (e) { }
        }

        try {
          const bookmarkRes = await authService.getBookmarkedSite();
          const sId = bookmarkRes?.site?._id || bookmarkRes?.site || null;
          if (!active) return;
          updateBookmark(sId);
        } catch (e) {
          console.error("Failed to fetch bookmark", e);
        }

        if (!active) return;
        setSites(fetchedSites || []);
        setStats(statsData);
      } catch (error) {
        if (!active) return;
        console.error(error);
        toast.error('Failed to load dashboard data');
      } finally {
        if (active) {
          setLoading(false);
        }
      }
    };
    fetchData();
    return () => {
      active = false;
    };
  }, [user?.role, refreshKey]);

  if (loading) return <Loader size="lg" className="mt-20" />;

  const getRolePrefix = () => {
    if (!user) return '';
    return `/${user.role}`;
  };

  return (
    <div className="flex flex-col  space-y-4 max-w-[428px] mx-auto px-4 pb-4 pt-3">

      {/* Metrics Row - NOT STICKY */}
      {stats.length > 0 && (
        <div className="flex overflow-x-auto hide-scrollbar gap-2 w-[calc(100%+16px)] -mx-2 px-2 pb-2 mt-2">
          <div className="flex flex-wrap gap-2">
            {stats.map((stat, idx) => {
              const Icon = stat.icon;
              return (
                <div
                  key={idx}
                  onClick={() => navigate(stat.path)}
                  className="relative rounded-lg bg-white border border-slate-200 shadow-sm p-2 flex-1 min-w-[100px] min-h-[90px] cursor-pointer transition-all hover:shadow-md active:scale-[0.98]"
                  style={{
                    display: 'flex',
                    flexDirection: 'column',
                    justifyContent: 'space-between',
                    alignItems: 'flex-start'
                  }}
                >
                  {/* Icon positioned top‑right */}
                  <div className="absolute top-2 right-3">
                    <div className={`w-8 h-8 rounded-full flex items-center justify-center ${(() => { const color = stat.iconColor || ''; if (color.includes('blue')) return 'bg-blue-50'; if (color.includes('#10B981') || color.includes('emerald')) return 'bg-emerald-50'; if (color.includes('#F59E0B') || color.includes('orange')) return 'bg-orange-50'; return 'bg-gray-50'; })()}`}
                    >
                      {Icon && <Icon className={`w-5 h-5 ${stat.iconColor}`} />}
                    </div>
                  </div>
                  {/* Value and label left‑aligned */}
                  <div className="flex flex-col justify-between h-full w-full">
                    <div className="text-[24px] font-bold text-[#1F2937] leading-none">{stat.value}</div>
                    <div className="text-[11px] font-bold text-[#6B7280] mt-3 uppercase tracking-wide">{stat.label}</div>
                  </div>
                </div>);
            })}
          </div>
        </div>
      )}

      <div className="pb-2">
        <h1 className="text-2xl font-bold text-[#1F2937] tracking-tight">Sites</h1>
      </div>

      <div className="pt-0">
        {sites.length === 0 ? (
          <div className="text-center py-10 bg-[#f8faff] rounded-lg border border-dashed border-[#E5E7EB]">
            <Building className="mx-auto h-10 w-10 text-slate-400 mb-2" />
            <p className="text-sm font-medium text-[#6B7280]">No active sites found.</p>
          </div>
        ) : (
          <div className="flex flex-col space-y-2">
            {sites.map((site) => (
              <div
                key={site.siteId || site._id}
                className="bg-white rounded-lg p-2 shadow-sm border border-slate-200 hover:shadow-md transition-shadow cursor-pointer group active:scale-[0.98]"
                onClick={() => navigate(user?.role === 'staff' ? `/sites/${site.siteId || site._id}` : `/${user?.role}/inventory/${site.siteId || site._id}`)}
              >
                <div className="flex items-center justify-between">
                  <div className="flex-1">
                    <div className="flex items-start justify-between mb-1.5">
                      <div className="space-y-1">
                        <h3 className="text-base font-bold text-[#1F2937] leading-tight">{site.siteName}</h3>
                        <div className="flex items-center text-sm font-medium text-[#6B7280]">
                          <MapPin className="h-3.5 w-3.5 mr-1" />
                          {site.address || 'Location not specified'}
                        </div>
                        <div className="flex items-center gap-3">
                          {site.siteCode && (
                            <div className="flex items-center text-xs text-slate-400 font-mono">
                              <Hash className="h-3 w-3 mr-1" />
                              {site.siteCode}
                            </div>
                          )}
                          <div className="text-xs text-[#6B7280]">
                            Manager: <span className="font-medium text-[#1F2937]">{site.manager?.name || site.managerId?.name || 'Unassigned'}</span>
                          </div>
                        </div>
                      </div>
                      <div className="flex items-center gap-2">
                        <StatusBadge status={site.status || 'active'} />
                        <button
                          onClick={(e) => toggleBookmark(e, site.siteId || site._id)}
                          className="p-1 rounded-full hover:bg-slate-100 transition-colors"
                        >
                          <Star
                            className={`w-5 h-5 ${(bookmarkedSiteId === (site.siteId || site._id)) ? 'fill-[#F59E0B] text-[#F59E0B]' : 'text-slate-400'}`}
                          />
                        </button>
                      </div>
                    </div>
                  </div>
                </div>
              </div>
            ))}
          </div>
        )}
      </div>
    </div>
  );
}
