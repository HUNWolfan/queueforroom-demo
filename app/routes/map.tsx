import type { LoaderFunctionArgs } from "@remix-run/node";
import { json } from "@remix-run/node";
import { useLoaderData, useOutletContext } from "@remix-run/react";
import { requireUserId } from "~/utils/session.server";
import { query } from "~/db.server";
import Header from "~/components/layout/Header";
import RoomMap from "~/components/map/RoomMap";

export async function loader({ request }: LoaderFunctionArgs) {
  await requireUserId(request);
  
  const result = await query(`
    SELECT id, name, name_en, name_hu, capacity, description_en, description_hu, 
           floor, position_x, position_y, width, height, is_available,
           room_type, min_role
    FROM rooms
    ORDER BY floor, name
  `);

  return json({ rooms: result.rows });
}

export default function Map() {
  const { rooms } = useLoaderData<typeof loader>();
  const { user } = useOutletContext<any>();

  const handleRoomSelect = (room: any) => {
    console.log("Selected room:", room);
    // You can add reservation modal logic here
  };

  return (
    <div className="app-container">
      <Header user={user} />
      
      <main className="main-content">
        <RoomMap rooms={rooms} userRole={user?.role || 'user'} onRoomSelect={handleRoomSelect} />
      </main>
    </div>
  );
}
