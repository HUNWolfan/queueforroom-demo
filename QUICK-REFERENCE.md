# QueueForRoom - Gyors Referencia Útmutató

## 🚀 Gyors indítás

```bash
# 1. Függőségek telepítése
npm install

# 2. Környezeti változók beállítása (.env fájl)
DATABASE_URL=postgresql://user:password@localhost:5432/queueforroom
SESSION_SECRET=your-secret-key-here
RESEND_API_KEY=re_fVABvx9X_MDSGhXnsLcTL9ektLusjTAaW

# 3. Adatbázis migrációk futtatása
npm run db:migrate

# 4. Adatbázis feltöltése mintaadatokkal
npm run db:seed

# 5. Fejlesztői szerver indítása
npm run dev

# 6. Production build
npm run build

# 7. Production szerver indítása
npm start
```

---

## 📁 Projekt struktúra - Gyors áttekintés

```
app/
├── components/          # React komponensek
│   ├── auth/           # LoginForm, RegisterForm
│   ├── layout/         # Header, Footer, LanguageSwitcher
│   ├── map/            # RoomMap (SVG térkép)
│   └── tour/           # TourGuide (onboarding)
│
├── routes/             # Remix route komponensek
│   ├── _index.tsx      # Dashboard (főoldal)
│   ├── login.tsx       # Bejelentkezés
│   ├── register.tsx    # Regisztráció
│   ├── map.tsx         # Térkép nézet
│   ├── reservations.tsx # Foglalások kezelése
│   ├── profile.tsx     # Felhasználói profil
│   ├── settings.tsx    # Beállítások
│   ├── admin.tsx       # Admin főoldal
│   ├── admin.rooms.tsx # Terem kezelés
│   ├── admin.users.tsx # Felhasználó kezelés
│   └── api/            # API endpointok
│       ├── rooms.ts
│       ├── reservations.ts
│       ├── bug-report.ts
│       └── system-messages.ts
│
├── services/           # Backend szolgáltatások
│   ├── auth.server.ts      # Autentikáció (bcrypt, session)
│   ├── email.server.ts     # Email küldés (Resend)
│   └── security.server.ts  # Brute force védelem
│
├── utils/              # Segédfüggvények
│   └── session.server.ts   # Session kezelés
│
├── styles/             # CSS fájlok
│   └── global.css      # Globális stílusok, téma rendszer
│
├── db.server.ts        # PostgreSQL kapcsolat (pool)
├── migrate.ts          # Adatbázis migrációk
├── seed.ts             # Mintaadatok
└── root.tsx            # Főkomponens (layout, context)

public/
└── locales/            # Fordítások (i18next)
    ├── en/
    │   └── translation.json
    └── hu/
        └── translation.json
```

---

## 🎨 Téma rendszer - Használat

### CSS változók használata komponensekben

```tsx
// Inline style
<div style={{
  background: 'var(--glass-bg)',
  color: 'var(--text-primary)',
  border: '1px solid var(--glass-border)',
  boxShadow: '0 8px 32px var(--shadow-color)',
}}>
  Téma-tudatos tartalom
</div>

// CSS osztályban (global.css)
.my-component {
  background: var(--glass-bg);
  color: var(--text-primary);
  border: 1px solid var(--glass-border);
}
```

### Elérhető változók

| Változó | Leírás | Világos | Sötét |
|---------|--------|----------|-------|
| `--bg-gradient-start` | Háttér gradiens kezdete | `#c5d3e8` | `#110F1B` |
| `--bg-gradient-end` | Háttér gradiens vége | `#b0bfd4` | `#1a1825` |
| `--glass-bg` | Üveg háttér | `rgba(255,255,255,0.85)` | `rgba(255,255,255,0.05)` |
| `--glass-border` | Üveg keret | `rgba(255,255,255,0.3)` | `rgba(255,255,255,0.1)` |
| `--text-primary` | Fő szöveg szín | `#1a202c` | `#ffffff` |
| `--text-secondary` | Másodlagos szöveg | `#4a5568` | `rgba(255,255,255,0.7)` |
| `--shadow-color` | Árnyék szín | `rgba(0,0,0,0.1)` | `rgba(0,0,0,0.3)` |

### Téma váltás

```tsx
// Header komponensben már implementálva
const toggleTheme = () => {
  const newTheme = currentTheme === 'light' ? 'dark' : 'light';
  document.body.setAttribute('data-theme', newTheme);
  localStorage.setItem('theme', newTheme);
};
```

---

## 🌐 Fordítások - i18next használat

### Új fordítás hozzáadása

```json
// public/locales/en/translation.json
{
  "mySection": {
    "title": "My Title",
    "description": "Description text"
  }
}

// public/locales/hu/translation.json
{
  "mySection": {
    "title": "Címem",
    "description": "Leírás szöveg"
  }
}
```

### Használat komponensben

```tsx
import { useTranslation } from 'react-i18next';

function MyComponent() {
  const { t } = useTranslation();
  
  return (
    <div>
      <h1>{t('mySection.title')}</h1>
      <p>{t('mySection.description')}</p>
      
      {/* Fallback érték */}
      <span>{t('missing.key', 'Default text')}</span>
      
      {/* Változók */}
      <p>{t('welcome', { name: 'John' })}</p>
      {/* JSON: "welcome": "Hello, {{name}}!" */}
    </div>
  );
}
```

### Nyelv váltás

```tsx
// LanguageSwitcher komponensben implementálva
const changeLanguage = (lng: string) => {
  i18n.changeLanguage(lng);
  localStorage.setItem('language', lng);
};
```

---

## 🗄️ Adatbázis - Gyors műveletek

### Lekérdezés futtatása

```typescript
import { query } from '~/db.server';

// Egy sor
const result = await query(
  'SELECT * FROM users WHERE email = $1',
  ['user@example.com']
);
const user = result.rows[0];

// Több sor
const rooms = await query('SELECT * FROM rooms WHERE floor = $1', [1]);
const roomList = rooms.rows;

// Insert
await query(
  'INSERT INTO rooms (name, capacity) VALUES ($1, $2)',
  ['Room 101', 30]
);

// Update
await query(
  'UPDATE users SET first_name = $1 WHERE id = $2',
  ['John', userId]
);

// Delete
await query('DELETE FROM reservations WHERE id = $1', [reservationId]);
```

### Tranzakciók

```typescript
const client = await pool.connect();
try {
  await client.query('BEGIN');
  
  await client.query('INSERT INTO ...', [...]);
  await client.query('UPDATE ...', [...]);
  
  await client.query('COMMIT');
} catch (error) {
  await client.query('ROLLBACK');
  throw error;
} finally {
  client.release();
}
```

### Migrációk

```bash
# Új migráció létrehozása
# Szerkesztd: app/migrate.ts

# Futtatás
npm run db:migrate

# Seed futtatása
npm run db:seed
```

---

## 🔐 Autentikáció - Gyakori műveletek

### Felhasználó lekérdezése

```typescript
import { getUserId, requireUserId } from '~/utils/session.server';

// Loader-ben
export async function loader({ request }: LoaderFunctionArgs) {
  // Opcionális user (lehet null)
  const userId = await getUserId(request);
  
  // Kötelező user (redirect ha nincs)
  const userId = await requireUserId(request);
  
  return json({ userId });
}
```

### Session kezelés

```typescript
import { createUserSession, destroySession } from '~/utils/session.server';

// Bejelentkezés
export async function action({ request }: ActionFunctionArgs) {
  const userId = 123;
  return createUserSession(userId, '/dashboard');
}

// Kijelentkezés
export async function action({ request }: ActionFunctionArgs) {
  return destroySession(request);
}
```

### Jelszó hash-elés

```typescript
import bcrypt from 'bcrypt';

// Hash generálás
const passwordHash = await bcrypt.hash(password, 10);

// Ellenőrzés
const isValid = await bcrypt.compare(password, passwordHash);
```

---

## 📧 Email küldés - Resend API

### Email típusok és használatuk

```typescript
import {
  sendVerificationEmail,
  send2FACode,
  sendPasswordResetEmail,
  sendAccountLockoutEmail,
  sendAdminNotificationEmail
} from '~/services/email.server';

// 1. Email verifikáció (regisztráció után)
await sendVerificationEmail(user.email, user.first_name, verificationToken);

// 2. 2FA kód küldés
await send2FACode(user.email, user.first_name, twoFactorCode);

// 3. Jelszó reset link
await sendPasswordResetEmail(user.email, user.first_name, resetToken);

// 4. Fiók zárolás értesítés
await sendAccountLockoutEmail(
  user.email,
  user.first_name,
  unlockToken,
  lockReason
);

// 5. Admin értesítés (új regisztráció)
await sendAdminNotificationEmail(
  adminEmail,
  `Új felhasználó: ${user.email}`
);
```

### Custom email küldés

```typescript
import { resend } from '~/services/email.server';

await resend.emails.send({
  from: 'onboarding@resend.dev',
  to: 'recipient@example.com',
  subject: 'Custom Email',
  html: `
    <div style="font-family: Arial, sans-serif;">
      <h1>Custom Email</h1>
      <p>Email content here...</p>
    </div>
  `,
});
```

---

## 🛡️ Biztonsági funkciók

### Brute force védelem

```typescript
import { 
  recordLoginAttempt,
  checkAccountLockout,
  lockAccount
} from '~/services/security.server';

// Login action-ben
export async function action({ request }: ActionFunctionArgs) {
  const ipAddress = request.headers.get('x-forwarded-for') || 'unknown';
  
  // 1. Zárolás ellenőrzése
  const lockout = await checkAccountLockout(userId);
  if (lockout) {
    return json({ 
      error: `Fiók zárolva. Próbáld újra: ${lockout.locked_until}` 
    });
  }
  
  // 2. Sikertelen kísérlet rögzítése
  if (!passwordValid) {
    await recordLoginAttempt(userId, ipAddress, false);
    
    // 3. Automatikus zárolás (5 sikertelen után)
    const attempts = await getRecentFailedAttempts(userId);
    if (attempts >= 5) {
      const unlockToken = await lockAccount(userId, 'brute_force');
      await sendAccountLockoutEmail(
        user.email, 
        user.first_name, 
        unlockToken,
        'Túl sok sikertelen bejelentkezési kísérlet'
      );
    }
    
    return json({ error: 'Hibás jelszó' });
  }
  
  // 4. Sikeres bejelentkezés rögzítése
  await recordLoginAttempt(userId, ipAddress, true);
  return createUserSession(userId, '/dashboard');
}
```

### Fiók feloldása

```typescript
// unlock-account.$token.tsx route-ban implementálva
export async function loader({ params }: LoaderFunctionArgs) {
  const token = params.token;
  const result = await unlockAccountWithToken(token);
  
  if (result.success) {
    return redirect('/login?unlocked=true');
  }
  
  return json({ error: 'Érvénytelen vagy lejárt token' });
}
```

---

## 📱 Responsive komponens létrehozása

### Template

```tsx
import { useTranslation } from 'react-i18next';

export default function MyComponent() {
  const { t } = useTranslation();
  
  return (
    <>
      <div className="my-component" style={{
        background: 'var(--glass-bg)',
        color: 'var(--text-primary)',
        border: '1px solid var(--glass-border)',
        padding: '2rem',
        borderRadius: '12px',
      }}>
        <h1>{t('myComponent.title')}</h1>
        <p>{t('myComponent.description')}</p>
      </div>
      
      {/* Media queries */}
      <style>{`
        @media (max-width: 768px) {
          .my-component {
            padding: 1.5rem !important;
          }
        }
        
        @media (max-width: 640px) {
          .my-component {
            padding: 1rem !important;
            font-size: 0.875rem;
          }
        }
      `}</style>
    </>
  );
}
```

### Responsive töréspontok

```css
/* Desktop (alapértelmezett) */
.component { padding: 2rem; }

/* Nagy tablet (1024px-1200px) */
@media (max-width: 1200px) {
  .component { padding: 1.75rem; }
}

/* Tablet (768px-1024px) */
@media (max-width: 1024px) {
  .component { padding: 1.5rem; }
}

/* Mobil (640px-767px) */
@media (max-width: 767px) {
  .component {
    padding: 1rem;
    flex-direction: column;
  }
}

/* Kicsi mobil (480px-640px) */
@media (max-width: 640px) {
  .component {
    font-size: 0.875rem;
    padding: 0.75rem;
  }
}

/* Extra kicsi (<480px) */
@media (max-width: 480px) {
  .component {
    padding: 0.5rem;
    font-size: 0.75rem;
  }
}

/* Landscape (mobil fekvő) */
@media (max-height: 600px) and (orientation: landscape) {
  .component {
    max-height: 80vh;
    overflow-y: auto;
  }
}
```

---

## 🧩 Remix Route pattern-ek

### Loader (adatok lekérése)

```tsx
export async function loader({ request, params }: LoaderFunctionArgs) {
  const userId = await requireUserId(request);
  
  // Adatok lekérése
  const data = await query('SELECT * FROM table WHERE id = $1', [params.id]);
  
  // Admin jogosultság ellenőrzés
  const user = await getUserById(userId);
  if (user.role !== 'admin') {
    throw new Response("Forbidden", { status: 403 });
  }
  
  return json({ data: data.rows });
}
```

### Action (form feldolgozás)

```tsx
export async function action({ request }: ActionFunctionArgs) {
  const userId = await requireUserId(request);
  const formData = await request.formData();
  const intent = formData.get("intent");
  
  if (intent === "create") {
    const name = formData.get("name");
    await query('INSERT INTO table (name) VALUES ($1)', [name]);
    return json({ success: true, message: "Létrehozva" });
  }
  
  if (intent === "update") {
    const id = formData.get("id");
    const name = formData.get("name");
    await query('UPDATE table SET name = $1 WHERE id = $2', [name, id]);
    return json({ success: true, message: "Módosítva" });
  }
  
  if (intent === "delete") {
    const id = formData.get("id");
    await query('DELETE FROM table WHERE id = $1', [id]);
    return json({ success: true, message: "Törölve" });
  }
  
  return json({ success: false, error: "Érvénytelen művelet" });
}
```

### Komponens (UI)

```tsx
export default function MyRoute() {
  const { data } = useLoaderData<typeof loader>();
  const actionData = useActionData<typeof action>();
  const { user } = useOutletContext<any>();
  const { t } = useTranslation();
  
  return (
    <div className="app-container">
      <Header user={user} />
      
      <main className="main-content">
        {actionData?.success && (
          <div className="alert-success">{actionData.message}</div>
        )}
        
        {actionData?.error && (
          <div className="alert-error">{actionData.error}</div>
        )}
        
        <Form method="post">
          <input type="hidden" name="intent" value="create" />
          <input type="text" name="name" required />
          <button type="submit">{t('submit')}</button>
        </Form>
      </main>
    </div>
  );
}
```

---

## 🎯 Gyakori hibák és megoldások

### 1. TypeScript import hiba

**Hiba**: `Cannot find module '~/...'`

**Megoldás**:
```bash
# VSCode TypeScript szerver újraindítása
Ctrl+Shift+P → "TypeScript: Restart TS Server"

# Vagy build futtatása
npm run build
```

### 2. Session nem működik

**Hiba**: Felhasználó mindig kijelentkezik

**Megoldás**: Ellenőrizd `.env` fájlt:
```env
SESSION_SECRET=minimum-32-karakter-hosszu-random-string
```

### 3. Email nem érkezik

**Ellenőrzési lista**:
- ✅ Resend API kulcs helyes? (`.env`)
- ✅ FROM_EMAIL domain verified? (Resend dashboard)
- ✅ Free tier limit elérve? (100/nap)
- ✅ Spam mappa?

### 4. Database connection hiba

**Hiba**: `ECONNREFUSED` vagy `Connection timeout`

**Megoldás**:
```bash
# PostgreSQL fut?
# Windows: Services.msc → PostgreSQL

# Connection string helyes?
# .env:
DATABASE_URL=postgresql://postgres:password@localhost:5432/queueforroom

# Tesztelés psql-el:
psql -U postgres -d queueforroom
```

### 5. CSS változók nem működnek

**Probléma**: Stílus nem változik téma váltáskor

**Megoldás**:
```tsx
// Ellenőrizd data-theme attribútumot
console.log(document.body.getAttribute('data-theme'));

// Kézi beállítás
document.body.setAttribute('data-theme', 'dark');

// LocalStorage törlése
localStorage.removeItem('theme');
```

---

## 🚦 Deployment ellenőrzési lista

### Pre-deployment

- [ ] `.env.production` fájl létrehozva
  ```env
  DATABASE_URL=postgresql://prod-host/prod-db
  SESSION_SECRET=long-random-production-secret
  RESEND_API_KEY=re_YourProductionKey
  NODE_ENV=production
  ```

- [ ] Production build sikeres
  ```bash
  npm run build
  # Nincs error vagy warning
  ```

- [ ] Adatbázis migration futtatva production-on
  ```bash
  NODE_ENV=production npm run db:migrate
  ```

- [ ] Resend domain verification
  - [ ] Custom domain hozzáadva (pl. `noreply@yourdomain.com`)
  - [ ] DNS rekordok beállítva (SPF, DKIM, DMARC)

- [ ] SSL certificate (HTTPS)
  - [ ] Let's Encrypt vagy CloudFlare
  - [ ] Auto-renewal beállítva

- [ ] Environment variables production szerveren
  - [ ] DATABASE_URL
  - [ ] SESSION_SECRET (változtatva dev-ről!)
  - [ ] RESEND_API_KEY

### Post-deployment

- [ ] Health check endpoint
  ```typescript
  // app/routes/health.tsx
  export async function loader() {
    // DB check
    await query('SELECT 1');
    return json({ status: 'ok' });
  }
  ```

- [ ] Monitoring setup
  - [ ] Error tracking (Sentry, Rollbar)
  - [ ] Performance monitoring
  - [ ] Email delivery tracking (Resend dashboard)

- [ ] Backup stratégia
  - [ ] Daily database backups
  - [ ] 30 napos retention

- [ ] Rate limiting (opcionális)
  - [ ] Login attempts limit
  - [ ] API rate limiting

---

## 📊 Hasznos parancsok

```bash
# Fejlesztés
npm run dev                # Dev szerver (hot reload)
npm run build             # Production build
npm start                 # Production szerver

# Adatbázis
npm run db:migrate        # Migrációk futtatása
npm run db:seed           # Mintaadatok betöltése
psql -U postgres -d queueforroom  # PostgreSQL kliens

# Típusok ellenőrzése
npx tsc --noEmit          # TypeScript check (no build)

# Dependency audit
npm audit                 # Biztonsági rések
npm outdated              # Elavult csomagok

# Cleanup
rm -rf build/             # Build mappa törlése
rm -rf node_modules/      # Node modules törlése
npm install               # Újratelepítés
```

---

## 🔍 Debug tippek

### Console log Remix loader/action adatokban

```tsx
export async function loader() {
  const data = await fetchData();
  console.log('[LOADER]', data);  // Szerver logban látható
  return json({ data });
}

// Client-side
function Component() {
  const data = useLoaderData<typeof loader>();
  console.log('[CLIENT]', data);  // Browser console-ban
}
```

### Network requests figyelése

```tsx
// Fetch interceptor (debug célra)
const originalFetch = window.fetch;
window.fetch = async (...args) => {
  console.log('Fetch:', args);
  const response = await originalFetch(...args);
  console.log('Response:', response);
  return response;
};
```

### Database query log

```typescript
// db.server.ts-ben
export async function query(text: string, params?: any[]) {
  console.log('SQL:', text);
  console.log('Params:', params);
  const start = Date.now();
  const result = await pool.query(text, params);
  console.log('Duration:', Date.now() - start, 'ms');
  return result;
}
```

---

## 📞 Gyors support

**README**: `README.md` - Projekt áttekintés  
**Setup guide**: `SETUP.md`, `START-HERE.md` - Telepítési útmutató  
**Teljes dokumentáció**: `IMPLEMENTATION-SUMMARY.md` - Részletes leírás  
**Copilot instrukciók**: `.github/copilot-instructions.md` - AI asszisztens szabályok  

**External docs**:
- [Remix](https://remix.run/docs)
- [React i18next](https://react.i18next.com/)
- [Resend](https://resend.com/docs)
- [PostgreSQL](https://www.postgresql.org/docs/)

---

**Utoljára frissítve**: 2025. január  
**Verzió**: 1.0  
**QueueForRoom** - Iskola terem foglalási rendszer
