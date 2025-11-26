import { json } from "@remix-run/node";

interface SystemMessage {
  id: string;
  message: string;
  type: "info" | "warning" | "success";
  active: boolean;
}

export async function loader() {
  // TODO: Ez később egy adatbázisból jön majd
  // Jelenleg hardcoded üzenetek demonstrációhoz
  
  const messages: SystemMessage[] = [
    // {
    //   id: "1",
    //   message: "🚀 Új funkció: Email megerősítés most már elérhető!",
    //   type: "success",
    //   active: true
    // },
    // {
    //   id: "2", 
    //   message: "🔧 Rendszerkarbantartás: Holnap 2:00-4:00 között",
    //   type: "warning",
    //   active: true
    // }
  ];

  return json({ messages: messages.filter(m => m.active) });
}
