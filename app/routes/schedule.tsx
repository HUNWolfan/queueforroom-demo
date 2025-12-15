import { json, type LoaderFunctionArgs } from "@remix-run/node";
import { useLoaderData, useOutletContext, useSearchParams } from "@remix-run/react";
import { useTranslation } from "react-i18next";
import { query } from "~/db.server";
import { requireUserId } from "~/utils/session.server";
import Header from "~/components/layout/Header";
import { useState } from "react";

export async function loader({ request }: LoaderFunctionArgs) {
  await requireUserId(request);
  
  // Get all rooms
  const roomsResult = await query(
    `SELECT id, name, name_en, name_hu, floor, capacity 
     FROM rooms 
     WHERE is_available = true
     ORDER BY floor, name`
  );

  const url = new URL(request.url);
  const selectedDate = url.searchParams.get('date');
  const roomId = url.searchParams.get('roomId');

  let reservations: any[] = [];

  if (selectedDate && roomId) {
    // Get reservations for the selected date and room
    const startOfDay = `${selectedDate} 00:00:00`;
    const endOfDay = `${selectedDate} 23:59:59`;

    const reservationsResult = await query(
      `SELECT 
        r.id,
        r.start_time,
        r.end_time,
        r.purpose,
        r.status,
        u.first_name || ' ' || u.last_name as reserved_by_name,
        u.email as reserved_by_email
       FROM reservations r
       JOIN users u ON r.user_id = u.id
       WHERE r.room_id = $1
         AND r.status != 'cancelled'
         AND r.start_time >= $2::timestamp
         AND r.start_time <= $3::timestamp
       ORDER BY r.start_time ASC`,
      [roomId, startOfDay, endOfDay]
    );

    reservations = reservationsResult.rows;
  }

  return json({ 
    rooms: roomsResult.rows,
    reservations,
    selectedDate,
    selectedRoomId: roomId
  });
}

export default function RoomSchedule() {
  const { rooms, reservations, selectedDate, selectedRoomId } = useLoaderData<typeof loader>();
  const { user } = useOutletContext<any>();
  const { t, i18n } = useTranslation();
  const [searchParams, setSearchParams] = useSearchParams();

  const [date, setDate] = useState(selectedDate || getTodayDate());
  const [roomId, setRoomId] = useState(selectedRoomId || '');

  function getTodayDate() {
    const today = new Date();
    const year = today.getFullYear();
    const month = String(today.getMonth() + 1).padStart(2, '0');
    const day = String(today.getDate()).padStart(2, '0');
    return `${year}-${month}-${day}`;
  }

  const getRoomName = (room: any) => {
    if (i18n.language === 'hu' && room.name_hu) return room.name_hu;
    if (room.name_en) return room.name_en;
    return room.name;
  };

  const formatTime = (dateString: string) => {
    const date = new Date(dateString);
    return date.toLocaleTimeString(i18n.language === 'hu' ? 'hu-HU' : 'en-US', {
      hour: '2-digit',
      minute: '2-digit'
    });
  };

  const formatDateTime = (dateString: string) => {
    const date = new Date(dateString);
    return date.toLocaleString(i18n.language === 'hu' ? 'hu-HU' : 'en-US', {
      month: 'short',
      day: 'numeric',
      hour: '2-digit',
      minute: '2-digit'
    });
  };

  const getDuration = (start: string, end: string) => {
    const startTime = new Date(start).getTime();
    const endTime = new Date(end).getTime();
    const durationMinutes = Math.round((endTime - startTime) / (1000 * 60));
    
    if (durationMinutes < 60) {
      return `${durationMinutes} ${t('permissions.minutes')}`;
    }
    
    const hours = Math.floor(durationMinutes / 60);
    const minutes = durationMinutes % 60;
    
    if (minutes === 0) {
      return `${hours} ${t('schedule.hours') || 'hours'}`;
    }
    
    return `${hours}h ${minutes}min`;
  };

  const handleViewSchedule = () => {
    if (date && roomId) {
      setSearchParams({ date, roomId });
    }
  };

  const selectedRoom = rooms.find((r: any) => r.id.toString() === roomId);

  return (
    <div className="app-container">
      <Header user={user} />
      
      <main className="main-content" style={{ padding: '2rem', maxWidth: '1200px', margin: '0 auto' }}>
        <h1 style={{ color: 'var(--text-primary)', marginBottom: '2rem' }}>
          📅 {t('permissions.roomSchedule')}
        </h1>

        {/* Filters */}
        <div className="glass-card" style={{ padding: '1.5rem', marginBottom: '2rem' }}>
          <h2 style={{ color: 'var(--text-primary)', marginBottom: '1.5rem', fontSize: '1.25rem' }}>
            🔍 {t('schedule.selectDateTime') || 'Select Date & Room'}
          </h2>
          
          <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(200px, 1fr))', gap: '1rem', marginBottom: '1rem' }}>
            <div>
              <label style={{ 
                display: 'block', 
                marginBottom: '0.5rem', 
                color: 'var(--text-primary)',
                fontWeight: '500'
              }}>
                📆 {t('schedule.date') || 'Date'}
              </label>
              <input
                type="date"
                value={date}
                onChange={(e) => setDate(e.target.value)}
                style={{
                  width: '100%',
                  padding: '0.75rem',
                  borderRadius: '8px',
                  border: '1px solid var(--glass-border)',
                  background: 'var(--glass-bg)',
                  color: 'var(--text-primary)',
                  fontSize: '1rem'
                }}
              />
            </div>

            <div>
              <label style={{ 
                display: 'block', 
                marginBottom: '0.5rem', 
                color: 'var(--text-primary)',
                fontWeight: '500'
              }}>
                🏢 {t('map.room') || 'Room'}
              </label>
              <select
                value={roomId}
                onChange={(e) => setRoomId(e.target.value)}
                style={{
                  width: '100%',
                  padding: '0.75rem',
                  borderRadius: '8px',
                  border: '1px solid var(--glass-border)',
                  background: 'var(--glass-bg)',
                  color: 'var(--text-primary)',
                  fontSize: '1rem'
                }}
              >
                <option value="">{t('schedule.selectRoom') || 'Select a room...'}</option>
                {rooms.map((room: any) => (
                  <option key={room.id} value={room.id}>
                    {getRoomName(room)} - {t('map.floor')} {room.floor} ({t('map.capacity')}: {room.capacity})
                  </option>
                ))}
              </select>
            </div>
          </div>

          <button
            onClick={handleViewSchedule}
            className="btn-primary"
            disabled={!date || !roomId}
            style={{ width: '100%' }}
          >
            👁️ {t('permissions.viewSchedule')}
          </button>
        </div>

        {/* Schedule Display */}
        {selectedDate && selectedRoomId && selectedRoom && (
          <div className="glass-card" style={{ padding: '1.5rem' }}>
            <h2 style={{ color: 'var(--text-primary)', marginBottom: '1.5rem' }}>
              📋 {getRoomName(selectedRoom)} - {selectedDate}
            </h2>

            {reservations.length === 0 ? (
              <div style={{ 
                textAlign: 'center', 
                padding: '3rem', 
                color: 'var(--text-secondary)' 
              }}>
                <div style={{ fontSize: '3rem', marginBottom: '1rem' }}>✅</div>
                <p style={{ fontSize: '1.1rem', margin: 0 }}>
                  {t('permissions.noReservationsForSlot') || 'No reservations for this date'}
                </p>
                <p style={{ fontSize: '0.9rem', marginTop: '0.5rem', opacity: 0.7 }}>
                  {t('schedule.roomAvailable') || 'The room is available all day!'}
                </p>
              </div>
            ) : (
              <div style={{ display: 'grid', gap: '1rem' }}>
                {reservations.map((reservation: any, index: number) => (
                  <div 
                    key={reservation.id} 
                    className="glass-card" 
                    style={{ 
                      padding: '1.5rem',
                      borderLeft: '4px solid #677eea'
                    }}
                  >
                    <div style={{ display: 'grid', gridTemplateColumns: '1fr auto', gap: '1rem', alignItems: 'start' }}>
                      <div>
                        <h3 style={{ color: 'var(--text-primary)', margin: '0 0 0.75rem 0', fontSize: '1.1rem' }}>
                          🕐 {formatTime(reservation.start_time)} - {formatTime(reservation.end_time)}
                        </h3>
                        
                        <p style={{ color: 'var(--text-primary)', margin: '0 0 0.5rem 0', fontSize: '0.95rem' }}>
                          👤 <strong>{t('permissions.reservedBy')}:</strong> {reservation.reserved_by_name}
                        </p>
                        
                        {reservation.purpose && (
                          <p style={{ color: 'var(--text-primary)', margin: '0 0 0.5rem 0', fontSize: '0.95rem' }}>
                            📝 <strong>{t('admin.purpose')}:</strong> {reservation.purpose}
                          </p>
                        )}
                        
                        <p style={{ color: 'var(--text-secondary)', margin: 0, fontSize: '0.85rem' }}>
                          ⏱️ {t('permissions.duration')}: {getDuration(reservation.start_time, reservation.end_time)}
                        </p>
                      </div>

                      <div style={{
                        background: 'rgba(103, 126, 234, 0.2)',
                        padding: '0.5rem 1rem',
                        borderRadius: '8px',
                        textAlign: 'center'
                      }}>
                        <div style={{ fontSize: '1.5rem', marginBottom: '0.25rem' }}>
                          #{index + 1}
                        </div>
                        <div style={{ fontSize: '0.75rem', color: 'var(--text-secondary)' }}>
                          {t('schedule.slot') || 'Slot'}
                        </div>
                      </div>
                    </div>
                  </div>
                ))}
              </div>
            )}
          </div>
        )}

        {!selectedDate && !selectedRoomId && (
          <div className="glass-card" style={{ padding: '3rem', textAlign: 'center' }}>
            <div style={{ fontSize: '4rem', marginBottom: '1rem' }}>📅</div>
            <p style={{ color: 'var(--text-secondary)', fontSize: '1.1rem' }}>
              {t('permissions.selectTimeSlot')}
            </p>
          </div>
        )}
      </main>
    </div>
  );
}
