import type { ActionFunctionArgs } from "@remix-run/node";
import { redirect } from "@remix-run/node";
import { logout } from "~/utils/session.server";

export async function action({ request }: ActionFunctionArgs) {
  return redirect("/login", await logout(request));
}

export async function loader() {
  return redirect("/");
}
