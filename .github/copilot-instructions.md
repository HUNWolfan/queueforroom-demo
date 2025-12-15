# QueueForRoom - Copilot Instructions

## Project Overview
Bilingual (Hungarian/English) school room reservation system built with Remix, featuring an interactive SVG-based top-down map interface for room selection and booking.

## Architecture & Key Patterns

### Tech Stack
- **Framework**: Remix (v2) with Vite
- **Database**: PostgreSQL with direct `pg` pool (no ORM)
- **Auth**: Session-based cookies + bcrypt password hashing
- **i18n**: react-i18next with client-side hydration
- **Map**: Custom SVG canvas rendering (600×400 viewBox with grid background)

### Database Access Pattern
Direct SQL queries via `app/db.server.ts` - **no ORM/Prisma**. Always use parameterized queries:
```typescript
import { query } from '~/db.server';
await query('SELECT * FROM users WHERE email = $1', [email]);
```

### Bilingual Content Strategy
- UI strings: i18next JSON files in `public/locales/{en,hu}/translation.json`
- Database content: Separate columns (`description_en`, `description_hu`)
- Language detection: Client-side from localStorage, fallback to 'en'

### Authentication Flow
1. Login/register via `app/services/auth.server.ts` (bcrypt hashing)
2. Session managed by Remix cookie storage in `app/utils/session.server.ts`
3. Protected routes use `requireUserId()` - throws 302 redirect to `/login?redirectTo=...`
4. User context passed via `useOutletContext<any>()` from `root.tsx` loader

### Map Component Architecture
- **SVG-based** interactive floor plans (`app/components/map/RoomMap.tsx`)
- Room positions stored as DB columns: `position_x`, `position_y`, `width`, `height`, `floor`
- Multi-floor support with floor selector buttons
- Rooms styled by availability state: `is_available` boolean
- Click handlers on SVG `<rect>` elements for room selection

## Development Workflows

### Initial Setup
1. **Database**: Run `npm run db:migrate` then `npm run db:seed`
2. **Environment**: Create `.env` with `DATABASE_URL` and `SESSION_SECRET`
3. **Dev server**: `npm run dev` (Vite dev mode)

### Database Changes
- **Schema**: Edit `app/migrate.ts` with raw SQL (`CREATE TABLE IF NOT EXISTS`)
- **Seed data**: Update `app/seed.ts` with sample users/rooms
- **No migrations framework** - migrations are idempotent scripts run via `node --import tsx -r dotenv/config`

### Adding Routes
Follow Remix file-based routing in `app/routes/`:
- Pages: `pagename.tsx` (default export component + loader/action)
- API endpoints: `api.resourcename.ts` (loader/action only, no UI)
- Use `requireUserId()` in loaders for protected routes
- Profile and Settings pages demonstrate form handling with multiple intents

### Reservation System
- **Create**: Modal form in `RoomMap.tsx` submits to `/api/reservations`
- **Cancel**: Submit with `intent: "cancel"` to reservations action
- **Invite Users**: Modal shows user list, submit with `intent: "invite"`
- **Share Links**: Generate shareable URLs like `/reservations/join/{id}`
- **Conflict Detection**: Backend checks for time overlaps before creating reservations

### Translation Updates
Edit both `public/locales/en/translation.json` and `hu` version:
- Nested structure: `{"section": {"key": "value"}}`
- Access via: `t("section.key")`
- Language switching via `<LanguageSwitcher>` component (updates localStorage + i18n)

## Critical Conventions

### Naming Patterns
- **Database**: `snake_case` columns (e.g., `password_hash`, `first_name`)
- **TypeScript**: `camelCase` interfaces (e.g., `firstName`, `passwordHash`)
- **Components**: PascalCase files/exports
- **Map between DB/TS** in service layer (see `auth.server.ts` User interface)

### File Imports
Use `~` alias for app imports (configured via vite-tsconfig-paths):
```typescript
import { query } from '~/db.server';
import Header from '~/components/layout/Header';
```

### Environment Variables
Required in `.env`:
- `DATABASE_URL`: PostgreSQL connection string
- `SESSION_SECRET`: Cookie signing secret (change in production!)

### Type Safety
- No strict TypeScript interfaces for DB rows - use `any` or inline types
- Loader/action data typed via `useLoaderData<typeof loader>()`
- Form validation currently minimal - opportunity for Zod integration

## Component Patterns

### Layout Structure
```tsx
<div className="app-container">
  <Header user={user} />
  <main className="main-content">
    {/* Page content */}
  </main>
</div>
```

### User Context Flow
```tsx
// root.tsx loader fetches user
export async function loader({ request }: LoaderFunctionArgs) {
  const userId = await getUserId(request);
  let user = userId ? await getUserById(userId) : null;
  return json({ user });
}

// Child routes access via context
const { user } = useOutletContext<any>();
```

### Form Handling
Use Remix Form component with `action` functions:
```tsx
<Form method="post">
  <input type="hidden" name="intent" value="specificAction" />
  {/* inputs */}
</Form>

export async function action({ request }: ActionFunctionArgs) {
  const formData = await request.formData();
  const intent = formData.get("intent");
  
  if (intent === "specificAction") {
    // Handle specific action
  }
  // Process and return json/redirect
}
```

### Multi-Intent Actions
Routes like `/profile` and `/reservations` use intent-based actions:
- Check `formData.get("intent")` to determine action type
- Return consistent `{ success: boolean, message?: string, error?: string }` format
- Use `as any` for actionData to avoid TypeScript errors until proper typing

## Common Pitfalls

⚠️ **Import mismatch**: `bcryptjs` package imported as `bcrypt` (not `bcryptjs`)  
⚠️ **Session timing**: Cookie maxAge is 30 days - adjust for production security  
⚠️ **SQL injection**: Always use parameterized queries (`$1`, `$2`, etc.)  
⚠️ **Translation hydration**: i18next loads async on client - ensure resources loaded before render  
⚠️ **Map coordinates**: SVG viewBox is 600×400 - room positions must fit within bounds  
⚠️ **Reservation conflicts**: Check for time overlaps before creating reservations
⚠️ **TypeScript types**: Use `as any` for dynamic fetcher data until proper typing is established

## UI/UX Design Principles

### Glass Morphism Theme
- Background: Purple gradient (`linear-gradient(135deg, #768ae4ff 0%, #3a2450ff 100%)`)
- Cards: `rgba(255, 255, 255, 0.15)` with `backdrop-filter: blur(20px)`
- Borders: `1px solid rgba(255, 255, 255, 0.2)`
- Shadows: `0 8px 32px rgba(0, 0, 0, 0.1)`
- Hover effects: Slight translation (`translateY(-2px)`) + enhanced shadows

### Theme System
- **CSS Variables**: `--bg-gradient-start`, `--bg-gradient-end`, `--glass-bg`, `--glass-border`, `--text-primary`, `--text-secondary`, `--shadow-color`
- **Dark Mode**: `#110F1B` → `#1a1825` gradient, `rgba(255,255,255,0.05)` glass
- **Light Mode**: `#e0e0e0` → `#f5f5f5` gradient, `rgba(255,255,255,0.7)` glass
- **Theme Switcher**: Component in header with localStorage persistence
- **Data Attribute**: `[data-theme="light"]` or `[data-theme="dark"]` on body

### Profile Menu
- **Solid Background**: `#2a2438` (dark), `#f8f9fa` (light) - no transparency
- **Z-Index Hierarchy**: header (100), header-nav (101), expanding-menu (200), menu-items (250)
- **No Backdrop Blur**: Prevents background bleed-through issues
- **Theme-Aware**: Different colors for light/dark modes

### Interactive Elements
- All buttons and links have smooth transitions (`0.3s ease`)
- Hover states increase opacity/background and add shadows
- Expanding menu appears on hover with scale/opacity animation
- Modal overlays use `backdrop-filter: blur(5px)` for depth

### Guided Tour System
- **Component**: `app/components/tour/TourGuide.tsx`
- **Auto-start**: Appears 1 second after first login (localStorage check)
- **Spotlight Effect**: Pulsing border highlights target elements with `box-shadow` animation
- **Tooltip Positioning**: Smart placement (top/bottom/left/right) with viewport bounds checking
- **Progress Tracking**: Dot indicators show step progress, localStorage saves completion
- **Route-aware**: Different steps for different pages (dashboard vs map)
- **Restart Button**: Fixed position `?` button in bottom-right (z-index: 100)
- **Target Selectors**: Uses CSS selectors (`.logo`, `.expanding-menu`, `rect[data-room]`)
- **Overlay**: Semi-transparent dark overlay (0.7 opacity) with spotlight cutout effect
- **Styling**: Solid background tooltips with theme-aware colors, no transparency issues
