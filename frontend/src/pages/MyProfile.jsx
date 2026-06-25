import { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { useAuthStore } from '../store/authStore';
import { ArrowLeft, User, Phone, Mail } from 'lucide-react';
import { staffService } from '../services/staff';
import { managerService } from '../services/manager';
import { ownerService } from '../services/owner';

export default function MyProfile() {
  const navigate = useNavigate();
  const { user } = useAuthStore();
  const [assignedSites, setAssignedSites] = useState([]);
  const [loadingSites, setLoadingSites] = useState(true);

  useEffect(() => {
    let active = true;
    const fetchSites = async () => {
      if (!user) return;
      try {
        setLoadingSites(true);
        let fetched = [];
        if (user.role === 'staff') {
          fetched = await staffService.getSites();
        } else if (user.role === 'manager') {
          fetched = await managerService.getSites();
        } else if (user.role === 'owner') {
          // If owner has assigned sites (rare), fetch all and filter
          if (user.assignedSites?.length > 0) {
             const res = await ownerService.getSites({ limit: 1000 });
             const allSites = res.sites || res || [];
             fetched = allSites.filter(s => user.assignedSites.includes(s._id || s.siteId || s));
          }
        }
        if (active) {
          setAssignedSites(fetched || []);
        }
      } catch (err) {
        console.error('Failed to fetch sites for profile', err);
      } finally {
        if (active) setLoadingSites(false);
      }
    };
    fetchSites();
    return () => { active = false; };
  }, [user]);

  if (!user) return null;

  return (
    <div className="w-full max-w-[428px] mx-auto bg-[#f8faff] relative pb-24 min-h-screen">
      <div className="flex items-center mb-4 px-4 pt-4">
        <button onClick={() => navigate(-1)} className="flex items-center justify-center w-10 h-10 bg-white shadow-sm text-slate-600 rounded-full hover:bg-slate-50 transition-colors shrink-0">
          <ArrowLeft className="w-5 h-5" />
        </button>
        <h1 className="text-xl font-bold text-[#1F2937] ml-3">My Profile</h1>
      </div>

      <div className="px-4 space-y-4">
        <div className="bg-white rounded-lg p-5 shadow-sm border border-slate-200">
          <div className="flex items-center gap-4 mb-4">
            <div className="w-16 h-16 bg-blue-100 rounded-full flex items-center justify-center text-blue-600 shrink-0">
              <User className="w-8 h-8" />
            </div>
            <div>
              <h2 className="text-xl font-bold text-slate-900">{user.name}</h2>
              <div className="inline-block mt-1 px-2 py-0.5 bg-blue-50 text-blue-700 text-xs font-bold uppercase tracking-wider rounded">
                {user.role}
              </div>
            </div>
          </div>

          <div className="space-y-3 pt-3 border-t border-slate-100">
            <div className="flex items-start gap-3">
              <Phone className="w-4 h-4 text-slate-400 mt-0.5 shrink-0" />
              <div>
                <p className="text-xs text-slate-500 font-medium">Phone</p>
                <p className="text-sm font-semibold text-slate-900">{user.mobile || 'N/A'}</p>
              </div>
            </div>
            
            <div className="flex items-start gap-3">
              <Mail className="w-4 h-4 text-slate-400 mt-0.5 shrink-0" />
              <div>
                <p className="text-xs text-slate-500 font-medium">Email</p>
                <p className="text-sm font-semibold text-slate-900">{user.email || 'N/A'}</p>
              </div>
            </div>
          </div>
        </div>

        {(assignedSites.length > 0 || loadingSites) && (
          <div>
            <h3 className="text-base font-bold text-[#1F2937] mb-2">Assigned Sites ({loadingSites ? '...' : assignedSites.length})</h3>
            <div className="space-y-2">
              {loadingSites ? (
                <div className="text-sm text-slate-500 text-center py-4 bg-white rounded-lg shadow-sm border border-slate-200">Loading sites...</div>
              ) : (
                assignedSites.map(s => {
                  const siteId = s._id || s.siteId;
                  return (
                    <div key={siteId} className="bg-white rounded-lg p-3 shadow-sm border border-slate-200">
                      <h4 className="text-base font-bold text-[#1F2937] leading-tight">{s.siteName || 'Unknown Site'}</h4>
                      <p className="text-xs text-slate-400 font-mono mt-0.5">{s.siteCode || ''}</p>
                    </div>
                  );
                })
              )}
            </div>
          </div>
        )}
      </div>
    </div>
  );
}
