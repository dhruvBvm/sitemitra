import { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import StatusBadge from '../../components/common/StatusBadge';
import Button from '../../components/common/Button';
import { Plus, Star } from 'lucide-react';
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

      setRefreshKey(prev => prev + 1);
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
      setRefreshKey(prev => prev + 1);
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
          setRefreshKey(prev => prev + 1);
        }).catch((err) => console.error('Failed to sync bookmark', err));
      }
    };
    window.addEventListener('storage', storageHandler);
    return () => window.removeEventListener('storage', storageHandler);
  }, [updateBookmark]);

  const fetchData = async () => {
    try {
      setLoading(true);
      const [sitesData, usersData] = await Promise.all([
        ownerService.getSites({ limit: 100 }),
        ownerService.getUsers({ role: 'manager', limit: 100 })
      ]);
      setSites(sitesData.sites || sitesData);
      setManagers(usersData.users || usersData);
      
      try {
        const bookmarkRes = await authService.getBookmarkedSite();
        const sId = bookmarkRes?.site?._id || bookmarkRes?.site || null;
        updateBookmark(sId);
      } catch (e) {
        console.error("Failed to fetch bookmark", e);
      }
    } catch (error) {
      toast.error('Failed to load sites');
    } finally {
      setLoading(false);
    }
  };

  const activeSites = sites.filter(s => s.status !== 'inactive');
  const inactiveSites = sites.filter(s => s.status === 'inactive');

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
      fetchData();
    } catch (error) {
      toast.error('Failed to update status');
    }
  };

  useEffect(() => {
    fetchData();
  }, [refreshKey]);

  if (loading) return <Loader size="lg" className="mt-20" />;

  return (
    <div className="w-full p-4 max-w-[428px] mx-auto pb-24 space-y-4">
      <div className="flex justify-between items-center mt-2 mb-4">
        <h1 className="text-2xl font-bold text-[#1F2937]">Site Management</h1>
        <Button className="flex items-center py-2.5 px-4 rounded-[16px]" onClick={() => navigate('/owner/sites/create')}>
          <Plus className="w-4 h-4 mr-2" />
          Add Site
        </Button>
      </div>

      <div className="space-y-4">
        {sites.length === 0 ? (
          <div className="text-center py-10 bg-[#f8faff] rounded-[20px] border border-dashed border-[#E5E7EB]">
            <p className="text-sm font-medium text-[#6B7280]">No sites found.</p>
          </div>
        ) : (
          <div className="flex flex-col space-y-6">
            {/* Active Sites */}
            <div className="space-y-3">
              {activeSites.length > 0 && <h3 className="text-xs font-bold text-[#6B7280] uppercase tracking-wider px-1">Active Sites</h3>}
              {activeSites.map((site) => (
                <div 
                  key={site._id} 
                  className="bg-white shadow-sm border border-transparent rounded-[20px] p-[14px] cursor-pointer hover:border-blue-300 transition-colors"
                  onClick={() => navigate(`/sites/${site._id}`)}
                >
                  <div className="flex justify-between items-start mb-2">
                    <div>
                      <h3 className="text-base font-bold text-[#1F2937]">{site.siteName}</h3>
                      <p className="text-sm font-medium text-[#6B7280]">{site.siteCode}</p>
                    </div>
                    <div className="flex items-center gap-2">
                      <button
                        onClick={(e) => toggleBookmark(e, site._id)}
                        className="p-1 rounded-full hover:bg-slate-100 transition-colors"
                      >
                        <Star 
                          className={`w-5 h-5 ${bookmarkedSiteId === site._id ? 'fill-[#F59E0B] text-[#F59E0B]' : 'text-slate-400'}`} 
                        />
                      </button>
                      <StatusBadge status={site.status} />
                    </div>
                  </div>
                  <div className="text-sm text-[#6B7280] mb-3 line-clamp-2">
                    {site.address}
                  </div>
                  <div className="flex justify-between items-center border-t border-slate-100 pt-3">
                    <div className="text-sm">
                      <span className="font-medium text-[#6B7280]">Manager:</span> <span className="text-[#1F2937] font-medium">{site.managerId?.name || 'Unassigned'}</span>
                    </div>
                    <div className="flex gap-2">
                      <Button 
                        variant="outline" 
                        size="sm" 
                        className="text-[#2563EB] border-[#2563EB] hover:bg-blue-50 px-4 py-2.5 rounded-[16px] font-medium"
                        onClick={(e) => {
                          e.stopPropagation();
                          navigate(`/owner/sites/edit/${site._id}`);
                        }}
                      >
                        Edit
                      </Button>
                      <Button 
                        variant="outline" 
                        size="sm" 
                        className="text-[#EF4444] border-[#EF4444] hover:bg-red-50 px-4 py-2.5 rounded-[16px] font-medium" 
                        onClick={async (e) => {
                          e.stopPropagation();
                          setSiteToDeactivate(site);
                        }}
                      >
                        Deactivate
                      </Button>
                    </div>
                  </div>
                </div>
              ))}
            </div>

            {/* Inactive Sites */}
            <div className="space-y-3">
              {inactiveSites.length > 0 && <h3 className="text-xs font-bold text-[#6B7280] uppercase tracking-wider px-1">Inactive Sites</h3>}
              {inactiveSites.map((site) => (
                <div 
                  key={site._id} 
                  className="bg-white shadow-sm border border-transparent rounded-[20px] p-[14px] opacity-75 cursor-pointer"
                  onClick={() => navigate(`/sites/${site._id}`)}
                >
                  <div className="flex justify-between items-start mb-2">
                    <div>
                      <h3 className="text-base font-bold text-[#1F2937]">{site.siteName}</h3>
                      <p className="text-sm font-medium text-[#6B7280]">{site.siteCode}</p>
                    </div>
                    <div className="flex items-center gap-2">
                      <button
                        onClick={(e) => toggleBookmark(e, site._id)}
                        className="p-1 rounded-full hover:bg-slate-100 transition-colors"
                      >
                        <Star 
                          className={`w-5 h-5 ${bookmarkedSiteId === site._id ? 'fill-[#F59E0B] text-[#F59E0B]' : 'text-slate-400'}`} 
                        />
                      </button>
                      <StatusBadge status={site.status} />
                    </div>
                  </div>
                  <div className="text-sm text-[#6B7280] mb-3 line-clamp-2">
                    {site.address}
                  </div>
                  <div className="flex justify-end border-t border-slate-100 pt-3">
                    <Button 
                      variant="outline" 
                      size="sm" 
                      className="text-[#10B981] border-[#10B981] hover:bg-green-50 px-4 py-2.5 rounded-[16px] font-medium" 
                      onClick={async (e) => {
                        e.stopPropagation();
                        toggleStatus(site);
                      }}
                    >
                      Activate
                    </Button>
                  </div>
                </div>
              ))}
            </div>
          </div>
        )}
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
