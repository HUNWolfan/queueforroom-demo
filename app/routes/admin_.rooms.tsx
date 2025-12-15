import { json, type LoaderFunctionArgs, type ActionFunctionArgs } from "@remix-run/node";
import { useLoaderData, useOutletContext, Form, useActionData } from "@remix-run/react";
import { requireUserId } from "~/utils/session.server";
import { query } from "~/db.server";
import Header from "~/components/layout/Header";
import { useTranslation } from "react-i18next";
import { useState } from "react";

export async function loader({ request }: LoaderFunctionArgs) {
  const userId = await requireUserId(request);
  
  // Felhasználó adatainak lekérése és admin jogosultság ellenőrzése
  const userResult = await query(
    'SELECT id, email, first_name, last_name, role FROM users WHERE id = $1',
    [userId]
  );
  
  const user = userResult.rows[0];
  
  if (user.role !== 'admin') {
    throw new Response("Nincs jogosultság", { status: 403 });
  }

  // Összes terem lekérése
  const roomsResult = await query(`
    SELECT id, name, name_en, name_hu, capacity, description_en, description_hu, 
           floor, position_x, position_y, width, height, 
           is_available, room_type, min_role
    FROM rooms
    ORDER BY floor, name
  `);

  return json({ rooms: roomsResult.rows });
}

export async function action({ request }: ActionFunctionArgs) {
  const userId = await requireUserId(request);
  const formData = await request.formData();
  const intent = formData.get("intent");

  // Admin jogosultság ellenőrzése
  const userResult = await query(
    'SELECT role FROM users WHERE id = $1',
    [userId]
  );
  
  if (userResult.rows[0]?.role !== 'admin') {
    return json({ success: false, error: "Nincs jogosultság" }, { status: 403 });
  }

  if (intent === "update") {
    const roomId = formData.get("roomId");
    const name = formData.get("name");
    const capacity = formData.get("capacity");
    const descEn = formData.get("description_en");
    const descHu = formData.get("description_hu");
    const roomType = formData.get("room_type");
    const minRole = formData.get("min_role");

    try {
      await query(
        `UPDATE rooms 
         SET name = $1, capacity = $2, description_en = $3, 
             description_hu = $4, room_type = $5, min_role = $6
         WHERE id = $7`,
        [name, capacity, descEn, descHu, roomType, minRole, roomId]
      );

      return json({ success: true, message: "Terem sikeresen módosítva" });
    } catch (error) {
      return json({ success: false, error: "Terem módosítása sikertelen" });
    }
  }

  return json({ success: false, error: "Érvénytelen művelet" });
}

export default function AdminRooms() {
  const { rooms } = useLoaderData<typeof loader>();
  const { user } = useOutletContext<any>();
  const { t } = useTranslation();
  const actionData = useActionData<typeof action>();
  const [editingRoom, setEditingRoom] = useState<any>(null);

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
          {t('admin.roomManagement', 'Terem kezelés')}
        </h1>

        {(actionData as any)?.success && (
          <div style={{
            background: 'rgba(76, 175, 80, 0.2)',
            border: '1px solid rgba(76, 175, 80, 0.5)',
            borderRadius: '8px',
            padding: '1rem',
            marginBottom: '1rem',
            color: 'var(--text-primary)'
          }}>
            {(actionData as any).message}
          </div>
        )}

        {(actionData as any)?.error && (
          <div style={{
            background: 'rgba(244, 67, 54, 0.2)',
            border: '1px solid rgba(244, 67, 54, 0.5)',
            borderRadius: '8px',
            padding: '1rem',
            marginBottom: '1rem',
            color: 'var(--text-primary)'
          }}>
            {(actionData as any).error}
          </div>
        )}

        <div className="glass-card" style={{ padding: '1.5rem' }}>
          <table style={{ 
            width: '100%', 
            borderCollapse: 'collapse',
            color: 'var(--text-primary)'
          }} className="admin-table">
            <thead>
              <tr style={{ borderBottom: '2px solid var(--glass-border)' }}>
                <th style={{ padding: '0.75rem', textAlign: 'left' }}>Emelet</th>
                <th style={{ padding: '0.75rem', textAlign: 'left' }}>Név</th>
                <th style={{ padding: '0.75rem', textAlign: 'left' }}>Kapacitás</th>
                <th style={{ padding: '0.75rem', textAlign: 'left' }}>Típus</th>
                <th style={{ padding: '0.75rem', textAlign: 'left' }}>Hozzáférési szint</th>
                <th style={{ padding: '0.75rem', textAlign: 'left' }}>Műveletek</th>
              </tr>
            </thead>
            <tbody>
              {rooms.map((room: any) => (
                <tr key={room.id} style={{ borderBottom: '1px solid var(--glass-border)' }}>
                  <td style={{ padding: '0.75rem' }} data-label="Emelet">{room.floor}</td>
                  <td style={{ padding: '0.75rem' }} data-label="Név">{room.name}</td>
                  <td style={{ padding: '0.75rem' }} data-label="Kapacitás">{room.capacity}</td>
                  <td style={{ padding: '0.75rem', textTransform: 'capitalize' }} data-label="Típus">{room.room_type}</td>
                  <td style={{ padding: '0.75rem', textTransform: 'capitalize' }} data-label="Hozzáférési szint">{room.min_role}</td>
                  <td style={{ padding: '0.75rem' }} className="actions-cell" data-label="Műveletek">
                    <button
                      onClick={() => setEditingRoom(room)}
                      className="btn-secondary"
                      style={{ fontSize: '0.875rem', padding: '0.5rem 1rem' }}
                    >
                      ✏️ Szerkesztés
                    </button>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>

        {/* Edit Modal */}
        {editingRoom && (
          <>
            <div 
              className="modal-overlay" 
              onClick={() => setEditingRoom(null)}
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
              top: '50%',
              left: '50%',
              transform: 'translate(-50%, -50%)',
              background: 'var(--glass-bg)',
              backdropFilter: 'blur(20px)',
              border: '1px solid var(--glass-border)',
              borderRadius: '12px',
              padding: '2rem',
              maxWidth: '600px',
              width: '90%',
              maxHeight: '90vh',
              overflowY: 'auto',
              zIndex: 1001,
              boxShadow: '0 8px 32px rgba(0, 0, 0, 0.3)',
            }}>
              <h2 style={{ 
                marginBottom: '1.5rem',
                color: 'var(--text-primary)'
              }}>
                Terem szerkesztése: {editingRoom.name}
              </h2>

              <Form method="post" onSubmit={() => setEditingRoom(null)}>
                <input type="hidden" name="intent" value="update" />
                <input type="hidden" name="roomId" value={editingRoom.id} />

                <div className="form-group">
                  <label>Terem neve</label>
                  <input
                    type="text"
                    name="name"
                    defaultValue={editingRoom.name}
                    required
                  />
                </div>

                <div className="form-group">
                  <label>Kapacitás</label>
                  <input
                    type="number"
                    name="capacity"
                    defaultValue={editingRoom.capacity}
                    required
                    min="1"
                  />
                </div>

                <div className="form-group">
                  <label>Leírás (Angol)</label>
                  <textarea
                    name="description_en"
                    defaultValue={editingRoom.description_en}
                    rows={3}
                  />
                </div>

                <div className="form-group">
                  <label>Leírás (Magyar)</label>
                  <textarea
                    name="description_hu"
                    defaultValue={editingRoom.description_hu}
                    rows={3}
                  />
                </div>

                <div className="form-group">
                  <label>Terem típusa</label>
                  <select name="room_type" defaultValue={editingRoom.room_type}>
                    <option value="standard">Szabványos</option>
                    <option value="lab">Labor</option>
                    <option value="library">Könyvtár</option>
                    <option value="meeting">Tárgyaló</option>
                    <option value="office">Iroda</option>
                    <option value="restricted">Korlátozott</option>
                  </select>
                </div>

                <div className="form-group">
                  <label>Minimum hozzáférési szint</label>
                  <select name="min_role" defaultValue={editingRoom.min_role}>
                    <option value="user">Felhasználó</option>
                    <option value="superuser">Szuperfelhasználó</option>
                    <option value="admin">Admin</option>
                  </select>
                </div>

                <div style={{ 
                  display: 'flex', 
                  gap: '1rem', 
                  marginTop: '2rem' 
                }}>
                  <button type="submit" className="btn-primary" style={{ flex: 1 }}>
                    💾 Változások mentése
                  </button>
                  <button 
                    type="button" 
                    onClick={() => setEditingRoom(null)}
                    className="btn-secondary"
                    style={{ flex: 1 }}
                  >
                    Mégse
                  </button>
                </div>
              </Form>
            </div>
          </>
        )}
      </main>
    </div>
  );
}
