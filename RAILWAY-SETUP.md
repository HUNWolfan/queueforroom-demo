# Railway Deployment Setup

## Kötelező Environment Variables

A Railway dashboard-on az alábbi environment variable-eket kell beállítanod:

### Database
```
DATABASE_URL=postgresql://neondb_owner:YOUR_DATABASE_PASSWORD@ep-red-meadow-agtf116u-pooler.c-2.eu-central-1.aws.neon.tech/neondb?sslmode=require&channel_binding=require
```

### Session
```
SESSION_SECRET=k5X5n9rDBQ3fqJGwGK61le4Ndj9ecXcm
```

### Environment
```
NODE_ENV=production
```

### Email Configuration (Resend API)
```
RESEND_API_KEY=re_YOUR_RESEND_API_KEY_HERE
FROM_EMAIL=onboarding@resend.dev
SEND_REAL_EMAILS=true
TEST_EMAIL_OVERRIDE=your-email@example.com
```

## Deployment Checklist

1. ✅ **Environment Variables beállítva** - Minden fenti változó a Railway dashboard-on
2. ✅ **Database migráció** - Futtasd a migrációs scriptet:
   ```bash
   npm run db:migrate
   npm run db:seed
   ```
3. ✅ **Build sikeres** - Railway automatikusan buildelni fogja
4. ✅ **Email tesztelés** - Regisztrálj új felhasználót, ellenőrizd az emailt

## Troubleshooting

### Nem küld emailt
- Ellenőrizd a Railway Logs-ban, hogy megjelennek-e az email küldési logok
- Nézd meg, hogy `SEND_REAL_EMAILS=true`
- Ellenőrizd, hogy `RESEND_API_KEY` helyesen van beállítva
- Resend Dashboard: https://resend.com/emails - Nézd meg, hogy megjelenik-e az email

### Nem tudok bejelentkezni
- Ellenőrizd a database connection-t
- Futtasd újra a seed scriptet, hogy létrejöjjenek a teszt felhasználók
- Ellenőrizd a `SESSION_SECRET` változót

### Demo teszt felhasználók
```
Admin: admin@test.com / Admin123!
Instructor: instructor@test.com / Instructor123!
Student: student@test.com / Student123!
```

## Railway Commands

### View Logs
```bash
railway logs
```

### Run migrations
```bash
railway run npm run db:migrate
railway run npm run db:seed
```

### Connect to database
```bash
railway run psql $DATABASE_URL
```

## Production URL
A Railway automatikusan generál egy URL-t a deployment után.
Használd ezt az URL-t az email verification linkekhez.
