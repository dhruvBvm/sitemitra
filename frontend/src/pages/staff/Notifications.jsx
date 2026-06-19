import { useState, useEffect } from 'react';
import { Card, CardContent } from '../../components/common/Card';
import { Bell, CheckCircle, Info, XCircle } from 'lucide-react';
import { formatDate } from '../../utils/helpers';
import Button from '../../components/common/Button';
import { staffService } from '../../services/staff';
import toast from 'react-hot-toast';
import Loader from '../../components/common/Loader';

export default function Notifications() {
  const [notifications, setNotifications] = useState([]);
  const [loading, setLoading] = useState(true);

  const fetchNotifications = async () => {
    try {
      const data = await staffService.getNotifications();
      setNotifications(Array.isArray(data) ? data : []);
    } catch (error) {
      toast.error('Failed to load notifications');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchNotifications();
  }, []);

  const markAllAsRead = async () => {
    try {
      await staffService.markAllNotificationsAsRead();
      setNotifications(notifications.map(n => ({ ...n, isRead: true })));
      toast.success('All notifications marked as read');
    } catch (error) {
      toast.error('Failed to mark all as read');
    }
  };

  const markAsRead = async (id) => {
    try {
      await staffService.markNotificationAsRead(id);
      setNotifications(notifications.map(n => n._id === id ? { ...n, isRead: true } : n));
    } catch (error) {
      console.error(error);
    }
  };

  const getIcon = (type) => {
    switch (type) {
      case 'success': return <CheckCircle className="h-6 w-6 text-green-500" />;
      case 'error': return <XCircle className="h-6 w-6 text-red-500" />;
      default: return <Info className="h-6 w-6 text-[#2563EB]" />;
    }
  };

  return (
    <div className="flex flex-col min-h-screen space-y-4 max-w-[428px] mx-auto px-4 pb-4 pt-1">
      <div className="flex justify-between items-center mt-2 mb-4 border-b border-[#E5E7EB] pb-2">
        <h1 className="text-2xl font-bold text-[#1F2937] flex items-center tracking-tight">
          <Bell className="w-6 h-6 mr-2 text-[#6B7280]" />
          Notifications
        </h1>
        <Button variant="outline" size="sm" onClick={markAllAsRead}>
          Mark all as read
        </Button>
      </div>

      <div className="space-y-4">
        {loading && <Loader size="lg" className="mt-10" />}
        {!loading && notifications.length === 0 && (
          <div className="text-center text-[#6B7280] py-10">No notifications found</div>
        )}
        {!loading && notifications.map((notif) => (
          <div 
            key={notif._id} 
            className={`rounded-lg p-2 shadow-sm border transition-shadow cursor-pointer active:scale-[0.98] flex gap-2 ${!notif.isRead ? 'bg-blue-50 border-blue-200' : 'bg-white border-slate-200 hover:shadow-md'}`}
            onClick={() => !notif.isRead && markAsRead(notif._id)}
          >
              <div className="flex-shrink-0 mt-1">
                {getIcon(notif.type)}
              </div>
              <div className="flex-1">
                <div className="flex justify-between items-start">
                  <h4 className={`text-sm font-semibold ${!notif.isRead ? 'text-[#1F2937]' : 'text-[#1F2937]'}`}>
                    {notif.title}
                  </h4>
                  <span className="text-xs text-[#6B7280]">{formatDate(notif.createdAt)}</span>
                </div>
                <p className={`text-sm mt-1 ${!notif.isRead ? 'text-[#1F2937]' : 'text-[#6B7280]'}`}>
                  {notif.message}
                </p>
              </div>
              {!notif.isRead && (
                <div className="flex-shrink-0 self-center">
                  <span className="h-2.5 w-2.5 bg-[#2563EB] rounded-full inline-block"></span>
                </div>
              )}
          </div>
        ))}
      </div>
    </div>
  );
}
