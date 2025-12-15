# QUICK START GUIDE

## Step 1: Run setup-dirs.bat
Double-click `setup-dirs.bat` to create all necessary folders.

## Step 2: Install Dependencies
Open Command Prompt or PowerShell in this folder and run:
```
npm install
```

## Step 3: Create the Application Files

I've created the configuration files for you. Now you need to create the application files.
Since we can't use PowerShell commands automatically, I'll provide you with the file contents.

Let me know when you've completed Steps 1 and 2, and I'll provide all the source code files
for you to create, OR I can create them if you tell me which method you prefer:

### Method A: Tell me to create files
Say "create all files" and I'll use the file creation tool to make all necessary files.

### Method B: Manual creation
I'll give you the content for each file and you create them manually.

## What Files Need to Be Created?

After running setup-dirs.bat and npm install, you'll need these files:

### Core Application:
- `app/root.tsx` - Main app wrapper
- `app/entry.client.tsx` - Client entry point
- `app/entry.server.tsx` - Server entry point

### Database:
- `app/db.server.ts` - Database connection
- `app/migrate.ts` - Create tables
- `app/seed.ts` - Sample data

### Authentication:
- `app/services/auth.server.ts` - Auth logic
- `app/utils/session.server.ts` - Session management

### Routes (Pages):
- `app/routes/_index.tsx` - Dashboard
- `app/routes/login.tsx` - Login page
- `app/routes/register.tsx` - Register page
- `app/routes/map.tsx` - Interactive map
- `app/routes/logout.tsx` - Logout handler
- `app/routes/api/rooms.ts` - Room API

### Components:
- `app/components/auth/LoginForm.tsx`
- `app/components/auth/RegisterForm.tsx`
- `app/components/map/RoomMap.tsx`
- `app/components/layout/Header.tsx`
- `app/components/layout/LanguageSwitcher.tsx`

### Translations:
- `public/locales/en/translation.json`
- `public/locales/hu/translation.json`

### Styles:
- `app/styles/global.css`

---

**Ready to proceed?**

Type one of:
1. "create all files" - I'll create everything automatically
2. "show me the files" - I'll show you each file to create manually
3. "I've run the setup" - Once you've completed steps 1-2
