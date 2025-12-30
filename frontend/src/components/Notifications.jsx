import { useState, useEffect } from 'react';
import { toast } from 'react-toastify';
import socketService from '../services/socket.service';
import { notificationService } from '../services/api.service';
import { FiBell, FiAlertCircle, FiCheckCircle, FiInfo } from 'react-icons/fi';

function Notifications() {
  const [notifications, setNotifications] = useState([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    // Fetch existing notifications on mount
    fetchNotifications();

    // Listen for real-time announcements
    const handleAnnouncement = (data) => {
      console.log('📢 Announcement received:', data);
      const newNotification = {
        _id: Date.now().toString(),
        title: data.title,
        message: data.message,
        type: 'admin',
        createdAt: new Date().toISOString(),
        isRead: false
      };
      setNotifications(prev => [newNotification, ...prev]);
      toast.info(`New announcement: ${data.title}`);
    };

    if (socketService.socket) {
      socketService.socket.on('announcement', handleAnnouncement);
    }

    return () => {
      if (socketService.socket) {
        socketService.socket.off('announcement', handleAnnouncement);
      }
    };
  }, []);

  const fetchNotifications = async () => {
    try {
      setLoading(true);
      const response = await notificationService.getNotifications();
      setNotifications(response.notifications || []);
    } catch (error) {
      console.error('Error fetching notifications:', error);
      toast.error('Failed to load notifications');
    } finally {
      setLoading(false);
    }
  };

  const getIcon = (type) => {
    switch (type) {
      case 'admin':
        return <FiBell className="w-6 h-6 text-blue-600" />;
      case 'ride_cancelled':
        return <FiAlertCircle className="w-6 h-6 text-red-600" />;
      case 'ride_completed':
        return <FiCheckCircle className="w-6 h-6 text-green-600" />;
      default:
        return <FiInfo className="w-6 h-6 text-gray-600" />;
    }
  };

  const formatDate = (date) => {
    const d = new Date(date);
    const now = new Date();
    const diffMs = now - d;
    const diffMins = Math.floor(diffMs / 60000);
    const diffHours = Math.floor(diffMs / 3600000);
    const diffDays = Math.floor(diffMs / 86400000);

    if (diffMins < 1) return 'Just now';
    if (diffMins < 60) return `${diffMins} min${diffMins > 1 ? 's' : ''} ago`;
    if (diffHours < 24) return `${diffHours} hour${diffHours > 1 ? 's' : ''} ago`;
    if (diffDays < 7) return `${diffDays} day${diffDays > 1 ? 's' : ''} ago`;
    
    return d.toLocaleDateString('en-US', {
      month: 'short',
      day: 'numeric',
      year: d.getFullYear() !== now.getFullYear() ? 'numeric' : undefined
    });
  };

  const markAsRead = async (id) => {
    try {
      await notificationService.markAsRead(id);
      setNotifications(prev =>
        prev.map(notif =>
          notif._id === id ? { ...notif, isRead: true } : notif
        )
      );
    } catch (error) {
      console.error('Error marking as read:', error);
    }
  };

  const markAllAsRead = async () => {
    try {
      await notificationService.markAllAsRead();
      setNotifications(prev => prev.map(n => ({ ...n, isRead: true })));
      toast.success('All notifications marked as read');
    } catch (error) {
      console.error('Error marking all as read:', error);
      toast.error('Failed to mark all as read');
    }
  };

  return (
    <div className="max-w-4xl mx-auto">
      <div className="flex items-center justify-between mb-6">
        <h2 className="text-2xl font-bold text-gray-800">Notifications</h2>
        {notifications.some(n => !n.isRead) && (
          <button
            onClick={markAllAsRead}
            className="text-sm text-primary hover:underline"
          >
            Mark all as read
          </button>
        )}
      </div>

      {loading ? (
        <div className="card">
          <div className="flex justify-center items-center py-12">
            <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-primary"></div>
          </div>
        </div>
      ) : notifications.length === 0 ? (
        <div className="card">
          <div className="text-center py-12">
            <FiBell className="w-16 h-16 text-gray-400 mx-auto mb-4" />
            <p className="text-gray-600 text-lg">No notifications yet</p>
            <p className="text-gray-500 text-sm mt-2">
              You'll see announcements and updates here
            </p>
          </div>
        </div>
      ) : (
        <div className="space-y-3">
          {notifications.map((notification) => (
            <div
              key={notification._id}
              onClick={() => markAsRead(notification._id)}
              className={`card hover:shadow-lg transition-shadow cursor-pointer ${
                !notification.isRead ? 'border-l-4 border-primary bg-blue-50' : ''
              }`}
            >
              <div className="flex gap-4">
                <div className="flex-shrink-0">
                  {getIcon(notification.type)}
                </div>
                <div className="flex-1 min-w-0">
                  <div className="flex items-start justify-between mb-1">
                    <h3 className="font-semibold text-gray-900">
                      {notification.title}
                      {!notification.isRead && (
                        <span className="ml-2 inline-block w-2 h-2 bg-primary rounded-full"></span>
                      )}
                    </h3>
                    <span className="text-xs text-gray-500 whitespace-nowrap ml-2">
                      {formatDate(notification.createdAt)}
                    </span>
                  </div>
                  <p className="text-gray-700 whitespace-pre-wrap">
                    {notification.message}
                  </p>
                </div>
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}

export default Notifications;
