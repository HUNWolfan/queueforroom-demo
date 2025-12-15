import { useState, useEffect } from 'react';
import { useTranslation } from 'react-i18next';
import { useLocation } from '@remix-run/react';

interface TourStep {
  target: string;
  title: string;
  content: string;
  placement?: 'top' | 'bottom' | 'left' | 'right';
  route?: string;
  roles?: string[]; // Which roles should see this step
}

interface TourGuideProps {
  userRole?: string;
}

export default function TourGuide({ userRole = 'user' }: TourGuideProps) {
  const { t } = useTranslation();
  const location = useLocation();
  const [isActive, setIsActive] = useState(false);
  const [currentStep, setCurrentStep] = useState(0);
  const [hasSeenTour, setHasSeenTour] = useState(false);
  const [isMobile, setIsMobile] = useState(false);

  // Detect mobile on mount and resize
  useEffect(() => {
    const checkMobile = () => {
      setIsMobile(window.innerWidth <= 1024);
    };
    checkMobile();
    window.addEventListener('resize', checkMobile);
    return () => window.removeEventListener('resize', checkMobile);
  }, []);

  // Define mobile-specific and desktop-specific steps
  const mobileSteps: TourStep[] = [
    {
      target: '.logo',
      title: t('tour.welcome.title', 'Welcome to QueueForRoom!'),
      content: t('tour.welcome.content', 'This is your school room reservation system. Let me show you around!'),
      placement: 'bottom',
      route: '/'
    },
    {
      target: '.mobile-menu-toggle',
      title: t('tour.mobile.menu.title', 'Menu'),
      content: t('tour.mobile.menu.content', 'Tap here to open the navigation menu. You can also swipe right from the left edge to open it.'),
      placement: 'bottom',
      route: '/'
    },
    {
      target: '.notification-bell-button',
      title: t('tour.mobile.notifications.title', 'Notifications'),
      content: t('tour.mobile.notifications.content', 'Tap here to see your notifications. You can also swipe left from the right edge to open the panel.'),
      placement: 'bottom',
      route: '/'
    },
    {
      target: '.logo',
      title: t('tour.finish.title', 'You\'re All Set!'),
      content: t('tour.finish.content', 'You can restart this tour anytime by clicking the ? button in the bottom-right corner. Happy booking!'),
      placement: 'bottom',
      route: '/'
    }
  ];

  const desktopSteps: TourStep[] = [
    {
      target: '.logo',
      title: t('tour.welcome.title', 'Welcome to QueueForRoom!'),
      content: t('tour.welcome.content', 'This is your school room reservation system. Let me show you around!'),
      placement: 'bottom',
      route: '/'
    },
    {
      target: '.nav-link:first-of-type',
      title: t('tour.map.title', 'Room Map'),
      content: t('tour.map.content', 'Click here to view the interactive building map and reserve rooms.'),
      placement: 'bottom',
      route: '/'
    },
    {
      target: '.expanding-menu',
      title: t('tour.profile.title', 'Your Profile'),
      content: t('tour.profile.content', 'Access your profile, reservations, and settings from this menu.'),
      placement: 'bottom',
      route: '/'
    },
    // Map page steps
    {
      target: '.floor-selector',
      title: t('tour.floors.title', 'Building Floors'),
      content: t('tour.floors.content', 'Switch between different floors to see all available rooms.'),
      placement: 'right',
      route: '/map'
    },
    {
      target: 'rect[data-room]',
      title: t('tour.rooms.title', 'Room Selection'),
      content: t('tour.rooms.content', 'Click on any room to see details and make a reservation. Color coding shows room types and access levels.'),
      placement: 'top',
      route: '/map'
    },
    // Reservations page
    {
      target: '.dashboard-card',
      title: t('tour.reservations.title', 'Your Reservations'),
      content: t('tour.reservations.content', 'View all your active and past reservations. You can cancel upcoming reservations or invite others to join.'),
      placement: 'top',
      route: '/reservations'
    },
    // Settings page
    {
      target: '.settings-card',
      title: t('tour.settings.title', 'Notification Settings'),
      content: t('tour.settings.content', 'Customize your notification preferences in the Settings page. Control which emails you receive for reservations and permission changes.'),
      placement: 'top',
      route: '/settings'
    },
    {
      target: '.theme-switcher',
      title: t('tour.theme.title', 'Theme Switcher'),
      content: t('tour.theme.content', 'Switch between light and dark themes in Settings. Your preference will be saved for future sessions.'),
      placement: 'left',
      route: '/settings'
    },
    // Admin pages
    {
      target: '.dashboard-grid',
      title: t('tour.admin.dashboard.title', 'Admin Dashboard'),
      content: t('tour.admin.dashboard.content', 'As an administrator, you have full access to manage instructors, permissions, rooms, and system settings.'),
      placement: 'top',
      route: '/admin',
      roles: ['admin']
    },
    {
      target: '.logo',
      title: t('tour.finish.title', 'You\'re All Set!'),
      content: t('tour.finish.content', 'You can restart this tour anytime by clicking the ? button in the bottom-right corner. Happy booking!'),
      placement: 'bottom'
    }
  ];

  // Choose steps based on device type
  const allSteps = isMobile ? mobileSteps : desktopSteps;

  // Filter steps based on current route and user role
  const currentRouteSteps = allSteps.filter(step => {
    const routeMatch = !step.route || step.route === location.pathname;
    const roleMatch = !step.roles || step.roles.includes(userRole);
    return routeMatch && roleMatch;
  });

  useEffect(() => {
    const tourSeen = localStorage.getItem('tourCompleted');
    if (tourSeen) {
      setHasSeenTour(true);
    } else {
      // Auto-start tour for first-time users after 1 second
      const timer = setTimeout(() => {
        setIsActive(true);
        // Close mobile menu if open
        closeMobileMenuIfOpen();
      }, 1000);
      return () => clearTimeout(timer);
    }
  }, []);

  useEffect(() => {
    // Reset step when route changes
    if (isActive) {
      setCurrentStep(0);
    }
  }, [location.pathname]);

  // Close mobile menu when tour is active
  useEffect(() => {
    if (isActive) {
      closeMobileMenuIfOpen();
    }
  }, [isActive]);

  const closeMobileMenuIfOpen = () => {
    // Close mobile hamburger menu by clicking overlay if it exists
    if (typeof document !== 'undefined') {
      const mobileOverlay = document.querySelector('.mobile-overlay');
      if (mobileOverlay) {
        (mobileOverlay as HTMLElement).click();
      }
    }
  };

  const handleNext = () => {
    if (currentStep < currentRouteSteps.length - 1) {
      setCurrentStep(currentStep + 1);
    } else {
      completeTour();
    }
  };

  const handlePrevious = () => {
    if (currentStep > 0) {
      setCurrentStep(currentStep - 1);
    }
  };

  const completeTour = () => {
    setIsActive(false);
    if (typeof window !== 'undefined' && typeof localStorage !== 'undefined') {
      localStorage.setItem('tourCompleted', 'true');
    }
    setHasSeenTour(true);
  };

  const skipTour = () => {
    completeTour();
  };

  const restartTour = () => {
    setCurrentStep(0);
    setIsActive(true);
    closeMobileMenuIfOpen();
  };

  // Don't render anything on mobile
  if (isMobile) {
    return null;
  }

  if (!isActive || currentRouteSteps.length === 0) {
    return (
      <>
        {hasSeenTour && (
          <button
            onClick={restartTour}
            className="tour-restart-button"
            title={t('tour.restart', 'Restart Tour')}
          >
            ?
          </button>
        )}
      </>
    );
  }

  const step = currentRouteSteps[currentStep];

  return (
    <>
      <TourOverlay onClick={skipTour} />
      <TourSpotlight target={step.target} />
      <TourTooltip
        step={step}
        currentStep={currentStep}
        totalSteps={currentRouteSteps.length}
        onNext={handleNext}
        onPrevious={handlePrevious}
        onSkip={skipTour}
        targetElement={step.target}
      />
    </>
  );
}

function TourOverlay({ onClick }: { onClick: () => void }) {
  return (
    <div className="tour-overlay" onClick={onClick} />
  );
}

function TourSpotlight({ target }: { target: string }) {
  const [position, setPosition] = useState<DOMRect | null>(null);
  const [isMobile, setIsMobile] = useState(false);

  useEffect(() => {
    if (typeof window !== 'undefined') {
      setIsMobile(window.innerWidth <= 1024);
    }
  }, []);

  useEffect(() => {
    const updatePosition = () => {
      if (typeof document === 'undefined' || typeof window === 'undefined') return;
      
      const element = document.querySelector(target);
      if (element) {
        const currentIsMobile = window.innerWidth <= 1024;
        setIsMobile(currentIsMobile);
        
        // Desktop only - mobile uses arrows instead
        if (!currentIsMobile) {
          const rect = element.getBoundingClientRect();
          setPosition(rect);
        }
      }
    };

    updatePosition();
    const resizeHandler = () => {
      const nowMobile = window.innerWidth <= 1024;
      setIsMobile(nowMobile);
      updatePosition();
    };
    
    window.addEventListener('resize', resizeHandler);
    window.addEventListener('scroll', updatePosition, true);

    return () => {
      window.removeEventListener('resize', resizeHandler);
      window.removeEventListener('scroll', updatePosition, true);
    };
  }, [target]);

  if (!position) return null;

  // On mobile, don't show spotlight - it causes positioning issues
  if (isMobile) return null;

  return (
    <div
      className="tour-spotlight"
      style={{
        top: `${position.top - 8}px`,
        left: `${position.left - 8}px`,
        width: `${position.width + 16}px`,
        height: `${position.height + 16}px`,
      }}
    />
  );
}

function TourTooltip({
  step,
  currentStep,
  totalSteps,
  onNext,
  onPrevious,
  onSkip,
  targetElement,
}: {
  step: TourStep;
  currentStep: number;
  totalSteps: number;
  onNext: () => void;
  onPrevious: () => void;
  onSkip: () => void;
  targetElement: string;
}) {
  const { t } = useTranslation();
  const [position, setPosition] = useState<{ top: number; left: number } | null>(null);
  const [arrowPath, setArrowPath] = useState<string>('');

  useEffect(() => {
    const updatePosition = () => {
      if (typeof document === 'undefined' || typeof window === 'undefined') return;
      
      const element = document.querySelector(targetElement);
      if (!element) return;

      const isMobile = window.innerWidth <= 1024;
      
      // On mobile, first scroll element into view, THEN calculate positions
      if (isMobile) {
        element.scrollIntoView({ behavior: 'smooth', block: 'center', inline: 'center' });
      }
      
      // Wait for scroll to complete before calculating positions
      setTimeout(() => {
        const rect = element.getBoundingClientRect();
        
        // Responsive tooltip sizing with strict viewport constraints
        const viewportWidth = window.innerWidth;
        const viewportHeight = window.innerHeight;
        const maxTooltipWidth = viewportWidth - 40; // 20px margin each side
        const tooltipWidth = isMobile 
          ? Math.min(maxTooltipWidth, Math.floor(viewportWidth * 0.85), 380) 
          : 320;
        const tooltipHeight = isMobile 
          ? Math.min(window.innerHeight * 0.4, 300) 
          : 200;
        let top = 0;
        let left = 0;

        if (isMobile) {
          // On mobile, ALWAYS center tooltip horizontally
          left = (viewportWidth - tooltipWidth) / 2;
          
          // Get element coordinates AFTER scroll
          const elementCenterX = rect.left + rect.width / 2;
          const elementCenterY = rect.top + rect.height / 2;
          const spaceBelow = viewportHeight - rect.bottom;
          const spaceAbove = rect.top;
          
          // Position vertically based on available space
          if (spaceBelow >= tooltipHeight + 60) {
            // Position below the element
            top = rect.bottom + 40;
          } else if (spaceAbove >= tooltipHeight + 60) {
            // Position above the element
            top = rect.top - tooltipHeight - 40;
          } else {
            // Not enough space - center vertically
            top = (viewportHeight - tooltipHeight) / 2;
          }
          
          // Ensure tooltip stays within viewport
          top = Math.max(20, Math.min(top, viewportHeight - tooltipHeight - 20));
          left = Math.max(20, Math.min(left, viewportWidth - tooltipWidth - 20));
          
          // NOW calculate arrow with FINAL tooltip position
          const tooltipCenterX = left + tooltipWidth / 2;
          const tooltipCenterY = top + tooltipHeight / 2;
          
          // Determine arrow start (element) and end (tooltip edge) points
          let arrowStartX = elementCenterX;
          let arrowStartY = elementCenterY;
          let arrowEndX = tooltipCenterX;
          let arrowEndY = top; // Default to top edge
          
          // Choose which edge of tooltip to connect to
          if (elementCenterY < top) {
            // Element is ABOVE tooltip - arrow points to TOP edge of tooltip
            arrowEndY = top - 5;
          } else if (elementCenterY > top + tooltipHeight) {
            // Element is BELOW tooltip - arrow points to BOTTOM edge
            arrowEndY = top + tooltipHeight + 5;
          } else {
            // Element is BESIDE tooltip - arrow points to side edge
            if (elementCenterX < tooltipCenterX) {
              // Element on LEFT - arrow to left edge
              arrowEndX = left - 5;
              arrowEndY = tooltipCenterY;
            } else {
              // Element on RIGHT - arrow to right edge
              arrowEndX = left + tooltipWidth + 5;
              arrowEndY = tooltipCenterY;
            }
          }
          
          // Draw curved arrow with control point at midpoint
          const controlPointX = (arrowStartX + arrowEndX) / 2;
          const controlPointY = (arrowStartY + arrowEndY) / 2;
          setArrowPath(`M ${arrowStartX} ${arrowStartY} Q ${controlPointX} ${controlPointY}, ${arrowEndX} ${arrowEndY}`);
          
        } else {
          setArrowPath('');
          
          // Desktop positioning logic
          switch (step.placement) {
            case 'bottom':
              top = rect.bottom + 20;
              left = rect.left + rect.width / 2 - tooltipWidth / 2;
              break;
            case 'top':
              top = rect.top - tooltipHeight - 20;
              left = rect.left + rect.width / 2 - tooltipWidth / 2;
              break;
            case 'right':
              top = rect.top + rect.height / 2 - tooltipHeight / 2;
              left = rect.right + 20;
              break;
            case 'left':
              top = rect.top + rect.height / 2 - tooltipHeight / 2;
              left = rect.left - tooltipWidth - 20;
              break;
            default:
              top = rect.bottom + 20;
              left = rect.left + rect.width / 2 - tooltipWidth / 2;
          }

          // Keep tooltip within viewport
          const padding = 20;
          if (left < padding) left = padding;
          if (left + tooltipWidth > window.innerWidth - padding) {
            left = window.innerWidth - tooltipWidth - padding;
          }
          if (top < padding) top = padding;
          if (top + tooltipHeight > window.innerHeight - padding) {
            top = window.innerHeight - tooltipHeight - padding;
          }
        }

        setPosition({ top, left });
      }, isMobile ? 500 : 0); // Wait for scroll animation on mobile
    };

    updatePosition();
    
    window.addEventListener('resize', updatePosition);
    window.addEventListener('scroll', updatePosition, true);

    return () => {
      window.removeEventListener('resize', updatePosition);
      window.removeEventListener('scroll', updatePosition, true);
    };
  }, [targetElement, step.placement]);

  if (!position) return null;

  return (
    <>
      {/* Arrow indicator on mobile */}
      {arrowPath && (
        <svg
          style={{
            position: 'fixed',
            top: 0,
            left: 0,
            width: '100%',
            height: '100%',
            pointerEvents: 'none',
            zIndex: 10501,
          }}
        >
          <defs>
            <marker
              id="arrowhead"
              markerWidth="10"
              markerHeight="10"
              refX="9"
              refY="3"
              orient="auto"
            >
              <polygon points="0 0, 10 3, 0 6" fill="rgba(103, 126, 234, 0.8)" />
            </marker>
          </defs>
          <path
            d={arrowPath}
            stroke="rgba(103, 126, 234, 0.8)"
            strokeWidth="3"
            fill="none"
            strokeDasharray="5,5"
            markerEnd="url(#arrowhead)"
            style={{
              filter: 'drop-shadow(0 2px 4px rgba(0,0,0,0.3))',
            }}
          />
        </svg>
      )}
      
      <div
        className="tour-tooltip"
        style={{
          top: `${position.top}px`,
          left: `${position.left}px`,
        }}
      >
      <div className="tour-tooltip-header">
        <h3>{step.title}</h3>
        <button onClick={onSkip} className="tour-close-button" title={t('tour.skip', 'Skip Tour')}>
          ×
        </button>
      </div>
      
      <div className="tour-tooltip-content">
        <p>{step.content}</p>
      </div>

      <div className="tour-tooltip-footer">
        <div className="tour-progress">
          <span>{currentStep + 1} / {totalSteps}</span>
          <div className="tour-progress-dots">
            {Array.from({ length: totalSteps }).map((_, index) => (
              <div
                key={index}
                className={`tour-dot ${index === currentStep ? 'active' : ''} ${index < currentStep ? 'completed' : ''}`}
              />
            ))}
          </div>
        </div>

        <div className="tour-buttons">
          {currentStep > 0 && (
            <button onClick={onPrevious} className="tour-button tour-button-secondary">
              {t('tour.previous', 'Previous')}
            </button>
          )}
          <button onClick={onNext} className="tour-button tour-button-primary">
            {currentStep < totalSteps - 1 ? t('tour.next', 'Next') : t('tour.finishButton', 'Finish')}
          </button>
        </div>
      </div>
      </div>
    </>
  );
}
