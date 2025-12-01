# QueueForRoom - User Manual (English)

**Version:** 1.0  
**Last Updated:** December 1, 2025

---

## Table of Contents

1. [Introduction](#introduction)
2. [Registration and Login](#registration-and-login)
3. [Dashboard Overview](#dashboard-overview)
4. [Room Reservation](#room-reservation)
5. [Managing Reservations](#managing-reservations)
6. [Notifications](#notifications)
7. [Profile Settings](#profile-settings)
8. [Language Switching](#language-switching)
9. [Troubleshooting](#troubleshooting)

---

## Introduction

**QueueForRoom** is a modern, interactive room reservation system designed for schools and educational institutions. The application enables:

- 📍 Browse rooms on an interactive map
- 📅 Simple booking process with 15-minute intervals
- 👥 Invite colleagues to your reservations
- 🔔 Automatic notifications about bookings
- 🌐 Bilingual support (Hungarian/English)

---

## Registration and Login

### Creating a New User Account

1. **Open Registration Page**
   - Visit the `/register` page
   - Click the "Register" button on the homepage

2. **Enter Details**
   - **Email address**: Valid email (used for login)
   - **Last name**: Your full last name
   - **First name**: Your full first name
   - **Password**: Minimum 8 characters, must contain:
     - At least 1 uppercase letter (A-Z)
     - At least 1 lowercase letter (a-z)
     - At least 1 number (0-9)
     - At least 1 special character (@, #, $, etc.)
   - **Confirm password**: Same password again

3. **Email Verification**
   - After registration, you'll receive a verification email
   - Open the email and click the verification link
   - The link expires in 24 hours
   - If you didn't receive the email, check your spam folder

4. **Login**
   - After email verification, you can log in
   - Enter your email and password
   - Click the "Login" button

### Resend Verification Email

If you didn't receive the verification email:

1. Go to the login page
2. Try to log in (you'll get an error message)
3. Click the "Resend email" button
4. Wait 60 seconds before trying again

---

## Dashboard Overview

After logging in, you'll see the following elements:

### Header

- **Logo**: Returns to the homepage
- **Language switcher**: Toggle between Hungarian/English
- **Notifications**: Bell icon - number of new notifications
- **Profile menu**: Click your name for options:
  - My Profile
  - Settings
  - Logout

### Dashboard Cards

1. **Active Reservations**: Number of current and upcoming reservations
2. **Available Rooms**: Number of currently free rooms
3. **Today's Reservations**: Bookings scheduled for today

### Quick Actions

- **Create new reservation**: Jump to the map page
- **View my reservations**: List of all your bookings

---

## Room Reservation

### Selecting a Room from the Map

1. **Open Map Page**
   - Click "Map" in the header menu
   - Or select "New reservation" button on the homepage

2. **Select Floor**
   - Use the floor selector buttons (1st Floor, 2nd Floor, etc.)
   - The map updates automatically

3. **Room Information**
   - **Hover**: Additional details appear
   - **Color codes**:
     - 🟢 Green: Available room
     - 🔴 Red: Occupied room
     - 🟡 Yellow: Restricted access (higher permission required)

4. **Select Room**
   - Click on the desired room on the map
   - The reservation form appears

### Creating a Reservation

1. **Choose Time Slot**
   - **Start time**: Select start time
   - **End time**: Select end time
   - **Auto-rounding**: Times automatically round to 15-minute intervals
   - **Minimum duration**: 30 minutes (automatically corrected if shorter)
   - **Past dates**: Cannot be selected - automatically resets to current time

2. **Enter Details**
   - **Purpose**: Write a brief description (e.g., "Team meeting", "Study session")
   - **Number of attendees**: Set how many people will attend (max: room capacity)

3. **Confirm Reservation**
   - Click the "Reserve" button
   - **Students**: Submit permission request to admin
   - **Instructors/Admins**: Instant booking

4. **Confirmation**
   - You'll receive a success notification
   - Email notification will be sent

### Special Features

#### Inviting Users

1. Click the "Invite" button on reservation details
2. Search for users by name or email
3. Select people to invite
4. Click the "Invite" button
5. Invited people receive email notifications

#### Generate Shareable Link

1. Open reservation details
2. Click the "Get link" button
3. Copy the generated link
4. Share via email, chat, etc.
5. Link is accessible to anyone - no login required

---

## Managing Reservations

### Listing Reservations

1. **My Reservations Page**
   - Click "My Reservations" in the menu
   - See all your active and upcoming reservations

2. **Reservation Details**
   - **Room name**: Which room is booked
   - **Time**: Start and end time
   - **Status**: 
     - ⏳ Pending (permission request)
     - ✅ Confirmed
     - ❌ Cancelled
   - **Attendees**: How many joined

### Cancelling a Reservation

1. Click on the reservation in the list
2. Click the "Cancel" button
3. Confirm cancellation
4. All attendees receive email notification

### Joining a Reservation (From Invite Link)

1. Open the shared link
2. View reservation details
3. Click the "Join" button
4. **Unregistered users**: Enter your details
5. After confirmation, you're added to attendees

---

## Notifications

### Notification Types

1. **Reservation confirmed**: When an admin approves your request
2. **Reservation rejected**: When an admin rejects your request
3. **Invitation**: When you're invited to a reservation
4. **Reservation cancelled**: When a booking is cancelled
5. **Reminder**: 1 hour before the reservation

### Managing Notifications

1. **View Notifications**
   - Click the bell icon in the header
   - Unread notifications appear

2. **Mark as Read**
   - Click on the notification
   - Automatically marked as read

3. **Clear All Notifications**
   - Settings → Notifications
   - "Mark all as read" button

---

## Profile Settings

### Edit Profile

1. **Profile Page**
   - Click your name in the header
   - Select "My Profile" option

2. **Editable Fields**
   - **Last name**
   - **First name**
   - **Email address** (requires re-verification)
   - **Preferred language**

3. **Save Changes**
   - Click the "Save" button
   - You'll receive a confirmation message

### Change Password

1. **Settings Page**
   - Profile menu → Settings
   - "Change password" section

2. **Enter Data**
   - **Current password**: Enter your current password
   - **New password**: Minimum 8 characters, same requirements as registration
   - **Confirm new password**: Re-enter the new password

3. **Save**
   - Click "Change password" button
   - After successful change, you'll be logged out

### Notification Settings

1. **Email Notifications**
   - Toggle email notifications on/off
   - Types:
     - Reservation confirmations
     - Invitations
     - Reminders

2. **Browser Notifications**
   - Enable push notifications
   - Only in supported browsers (Chrome, Firefox, Edge)

---

## Language Switching

### Change Language

1. **Header Language Switcher**
   - Click the language icon (🌐)
   - Select desired language:
     - 🇭🇺 Magyar
     - 🇬🇧 English

2. **Automatic Refresh**
   - The page immediately updates with the new language
   - The setting is saved in your browser

3. **Profile Preference**
   - The chosen language is associated with your account
   - This language will load on next login

---

## Troubleshooting

### Login Issues

**"Email address not found" error**
- ✅ Check email address spelling (case doesn't matter)
- ✅ Try registering again
- ✅ Verify that you confirmed your email

**"Incorrect password" error**
- ✅ Check Caps Lock
- ✅ Try the "Reset password" function

**"Please verify your email" error**
- ✅ Open your email account
- ✅ Click the verification link in the email
- ✅ If not received: "Resend email" button

### Reservation Problems

**"Room already booked for this time" error**
- ✅ Choose a different time slot
- ✅ Try another room
- ✅ Check available rooms on the map

**Can't create reservations shorter than 30 minutes**
- ✅ This is the minimum duration
- ✅ Times automatically adjust to 30 minutes

**"You don't have permission for this room" error**
- ✅ This room is only accessible to instructors/admins
- ✅ Request permission from administrator
- ✅ Choose a different room

### Email Notifications

**Not receiving email notifications**
- ✅ Check spam folder
- ✅ Add `onboarding@resend.dev` to safe senders list
- ✅ Check email notification settings in your profile

### Map Issues

**Map doesn't load**
- ✅ Refresh the page (F5 or Ctrl+R)
- ✅ Clear browser cache
- ✅ Try a different browser

**Can't see certain rooms**
- ✅ Check the floor selector
- ✅ Some rooms may have restricted access

---

## Support and Contact

If you need further assistance:

- 📧 Email: support@queueforroom.com
- 🌐 Website: https://queueforroom-production.up.railway.app
- 📱 Phone: +36 XX XXX XXXX

**Response time**: 24-48 hours on business days

---

*This document was created for QueueForRoom version 1.0. Features and interfaces may change.*
