import { useState, useEffect } from "react";
import { useFetcher } from "@remix-run/react";
import { useTranslation } from "react-i18next";

// Add custom scrollbar styles
const scrollbarStyles = `
  .notification-list::-webkit-scrollbar {
    width: 8px;
  }
  
  .notification-list::-webkit-scrollbar-track {
    background: rgba(255, 255, 255, 0.05);
    border-radius: 4px;
  }
  
  .notification-list::-webkit-scrollbar-thumb {
    background: rgba(103, 126, 234, 0.3);
    border-radius: 4px;
    transition: background 0.2s ease;
  }
  
  .notification-list::-webkit-scrollbar-thumb:hover {
    background: rgba(103, 126, 234, 0.5);
  }

  @media (max-width: 1024px) {
    .notification-panel {
      position: fixed !important;
      top: 0 !important;
      left: 0 !important;
      right: 0 !important;
      bottom: 0 !important;
      width: 85% !important;
      max-width: 350px !important;
      height: 100vh !important;
      max-height: 100vh !important;
      border-radius: 0 !important;
      border: none !important;
      border-right: 1px solid var(--glass-border) !important;
      z-index: 10001 !important;
      transform-origin: left center !important;
    }
    
    .notification-panel.closing {
      transform: translateX(-100%) !important;
    }
  }

  @media (min-width: 1025px) {
    .notification-panel {
      top: 70px !important;
      height: calc(100vh - 70px) !important;
      max-height: calc(100vh - 70px) !important;
    }
  }

  [data-theme="light"] .notification-panel {
    background: rgba(255, 255, 255, 0.98) !important;
    border-color: rgba(0, 0, 0, 0.3) !important;
  }

  [data-theme="dark"] .notification-panel {
    background: rgba(42, 36, 56, 0.98) !important;
    border-color: rgba(255, 255, 255, 0.3) !important;
  }
`;

interface Notification {
  id: number;
  type: string;
  title: string;
  message: string;
  reservation_id: number | null;
  is_read: boolean;
  created_at: string;
  reservation_start?: string;
  reservation_end?: string;
  room_name?: string;
  room_name_en?: string;
  room_name_hu?: string;
}

interface NotificationPanelProps {
  isOpen: boolean;
  onClose: () => void;
}

export default function NotificationPanel({ isOpen, onClose }: NotificationPanelProps) {
  const { t, i18n } = useTranslation();
  const fetcher = useFetcher<{ notifications: Notification[]; unreadCount: number }>();
  const actionFetcher = useFetcher();
  const [notifications, setNotifications] = useState<Notification[]>([]);
  const [hasMarkedAsRead, setHasMarkedAsRead] = useState(false);
  const [isMobile, setIsMobile] = useState(false);
  
  // Swipe to close functionality
  const [touchStart, setTouchStart] = useState<number | null>(null);
  const [touchEnd, setTouchEnd] = useState<number | null>(null);
  const [dragOffset, setDragOffset] = useState(0);

  // Minimum swipe distance (in px) to trigger close
  const minSwipeDistance = 50;

  const onTouchStart = (e: React.TouchEvent) => {
    setTouchEnd(null);
    setTouchStart(e.targetTouches[0].clientX);
  };

  const onTouchMove = (e: React.TouchEvent) => {
    const currentTouch = e.targetTouches[0].clientX;
    setTouchEnd(currentTouch);
    
    // Calculate drag offset (only allow left swipe)
    const distance = touchStart !== null ? currentTouch - touchStart : 0;
    if (distance < 0) {
      setDragOffset(distance);
    }
  };

  const onTouchEnd = () => {
    if (!touchStart || !touchEnd) {
      setDragOffset(0);
      return;
    }
    
    const distance = touchStart - touchEnd;
    const isLeftSwipe = distance > minSwipeDistance;
    
    if (isLeftSwipe) {
      onClose();
    }
    
    setDragOffset(0);
    setTouchStart(null);
    setTouchEnd(null);
  };

  // Detect mobile on client-side only
  useEffect(() => {
    const checkMobile = () => {
      setIsMobile(window.innerWidth <= 1024);
    };
    
    checkMobile();
    window.addEventListener('resize', checkMobile);
    return () => window.removeEventListener('resize', checkMobile);
  }, []);

  useEffect(() => {
    if (isOpen && fetcher.state === "idle" && !fetcher.data) {
      fetcher.load("/api/notifications");
    }
  }, [isOpen]);

  useEffect(() => {
    if (fetcher.data?.notifications) {
      setNotifications(fetcher.data.notifications);
    }
  }, [fetcher.data]);

  // Automatically mark all as read when panel opens (only once per opening)
  useEffect(() => {
    if (isOpen && notifications.length > 0 && !hasMarkedAsRead) {
      const hasUnread = notifications.some(n => !n.is_read);
      if (hasUnread) {
        // Mark all as read after a short delay (500ms) so user sees the unread state briefly
        const timer = setTimeout(() => {
          markAsRead('all');
          setHasMarkedAsRead(true);
        }, 500);
        return () => clearTimeout(timer);
      }
    }
    
    // Reset the flag when panel closes
    if (!isOpen) {
      setHasMarkedAsRead(false);
    }
  }, [isOpen, notifications, hasMarkedAsRead]);

  const formatTime = (dateString: string) => {
    const date = new Date(dateString);
    const now = new Date();
    const diff = now.getTime() - date.getTime();
    const minutes = Math.floor(diff / 60000);
    const hours = Math.floor(diff / 3600000);
    const days = Math.floor(diff / 86400000);

    if (minutes < 1) return t("notifications.justNow") || "Just now";
    if (minutes < 60) return `${minutes}${t("notifications.minutesAgo") || "m ago"}`;
    if (hours < 24) return `${hours}${t("notifications.hoursAgo") || "h ago"}`;
    if (days < 7) return `${days}${t("notifications.daysAgo") || "d ago"}`;
    return date.toLocaleDateString(i18n.language === 'hu' ? 'hu-HU' : 'en-US');
  };

  const getRoomName = (notification: Notification) => {
    const isHungarian = i18n.language === 'hu';
    if (isHungarian && notification.room_name_hu) return notification.room_name_hu;
    if (!isHungarian && notification.room_name_en) return notification.room_name_en;
    return notification.room_name || '';
  };

  const markAsRead = (notificationId: number | 'all') => {
    actionFetcher.submit(
      {
        intent: "markAsRead",
        notificationId: notificationId.toString(),
      },
      { method: "post", action: "/api/notifications" }
    );

    // Optimistically update UI
    if (notificationId === 'all') {
      setNotifications(prev => prev.map(n => ({ ...n, is_read: true })));
    } else {
      setNotifications(prev =>
        prev.map(n => (n.id === notificationId ? { ...n, is_read: true } : n))
      );
    }
  };

  const deleteNotification = (notificationId: number) => {
    actionFetcher.submit(
      {
        intent: "delete",
        notificationId: notificationId.toString(),
      },
      { method: "post", action: "/api/notifications" }
    );

    // Optimistically update UI
    setNotifications(prev => prev.filter(n => n.id !== notificationId));
  };

  const deleteAllNotifications = () => {
    actionFetcher.submit(
      {
        intent: "deleteAll",
      },
      { method: "post", action: "/api/notifications" }
    );

    // Optimistically update UI
    setNotifications([]);
  };

  return (
    <>
      {/* Custom scrollbar styles */}
      <style>{scrollbarStyles}</style>

      {/* Notification Panel */}
      <div
        className="notification-panel"
        onTouchStart={isMobile ? onTouchStart : undefined}
        onTouchMove={isMobile ? onTouchMove : undefined}
        onTouchEnd={isMobile ? onTouchEnd : undefined}
        style={{
          position: 'fixed',
          top: isMobile ? 0 : '70px',
          left: isMobile ? 0 : 'auto',
          right: isMobile ? 'auto' : '20px',
          width: isMobile ? '85%' : '380px',
          maxWidth: isMobile ? '350px' : '380px',
          height: isMobile ? '100vh' : 'calc(100vh - 70px)',
          maxHeight: isMobile ? '100vh' : 'calc(100vh - 70px)',
          background: 'rgba(42, 36, 56, 0.98)',
          backdropFilter: 'blur(20px)',
          border: isMobile ? 'none' : '1px solid rgba(255, 255, 255, 0.3)',
          borderRight: isMobile ? '1px solid var(--glass-border)' : 'none',
          borderRadius: isMobile ? 0 : '12px',
          boxShadow: isMobile ? '5px 0 30px rgba(0, 0, 0, 0.3)' : '0 12px 48px rgba(0, 0, 0, 0.5)',
          zIndex: isMobile ? 10001 : 1000,
          display: 'flex',
          flexDirection: 'column',
          opacity: isOpen ? 1 : 0,
          transform: isMobile 
            ? (isOpen ? `translateX(${dragOffset}px)` : 'translateX(-100%)') 
            : (isOpen ? 'translateY(0) scale(1)' : 'translateY(-20px) scale(0.95)'),
          pointerEvents: isOpen ? 'auto' : 'none',
          transition: dragOffset !== 0 ? 'none' : 'all 0.4s cubic-bezier(0.4, 0, 0.2, 1)',
          transformOrigin: isMobile ? 'left center' : 'top right',
        }}
        onClick={(e) => e.stopPropagation()}
      >
        {/* Header */}
        <div style={{
          padding: '1rem 1.25rem',
          borderBottom: '1px solid var(--glass-border)',
          display: 'flex',
          justifyContent: 'space-between',
          alignItems: 'center',
          gap: '0.5rem',
        }}>
          <h3 style={{ margin: 0, fontSize: '1.125rem', fontWeight: '600', color: 'var(--text-primary)' }}>
            {t("notifications.title") || "Notifications"}
          </h3>
          <div style={{ display: 'flex', gap: '0.5rem', alignItems: 'center' }}>
            {notifications.some(n => !n.is_read) && (
              <button
                onClick={() => markAsRead('all')}
                style={{
                  background: 'none',
                  border: 'none',
                  color: 'rgba(103, 126, 234, 1)',
                  cursor: 'pointer',
                  fontSize: '0.875rem',
                  fontWeight: '500',
                  padding: '0.25rem 0.5rem',
                  borderRadius: '4px',
                  transition: 'all 0.2s ease',
                }}
                onMouseEnter={(e) => {
                  e.currentTarget.style.background = 'rgba(103, 126, 234, 0.1)';
                }}
                onMouseLeave={(e) => {
                  e.currentTarget.style.background = 'none';
                }}
              >
                {t("notifications.markAllRead") || "Mark all as read"}
              </button>
            )}
            {notifications.length > 0 && (
              <button
                onClick={deleteAllNotifications}
                style={{
                  background: 'none',
                  border: 'none',
                  color: 'rgba(239, 68, 68, 1)',
                  cursor: 'pointer',
                  fontSize: '0.875rem',
                  fontWeight: '500',
                  padding: '0.25rem 0.5rem',
                  borderRadius: '4px',
                  transition: 'all 0.2s ease',
                }}
                onMouseEnter={(e) => {
                  e.currentTarget.style.background = 'rgba(239, 68, 68, 0.1)';
                }}
                onMouseLeave={(e) => {
                  e.currentTarget.style.background = 'none';
                }}
              >
                {t("notifications.deleteAll") || "Delete all"}
              </button>
            )}
            {/* Close button - X */}
            <button
              onClick={onClose}
              style={{
                background: 'var(--glass-bg)',
                border: '1px solid var(--glass-border)',
                color: 'var(--text-primary)',
                cursor: 'pointer',
                fontSize: '1.25rem',
                fontWeight: 'bold',
                padding: '0.25rem 0.5rem',
                borderRadius: '6px',
                transition: 'all 0.2s ease',
                lineHeight: '1',
                width: '32px',
                height: '32px',
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
              }}
              onMouseEnter={(e) => {
                e.currentTarget.style.background = 'rgba(239, 68, 68, 0.2)';
                e.currentTarget.style.borderColor = 'rgba(239, 68, 68, 0.5)';
              }}
              onMouseLeave={(e) => {
                e.currentTarget.style.background = 'var(--glass-bg)';
                e.currentTarget.style.borderColor = 'var(--glass-border)';
              }}
              aria-label="Close notifications"
            >
              ×
            </button>
          </div>
        </div>

        {/* Notifications List */}
        <div 
          className="notification-list"
          style={{
            flex: 1,
            overflowY: 'auto',
            overflowX: 'hidden',
            padding: '0.5rem',
          }}
        >
          {fetcher.state === "loading" ? (
            <div style={{ padding: '2rem', textAlign: 'center', color: 'var(--text-secondary)' }}>
              {t("common.loading") || "Loading..."}
            </div>
          ) : notifications.length === 0 ? (
            <div style={{
              padding: '3rem 1rem',
              textAlign: 'center',
              color: 'var(--text-secondary)',
            }}>
              <div style={{ fontSize: '3rem', marginBottom: '0.5rem' }}>🔔</div>
              <div>{t("notifications.noNotifications") || "No notifications"}</div>
            </div>
          ) : (
            notifications.map((notification, index) => (
              <div
                key={notification.id}
                style={{
                  padding: '0.875rem',
                  margin: '0.5rem 0',
                  background: notification.is_read
                    ? 'var(--glass-bg)'
                    : 'rgba(103, 126, 234, 0.15)',
                  border: `1px solid ${
                    notification.is_read ? 'var(--glass-border)' : 'rgba(103, 126, 234, 0.3)'
                  }`,
                  borderRadius: '8px',
                  cursor: 'pointer',
                  transition: 'all 0.3s ease',
                  position: 'relative',
                  opacity: isOpen ? 1 : 0,
                  transform: isOpen ? 'translateX(0)' : 'translateX(20px)',
                  transitionDelay: isOpen ? `${index * 0.05}s` : '0s',
                }}
                onClick={() => !notification.is_read && markAsRead(notification.id)}
                onMouseEnter={(e) => {
                  e.currentTarget.style.transform = 'translateY(-2px)';
                  e.currentTarget.style.boxShadow = '0 4px 12px var(--shadow-color)';
                }}
                onMouseLeave={(e) => {
                  e.currentTarget.style.transform = 'translateY(0)';
                  e.currentTarget.style.boxShadow = 'none';
                }}
              >
                {/* Unread indicator */}
                {!notification.is_read && (
                  <div
                    style={{
                      position: 'absolute',
                      top: '12px',
                      left: '12px',
                      width: '8px',
                      height: '8px',
                      borderRadius: '50%',
                      background: 'rgba(103, 126, 234, 1)',
                    }}
                  />
                )}

                <div style={{ paddingLeft: notification.is_read ? '0' : '20px' }}>
                  <div style={{
                    fontWeight: '600',
                    fontSize: '0.9rem',
                    marginBottom: '0.25rem',
                    color: 'var(--text-primary)',
                  }}>
                    {notification.title}
                  </div>
                  <div style={{
                    fontSize: '0.875rem',
                    color: 'var(--text-secondary)',
                    marginBottom: '0.5rem',
                  }}>
                    {notification.message}
                  </div>

                  {notification.room_name && (
                    <div style={{
                      fontSize: '0.8rem',
                      color: 'var(--text-secondary)',
                      marginBottom: '0.25rem',
                    }}>
                      📍 {getRoomName(notification)}
                    </div>
                  )}

                  <div style={{
                    display: 'flex',
                    justifyContent: 'space-between',
                    alignItems: 'center',
                    marginTop: '0.5rem',
                  }}>
                    <span style={{
                      fontSize: '0.75rem',
                      color: 'var(--text-secondary)',
                    }}>
                      {formatTime(notification.created_at)}
                    </span>

                    <button
                      onClick={(e) => {
                        e.stopPropagation();
                        deleteNotification(notification.id);
                      }}
                      style={{
                        background: 'var(--glass-bg)',
                        border: '1px solid var(--glass-border)',
                        borderRadius: '4px',
                        padding: '0.25rem 0.5rem',
                        cursor: 'pointer',
                        fontSize: '0.75rem',
                        color: 'var(--text-primary)',
                        transition: 'all 0.2s ease',
                      }}
                      onMouseEnter={(e) => {
                        e.currentTarget.style.background = 'rgba(239, 68, 68, 0.3)';
                        e.currentTarget.style.color = '#fff';
                      }}
                      onMouseLeave={(e) => {
                        e.currentTarget.style.background = 'var(--glass-bg)';
                        e.currentTarget.style.color = 'var(--text-primary)';
                      }}
                    >
                      {t("common.delete") || "Delete"}
                    </button>
                  </div>
                </div>
              </div>
            ))
          )}
        </div>
      </div>
    </>
  );
}
