# Test User Login Credentials

## Quick Start

After running the database migration and seed:
```bash
npm run db:migrate
npm run db:seed
npm run dev
```

Visit: `http://localhost:5173`

---

## Test Accounts

### 👑 Admin User
- **Email**: `admin@school.com`
- **Password**: `password123`
- **Access**: All rooms + Admin Panel with statistics
- **Features**: 
  - Can reserve any room including restricted areas
  - Access to admin dashboard with user/room/reservation statistics
  - View all users' reservations

### ⭐ Superuser
- **Email**: `super@school.com`
- **Password**: `password123`
- **Access**: Standard rooms + Superuser-only rooms
- **Features**:
  - Can reserve most rooms including Staff Room and Conference Hall
  - Cannot access admin-only areas (Principal's Office, Server Room)

### 👤 Regular User (Student)
- **Email**: `student@school.com`
- **Password**: `password123`
- **Access**: Standard rooms only (classrooms, labs, library, study rooms)
- **Features**:
  - Can reserve publicly available rooms
  - Cannot access restricted areas

---

## Features to Test

### 🎨 Theme System
- **Light Mode**: Click the ☀️ icon in the header
- **Dark Mode**: Click the 🌙 icon in the header
- Theme preference is saved in localStorage

### 🗺️ Interactive Building Map
- **Floor Navigation**: Switch between Floor 1 and Floor 2
- **Room Colors**:
  - 🟦 Blue: Standard classrooms
  - 🟨 Yellow: Computer labs
  - 🟩 Green: Libraries
  - 🟧 Orange: Meeting/Conference rooms
  - 🟥 Red: Restricted rooms (based on your role)
  - ⬜ Grey: Corridors (non-reservable)
- **Door Indicators**: Brown rectangles at the bottom of rooms
- **Lock Icons**: 🔒 shown on rooms you cannot access

### 📅 Reservations
1. Click on an available room
2. Select start and end time
3. Enter purpose
4. Submit reservation
5. Manage from "My Reservations"
   - Cancel reservations
   - Invite other users
   - Generate shareable links

### 🎓 Guided Tour
- **First Visit**: Tour starts automatically after 1 second
- **Restart Tour**: Click the `?` button in bottom-right corner
- **Skip Tour**: Click the `×` button or click outside the tooltip
- Tour progress is saved in localStorage

### 👤 Profile Menu
- Click on your name in the header
- Solid background menu (no transparency bugs)
- Options:
  - Profile (edit name, change password)
  - My Reservations
  - Settings (notifications, theme, account)
  - Admin Panel (admin only)
  - Logout

---

## Building Layout

### Floor 1 (Ground Floor)
- **Main Corridor** (horizontal)
- **Classrooms**: 101, 102 (standard access)
- **Computer Lab** (standard access)
- **Library** (standard access)
- **Staff Room** (⭐ superuser required)
- **Meeting Room** (standard access)
- **Principal's Office** (👑 admin only)
- **Office 103** (standard access)

### Floor 2 (Second Floor)
- **Corridor 2F** (vertical)
- **Science Lab** (standard access)
- **Music Room** (standard access)
- **Art Studio** (standard access)
- **Server Room** (👑 admin only)
- **Conference Hall** (⭐ superuser required)
- **Study Room A & B** (standard access)

---

## Admin Panel Features (Admin Only)

Visit: `/admin` or click "Admin Panel" in profile menu

### Statistics Cards
- Total Users
- Total Rooms
- Active Reservations
- Total Reservations (all time)

### User Roles Distribution
Visual breakdown of user/superuser/admin counts

### Most Popular Rooms
Top 5 rooms by reservation count

### Room Utilization
Total booking hours per room

### Recent Reservations
Last 10 reservations with details:
- Room name
- User info
- Start/End times
- Purpose
- Status (confirmed/pending/cancelled)

---

## Troubleshooting

### Database Not Connected
If you see `ECONNREFUSED` errors:
1. Make sure PostgreSQL is running
2. Check your `.env` file has correct `DATABASE_URL`
3. Default format: `postgresql://username:password@localhost:5432/queueforroom`

### Tour Not Showing
- Clear localStorage: `localStorage.removeItem('tourCompleted')`
- Refresh the page
- Tour only shows for logged-in users

### Menu Appearing Behind Content
- This is now fixed with solid background and z-index 250
- If issues persist, check browser console for errors

### Rooms Not Clickable
- Corridors are intentionally not clickable
- Locked rooms (🔒) cannot be reserved
- Make sure you're logged in with appropriate role

---

## Default Password

All test accounts use: **`password123`**

For production, change this in `app/seed.ts` before seeding!
