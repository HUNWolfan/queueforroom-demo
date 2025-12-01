# Email Notification System - Complete Implementation

## Overview
All 6 email notification types from the Settings page have been successfully implemented with appropriate email messages in both English and Hungarian.

## ✅ Implemented Email Notifications

### 1. **Reservation Confirmed** (`reservation_confirmed`)
- **Trigger**: When a user creates a new reservation OR when admin approves a reservation request
- **File**: `app/routes/api.reservations.ts` (lines 111-155)
- **File**: `app/routes/admin_.permission-requests.tsx` (lines 115-167)
- **Email Function**: `sendReservationConfirmation()` (already existed in email.server.ts)
- **Email Content**:
  - Subject: "Reservation Confirmed - {Room Name}"
  - Icon: ✅
  - Color: Green gradient
  - Details: Room name, start time, end time, purpose
- **Notification Created**: Yes, stored in database with type `reservation_confirmed`

### 2. **Reservation Cancelled** (`reservation_cancelled`)
- **Trigger**: When a user or admin cancels a reservation
- **File**: `app/routes/reservations.tsx` (lines 95-149)
- **Email Function**: `sendReservationCancelled()` (NEW in email.server.ts)
- **Email Content**:
  - Subject: "Reservation Cancelled - {Room Name}" / "Foglalás törölve - {Terem}"
  - Icon: ❌
  - Color: Red gradient
  - Details: Room name, start time, end time, purpose
  - Footer: "If you have questions, contact your administrator"
- **Notification Created**: Yes, stored in database with type `reservation_cancelled`

### 3. **Reservation Updated** (`reservation_updated`)
- **Trigger**: When a reservation's time or details are modified
- **File**: `app/routes/reservations.tsx` (lines 312-368)
- **Email Function**: `sendReservationUpdated()` (NEW in email.server.ts)
- **Email Content**:
  - Subject: "Reservation Updated - {Room Name}" / "Foglalás módosítva - {Terem}"
  - Icon: 🔄
  - Color: Orange gradient
  - Details: Room name, NEW start time, NEW end time, purpose
  - Footer: "If you didn't make this change, contact your administrator"
- **Notification Created**: Yes, stored in database with type `reservation_updated`

### 4. **Reservation Reminders** (`reservation_reminders`)
- **Trigger**: SCHEDULED (needs cron job implementation - see below)
- **Email Function**: `sendReservationReminder()` (NEW in email.server.ts)
- **Email Content**:
  - Subject: "Reminder - {Room} reservation in {X} minutes"
  - Icon: ⏰
  - Color: Blue gradient
  - Details: Room name, start time, end time, purpose
  - Message: "Your reservation starts in X minutes"
  - Footer: "Have a great session!"
- **Notification Created**: Should be created when cron job runs
- **⚠️ TODO**: Implement scheduled task/cron job to send reminders 15-30 minutes before reservation start time

### 5. **Permission Granted** (`permission_granted`)
- **Trigger**: When admin grants instructor permission (reserve rooms or override reservations)
- **File**: `app/routes/admin_.instructor-permissions.tsx` (lines 74-134)
- **Email Function**: `sendPermissionGranted()` (NEW in email.server.ts)
- **Email Content**:
  - Subject: "New Permission Granted - QueueForRoom"
  - Icon: ✅
  - Color: Green gradient
  - Permission Box: Highlights the specific permission granted
  - Next Steps: Instructions to log in and use new features
- **Notification Created**: Yes, stored in database with type `permission_granted`

### 6. **Permission Rejected** (`permission_rejected`)
- **Trigger**: When admin rejects a reservation request from a student
- **File**: `app/routes/admin_.permission-requests.tsx` (lines 169-208)
- **Email Function**: `sendPermissionRejected()` (NEW in email.server.ts)
- **Email Content**:
  - Subject: "Permission Request Rejected - QueueForRoom"
  - Icon: ❌
  - Color: Red gradient
  - Reason Box: Shows admin's rejection reason
  - Next Steps: Suggests contacting admin for clarification
- **Notification Created**: Yes, stored in database with type `permission_rejected`

---

## 📁 Files Modified

### 1. **app/services/email.server.ts**
**Added 5 new email functions** (lines 1156-1820):
- `sendReservationCancelled()` - Lines 1156-1285
- `sendReservationUpdated()` - Lines 1287-1416
- `sendReservationReminder()` - Lines 1418-1559
- `sendPermissionGranted()` - Lines 1561-1690
- `sendPermissionRejected()` - Lines 1692-1820

**Email Design Features**:
- Bilingual support (EN/HU)
- Glass morphism styling consistent with app theme
- Color-coded headers (red for cancelled/rejected, orange for updated, blue for reminders, green for granted)
- Responsive HTML templates
- Plain text fallback for all emails

### 2. **app/routes/api.reservations.ts**
**Changes**:
- Added import: `sendReservationConfirmation`
- Modified reservation creation to use `RETURNING id`
- Added email notification after successful reservation creation
- Added notification record creation in database
- Lines modified: 1-6 (imports), 111-155 (reservation creation)

### 3. **app/routes/reservations.tsx**
**Changes**:
- Added imports: `sendReservationCancelled`, `sendReservationUpdated`
- Updated "cancel" action handler to send email + create notification (lines 95-149)
- Updated "update" action handler to send email + create notification (lines 312-368)

### 4. **app/routes/admin_.permission-requests.tsx**
**Changes**:
- Added imports: `sendReservationConfirmation`, `sendPermissionRejected`
- Updated "approve" action: Sends confirmation email when creating reservation from approved request (lines 115-167)
- Updated "reject" action: Sends rejection email with reason (lines 169-208)

### 5. **app/routes/admin_.instructor-permissions.tsx**
**Changes**:
- Added import: `sendPermissionGranted`
- Updated "grant" action: Sends permission granted email + creates notification (lines 74-134)
- Works for both "reserve" and "override" permission types

---

## 🔔 Notification Database Integration

All email notifications also create corresponding records in the `notifications` table:

| Email Type | Database Type | Title (HU) | Title (EN) |
|------------|---------------|------------|------------|
| Reservation Confirmed | `reservation_confirmed` | Foglalás megerősítve | Reservation Confirmed |
| Reservation Cancelled | `reservation_cancelled` | Foglalás törölve | Reservation Cancelled |
| Reservation Updated | `reservation_updated` | Foglalás módosítva | Reservation Updated |
| Reservation Reminder | `reservation_reminder` | Foglalás emlékeztető | Reservation Reminder |
| Permission Granted | `permission_granted` | Új jogosultság | New Permission |
| Permission Rejected | `permission_rejected` | Jogosultság elutasítva | Permission Request Rejected |

These notifications appear in the bell icon dropdown in the header with real-time updates.

---

## 🧪 Testing the Emails

### Development Mode (Console Preview)
Since you're using Resend's free tier which only sends to your verified email, the app is configured in development mode:

1. **Environment Variable**: Set `NODE_ENV=development` in your `.env` file
2. **Email Preview**: All emails will be logged to the console instead of being sent
3. **See Full HTML**: The console shows the complete email subject, HTML body, and text version

### Test Each Notification Type:

#### 1. Reservation Confirmed
- **Action**: Create a new reservation as an instructor or admin
- **Expected**: Console shows email preview + notification appears in bell icon

#### 2. Reservation Cancelled
- **Action**: Cancel an existing reservation
- **Expected**: Console shows cancellation email + notification

#### 3. Reservation Updated
- **Action**: Edit a reservation's time or details
- **Expected**: Console shows update email + notification

#### 4. Reservation Reminder
- **Action**: TODO - Needs cron job implementation
- **Manual Test**: Call `sendReservationReminder()` directly in a test script

#### 5. Permission Granted
- **Action**: Go to Admin → Instructor Permissions, grant "Reserve Rooms" or "Override" permission
- **Expected**: Console shows permission granted email + notification

#### 6. Permission Rejected
- **Action**: Go to Admin → Permission Requests, reject a student's request with a reason
- **Expected**: Console shows rejection email + notification

---

## 📝 TODO: Reservation Reminders Implementation

The `sendReservationReminder()` function is ready, but you need to create a scheduled task to trigger it:

### Option 1: Node-Cron (Recommended)
Install `node-cron`:
```bash
npm install node-cron @types/node-cron
```

Create `app/services/reminder-scheduler.server.ts`:
```typescript
import cron from 'node-cron';
import { query } from '~/db.server';
import { sendReservationReminder } from './email.server';

// Run every 5 minutes
cron.schedule('*/5 * * * *', async () => {
  console.log('Checking for upcoming reservations...');
  
  // Find reservations starting in 15-30 minutes
  const now = new Date();
  const in15Min = new Date(now.getTime() + 15 * 60 * 1000);
  const in30Min = new Date(now.getTime() + 30 * 60 * 1000);

  const result = await query(
    `SELECT r.*, u.email, u.first_name, u.last_name, u.preferred_language,
            rm.name as room_name, rm.name_en, rm.name_hu
     FROM reservations r
     JOIN users u ON r.user_id = u.id
     JOIN rooms rm ON r.room_id = rm.id
     WHERE r.status = 'confirmed'
       AND r.start_time >= $1
       AND r.start_time <= $2
       AND NOT EXISTS (
         SELECT 1 FROM notifications n 
         WHERE n.reservation_id = r.id 
         AND n.type = 'reservation_reminder'
       )`,
    [in15Min.toISOString(), in30Min.toISOString()]
  );

  for (const reservation of result.rows) {
    const userName = `${reservation.first_name} ${reservation.last_name}`;
    const language = reservation.preferred_language || 'en';
    const roomName = language === 'hu' && reservation.name_hu ? reservation.name_hu :
                     language === 'en' && reservation.name_en ? reservation.name_en :
                     reservation.room_name;

    try {
      await sendReservationReminder(
        reservation.email,
        userName,
        {
          roomName,
          startTime: new Date(reservation.start_time),
          endTime: new Date(reservation.end_time),
          purpose: reservation.purpose,
        },
        language as 'en' | 'hu'
      );

      // Create notification
      await query(
        `INSERT INTO notifications (user_id, type, title, message, reservation_id)
         VALUES ($1, $2, $3, $4, $5)`,
        [
          reservation.user_id,
          'reservation_reminder',
          language === 'hu' ? 'Foglalás emlékeztető' : 'Reservation Reminder',
          language === 'hu' 
            ? `A foglalásod hamarosan kezdődik: ${roomName}`
            : `Your reservation is starting soon: ${roomName}`,
          reservation.id
        ]
      );

      console.log(`✅ Reminder sent for reservation #${reservation.id}`);
    } catch (error) {
      console.error(`❌ Failed to send reminder for #${reservation.id}:`, error);
    }
  }
});
```

Start the scheduler in `app/entry.server.tsx` or create a separate process.

### Option 2: External Cron Service
Use services like:
- **Vercel Cron** (if deployed on Vercel)
- **GitHub Actions** (scheduled workflows)
- **Render Cron Jobs** (if on Render.com)
- **Railway Cron Jobs**

Create an API endpoint `/api/send-reminders` and have the cron service hit it every 5-10 minutes.

---

## 🎨 Email Design Consistency

All emails follow the same design pattern:
- **Container**: Purple gradient border (matches app theme)
- **Content**: White background with rounded corners
- **Header**: Color-coded gradient with emoji icon
- **Detail Rows**: Flex layout with labels and values
- **Footer**: Gray text with helpful information
- **Responsive**: Works on all screen sizes
- **Accessible**: Includes plain text version

---

## 🌐 Bilingual Support

All email functions support both English and Hungarian:
- **Parameter**: `language: 'en' | 'hu'`
- **Auto-detection**: Uses user's `preferred_language` from database
- **Fallback**: Defaults to English if language not set
- **Date Formatting**: Uses locale-specific formatting (`en-US` or `hu-HU`)

---

## ✨ Summary

**What's Working Now:**
- ✅ Reservation creation sends confirmation email
- ✅ Reservation cancellation sends notification email
- ✅ Reservation update sends notification email
- ✅ Permission granted sends congratulations email
- ✅ Permission rejected sends explanation email
- ✅ All emails appear as in-app notifications too
- ✅ Development mode shows emails in console
- ✅ Bilingual support (EN/HU)
- ✅ No TypeScript errors

**What Needs Implementation:**
- ⏳ Reservation reminders cron job (function is ready, just needs scheduler)

**Next Steps:**
1. Test all email notifications in development mode
2. Verify notifications appear in bell icon
3. Implement cron job for reservation reminders
4. (Optional) Set up Resend domain verification for production emails to all users

---

*All email functions include error handling and won't crash the app if email sending fails - errors are logged to console.*
