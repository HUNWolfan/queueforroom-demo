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

  const allSteps: TourStep[] = [
    // Common steps for all roles
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
    
    // User-specific steps
    {
      target: '.expanding-menu',
      title: t('tour.user.permissions.title', 'Request Permissions'),
      content: t('tour.user.permissions.content', 'As a regular user, you need to request permission from instructors to reserve rooms. Go to your profile to request access.'),
      placement: 'bottom',
      route: '/',
      roles: ['user']
    },
    {
      target: '.nav-link:first-of-type',
      title: t('tour.user.viewOnly.title', 'View Room Availability'),
      content: t('tour.user.viewOnly.content', 'You can view all rooms and their availability. Once you receive permission, you can start booking rooms.'),
      placement: 'bottom',
      route: '/',
      roles: ['user']
    },
    
    // Instructor-specific steps
    {
      target: '.expanding-menu',
      title: t('tour.instructor.reservations.title', 'Your Reservations'),
      content: t('tour.instructor.reservations.content', 'As an instructor, you can create and manage room reservations. Click here to view all your bookings.'),
      placement: 'bottom',
      route: '/',
      roles: ['instructor']
    },
    {
      target: '.nav-link:first-of-type',
      title: t('tour.instructor.permissions.title', 'Two Permission Types'),
      content: t('tour.instructor.permissions.content', 'You may have two types of permissions: 1) Reserve Rooms - create your own bookings, 2) Override Reservations - modify or cancel others\' bookings. Check with your admin if you need override permissions.'),
      placement: 'bottom',
      route: '/',
      roles: ['instructor']
    },
    
    // Admin-specific steps
    {
      target: '.expanding-menu',
      title: t('tour.admin.dashboard.title', 'Admin Dashboard'),
      content: t('tour.admin.dashboard.content', 'As an administrator, you have full access to manage instructors, permissions, rooms, and system settings.'),
      placement: 'bottom',
      route: '/',
      roles: ['admin']
    },
    {
      target: '.nav-link:first-of-type',
      title: t('tour.admin.permissions.title', 'Manage Permissions'),
      content: t('tour.admin.permissions.content', 'You can grant or revoke two types of permissions to instructors: reservation rights and override rights. Each permission is independent.'),
      placement: 'bottom',
      route: '/',
      roles: ['admin']
    },
    
    // Map page steps - common for all
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
    
    // Map page - role-specific
    {
      target: 'rect[data-room]',
      title: t('tour.user.roomDetails.title', 'Room Details'),
      content: t('tour.user.roomDetails.content', 'Click on a room to see its details, capacity, and current reservations. You\'ll need permission to book rooms.'),
      placement: 'top',
      route: '/map',
      roles: ['user']
    },
    {
      target: 'rect[data-room]',
      title: t('tour.instructor.booking.title', 'Book a Room'),
      content: t('tour.instructor.booking.content', 'Click on an available room to create a reservation. You can set the time, add a description, and invite other users to your session.'),
      placement: 'top',
      route: '/map',
      roles: ['instructor']
    },
    {
      target: 'rect[data-room]',
      title: t('tour.admin.roomManagement.title', 'Full Room Access'),
      content: t('tour.admin.roomManagement.content', 'You can view, modify, or cancel any reservation. You can also manage room properties, add new rooms, and configure the building layout.'),
      placement: 'top',
      route: '/map',
      roles: ['admin']
    },
    
    // Settings/Profile steps
    {
      target: '.expanding-menu',
      title: t('tour.settings.title', 'Notification Settings'),
      content: t('tour.settings.content', 'Customize your notification preferences in the Settings page. Control which emails you receive for reservations and permission changes.'),
      placement: 'bottom',
      route: '/'
    },
    {
      target: '.expanding-menu',
      title: t('tour.theme.title', 'Theme Switcher'),
      content: t('tour.theme.content', 'Switch between light and dark themes in Settings. Your preference will be saved for future sessions.'),
      placement: 'bottom',
      route: '/'
    },
    
    // Final step
    {
      target: '.logo',
      title: t('tour.finish.title', 'You\'re All Set!'),
      content: t('tour.finish.content', 'You can restart this tour anytime by clicking the ? button in the bottom-right corner. Happy booking!'),
      placement: 'bottom',
      route: '/'
    }
  ];

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
    const mobileOverlay = document.querySelector('.mobile-overlay');
    if (mobileOverlay) {
      (mobileOverlay as HTMLElement).click();
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
    localStorage.setItem('tourCompleted', 'true');
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

  useEffect(() => {
    const updatePosition = () => {
      const element = document.querySelector(target);
      if (element) {
        const rect = element.getBoundingClientRect();
        const isMobile = window.innerWidth <= 1024;
        
        if (isMobile) {
          // On mobile, scroll element into view if it's off-screen
          const isInViewport = (
            rect.top >= 0 &&
            rect.left >= 0 &&
            rect.bottom <= window.innerHeight &&
            rect.right <= window.innerWidth
          );
          
          if (!isInViewport) {
            element.scrollIntoView({ behavior: 'smooth', block: 'center' });
            // Update position after scroll
            setTimeout(() => {
              const newRect = element.getBoundingClientRect();
              setPosition(newRect);
            }, 300);
          } else {
            setPosition(rect);
          }
        } else {
          setPosition(rect);
        }
      }
    };

    updatePosition();
    window.addEventListener('resize', updatePosition);
    window.addEventListener('scroll', updatePosition, true); // Use capture phase for all scrolls

    return () => {
      window.removeEventListener('resize', updatePosition);
      window.removeEventListener('scroll', updatePosition, true);
    };
  }, [target]);

  if (!position) return null;

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
      const element = document.querySelector(targetElement);
      if (element) {
        const rect = element.getBoundingClientRect();
        const isMobile = window.innerWidth <= 1024;
        const tooltipWidth = isMobile ? Math.min(window.innerWidth - 40, 320) : 320;
        const tooltipHeight = isMobile ? 250 : 200;
        let top = 0;
        let left = 0;

        if (isMobile) {
          // On mobile, always position at bottom center of screen for consistency
          top = window.innerHeight - tooltipHeight - 20;
          left = (window.innerWidth - tooltipWidth) / 2;
          
          // Calculate arrow path from spotlight to tooltip
          const spotlightCenterX = rect.left + rect.width / 2;
          const spotlightCenterY = rect.top + rect.height / 2;
          const tooltipCenterX = left + tooltipWidth / 2;
          const tooltipTop = top;
          
          // Create a curved arrow path (SVG path)
          const controlPointX = (spotlightCenterX + tooltipCenterX) / 2;
          const controlPointY = (spotlightCenterY + tooltipTop) / 2 - 50;
          
          setArrowPath(`M ${spotlightCenterX} ${spotlightCenterY} Q ${controlPointX} ${controlPointY} ${tooltipCenterX} ${tooltipTop}`);
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
      }
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
