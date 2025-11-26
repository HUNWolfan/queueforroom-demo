import { json, type LoaderFunctionArgs } from "@remix-run/node";
import { useLoaderData, useOutletContext, useFetcher } from "@remix-run/react";
import { useTranslation } from "react-i18next";
import { query } from "~/db.server";
import { requireUserId } from "~/utils/session.server";
import Header from "~/components/layout/Header";

export async function loader({ request }: LoaderFunctionArgs) {
  const userId = await requireUserId(request);
  
  // Get user's reservation requests
  const result = await query(
    `SELECT rr.*, 
            r.name as room_name, 
            r.name_en, 
            r.name_hu,
            u.first_name || ' ' || u.last_name as reviewed_by_name
     FROM reservation_requests rr
     JOIN rooms r ON rr.room_id = r.id
     LEFT JOIN users u ON rr.reviewed_by = u.id
     WHERE rr.user_id = $1
     ORDER BY rr.created_at DESC`,
    [userId]
  );

  return json({ requests: result.rows });
}

export default function MyRequests() {
  const { requests } = useLoaderData<typeof loader>();
  const { user } = useOutletContext<any>();
  const { t, i18n } = useTranslation();
  const fetcher = useFetcher();

  const getRoomName = (request: any) => {
    if (i18n.language === 'hu' && request.name_hu) return request.name_hu;
    if (request.name_en) return request.name_en;
    return request.room_name;
  };

  const formatDateTime = (dateString: string) => {
    const date = new Date(dateString);
    return date.toLocaleString(i18n.language === 'hu' ? 'hu-HU' : 'en-US', {
      year: 'numeric',
      month: 'short',
      day: 'numeric',
      hour: '2-digit',
      minute: '2-digit'
    });
  };

  const getStatusBadge = (status: string) => {
    const badges = {
      pending: { bg: '#ffa726', text: t('permissions.pending') },
      approved: { bg: '#66bb6a', text: t('permissions.approved') },
      rejected: { bg: '#ef5350', text: t('permissions.rejected') },
      cancelled: { bg: '#9e9e9e', text: t('permissions.cancelled') }
    };
    const badge = badges[status as keyof typeof badges] || badges.pending;
    return (
      <span style={{
        background: badge.bg,
        color: 'white',
        padding: '0.25rem 0.75rem',
        borderRadius: '12px',
        fontSize: '0.85rem',
        fontWeight: '500'
      }}>
        {badge.text}
      </span>
    );
  };

  const handleCancelRequest = (requestId: number) => {
    if (confirm(t('permissions.confirmCancel') || 'Are you sure you want to cancel this request?')) {
      fetcher.submit(
        { intent: 'cancel', requestId: requestId.toString() },
        { method: 'post', action: '/api/reservation-requests' }
      );
    }
  };

  const pendingRequests = requests.filter((r: any) => r.status === 'pending');
  const processedRequests = requests.filter((r: any) => r.status !== 'pending');

  return (
    <div className="app-container">
      <Header user={user} />
      
      <main className="main-content" style={{ padding: '2rem', maxWidth: '1200px', margin: '0 auto' }}>
        <h1 style={{ color: 'var(--text-primary)', marginBottom: '2rem' }}>
          📋 {t('permissions.myRequests') || 'My Permission Requests'}
        </h1>

        {/* Pending Requests */}
        <div className="glass-card" style={{ marginBottom: '2rem', padding: '1.5rem' }}>
          <h2 style={{ color: 'var(--text-primary)', marginBottom: '1.5rem' }}>
            ⏳ {t('permissions.pendingRequests')} ({pendingRequests.length})
          </h2>

          {pendingRequests.length === 0 ? (
            <p style={{ color: 'var(--text-secondary)', textAlign: 'center', padding: '2rem' }}>
              {t('permissions.noPendingRequests') || 'No pending requests'}
            </p>
          ) : (
            <div style={{ display: 'grid', gap: '1rem' }}>
              {pendingRequests.map((request: any) => (
                <div key={request.id} className="glass-card" style={{ padding: '1.5rem' }}>
                  <div style={{ display: 'grid', gridTemplateColumns: '1fr auto', gap: '1rem', marginBottom: '1rem' }}>
                    <div>
                      <h3 style={{ color: 'var(--text-primary)', margin: '0 0 0.5rem 0' }}>
                        🏢 {getRoomName(request)}
                      </h3>
                      <p style={{ color: 'var(--text-primary)', margin: '0 0 0.5rem 0' }}>
                        📅 <strong>{t('admin.startTime')}:</strong> {formatDateTime(request.start_time)}
                      </p>
                      <p style={{ color: 'var(--text-primary)', margin: '0 0 0.5rem 0' }}>
                        🕐 <strong>{t('admin.endTime')}:</strong> {formatDateTime(request.end_time)}
                      </p>
                      <p style={{ color: 'var(--text-primary)', margin: '0 0 0.5rem 0' }}>
                        📝 <strong>{t('admin.purpose')}:</strong> {request.purpose || t('reservation.noPurpose')}
                      </p>
                      {request.attendees && (
                        <p style={{ color: 'var(--text-primary)', margin: 0 }}>
                          👥 <strong>{t('reservation.attendees')}:</strong> {request.attendees}
                        </p>
                      )}
                    </div>
                    <div>
                      {getStatusBadge(request.status)}
                    </div>
                  </div>

                  <button
                    onClick={() => handleCancelRequest(request.id)}
                    className="btn-secondary"
                    style={{ 
                      background: '#ef5350', 
                      color: 'white',
                      width: '100%',
                      marginTop: '0.5rem'
                    }}
                  >
                    🗑️ {t('permissions.cancelRequest')}
                  </button>
                </div>
              ))}
            </div>
          )}
        </div>

        {/* Processed Requests */}
        <div className="glass-card" style={{ padding: '1.5rem' }}>
          <h2 style={{ color: 'var(--text-primary)', marginBottom: '1.5rem' }}>
            📜 {t('permissions.requestHistory') || 'Request History'} ({processedRequests.length})
          </h2>

          {processedRequests.length === 0 ? (
            <p style={{ color: 'var(--text-secondary)', textAlign: 'center', padding: '2rem' }}>
              {t('permissions.noHistory') || 'No request history'}
            </p>
          ) : (
            <div style={{ display: 'grid', gap: '1rem' }}>
              {processedRequests.map((request: any) => (
                <div key={request.id} className="glass-card" style={{ padding: '1.5rem', opacity: 0.9 }}>
                  <div style={{ display: 'grid', gridTemplateColumns: '1fr auto', gap: '1rem' }}>
                    <div>
                      <h4 style={{ color: 'var(--text-primary)', margin: '0 0 0.5rem 0' }}>
                        🏢 {getRoomName(request)}
                      </h4>
                      <p style={{ color: 'var(--text-secondary)', margin: '0 0 0.5rem 0', fontSize: '0.9rem' }}>
                        📅 {formatDateTime(request.start_time)} → {formatDateTime(request.end_time)}
                      </p>
                      {request.review_note && (
                        <p style={{ 
                          color: 'var(--text-primary)', 
                          margin: '0.75rem 0 0 0', 
                          padding: '0.75rem',
                          background: 'rgba(255,255,255,0.05)',
                          borderRadius: '8px',
                          fontSize: '0.9rem'
                        }}>
                          💬 <strong>{t('permissions.reviewNote')}:</strong> {request.review_note}
                        </p>
                      )}
                      {request.reviewed_by_name && (
                        <p style={{ color: 'var(--text-secondary)', fontSize: '0.85rem', margin: '0.5rem 0 0 0' }}>
                          👨‍💼 {t('admin.reviewedBy')}: {request.reviewed_by_name}
                        </p>
                      )}
                      {request.reviewed_at && (
                        <p style={{ color: 'var(--text-secondary)', fontSize: '0.85rem', margin: '0.25rem 0 0 0' }}>
                          📆 {formatDateTime(request.reviewed_at)}
                        </p>
                      )}
                    </div>
                    <div>
                      {getStatusBadge(request.status)}
                    </div>
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>
      </main>
    </div>
  );
}
