import { Link, Form, useFetcher } from "@remix-run/react";
import { useTranslation } from "react-i18next";
import { useState, useEffect, useRef } from "react";
import LanguageSwitcher from "./LanguageSwitcher";
import ThemeSwitcher from "./ThemeSwitcher";
import NotificationPanel from "./NotificationPanel";

interface HeaderProps {
  user?: {
    id: number;
    email: string;
    firstName: string;
    lastName: string;
    role: string;
  } | null;
}

export default function Header({ user }: HeaderProps) {
  // Safe fallback for SSR - return empty string during SSR to match client structure
  let t: (key: string) => string;
  let isHungarian = true; // default fallback
  try {
    const translation = useTranslation();
    t = translation.t;
    isHungarian = translation.i18n.language === 'hu';
  } catch (e) {
    // SSR fallback - return empty string to prevent hydration mismatch
    t = (key: string) => "";
    isHungarian = true;
  }
  
  const fetcher = useFetcher<{ unreadCount: number }>();
  const [showNotifications, setShowNotifications] = useState(false);
  const [unreadCount, setUnreadCount] = useState(0);
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false);
  const [isMounted, setIsMounted] = useState(false);
  
  // Detect when mounted (client-side only)
  useEffect(() => {
    setIsMounted(true);
  }, []);
  
  // Swipe gesture state - use refs to avoid closure issues
  const touchStartX = useRef<number | null>(null);
  const touchEndX = useRef<number | null>(null);
  const touchStartY = useRef<number | null>(null);
  const touchEndY = useRef<number | null>(null);
  
  // Minimum swipe distance (in px)
  const minSwipeDistance = 50;
  // Maximum edge distance to trigger swipe open - allow from left half of screen
  const maxEdgeDistance = typeof window !== 'undefined' ? window.innerWidth / 2 : 300;
  
  // Load unread count when user is logged in
  useEffect(() => {
    if (user && fetcher.state === "idle" && !fetcher.data) {
      fetcher.load("/api/notifications?unreadOnly=true");
    }
  }, [user]);

  // Update unread count when data arrives
  useEffect(() => {
    if (fetcher.data?.unreadCount !== undefined) {
      setUnreadCount(fetcher.data.unreadCount);
    }
  }, [fetcher.data]);

  // Refresh notifications every 30 seconds
  useEffect(() => {
    if (!user) return;
    
    const interval = setInterval(() => {
      fetcher.load("/api/notifications?unreadOnly=true");
    }, 30000);

    return () => clearInterval(interval);
  }, [user]);
  
  // Swipe gesture detection
  useEffect(() => {
    const handleTouchStart = (e: TouchEvent) => {
      touchEndX.current = null;
      touchEndY.current = null;
      touchStartX.current = e.targetTouches[0].clientX;
      touchStartY.current = e.targetTouches[0].clientY;
    };
    
    const handleTouchMove = (e: TouchEvent) => {
      touchEndX.current = e.targetTouches[0].clientX;
      touchEndY.current = e.targetTouches[0].clientY;
    };
    
    const handleTouchEnd = () => {
      if (!touchStartX.current || !touchEndX.current || !touchStartY.current || !touchEndY.current) return;
      
      const horizontalDistance = touchEndX.current - touchStartX.current;
      const verticalDistance = Math.abs(touchEndY.current - touchStartY.current);
      
      // Only trigger if horizontal swipe is dominant (not vertical scroll)
      if (verticalDistance > Math.abs(horizontalDistance) * 0.5) {
        // This is more of a vertical scroll, ignore
        touchStartX.current = null;
        touchEndX.current = null;
        touchStartY.current = null;
        touchEndY.current = null;
        return;
      }
      
      const isRightSwipe = horizontalDistance > minSwipeDistance;
      const isLeftSwipe = horizontalDistance < -minSwipeDistance;
      const screenWidth = typeof window !== 'undefined' ? window.innerWidth : 1024;
      
      // Right swipe from LEFT edge (open menu from left) - only if both panels are closed
      if (isRightSwipe && touchStartX.current < maxEdgeDistance && !showNotifications && !mobileMenuOpen) {
        setMobileMenuOpen(true);
      }
      
      // Left swipe from RIGHT edge (open notifications from right) - only if both panels are closed
      if (isLeftSwipe && touchStartX.current > screenWidth - maxEdgeDistance && !showNotifications && !mobileMenuOpen) {
        setShowNotifications(true);
      }
      
      // Left swipe anywhere when menu is open (close menu)
      if (isLeftSwipe && mobileMenuOpen && !showNotifications) {
        setMobileMenuOpen(false);
      }
      
      // Reset
      touchStartX.current = null;
      touchEndX.current = null;
      touchStartY.current = null;
      touchEndY.current = null;
    };
    
    // Only enable on mobile
    if (typeof window === 'undefined' || window.innerWidth > 1024) return;
    
    document.addEventListener('touchstart', handleTouchStart, { passive: true });
    document.addEventListener('touchmove', handleTouchMove, { passive: true });
    document.addEventListener('touchend', handleTouchEnd, { passive: true });
    
    return () => {
      document.removeEventListener('touchstart', handleTouchStart);
      document.removeEventListener('touchmove', handleTouchMove);
      document.removeEventListener('touchend', handleTouchEnd);
    };
  }, [mobileMenuOpen, showNotifications]);

  // Handle notification panel close - refresh unread count
  const handleNotificationClose = () => {
    setShowNotifications(false);
    
    // Refresh unread count after closing
    setTimeout(() => {
      fetcher.load("/api/notifications?unreadOnly=true");
    }, 300);
  };

  // Close mobile menu when clicking a link
  const closeMobileMenu = () => {
    setMobileMenuOpen(false);
  };

  // Add/remove class to body when mobile menu opens/closes
  useEffect(() => {
    if (mobileMenuOpen) {
      document.body.classList.add('mobile-menu-open');
      document.body.style.overflow = 'hidden';
    } else {
      document.body.classList.remove('mobile-menu-open');
      if (!showNotifications) {
        document.body.style.overflow = '';
      }
    }
  }, [mobileMenuOpen, showNotifications]);
  
  // Prevent scroll when notification panel is open
  useEffect(() => {
    if (showNotifications) {
      document.body.style.overflow = 'hidden';
    } else {
      if (!mobileMenuOpen) {
        document.body.style.overflow = '';
      }
    }
  }, [showNotifications, mobileMenuOpen]);
  
  // Magyar névrendben: Vezetéknév Keresztnév
  const displayName = user 
    ? (isHungarian 
        ? `${user.lastName || ''} ${user.firstName || ''}`.trim() 
        : `${user.firstName || ''} ${user.lastName || ''}`.trim())
    : '';
    
  // Fallback to email if no name is available
  const finalDisplayName = displayName || user?.email?.split('@')[0] || t('nav.user');

  return (
    <header className="header">
      <div className="header-container">
        {/* Hamburger menu button - LEFT side on mobile */}
        <button 
          className="mobile-menu-toggle"
          onClick={() => {
            // Close notifications if open
            if (showNotifications) {
              setShowNotifications(false);
            }
            // Toggle menu
            setMobileMenuOpen(!mobileMenuOpen);
          }}
          aria-label="Toggle menu"
          aria-expanded={mobileMenuOpen}
        >
          <span className="hamburger">
            <span></span>
            <span></span>
            <span></span>
          </span>
        </button>

        <div className="header-left">
          <Link to="/" className="logo" onClick={closeMobileMenu}>
            <div className="logo-text">
              <span className="logo-queue">Queue</span>
              <span className="logo-for">for</span>
              <span className="logo-room">Room</span>
            </div>
          </Link>
        </div>

        {/* Backdrop overlay for mobile menu OR notifications - clickable to close */}
        {(mobileMenuOpen || showNotifications) && (
          <div 
            className="mobile-overlay"
            onClick={() => {
              setMobileMenuOpen(false);
              setShowNotifications(false);
            }}
            aria-hidden="true"
          />
        )}

        <nav className={`header-nav ${mobileMenuOpen ? 'mobile-open' : ''}`} suppressHydrationWarning>
          {user ? (
            <>
              <Link to="/map" className="nav-link" onClick={closeMobileMenu} suppressHydrationWarning>
                {t("nav.map")}
              </Link>
              <Link to="/reservations" className="nav-link" onClick={closeMobileMenu} suppressHydrationWarning>
                {t("nav.reservations")}
              </Link>
              
              {/* Expanding Hover Menu for User */}
              <div className="expanding-menu" suppressHydrationWarning>
                <button className="menu-trigger" suppressHydrationWarning>
                  <span suppressHydrationWarning>{finalDisplayName}</span>
                  <span>▼</span>
                </button>
                <div className="menu-items" suppressHydrationWarning>
                  <Link to="/profile" className="menu-item" onClick={closeMobileMenu}>
                    <span className="menu-item-icon">👤</span>
                    <span>{t("nav.profile") || "Profile"}</span>
                  </Link>
                  <Link to="/reservations" className="menu-item" onClick={closeMobileMenu}>
                    <span className="menu-item-icon">📅</span>
                    <span>{t("nav.myReservations") || "My Reservations"}</span>
                  </Link>
                  <Link to="/settings" className="menu-item" onClick={closeMobileMenu}>
                    <span className="menu-item-icon">⚙️</span>
                    <span>{t("nav.settings") || "Settings"}</span>
                  </Link>
                  {user.role === 'student' && (
                    <Link to="/my-requests" className="menu-item" onClick={closeMobileMenu}>
                      <span className="menu-item-icon">📋</span>
                      <span>{t("permissions.myRequests") || "My Requests"}</span>
                    </Link>
                  )}
                  {user.role === 'admin' && (
                    <>
                      <hr style={{ margin: '0.5rem 0', border: 'none', borderTop: '1px solid rgba(255,255,255,0.2)' }} />
                      <Link to="/admin" className="menu-item" onClick={closeMobileMenu}>
                        <span className="menu-item-icon">👑</span>
                        <span>{t("nav.admin") || "Admin Panel"}</span>
                      </Link>
                      <Link to="/admin/rooms" className="menu-item" onClick={closeMobileMenu}>
                        <span className="menu-item-icon">🏢</span>
                        <span>{t("nav.roomManagement") || "Room Management"}</span>
                      </Link>
                      <Link to="/admin/users" className="menu-item" onClick={closeMobileMenu}>
                        <span className="menu-item-icon">👥</span>
                        <span>{t("admin.userManagement") || "User Management"}</span>
                      </Link>
                    </>
                  )}
                  <hr style={{ margin: '0.5rem 0', border: 'none', borderTop: '1px solid rgba(255,255,255,0.2)' }} />
                  <Form method="post" action="/logout">
                    <button 
                      type="submit" 
                      className="menu-item" 
                      style={{ width: '100%', background: 'none', border: 'none', textAlign: 'left', fontFamily: 'inherit', fontSize: 'inherit' }}
                      onClick={closeMobileMenu}
                    >
                      <span className="menu-item-icon">🚪</span>
                      <span>{t("nav.logout")}</span>
                    </button>
                  </Form>
                </div>
              </div>
              
            </>
          ) : (
            <>
              <Link to="/login" className="btn-secondary" onClick={closeMobileMenu} suppressHydrationWarning>
                {t("nav.login")}
              </Link>
              <Link to="/register" className="btn-primary" onClick={closeMobileMenu} suppressHydrationWarning>
                {t("nav.register")}
              </Link>
            </>
          )}
          
          {/* Notification Bell - in nav, next to theme/language switchers */}
          {user && (
            <button
              className="notification-bell-button"
              onClick={() => {
                // Close menu if open
                if (mobileMenuOpen) {
                  setMobileMenuOpen(false);
                }
                // Toggle notifications
                setShowNotifications(!showNotifications);
              }}
              style={{
                position: 'relative',
                background: 'none',
                border: 'none',
                cursor: 'pointer',
                fontSize: '1.3rem',
                padding: '0.5rem 0.75rem',
                color: 'var(--text-primary)',
                transition: 'all 0.3s ease',
                zIndex: 102,
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
              }}
              onMouseEnter={(e) => {
                e.currentTarget.style.transform = 'scale(1.15)';
              }}
              onMouseLeave={(e) => {
                e.currentTarget.style.transform = 'scale(1)';
              }}
              aria-label="Notifications"
            >
              🔔
              {unreadCount > 0 && (
                <span
                  style={{
                    position: 'absolute',
                    top: '2px',
                    right: '2px',
                    background: '#ef4444',
                    color: 'white',
                    borderRadius: '50%',
                    width: '18px',
                    height: '18px',
                    display: 'flex',
                    alignItems: 'center',
                    justifyContent: 'center',
                    fontSize: '0.65rem',
                    fontWeight: 'bold',
                    border: '2px solid var(--bg-gradient-start)',
                    boxShadow: '0 2px 8px rgba(239, 68, 68, 0.5)',
                  }}
                >
                  {unreadCount > 9 ? '9+' : unreadCount}
                </span>
              )}
            </button>
          )}
          
          <ThemeSwitcher />
          <LanguageSwitcher />
        </nav>
        
        {/* Notification Panel - render outside nav, only on client */}
        {isMounted && user && (
          <NotificationPanel 
            isOpen={showNotifications} 
            onClose={handleNotificationClose} 
          />
        )}
      </div>
    </header>
  );
}
