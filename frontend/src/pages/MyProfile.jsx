import { useNavigate } from 'react-router-dom';
import { useAuthStore } from '../store/authStore';
import { ArrowLeft, User, Phone, Mail } from 'lucide-react';

export default function MyProfile() {
  const navigate = useNavigate();
  const { user } = useAuthStore();

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
                <p className="text-sm font-semibold text-slate-900">{user.phone || 'N/A'}</p>
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

        {user.assignedSites && user.assignedSites.length > 0 && (
          <div>
            <h3 className="text-base font-bold text-[#1F2937] mb-2">Assigned Sites ({user.assignedSites.length})</h3>
            <div className="space-y-2">
              {user.assignedSites.map(s => {
                const siteId = s._id || s.siteId;
                return (
                  <div key={siteId} className="bg-white rounded-lg p-3 shadow-sm border border-slate-200">
                    <h4 className="text-base font-bold text-[#1F2937] leading-tight">{s.siteName || 'Unknown Site'}</h4>
                    <p className="text-xs text-slate-400 font-mono mt-0.5">{s.siteCode || ''}</p>
                  </div>
                );
              })}
            </div>
          </div>
        )}
      </div>
    </div>
  );
}
