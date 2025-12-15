import { useState, useEffect } from "react";
import { useTranslation } from "react-i18next";
import { useFetcher, useNavigate } from "@remix-run/react";
import DateTimePicker from "~/components/common/DateTimePicker";

interface Room {
  id: number;
  name: string;
  name_en?: string;
  name_hu?: string;
  capacity: number;
  description_en: string;
  description_hu: string;
  floor: number;
  position_x: number;
  position_y: number;
  width: number;
  height: number;
  is_available: boolean;
  room_type?: string;
  min_role?: string;
}

interface RoomMapProps {
  rooms: Room[];
  userRole?: string;
  onRoomSelect?: (room: Room) => void;
}

export default function RoomMap({ rooms, userRole = 'student', onRoomSelect }: RoomMapProps) {
  const { i18n, t } = useTranslation();
  const [selectedRoom, setSelectedRoom] = useState<Room | null>(null);
  const [currentFloor, setCurrentFloor] = useState(1);
  const [hoveredRoom, setHoveredRoom] = useState<number | null>(null);
  const [showReservationModal, setShowReservationModal] = useState(false);
  const [showAlertModal, setShowAlertModal] = useState(false);
  const [alertMessage, setAlertMessage] = useState("");
  const [isMobile, setIsMobile] = useState(false);
  const [isLightMode, setIsLightMode] = useState(false);
  const [durationWarning, setDurationWarning] = useState("");
  const [reservationDetails, setReservationDetails] = useState({
    startTime: "",
    endTime: "",
    purpose: "",
    attendees: 1,
  });

  const fetcher = useFetcher();
  const navigate = useNavigate();

  // Detect mobile and theme on client-side only
  useEffect(() => {
    const checkMobile = () => {
      setIsMobile(window.innerWidth <= 768);
    };
    
    const checkTheme = () => {
      const theme = document.documentElement.getAttribute('data-theme');
      setIsLightMode(theme === 'light');
    };
    
    checkMobile();
    checkTheme();
    
    window.addEventListener('resize', checkMobile);
    
    // Watch for theme changes on documentElement (HTML tag)
    const observer = new MutationObserver(checkTheme);
    observer.observe(document.documentElement, { attributes: true, attributeFilter: ['data-theme'] });
    
    return () => {
      window.removeEventListener('resize', checkMobile);
      observer.disconnect();
    };
  }, []);

  // Helper function to get room name based on current language
  const getRoomName = (room: Room) => {
    const isHungarian = i18n.language === 'hu';
    if (isHungarian && room.name_hu) {
      return room.name_hu;
    }
    if (!isHungarian && room.name_en) {
      return room.name_en;
    }
    return room.name; // Fallback to default name
  };

  const floors = [...new Set(rooms.map(r => r.floor))].sort();
  const currentFloorRooms = rooms.filter(r => r.floor === currentFloor);

  const canAccessRoom = (room: Room) => {
    // Role hierarchy: user/student < instructor < admin
    const roleHierarchy: Record<string, number> = {
      'user': 1,
      'student': 1,
      'instructor': 2,
      'admin': 3,
    };
    const userRoleLevel = roleHierarchy[userRole] || 1;
    const requiredRoleLevel = roleHierarchy[room.min_role || 'student'] || 1;
    return userRoleLevel >= requiredRoleLevel;
  };

  const getRoomColor = (room: Room) => {
    if (!canAccessRoom(room)) return '#ffccbc';
    if (!room.is_available) return '#f5f5f5';
    if (selectedRoom?.id === room.id) return '#4caf50';
    
    // Color by room type
    const typeColors: Record<string, string> = {
      'standard': '#90caf9',
      'lab': '#ffb74d',
      'library': '#ce93d8',
      'meeting': '#81c784',
      'office': '#f48fb1',
      'restricted': '#ef5350'
    };
    return typeColors[room.room_type || 'standard'] || '#90caf9';
  };

  const handleRoomClick = (room: Room) => {
    if (room.is_available && canAccessRoom(room)) {
      setSelectedRoom(room);
      onRoomSelect?.(room);
    }
  };

  const handleReserveClick = () => {
    if (selectedRoom) {
      // Round time to nearest 15-minute interval
      const roundToQuarterHour = (date: Date) => {
        const minutes = date.getMinutes();
        const roundedMinutes = Math.ceil(minutes / 15) * 15;
        const newDate = new Date(date);
        newDate.setMinutes(roundedMinutes);
        newDate.setSeconds(0);
        newDate.setMilliseconds(0);
        return newDate;
      };

      const formatDateTime = (date: Date) => {
        const year = date.getFullYear();
        const month = String(date.getMonth() + 1).padStart(2, '0');
        const day = String(date.getDate()).padStart(2, '0');
        const hours = String(date.getHours()).padStart(2, '0');
        const minutes = String(date.getMinutes()).padStart(2, '0');
        return `${year}-${month}-${day}T${hours}:${minutes}`;
      };

      // Set default times (next 15-min interval + 1 hour for duration)
      const now = roundToQuarterHour(new Date());
      const later = roundToQuarterHour(new Date(now.getTime() + 60 * 60 * 1000));

      setReservationDetails({
        startTime: formatDateTime(now),
        endTime: formatDateTime(later),
        purpose: "",
        attendees: 1,
      });
      setShowReservationModal(true);
    }
  };

  // Round time to nearest 15-minute interval
  const roundToQuarterHour = (date: Date) => {
    const minutes = date.getMinutes();
    const roundedMinutes = Math.ceil(minutes / 15) * 15;
    const newDate = new Date(date);
    newDate.setMinutes(roundedMinutes);
    newDate.setSeconds(0);
    newDate.setMilliseconds(0);
    return newDate;
  };

  // Get minimum datetime (current time rounded to next 15-min interval) for date inputs
  const getMinDateTime = () => {
    const now = roundToQuarterHour(new Date());
    const year = now.getFullYear();
    const month = String(now.getMonth() + 1).padStart(2, '0');
    const day = String(now.getDate()).padStart(2, '0');
    const hours = String(now.getHours()).padStart(2, '0');
    const minutes = String(now.getMinutes()).padStart(2, '0');
    return `${year}-${month}-${day}T${hours}:${minutes}`;
  };

  const handleConfirmReservation = () => {
    if (selectedRoom && reservationDetails.startTime && reservationDetails.endTime) {
      // Only students and users submit permission requests
      // Instructors and admins can create reservations directly
      const needsPermissionRequest = userRole === 'student' || userRole === 'user';
      const endpoint = needsPermissionRequest
        ? "/api/reservation-requests" 
        : "/api/reservations";
      
      const formData = {
        roomId: selectedRoom.id.toString(),
        startTime: reservationDetails.startTime,
        endTime: reservationDetails.endTime,
        purpose: reservationDetails.purpose,
        attendees: reservationDetails.attendees.toString(),
      };

      // Add intent for request creation
      if (needsPermissionRequest) {
        (formData as any).intent = 'create';
      }

      fetcher.submit(
        formData,
        { method: "post", action: endpoint }
      );
      setShowReservationModal(false);
      setSelectedRoom(null);
    }
  };

  useEffect(() => {
    if (fetcher.state === "idle" && fetcher.data) {
      const data = fetcher.data as any;
      if (data.success) {
        const needsPermissionRequest = userRole === 'student' || userRole === 'user';
        const successMsg = needsPermissionRequest
          ? (t("permissions.requestSubmitted") || "Permission request submitted!")
          : (t("reservation.success") || "Reservation created successfully!");
        setAlertMessage(successMsg);
        setShowAlertModal(true);
        // Átirányítás a foglalások oldalra, ahol már látható lesz a share_token
        setTimeout(() => navigate("/reservations"), 2000);
      } else {
        setAlertMessage(data.error || t("reservation.error") || "Failed to create reservation");
        setShowAlertModal(true);
      }
    }
  }, [fetcher.state, fetcher.data, t, navigate, userRole]);

  return (
    <div className="room-map-container">
      <div className="floor-selector">
        {floors.map(floor => (
          <button
            key={floor}
            className={`floor-btn ${currentFloor === floor ? "active" : ""}`}
            onClick={() => setCurrentFloor(floor)}
          >
            {t("map.floor")} {floor}
          </button>
        ))}
      </div>

      <div className="map-wrapper">
        <svg
          className="room-map"
          viewBox="0 0 600 400"
          xmlns="http://www.w3.org/2000/svg"
        >
          {/* Grid background */}
          <defs>
            <pattern
              id="grid"
              width="20"
              height="20"
              patternUnits="userSpaceOnUse"
            >
              <path
                d="M 20 0 L 0 0 0 20"
                fill="none"
                stroke="#e0e0e0"
                strokeWidth="0.5"
              />
            </pattern>
          </defs>
          <rect width="100%" height="100%" fill="url(#grid)" />

          {/* Rooms */}
          {currentFloorRooms.map(room => {
            const isAccessible = canAccessRoom(room);
            
            return (
            <g key={room.id}>
              <rect
                x={room.position_x}
                y={room.position_y}
                width={room.width}
                height={room.height}
                data-room={room.id}
                className={`room ${!room.is_available ? "unavailable" : ""} ${
                  selectedRoom?.id === room.id ? "selected" : ""
                } ${hoveredRoom === room.id ? "hovered" : ""}`}
                onClick={() => handleRoomClick(room)}
                onMouseEnter={() => setHoveredRoom(room.id)}
                onMouseLeave={() => setHoveredRoom(null)}
                style={{
                  fill: getRoomColor(room),
                  stroke: isAccessible ? "#333" : "#f44336",
                  strokeWidth: 2,
                  cursor: (room.is_available && isAccessible) ? "pointer" : "not-allowed",
                  opacity: isAccessible ? 1 : 0.7,
                }}
              />
              
              {/* Door indicator */}
              <rect
                x={room.position_x + room.width / 2 - 8}
                y={room.position_y + room.height - 3}
                width={16}
                height={6}
                fill="#8b4513"
                stroke="none"
              />
              
              {/* Room label with text wrapping */}
              <foreignObject
                x={room.position_x + 5}
                y={room.position_y + 10}
                width={room.width - 10}
                height={room.height - 30}
                style={{ pointerEvents: "none" }}
              >
                <div
                  style={{
                    width: "100%",
                    height: "100%",
                    display: "flex",
                    flexDirection: "column",
                    alignItems: "center",
                    justifyContent: "center",
                    fontSize: "11px",
                    fontWeight: "bold",
                    color: "#1a1a1a",
                    textAlign: "center",
                    lineHeight: "1.2",
                    padding: "2px",
                    overflow: "hidden",
                    wordWrap: "break-word",
                  }}
                >
                  {getRoomName(room)}
                </div>
              </foreignObject>
              
              {/* Capacity and lock icon */}
              <text
                x={room.position_x + room.width / 2}
                y={room.position_y + room.height - 15}
                textAnchor="middle"
                dominantBaseline="middle"
                className="room-capacity"
                style={{
                  fontSize: "10px",
                  pointerEvents: "none",
                  fill: "#666",
                }}
              >
                {!isAccessible && `🔒 `}
                {t("map.capacity")}: {room.capacity}
              </text>
            </g>
            );
          })}
        </svg>
      </div>

      {/* Room details panel - now as overlay */}
      {selectedRoom && !showReservationModal && (
        <>
          <div 
            className="modal-overlay" 
            onClick={() => setSelectedRoom(null)}
            style={{
              position: 'fixed',
              top: 0,
              left: 0,
              right: 0,
              bottom: 0,
              background: 'rgba(0, 0, 0, 0.7)',
              backdropFilter: 'blur(5px)',
              zIndex: 1000,
            }}
          />
          <div style={{
            position: 'fixed',
            top: isMobile ? '50%' : '50%',
            left: '50%',
            transform: 'translate(-50%, -50%)',
            background: isLightMode ? 'rgba(255, 255, 255, 0.98)' : 'rgba(26, 24, 37, 0.95)',
            backdropFilter: 'blur(20px)',
            border: isLightMode ? '1px solid rgba(0, 0, 0, 0.2)' : '1px solid var(--glass-border)',
            borderRadius: '12px',
            padding: isMobile ? '1.5rem' : '2rem',
            paddingTop: isMobile ? '1.5rem' : '2rem',
            maxWidth: '500px',
            width: isMobile ? '85%' : '90%',
            maxHeight: isMobile ? '70vh' : '85vh',
            overflowY: isMobile ? 'auto' : 'visible',
            zIndex: 1001,
            boxShadow: isLightMode ? '0 8px 32px rgba(0, 0, 0, 0.15)' : '0 8px 32px rgba(0, 0, 0, 0.3)',
            color: isLightMode ? '#0a0a0a' : '#ffffff',
          }}>
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '1.5rem' }}>
              <h3 style={{ margin: 0 }}>{getRoomName(selectedRoom)}</h3>
              <button 
                onClick={() => setSelectedRoom(null)}
                style={{
                  background: 'none',
                  border: 'none',
                  fontSize: '1.5rem',
                  cursor: 'pointer',
                  padding: '0.25rem 0.5rem',
                }}
              >
                ×
              </button>
            </div>
            
            <div style={{ marginBottom: '1.5rem' }}>
              <p style={{ marginBottom: '0.75rem' }}>
                <strong>{t("map.type") || "Type"}:</strong> {selectedRoom.room_type || 'standard'}
              </p>
              <p style={{ marginBottom: '0.75rem' }}>
                <strong>{t("map.capacity")}:</strong> {selectedRoom.capacity}
              </p>
              <p style={{ marginBottom: '0.75rem' }}>
                <strong>{t("map.description")}:</strong>{" "}
                {i18n.language === "hu"
                  ? selectedRoom.description_hu
                  : selectedRoom.description_en}
              </p>
              <p style={{ marginBottom: '0.75rem' }}>
                <strong>{t("map.floor")}:</strong> {selectedRoom.floor}
              </p>
            </div>
            
            <button
              className="btn-primary"
              onClick={handleReserveClick}
              style={{ width: '100%' }}
            >
              {userRole === 'user' ? t("permissions.requestPermission") : t("map.reserve")}
            </button>
          </div>
        </>
      )}

      {/* Reservation Modal */}
      {showReservationModal && selectedRoom && (
        <div className="modal-overlay" onClick={() => setShowReservationModal(false)}>
          <div className="modal-content" onClick={(e) => e.stopPropagation()}>
            <div className="modal-header">
              <h2>{t("reservation.title") || "Reserve Room"}</h2>
              <button className="modal-close" onClick={() => setShowReservationModal(false)}>
                ×
              </button>
            </div>
            <div className="modal-body">
              <p><strong>{t("map.room") || "Room"}:</strong> {getRoomName(selectedRoom)}</p>
              <p><strong>{t("map.capacity")}:</strong> {selectedRoom.capacity}</p>
              
              <div style={{ marginTop: '1.5rem', marginBottom: '1rem' }}>
                <label style={{ 
                  display: 'block',
                  marginBottom: '0.75rem',
                  fontWeight: '600',
                  color: 'var(--text-primary)',
                  fontSize: '0.9rem'
                }}>
                  {t("reservation.startTime") || "Start Time"}
                </label>
                <DateTimePicker
                  value={reservationDetails.startTime}
                  min={getMinDateTime()}
                  step="900"
                  onChange={(value) => setReservationDetails({ ...reservationDetails, startTime: value })}
                  onBlur={(value) => {
                    const selectedTime = new Date(value);
                    const now = new Date();
                    
                    // Check if selected time is in the past
                    if (selectedTime < now) {
                      // Reset to current time rounded to next 15-min interval
                      const roundedNow = new Date(now);
                      const minutes = roundedNow.getMinutes();
                      const roundedMinutes = Math.ceil(minutes / 15) * 15;
                      roundedNow.setMinutes(roundedMinutes);
                      roundedNow.setSeconds(0);
                      roundedNow.setMilliseconds(0);
                      
                      const year = roundedNow.getFullYear();
                      const month = String(roundedNow.getMonth() + 1).padStart(2, '0');
                      const day = String(roundedNow.getDate()).padStart(2, '0');
                      const hours = String(roundedNow.getHours()).padStart(2, '0');
                      const mins = String(roundedNow.getMinutes()).padStart(2, '0');
                      const resetValue = `${year}-${month}-${day}T${hours}:${mins}`;
                      
                      setReservationDetails({ ...reservationDetails, startTime: resetValue });
                      setAlertMessage(t("reservation.noPastDates") || "Cannot select past dates. Reset to current time.");
                      setShowAlertModal(true);
                    } else {
                      // Round to nearest 15-minute interval
                      const rounded = new Date(selectedTime);
                      const minutes = rounded.getMinutes();
                      const roundedMinutes = Math.ceil(minutes / 15) * 15;
                      rounded.setMinutes(roundedMinutes);
                      rounded.setSeconds(0);
                      rounded.setMilliseconds(0);
                      
                      // Check if rounded time is now in the past
                      if (rounded < now) {
                        // Use next 15-min interval from current time instead
                        const roundedNow = new Date(now);
                        const nowMinutes = roundedNow.getMinutes();
                        const nowRoundedMinutes = Math.ceil(nowMinutes / 15) * 15;
                        roundedNow.setMinutes(nowRoundedMinutes);
                        roundedNow.setSeconds(0);
                        roundedNow.setMilliseconds(0);
                        
                        const year = roundedNow.getFullYear();
                        const month = String(roundedNow.getMonth() + 1).padStart(2, '0');
                        const day = String(roundedNow.getDate()).padStart(2, '0');
                        const hours = String(roundedNow.getHours()).padStart(2, '0');
                        const mins = String(roundedNow.getMinutes()).padStart(2, '0');
                        const resetValue = `${year}-${month}-${day}T${hours}:${mins}`;
                        
                        setReservationDetails({ ...reservationDetails, startTime: resetValue });
                      } else {
                        const year = rounded.getFullYear();
                        const month = String(rounded.getMonth() + 1).padStart(2, '0');
                        const day = String(rounded.getDate()).padStart(2, '0');
                        const hours = String(rounded.getHours()).padStart(2, '0');
                        const mins = String(rounded.getMinutes()).padStart(2, '0');
                        const roundedValue = `${year}-${month}-${day}T${hours}:${mins}`;
                        
                        setReservationDetails({ ...reservationDetails, startTime: roundedValue });
                      }
                    }
                  }}
                  className="modern-datetime-input"
                />
                <small style={{ fontSize: '0.85rem', color: 'var(--text-secondary)', display: 'block', marginTop: '0.5rem' }}>
                  {t("reservation.quarterHourOnly") || "Only 15-minute intervals (e.g., 13:00, 13:15, 13:30, 13:45)"}
                </small>
              </div>
              
              <div style={{ marginBottom: '1rem' }}>
                <label style={{ 
                  display: 'block',
                  marginBottom: '0.75rem',
                  fontWeight: '600',
                  color: 'var(--text-primary)',
                  fontSize: '0.9rem'
                }}>
                  {t("reservation.endTime") || "End Time"}
                </label>
                <DateTimePicker
                  value={reservationDetails.endTime}
                  min={reservationDetails.startTime || getMinDateTime()}
                  step="900"
                  onChange={(value) => {
                    setReservationDetails({ ...reservationDetails, endTime: value });
                    setDurationWarning(""); // Clear warning while typing
                  }}
                  onBlur={(value) => {
                    const selectedTime = new Date(value);
                    const now = new Date();
                    
                    // Check if selected time is in the past
                    if (selectedTime < now) {
                      // Reset to current time + 1 hour, rounded to next 15-min interval
                      const roundedNow = new Date(now.getTime() + 60 * 60 * 1000);
                      const minutes = roundedNow.getMinutes();
                      const roundedMinutes = Math.ceil(minutes / 15) * 15;
                      roundedNow.setMinutes(roundedMinutes);
                      roundedNow.setSeconds(0);
                      roundedNow.setMilliseconds(0);
                      
                      const year = roundedNow.getFullYear();
                      const month = String(roundedNow.getMonth() + 1).padStart(2, '0');
                      const day = String(roundedNow.getDate()).padStart(2, '0');
                      const hours = String(roundedNow.getHours()).padStart(2, '0');
                      const mins = String(roundedNow.getMinutes()).padStart(2, '0');
                      const resetValue = `${year}-${month}-${day}T${hours}:${mins}`;
                      
                      setReservationDetails({ ...reservationDetails, endTime: resetValue });
                      setAlertMessage(t("reservation.noPastDates") || "Cannot select past dates. Reset to current time.");
                      setShowAlertModal(true);
                    } else {
                      // Round to nearest 15-minute interval
                      const rounded = new Date(selectedTime);
                      const minutes = rounded.getMinutes();
                      const roundedMinutes = Math.ceil(minutes / 15) * 15;
                      rounded.setMinutes(roundedMinutes);
                      rounded.setSeconds(0);
                      rounded.setMilliseconds(0);
                      
                      // Check if rounded time is now in the past
                      if (rounded < now) {
                        // Use current time + 1 hour rounded to next 15-min interval
                        const roundedNow = new Date(now.getTime() + 60 * 60 * 1000);
                        const nowMinutes = roundedNow.getMinutes();
                        const nowRoundedMinutes = Math.ceil(nowMinutes / 15) * 15;
                        roundedNow.setMinutes(nowRoundedMinutes);
                        roundedNow.setSeconds(0);
                        roundedNow.setMilliseconds(0);
                        
                        const year = roundedNow.getFullYear();
                        const month = String(roundedNow.getMonth() + 1).padStart(2, '0');
                        const day = String(roundedNow.getDate()).padStart(2, '0');
                        const hours = String(roundedNow.getHours()).padStart(2, '0');
                        const mins = String(roundedNow.getMinutes()).padStart(2, '0');
                        const resetValue = `${year}-${month}-${day}T${hours}:${mins}`;
                        
                        setReservationDetails({ ...reservationDetails, endTime: resetValue });
                      } else {
                        // Check duration after rounding
                        if (reservationDetails.startTime) {
                          const start = new Date(reservationDetails.startTime);
                          const diffMinutes = (rounded.getTime() - start.getTime()) / (1000 * 60);
                          
                          if (diffMinutes < 30) {
                            const warningText = i18n.language === 'hu' ? 'Minimum 30 perc szükséges' : 'Minimum 30 minutes required';
                            setDurationWarning(warningText);
                            
                            // Auto-fix after 1.5 seconds: set to start + 30 minutes
                            setTimeout(() => {
                              const autoEnd = new Date(start.getTime() + 30 * 60 * 1000);
                              const autoMinutes = autoEnd.getMinutes();
                              const autoRoundedMinutes = Math.ceil(autoMinutes / 15) * 15;
                              autoEnd.setMinutes(autoRoundedMinutes);
                              autoEnd.setSeconds(0);
                              autoEnd.setMilliseconds(0);
                              
                              const year = autoEnd.getFullYear();
                              const month = String(autoEnd.getMonth() + 1).padStart(2, '0');
                              const day = String(autoEnd.getDate()).padStart(2, '0');
                              const hours = String(autoEnd.getHours()).padStart(2, '0');
                              const mins = String(autoEnd.getMinutes()).padStart(2, '0');
                              const fixedValue = `${year}-${month}-${day}T${hours}:${mins}`;
                              
                              setReservationDetails({ ...reservationDetails, endTime: fixedValue });
                              setDurationWarning("");
                            }, 1500);
                            return;
                          }
                        }
                        
                        const year = rounded.getFullYear();
                        const month = String(rounded.getMonth() + 1).padStart(2, '0');
                        const day = String(rounded.getDate()).padStart(2, '0');
                        const hours = String(rounded.getHours()).padStart(2, '0');
                        const mins = String(rounded.getMinutes()).padStart(2, '0');
                        const roundedValue = `${year}-${month}-${day}T${hours}:${mins}`;
                        
                        setReservationDetails({ ...reservationDetails, endTime: roundedValue });
                      }
                    }
                  }}
                  className="modern-datetime-input"
                />
                {durationWarning && (
                  <small style={{ 
                    fontSize: '0.85rem', 
                    color: '#ff4444', 
                    display: 'block', 
                    marginTop: '0.5rem',
                    fontWeight: '600'
                  }}>
                    ⚠️ {durationWarning}
                  </small>
                )}
                <small style={{ fontSize: '0.85rem', color: 'var(--text-secondary)', display: 'block', marginTop: '0.5rem' }}>
                  {t("reservation.quarterHourOnly") || "Only 15-minute intervals (e.g., 13:00, 13:15, 13:30, 13:45)"}
                </small>
              </div>
              
              <div className="form-group">
                <label>{t("reservation.attendees") || "Number of Attendees"}</label>
                {isMobile ? (
                  // Mobile: +/- buttons
                  <div className="attendees-selector">
                    <button
                      type="button"
                      className="attendees-btn decrease"
                      onClick={() => {
                        const newValue = Math.max(1, reservationDetails.attendees - 1);
                        setReservationDetails({ ...reservationDetails, attendees: newValue });
                      }}
                      disabled={reservationDetails.attendees <= 1}
                      aria-label="Decrease attendees"
                    >
                      ➖
                    </button>
                    <div className="attendees-display">
                      <span className="attendees-value">{reservationDetails.attendees}</span>
                      <small className="attendees-max">/ {selectedRoom.capacity}</small>
                    </div>
                    <button
                      type="button"
                      className="attendees-btn increase"
                      onClick={() => {
                        const newValue = Math.min(selectedRoom.capacity, reservationDetails.attendees + 1);
                        setReservationDetails({ ...reservationDetails, attendees: newValue });
                      }}
                      disabled={reservationDetails.attendees >= selectedRoom.capacity}
                      aria-label="Increase attendees"
                    >
                      ➕
                    </button>
                  </div>
                ) : (
                  // Desktop: Normal input field
                  <input
                    type="number"
                    min="1"
                    max={selectedRoom.capacity}
                    value={reservationDetails.attendees}
                    onChange={(e) => {
                      const value = parseInt(e.target.value) || 1;
                      const clampedValue = Math.max(1, Math.min(selectedRoom.capacity, value));
                      setReservationDetails({ ...reservationDetails, attendees: clampedValue });
                    }}
                    placeholder={t("reservation.attendeesPlaceholder") || "Number of people"}
                    style={{
                      textAlign: 'center',
                      fontSize: '1rem',
                    }}
                  />
                )}
                <small style={{ color: 'var(--text-secondary)', fontSize: '0.875rem', marginTop: '0.5rem', display: 'block', textAlign: 'center' }}>
                  {t("reservation.maxCapacity") || "Max"}: {selectedRoom.capacity}
                </small>
              </div>
              
              <div className="form-group">
                <label>{t("reservation.purpose") || "Purpose"}</label>
                <input
                  type="text"
                  value={reservationDetails.purpose}
                  onChange={(e) => setReservationDetails({ ...reservationDetails, purpose: e.target.value })}
                  placeholder={t("reservation.purposePlaceholder") || "e.g., Team meeting, Study session"}
                />
              </div>
            </div>
            <div className="modal-actions">
              <button className="btn-cancel" onClick={() => setShowReservationModal(false)}>
                {t("common.cancel") || "Cancel"}
              </button>
              <button className="btn-confirm" onClick={handleConfirmReservation}>
                {t("common.confirm") || "Confirm"}
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Alert Modal */}
      {showAlertModal && (
        <div 
          className="modal-overlay" 
          onClick={() => setShowAlertModal(false)}
          style={{
            position: 'fixed',
            top: 0,
            left: 0,
            right: 0,
            bottom: 0,
            background: 'rgba(0,0,0,0.6)',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            zIndex: 10002,
            animation: 'fadeIn 0.2s ease-in-out',
          }}
        >
          <div 
            className="modal-content" 
            onClick={(e) => e.stopPropagation()}
            style={{
              background: 'var(--glass-bg)',
              backdropFilter: 'blur(20px)',
              padding: '2rem',
              borderRadius: '16px',
              border: '1px solid var(--glass-border)',
              maxWidth: '400px',
              width: '90%',
              textAlign: 'center',
              animation: 'slideInDown 0.3s ease-out',
              boxShadow: '0 8px 32px rgba(0, 0, 0, 0.3)',
            }}
            role="alert"
            aria-live="assertive"
          >
            <div style={{ fontSize: '3rem', marginBottom: '1rem' }}>
              {alertMessage.includes('success') || alertMessage.includes('sikeresen') || alertMessage.includes('submitted') || alertMessage.includes('küldve') ? '✅' : '⚠️'}
            </div>
            <p style={{ color: 'var(--text-primary)', fontSize: '1.1rem', lineHeight: '1.6', marginBottom: '1.5rem' }}>
              {t(alertMessage) || alertMessage}
            </p>
            <button 
              onClick={() => setShowAlertModal(false)}
              className="btn-primary"
              style={{ width: '100%' }}
            >
              {t("common.ok") || "OK"}
            </button>
          </div>
        </div>
      )}
    </div>
  );
}
