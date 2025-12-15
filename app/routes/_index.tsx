import type { ActionFunctionArgs, LoaderFunctionArgs } from "@remix-run/node";
import { json, redirect } from "@remix-run/node";
import { useLoaderData, useOutletContext } from "@remix-run/react";
import { useTranslation } from "react-i18next";
import { requireUserId } from "~/utils/session.server";
import { query } from "~/db.server";
import Header from "~/components/layout/Header";
import AnimatedBackground from "~/components/layout/AnimatedBackground";

export async function loader({ request }: LoaderFunctionArgs) {
  const userId = await requireUserId(request);
  
  // Get user's active reservations (future reservations)
  const activeReservationsResult = await query(`
    SELECT COUNT(*) as count 
    FROM reservations 
    WHERE user_id = $1 
      AND end_time > NOW() 
      AND status = 'confirmed'
  `, [userId]);
  
  // Get available rooms count
  const availableRoomsResult = await query(`
    SELECT COUNT(*) as count 
    FROM rooms 
    WHERE is_available = true 
      AND room_type != 'corridor'
  `);
  
  // Get today's upcoming reservations for this user
  const upcomingTodayResult = await query(`
    SELECT COUNT(*) as count 
    FROM reservations 
    WHERE user_id = $1 
      AND DATE(start_time) = CURRENT_DATE 
      AND start_time > NOW()
      AND status = 'confirmed'
  `, [userId]);
  
  // Get user's recent/upcoming reservations with room details
  const reservationsResult = await query(`
    SELECT 
      r.id,
      r.start_time,
      r.end_time,
      r.purpose,
      r.status,
      rm.name as room_name,
      rm.name_en as room_name_en,
      rm.name_hu as room_name_hu,
      rm.floor
    FROM reservations r
    JOIN rooms rm ON r.room_id = rm.id
    WHERE r.user_id = $1
      AND r.end_time > NOW()
    ORDER BY r.start_time ASC
    LIMIT 5
  `, [userId]);
  
  return json({
    activeReservations: parseInt(activeReservationsResult.rows[0].count),
    availableRooms: parseInt(availableRoomsResult.rows[0].count),
    upcomingToday: parseInt(upcomingTodayResult.rows[0].count),
    reservations: reservationsResult.rows,
  });
}

export default function Index() {
  const { user } = useOutletContext<any>();
  const { t, i18n } = useTranslation();
  const isHungarian = i18n.language === 'hu';
  
  const { activeReservations, availableRooms, upcomingToday, reservations } = useLoaderData<typeof loader>();

  // Helper function to get room name based on current language
  const getRoomName = (room: any) => {
    if (isHungarian && room.room_name_hu) {
      return room.room_name_hu;
    }
    if (!isHungarian && room.room_name_en) {
      return room.room_name_en;
    }
    return room.room_name;
  };
  
  // Get display name with fallback
  const displayFirstName = user?.firstName || user?.email?.split('@')[0] || t('dashboard.user');

  return (
    <div className="app-container">
      <AnimatedBackground />
      <Header user={user} />
      
      <main className="main-content">
        <div className="dashboard" style={{ maxWidth: '1400px', margin: '0 auto' }}>
          {/* Hero Section - Kompakt */}
          <div className="hero-section animate-fade-in" style={{ padding: '1.5rem 1rem', marginBottom: '1rem' }}>
            <h1 className="hero-title" style={{ fontSize: '2rem', marginBottom: '0.5rem' }}>
              <span className="wave-emoji" role="img" aria-label="wave">👋</span> {t("dashboard.welcome")}, {displayFirstName}!
            </h1>
            <p className="hero-subtitle" style={{ fontSize: '1rem' }}>
              {t("dashboard.welcomeSubtitle")}
            </p>
          </div>

          {/* Stats Cards - Kompakt */}
          <div className="stats-grid animate-slide-up" style={{ animationDelay: '0.1s', gap: '1rem', marginBottom: '1rem' }}>
            <div className="stat-card" style={{ padding: '1rem' }}>
              <div className="stat-icon" style={{ fontSize: '1.8rem', marginBottom: '0.25rem' }}>📅</div>
              <div className="stat-value" style={{ fontSize: '1.8rem', marginBottom: '0.25rem' }}>{activeReservations}</div>
              <div className="stat-label">{t("dashboard.activeReservations")}</div>
            </div>
            <div className="stat-card" style={{ padding: '1rem' }}>
              <div className="stat-icon" style={{ fontSize: '1.8rem', marginBottom: '0.25rem' }}>🏢</div>
              <div className="stat-value" style={{ fontSize: '1.8rem', marginBottom: '0.25rem' }}>{availableRooms}</div>
              <div className="stat-label">{t("dashboard.availableRooms")}</div>
            </div>
            <div className="stat-card" style={{ padding: '1rem' }}>
              <div className="stat-icon" style={{ fontSize: '1.8rem', marginBottom: '0.25rem' }}>⏰</div>
              <div className="stat-value" style={{ fontSize: '1.8rem', marginBottom: '0.25rem' }}>{upcomingToday}</div>
              <div className="stat-label">{t("dashboard.upcomingToday")}</div>
            </div>
          </div>

          {/* Action Cards - Kompakt, 2 sor */}
          <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(280px, 1fr))', gap: '1rem', marginBottom: '1rem' }} className="animate-slide-up">
            <div className="dashboard-card card-primary" style={{ padding: '1.25rem' }}>
              <div className="card-icon" style={{ fontSize: '2rem', marginBottom: '0.5rem' }}>🗺️</div>
              <h2 style={{ fontSize: '1.1rem', marginBottom: '0.5rem' }}>{t("dashboard.quickReserve")}</h2>
              <p style={{ fontSize: '0.85rem', marginBottom: '0.75rem' }}>{t("dashboard.quickReserveDesc")}</p>
              <a href="/map" className="btn-primary btn-hover" style={{ fontSize: '0.9rem', padding: '0.6rem 1.25rem' }}>
                {t("dashboard.goToMap")} →
              </a>
            </div>

            <div className="dashboard-card card-secondary" style={{ padding: '1.25rem' }}>
              <div className="card-icon" style={{ fontSize: '2rem', marginBottom: '0.5rem' }}>📋</div>
              <h2 style={{ fontSize: '1.1rem', marginBottom: '0.5rem' }}>{t("dashboard.myReservations")}</h2>
              <p style={{ fontSize: '0.85rem', marginBottom: '0.75rem' }}>{t("dashboard.myReservationsDesc")}</p>
              <a href="/reservations" className="btn-secondary btn-hover" style={{ fontSize: '0.9rem', padding: '0.6rem 1.25rem' }}>
                {t("dashboard.viewReservations")} →
              </a>
            </div>

            <div className="dashboard-card card-accent" style={{ padding: '1.25rem' }}>
              <div className="card-icon" style={{ fontSize: '2rem', marginBottom: '0.5rem' }}>⚙️</div>
              <h2 style={{ fontSize: '1.1rem', marginBottom: '0.5rem' }}>{t("nav.settings")}</h2>
              <p style={{ fontSize: '0.85rem', marginBottom: '0.75rem' }}>
                🎨 {t("settings.glassMorphism")}<br />
                🌐 {t("settings.bilingualSupport")}<br />
                🔒 {t("settings.secureAuth")}
              </p>
              <a href="/settings" className="btn-primary btn-hover" style={{ fontSize: '0.9rem', padding: '0.6rem 1.25rem' }}>
                {t("nav.settings")} →
              </a>
            </div>
          </div>

          {/* Quick Actions - Inline kompakt verzió */}
          <div className="quick-actions animate-slide-up" style={{ animationDelay: '0.3s', padding: '1rem', marginTop: '0' }}>
            <div style={{ display: 'flex', gap: '0.75rem', flexWrap: 'wrap', justifyContent: 'center' }}>
              <a href="/map" className="quick-action-btn" style={{ padding: '0.6rem 1rem', fontSize: '0.9rem' }}>
                <span className="quick-action-icon" style={{ fontSize: '1rem' }}>🔍</span>
                {t("dashboard.browseRooms")}
              </a>
              <a href="/profile" className="quick-action-btn" style={{ padding: '0.6rem 1rem', fontSize: '0.9rem' }}>
                <span className="quick-action-icon" style={{ fontSize: '1rem' }}>👤</span>
                {t("dashboard.myProfile")}
              </a>
              {reservations.length > 0 && (
                <a href="/reservations" className="quick-action-btn" style={{ padding: '0.6rem 1rem', fontSize: '0.9rem', background: 'rgba(103, 126, 234, 0.2)', borderColor: 'rgba(103, 126, 234, 0.4)' }}>
                  <span className="quick-action-icon" style={{ fontSize: '1rem' }}>📅</span>
                  {reservations.length} {t("dashboard.upcomingReservations")}
                </a>
              )}
            </div>
          </div>

          {/* Upcoming Reservations - Csak akkor jelenítjük meg, ha van és a felhasználó kattint */}
          {false && reservations.length > 0 && (
            <div className="glass-card animate-slide-up" style={{ 
              animationDelay: '0.4s',
              marginTop: '2rem',
              padding: '1.5rem'
            }}>
              <h3 style={{ 
                marginBottom: '1.5rem', 
                fontSize: '1.5rem',
                color: 'var(--text-primary)',
                display: 'flex',
                alignItems: 'center',
                gap: '0.5rem'
              }}>
                📋 {t("dashboard.upcomingReservations")}
              </h3>
              <div style={{ display: 'flex', flexDirection: 'column', gap: '1rem' }}>
                {reservations.map((reservation: any) => (
                  <div 
                    key={reservation.id}
                    className="glass-card"
                    style={{
                      padding: '1rem',
                      display: 'flex',
                      justifyContent: 'space-between',
                      alignItems: 'center',
                      flexWrap: 'wrap',
                      gap: '1rem',
                      background: 'rgba(255, 255, 255, 0.05)',
                      transition: 'all 0.3s ease'
                    }}
                    onMouseEnter={(e) => {
                      e.currentTarget.style.background = 'rgba(255, 255, 255, 0.1)';
                      e.currentTarget.style.transform = 'translateY(-2px)';
                    }}
                    onMouseLeave={(e) => {
                      e.currentTarget.style.background = 'rgba(255, 255, 255, 0.05)';
                      e.currentTarget.style.transform = 'translateY(0)';
                    }}
                  >
                    <div style={{ flex: 1, minWidth: '200px' }}>
                      <div style={{ 
                        fontWeight: 'bold', 
                        fontSize: '1.1rem',
                        color: 'var(--text-primary)',
                        marginBottom: '0.25rem'
                      }}>
                        🏢 {getRoomName(reservation)}
                      </div>
                      <div style={{ 
                        fontSize: '0.9rem',
                        color: 'var(--text-secondary)',
                        opacity: 0.8
                      }}>
                        {reservation.purpose || t("reservation.noPurpose")}
                      </div>
                    </div>
                    <div style={{ 
                      display: 'flex', 
                      flexDirection: 'column',
                      alignItems: 'flex-end',
                      gap: '0.25rem'
                    }}>
                      <div style={{ 
                        fontSize: '0.9rem',
                        color: 'var(--text-primary)'
                      }}>
                        📅 {new Date(reservation.start_time).toLocaleDateString(isHungarian ? 'hu-HU' : 'en-US')}
                      </div>
                      <div style={{ 
                        fontSize: '0.85rem',
                        color: 'var(--text-secondary)'
                      }}>
                        ⏰ {new Date(reservation.start_time).toLocaleTimeString(
                          isHungarian ? 'hu-HU' : 'en-US', 
                          isHungarian 
                            ? { hour: '2-digit', minute: '2-digit' }
                            : { hour: 'numeric', minute: '2-digit', hour12: true }
                        )} - {new Date(reservation.end_time).toLocaleTimeString(
                          isHungarian ? 'hu-HU' : 'en-US',
                          isHungarian 
                            ? { hour: '2-digit', minute: '2-digit' }
                            : { hour: 'numeric', minute: '2-digit', hour12: true }
                        )}
                      </div>
                    </div>
                    <span style={{
                      padding: '0.5rem 1rem',
                      borderRadius: '20px',
                      fontSize: '0.85rem',
                      fontWeight: 'bold',
                      background: reservation.status === 'confirmed' 
                        ? 'rgba(76, 175, 80, 0.3)' 
                        : 'rgba(255, 152, 0, 0.3)',
                      color: 'var(--text-primary)',
                      border: `1px solid ${reservation.status === 'confirmed' 
                        ? 'rgba(76, 175, 80, 0.5)' 
                        : 'rgba(255, 152, 0, 0.5)'}`
                    }}>
                      {reservation.status === 'confirmed' ? '✓' : '⏳'} {reservation.status}
                    </span>
                  </div>
                ))}
              </div>
              <div style={{ marginTop: '1.5rem', textAlign: 'center' }}>
                <a 
                  href="/reservations" 
                  className="btn-primary"
                  style={{
                    display: 'inline-block',
                    padding: '0.75rem 2rem',
                    textDecoration: 'none'
                  }}
                >
                  {t("dashboard.viewAllReservations")} →
                </a>
              </div>
            </div>
          )}
        </div>
      </main>
    </div>
  );
}
