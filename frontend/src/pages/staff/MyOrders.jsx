import { useState, useEffect } from 'react';
import StatusBadge from '../../components/common/StatusBadge';
import Modal from '../../components/common/Modal';
import Button from '../../components/common/Button';
import { Card, CardContent } from '../../components/common/Card';
import { Eye, Plus, Check, X, Truck, FileText } from 'lucide-react';
import { formatDate } from '../../utils/helpers';
import { staffService } from '../../services/staff';
import Loader from '../../components/common/Loader';
import toast from 'react-hot-toast';
import { useNavigate } from 'react-router-dom';

export default function MyOrders() {
  const [orders, setOrders] = useState([]);
  const [loading, setLoading] = useState(true);
  const [showNotes, setShowNotes] = useState(false);
  const navigate = useNavigate();

  const fetchOrders = async () => {
    try {
      const data = await staffService.getMyOrders();
      setOrders(Array.isArray(data) ? data : []);
    } catch (error) {
      toast.error('Failed to load your orders');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchOrders();
  }, []);

  const handleView = (row) => {
    navigate(`/staff/requests/${row._id}`);
  };

  if (loading) return <Loader size="lg" className="mt-20" />;

  return (
    <div className="flex flex-col  space-y-4 max-w-[428px] mx-auto px-4 pb-4 pt-3">
      <div className="flex justify-between items-center mt-2 pb-2">
        <div>
          <h1 className="text-2xl font-bold tracking-tight text-[#1F2937]">My Requests</h1>
          <p className="text-sm font-medium text-[#6B7280]">Track your material requests</p>
        </div>
        <Button
          onClick={() => navigate('/staff/create-order')}
          className="bg-[#2563EB] text-white hover:bg-[#2563EB] py-2 px-2 text-sm rounded-md flex items-center"
        >
          <Plus className="w-5 h-5 mr-1 stroke-[2.5]" />
          Request
        </Button>
      </div>

      <div className="flex flex-col space-y-2">
        {orders.length === 0 ? (
          <div className="text-center py-12 bg-white rounded-md border border-dashed border-[#E5E7EB]">
            <FileText className="w-9 h-9 text-slate-300 mx-auto mb-2" />
            <p className="text-sm font-medium text-[#6B7280]">You haven't created any requests yet.</p>
          </div>
        ) : (
          orders.map(order => (
            <div
              key={order._id}
              className="bg-white rounded-lg p-3 shadow-sm border border-slate-200 hover:shadow-md transition-shadow cursor-pointer active:scale-[0.98]"
              onClick={() => handleView(order)}
            >
              <div className="flex justify-between items-start">
                <div className="flex-1 min-w-0 pr-2">
                  <div className="flex items-center gap-2 mb-2">
                    <span className="inline-flex px-2 py-0.5 rounded text-xs font-bold bg-[#2563EB] text-white">
                      Request
                    </span>
                    <span className="text-sm font-bold text-[#1F2937] truncate">{order.requestNo || order.orderNo}</span>
                  </div>

                  <div className="space-y-1">
                    <div className="text-sm text-[#6B7280]">
                      <span className="font-semibold text-[#1F2937]">Site:</span> {order.siteId?.siteName || '-'}
                    </div>
                    <div className="text-sm text-[#6B7280] line-clamp-2" title={
                      order.materials?.length > 0 ?
                        order.materials.map(m => {
                          const raw = m.materialName || m.name || '';
                          const capitalized = raw.charAt(0).toUpperCase() + raw.slice(1);
                          return `${capitalized}: ${m.quantity || m.qty} ${m.unit}`;
                        }).join(', ')
                        : 'None'
                    }>
                      <span className="font-semibold text-[#1F2937]">Materials:</span> {
                        order.materials?.length > 0 ?
                          order.materials.map(m => {
                            const raw = m.materialName || m.name || '';
                            const capitalized = raw.charAt(0).toUpperCase() + raw.slice(1);
                            return `${capitalized}: ${m.quantity || m.qty} ${m.unit}`;
                          }).join(', ')
                          : 'None'
                      }
                    </div>
                  </div>
                </div>

                <div className="flex flex-col items-end gap-2 shrink-0">
                  <span className="text-xs text-[#6B7280] font-medium">{formatDate(order.createdAt)}</span>

                  <div className="flex items-center">
                    <StatusBadge status={order.status} />
                  </div>
                </div>
              </div>
            </div>
          ))
        )}
      </div>

    </div>
  );
}
