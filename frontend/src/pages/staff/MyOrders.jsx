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
    <div className="space-y-4 pb-20 max-w-[428px] mx-auto overflow-x-hidden p-4">
      <div className="flex justify-between items-center pb-2">
        <div>
          <h1 className="text-2xl font-bold tracking-tight text-[#1F2937]">My Requests</h1>
          <p className="text-sm font-medium text-[#6B7280]">Track your material requests</p>
        </div>
        <Button 
          onClick={() => navigate('/staff/create-order')} 
          className="bg-[#2563EB] text-white hover:bg-[#2563EB] py-3 px-4 text-sm rounded-[16px] flex items-center"
        >
          <Plus className="w-4 h-4 mr-1 stroke-[2.5]" />
          New Request
        </Button>
      </div>

      <div className="flex flex-col space-y-3">
        {orders.length === 0 ? (
          <div className="text-center py-12 bg-white rounded-[20px] border border-dashed border-[#E5E7EB]">
            <FileText className="w-10 h-10 text-slate-300 mx-auto mb-3" />
            <p className="text-sm font-medium text-[#6B7280]">You haven't created any requests yet.</p>
          </div>
        ) : (
          orders.map(order => (
            <Card 
              key={order._id} 
              className="shadow-sm border-[#E5E7EB] cursor-pointer hover:border-[#2563EB] transition-colors rounded-[20px]"
              onClick={() => handleView(order)}
            >
              <CardContent className="p-[14px] flex flex-col space-y-3">
                <div className="flex justify-between items-start">
                  <div>
                    <span className="inline-flex px-2 py-1 rounded text-xs font-bold mb-1.5 bg-[#FFC107]/20 text-[#FFC107] uppercase tracking-wider">
                      Request
                    </span>
                    <h3 className="font-bold text-[#1F2937] text-base">{order.requestNo || order.orderNo}</h3>
                  </div>
                  <div className="text-right">
                    <span className="text-xs font-medium text-slate-400 block mb-1.5">{formatDate(order.createdAt)}</span>
                    <StatusBadge status={order.status} />
                  </div>
                </div>
                <div className="text-sm text-[#6B7280] border-t border-slate-100 pt-2 grid grid-cols-2 gap-2">
                  <div>
                    <span className="text-xs text-[#6B7280] block uppercase font-bold tracking-wider mb-0.5">Site</span>
                    <span className="font-medium text-[#1F2937]">{order.siteId?.siteName || '-'}</span>
                  </div>
                  <div>
                    <span className="text-xs text-[#6B7280] block uppercase font-bold tracking-wider mb-0.5">Priority</span>
                    <span className={`font-bold capitalize ${order.priority === 'high' ? 'text-red-500' : 'text-[#1F2937]'}`}>{order.priority || 'Normal'}</span>
                  </div>
                </div>
                <div className="text-sm text-[#6B7280] border-t border-slate-100 pt-2">
                  <span className="text-xs text-[#6B7280] block mb-1 uppercase font-bold tracking-wider">Materials</span>
                  <p className="line-clamp-2">
                    {order.materials?.length > 0 ? 
                      order.materials.map(m => `${m.materialName || m.name}: ${m.quantity || m.qty} ${m.unit}`).join(', ') 
                      : 'None'}
                  </p>
                </div>
              </CardContent>
            </Card>
          ))
        )}
      </div>

    </div>
  );
}
