# QueueForRoom - Felhasználói Kézikönyv (Magyar)

**Verzió:** 1.0  
**Utolsó frissítés:** 2025. december 1.

---

## Tartalomjegyzék

1. [Bevezetés](#bevezetés)
2. [Regisztráció és Bejelentkezés](#regisztráció-és-bejelentkezés)
3. [Kezdőlap Áttekintés](#kezdőlap-áttekintés)
4. [Teremfoglalás](#teremfoglalás)
5. [Foglalásaim Kezelése](#foglalásaim-kezelése)
6. [Értesítések](#értesítések)
7. [Profil Beállítások](#profil-beállítások)
8. [Nyelv Váltása](#nyelv-váltása)
9. [Gyakori Hibák és Megoldások](#gyakori-hibák-és-megoldások)

---

## Bevezetés

A **QueueForRoom** egy modern, interaktív teremfoglaló rendszer iskolák és oktatási intézmények számára. Az alkalmazás lehetővé teszi:

- 📍 Termek böngészését interaktív térképen
- 📅 Egyszerű foglalási folyamat 15 perces intervallumokkal
- 👥 Társak meghívása foglalásokba
- 🔔 Automatikus értesítések foglalásokról
- 🌐 Kétnyelvű támogatás (Magyar/Angol)

---

## Regisztráció és Bejelentkezés

### Új Felhasználói Fiók Létrehozása

1. **Regisztrációs Oldal Megnyitása**
   - Látogass el a `/register` oldalra
   - Kattints a "Regisztráció" gombra a kezdőlapon

2. **Adatok Megadása**
   - **Email cím**: Érvényes email cím (ezt fogjuk használni a belépéshez)
   - **Vezetéknév**: Teljes vezetéknév
   - **Keresztnév**: Teljes keresztnév
   - **Jelszó**: Minimum 8 karakter, tartalmaznia kell:
     - Legalább 1 nagybetűt (A-Z)
     - Legalább 1 kisbetűt (a-z)
     - Legalább 1 számot (0-9)
     - Legalább 1 speciális karaktert (@, #, $, stb.)
   - **Jelszó megerősítése**: Ugyan az a jelszó még egyszer

3. **Email Megerősítés**
   - A regisztráció után egy megerősítő emailt kapsz
   - Nyisd meg az emailt és kattints a megerősítő linkre
   - A link 24 órán belül lejár
   - Ha nem kaptad meg az emailt, ellenőrizd a spam mappát

4. **Bejelentkezés**
   - Email megerősítés után bejelentkezhetsz
   - Add meg az email címed és jelszavad
   - Kattints a "Bejelentkezés" gombra

### Email Újraküldése

Ha nem kaptad meg a megerősítő emailt:

1. Menj a bejelentkezési oldalra
2. Próbálj meg bejelentkezni (hibaüzenetet fogsz kapni)
3. Kattints az "Email újraküldése" gombra
4. Várj 60 másodpercet a következő próbálkozás előtt

---

## Kezdőlap Áttekintés

A bejelentkezés után a következő elemeket látod:

### Fejléc

- **Logo**: Visszavezet a kezdőlapra
- **Nyelv váltó**: Magyar/Angol közötti váltás
- **Értesítések**: Harang ikon - új értesítések száma
- **Profil menü**: Kattints a nevedre a következő opciókhoz:
  - Profilom
  - Beállítások
  - Kijelentkezés

### Főoldal Kártyák

1. **Aktív Foglalások**: Jelenlegi és közelgő foglalásaid száma
2. **Elérhető Termek**: Jelenleg szabad termek száma
3. **Mai Foglalások**: Ma esedékes foglalások

### Gyors Műveletek

- **Új foglalás létrehozása**: Ugrás a térkép oldalra
- **Foglalásaim megtekintése**: Lista az összes foglalásodról

---

## Teremfoglalás

### Terem Kiválasztása Térképről

1. **Térkép Oldal Megnyitása**
   - Kattints a "Térkép" menüpontra a fejlécben
   - Vagy válaszd az "Új foglalás" gombot a kezdőlapon

2. **Emelet Kiválasztása**
   - Használd az emelet választó gombokat (1. emelet, 2. emelet, stb.)
   - A térkép automatikusan frissül

3. **Terem Információk**
   - **Egérrel való rámutatás**: További részletek jelennek meg
   - **Színkódok**:
     - 🟢 Zöld: Elérhető terem
     - 🔴 Piros: Foglalt terem
     - 🟡 Sárga: Korlátozott hozzáférés (magasabb jogosultság szükséges)

4. **Terem Kiválasztása**
   - Kattints a térképen a kívánt teremre
   - Megjelenik a foglalási űrlap

### Foglalás Létrehozása

1. **Időpont Kiválasztása**
   - **Kezdési idő**: Válassz kezdési időpontot
   - **Befejezési idő**: Válassz befejezési időpontot
   - **Automatikus kerekítés**: Az időpontok automatikusan 15 perces intervallumokra kerekítődnek
   - **Minimum időtartam**: 30 perc (automatikusan javítva, ha rövidebb)
   - **Múltbeli dátumok**: Nem választhatók - automatikusan a jelenlegi időre áll vissza

2. **Részletek Megadása**
   - **Cél**: Írj le egy rövid leírást (pl. "Csapat találkozó", "Tanulás")
   - **Résztvevők száma**: Állítsd be, hány fő vesz részt (max: terem kapacitása)

3. **Foglalás Jóváhagyása**
   - Kattints a "Foglalás" gombra
   - **Hallgatók**: Engedélykérelmet küldenek az adminnak
   - **Oktatók/Adminok**: Azonnali foglalás

4. **Megerősítés**
   - Sikeres foglalás esetén értesítést kapsz
   - Email értesítés kerül kiküldésre

### Speciális Funkciók

#### Felhasználók Meghívása

1. Kattints a "Meghív" gombra a foglalás részleteinél
2. Keresd meg a felhasználókat név vagy email alapján
3. Válaszd ki a meghívandó személyeket
4. Kattints az "Meghív" gombra
5. Az meghívott személyek email értesítést kapnak

#### Megosztható Link Generálása

1. Nyisd meg a foglalás részleteit
2. Kattints a "Link kérése" gombra
3. Másold le a generált linket
4. Oszd meg emailben, chaten, stb.
5. A link bárki számára elérhető - nem szükséges bejelentkezés

---

## Foglalásaim Kezelése

### Foglalások Listázása

1. **Foglalásaim Oldal**
   - Kattints a "Foglalásaim" menüpontra
   - Látod az összes aktív és közelgő foglalásod

2. **Foglalás Részletek**
   - **Terem neve**: Melyik teremről van szó
   - **Időpont**: Kezdés és befejezés
   - **Státusz**: 
     - ⏳ Függőben (engedélykérés)
     - ✅ Megerősítve
     - ❌ Törölve
   - **Résztvevők**: Hányan csatlakoztak

### Foglalás Törlése

1. Kattints a foglalásra a listában
2. Kattints a "Törlés" gombra
3. Erősítsd meg a törlést
4. Az összes résztvevő email értesítést kap

### Foglaláshoz Csatlakozás (Meghívott Linkről)

1. Nyisd meg a megosztott linket
2. Látod a foglalás részleteit
3. Kattints a "Csatlakozás" gombra
4. **Nem regisztrált felhasználók**: Add meg az adataidat
5. Megerősítés után bekerülsz a résztvevők közé

---

## Értesítések

### Értesítési Típusok

1. **Foglalás megerősítve**: Amikor egy admin jóváhagyja a kérelmedet
2. **Foglalás elutasítva**: Amikor egy admin elutasítja a kérelmedet
3. **Meghívás**: Amikor meghívnak egy foglalásba
4. **Foglalás törlése**: Amikor egy foglalás törlődik
5. **Emlékeztető**: 1 órával a foglalás előtt

### Értesítések Kezelése

1. **Értesítések Megtekintése**
   - Kattints a harang ikonra a fejlécben
   - Megjelennek az olvasatlan értesítések

2. **Értesítés Olvasottnak Jelölése**
   - Kattints az értesítésre
   - Automatikusan olvasottnak jelölődik

3. **Összes Értesítés Törlése**
   - Beállítások → Értesítések
   - "Összes olvasottnak jelölése" gomb

---

## Profil Beállítások

### Profil Szerkesztése

1. **Profil Oldal**
   - Kattints a nevedre a fejlécben
   - Válaszd a "Profilom" opciót

2. **Szerkeszthető Mezők**
   - **Vezetéknév**
   - **Keresztnév**
   - **Email cím** (újra kell erősíteni)
   - **Preferált nyelv**

3. **Változtatások Mentése**
   - Kattints a "Mentés" gombra
   - Megerősítő üzenetet kapsz

### Jelszó Módosítása

1. **Beállítások Oldal**
   - Profil menü → Beállítások
   - "Jelszó módosítása" szekció

2. **Adatok Megadása**
   - **Jelenlegi jelszó**: Add meg a jelenlegi jelszavadat
   - **Új jelszó**: Minimum 8 karakter, követelmények ugyan azok mint regisztrációnál
   - **Új jelszó megerősítése**: Írd be újra az új jelszót

3. **Mentés**
   - Kattints a "Jelszó módosítása" gombra
   - Sikeres módosítás után kijelentkeztetés

### Értesítési Beállítások

1. **Email Értesítések**
   - Email értesítések be/ki kapcsolása
   - Típusok:
     - Foglalás megerősítések
     - Meghívások
     - Emlékeztetők

2. **Böngésző Értesítések**
   - Push értesítések engedélyezése
   - Csak támogatott böngészőkben (Chrome, Firefox, Edge)

---

## Nyelv Váltása

### Nyelv Módosítása

1. **Fejléc Nyelv Váltó**
   - Kattints a nyelv ikonra (🌐)
   - Válaszd ki a kívánt nyelvet:
     - 🇭🇺 Magyar
     - 🇬🇧 English

2. **Automatikus Frissítés**
   - Az oldal azonnal frissül az új nyelvvel
   - A beállítás mentődik a böngészőben

3. **Profil Preferencia**
   - A választott nyelv hozzá lesz rendelve a fiókodhoz
   - Következő bejelentkezéskor ez a nyelv fog betöltődni

---

## Gyakori Hibák és Megoldások

### Bejelentkezési Problémák

**"Email cím nem található" hiba**
- ✅ Ellenőrizd az email címet (nagy/kisbetű nem számít)
- ✅ Próbáld meg a regisztrációt újra
- ✅ Ellenőrizd, hogy megerősítetted-e az email címed

**"Helytelen jelszó" hiba**
- ✅ Ellenőrizd a Caps Lock-ot
- ✅ Próbáld meg a "Jelszó visszaállítása" funkciót

**"Kérlek erősítsd meg az email címed" hiba**
- ✅ Nyisd meg az email fiókodat
- ✅ Kattints a megerősítő linkre az emailben
- ✅ Ha nem kaptad meg: "Email újraküldése" gomb

### Foglalási Problémák

**"A terem már foglalt erre az időpontra" hiba**
- ✅ Válassz másik időpontot
- ✅ Próbálj másik termet
- ✅ Ellenőrizd a térképen a szabad termeket

**Nem tudok rövidebb mint 30 perc foglalást létrehozni**
- ✅ Ez a minimum időtartam
- ✅ Az időpontok automatikusan 30 percre javítódnak

**"Nincs jogosultságod ehhez a teremhez" hiba**
- ✅ Ez a terem csak oktatóknak/adminoknak elérhető
- ✅ Kérj engedélyt az adminisztrátortól
- ✅ Válassz másik termet

### Email Értesítések

**Nem kapok email értesítéseket**
- ✅ Ellenőrizd a spam mappát
- ✅ Add hozzá a `onboarding@resend.dev` címet a biztonságos feladók listájához
- ✅ Ellenőrizd a profilodban az email értesítések beállítását

### Térkép Problémák

**A térkép nem töltődik be**
- ✅ Frissítsd az oldalt (F5 vagy Ctrl+R)
- ✅ Töröld a böngésző cache-ét
- ✅ Próbálj másik böngészőt használni

**Nem látok bizonyos termeket**
- ✅ Ellenőrizd az emelet választót
- ✅ Néhány terem korlátozott hozzáférésű lehet

---

## Támogatás és Kapcsolat

Ha további segítségre van szükséged:

- 📧 Email: support@queueforroom.com
- 🌐 Weboldal: https://queueforroom-production.up.railway.app
- 📱 Telefon: +36 XX XXX XXXX

**Válaszidő**: 24-48 óra munkanapokon

---

*Ez a dokumentum a QueueForRoom 1.0 verziójához készült. A funkciók és felületek változhatnak.*
