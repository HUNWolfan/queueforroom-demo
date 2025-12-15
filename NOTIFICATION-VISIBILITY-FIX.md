# Notification Panel Visibility & Z-Index Fix

## Problémák

1. **Notification harang ikon alig látszott** - Átlátszó háttér miatt nehezen észrevehető volt a térképen és beállításoknál
2. **Panel belelógott a user menübe** - Beállítások oldalon a notification panel átfedésben volt a felhasználói menüvel

## Megoldások

### 1. Notification Harang Gomb - Láthatóság Javítás

**Fájl**: `app/components/layout/Header.tsx`

#### Előtte:
```tsx
<button
  style={{
    position: 'relative',
    background: 'none',
    border: 'none',
    cursor: 'pointer',
    fontSize: '1.5rem',
    padding: '0.5rem',
    color: 'var(--text-primary)',
    transition: 'transform 0.2s ease',
  }}
>
  🔔
</button>
```

**Probléma**: 
- Átlátszó háttér (`background: 'none'`)
- Nincs border, nehezen látható
- Nincs box-shadow, nem emelkedik ki

#### Utána:
```tsx
<button
  style={{
    position: 'relative',
    background: 'var(--glass-bg)',
    backdropFilter: 'blur(10px)',
    border: '2px solid var(--glass-border)',
    borderRadius: '12px',
    cursor: 'pointer',
    fontSize: '1.5rem',
    padding: '0.6rem 0.8rem',
    color: 'var(--text-primary)',
    transition: 'all 0.3s ease',
    boxShadow: '0 4px 12px rgba(0, 0, 0, 0.15)',
  }}
  onMouseEnter={(e) => {
    e.currentTarget.style.transform = 'translateY(-2px)';
    e.currentTarget.style.boxShadow = '0 6px 16px rgba(0, 0, 0, 0.25)';
    e.currentTarget.style.borderColor = 'rgba(103, 126, 234, 0.5)';
  }}
  onMouseLeave={(e) => {
    e.currentTarget.style.transform = 'translateY(0)';
    e.currentTarget.style.boxShadow = '0 4px 12px rgba(0, 0, 0, 0.15)';
    e.currentTarget.style.borderColor = 'var(--glass-border)';
  }}
>
  🔔
</button>
```

**Javítások**:
- ✅ Glass morphism háttér (`var(--glass-bg)`)
- ✅ Blur effekt (`backdropFilter: 'blur(10px)'`)
- ✅ 2px vastag border a jobb láthatóságért
- ✅ Lekerekített sarkok (12px)
- ✅ Box-shadow a mélység érzékeltetésére
- ✅ Hover effekt: translateY + fokozott shadow + lila border
- ✅ Nagyobb padding (0.6rem 0.8rem) a jobb kattinthatóságért

---

### 2. Notification Badge - Pozíció Finomítás

#### Előtte:
```tsx
<span style={{
  position: 'absolute',
  top: '0.25rem',
  right: '0.25rem',
  width: '20px',
  height: '20px',
  border: '2px solid var(--bg-gradient-start)',
}}>
```

#### Utána:
```tsx
<span style={{
  position: 'absolute',
  top: '-4px',
  right: '-4px',
  width: '22px',
  height: '22px',
  border: '2px solid var(--bg-gradient-start)',
  boxShadow: '0 2px 8px rgba(239, 68, 68, 0.5)',
}}>
```

**Javítások**:
- ✅ Badge kicsit kilóg a gombból (`top: -4px, right: -4px`) - jobban látszik
- ✅ Nagyobb méret (22px vs 20px)
- ✅ Piros árnyék a badge köré (`boxShadow`)

---

### 3. Z-Index Hierarchia Javítás

**Fájl**: `app/components/layout/NotificationPanel.tsx`

#### Z-Index Struktúra:

| Elem | Régi Z-Index | Új Z-Index | Indoklás |
|------|-------------|------------|----------|
| **Header** | 100 | 100 | Alap header réteg |
| **User Menu (expanding-menu)** | 200 | 200 | Header navigáció része |
| **User Menu Items** | 250 | 250 | Dropdown menü elemek |
| **Notification Backdrop** | ~~998~~ | **150** | Panel mögötti háttér (sötétítés) |
| **Notification Panel** | ~~999~~ | **160** | Notification lista |

#### Előtte:
```tsx
// Backdrop
<div style={{ zIndex: 998 }} />

// Panel
<div style={{ zIndex: 999 }} />
```

**Probléma**: 
- Notification panel (z-index: 999) **magasabb** volt mint a user menu (z-index: 250)
- Beállítások oldalon a panel "átlógott" a user menü dropdown-ra
- User név gombra kattintva a menü a notification panel alatt jelent meg

#### Utána:
```tsx
// Backdrop
<div style={{ zIndex: 150 }} />

// Panel
<div style={{ zIndex: 160 }} />
```

**Javítás**:
- ✅ Notification panel (160) **alacsonyabb** mint a user menu (200-250)
- ✅ User menu mindig előtérben van
- ✅ Nincs átfedés beállítások oldalon
- ✅ Logikus rétegződés: Header (100) < Notification (160) < User Menu (200-250)

---

### 4. Box-Shadow Javítás

#### Előtte:
```tsx
boxShadow: 'var(--shadow-color)',
```

**Probléma**: 
- `var(--shadow-color)` csak egy színt ad meg, nem teljes box-shadow
- Nincs diffúz árnyék a panel körül

#### Utána:
```tsx
boxShadow: '0 12px 48px rgba(0, 0, 0, 0.3)',
```

**Javítás**:
- ✅ Valódi box-shadow értékkel (offset, blur, color)
- ✅ Nagyobb blur (48px) a lágyabb árnyékért
- ✅ Mélyebb mélység érzékeltetése

---

### 5. Mobile Responsive - Finomhangolás

**Fájl**: `app/components/layout/NotificationPanel.tsx`

#### Előtte:
```css
@media (max-width: 480px) {
  .notification-panel {
    width: calc(100vw - 40px) !important;
    right: 20px !important;
    left: 20px !important;  /* Problémás */
  }
}
```

**Probléma**: 
- `left: 20px` kikényszerítette a bal pozíciót
- `right: 20px` + `left: 20px` ellentmondásos
- Panel nem tudott jobbra igazodni

#### Utána:
```css
@media (max-width: 480px) {
  .notification-panel {
    width: calc(100vw - 2rem) !important;
    right: 1rem !important;
    max-width: 380px !important;
  }
}
```

**Javítások**:
- ✅ Eltávolítottam a `left` pozíciót
- ✅ Panel jobbra igazodik (`right: 1rem`)
- ✅ Max-width korlát (380px) tablet méretnél
- ✅ Rem egységek a jobb skálázásért

---

## Vizuális Összehasonlítás

### Harang Gomb

| Aspektus | Előtte | Utána |
|----------|--------|-------|
| **Háttér** | Átlátszó | Glass morphism blur |
| **Border** | Nincs | 2px solid, theme-aware |
| **Shadow** | Nincs | 0 4px 12px rgba(0,0,0,0.15) |
| **Hover** | Csak scale | translateY + shadow + border color |
| **Láthatóság** | ⚠️ Gyenge | ✅ Kiváló |

### Badge

| Aspektus | Előtte | Utána |
|----------|--------|-------|
| **Pozíció** | top/right 0.25rem | top/right -4px (kilóg) |
| **Méret** | 20×20px | 22×22px |
| **Shadow** | Nincs | Piros glow (0 2px 8px) |
| **Láthatóság** | ✅ Jó | ✅ Kiváló |

---

## Z-Index Hierarchia (Teljes Rendszer)

```
┌─────────────────────────────────────┐
│  Tour Guide Overlay (10000-10002)   │  <- Legmagasabb
├─────────────────────────────────────┤
│  Modals (1000)                      │
├─────────────────────────────────────┤
│  User Menu Items (250)              │  <- Dropdown menü elemek
├─────────────────────────────────────┤
│  User Menu Container (200)          │  <- Expanding menu
├─────────────────────────────────────┤
│  Notification Panel (160)           │  <- Fixed panel
├─────────────────────────────────────┤
│  Notification Backdrop (150)        │  <- Háttér overlay
├─────────────────────────────────────┤
│  Header (100)                       │  <- Header sáv
├─────────────────────────────────────┤
│  Content (1-10)                     │  <- Normál tartalom
└─────────────────────────────────────┘
```

**Szabály**: Későbbi interakciós elemek (user menu) > Korábbi segéd elemek (notifications)

---

## Tesztelési Checklist

### Desktop (1920×1080)
- [x] Harang gomb jól látható térképen
- [x] Harang gomb jól látható beállításoknál
- [x] Notification panel megnyitható
- [x] User menu dropdown előtérben van
- [x] Nincs átfedés beállítások oldalon
- [x] Hover effektek működnek

### Tablet (768×1024)
- [ ] Harang gomb látható és kattintható
- [ ] Notification panel nem lóg ki
- [ ] User menu előtérben marad

### Mobile (375×667)
- [ ] Harang gomb látható
- [ ] Panel width: calc(100vw - 2rem)
- [ ] Panel max-width: 380px
- [ ] Jobbra igazítva (right: 1rem)

---

## CSS Variables Használat

A gomb és panel a következő theme-aware változókat használja:

```css
/* Dark Mode (Default) */
--glass-bg: rgba(255, 255, 255, 0.05);
--glass-border: rgba(255, 255, 255, 0.1);
--text-primary: #ffffff;

/* Light Mode */
--glass-bg: rgba(255, 255, 255, 0.85);
--glass-border: rgba(0, 0, 0, 0.2);
--text-primary: #0a0a0a;
```

Ez biztosítja, hogy mindkét témában jól látható legyen a gomb.

---

## Jövőbeli Fejlesztések

1. **Notification Gomb Aktív Állapot**: Amikor a panel nyitva van, a gomb kapjon `background: rgba(103, 126, 234, 0.2)` hátteret
2. **Keyboard Navigation**: Tab-bal navigálható notification panel
3. **Animation Tweaks**: Panel bezárás animáció finomhangolása
4. **Dark/Light Theme Preview**: Notification panel előnézet mindkét témában
5. **Click Outside Detection**: Intelligensebb kívülre kattintás kezelés (ne záródjon be user menu kattintáskor)

---

## Összefoglalás

A javítások **3 fő problémát** oldottak meg:

1. ✅ **Láthatóság**: Harang gomb glass morphism háttérrel, borderrel, shadowval
2. ✅ **Z-Index Konfliktus**: Notification panel (160) < User Menu (200-250)
3. ✅ **Mobile Responsive**: Jobbra igazított panel, max-width korlátozással

**Eredmény**: User-friendly, jól látható, nem ütköző notification rendszer! 🎉
