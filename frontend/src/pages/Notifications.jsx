import { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { ArrowLeft, Bell, Check, CheckCircle2 } from 'lucide-react';
import { notificationService } from '../services/notification';
import Loader from '../components/common/Loader';

export default function Notifications() {
  const navigate = useNavigate();
  const [notifications, setNotifications] = useState([]);
  const [loading, setLoading] = useState(true);

  const fetchNotifications = async () => {
    try {
      const data = await notificationService.getNotifications();
      setNotifications(data);
    } catch (error) {
      console.error('Failed to fetch notifications', error);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchNotifications();
    const interval = setInterval(fetchNotifications, 30000);
    return () => clearInterval(interval);
  }, []);

  const handleMarkAsRead = async (id, e) => {
    e.stopPropagation();
    try {
      await notificationService.markAsRead(id);
      fetchNotifications();
    } catch (error) {
      console.error('Failed to mark as read', error);
    }
  };

  const handleMarkAllRead = async () => {
    try {
      await notificationService.markAllRead();
      fetchNotifications();
    } catch (error) {
      console.error('Failed to mark all as read', error);
    }
  };

  const unreadCount = notifications.filter(n => !n.isRead).length;

  if (loading) return <Loader size="lg" className="mt-20" />;

  return (
    <>
      {/* Header */}
      <div className="sticky top-0 left-0 right-0 z-40 bg-white border-b border-[#E5E7EB] overflow-x-hidden">
        <div className="max-w-[428px] mx-auto px-4 py-2 flex items-center justify-between">
          <div className="flex items-center gap-2">
            <button onClick={() => navigate(-1)} className="p-1.5 bg-[#F3F4F6] text-[#6B7280] rounded-full hover:bg-[#E5E7EB] transition-colors">
              <ArrowLeft className="w-5 h-5" />
            </button>
            <h1 className="text-[1.1rem] font-bold tracking-tight text-[#1F2937]">Notifications</h1>
          </div>
          {unreadCount > 0 && (
            <button 
              onClick={handleMarkAllRead}
              className="text-xs font-semibold text-[#2563EB] hover:bg-blue-50 px-2 py-1.5 rounded-md transition-colors"
            >
              Mark all read
            </button>
          )}
        </div>
      </div>

      {/* Content */}
      <div className="max-w-[428px] mx-auto px-4 py-4 min-h-[calc(100vh-140px)]">
        {notifications.length === 0 ? (
          <div className="flex flex-col items-center justify-center py-20 text-center">
            <div className="w-16 h-16 bg-blue-50 rounded-full flex items-center justify-center mb-4">
              <Bell className="w-8 h-8 text-blue-300" />
            </div>
            <h3 className="text-lg font-bold text-[#1F2937] mb-1">All Caught Up!</h3>
            <p className="text-sm text-[#6B7280]">You don't have any notifications right now.</p>
          </div>
        ) : (
          <div className="space-y-3">
            {notifications.map((notification) => (
              <div 
                key={notification._id} 
                className={`p-4 rounded-xl border transition-all ${
                  notification.isRead 
                    ? 'bg-white border-slate-200' 
                    : 'bg-blue-50/50 border-blue-100 shadow-sm'
                }`}
              >
                <div className="flex justify-between items-start mb-2">
                  <h4 className={`text-base font-bold leading-tight ${notification.isRead ? 'text-[#374151]' : 'text-[#1F2937]'}`}>
                    {notification.title}
                  </h4>
                  {!notification.isRead ? (
                    <button 
                      onClick={(e) => handleMarkAsRead(notification._id, e)}
                      className="shrink-0 ml-3 flex items-center justify-center w-7 h-7 rounded-full bg-blue-100 text-blue-600 hover:bg-blue-200 transition-colors"
                      title="Mark as read"
                    >
                      <Check className="w-4 h-4" />
                    </button>
                  ) : (
                    <div className="shrink-0 ml-3 flex items-center justify-center w-7 h-7 rounded-full text-emerald-500">
                      <CheckCircle2 className="w-4 h-4" />
                    </div>
                  )}
                </div>
                <p className="text-sm text-[#4B5563] leading-relaxed mb-3">
                  {notification.message}
                </p>
                <div className="flex items-center text-xs font-medium text-slate-400">
                  {new Date(notification.createdAt).toLocaleString([], { month: 'short', day: 'numeric', hour: '2-digit', minute: '2-digit' })}
                </div>
              </div>
            ))}
          </div>
        )}
      </div>
    </>
  );
}
