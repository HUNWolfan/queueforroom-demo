# QueueForRoom - Administrative Manual (English)

**Version:** 1.0  
**Last Updated:** December 1, 2025

---

## Table of Contents

1. [Introduction](#introduction)
2. [Admin Role and Permissions](#admin-role-and-permissions)
3. [User Management](#user-management)
4. [Permission Requests Management](#permission-requests-management)
5. [Room Administration](#room-administration)
6. [Reservation Oversight](#reservation-oversight)
7. [System Settings](#system-settings)
8. [Notifications and Communication](#notifications-and-communication)
9. [Reports and Statistics](#reports-and-statistics)
10. [Bug Reports Management](#bug-reports-management)
11. [Security Settings](#security-settings)
12. [Technical Guide](#technical-guide)

---

## Introduction

The **QueueForRoom Administrative Manual** helps with comprehensive administration of the school room reservation system. This document is designed for administrators and instructors.

### Admin Features Overview

- 👥 User account and role management
- ✅ Approval/rejection of permission requests
- 🏫 Room and resource administration
- 📊 Booking statistics and reports
- 🔧 System settings modification
- 🔒 Security and permission settings

---

## Admin Role and Permissions

### Role Hierarchy

1. **Admin** (Highest level)
   - Full access to all features
   - User role modification
   - System settings management
   - Room creation, modification, deletion
   - All permission request processing

2. **Instructor**
   - Instant room booking (no permission needed)
   - Access to restricted rooms
   - Full management of own reservations
   - Cannot see other users' reservations (only own)

3. **Student**
   - Submit permission requests for bookings
   - Only approved reservations
   - Restricted rooms not accessible
   - Can be invited to reservations

### Admin Privileges

- ✅ **Users**: Create, edit, delete, modify roles
- ✅ **Rooms**: Full CRUD (Create, Read, Update, Delete) operations
- ✅ **Reservations**: View, modify, delete all reservations
- ✅ **Permission Requests**: Approve, reject, add comments
- ✅ **Settings**: Minimum/maximum booking time, system-level parameters
- ✅ **Reports**: Export statistics, usage reports

---

## User Management

### Viewing User List

1. **Admin Panel → Users**
   - See all registered users
   - Search by name, email, or role
   - Filter by status (active, disabled, email not verified)

2. **User Information**
   - **Name**: Full name
   - **Email**: Email address and verification status
   - **Role**: student, instructor, admin
   - **Registration date**: When they joined
   - **Last login**: Activity tracking

### Creating a User (Manual)

1. **Admin Panel → Users → New User**
2. **Enter details**:
   - Email address
   - Last name, First name
   - Role selection
   - Generate temporary password (optional)
3. **Email notification**
   - Automatic welcome email
   - Password reset link

### Modifying Role

1. **Select user** from the list
2. **Edit** button
3. **Change role**:
   - `student` → `instructor`: Instructor privileges
   - `instructor` → `admin`: Full admin access
   - `admin` → `instructor`: Revoke admin rights
4. **Save** and email notification

### Deleting a User

1. **Warning**: Think before deleting
   - All their reservations will be deleted
   - Invitations will also cease
   - Irreversible action

2. **Deletion process**:
   - Click "Delete" button
   - Confirm deletion
   - Permanent removal from database

### Disabling a User (Recommended)

1. **Temporary access revocation**
   - Edit user
   - Turn off "Active" status
   - Cannot log in, but data remains

2. **Reactivation**
   - Can be restored the same way

---

## Permission Requests Management

### Permission Request Overview

1. **Admin Panel → Permission Requests**
   - See all pending requests
   - **Statuses**:
     - ⏳ Pending
     - ✅ Approved
     - ❌ Rejected
     - ⚫ Cancelled

2. **Request Details**
   - Requester's name
   - Room and time
   - Purpose/justification
   - Number of attendees
   - Request date

### Approving a Request

1. **Select request**
2. **Verification**:
   - Time conflict (system automatically flags)
   - Room capacity
   - Room authorization
3. **Approve** button
4. **Optional comment** to add
5. **Confirmation**
   - Requester receives email notification
   - Reservation is automatically created

### Rejecting a Request

1. **Select request**
2. **Reject** button
3. **Provide reason** (required):
   - Brief explanation for rejection
   - This appears in the email notification
4. **Confirmation**
   - Requester receives notification
   - Request changes to "Rejected" status

### Bulk Approval

1. **Select multiple requests**
   - Check boxes to mark
2. **"Approve Selected"** button
3. **Confirmation**
   - All selected requests are approved

---

## Room Administration

### Listing Rooms

1. **Admin Panel → Rooms**
   - Display all rooms
   - **Information**:
     - Room name (Hungarian/English)
     - Capacity
     - Floor
     - Type (lab, lecture hall, etc.)
     - Availability

### Creating a New Room

1. **Admin Panel → Rooms → New Room**
2. **Basic Data**:
   - **Name (HU)**: Hungarian name
   - **Name (EN)**: English name
   - **Capacity**: Maximum number of attendees
   - **Floor**: Which floor it's on
   - **Type**: standard, lab, auditorium, meeting
3. **Description**:
   - **Description (HU)**: In Hungarian
   - **Description (EN)**: In English
   - Equipment, special features
4. **Map Position**:
   - **X position**: Horizontal (0-600)
   - **Y position**: Vertical (0-400)
   - **Width**: Room width on map
   - **Height**: Room height on map
5. **Permissions**:
   - **Minimum role**: student, instructor, admin
   - Only users at or above this level can book
6. **Availability**:
   - **Available**: Yes/No
   - Disabled rooms cannot be booked

### Editing a Room

1. **Select room** from the list
2. **Edit** button
3. **Modifiable fields**: All data
4. **Save**
   - Active reservations don't change
   - New reservations use new settings

### Deleting a Room

1. **Warning**: Only delete empty rooms
   - Check for no active reservations
2. **Delete** button → Confirmation
3. **Soft delete**: Recommended to use "not available" status instead of deletion

---

## Reservation Oversight

### Viewing All Reservations

1. **Admin Panel → Reservations**
   - All user reservations
   - **Filters**:
     - Date range
     - Room
     - User
     - Status

2. **Reservation Details**
   - Booker's name
   - Room
   - Time (start - end)
   - Number and list of attendees
   - Purpose
   - Creation date

### Modifying a Reservation

1. **Select reservation**
2. **Edit** button
3. **Modifiable data**:
   - Time
   - Room
   - Attendees
4. **Save**
   - All attendees receive email notification about the change

### Deleting a Reservation (By Admin)

1. **Select reservation**
2. **Delete** button
3. **Reason** (optional):
   - Why admin is deleting the reservation
4. **Confirmation**
   - Email notification to all attendees
   - Reservation changes to "cancelled" status

### Resolving Conflicts

1. **Detecting conflicting reservations**
   - System automatically flags
   - Admin panel → Conflicts
2. **Resolution methods**:
   - Modify time of one reservation
   - Delete one reservation
   - Suggest another room

---

## System Settings

### Booking Settings

1. **Admin Panel → Settings → Booking**
2. **Minimum booking time**:
   - Default: 30 minutes
   - Adjustable between 15-120 minutes
3. **Maximum booking time**:
   - Default: 120 minutes (2 hours)
   - Maximum: 480 minutes (8 hours)
4. **Time interval**:
   - Fixed 15-minute steps
   - Not modifiable

### Email Settings

1. **Email Service**: Resend API
2. **From address**: `onboarding@resend.dev`
3. **Email types**:
   - Welcome email (registration)
   - Email verification
   - Reservation confirmation
   - Reservation cancellation
   - Invitation
   - Reminder (1 hour before)

### System Messages

1. **Admin Panel → Settings → Messages**
2. **System-wide notifications**:
   - Maintenance message
   - Important announcements
   - Periodic notices
3. **Display**:
   - Banner for all users
   - Only after login

---

## Notifications and Communication

### Email Notification Types

1. **Booking Notifications**:
   - New reservation created
   - Reservation confirmed (after permission request)
   - Reservation cancelled
   - Reservation modified
   - Reminder (1 hour before)

2. **User Notifications**:
   - Registration confirmation
   - Password reset
   - Role modification
   - Account disabled/reactivated

3. **Admin Notifications**:
   - New permission request
   - Conflicting reservations
   - System errors
   - Security events

### Editing Email Templates

1. **Admin Panel → Settings → Email Templates**
2. **Available templates**:
   - `welcome.tsx`: Welcome email
   - `verification.tsx`: Email verification
   - `reservation-confirmed.tsx`: Reservation confirmation
   - `reservation-cancelled.tsx`: Reservation cancellation
3. **Using variables**:
   - `{{userName}}`: User's name
   - `{{roomName}}`: Room name
   - `{{startTime}}`: Start time
   - `{{endTime}}`: End time

---

## Reports and Statistics

### Usage Statistics

1. **Admin Panel → Reports → Statistics**
2. **Available reports**:
   - **Number of bookings**: Daily/weekly/monthly breakdown
   - **Most popular rooms**: Most frequently booked rooms
   - **User activity**: Who books how much
   - **Peak times**: When it's busiest

### Export Functions

1. **Export data**:
   - CSV format
   - Excel compatible
   - JSON data structure

2. **Exportable data**:
   - Reservation list
   - User data
   - Statistical summaries

### Daily Summary

1. **Automatic email report**:
   - Every day at 8:00 AM
   - Previous day's booking count
   - Pending permission requests
   - System status

---

## Bug Reports Management

### Bug Report Handling

1. **Admin Panel → Bug Reports**
2. **Submitted reports**:
   - User name
   - Bug description
   - Severity: low, medium, high, critical
   - Status: open, in_progress, resolved, closed
   - Date

3. **Processing Report**:
   - Click on report
   - Modify status
   - Add comment
   - Notify user (optional)

### Severity Levels

- **Low**: Minor visual bugs
- **Medium**: Functionality limited but works
- **High**: Important feature not working
- **Critical**: System unusable

---

## Security Settings

### Password Rules

1. **Minimum requirements**:
   - 8 characters
   - 1 uppercase letter
   - 1 lowercase letter
   - 1 number
   - 1 special character

2. **Password Expiration**:
   - Default: No expiration
   - Configurable: 30, 60, 90 days

### Brute Force Protection

1. **Login Attempts**:
   - After 5 failed attempts: 15-minute lockout
   - 10 attempts: 1-hour lockout
   - 15 attempts: 24-hour lockout

2. **IP Blocking**:
   - Automatic blocking of suspicious IP addresses
   - Admin can unblock

### 2FA (Two-Factor Authentication)

1. **User level**:
   - Optional activation
   - Google Authenticator, Authy compatible
   - Email-based 2FA

2. **Admin level**:
   - Recommended to make mandatory for admins

---

## Technical Guide

### Database Maintenance

1. **Regular Backups**:
   - Automatic daily backup
   - Managed by Railway
   - Manual backup: `railway run npm run db:backup`

2. **Running Migrations**:
   ```bash
   railway run npm run db:migrate
   ```

3. **Database Check**:
   ```bash
   railway run npm run db:check
   ```

### Environment Variables

1. **Critical variables**:
   - `DATABASE_URL`: PostgreSQL connection string
   - `SESSION_SECRET`: Cookie encryption key
   - `RESEND_API_KEY`: Email API key
   - `SEND_REAL_EMAILS`: true/false
   - `FROM_EMAIL`: Sender email address

2. **Setting variables on Railway**:
   ```bash
   railway variables --set VARIABLE_NAME=value
   ```

### Logs and Debugging

1. **View Logs**:
   ```bash
   railway logs
   ```

2. **Debugging**:
   - Developer console (F12 in browser)
   - Network requests (Network tab)
   - Console errors (Console tab)

### Performance Optimization

1. **Clear Cache**:
   - Regular browser cache clearing recommended
   - Service Worker restart

2. **Database Indexes**:
   - Automatically managed
   - Check query times under heavy load

---

## Common Admin Tasks

### Starting a New Semester

1. **Archive old reservations**
   - Admin Panel → Reservations → Archive
   - Previous semester reservations

2. **Check users**
   - Delete/disable inactive accounts
   - Update roles (graduates)

3. **Update rooms**
   - Check availability
   - Modify capacities

### Maintenance Period

1. **Notify users**
   - Set system message
   - Send email (optional)

2. **Maintenance mode**:
   - Create unavailable booking
   - Only admins see the system

3. **Apply updates**:
   ```bash
   git pull
   npm install
   railway up
   ```

---

## Support and Contact

For admin help:

- 📧 Email: admin@queueforroom.com
- 🔧 Technical support: tech-support@queueforroom.com
- 📱 Hotline: +36 XX XXX XXXX

**Response time**: 4-8 hours on business days

---

*This document was created for QueueForRoom 1.0 administrative version. Features may change.*
