# Permission System Restructuring - Migration Summary

## Overview
This migration removes the `student` role and restructures the instructor permission system to support standard and privileged instructors.

## Changes Made

### 1. Role System Simplification
**Before:**
- `student` - Required permission requests
- `user` - Required permission requests  
- `instructor` - Could book with permission
- `admin` - Full access

**After:**
- `user` - Must request permission to book rooms
- `instructor` (standard) - Can book freely, cannot override
- `instructor` (privileged) - Can book freely + override standard instructor bookings
- `admin` - Full access

### 2. Database Changes
- All `student` role → `user` role in users table
- All `min_role = 'student'` → `min_role = 'user'` in rooms table
- `instructor_permissions.can_override_reservations` column determines privileged status

### 3. Instructor Permission Logic
**Standard Instructor** (`can_override_reservations = false` or NULL):
- Can create room reservations freely
- Cannot override other users' bookings
- Bookings can be overridden by privileged instructors

**Privileged Instructor** (`can_override_reservations = true`):
- Can create room reservations freely
- Can override standard instructor bookings
- Cannot override other privileged instructors' bookings
- Original booker receives notification when overridden

### 4. Override Flow
When a privileged instructor books a time slot already taken by a standard instructor:
1. System checks if conflicting reservation exists
2. Verifies current user has override permission
3. Checks if conflicting user is standard instructor (no override permission)
4. Cancels conflicting reservation
5. Creates new reservation
6. Sends notification to original booker

### 5. Code Changes

**Files Modified:**
- `app/migrate-remove-student.ts` - New migration script
- `app/routes/api.reservations.ts` - Override logic implementation
- `app/routes/api.reservation-requests.ts` - Student → User role check
- `app/routes/reservations.tsx` - Comment updates
- `app/routes/settings.tsx` - UI role display updates
- `app/components/map/RoomMap.tsx` - Role hierarchy updates
- `app/components/tour/TourGuide.tsx` - Tour steps updated
- `app/seed.ts` - Seed data role updates
- `public/locales/en/translation.json` - English translations
- `public/locales/hu/translation.json` - Hungarian translations

**Files Created:**
- `app/grant-instructor-override.ts` - Helper script to grant override permissions

### 6. Translation Updates
**English (en):**
- `roles.student` → `roles.user`
- `studentPermissionMessage` → Updated to "Regular users need permission..."
- Tour guide references updated

**Hungarian (hu):**
- `roles.student` → `roles.user` ("Felhasználó")
- `studentPermissionMessage` → Updated to "A felhasználóknak..."
- Tour guide references updated

## Migration Steps Executed

1. ✅ Run `app/migrate-remove-student.ts`:
   - Updated 0 student accounts (none existed)
   - Updated 4 room minimum role requirements
   - Reset 0 instructor permissions (none existed)

2. ✅ Updated all TypeScript/TSX files to use new role system

3. ✅ Updated translation files for both EN and HU

4. ✅ Created helper script for granting override permissions

## Usage Instructions

### Grant Override Permission to Instructor
```bash
node --import tsx -r dotenv/config ./app/grant-instructor-override.ts instructor@school.com
```

This will:
- Verify the user is an instructor
- Create or update `instructor_permissions` entry
- Set `can_override_reservations = true`
- Display confirmation with current status

### Remove Override Permission
Manually update the database:
```sql
UPDATE instructor_permissions 
SET can_override_reservations = false 
WHERE user_id = (SELECT id FROM users WHERE email = 'instructor@school.com');
```

## Testing Checklist

- [x] User role can no longer book directly (must request permission)
- [ ] Standard instructor can book freely
- [ ] Privileged instructor can override standard instructor bookings
- [ ] Privileged instructor cannot override other privileged instructors
- [ ] Original booker receives notification when overridden
- [ ] Translation strings display correctly in both languages
- [ ] Tour guide shows correct steps for user role
- [ ] Settings page displays correct role badge
- [ ] Room map respects new role hierarchy

## Notification Types

New notification type added:
- `reservation_overridden` - Sent when a privileged instructor cancels a standard instructor's booking

## Known Limitations

1. Override permission is binary (all or nothing)
2. No audit log for override actions (only notifications)
3. Override only works for instructor→instructor conflicts
4. Admin bookings cannot be overridden by privileged instructors

## Rollback Plan

If needed to rollback:
```sql
-- Restore student role (if backups exist)
UPDATE users SET role = 'student' WHERE id IN (...);
UPDATE rooms SET min_role = 'student' WHERE min_role = 'user';

-- Or run the previous migration system
```

## Next Steps

1. Test override functionality with actual instructor accounts
2. Grant override permissions to specific instructors as needed
3. Monitor notification system for override alerts
4. Consider adding override audit log in future
5. Update admin panel to show instructor override status

---
**Migration Date:** November 3, 2025
**Migration Status:** ✅ Complete
**Tested:** Partially (awaiting instructor account testing)
