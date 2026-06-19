import React, { useEffect, useState } from 'react';
import { ownerService } from '../../services/owner';
import { managerService } from '../../services/manager';
import toast from 'react-hot-toast';

export default function SiteMultiSelect({ role = 'owner', register, error, availableSites = null, disabled = false, required = true }) {
  const [sites, setSites] = useState([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    // If parent provides sites directly, use them and skip fetching
    if (availableSites !== null) {
      setSites(availableSites);
      setLoading(false);
      return;
    }

    const fetchSites = async () => {
      try {
        setLoading(true);
        const data = role === 'owner' ? await ownerService.getSites() : await managerService.getSites();
        setSites(data.sites || data);
      } catch (err) {
        toast.error('Failed to load sites for selection');
      } finally {
        setLoading(false);
      }
    };
    fetchSites();
  }, [role, availableSites]);

  if (loading) return <div className="text-sm text-[#6B7280]">Loading sites...</div>;

  return (
    <div>
      <label className="block text-sm font-medium text-[#1F2937] mb-2">Assigned Sites {required && '*'}</label>
      <div className={`grid grid-cols-1 sm:grid-cols-2 gap-2 max-h-[240px] overflow-y-auto p-3 rounded-md border ${error ? 'border-[#EF4444]' : 'border-slate-200 bg-slate-50'} ${disabled ? 'opacity-60 cursor-not-allowed' : ''}`}>
        {sites.length === 0 ? (
          <p className="text-sm text-[#6B7280] italic col-span-full">No sites available</p>
        ) : (
          sites.map((site) => (
            <label key={site._id} className={`flex items-start gap-2 p-2 rounded-md transition-colors ${disabled ? 'cursor-not-allowed' : 'cursor-pointer hover:bg-white hover:shadow-sm border border-transparent hover:border-[#E5E7EB]'}`}>
              <input
                type="checkbox"
                value={site._id}
                disabled={disabled}
                {...register('assignedSites', required ? { required: 'Please assign at least one site' } : {})}
                className="mt-0.5 h-4 w-4 text-[#2563EB] rounded border-[#E5E7EB] focus:ring-[#2563EB]"
              />
              <div className="flex flex-col">
                <span className="text-sm font-medium text-[#1F2937] leading-tight">{site.siteName}</span>
                <span className="text-xs text-[#6B7280]">{site.siteCode}</span>
              </div>
            </label>
          ))
        )}
      </div>
      {error && <p className="mt-1 text-sm text-[#EF4444]">{error.message}</p>}
    </div>
  );
}
