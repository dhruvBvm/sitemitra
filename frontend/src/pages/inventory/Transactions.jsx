import { useState, useEffect } from 'react';
import { useNavigate, useSearchParams } from 'react-router-dom';
import { Card, CardContent } from '../../components/common/Card';
import Button from '../../components/common/Button';
import { inventoryService } from '../../services/inventory';
import { requestService } from '../../services/requestService';
import toast from 'react-hot-toast';
import Loader from '../../components/common/Loader';
import StatusBadge from '../../components/common/StatusBadge';
import { formatDate } from '../../utils/helpers';
import { Search, Calendar, Filter, Eye, X, FileText, CheckCircle2, ArrowLeft } from 'lucide-react';
import { useAuthStore } from '../../store/authStore';
import CommentModal from '../../components/common/CommentModal';

export default function Transactions() {
  const navigate = useNavigate();
  const [searchParams] = useSearchParams();
  const statusFilter = searchParams.get('status');
  const { user } = useAuthStore();
  const [sites, setSites] = useState([]);

  // Filters
  const [selectedSite, setSelectedSite] = useState('');
  const [selectedType, setSelectedType] = useState('All');
  const [startDate, setStartDate] = useState('');
  const [endDate, setEndDate] = useState('');
  const [searchQuery, setSearchQuery] = useState('');

  // Applied filters (to avoid fetching on every keypress)
  const [appliedFilters, setAppliedFilters] = useState({
    siteId: '',
    type: 'All',
    startDate: '',
    endDate: '',
    search: ''
  });

  const [combinedData, setCombinedData] = useState([]);
  const [loading, setLoading] = useState(true);
  const [actionLoading, setActionLoading] = useState(null);

  // Modal State
  const [modalOpen, setModalOpen] = useState(false);
  const [modalConfig, setModalConfig] = useState({ type: '', id: null, title: '', confirmText: '' });

  // Pagination
  const [currentPage, setCurrentPage] = useState(1);
  const itemsPerPage = 10;

  useEffect(() => {
    fetchSites();
  }, []);

  useEffect(() => {
    fetchTransactions();
  }, [appliedFilters]);

  const fetchSites = async () => {
    try {
      const data = await inventoryService.getSites();
      setSites(data || []);
    } catch (error) {
      toast.error('Failed to load sites');
    }
  };

  const fetchTransactions = async () => {
    setLoading(true);
    try {
      const params = {};
      if (appliedFilters.siteId) params.siteId = appliedFilters.siteId;
      if (appliedFilters.startDate) params.startDate = appliedFilters.startDate;
      if (appliedFilters.endDate) params.endDate = appliedFilters.endDate;

      const promises = [];

      // 1. Fetch Requests
      if (appliedFilters.type === 'All' || appliedFilters.type === 'Requests') {
        promises.push(
          requestService.getAllRequests(params)
            .then(res => {
              const list = res?.data || res || [];
              return list.map(item => ({
                ...item,
                transactionType: 'Request',
                date: item.createdAt,
                number: item.requestNo,
                statusText: item.status
              }));
            })
            .catch(() => [])
        );
      } else {
        promises.push(Promise.resolve([]));
      }

      // 2. Fetch Received Entries
      if (appliedFilters.type === 'All' || appliedFilters.type === 'Received') {
        promises.push(
          inventoryService.getReceivedEntries(params)
            .then(res => {
              const list = res?.data || res || [];
              return list.map(item => ({
                ...item,
                transactionType: 'Received',
                date: item.date || item.createdAt,
                number: item.entryNo,
                statusText: 'Completed'
              }));
            })
            .catch(() => [])
        );
      } else {
        promises.push(Promise.resolve([]));
      }

      // 3. Fetch Used Entries
      if (appliedFilters.type === 'All' || appliedFilters.type === 'Used') {
        promises.push(
          inventoryService.getUsedEntries(params)
            .then(res => {
              const list = res?.data || res || [];
              return list.map(item => ({
                ...item,
                transactionType: 'Used',
                date: item.date || item.createdAt,
                number: item.entryNo,
                statusText: 'Completed'
              }));
            })
            .catch(() => [])
        );
      } else {
        promises.push(Promise.resolve([]));
      }

      const [requests, received, used] = await Promise.all(promises);
      let merged = [...requests, ...received, ...used];

      // Client-side search by entry/order number
      if (appliedFilters.search) {
        const query = appliedFilters.search.toLowerCase();
        merged = merged.filter(item =>
          item.number?.toLowerCase().includes(query)
        );
      }

      // Filter by status if provided in URL
      if (statusFilter) {
        merged = merged.filter(item => item.transactionType === 'Request' && item.status === statusFilter);
      }

      // Sort by date descending
      merged.sort((a, b) => new Date(b.date) - new Date(a.date));
      setCombinedData(merged);
      setCurrentPage(1);
    } catch (error) {
      toast.error('Failed to load transactions');
    } finally {
      setLoading(false);
    }
  };

  const handleApplyFilters = () => {
    setAppliedFilters({
      siteId: selectedSite,
      type: selectedType,
      startDate,
      endDate,
      search: searchQuery
    });
  };

  const openModal = (e, type, id) => {
    e.stopPropagation();
    setModalConfig({
      type,
      id,
      title: type === 'approve' ? 'Approve Request' : 'Reject Request',
      confirmText: type === 'approve' ? 'Approve' : 'Reject'
    });
    setModalOpen(true);
  };

  const handleAction = async (comment) => {
    const { id, type } = modalConfig;
    try {
      setActionLoading(id);
      if (type === 'approve') {
        await requestService.approveRequest(id, { comment });
        toast.success('Request approved successfully');
      } else {
        await requestService.rejectRequest(id, { comment });
        toast.success('Request rejected successfully');
      }
      setModalOpen(false);
      fetchTransactions();
    } catch (err) {
      toast.error(err.response?.data?.message || `Failed to ${type}`);
    } finally {
      setActionLoading(null);
    }
  };

  const openDetails = (item) => {
    if (item.transactionType === 'Request') {
      navigate(`/requests/${item._id}`);
    } else if (item.transactionType === 'Received') {
      navigate(`/received/${item._id}`);
    } else if (item.transactionType === 'Used') {
      navigate(`/used/${item._id}`);
    }
  };

  const getMaterialsSummary = (materials) => {
    if (!materials || materials.length === 0) return 'None';
    return materials.map(m => {
      const raw = m.materialName || m.name || '';
      const capitalized = raw.charAt(0).toUpperCase() + raw.slice(1);
      return `${capitalized}: ${m.quantity || m.qty} ${m.unit}`;
    }).join(', ');
  };

  // Pagination Logic
  const totalPages = Math.ceil(combinedData.length / itemsPerPage);
  const paginatedData = combinedData.slice(
    (currentPage - 1) * itemsPerPage,
    currentPage * itemsPerPage
  );

  return (
    <>
      {/* Filter Bar Wrapper */}
      <div className="sticky top-[56px] left-0 right-0 z-40 bg-white   border-[#E5E7EB] overflow-x-hidden fixed-div">
        <div className="max-w-[428px] mx-auto px-4 py-2 flex flex-col gap-1.5">
          {/* FULL-WIDTH STICKY HEADER – DO NOT REMOVE OR WRAP IN CONTAINER */}
          <div className="fixed-div"></div>
          {/* Row 1: Site and Type */}
          <div className="flex gap-2 w-full">
            <select
              value={selectedSite}
              onChange={(e) => setSelectedSite(e.target.value)}
              className="flex-1 w-full p-2 text-sm border border-[#E5E7EB] rounded-md focus:outline-none focus:ring-2 focus:ring-[#2563EB] bg-white"
            >
              <option value="">All Sites</option>
              {sites.map(site => (
                <option key={site.siteId} value={site.siteId}>{site.siteName}</option>
              ))}
            </select>
            <select
              value={selectedType}
              onChange={(e) => setSelectedType(e.target.value)}
              className="flex-1 w-full p-2 text-sm border border-[#E5E7EB] rounded-md focus:outline-none focus:ring-2 focus:ring-[#2563EB] bg-white"
            >
              <option value="All">All Types</option>
              <option value="Requests">Requests</option>
              <option value="Received">Received</option>
              <option value="Used">Used</option>
            </select>
          </div>

          {/* Row 2: Date Range */}
          <div className="flex gap-2 w-full">
            <input
              type="date"
              value={startDate}
              onChange={(e) => setStartDate(e.target.value)}
              className="flex-1 w-full p-2 text-sm border border-[#E5E7EB] rounded-md focus:outline-none focus:ring-2 focus:ring-[#2563EB] bg-white text-[#6B7280]"
              title="Date From"
            />
            <input
              type="date"
              value={endDate}
              onChange={(e) => setEndDate(e.target.value)}
              className="flex-1 w-full p-2 text-sm border border-[#E5E7EB] rounded-md focus:outline-none focus:ring-2 focus:ring-[#2563EB] bg-white text-[#6B7280]"
              title="Date To"
            />
          </div>

          {/* Row 3: Search */}
          <div className="w-full">
            <div className="relative w-full">
              <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
                <Search className="h-4 w-4 text-slate-400" />
              </div>
              <input
                type="text"
                placeholder="Search REQ-, RCV-, USE-"
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                className="w-full pl-9 pr-3 p-2 text-sm border border-[#E5E7EB] rounded-md focus:outline-none focus:ring-2 focus:ring-[#2563EB] bg-white"
              />
            </div>
          </div>

          {/* Row 4: Apply Filters Button */}
          <button
            onClick={handleApplyFilters}
            className="w-full bg-[#2563EB] text-white px-4 py-2 rounded-md font-medium hover:bg-[#1d4ed8] transition-colors flex items-center justify-center text-sm"
          >
            Apply Filters
          </button>
        </div>
      </div>

      {/* Main Content */}
      <div className="flex flex-col min-h-screen space-y-4 max-w-[428px] mx-auto px-4 pb-4 pt-1">
        {loading ? (
          <div className="py-20 flex justify-center items-center">
            <Loader size="md" />
          </div>
        ) : (
          <>
            <div className="flex flex-col gap-2">
              {paginatedData.length > 0 ? (
                paginatedData.map(row => (
                  <div
                    key={row._id + '-' + row.transactionType}
                    className="bg-white rounded-lg p-2 shadow-sm border border-slate-200 hover:shadow-md transition-shadow cursor-pointer active:scale-[0.98]"
                    onClick={() => openDetails(row)}
                  >
                    <div className="flex justify-between items-start mb-2">
                      <div className="flex items-center gap-2">
                        <span className={`inline-flex px-2 py-0.5 rounded text-xs font-bold ${row.transactionType === 'Request' ? 'bg-blue-100 text-blue-800' :
                            row.transactionType === 'Received' ? 'bg-[#10B981] text-white' :
                              'bg-orange-100 text-orange-800'
                          }`}>
                          {row.transactionType}
                        </span>
                        <span className="text-sm font-bold text-[#1F2937]">{row.number}</span>
                      </div>
                      <span className="text-xs text-[#6B7280] font-medium">{formatDate(row.date)}</span>
                    </div>

                    <div className="mb-2 space-y-1">
                      <div className="text-sm text-[#6B7280]">
                        <span className="font-semibold text-[#1F2937]">Site:</span> {row.siteId?.siteName || '-'}
                      </div>
                      <div className="text-sm text-[#6B7280] line-clamp-2" title={getMaterialsSummary(row.materials)}>
                        <span className="font-semibold text-[#1F2937]">Materials:</span> {getMaterialsSummary(row.materials)}
                      </div>
                      {row.notes && (
                        <div className="text-sm text-[#6B7280] line-clamp-1 italic">
                          <span className="font-semibold text-[#1F2937] not-italic">Notes:</span> {row.notes}
                        </div>
                      )}
                    </div>

                    <div className="flex justify-between items-center pt-3 border-t border-slate-100">
                      <div className="flex items-center gap-2">
                        {row.transactionType === 'Request' ? (
                          <StatusBadge status={row.statusText} />
                        ) : (
                          <span className="inline-flex items-center gap-1 text-xs font-bold text-[#10B981]">
                            <CheckCircle2 className="w-3.5 h-3.5" /> Completed
                          </span>
                        )}
                      </div>
                      <div className="flex gap-2 items-center">
                        {row.transactionType === 'Request' && user?.role === 'manager' && row.status === 'pending_manager' && (
                          <>
                            <Button size="sm" className="bg-[#2563EB] text-white px-2 py-2.5 h-auto text-xs hover:bg-[#2563EB] rounded-md" onClick={(e) => openModal(e, 'approve', row._id)} disabled={actionLoading === row._id}>
                              {actionLoading === row._id ? '...' : 'Approve'}
                            </Button>
                            <Button size="sm" variant="outline" className="text-[#EF4444] border-[#EF4444] hover:bg-red-50 px-2 py-2.5 h-auto text-xs rounded-md" onClick={(e) => openModal(e, 'reject', row._id)} disabled={actionLoading === row._id}>
                              {actionLoading === row._id ? '...' : 'Reject'}
                            </Button>
                          </>
                        )}
                        {row.transactionType === 'Request' && user?.role === 'owner' && (row.status === 'pending_admin' || row.status === 'pending_owner') && (
                          <>
                            <Button size="sm" className="bg-[#2563EB] text-white px-2 py-2.5 h-auto text-xs hover:bg-[#2563EB] rounded-md" onClick={(e) => openModal(e, 'approve', row._id)} disabled={actionLoading === row._id}>
                              {actionLoading === row._id ? '...' : 'Approve'}
                            </Button>
                            <Button size="sm" variant="outline" className="text-[#EF4444] border-[#EF4444] hover:bg-red-50 px-2 py-2.5 h-auto text-xs rounded-md" onClick={(e) => openModal(e, 'reject', row._id)} disabled={actionLoading === row._id}>
                              {actionLoading === row._id ? '...' : 'Reject'}
                            </Button>
                          </>
                        )}
                        <Button variant="ghost" size="sm" onClick={(e) => { e.stopPropagation(); openDetails(row); }} className="text-[#2563EB] hover:bg-blue-50 py-2.5 px-2 h-auto text-xs rounded-md">
                          <Eye className="w-3 h-3 mr-1" /> View
                        </Button>
                      </div>
                    </div>
                  </div>
                ))
              ) : (
                <div className="text-center py-10 bg-[#f8faff] rounded-lg border border-dashed border-[#E5E7EB]">
                  <p className="text-sm font-medium text-[#6B7280]">
                    No transactions found.
                  </p>
                </div>
              )}
            </div>

            {/* Pagination controls */}
            {totalPages > 1 && (
              <div className="px-2 py-4 flex items-center justify-between">
                <span className="text-sm text-[#6B7280]">
                  Page <span className="font-bold">{currentPage}</span> of {totalPages}
                </span>
                <div className="flex gap-2">
                  <Button
                    variant="outline"
                    size="sm"
                    onClick={() => setCurrentPage(p => Math.max(p - 1, 1))}
                    disabled={currentPage === 1}
                    className="bg-white border-[#E5E7EB] text-[#1F2937] hover:bg-[#f8faff]"
                  >
                    Previous
                  </Button>
                  <Button
                    variant="outline"
                    size="sm"
                    onClick={() => setCurrentPage(p => Math.min(p + 1, totalPages))}
                    disabled={currentPage === totalPages}
                    className="bg-white border-[#E5E7EB] text-[#1F2937] hover:bg-[#f8faff]"
                  >
                    Next
                  </Button>
                </div>
              </div>
            )}
          </>
        )}
      </div>

      <CommentModal
        isOpen={modalOpen}
        onClose={() => setModalOpen(false)}
        onConfirm={handleAction}
        title={modalConfig.title}
        confirmText={modalConfig.confirmText}
        actionLoading={!!actionLoading}
      />
    </>
  );
}
