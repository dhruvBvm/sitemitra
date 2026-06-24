import { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import StatusBadge from '../../components/common/StatusBadge';
import Button from '../../components/common/Button';
import { Plus, Star, Pencil, Ban, CheckCircle } from 'lucide-react';
import { ownerService } from '../../services/owner';
import { authService } from '../../services/auth';
import { useAuthStore } from '../../store/authStore';
import toast from 'react-hot-toast';
import Loader from '../../components/common/Loader';
import ConfirmModal from '../../components/common/ConfirmModal';

export default function Sites() {
  const [sites, setSites] = useState([]);
  const [managers, setManagers] = useState([]);
  const [loading, setLoading] = useState(true);
  const [siteToDeactivate, setSiteToDeactivate] = useState(null);
  const navigate = useNavigate();
  const { user, updateBookmark } = useAuthStore();
  const bookmarkedSiteId = user?.bookmarkedSiteId || null;
  const [refreshKey, setRefreshKey] = useState(0);

  const toggleBookmark = async (e, siteId) => {
    e.stopPropagation();
    try {
      const newBookmarkId = bookmarkedSiteId === siteId ? null : siteId;
      await authService.bookmarkSite(newBookmarkId);
      updateBookmark(newBookmarkId);

      // Store in localStorage for cross-tab sync
      localStorage.setItem('lastBookmarkChange', Date.now().toString());

      // Broadcast change to other tabs
      const bc = new BroadcastChannel('bookmark');
      bc.postMessage({ siteId: newBookmarkId });
      bc.close();

      toast.success(newBookmarkId ? 'Site bookmarked' : 'Bookmark removed');
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
        authService.getBookmarkedSite().then((res) => {
          const sId = res?.site?._id || res?.site || null;
          updateBookmark(sId);
        }).catch((err) => console.error('Failed to sync bookmark', err));
      }
    };
    window.addEventListener('storage', storageHandler);
    return () => window.removeEventListener('storage', storageHandler);
  }, [updateBookmark]);

  const toggleStatus = async (site) => {
    try {
      const newStatus = site.status === 'active' ? 'inactive' : 'active';
      // ownerService.deleteSite soft deletes (deactivates), but to activate we use updateSite
      if (newStatus === 'active') {
        await ownerService.updateSite(site._id, { status: 'active' });
      } else {
        await ownerService.deleteSite(site._id);
      }
      toast.success('Site status updated');
      setRefreshKey(prev => prev + 1);
    } catch (error) {
      toast.error('Failed to update status');
    }
  };

  useEffect(() => {
    let active = true;
    const fetchData = async () => {
      try {
        setLoading(true);
        const [sitesData, usersData] = await Promise.all([
          ownerService.getSites({ limit: 100 }),
          ownerService.getUsers({ role: 'manager', limit: 100 })
        ]);
        if (!active) return;
        setSites(sitesData.sites || sitesData);
        setManagers(usersData.users || usersData);

        try {
          const bookmarkRes = await authService.getBookmarkedSite();
          const sId = bookmarkRes?.site?._id || bookmarkRes?.site || null;
          if (!active) return;
          updateBookmark(sId);
        } catch (e) {
          console.error("Failed to fetch bookmark", e);
        }
      } catch (error) {
        if (!active) return;
        toast.error('Failed to load sites');
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
  }, [refreshKey]);

  const activeSites = sites.filter(s => s.status !== 'inactive');
  const inactiveSites = sites.filter(s => s.status === 'inactive');

  if (loading) return <Loader size="lg" className="mt-20" />;

  return (
    <div className="flex flex-col h-full max-w-[428px] mx-auto min-h-0">
      <div className="px-4 pt-3 flex-shrink-0">
        <div className="flex justify-between items-center mb-4 mt-2">
          <h1 className="text-2xl font-bold text-[#1F2937] tracking-tight">Site Management</h1>
          <Button className="flex items-center bg-[#2563EB] text-white rounded-[6px] px-3 py-1.5 h-auto text-[14px] hover:bg-[#1d4ed8]" onClick={() => navigate('/owner/sites/create')}>
            <Plus className="w-5 h-5 mr-1" />
            Add Site
          </Button>
        </div>
      </div>

      <div className="flex-1 overflow-y-auto px-4 pb-4">
        <div className="space-y-4">
          {sites.length === 0 ? (
            <div className="text-center py-10 bg-[#f8faff] rounded-lg border border-dashed border-[#E5E7EB]">
              <p className="text-sm font-medium text-[#6B7280]">No sites found.</p>
            </div>
          ) : (
            <div className="flex flex-col space-y-6">
              {/* Active Sites */}
              <div className="space-y-2">
                {activeSites.length > 0 && <h3 className="text-xs font-bold text-[#6B7280] uppercase tracking-wider px-1">Active Sites</h3>}
                {activeSites.map((site) => (
                  <div
                    key={site._id}
                    className="bg-white rounded-lg p-2 shadow-sm border border-slate-200 hover:shadow-md transition-shadow cursor-pointer group active:scale-[0.98] relative flex flex-col gap-1.5"
                    onClick={() => navigate(`/sites/${site._id}`)}
                  >
                    <div className="flex justify-between items-start">
                      <div className="flex-1 min-w-0 pr-2">
                        <div className="flex items-center gap-2">
                          <h3 className="text-base font-bold text-[#1F2937] leading-tight">{site.siteName}</h3>
                          <button
                            onClick={(e) => toggleBookmark(e, site._id)}
                            className="p-1 rounded-full hover:bg-slate-100 transition-colors"
                          >
                            <Star
                              className={`w-4 h-4 ${bookmarkedSiteId === site._id ? 'fill-[#F59E0B] text-[#F59E0B]' : 'text-slate-400'}`}
                            />
                          </button>
                        </div>
                        <p className="text-xs text-slate-400 font-mono mt-1">Code: {site.siteCode}</p>
                        <div className="flex items-center text-sm font-medium text-[#6B7280] line-clamp-1 mt-1">
                          {site.address || 'Location not specified'}
                        </div>
                        <div className="text-sm font-normal text-[#1F2937] mt-1">
                          <span className="font-medium text-[#6B7280]">Manager:</span> {site.managerId?.name || 'Unassigned'}
                        </div>
                      </div>

                      {/* Top Right Controls */}
                      <div className="flex flex-col items-end gap-[8px] py-1 shrink-0">
                        {site.status === 'active' ? (
                          <span className="bg-[#10B981] text-white text-[10px] font-bold px-2 py-0.5 rounded-md uppercase tracking-wider">Active</span>
                        ) : (
                          <StatusBadge status={site.status} />
                        )}
                        <div className="flex gap-[6px]">
                          <button
                            onClick={(e) => {
                              e.stopPropagation();
                              navigate(`/owner/sites/edit/${site._id}`);
                            }}
                            className="p-2 rounded-[6px] flex items-center justify-center bg-[#f8faff] text-[#2563EB] hover:bg-blue-100 transition-colors border border-[#E5E7EB]"
                          >
                            <Pencil className="w-[18px] h-[18px]" />
                          </button>
                          <button
                            onClick={async (e) => {
                              e.stopPropagation();
                              setSiteToDeactivate(site);
                            }}
                            className="p-2 rounded-[6px] flex items-center justify-center bg-[#f8faff] text-[#EF4444] hover:bg-red-50 transition-colors border border-[#E5E7EB]"
                          >
                            <Ban className="w-[18px] h-[18px]" />
                          </button>
                        </div>
                      </div>
                    </div>
                  </div>
                ))}
              </div>

              {/* Inactive Sites */}
              <div className="space-y-2">
                {inactiveSites.length > 0 && <h3 className="text-xs font-bold text-[#6B7280] uppercase tracking-wider px-1">Inactive Sites</h3>}
                {inactiveSites.map((site) => (
                  <div
                    key={site._id}
                    className="bg-white rounded-lg p-2 shadow-sm border border-slate-200 hover:shadow-md transition-shadow cursor-pointer group active:scale-[0.98] relative flex flex-col gap-1.5 opacity-75"
                    onClick={() => navigate(`/sites/${site._id}`)}
                  >
                    <div className="flex justify-between items-start">
                      <div className="flex-1 min-w-0 pr-2">
                        <div className="flex items-center gap-2">
                          <h3 className="text-base font-bold text-[#1F2937] leading-tight">{site.siteName}</h3>
                          <button
                            onClick={(e) => toggleBookmark(e, site._id)}
                            className="p-1 rounded-full hover:bg-slate-100 transition-colors"
                          >
                            <Star
                              className={`w-4 h-4 ${bookmarkedSiteId === site._id ? 'fill-[#F59E0B] text-[#F59E0B]' : 'text-slate-400'}`}
                            />
                          </button>
                        </div>
                        <p className="text-xs text-slate-400 font-mono mt-1">Code: {site.siteCode}</p>
                        <div className="flex items-center text-sm font-medium text-[#6B7280] line-clamp-1 mt-1">
                          {site.address || 'Location not specified'}
                        </div>
                        <div className="text-sm font-normal text-[#1F2937] mt-1">
                          <span className="font-medium text-[#6B7280]">Manager:</span> {site.managerId?.name || 'Unassigned'}
                        </div>
                      </div>

                      {/* Top Right Controls */}
                      <div className="flex flex-col items-end gap-[8px] py-1 shrink-0">
                        <StatusBadge status={site.status} />
                        <Button
                          variant="outline"
                          size="sm"
                          className="text-[#10B981] border-[#E5E7EB] hover:bg-green-50 px-2 py-1 rounded-[6px] font-medium text-[12px] h-auto mt-2 flex items-center gap-1"
                          onClick={async (e) => {
                            e.stopPropagation();
                            toggleStatus(site);
                          }}
                        >
                          <CheckCircle className="w-3.5 h-3.5" />
                          Activate
                        </Button>
                      </div>
                    </div>
                  </div>
                ))}
              </div>
            </div>
          )}
        </div>
      </div>

      <ConfirmModal
        isOpen={!!siteToDeactivate}
        onCancel={() => setSiteToDeactivate(null)}
        onConfirm={() => {
          if (siteToDeactivate) {
            toggleStatus(siteToDeactivate);
            setSiteToDeactivate(null);
          }
        }}
        title="Deactivate Site"
        message="Are you sure you want to deactivate this site?"
        confirmText="Deactivate"
        confirmVariant="danger"
      />
    </div>
  );
}
