# QueueForRoom - Változásnapló (Changelog)

Minden fontos változást ebben a fájlban dokumentálunk.  
A formátum követi a [Keep a Changelog](https://keepachangelog.com/) szabványt.

---

## [1.0.0] - 2025-01-XX - PRODUCTION READY 🎉

### ✅ Added (Hozzáadva)

#### Email szolgáltatás (Resend API)
- **Resend API integráció** teljes mértékben konfigurálva
  - API kulcs: `re_fVABvx9X_MDSGhXnsLcTL9ektLusjTAaW`
  - Limit: 3,000 email/hó, 100 email/nap (free tier)
  - FROM_EMAIL: `onboarding@resend.dev`
- **5 email típus** implementálva:
  1. Email verifikáció (regisztráció után)
  2. 2FA kódok
  3. Jelszó visszaállítás
  4. Fiók zárolás értesítés (unlock tokennel)
  5. Admin értesítések (új regisztrációk)

#### Hibajelentés rendszer
- **Bug report modal** Footer komponensben
  - Téma-tudatos dizájn (világos/sötét mód)
  - Responsive (mobil → desktop)
  - Form mezők: cím, leírás, súlyosság (low/medium/high/critical)
  - API endpoint: `POST /api/bug-report`
  - Adatbázis tábla: `bug_reports` (id, user_id, title, description, severity, status, created_at)
- **Billentyűzet navigáció**: ESC bezárás, Enter submit, Tab mezők között
- **Animációk**: fadeIn (0.2s), slideUp (0.3s), hover effektek

#### Téma rendszer fejlesztések
- **CSS változók** következetes használata minden komponensben
  - `--glass-bg`, `--glass-border`, `--text-primary`, `--text-secondary`, `--shadow-color`
- **Select elemek téma támogatása**:
  ```css
  [data-theme="dark"] select option { background: #1a1825; }
  [data-theme="light"] select option { background: #ffffff; }
  ```
- **Footer komponens** teljes refactoring (403 sor)
  - Hardcoded rgba() színek → CSS változók
  - Responsive media queries hozzáadva
  - Form state management useState-tel

#### Responsive dizájn validáció
- **Teljes körű ellenőrzés** minden komponensen:
  - Desktop: 1200px+ (teljes layout)
  - Tablet: 768px-1024px (2-oszlopos grid)
  - Mobil: 640px-767px (1-oszlopos stack)
  - Kicsi mobil: <480px (kompakt UI)
  - Landscape mode: max-height 600px (scrollozható modalok)
- **Viewport meta tag** megerősítve `app/root.tsx` 38. sor
- **SVG térkép** responsive (viewBox="0 0 600 400", width: 100%, height: auto)
- **Modal rendszer** adaptív (max-width: 600px, width: 90%)
- **Auth formok** responsive padding (2rem → 1.5rem → 1rem)

#### Fordítások
- **Új kulcsok** angol és magyar nyelven:
  - `footer.bugReportDescription`: Hibajelentés leírás
  - `footer.reportSubmitted`: Sikeres beküldés visszajelzés

#### Dokumentáció
- **IMPLEMENTATION-SUMMARY.md**: Teljes implementációs összefoglaló
  - Architektúra leírás
  - Fájl módosítások részletezése
  - Téma rendszer dokumentáció
  - Responsive töréspontok
  - Deployment checklist
- **QUICK-REFERENCE.md**: Gyors referencia útmutató
  - Gyakori műveletek (DB query, email, auth)
  - Code snippets
  - Hibakeresési tippek
  - Debug parancsok
- **CHANGELOG.md**: Ez a fájl - verziókövetés

### 🔧 Changed (Módosítva)

#### Footer komponens (app/components/layout/Footer.tsx)
- **Teljes újraírás** 403 sorra
- **Hardcoded színek eltávolítva**: rgba() → var(--css-variable)
- **State management hozzáadva**: useState formData kezeléshez
- **Responsive design**: Media queries mobil/tablet nézethez
- **Bug report modal**: Inline styles téma változókkal
- **Form inputs**: Focus state (#667eea border), backdrop blur
- **Action buttons**: flexWrap: wrap (mobil törés)

#### CSS stílusok (app/styles/global.css)
- **Select option theming** hozzáadva (1262-1280. sor):
  - Alapértelmezett: #764ba2 lila háttér
  - Világos téma: #ffffff fehér háttér
  - Sötét téma: #1a1825 sötét háttér
- **Meglévő responsive töréspontok** validálva:
  - 687-704. sor: Tablet header/nav
  - 732-762. sor: Modal content theming
  - 2527-2582. sor: Nagy tablet (1024px)
  - 2583-2780. sor: Mobil (767px)
  - 2826-2870. sor: Extra kicsi (480px)
  - 2874-2894. sor: Landscape mode

#### Environment (.env)
- **Resend API kulcs** frissítve:
  - Placeholder → `re_fVABvx9X_MDSGhXnsLcTL9ektLusjTAaW`
  - Production ready email szolgáltatás

#### Fordítás fájlok
- **public/locales/en/translation.json**: 2 új kulcs
- **public/locales/hu/translation.json**: 2 új kulcs (magyar)

### ✅ Fixed (Javítva)

- **TypeScript cache warning** admin.rooms.tsx-re: Build futtatással megoldva
- **Select option styling** dark mode-ban: CSS szabály hozzáadva
- **Footer responsive** mobil nézetben: Media query optimalizáció
- **Modal overflow** landscape módban: max-height: 90vh, overflowY: auto

### 🔒 Security (Biztonság) - Előző session

#### Brute force védelem
- **5 sikertelen bejelentkezés** → 10 perces fiók zárolás
- **IP cím alapú nyomon követés**: login_attempts tábla
- **Automatikus email értesítés**: unlock token egyszer használatos
- **Token lejárat**: 1 óra
- **Adatbázis táblák**:
  - `login_attempts`: id, user_id, ip_address, attempted_at, successful
  - `account_lockouts`: id, user_id, locked_at, unlock_token, token_expires_at, unlock_reason

#### Jelszó biztonsági fejlesztések
- **Erős jelszó validáció**:
  - Minimum 8 karakter
  - Kis- és nagybetű keverése
  - Számok kötelezőek
  - Speciális karakterek ajánlottak
- **Password visibility toggle**: "Szem" ikon minden jelszó mezőnél
  - Login form
  - Register form
  - Password reset form
- **Real-time strength feedback**: Regisztrációnál és reset-nél

#### Email biztonsági funkciók
- **Account lockout emails**: Unlock link tokennel
- **Password reset**: Biztonságos token-based reset
- **Email verification**: Regisztráció után kötelező
- **2FA kódok**: Bejelentkezéskor opcionális

#### Jogi dokumentumok
- **Footer linkek**:
  - Felhasználási feltételek
  - Adatvédelmi irányelvek
  - Elfogadható használat
  - (Modális ablakok később implementálhatók)

### 📁 Files Created (Létrehozott fájlok)

```
IMPLEMENTATION-SUMMARY.md   # Teljes implementációs dokumentáció
QUICK-REFERENCE.md          # Gyors referencia útmutató
CHANGELOG.md                # Ez a fájl - változásnapló
```

### 📝 Files Modified (Módosított fájlok - jelenlegi session)

```
.env                                   # Resend API kulcs (7. sor)
app/components/layout/Footer.tsx       # 403 sor - teljes refactor
app/styles/global.css                  # Select theming (1262-1280. sor)
public/locales/en/translation.json     # 2 új kulcs (194, 206. sor)
public/locales/hu/translation.json     # 2 új kulcs (194, 206. sor)
```

### 🧪 Tested (Tesztelve)

- ✅ **Production build**: `npm run build` - sikeres, 0 hiba
- ✅ **TypeScript compilation**: Nincs type error
- ✅ **Responsive breakpoints**: Minden töréspont működik
  - 1200px, 1024px, 768px, 767px, 640px, 480px, landscape
- ✅ **Téma váltás**: Világos/sötét mód transitions
- ✅ **CSS változók**: Minden komponens adaptálódik
- ✅ **Modal rendszer**: Overlay, blur, responsive width
- ✅ **SVG térkép**: viewBox skálázás mobilon
- ✅ **Select elements**: Dark/light theme options

### 📦 Dependencies (Függőségek - nincs változás)

```json
{
  "dependencies": {
    "@remix-run/node": "^2.13.1",
    "@remix-run/react": "^2.13.1",
    "@remix-run/serve": "^2.13.1",
    "bcrypt": "^5.1.1",
    "i18next": "^24.2.1",
    "pg": "^8.13.1",
    "react": "^18.3.1",
    "react-dom": "^18.3.1",
    "react-i18next": "^15.2.0",
    "resend": "^4.0.1"
  },
  "devDependencies": {
    "@remix-run/dev": "^2.13.1",
    "@types/bcrypt": "^5.0.2",
    "@types/node": "^22.10.2",
    "@types/pg": "^8.11.10",
    "@types/react": "^18.3.18",
    "@types/react-dom": "^18.3.5",
    "dotenv": "^16.4.7",
    "tsx": "^4.19.2",
    "typescript": "^5.7.2",
    "vite": "^5.4.21"
  }
}
```

---

## [0.9.0] - 2025-01-XX - Security & Email Implementation (Előző session)

### ✅ Added

#### Biztonsági rendszer
- **Brute force protection**
  - `app/services/security.server.ts` (238 sor)
  - Login attempts tracking
  - Automatic account lockout (5 failed attempts)
  - 10 perces zárolási idő
  - IP address logging

#### Email szolgáltatás alapok
- **Email.server.ts** szolgáltatás létrehozva
- **Email függvények**:
  - sendVerificationEmail()
  - send2FACode()
  - sendPasswordResetEmail()
  - sendAccountLockoutEmail()
  - sendAdminNotificationEmail()

#### Auth fejlesztések
- **Password visibility toggles**
  - Login form
  - Register form
  - Password reset form
- **Strong password validation**
  - Minimum 8 karakter
  - Mixed case
  - Számok
  - Speciális karakterek

#### Adatbázis
- **login_attempts tábla**
- **account_lockouts tábla**

#### Routes
- **unlock-account.$token.tsx**: Fiók feloldása tokennel
- **Enhanced password reset**: Erős jelszó validációval

---

## [0.8.0] - 2025-01-XX - UI/UX Enhancements (Korábbi session)

### ✅ Added

#### Téma rendszer
- **Glass morphism design**
  - CSS változók (--glass-bg, --glass-border, stb.)
  - Világos/sötét/alapértelmezett témák
  - LocalStorage perzisztencia
- **LanguageSwitcher komponens**
  - Header-ben integráció
  - i18next language switching

#### Tour Guide rendszer
- **TourGuide komponens** (`app/components/tour/TourGuide.tsx`)
  - Auto-start első bejelentkezéskor
  - Spotlight effekt
  - Smart tooltip positioning
  - Route-aware steps
  - Progress tracking
  - Restart button

#### Layout komponensek
- **Header komponens**
  - Expanding menu
  - Profile dropdown
  - Z-index hierarchia (100-250)
  - Solid background (no transparency issues)
- **Footer komponens** (alapvető verzió)
  - Copyright
  - Links
  - Language info

---

## [0.7.0] - 2025-01-XX - Core Features (Korábbi session)

### ✅ Added

#### Foglalási rendszer
- **RoomMap komponens** (SVG-based interactive map)
  - Multi-floor support
  - Room availability states
  - Click handlers for room selection
  - Tooltips on hover
- **Reservation CRUD**
  - Create reservation modal
  - Cancel reservation
  - Invite users
  - Share links (`/reservations/join/{id}`)
  - Conflict detection

#### Admin funkciók
- **admin.rooms.tsx**: Terem kezelés
- **admin.users.tsx**: Felhasználó kezelés
- **Role-based access control**
  - user, superuser, admin szerepkörök
  - min_role rooms táblában

#### Felhasználói funkciók
- **Profile page** (`/profile`)
  - Name update
  - Email update
  - Password change
- **Settings page** (`/settings`)
  - Language preference
  - Theme preference
  - Notification settings

---

## [0.6.0] - 2025-01-XX - Authentication System (Korábbi session)

### ✅ Added

#### Auth rendszer
- **Session-based authentication**
  - Cookie storage
  - bcrypt password hashing
  - `app/utils/session.server.ts`
  - `app/services/auth.server.ts`
- **Auth routes**:
  - `/login` - Bejelentkezés
  - `/register` - Regisztráció
  - `/logout` - Kijelentkezés
  - `/forgot-password` - Jelszó reset kérés
  - `/reset-password.$token` - Jelszó reset
  - `/verify-email.$token` - Email verifikáció
  - `/resend-verification` - Verifikáció újraküldése

#### Auth komponensek
- **LoginForm**: Email/password bejelentkezés
- **RegisterForm**: Új felhasználó regisztráció
  - First name, last name
  - Email, password, confirm password
  - Terms acceptance checkbox

---

## [0.5.0] - 2025-01-XX - Database & Backend (Korábbi session)

### ✅ Added

#### Adatbázis
- **PostgreSQL integráció** (`pg` pool)
  - `app/db.server.ts`: Connection pool
  - Parameterized queries (SQL injection védelem)
- **Migration system** (`app/migrate.ts`)
  - Idempotent SQL scripts
  - `npm run db:migrate`
- **Seed data** (`app/seed.ts`)
  - Sample users
  - Sample rooms (multi-floor)
  - `npm run db:seed`

#### Adatbázis táblák
```sql
users (12 oszlop)
- id, email, password_hash, first_name, last_name
- role, two_factor_enabled, two_factor_secret
- email_verified, verification_token, created_at, updated_at

rooms (14 oszlop)
- id, name, capacity, description_en, description_hu
- floor, position_x, position_y, width, height
- is_available, room_type, min_role, created_at

reservations (8 oszlop)
- id, room_id, user_id, start_time, end_time
- title, description, created_at

user_reservations (3 oszlop)
- reservation_id, user_id, joined_at
```

---

## [0.4.0] - 2025-01-XX - i18n System (Korábbi session)

### ✅ Added

#### Nemzetköziesítés
- **react-i18next integráció**
  - Client-side hydration
  - Language detection (localStorage)
  - Fallback to 'en'
- **Fordítás fájlok**:
  - `public/locales/en/translation.json`
  - `public/locales/hu/translation.json`
- **Billentyű struktúra**:
  - Nested JSON
  - Section-based organization
  - Használat: `t("section.key")`

#### Database content strategy
- **Külön oszlopok**: `description_en`, `description_hu`
- **Backend nyelv választás**: Query paraméterre alapozva

---

## [0.3.0] - 2025-01-XX - Remix Setup (Korábbi session)

### ✅ Added

#### Remix konfiguráció
- **Vite build system**
  - `vite.config.ts`
  - Hot module replacement
  - Fast refresh
- **File-based routing** (`app/routes/`)
  - Index route (`_index.tsx`)
  - Nested routes
  - API routes (`api.*.ts`)
- **Root layout** (`app/root.tsx`)
  - Meta tags
  - Links
  - Scripts
  - Outlet for child routes

#### TypeScript
- **tsconfig.json**
  - Path alias: `~` → `./app`
  - vite-tsconfig-paths plugin
  - Strict mode (később)

---

## [0.2.0] - 2025-01-XX - Project Structure (Korábbi session)

### ✅ Added

#### Projekt inicializálás
- **package.json**
  - Remix dependencies
  - React 18
  - TypeScript
  - Development tools
- **Folder structure**:
  ```
  app/
    components/
    routes/
    services/
    utils/
    styles/
  public/
    locales/
  ```
- **Setup scripts**:
  - `setup.ps1` (PowerShell)
  - `setup.bat` (Windows batch)
  - `SETUP.md`, `START-HERE.md`

---

## [0.1.0] - 2025-01-XX - Initial Commit (Korábbi session)

### ✅ Added

- **README.md**: Projekt leírás
- **Git repository** inicializálva
- **.gitignore**:
  - node_modules/
  - build/
  - .env
  - *.log
- **Basic documentation**:
  - Project goals
  - Tech stack
  - Architecture overview

---

## Tervezett funkciók (Roadmap)

### [1.1.0] - Future Release

- [ ] **Admin dashboard bővítés**
  - Bug report kezelő felület
  - Email log viewer
  - Security incident dashboard
- [ ] **Real-time notifications**
  - WebSocket integráció
  - In-app notification center
  - Push notifications
- [ ] **Calendar sync**
  - Google Calendar
  - Microsoft Outlook
- [ ] **Performance optimizáció**
  - Code splitting
  - Image optimization
  - Lazy loading

### [1.2.0] - Future Release

- [ ] **Accessibility (WCAG 2.1 AA)**
  - ARIA labels
  - Keyboard navigation
  - Screen reader support
  - Focus management
- [ ] **PWA funkciók**
  - Service worker
  - Offline mode
  - Install prompt
- [ ] **Advanced booking**
  - Recurring reservations
  - Conflict resolution wizard
  - Auto-reminders (1 hour before)

### [2.0.0] - Major Release (Long-term)

- [ ] **3D floor plans** (Three.js)
- [ ] **Multi-building support**
- [ ] **Mobile app** (React Native)
- [ ] **Advanced analytics**
  - Usage statistics
  - Popular rooms
  - Peak times
- [ ] **Integration ecosystem**
  - Slack
  - Microsoft Teams
  - Zapier webhooks

---

## Megjegyzések

**Versioning**: [Semantic Versioning 2.0.0](https://semver.org/)  
- **MAJOR**: API törő változások
- **MINOR**: Új funkciók (backward compatible)
- **PATCH**: Bug fixes (backward compatible)

**Changelog format**: [Keep a Changelog 1.1.0](https://keepachangelog.com/)
- **Added**: Új funkciók
- **Changed**: Meglévő funkciók módosítása
- **Deprecated**: Hamarosan elavuló funkciók
- **Removed**: Eltávolított funkciók
- **Fixed**: Hibajavítások
- **Security**: Biztonsági javítások

---

**Utoljára frissítve**: 2025. január  
**Aktuális verzió**: 1.0.0 - PRODUCTION READY ✅  
**QueueForRoom** - Bilingual Room Reservation System
