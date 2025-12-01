# QueueForRoom - Adminisztratív Kézikönyv (Magyar)

**Verzió:** 1.0  
**Utolsó frissítés:** 2025. december 1.

---

## Tartalomjegyzék

1. [Bevezetés](#bevezetés)
2. [Admin Szerepkör és Jogosultságok](#admin-szerepkör-és-jogosultságok)
3. [Felhasználók Kezelése](#felhasználók-kezelése)
4. [Engedélykérelmek Kezelése](#engedélykérelmek-kezelése)
5. [Termek Adminisztráció](#termek-adminisztráció)
6. [Foglalások Felügyelete](#foglalások-felügyelete)
7. [Rendszerbeállítások](#rendszerbeállítások)
8. [Értesítések és Kommunikáció](#értesítések-és-kommunikáció)
9. [Jelentések és Statisztikák](#jelentések-és-statisztikák)
10. [Hibajelentések Kezelése](#hibajelentések-kezelése)
11. [Biztonsági Beállítások](#biztonsági-beállítások)
12. [Technikai Útmutató](#technikai-útmutató)

---

## Bevezetés

A **QueueForRoom Adminisztratív Kézikönyv** segít az iskolai teremfoglaló rendszer teljes körű adminisztrálásában. Ez a dokumentum az adminisztrátorok és oktatók számára készült.

### Admin Funkciók Áttekintése

- 👥 Felhasználói fiókok és szerepkörök kezelése
- ✅ Engedélykérelmek jóváhagyása/elutasítása
- 🏫 Termek és erőforrások adminisztrációja
- 📊 Foglalási statisztikák és riportok
- 🔧 Rendszerbeállítások módosítása
- 🔒 Biztonsági és jogosultsági beállítások

---

## Admin Szerepkör és Jogosultságok

### Szerepkör Hierarchia

1. **Admin** (Legmagasabb szint)
   - Teljes hozzáférés minden funkcióhoz
   - Felhasználói szerepkörök módosítása
   - Rendszerbeállítások kezelése
   - Termek létrehozása, módosítása, törlése
   - Minden engedélykérelem feldolgozása

2. **Instructor** (Oktató)
   - Azonnali teremfoglalás (engedély nélkül)
   - Korlátozott termekhez hozzáférés
   - Saját foglalások teljes körű kezelése
   - Nem látja más felhasználók foglalásait (csak sajátját)

3. **Student** (Hallgató)
   - Engedélykérelem küldése foglaláshoz
   - Csak jóváhagyott foglalások
   - Korlátozott termek nem elérhetők
   - Meghívható foglalásokba

### Admin Jogosultságok

- ✅ **Felhasználók**: Létrehozás, szerkesztés, törlés, szerepkör módosítás
- ✅ **Termek**: Teljes CRUD (Create, Read, Update, Delete) műveletek
- ✅ **Foglalások**: Minden foglalás megtekintése, módosítása, törlése
- ✅ **Engedélykérelmek**: Jóváhagyás, elutasítás, megjegyzések
- ✅ **Beállítások**: Minimális/maximális foglalási idő, rendszerszintű paraméterek
- ✅ **Jelentések**: Statisztikák exportálása, használati riportok

---

## Felhasználók Kezelése

### Felhasználói Lista Megtekintése

1. **Admin Panel → Felhasználók**
   - Látod az összes regisztrált felhasználót
   - Kereshetsz név, email vagy szerepkör alapján
   - Szűrhetsz státusz szerint (aktív, letiltott, email nem megerősített)

2. **Felhasználói Információk**
   - **Név**: Teljes név
   - **Email**: Email cím és megerősítési státusz
   - **Szerepkör**: student, instructor, admin
   - **Regisztráció dátuma**: Mikor csatlakozott
   - **Utolsó bejelentkezés**: Aktivitás követés

### Felhasználó Létrehozása (Manuális)

1. **Admin Panel → Felhasználók → Új felhasználó**
2. **Add meg az adatokat**:
   - Email cím
   - Vezetéknév, Keresztnév
   - Szerepkör kiválasztása
   - Ideiglenes jelszó generálása (opcionális)
3. **Email értesítés**
   - Automatikus üdvözlő email
   - Jelszó visszaállítási link

### Szerepkör Módosítása

1. **Felhasználó kiválasztása** a listából
2. **Szerkesztés** gomb
3. **Szerepkör megváltoztatása**:
   - `student` → `instructor`: Oktató jogosultságok
   - `instructor` → `admin`: Teljes admin hozzáférés
   - `admin` → `instructor`: Admin jogok visszavonása
4. **Mentés** és email értesítés

### Felhasználó Törlése

1. **Figyelem**: Törlés előtt gondold át
   - Minden foglalása törlődik
   - Meghívások is megszűnnek
   - Nem visszavonható művelet

2. **Törlési folyamat**:
   - Kattints a "Törlés" gombra
   - Erősítsd meg a törlést
   - Adatbázisból végleges eltávolítás

### Felhasználó Letiltása (Ajánlott)

1. **Ideiglenes hozzáférés megvonása**
   - Felhasználó szerkesztése
   - "Aktív" státusz kikapcsolása
   - Nem tud bejelentkezni, de adatai megmaradnak

2. **Újraaktiválás**
   - Ugyanúgy vissza lehet állítani

---

## Engedélykérelmek Kezelése

### Engedélykérelem Áttekintés

1. **Admin Panel → Engedélykérelmek**
   - Látod az összes függőben lévő kérelmet
   - **Státuszok**:
     - ⏳ Pending (Függőben)
     - ✅ Approved (Jóváhagyva)
     - ❌ Rejected (Elutasítva)
     - ⚫ Cancelled (Törölt)

2. **Kérelem Részletek**
   - Kérelmező neve
   - Terem és időpont
   - Cél/indoklás
   - Résztvevők száma
   - Kérelem dátuma

### Kérelem Jóváhagyása

1. **Kérelem kiválasztása**
2. **Ellenőrzés**:
   - Időpont ütközés (automatikusan jelzi a rendszer)
   - Terem kapacitás
   - Jogosultság a teremhez
3. **Jóváhagyás** gomb
4. **Opcionális megjegyzés** hozzáadása
5. **Megerősítés**
   - Kérelmező email értesítést kap
   - Foglalás automatikusan létrejön

### Kérelem Elutasítása

1. **Kérelem kiválasztása**
2. **Elutasítás** gomb
3. **Indoklás megadása** (kötelező):
   - Rövid magyarázat az elutasításról
   - Ez megjelenik az email értesítésben
4. **Megerősítés**
   - Kérelmező értesítést kap
   - Kérelem "Rejected" státuszra vált

### Tömeges Jóváhagyás

1. **Több kérelem kiválasztása**
   - Checkbox-okkal jelöld be
2. **"Kiválasztottak jóváhagyása"** gomb
3. **Megerősítés**
   - Minden kiválasztott kérelem jóváhagyásra kerül

---

## Termek Adminisztráció

### Termek Listázása

1. **Admin Panel → Termek**
   - Összes terem megjelenítése
   - **Információk**:
     - Terem név (magyar/angol)
     - Kapacitás
     - Emelet
     - Típus (labor, előadó, stb.)
     - Elérhetőség

### Új Terem Létrehozása

1. **Admin Panel → Termek → Új terem**
2. **Alapadatok**:
   - **Név (HU)**: Magyar név
   - **Név (EN)**: Angol név
   - **Kapacitás**: Maximum résztvevők száma
   - **Emelet**: Melyik emeleten található
   - **Típus**: standard, lab, auditorium, meeting
3. **Leírás**:
   - **Leírás (HU)**: Magyar nyelven
   - **Leírás (EN)**: Angol nyelven
   - Felszereltség, speciális jellemzők
4. **Térkép Pozíció**:
   - **X pozíció**: Vízszintes (0-600)
   - **Y pozíció**: Függőleges (0-400)
   - **Szélesség**: Terem szélessége a térképen
   - **Magasság**: Terem magassága a térképen
5. **Jogosultságok**:
   - **Minimális szerepkör**: student, instructor, admin
   - Csak ezen szint feletti felhasználók foglalhatják
6. **Elérhetőség**:
   - **Elérhető**: Igen/Nem
   - Letiltott termek nem foglalhatók

### Terem Szerkesztése

1. **Terem kiválasztása** a listából
2. **Szerkesztés** gomb
3. **Módosítható mezők**: Minden adat
4. **Mentés**
   - Aktív foglalások nem változnak
   - Új foglalások az új beállításokat használják

### Terem Törlése

1. **Figyelem**: Csak üres termet törölj
   - Ellenőrizd, hogy nincs-e aktív foglalás
2. **Törlés** gomb → Megerősítés
3. **Soft delete**: Terem elrejtése helyett ajánlott a "nem elérhető" státusz

---

## Foglalások Felügyelete

### Összes Foglalás Megtekintése

1. **Admin Panel → Foglalások**
   - Minden felhasználó foglalásai
   - **Szűrők**:
     - Dátum tartomány
     - Terem
     - Felhasználó
     - Státusz

2. **Foglalás Részletek**
   - Foglaló neve
   - Terem
   - Időpont (kezdés - befejezés)
   - Résztvevők száma és lista
   - Cél
   - Létrehozás dátuma

### Foglalás Módosítása

1. **Foglalás kiválasztása**
2. **Szerkesztés** gomb
3. **Módosítható adatok**:
   - Időpont
   - Terem
   - Résztvevők
4. **Mentés**
   - Minden résztvevő email értesítést kap a változásról

### Foglalás Törlése (Admin által)

1. **Foglalás kiválasztása**
2. **Törlés** gomb
3. **Indoklás** (opcionális):
   - Miért törli az admin a foglalást
4. **Megerősítés**
   - Email értesítés minden résztvevőnek
   - Foglalás "cancelled" státuszra vált

### Ütközések Feloldása

1. **Ütköző foglalások észlelése**
   - Rendszer automatikusan jelzi
   - Admin panel → Ütközések
2. **Feloldási módszerek**:
   - Egyik foglalás időpontjának módosítása
   - Egyik foglalás törlése
   - Másik terem ajánlása

---

## Rendszerbeállítások

### Foglalási Beállítások

1. **Admin Panel → Beállítások → Foglalás**
2. **Minimum foglalási idő**:
   - Alapértelmezett: 30 perc
   - 15-120 perc között állítható
3. **Maximum foglalási idő**:
   - Alapértelmezett: 120 perc (2 óra)
   - Maximum: 480 perc (8 óra)
4. **Időintervallum**:
   - Fix 15 perces lépésköz
   - Nem módosítható

### Email Beállítások

1. **Email Service**: Resend API
2. **Feladó cím**: `onboarding@resend.dev`
3. **Email típusok**:
   - Üdvözlő email (regisztráció)
   - Email megerősítés
   - Foglalás megerősítés
   - Foglalás törlés
   - Meghívás
   - Emlékeztető (1 órával előtte)

### Rendszer Üzenetek

1. **Admin Panel → Beállítások → Üzenetek**
2. **Rendszerszintű értesítések**:
   - Karbantartás üzenet
   - Fontos közlemények
   - Időszakos tájékoztatók
3. **Megjelenítés**:
   - Banner minden felhasználónak
   - Csak be bejelentkezés után

---

## Értesítések és Kommunikáció

### Email Értesítések Típusai

1. **Foglalás Értesítések**:
   - Új foglalás létrehozva
   - Foglalás megerősítve (engedélykérelem után)
   - Foglalás törölve
   - Foglalás módosítva
   - Emlékeztető (1 óra előtt)

2. **Felhasználói Értesítések**:
   - Regisztráció megerősítése
   - Jelszó visszaállítás
   - Szerepkör módosítás
   - Fiók letiltás/újraaktiválás

3. **Admin Értesítések**:
   - Új engedélykérelem
   - Ütköző foglalások
   - Rendszer hibák
   - Biztonsági események

### Email Sablonok Szerkesztése

1. **Admin Panel → Beállítások → Email Sablonok**
2. **Elérhető sablonok**:
   - `welcome.tsx`: Üdvözlő email
   - `verification.tsx`: Email megerősítés
   - `reservation-confirmed.tsx`: Foglalás megerősítés
   - `reservation-cancelled.tsx`: Foglalás törlés
3. **Változók használata**:
   - `{{userName}}`: Felhasználó neve
   - `{{roomName}}`: Terem neve
   - `{{startTime}}`: Kezdési idő
   - `{{endTime}}`: Befejezési idő

---

## Jelentések és Statisztikák

### Használati Statisztikák

1. **Admin Panel → Jelentések → Statisztikák**
2. **Elérhető riportok**:
   - **Foglalások száma**: Napi/heti/havi bontásban
   - **Legnépszerűbb termek**: Leggyakrabban foglalt termek
   - **Felhasználói aktivitás**: Ki mennyit foglal
   - **Csúcsidők**: Mikor a legfoglaltabb

### Export Funkciók

1. **Adatok exportálása**:
   - CSV formátum
   - Excel kompatibilis
   - JSON adatstruktúra

2. **Exportálható adatok**:
   - Foglalások listája
   - Felhasználói adatok
   - Statisztikai összesítők

### Napi Összesítő

1. **Automatikus email jelentés**:
   - Minden nap reggel 8:00-kor
   - Előző napi foglalások száma
   - Függőben lévő engedélykérelmek
   - Rendszer állapot

---

## Hibajelentések Kezelése

### Bug Report Kezelés

1. **Admin Panel → Hibajelentések**
2. **Beküldött jelentések**:
   - Felhasználó neve
   - Hiba leírása
   - Súlyosság: low, medium, high, critical
   - Státusz: open, in_progress, resolved, closed
   - Dátum

3. **Jelentés Feldolgozása**:
   - Kattints a jelentésre
   - Állapot módosítása
   - Megjegyzés hozzáadása
   - Felhasználó értesítése (opcionális)

### Súlyossági Szintek

- **Low**: Kisebb vizuális hibák
- **Medium**: Funkcionalitás korlátozott, de működik
- **High**: Fontos funkció nem működik
- **Critical**: Rendszer nem használható

---

## Biztonsági Beállítások

### Jelszó Szabályok

1. **Minimum követelmények**:
   - 8 karakter
   - 1 nagybetű
   - 1 kisbetű
   - 1 szám
   - 1 speciális karakter

2. **Jelszó Lejárat**:
   - Alapértelmezett: Nincs lejárat
   - Beállítható: 30, 60, 90 nap

### Brute Force Védelem

1. **Bejelentkezési Kísérletek**:
   - 5 sikertelen próbálkozás után: 15 perces zárolás
   - 10 próbálkozás: 1 órás zárolás
   - 15 próbálkozás: 24 órás zárolás

2. **IP Blokkolás**:
   - Gyanús IP címek automatikus blokkolása
   - Admin feloldhatja

### 2FA (Kétfaktoros Hitelesítés)

1. **Felhasználói szinten**:
   - Opcionális bekapcsolás
   - Google Authenticator, Authy kompatibilis
   - Email-alapú 2FA

2. **Admin szinten**:
   - Ajánlott kötelezővé tenni adminoknak

---

## Technikai Útmutató

### Adatbázis Karbantartás

1. **Rendszeres Mentések**:
   - Automatikus napi mentés
   - Railway által kezelve
   - Manuális mentés: `railway run npm run db:backup`

2. **Migrációk Futtatása**:
   ```bash
   railway run npm run db:migrate
   ```

3. **Adatbázis Ellenőrzés**:
   ```bash
   railway run npm run db:check
   ```

### Környezeti Változók

1. **Kritikus változók**:
   - `DATABASE_URL`: PostgreSQL kapcsolati string
   - `SESSION_SECRET`: Cookie titkosítási kulcs
   - `RESEND_API_KEY`: Email API kulcs
   - `SEND_REAL_EMAILS`: true/false
   - `FROM_EMAIL`: Feladó email cím

2. **Változók beállítása Railway-en**:
   ```bash
   railway variables --set VARIABLE_NAME=value
   ```

### Naplók és Hibakeresés

1. **Log Megtekintése**:
   ```bash
   railway logs
   ```

2. **Hibakeresés**:
   - Fejlesztői konzol (F12 a böngészőben)
   - Hálózati kérések (Network tab)
   - Konzol hibák (Console tab)

### Teljesítmény Optimalizálás

1. **Cache Törlése**:
   - Rendszeres böngésző cache törlés ajánlott
   - Service Worker újraindítása

2. **Adatbázis Indexek**:
   - Automatikusan kezelve
   - Nagyobb terhelésnél ellenőrizd a query időket

---

## Gyakori Admin Feladatok

### Új Félév Indítása

1. **Régi foglalások archiválása**
   - Admin Panel → Foglalások → Archívum
   - Előző félév foglalásai

2. **Felhasználók ellenőrzése**
   - Inaktív fiókok törlése/letiltása
   - Szerepkörök frissítése (végzettek)

3. **Termek frissítése**
   - Elérhetőség ellenőrzése
   - Kapacitások módosítása

### Karbantartási Időszak

1. **Értesítés a felhasználóknak**
   - Rendszerüzenet beállítása
   - Email kiküldése (opcionális)

2. **Karbantartási mód**:
   - Nem elérhető foglalás létrehozása
   - Csak adminok látják a rendszert

3. **Frissítések alkalmazása**:
   ```bash
   git pull
   npm install
   railway up
   ```

---

## Támogatás és Kapcsolat

Admin segítségért:

- 📧 Email: admin@queueforroom.com
- 🔧 Technikai támogatás: tech-support@queueforroom.com
- 📱 Hotline: +36 XX XXX XXXX

**Válaszidő**: 4-8 óra munkanapokon

---

*Ez a dokumentum a QueueForRoom 1.0 adminisztratív verziójához készült. A funkciók változhatnak.*
