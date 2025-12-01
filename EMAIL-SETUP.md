# 📧 Email Konfiguráció - QueueForRoom

## ⚠️ FONTOS - Resend Ingyenes Korlátok

### Jelenlegi Helyzet
- **API Kulcs**: ✅ Beállítva és működik (`re_fVABvx9X...`)
- **Regisztrált email**: `your-email@example.com`
- **Probléma**: Ingyenes fiók csak a regisztrált email címedre tud küldeni

### 🔴 Resend Ingyenes Tier Korlátozások

**Mit TUDSZ csinálni:**
- ✅ Email küldés a saját regisztrált címedre: `your-email@example.com`
- ✅ 100 email/nap (3,000/hónap)
- ✅ Tesztelés és fejlesztés

**Mit NEM TUDSZ csinálni:**
- ❌ Email küldés más címekre (pl. `HUNGTX2222@gmail.com`)
- ❌ Email küldés felhasználóknak domain verifikáció nélkül

### A Resend hibaüzenete:
```
validation_error: You can only send testing emails to your own email address 
(your-email@example.com). To send emails to other recipients, please verify 
a domain at resend.com/domains, and change the 'from' address to an email 
using this domain.
```

---

## ✅ Megoldások

### 1️⃣ FEJLESZTŐI MÓD (JELENLEG AKTÍV) ✅

Az alkalmazás most **development mode**-ban fut, ami azt jelenti:
- ✅ Minden email **konzolban** jelenik meg
- ✅ Nem próbál valódi emailt küldeni (kivéve ha `NODE_ENV=production`)
- ✅ Látod az email tartalmát és címzetteket a terminálban
- ✅ Nincs domain verifikációs probléma

**Használat:**
```bash
# .env fájlban:
NODE_ENV=development

# Indítsd el a dev szervert:
npm run dev

# Amikor admint adsz hozzá, nézd a terminál kimenetét:
# Látni fogod az email preview-t a konzolban!
```

**Példa konzol kimenet:**
```
━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
📧 EMAIL PREVIEW (Development Mode)
━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
To: HUNGTX2222@gmail.com
Subject: Your account has been created
From: QueueForRoom <onboarding@resend.dev>
━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
Content Preview:
Hello Admin,
An administrator has created an account for you.
Email: HUNGTX2222@gmail.com
Temporary Password: xyz123
━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
```

---

### 2️⃣ DOMAIN VERIFIKÁCIÓ (PRODUCTION)

Ha **valódi emaileket** akarsz küldeni más címekre:

#### Lépések:

1. **Domain vásárlás/használat**
   - Vegyél egy domaint (pl. `queueforroom.hu`) vagy használj egy meglévőt
   - Ár: ~3000-5000 Ft/év (.hu domain)
   - Ajánlott szolgáltatók: Namecheap, Google Domains, Cloudflare

2. **Resend Domain Hozzáadás**
   ```
   🌐 https://resend.com/domains
   
   1. Kattints "Add Domain"
   2. Add meg: queueforroom.hu
   3. Másold ki a DNS rekordokat
   ```

3. **DNS Beállítások**
   A domain szolgáltatód DNS beállításaiban add hozzá:
   ```
   TXT record:
   resend._domainkey.queueforroom.hu = [Resend által generált érték]
   
   MX records (opcionális, csak ha email fogadás kell):
   queueforroom.hu. MX 10 feedback-smtp.resend.com.
   ```

4. **Verifikáció Ellenőrzés**
   - Menj vissza: https://resend.com/domains
   - Kattints "Verify" - max 48 óra
   - Ha sikeres: ✅ Verified

5. **Frissítsd a `.env` fájlt**
   ```env
   FROM_EMAIL=noreply@queueforroom.hu
   NODE_ENV=production
   ```

**Költség:**
- Domain: ~3000-5000 Ft/év
- Resend ingyenes tier: 0 Ft (100 email/nap, 3000/hónap)

---

### 3️⃣ ALTERNATÍV EMAIL SZOLGÁLTATÁSOK

Ha nem akarsz domaint vásárolni, használhatsz más szolgáltatást:

#### A) **Gmail SMTP** (INGYENES, DE KORLÁTOZOTT)
```typescript
// Telepítés:
npm install nodemailer

// .env:
SMTP_HOST=smtp.gmail.com
SMTP_PORT=587
SMTP_USER=your-email@gmail.com
SMTP_PASS=your-app-password  // 2FA-val generált app jelszó
```

**Korlátok:**
- ❌ Max 500 email/nap
- ❌ Lehet spam folderbe kerül
- ❌ Gmail fiók kell 2FA-val

#### B) **SendGrid** (INGYENES 100/NAP)
```
🌐 https://sendgrid.com/

Ingyenes tier:
- 100 email/nap INGYEN
- Nincs domain verifikáció korlát a free tier-ben
- Könnyebb setup mint Resend
```

#### C) **Mailgun** (INGYENES 1000/HÓNAP)
```
🌐 https://www.mailgun.com/

Ingyenes tier:
- 1000 email/hónap ingyen
- Domain verifikáció szükséges (hasonló mint Resend)
```

---

## 🧪 Tesztelés

### Email Preview Console-ban

Amikor admin hozzáad egy felhasználót:

1. **Futtasd a dev szervert:**
   ```bash
   npm run dev
   ```

2. **Menj az Admin → Users oldalra**
   - Adj hozzá egy új felhasználót
   - Email: bármilyen cím (pl. `test@example.com`)

3. **Nézd a terminál kimenetét:**
   ```
   📧 EMAIL PREVIEW (Development Mode)
   To: test@example.com
   Subject: Your account has been created
   ...email tartalom...
   ```

### Valódi Email Küldés Tesztelése

Ha már van verified domain-ed:

```bash
# .env
NODE_ENV=production
FROM_EMAIL=noreply@queueforroom.hu

# Teszt email küldés:
node --import tsx -r dotenv/config test-email.ts
```

---

## 📊 Email Szolgáltatások Összehasonlítása

| Szolgáltatás | Ingyenes Limit | Domain Kell? | Setup Nehézség |
|--------------|---------------|--------------|----------------|
| **Resend** (jelenlegi) | 3000/hó, 100/nap | ✅ Igen | ⭐⭐⭐ |
| **SendGrid** | 100/nap | ❌ Nem | ⭐⭐ |
| **Mailgun** | 1000/hó | ✅ Igen | ⭐⭐⭐ |
| **Gmail SMTP** | 500/nap | ❌ Nem | ⭐⭐⭐⭐ |

---

## 🎯 Ajánlás

### Fejlesztéshez (MOST):
✅ **Használd a Development Mode-ot**
- Konzolban látod az emaileket
- Nincs domain probléma
- Gyors és egyszerű

### Production-höz (KÉSŐBB):
🏆 **Opció 1: Resend + Domain** (Ajánlott)
- Professzionális
- Jó dokumentáció
- Modern API
- **Költség: ~4000 Ft/év (csak domain)**

🥈 **Opció 2: SendGrid**
- Nincs domain követelmény free tier-ben
- Könnyebb setup
- Jó alternatíva

---

## 📝 Jelenlegi Setup

```env
# .env fájl (JELENLEG)
NODE_ENV=development  # Email preview konzolban
RESEND_API_KEY=re_YOUR_RESEND_API_KEY_HERE
FROM_EMAIL=onboarding@resend.dev
```

**Státusz:**
- ✅ API kulcs működik
- ✅ Email preview konzolban látható
- ✅ Fejlesztéshez tökéletes
- ⚠️ Production-höz domain verifikáció kell

---

## 🆘 Hibaelhárítás

### "validation_error: verify a domain" hiba
**OK:** Ingyenes Resend fiók korlátozás  
**Megoldás:** Development mode használata VAGY domain verifikáció

### Email nem látszik a konzolban
**Ellenőrizd:**
```bash
# .env fájlban:
NODE_ENV=development

# Restart dev server:
npm run dev
```

### Email spamelve van
**Production esetén:**
- SPF, DKIM, DMARC rekordok beállítása
- Saját domain használata
- Warm-up (fokozatos email mennyiség növelés)

---

## 📞 Support

- Resend dokumentáció: https://resend.com/docs
- Resend domains: https://resend.com/domains
- DNS records help: https://resend.com/docs/dashboard/domains/introduction

---

**Utolsó frissítés:** 2025-11-03  
**Verzió:** 1.0  
**Státusz:** Development Mode Aktív ✅
