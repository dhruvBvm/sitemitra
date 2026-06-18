import { useState, useEffect } from 'react';
import StatusBadge from '../../components/common/StatusBadge';
import Button from '../../components/common/Button';
import { MapPin, Eye, Star } from 'lucide-react';
import Loader from '../../components/common/Loader';
import { managerService } from '../../services/manager';
import { authService } from '../../services/auth';
import { useAuthStore } from '../../store/authStore';
import toast from 'react-hot-toast';
import { useNavigate } from 'react-router-dom';

export default function MySites() {
  const [sites, setSites] = useState([]);
  const [loading, setLoading] = useState(true);
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

  useEffect(() => {
    const fetchSites = async () => {
      try {
        const data = await managerService.getSites();
        setSites(Array.isArray(data) ? data : []);
        
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
    fetchSites();
  }, [refreshKey]);

  const columns = [
    { header: 'Site Code', accessor: 'siteCode' },
    { header: 'Site Name', accessor: 'siteName' },
    { 
      header: 'Address', 
      accessor: 'address',
      cell: (row) => (
        <div className="flex items-center text-[#6B7280]">
          <MapPin className="w-4 h-4 mr-1 text-slate-400" />
          <span className="truncate max-w-[200px]">{row.address}</span>
        </div>
      )
    },
    { 
      header: 'Status', 
      accessor: 'status',
      cell: (row) => <StatusBadge status={row.status} />
    },
    {
      header: 'Actions',
      cell: () => (
        <Button variant="ghost" size="sm">
          <Eye className="w-4 h-4 mr-1" /> View Details
        </Button>
      )
    }
  ];

  if (loading) return <Loader size="lg" className="mt-20" />;

  return (
    <div className="p-4 max-w-[428px] mx-auto pb-24 space-y-4">
      <div className="flex justify-between items-center mt-2 mb-4">
        <h1 className="text-[20px] font-bold text-[#1F2937]">My Assigned Sites</h1>
      </div>

      <div className="space-y-4">
        {sites.length === 0 ? (
          <div className="text-center py-10 bg-[#f8faff] rounded-[20px] border border-dashed border-[#E5E7EB]">
            <p className="text-sm font-medium text-[#6B7280]">No sites assigned to you.</p>
          </div>
        ) : (
          <div className="flex flex-col gap-3">
            {sites.map((site) => (
              <div 
                key={site._id || site.siteId} 
                className="bg-white shadow-sm border border-transparent rounded-[20px] p-[14px] cursor-pointer hover:border-blue-300 transition-colors"
                onClick={() => navigate(`/sites/${site.siteId || site._id}`)}
              >
                <div className="flex justify-between items-start mb-2">
                  <div>
                    <h3 className="text-base font-bold text-[#1F2937]">{site.siteName}</h3>
                    <p className="text-sm font-medium text-[#6B7280]">{site.siteCode}</p>
                  </div>
                  <div className="flex items-center gap-2">
                    <button
                      onClick={(e) => toggleBookmark(e, site.siteId || site._id)}
                      className="p-1 rounded-full hover:bg-slate-100 transition-colors"
                    >
                      <Star 
                        className={`w-5 h-5 ${bookmarkedSiteId === (site.siteId || site._id) ? 'fill-[#F59E0B] text-[#F59E0B]' : 'text-slate-400'}`} 
                      />
                    </button>
                    <StatusBadge status={site.status} />
                  </div>
                </div>
                <div className="text-sm text-[#6B7280] mb-3 flex items-start">
                  <MapPin className="w-4 h-4 mr-1 mt-0.5 text-slate-400 shrink-0" />
                  <span className="line-clamp-2">{site.address || site.location || 'No address provided'}</span>
                </div>
                <div className="flex justify-between items-center border-t border-slate-100 pt-3">
                  <div className="text-sm">
                    <span className="font-medium text-[#6B7280]">Manager:</span> <span className="text-[#1F2937] font-medium">{site.manager?.name || site.managerId?.name || 'You'}</span>
                  </div>
                  <Button 
                    variant="outline" 
                    size="sm" 
                    className="text-[#2563EB] border-[#2563EB] hover:bg-blue-50 px-3 py-2 rounded-[16px] font-medium mt-1"
                    onClick={(e) => {
                      e.stopPropagation();
                      navigate(`/manager/inventory/${site.siteId || site._id}`);
                    }}
                  >
                    <Eye className="w-4 h-4 mr-1" /> View Inventory
                  </Button>
                </div>
              </div>
            ))}
          </div>
        )}
      </div>
    </div>
  );
}
