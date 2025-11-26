import {
  Links,
  Meta,
  Outlet,
  Scripts,
  ScrollRestoration,
  useLoaderData,
} from "@remix-run/react";
import { json, type LoaderFunctionArgs } from "@remix-run/node";
import { useTranslation } from "react-i18next";
import { getUserId } from "~/utils/session.server";
import { getUserById } from "~/services/auth.server";
import styles from "~/styles/global.css?url";
import TourGuide from "~/components/tour/TourGuide";
import Footer from "~/components/layout/Footer";
import SystemBanner from "~/components/layout/SystemBanner";

export const links = () => [
  { rel: "stylesheet", href: styles },
];

export async function loader({ request }: LoaderFunctionArgs) {
  const userId = await getUserId(request);
  let user = null;

  if (userId) {
    user = await getUserById(userId);
  }

  return json({ user });
}

export function Layout({ children }: { children: React.ReactNode }) {
  return (
    <html lang="hu">
      <head>
        <meta charSet="utf-8" />
        <meta name="viewport" content="width=device-width, initial-scale=1, maximum-scale=1, user-scalable=no" />
        <link rel="icon" href="data:image/svg+xml,<svg xmlns=%22http://www.w3.org/2000/svg%22 viewBox=%220 0 100 100%22><text y=%22.9em%22 font-size=%2290%22>🏫</text></svg>" />
        <Meta />
        <script dangerouslySetInnerHTML={{ 
          __html: `
            // Apply theme and language from localStorage IMMEDIATELY to prevent flash
            (function() {
              try {
                const theme = localStorage.getItem('theme');
                if (theme && theme !== 'auto') {
                  document.documentElement.setAttribute('data-theme', theme);
                }
                const lang = localStorage.getItem('i18nextLng') || 'hu';
                document.documentElement.setAttribute('lang', lang);
              } catch (e) {}
            })();
          `
        }} />
        <Links />
        <style dangerouslySetInnerHTML={{
          __html: `
            /* Critical CSS to prevent layout shift */
            html, body { 
              margin: 0; 
              padding: 0;
              min-height: 100vh;
              background: linear-gradient(135deg, var(--bg-gradient-start, #768ae4ff) 0%, var(--bg-gradient-end, #3a2450ff) 100%);
              font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', sans-serif;
              opacity: 1 !important;
              visibility: visible !important;
            }
            [data-theme="light"] body {
              background: linear-gradient(135deg, #c5d3e8 0%, #b0bfd4 100%);
            }
            /* Prevent i18next flash */
            [data-i18n] { opacity: 0; transition: opacity 0.1s; }
            [data-i18n].i18n-loaded { opacity: 1; }
          `
        }} />
      </head>
      <body>
        {children}
        <ScrollRestoration />
        <Scripts />
      </body>
    </html>
  );
}

export default function App() {
  const { user } = useLoaderData<typeof loader>();

  return (
    <>
      <SystemBanner />
      <Outlet context={{ user }} />
      {user && <TourGuide userRole={user.role} />}
      <Footer />
    </>
  );
}
