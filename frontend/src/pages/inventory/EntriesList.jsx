// src/pages/inventory/EntriesList.jsx
import { useState, useEffect } from 'react';
import { useLocation, useNavigate } from 'react-router-dom';
import { Card, CardContent } from '../../components/common/Card';
import Button from '../../components/common/Button';
import { inventoryService } from '../../services/inventory';
import toast from 'react-hot-toast';
import Loader from '../../components/common/Loader';

import { Eye, Plus, Search, Filter, X } from 'lucide-react';
import { useAuthStore } from '../../store/authStore';

export default function EntriesList() {
  // Hooks
  const location = useLocation();
  const navigate = useNavigate();

  // Determine initial tab from query param
  const queryParams = new URLSearchParams(location.search);
  const initialTab = queryParams.get('tab') === 'used' ? 'used' : 'received';
  const [activeTab, setActiveTab] = useState(initialTab);

  // Filters and pagination state
  const [sites, setSites] = useState([]);
  const [selectedSite, setSelectedSite] = useState('');
  const [startDate, setStartDate] = useState('');
  const [endDate, setEndDate] = useState('');
  const [searchQuery, setSearchQuery] = useState('');
  
  const [appliedFilters, setAppliedFilters] = useState({
    siteId: '',
    startDate: '',
    endDate: '',
    search: ''
  });
  
  // We'll fetch a larger limit and let DataTable handle pagination
  const [limit] = useState(500);
  const [entries, setEntries] = useState([]);
  const [loading, setLoading] = useState(true);
  const [selectedEntry, setSelectedEntry] = useState(null);
  const [detailsLoading, setDetailsLoading] = useState(false);

  // Fetch sites on mount
  useEffect(() => {
    const fetchSites = async () => {
      try {
        const data = await inventoryService.getSites();
        setSites(data || []);
      } catch (error) {
        toast.error('Failed to load sites');
      }
    };
    fetchSites();
  }, []);

  // Sync URL when activeTab changes
  useEffect(() => {
    const params = new URLSearchParams(location.search);
    params.set('tab', activeTab);
    navigate({ pathname: location.pathname, search: params.toString() }, { replace: true });
  }, [activeTab, location.pathname]);

  // Reset page when filters or tab change


  // Fetch entries whenever filters, tab, or page changes
  useEffect(() => {
    const fetchEntries = async () => {
      setLoading(true);
      try {
        const params = { page: 1, limit };
        if (appliedFilters.siteId) params.siteId = appliedFilters.siteId;
        if (appliedFilters.startDate) params.startDate = appliedFilters.startDate;
        if (appliedFilters.endDate) params.endDate = appliedFilters.endDate;

        let response;
        if (activeTab === 'received') {
          response = await inventoryService.getReceivedEntries(params);
        } else {
          response = await inventoryService.getUsedEntries(params);
        }

        let fetchedEntries = response?.data || [];
        
        if (appliedFilters.search) {
          const query = appliedFilters.search.toLowerCase();
          fetchedEntries = fetchedEntries.filter(item => 
            item.entryNo?.toLowerCase().includes(query)
          );
        }

        setEntries(fetchedEntries);

      } catch (error) {
        toast.error('Failed to load entries');
      } finally {
        setLoading(false);
      }
    };
    fetchEntries();
  }, [appliedFilters, activeTab, limit]);

  const handleApplyFilters = () => {
    setAppliedFilters({
      siteId: selectedSite,
      startDate,
      endDate,
      search: searchQuery
    });
  };

  // Open entry details modal
  const openDetails = async (entryId) => {
    setDetailsLoading(true);
    setSelectedEntry({ _id: entryId }); // placeholder
    try {
      let data;
      if (activeTab === 'received') {
        data = await inventoryService.getReceivedEntryDetails(entryId);
      } else {
        data = await inventoryService.getUsedEntryDetails(entryId);
      }
      setSelectedEntry(data);
    } catch (error) {
      toast.error('Failed to load entry details');
      setSelectedEntry(null);
    } finally {
      setDetailsLoading(false);
    }
  };

  const getMaterialsSummary = (materials) => {
    if (!materials || materials.length === 0) return 'None';
    return materials.map(m => {
      const raw = m.materialName || '';
      const capitalized = raw.charAt(0).toUpperCase() + raw.slice(1);
      return `${capitalized}: ${m.quantity} ${m.unit}`;
    }).join(', ');
  };



  return (
    <div className="flex flex-col min-h-screen space-y-4 max-w-[428px] mx-auto px-4 pb-4 pt-1">
      <div className="flex justify-between items-center mt-2 mb-2">
        <h1 className="text-2xl font-bold text-[#1F2937] tracking-tight">
          {activeTab === 'received' ? 'Received Entries' : 'Used Entries'}
        </h1>
        <Button className="flex items-center py-2.5 px-2 rounded-md" onClick={() => navigate(activeTab === 'received' ? '/inventory/received/create' : '/inventory/used/create')}>
          <Plus className="w-4 h-4 mr-1" />
          {activeTab === 'received' ? 'Received' : 'Used'}
        </Button>
      </div>

      <Card className="shadow-sm border-slate-200">
        <div className="border-b border-[#E5E7EB]">
          <nav className="flex -mb-px px-4" aria-label="Tabs">
            <button
              onClick={() => setActiveTab('received')}
              className={`flex-1 whitespace-nowrap py-3 px-2 border-b-2 font-bold text-[13px] transition-colors ${
                activeTab === 'received'
                  ? 'border-[#2563EB] text-[#2563EB]'
                  : 'border-transparent text-[#6B7280] hover:text-[#1F2937] hover:border-[#E5E7EB]'
              }`}
            >
              Received Stock
            </button>
            <button
              onClick={() => setActiveTab('used')}
              className={`flex-1 whitespace-nowrap py-3 px-2 border-b-2 font-bold text-[13px] transition-colors ${
                activeTab === 'used'
                  ? 'border-[#2563EB] text-[#2563EB]'
                  : 'border-transparent text-[#6B7280] hover:text-[#1F2937] hover:border-[#E5E7EB]'
              }`}
            >
              Used Stock
            </button>
          </nav>
        </div>

        <CardContent className="p-0">
          {/* Filters */}
          <div className="sticky z-10 bg-white p-4 border-b border-[#E5E7EB]" style={{ top: '56px' }}>
            <div className="grid grid-cols-1 md:grid-cols-4 gap-2 mb-4">
            <div>
              <label className="block text-sm font-medium text-[#1F2937] mb-1">Site</label>
              <select
                value={selectedSite}
                onChange={(e) => setSelectedSite(e.target.value)}
                className="w-full px-2 py-2 border border-transparent rounded-md focus:outline-none focus:ring-2 focus:ring-[#2563EB]"
              >
                <option value="">All Sites</option>
                {sites.map(site => (
                  <option key={site.siteId || site._id} value={site.siteId || site._id}>
                    {site.siteName} ({site.siteCode})
                  </option>
                ))}
              </select>
            </div>
            <div>
              <label className="block text-sm font-medium text-[#1F2937] mb-1">Start Date</label>
              <input
                type="date"
                value={startDate}
                onChange={(e) => setStartDate(e.target.value)}
                className="w-full px-2 py-2 border border-transparent rounded-md focus:outline-none focus:ring-2 focus:ring-[#2563EB]"
              />
            </div>
            <div>
              <label className="block text-sm font-medium text-[#1F2937] mb-1">End Date</label>
              <input
                type="date"
                value={endDate}
                onChange={(e) => setEndDate(e.target.value)}
                className="w-full px-2 py-2 border border-transparent rounded-md focus:outline-none focus:ring-2 focus:ring-[#2563EB]"
              />
            </div>
            <div>
              <label className="block text-sm font-medium text-[#1F2937] mb-1">Search</label>
              <div className="relative">
                <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
                  <Search className="h-4 w-4 text-slate-400" />
                </div>
                <input
                  type="text"
                  placeholder="Search entry no..."
                  value={searchQuery}
                  onChange={(e) => setSearchQuery(e.target.value)}
                  className="w-full pl-9 pr-3 py-2 border border-transparent rounded-md focus:outline-none focus:ring-2 focus:ring-[#2563EB]"
                />
              </div>
            </div>
          </div>
          
            <div className="flex justify-end">
              <Button onClick={handleApplyFilters} className="flex items-center gap-2 rounded-md">
                <Filter className="w-4 h-4" /> Apply Filters
              </Button>
            </div>
          </div>

          <div className="p-3">

          {loading ? (
            <Loader size="md" className="my-10" />
          ) : (
            <div className="flex flex-col space-y-2">
              {entries.length === 0 ? (
                <div className="text-center py-10 bg-[#f8faff] rounded-lg border border-dashed border-[#E5E7EB]">
                  <p className="text-sm font-medium text-[#6B7280]">No entries found.</p>
                </div>
              ) : (
                entries.map((entry) => (
                  <div 
                    key={entry._id} 
                    className="bg-white rounded-lg p-2 shadow-sm border border-slate-200 hover:shadow-md transition-shadow cursor-pointer active:scale-[0.98]"
                    onClick={() => openDetails(entry._id)}
                  >
                    <div className="flex flex-col space-y-1">
                      <div className="flex justify-between items-start">
                        <div>
                          <h3 className="text-base font-bold text-[#1F2937] leading-tight">{entry.entryNo}</h3>
                          <div className="text-xs text-[#6B7280] mt-0.5">{entry.siteId?.siteName || '-'}</div>
                        </div>
                        <div className="text-right">
                          <span className="text-xs font-medium text-slate-400 block mb-1.5">
                            {new Date(entry.date || entry.createdAt).toLocaleDateString()}
                          </span>
                        </div>
                      </div>
                      <div className="text-sm text-[#6B7280] border-t border-slate-100 pt-2 grid grid-cols-2 gap-2">
                        <div>
                          <span className="text-xs text-[#6B7280] block uppercase font-bold tracking-wider mb-0.5">Created By</span>
                          <span className="font-medium text-[#1F2937]">{entry.createdBy?.name || 'Unknown'}</span>
                        </div>
                        <div>
                          <span className="text-xs text-[#6B7280] block uppercase font-bold tracking-wider mb-0.5">Notes</span>
                          <span className="truncate font-medium text-[#1F2937] block">{entry.notes || '-'}</span>
                        </div>
                      </div>
                      <div className="text-sm text-[#6B7280] border-t border-slate-100 pt-2">
                        <span className="text-[10px] text-slate-400 block mb-1 uppercase font-bold tracking-wider">Materials</span>
                        <p className="line-clamp-2">
                          {getMaterialsSummary(entry.materials)}
                        </p>
                      </div>
                    </div>
                  </div>
                ))
              )}
            </div>
          )}
          </div>
        </CardContent>
      </Card>

      {/* Details Modal */}
      {selectedEntry && (
        <div className="fixed inset-0 z-[100] flex items-center justify-center bg-black/50" onClick={() => setSelectedEntry(null)}>
          <div 
            onClick={(e) => e.stopPropagation()}
            className="bg-white rounded-md w-[90%] max-w-[400px] max-h-[80vh] flex flex-col mx-auto overflow-hidden shadow-xl animate-in zoom-in-95 duration-200"
          >
            <div className="flex items-center justify-between p-[16px] border-b border-[#eee] sticky top-0 bg-white z-10">
              <h2 className="text-lg font-bold text-[#1F2937] break-words">
                Entry Details: {selectedEntry.entryNo || 'Loading...'}
              </h2>
              <button onClick={() => setSelectedEntry(null)} className="p-1 rounded-full hover:bg-[#F3F4F6] text-[#6B7280] transition-colors focus-visible:outline-none">
                <X className="w-5 h-5" />
              </button>
            </div>
            <div className="p-[16px] overflow-y-auto break-words [&_img]:max-w-full [&_img]:h-auto flex-1">
              {detailsLoading ? (
                <div className="animate-pulse space-y-4">
                  <div className="h-20 bg-[#F3F4F6] rounded-md"></div>
                  <div className="h-32 bg-[#F3F4F6] rounded-md"></div>
                </div>
              ) : (
                <div className="space-y-6">
                  <div className="grid grid-cols-2 md:grid-cols-4 gap-2 bg-[#f8faff] p-2 rounded-md">
                    <div>
                      <p className="text-sm text-[#6B7280] mb-1">Date</p>
                      <p className="font-medium">
                        {new Date(selectedEntry.date || selectedEntry.createdAt).toLocaleDateString()}
                      </p>
                    </div>
                    <div>
                      <p className="text-sm text-[#6B7280] mb-1">Site</p>
                      <p className="font-medium">{selectedEntry.siteId?.siteName}</p>
                    </div>
                    <div>
                      <p className="text-sm text-[#6B7280] mb-1">Created By</p>
                      <p className="font-medium">{selectedEntry.createdBy?.name}</p>
                    </div>
                  </div>
                  {selectedEntry.notes && (
                    <div>
                      <h4 className="text-sm font-semibold text-[#1F2937] mb-2">Notes</h4>
                      <p className="text-sm text-[#6B7280] bg-[#f8faff] p-2 rounded-md border border-transparent">
                        {selectedEntry.notes}
                      </p>
                    </div>
                  )}
                  {selectedEntry.imageUrls?.length > 0 && (
                    <div>
                      <h4 className="text-sm font-semibold text-[#1F2937] mb-2">Entry Images</h4>
                      <div className="flex flex-wrap gap-2">
                        {selectedEntry.imageUrls.map((url, i) => (
                          <a key={i} href={url} target="_blank" rel="noreferrer" className="w-20 h-20 rounded border border-transparent overflow-hidden block">
                            <img src={url} alt="entry" className="w-full h-full object-cover" />
                          </a>
                        ))}
                      </div>
                    </div>
                  )}
                  <div>
                    <h4 className="text-lg font-semibold text-[#1F2937] mb-4">Materials</h4>
                    <div className="space-y-4">
                      {selectedEntry.materials.map((mat, idx) => (
                        <div key={idx} className="border border-transparent rounded-md p-2">
                          <div className="flex justify-between mb-2">
                            <span className="capitalize font-medium text-[#1F2937]">{mat.materialName}</span>
                            <span className="font-semibold text-[#2563EB]">{mat.quantity} {mat.unit}</span>
                          </div>
                          {mat.imageUrls?.length > 0 && (
                            <div className="mt-3">
                              <p className="text-xs text-[#6B7280] mb-2">Material Images</p>
                              <div className="flex flex-wrap gap-2">
                                {mat.imageUrls.map((url, i) => (
                                  <a key={i} href={url} target="_blank" rel="noreferrer" className="w-16 h-16 rounded border border-transparent overflow-hidden block">
                                    <img src={url} alt="material" className="w-full h-full object-cover" />
                                  </a>
                                ))}
                              </div>
                            </div>
                          )}
                        </div>
                      ))}
                    </div>
                  </div>
                </div>
              )}
            </div>
            <div className="p-[16px] border-t border-[#eee] flex justify-end">
              <Button onClick={() => setSelectedEntry(null)} variant="secondary">Close</Button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
