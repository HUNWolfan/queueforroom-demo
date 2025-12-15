import type { LoaderFunctionArgs } from "@remix-run/node";
import { json } from "@remix-run/node";
import { query } from "~/db.server";
import { requireUserId } from "~/utils/session.server";

export async function loader({ request }: LoaderFunctionArgs) {
  await requireUserId(request);
  
  const result = await query(`
    SELECT id, name, name_en, name_hu, capacity, description_en, description_hu, 
           floor, position_x, position_y, width, height, is_available
    FROM rooms
    WHERE is_available = true
    ORDER BY floor, name
  `);

  return json({ rooms: result.rows });
}
