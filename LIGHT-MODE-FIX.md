# Light Mode Visibility Fix - NotificationPanel

## Problem
Notifications were not visible in light mode because the component used hard-coded `rgba(255,255,255,X)` colors designed for dark mode. These white colors became invisible against the light background.

## Solution
Replaced all hard-coded colors with theme-aware CSS variables from `global.css` that automatically adapt based on the `[data-theme]` attribute.

## Changes Made

### File: `app/components/layout/NotificationPanel.tsx`

#### 1. Header Title
- **Before**: `<h3 style={{ margin: 0, fontSize: '1.125rem', fontWeight: '600' }}>`
- **After**: `<h3 style={{ margin: 0, fontSize: '1.125rem', fontWeight: '600', color: 'var(--text-primary)' }}>`

#### 2. Header Border
- **Before**: `borderBottom: '1px solid rgba(255,255,255,0.1)'`
- **After**: `borderBottom: '1px solid var(--glass-border)'`

#### 3. Loading Text
- **Before**: `color: 'rgba(255,255,255,0.5)'`
- **After**: `color: 'var(--text-secondary)'`

#### 4. Empty State Text
- **Before**: `color: 'rgba(255,255,255,0.5)'`
- **After**: `color: 'var(--text-secondary)'`

#### 5. Notification Item - Read State Background
- **Before**: `background: 'rgba(255,255,255,0.05)'`
- **After**: `background: 'var(--glass-bg)'`

#### 6. Notification Item - Read State Border
- **Before**: `border: '1px solid rgba(255,255,255,0.1)'`
- **After**: `border: '1px solid var(--glass-border)'`

#### 7. Notification Item - Title Text
- **Before**: No explicit color (inherited)
- **After**: `color: 'var(--text-primary)'`

#### 8. Notification Item - Message Text
- **Before**: `color: 'rgba(255,255,255,0.8)'`
- **After**: `color: 'var(--text-secondary)'`

#### 9. Notification Item - Room Name
- **Before**: `color: 'rgba(255,255,255,0.6)'`
- **After**: `color: 'var(--text-secondary)'`

#### 10. Notification Item - Timestamp
- **Before**: `color: 'rgba(255,255,255,0.5)'`
- **After**: `color: 'var(--text-secondary)'`

#### 11. Delete Button - Default State
- **Before**: 
  ```jsx
  background: 'rgba(255,255,255,0.1)',
  border: 'none',
  color: 'rgba(255,255,255,0.7)',
  ```
- **After**:
  ```jsx
  background: 'var(--glass-bg)',
  border: '1px solid var(--glass-border)',
  color: 'var(--text-primary)',
  ```

#### 12. Delete Button - Hover Leave State
- **Before**:
  ```jsx
  e.currentTarget.style.background = 'rgba(255,255,255,0.1)';
  e.currentTarget.style.color = 'rgba(255,255,255,0.7)';
  ```
- **After**:
  ```jsx
  e.currentTarget.style.background = 'var(--glass-bg)';
  e.currentTarget.style.color = 'var(--text-primary)';
  ```

#### 13. Hover Shadow
- **Before**: `boxShadow: '0 4px 12px rgba(0, 0, 0, 0.15)'`
- **After**: `boxShadow: '0 4px 12px var(--shadow-color)'`

## CSS Variables Used

From `app/styles/global.css`:

### Dark Mode (default)
```css
:root, [data-theme="dark"] {
  --glass-bg: rgba(255, 255, 255, 0.05);
  --glass-border: rgba(255, 255, 255, 0.1);
  --text-primary: #ffffff;
  --text-secondary: rgba(255, 255, 255, 0.7);
  --shadow-color: rgba(0, 0, 0, 0.3);
}
```

### Light Mode
```css
[data-theme="light"] {
  --glass-bg: rgba(255, 255, 255, 0.85);
  --glass-border: rgba(0, 0, 0, 0.2);
  --text-primary: #0a0a0a;
  --text-secondary: #2d3748;
  --shadow-color: rgba(0, 0, 0, 0.15);
}
```

## Elements That Remain Theme-Independent

The following elements use fixed colors because they serve as accent/brand colors:

1. **Unread notification background**: `rgba(103, 126, 234, 0.15)` (purple tint)
2. **Unread notification border**: `rgba(103, 126, 234, 0.3)` (purple border)
3. **Unread indicator dot**: `#667eea` (solid purple)
4. **"Mark all as read" button**: `rgba(103, 126, 234, 1)` (brand purple)
5. **Delete button hover**: `rgba(239, 68, 68, 0.3)` (red danger state)

These colors work in both themes as they provide visual emphasis and semantic meaning.

## Testing

### Dark Mode
- ✅ White text is visible against dark background
- ✅ Glass morphism effect with subtle white borders
- ✅ Unread notifications have purple tint
- ✅ Delete button has subtle white background

### Light Mode
- ✅ Dark text is visible against light background
- ✅ Glass morphism effect with dark borders
- ✅ Unread notifications have purple tint (works on light too)
- ✅ Delete button has solid white background with dark border

## Impact

This fix ensures that:
1. All text is readable in both light and dark themes
2. Borders and backgrounds adapt to the current theme
3. The glass morphism design language is preserved
4. Brand colors (purple, red) remain consistent across themes
5. No hard-coded colors that assume a specific background

## Related Files

- `app/components/layout/NotificationPanel.tsx` - Fixed component
- `app/styles/global.css` - Theme variable definitions
- `app/components/layout/Header.tsx` - Parent component (uses theme switcher)
