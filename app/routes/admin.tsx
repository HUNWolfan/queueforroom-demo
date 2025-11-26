import { json, type LoaderFunctionArgs } from "@remix-run/node";
import { useLoaderData, useOutletContext } from "@remix-run/react";
import { requireUserId } from "~/utils/session.server";
import { query } from "~/db.server";
import Header from "~/components/layout/Header";
import { useTranslation } from "react-i18next";

export async function loader({ request }: LoaderFunctionArgs) {
  const userId = await requireUserId(request);
  
  // Get user info and check if admin
  const userResult = await query(
    'SELECT id, email, first_name, last_name, role FROM users WHERE id = $1',
    [userId]
  );
  
  const user = userResult.rows[0];
  
  if (user.role !== 'admin') {
    throw new Response("Unauthorized", { status: 403 });
  }

  // Get statistics
  const totalUsersResult = await query('SELECT COUNT(*) as count FROM users');
  const totalUsers = parseInt(totalUsersResult.rows[0].count);

  const totalRoomsResult = await query(
    "SELECT COUNT(*) as count FROM rooms WHERE room_type != 'corridor'"
  );
  const totalRooms = parseInt(totalRoomsResult.rows[0].count);

  const activeReservationsResult = await query(`
    SELECT COUNT(*) as count FROM reservations 
    WHERE end_time > NOW() AND status = 'confirmed'
  `);
  const activeReservations = parseInt(activeReservationsResult.rows[0].count);

  const totalReservationsResult = await query('SELECT COUNT(*) as count FROM reservations');
  const totalReservations = parseInt(totalReservationsResult.rows[0].count);

  // Get popular rooms (most reserved)
  const popularRoomsResult = await query(`
    SELECT r.name, r.name_en, r.name_hu, COUNT(res.id) as reservation_count
    FROM rooms r
    LEFT JOIN reservations res ON r.id = res.room_id
    WHERE r.room_type != 'corridor'
    GROUP BY r.id, r.name, r.name_en, r.name_hu
    ORDER BY reservation_count DESC
    LIMIT 5
  `);

  // Get recent reservations
  const recentReservationsResult = await query(`
    SELECT 
      res.id, 
      res.start_time, 
      res.end_time, 
      res.purpose,
      res.status,
      r.name as room_name,
      r.name_en as room_name_en,
      r.name_hu as room_name_hu,
      u.email as user_email,
      u.first_name,
      u.last_name
    FROM reservations res
    JOIN rooms r ON res.room_id = r.id
    JOIN users u ON res.user_id = u.id
    ORDER BY res.created_at DESC
    LIMIT 10
  `);

  // Get user roles distribution
  const userRolesResult = await query(`
    SELECT role, COUNT(*) as count
    FROM users
    GROUP BY role
    ORDER BY 
      CASE role
        WHEN 'admin' THEN 1
        WHEN 'superuser' THEN 2
        WHEN 'user' THEN 3
      END
  `);

  // Calculate room utilization (percentage of time rooms are booked)
  // Excludes cancelled reservations
  const utilizationResult = await query(`
    SELECT 
      r.name,
      r.name_en,
      r.name_hu,
      r.room_type,
      COUNT(res.id) as total_bookings,
      CASE 
        WHEN COUNT(res.id) > 0 THEN 
          ROUND((SUM(EXTRACT(EPOCH FROM (res.end_time - res.start_time))) / 3600)::numeric, 2)
        ELSE 0
      END as total_hours
    FROM rooms r
    LEFT JOIN reservations res ON r.id = res.room_id AND res.status != 'cancelled'
    WHERE r.room_type != 'corridor'
    GROUP BY r.id, r.name, r.name_en, r.name_hu, r.room_type
    ORDER BY total_hours DESC
    LIMIT 10
  `);

  return json({
    totalUsers,
    totalRooms,
    activeReservations,
    totalReservations,
    popularRooms: popularRoomsResult.rows,
    recentReservations: recentReservationsResult.rows,
    userRoles: userRolesResult.rows,
    utilization: utilizationResult.rows,
  });
}

export default function Admin() {
  const { user } = useOutletContext<any>();
  const { t, i18n } = useTranslation();
  const {
    totalUsers,
    totalRooms,
    activeReservations,
    totalReservations,
    popularRooms,
    recentReservations,
    userRoles,
    utilization,
  } = useLoaderData<typeof loader>();

  // Helper function to get room name based on current language
  const getRoomName = (room: any) => {
    const isHungarian = i18n.language === 'hu';
    if (isHungarian && room.name_hu) {
      return room.name_hu;
    }
    if (!isHungarian && room.name_en) {
      return room.name_en;
    }
    return room.name; // Fallback to default name
  };

  return (
    <div className="app-container">
      <Header user={user} />
      
      <main className="main-content" style={{ padding: '2rem' }}>
        <h1 style={{ 
          fontSize: '2.5rem', 
          marginBottom: '2rem', 
          color: 'var(--text-primary)',
          textAlign: 'center'
        }}>
          {t('admin.title', 'Admin Dashboard')}
        </h1>

        {/* Statistics Cards */}
        <div style={{
          display: 'grid',
          gridTemplateColumns: 'repeat(auto-fit, minmax(250px, 1fr))',
          gap: '1.5rem',
          marginBottom: '2rem'
        }}>
          <StatCard 
            title={t('admin.totalUsers', 'Total Users')} 
            value={totalUsers} 
            icon="👥"
          />
          <StatCard 
            title={t('admin.totalRooms', 'Total Rooms')} 
            value={totalRooms} 
            icon="🚪"
          />
          <StatCard 
            title={t('admin.activeReservations', 'Active Reservations')} 
            value={activeReservations} 
            icon="📅"
          />
          <StatCard 
            title={t('admin.totalReservations', 'Total Reservations')} 
            value={totalReservations} 
            icon="📊"
          />
        </div>

        {/* Quick Actions */}
        <div className="glass-card" style={{ marginBottom: '2rem', padding: '1.5rem' }}>
          <h2 style={{ 
            fontSize: '1.5rem', 
            marginBottom: '1rem', 
            color: 'var(--text-primary)' 
          }}>
            ⚡ {t('admin.quickActions') || 'Quick Actions'}
          </h2>
          <div style={{ display: 'flex', gap: '1rem', flexWrap: 'wrap' }}>
            <a 
              href="/admin/permission-requests" 
              className="btn-primary"
              style={{ textDecoration: 'none' }}
            >
              🎓 {t('permissions.pendingRequests') || 'Permission Requests'}
            </a>
            <a 
              href="/admin/instructor-permissions" 
              className="btn-secondary"
              style={{ textDecoration: 'none' }}
            >
              ⭐ {t('permissions.instructorPermissions') || 'Instructor Permissions'}
            </a>
            <a 
              href="/admin/system-settings" 
              className="btn-secondary"
              style={{ textDecoration: 'none' }}
            >
              ⚙️ {t('admin.systemSettings') || 'System Settings'}
            </a>
          </div>
        </div>

        {/* User Roles Distribution */}
        <div className="glass-card" style={{ marginBottom: '2rem', padding: '1.5rem' }}>
          <h2 style={{ 
            fontSize: '1.5rem', 
            marginBottom: '1rem', 
            color: 'var(--text-primary)' 
          }}>
            {t('admin.userRoles', 'User Roles Distribution')}
          </h2>
          <div style={{ display: 'flex', gap: '1rem', flexWrap: 'wrap' }}>
            {userRoles.map((roleData: any) => (
              <div key={roleData.role} style={{
                background: 'var(--glass-bg)',
                padding: '1rem',
                borderRadius: '8px',
                border: '1px solid var(--glass-border)',
                minWidth: '150px',
                textAlign: 'center'
              }}>
                <div style={{ fontSize: '2rem', marginBottom: '0.5rem' }}>
                  {roleData.role === 'admin' ? '👑' : roleData.role === 'superuser' ? '⭐' : '👤'}
                </div>
                <div style={{ fontSize: '0.875rem', color: 'var(--text-secondary)', textTransform: 'capitalize' }}>
                  {roleData.role}
                </div>
                <div style={{ fontSize: '1.5rem', fontWeight: 'bold', color: 'var(--text-primary)' }}>
                  {roleData.count}
                </div>
              </div>
            ))}
          </div>
        </div>

        {/* Two Column Layout for Popular Rooms and Utilization */}
        <div style={{
          display: 'grid',
          gridTemplateColumns: 'repeat(auto-fit, minmax(350px, 1fr))',
          gap: '1.5rem',
          marginBottom: '2rem'
        }}>
          {/* Popular Rooms */}
          <div className="glass-card" style={{ padding: '1.5rem' }}>
            <h2 style={{ 
              fontSize: '1.5rem', 
              marginBottom: '1rem', 
              color: 'var(--text-primary)' 
            }}>
              {t('admin.popularRooms', 'Most Popular Rooms')}
            </h2>
            <div style={{ display: 'flex', flexDirection: 'column', gap: '0.75rem' }}>
              {popularRooms.map((room: any, index: number) => (
                <div key={index} style={{
                  display: 'flex',
                  justifyContent: 'space-between',
                  alignItems: 'center',
                  padding: '0.75rem',
                  background: 'var(--glass-bg)',
                  borderRadius: '6px',
                  border: '1px solid var(--glass-border)'
                }}>
                  <span style={{ color: 'var(--text-primary)' }}>{getRoomName(room)}</span>
                  <span style={{ 
                    background: 'rgba(103, 126, 234, 0.3)',
                    color: 'var(--text-primary)',
                    padding: '0.25rem 0.75rem',
                    borderRadius: '12px',
                    fontSize: '0.875rem',
                    fontWeight: 'bold'
                  }}>
                    {room.reservation_count} {t('admin.bookings', 'bookings')}
                  </span>
                </div>
              ))}
            </div>
          </div>

          {/* Room Utilization */}
          <div className="glass-card" style={{ padding: '1.5rem' }}>
            <h2 style={{ 
              fontSize: '1.5rem', 
              marginBottom: '1rem', 
              color: 'var(--text-primary)' 
            }}>
              {t('admin.roomUtilization', 'Room Utilization')}
            </h2>
            <div style={{ display: 'flex', flexDirection: 'column', gap: '0.75rem' }}>
              {utilization.map((room: any, index: number) => (
                <div key={index} style={{
                  padding: '0.75rem',
                  background: 'var(--glass-bg)',
                  borderRadius: '6px',
                  border: '1px solid var(--glass-border)'
                }}>
                  <div style={{ 
                    display: 'flex', 
                    justifyContent: 'space-between',
                    marginBottom: '0.5rem'
                  }}>
                    <span style={{ color: 'var(--text-primary)' }}>{getRoomName(room)}</span>
                    <span style={{ 
                      color: 'var(--text-secondary)',
                      fontSize: '0.875rem'
                    }}>
                      {room.total_hours}h
                    </span>
                  </div>
                  <div style={{
                    fontSize: '0.75rem',
                    color: 'var(--text-secondary)',
                    textTransform: 'capitalize'
                  }}>
                    {room.room_type} • {room.total_bookings} {t('admin.bookings', 'bookings')}
                  </div>
                </div>
              ))}
            </div>
          </div>
        </div>

        {/* Recent Reservations */}
        <div className="glass-card" style={{ padding: '1.5rem' }}>
          <h2 style={{ 
            fontSize: '1.5rem', 
            marginBottom: '1rem', 
            color: 'var(--text-primary)' 
          }}>
            {t('admin.recentReservations', 'Recent Reservations')}
          </h2>
          <div style={{ overflowX: 'hidden' }} className="admin-reservations-table">
            <table style={{ 
              width: '100%', 
              borderCollapse: 'collapse',
              color: 'var(--text-primary)'
            }} className="admin-table">
              <thead>
                <tr style={{ borderBottom: '1px solid var(--glass-border)' }}>
                  <th style={{ padding: '0.75rem', textAlign: 'left' }}>
                    {t('admin.room', 'Room')}
                  </th>
                  <th style={{ padding: '0.75rem', textAlign: 'left' }}>
                    {t('admin.user', 'User')}
                  </th>
                  <th style={{ padding: '0.75rem', textAlign: 'left' }}>
                    {t('admin.startTime', 'Start Time')}
                  </th>
                  <th style={{ padding: '0.75rem', textAlign: 'left' }}>
                    {t('admin.endTime', 'End Time')}
                  </th>
                  <th style={{ padding: '0.75rem', textAlign: 'left' }}>
                    {t('admin.purpose', 'Purpose')}
                  </th>
                  <th style={{ padding: '0.75rem', textAlign: 'left' }}>
                    {t('admin.status', 'Status')}
                  </th>
                </tr>
              </thead>
              <tbody>
                {recentReservations.map((reservation: any) => {
                  // Create a room object for getRoomName
                  const roomObj = {
                    name: reservation.room_name,
                    name_en: reservation.room_name_en,
                    name_hu: reservation.room_name_hu
                  };
                  return (
                  <tr key={reservation.id} style={{ borderBottom: '1px solid var(--glass-border)' }}>
                    <td style={{ padding: '0.75rem' }} data-label={t('admin.room', 'Room')}>{getRoomName(roomObj)}</td>
                    <td style={{ padding: '0.75rem' }} data-label={t('admin.user', 'User')}>
                      {reservation.first_name} {reservation.last_name}
                    </td>
                    <td style={{ padding: '0.75rem' }} data-label={t('admin.startTime', 'Start Time')}>
                      {new Date(reservation.start_time).toLocaleString()}
                    </td>
                    <td style={{ padding: '0.75rem' }} data-label={t('admin.endTime', 'End Time')}>
                      {new Date(reservation.end_time).toLocaleString()}
                    </td>
                    <td style={{ padding: '0.75rem' }} data-label={t('admin.purpose', 'Purpose')}>{reservation.purpose}</td>
                    <td style={{ padding: '0.75rem' }} data-label={t('admin.status', 'Status')}>
                      <span style={{
                        padding: '0.25rem 0.75rem',
                        borderRadius: '12px',
                        fontSize: '0.875rem',
                        fontWeight: '600',
                        background: 
                          reservation.status === 'confirmed' || reservation.status === 'active'
                            ? 'rgba(76, 175, 80, 0.2)' 
                            : reservation.status === 'cancelled'
                            ? 'rgba(244, 67, 54, 0.2)'
                            : 'rgba(255, 152, 0, 0.2)',
                        color: 
                          reservation.status === 'confirmed' || reservation.status === 'active'
                            ? '#4caf50' 
                            : reservation.status === 'cancelled'
                            ? '#f44336'
                            : '#ff9800',
                        border: `1px solid ${
                          reservation.status === 'confirmed' || reservation.status === 'active'
                            ? 'rgba(76, 175, 80, 0.5)' 
                            : reservation.status === 'cancelled'
                            ? 'rgba(244, 67, 54, 0.5)'
                            : 'rgba(255, 152, 0, 0.5)'
                        }`
                      }}>
                        {reservation.status}
                      </span>
                    </td>
                  </tr>
                  );
                })}
              </tbody>
            </table>
          </div>
        </div>
      </main>
    </div>
  );
}

function StatCard({ title, value, icon }: { title: string; value: number; icon: string }) {
  return (
    <div className="glass-card" style={{
      padding: '1.5rem',
      textAlign: 'center',
      transition: 'transform 0.3s ease',
    }}>
      <div style={{ fontSize: '3rem', marginBottom: '0.5rem' }}>{icon}</div>
      <div style={{ 
        fontSize: '2rem', 
        fontWeight: 'bold', 
        marginBottom: '0.5rem',
        color: 'var(--text-primary)'
      }}>
        {value}
      </div>
      <div style={{ 
        fontSize: '0.875rem', 
        color: 'var(--text-secondary)' 
      }}>
        {title}
      </div>
    </div>
  );
}
