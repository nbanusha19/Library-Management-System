import { useEffect, useRef, useState } from "react";
import { api } from "../api";
import { useAuth } from "../hooks/useAuth";
import "../styles/notification-bell.css";

export default function NotificationBell() {
  const { user } = useAuth();
  const [notifications, setNotifications] = useState([]);
  const [unreadCount, setUnreadCount] = useState(0);
  const [isOpen, setIsOpen] = useState(false);
  const [loading, setLoading] = useState(false);
  const dropdownRef = useRef(null);

  // Load notifications
  const loadNotifications = async () => {
    try {
      setLoading(true);
      const data = await api.notifications();
      setNotifications(data);
      const count = data.filter(n => !n.is_read).length;
      setUnreadCount(count);
    } catch (error) {
      console.error("Failed to load notifications:", error);
    } finally {
      setLoading(false);
    }
  };

  // Load notifications on mount and every 30 seconds
  useEffect(() => {
    if (user) {
      loadNotifications();
      const interval = setInterval(loadNotifications, 30000);
      return () => clearInterval(interval);
    }
  }, [user]);

  // Close dropdown when clicking outside
  useEffect(() => {
    const handleClickOutside = (e) => {
      if (dropdownRef.current && !dropdownRef.current.contains(e.target)) {
        setIsOpen(false);
      }
    };
    if (isOpen) {
      document.addEventListener("mousedown", handleClickOutside);
    }
    return () => {
      document.removeEventListener("mousedown", handleClickOutside);
    };
  }, [isOpen]);

  const handleMarkAsRead = async (notificationId) => {
    try {
      await api.markNotificationRead(notificationId);
      setNotifications(notifications.map(n => 
        n.id === notificationId ? { ...n, is_read: 1 } : n
      ));
      setUnreadCount(Math.max(0, unreadCount - 1));
    } catch (error) {
      console.error("Failed to mark notification as read:", error);
    }
  };

  const handleMarkAllAsRead = async () => {
    try {
      await api.markAllNotificationsRead();
      setNotifications(notifications.map(n => ({ ...n, is_read: 1 })));
      setUnreadCount(0);
      console.log("All notifications marked as read");
    } catch (error) {
      console.error("Failed to mark all notifications as read:", error);
    }
  };

  const handleNotificationClick = (notification) => {
    if (!notification.is_read) {
      handleMarkAsRead(notification.id);
    }

    // Navigate based on notification type
    if (notification.type === "BORROW_REQUEST") {
      window.location.href = "/#/requests";
    } else if (notification.type === "USER_REGISTRATION") {
      window.location.href = "/#/users";
    } else if (notification.type === "OVERDUE_BOOK") {
      window.location.href = "/#/overdue";
    }
  };

  if (!user) return null;

  return (
    <div className="notification-bell-container" ref={dropdownRef}>
      <button
        className={`notification-bell-button ${unreadCount > 0 ? "has-unread" : ""}`}
        onClick={() => setIsOpen(!isOpen)}
        title={`${unreadCount} unread notification${unreadCount !== 1 ? "s" : ""}`}
      >
        <span className="bell-icon">🔔</span>
        {unreadCount > 0 && <span className="badge">{unreadCount}</span>}
      </button>

      {isOpen && (
        <div className="notification-dropdown">
          <div className="notification-header">
            <h3>Notifications</h3>
            {unreadCount > 0 && (
              <button
                className="mark-all-read-button"
                onClick={handleMarkAllAsRead}
                title="Mark all as read"
              >
                ✓ Mark all as read
              </button>
            )}
          </div>

          {loading ? (
            <div className="notification-item loading">
              <div className="spinner-small"></div>
              <p>Loading...</p>
            </div>
          ) : notifications.length === 0 ? (
            <div className="notification-item empty">
              <p>No notifications</p>
            </div>
          ) : (
            <div className="notification-list">
              {notifications.map((notification) => (
                <div
                  key={notification.id}
                  className={`notification-item ${!notification.is_read ? "unread" : ""}`}
                  onClick={() => handleNotificationClick(notification)}
                >
                  <div className="notification-content">
                    <div className="notification-title">{notification.title}</div>
                    <div className="notification-message">{notification.message}</div>
                    <div className="notification-type">{notification.type.replace(/_/g, " ")}</div>
                  </div>
                  {!notification.is_read && <div className="unread-indicator"></div>}
                </div>
              ))}
            </div>
          )}
        </div>
      )}
    </div>
  );
}
