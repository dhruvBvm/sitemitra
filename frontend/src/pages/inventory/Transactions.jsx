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
import { Search, Calendar, Filter, Eye, X, FileText, CheckCircle2, ArrowLeft, ThumbsUp, ThumbsDown } from 'lucide-react';
import { useAuthStore } from '../../store/authStore';
import CommentModal from '../../components/common/CommentModal';

export default function Transactions() {
  const navigate = useNavigate();
  const [searchParams] = useSearchParams();
  const statusFilter = searchParams.get('status');
  const { user } = useAuthStore();
  const [sites, setSites] = useState([]);

  // Filters
  const todayStr = new Date().toISOString().split('T')[0];
  const [selectedSite, setSelectedSite] = useState('');
  const [selectedType, setSelectedType] = useState('All');
  const [selectedDateRange, setSelectedDateRange] = useState('All Time');
  const [startDate, setStartDate] = useState(todayStr);
  const [endDate, setEndDate] = useState(todayStr);
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

      // Sort by createdAt descending (latest created at top)
      merged.sort((a, b) => {
        const timeA = new Date(a.createdAt || a.date).getTime();
        const timeB = new Date(b.createdAt || b.date).getTime();
        return timeB - timeA;
      });
      setCombinedData(merged);
      setCurrentPage(1);
    } catch (error) {
      toast.error('Failed to load transactions');
    } finally {
      setLoading(false);
    }
  };

  const handleDateRangeChange = (e) => {
    const range = e.target.value;
    setSelectedDateRange(range);
    
    const today = new Date();
    let start = '';
    let end = '';

    if (range === 'Today') {
      start = today.toISOString().split('T')[0];
      end = start;
    } else if (range === 'Yesterday') {
      const yesterday = new Date(today);
      yesterday.setDate(yesterday.getDate() - 1);
      start = yesterday.toISOString().split('T')[0];
      end = start;
    } else if (range === 'Last Week') {
      const lastWeek = new Date(today);
      lastWeek.setDate(lastWeek.getDate() - 7);
      start = lastWeek.toISOString().split('T')[0];
      end = today.toISOString().split('T')[0];
    } else if (range === 'Last Month') {
      const lastMonth = new Date(today);
      lastMonth.setDate(lastMonth.getDate() - 30);
      start = lastMonth.toISOString().split('T')[0];
      end = today.toISOString().split('T')[0];
    }

    setStartDate(start);
    setEndDate(end);
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
      <div className="sticky top-0 left-0 right-0 z-40 bg-white   border-[#E5E7EB] overflow-x-hidden fixed-div">
        <div className="max-w-[428px] mx-auto px-4 pt-3 pb-2 flex flex-col gap-1.5">
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
            <select
              value={selectedDateRange}
              onChange={handleDateRangeChange}
              className="flex-1 w-full p-2 text-sm border border-[#E5E7EB] rounded-md focus:outline-none focus:ring-2 focus:ring-[#2563EB] bg-white"
            >
              <option value="All Time">All Time</option>
              <option value="Today">Today</option>
              <option value="Yesterday">Yesterday</option>
              <option value="Last Week">Last Week</option>
              <option value="Last Month">Last Month</option>
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

          {/* Row 3: Search and Apply Filters */}
          <div className="flex gap-2 w-full">
            <div className="relative flex-1">
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
            <button
              onClick={handleApplyFilters}
              className="shrink-0 bg-[#2563EB] text-white px-4 py-2 rounded-md font-medium hover:bg-[#1d4ed8] transition-colors flex items-center justify-center text-sm"
            >
              Apply Filters
            </button>
          </div>
        </div>
      </div>

      {/* Main Content */}
      <div className="flex flex-col  space-y-4 max-w-[428px] mx-auto px-4 pb-4 pt-3">
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
                    className="bg-white rounded-lg p-3 shadow-sm border border-slate-200 hover:shadow-md transition-shadow cursor-pointer active:scale-[0.98]"
                    onClick={() => openDetails(row)}
                  >
                    <div className="flex justify-between items-start">
                      <div className="flex-1 min-w-0 pr-2">
                        <div className="flex items-center gap-2 mb-2">
                          <span className={`inline-flex px-2 py-0.5 rounded text-xs font-bold ${row.transactionType === 'Request' ? 'bg-[#2563EB] text-white' :
                              row.transactionType === 'Received' ? 'bg-[#10B981] text-white' :
                                'bg-[#F97316] text-white'
                            }`}>
                            {row.transactionType}
                          </span>
                          <span className="text-sm font-bold text-[#1F2937] truncate">{row.number}</span>
                        </div>

                        <div className="space-y-1">
                          <div className="text-sm text-[#6B7280]">
                            <span className="font-semibold text-[#1F2937]">Site:</span> {row.siteId?.siteName || '-'}
                          </div>
                          <div className="text-sm text-[#6B7280] line-clamp-2" title={getMaterialsSummary(row.materials)}>
                            <span className="font-semibold text-[#1F2937]">Materials:</span> {getMaterialsSummary(row.materials)}
                          </div>
                        </div>
                      </div>

                      <div className="flex flex-col items-end gap-2 shrink-0">
                        <span className="text-xs text-[#6B7280] font-medium">{formatDate(row.date)}</span>
                        
                        <div className="flex items-center">
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
                              <button onClick={(e) => { e.stopPropagation(); openModal(e, 'approve', row._id); }} disabled={actionLoading === row._id} className="p-2 flex items-center justify-center bg-[#f8faff] text-[#2563EB] rounded-[6px] hover:bg-blue-100 transition-colors border border-[#E5E7EB]" title="Approve">
                                {actionLoading === row._id ? '...' : <ThumbsUp className="w-[18px] h-[18px]" />}
                              </button>
                              <button onClick={(e) => { e.stopPropagation(); openModal(e, 'reject', row._id); }} disabled={actionLoading === row._id} className="p-2 flex items-center justify-center bg-[#f8faff] text-[#EF4444] rounded-[6px] hover:bg-red-50 transition-colors border border-[#E5E7EB]" title="Reject">
                                {actionLoading === row._id ? '...' : <ThumbsDown className="w-[18px] h-[18px]" />}
                              </button>
                            </>
                          )}
                          {row.transactionType === 'Request' && user?.role === 'owner' && (row.status === 'pending_admin' || row.status === 'pending_owner') && (
                            <>
                              <button onClick={(e) => { e.stopPropagation(); openModal(e, 'approve', row._id); }} disabled={actionLoading === row._id} className="p-2 flex items-center justify-center bg-[#f8faff] text-[#2563EB] rounded-[6px] hover:bg-blue-100 transition-colors border border-[#E5E7EB]" title="Approve">
                                {actionLoading === row._id ? '...' : <ThumbsUp className="w-[18px] h-[18px]" />}
                              </button>
                              <button onClick={(e) => { e.stopPropagation(); openModal(e, 'reject', row._id); }} disabled={actionLoading === row._id} className="p-2 flex items-center justify-center bg-[#f8faff] text-[#EF4444] rounded-[6px] hover:bg-red-50 transition-colors border border-[#E5E7EB]" title="Reject">
                                {actionLoading === row._id ? '...' : <ThumbsDown className="w-[18px] h-[18px]" />}
                              </button>
                            </>
                          )}
                        </div>
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
