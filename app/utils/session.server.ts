import { createCookieSessionStorage } from "@remix-run/node";

const sessionSecret = process.env.SESSION_SECRET || "default-secret-change-in-production";

const { getSession, commitSession, destroySession } = createCookieSessionStorage({
  cookie: {
    name: "queueforroom_session",
    secure: process.env.NODE_ENV === "production",
    secrets: [sessionSecret],
    sameSite: "lax",
    path: "/",
    maxAge: 60 * 60 * 24 * 30, // 30 days
    httpOnly: true,
  },
});

export { getSession, commitSession, destroySession };

export async function createUserSession(userId: number, redirectTo: string) {
  const session = await getSession();
  session.set("userId", userId);
  return {
    headers: {
      "Set-Cookie": await commitSession(session),
    },
    redirect: redirectTo,
  };
}

export async function getUserId(request: Request): Promise<number | null> {
  const session = await getSession(request.headers.get("Cookie"));
  const userId = session.get("userId");
  return userId ? Number(userId) : null;
}

export async function requireUserId(
  request: Request,
  redirectTo: string = new URL(request.url).pathname
): Promise<number> {
  const userId = await getUserId(request);
  if (!userId) {
    const searchParams = new URLSearchParams([["redirectTo", redirectTo]]);
    throw new Response("Unauthorized", {
      status: 302,
      headers: {
        Location: `/login?${searchParams}`,
      },
    });
  }
  return userId;
}

export async function logout(request: Request) {
  const session = await getSession(request.headers.get("Cookie"));
  return {
    headers: {
      "Set-Cookie": await destroySession(session),
    },
    redirect: "/login",
  };
}
