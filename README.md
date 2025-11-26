# QueueForRoom - School Room Reservation System 🎓

> **Status**: ✅ Production Ready (v1.0.0) | 🚧 [Live Demo](https://queueforroom-demo.pages.dev)

A bilingual (Hungarian/English) school room reservation system with an interactive SVG-based top-down map interface, comprehensive security features, and modern glass morphism UI design.

[![Deploy to Cloudflare Pages](https://img.shields.io/badge/Deploy%20to-Cloudflare%20Pages-orange?logo=cloudflare&logoColor=white)](https://dash.cloudflare.com/login)
[![PostgreSQL](https://img.shields.io/badge/Database-PostgreSQL-blue?logo=postgresql&logoColor=white)](https://www.postgresql.org/)
[![Remix](https://img.shields.io/badge/Framework-Remix-black?logo=remix&logoColor=white)](https://remix.run/)

📖 **[Deployment Guide](./DEPLOYMENT.md)** - Step-by-step deployment instructions

---

## 🌟 Features

### Core Functionality
- 🔐 **Secure Authentication**
  - Session-based with bcrypt password hashing
  - Brute force protection (5 attempts → 10 min lockout)
  - Email verification & 2FA support
  - Strong password validation
  - Password visibility toggles

- 🗺️ **Interactive Floor Map**
  - SVG-based top-down view
  - Multi-floor support
  - Real-time room availability
  - Click to reserve functionality

- 📅 **Reservation Management**
  - Create/cancel reservations
  - Invite users to bookings
  - Share reservation links
  - Conflict detection
  - Time slot validation

- 🌍 **Bilingual Support**
  - Hungarian/English UI (i18next)
  - Database content in both languages
  - Client-side language switching
  - LocalStorage persistence

- 🎨 **Modern UI/UX**
  - Glass morphism design system
  - Light/Dark theme switching
  - Fully responsive (mobile → desktop)
  - Smooth animations & transitions
  - Guided tour for new users

- � **Email Service** (Resend API)
  - Email verification
  - 2FA codes
  - Password reset
  - Account lockout notifications
  - Admin alerts

- 🛡️ **Security Features**
  - IP-based login tracking
  - Automatic account lockout
  - One-time unlock tokens
  - SQL injection protection
  - Session management

- 🐛 **Bug Reporting System**
  - In-app bug report modal
  - Severity levels (low/medium/high/critical)
  - Admin notification system
  - Database tracking

### User Roles
- **User**: Basic room booking rights
- **Superuser**: Extended booking privileges
- **Admin**: Full system management (users, rooms, settings)

---

## � Quick Start

### Prerequisites
- Node.js 18+ and npm
- PostgreSQL 14+
- Resend account (for email features)

### Installation

1. **Clone repository** (if applicable)
```bash
git clone <repository-url>
cd Teszt1
```

2. **Install dependencies**
```bash
npm install
```

3. **Environment setup**

Create a `.env` file in the project root:

```env
# Database connection
DATABASE_URL=postgresql://username:password@localhost:5432/queueforroom

# Session secret (change in production!)
SESSION_SECRET=your-long-random-secret-key-min-32-chars

# Email service (Resend API)
RESEND_API_KEY=re_YourResendApiKey
```

4. **Database setup**

```bash
# Run migrations (creates tables)
npm run db:migrate

# Seed with sample data (optional)
npm run db:seed
```

5. **Start development server**

```bash
npm run dev
```

Open [http://localhost:5173](http://localhost:5173) in your browser.

6. **Production build**

```bash
npm run build
npm start
```

---

## 📚 Documentation

| Document | Description |
|----------|-------------|
| **[SETUP.md](./SETUP.md)** | Detailed setup instructions |
| **[START-HERE.md](./START-HERE.md)** | Beginner's guide |
| **[IMPLEMENTATION-SUMMARY.md](./IMPLEMENTATION-SUMMARY.md)** | Complete technical documentation |
| **[QUICK-REFERENCE.md](./QUICK-REFERENCE.md)** | Developer quick reference guide |
| **[CHANGELOG.md](./CHANGELOG.md)** | Version history and changes |

---

## 🛠️ Tech Stack

### Backend
- **Framework**: [Remix](https://remix.run/) v2.13.1 (React-based full-stack)
- **Runtime**: Node.js (v18+)
- **Database**: PostgreSQL 14+ with `pg` driver (no ORM)
- **Authentication**: Session cookies + bcrypt
- **Email**: [Resend](https://resend.com/) API v4.0.1

### Frontend
- **UI Library**: React 18.3.1
- **Styling**: CSS with CSS Variables (theme system)
- **i18n**: react-i18next 15.2.0
- **Map**: Custom SVG rendering (600×400 viewBox)
- **Build Tool**: Vite 5.4.21

### Development
- **Language**: TypeScript 5.7.2
- **Linting**: TypeScript strict mode (partial)
- **Package Manager**: npm

---

## 📂 Project Structure

```
app/
├── components/          # React components
│   ├── auth/           # LoginForm, RegisterForm
│   ├── layout/         # Header, Footer, LanguageSwitcher
│   ├── map/            # RoomMap (SVG interactive map)
│   └── tour/           # TourGuide (onboarding)
│
├── routes/             # Remix file-based routing
│   ├── _index.tsx      # Dashboard (home)
│   ├── login.tsx       # Login page
│   ├── register.tsx    # Registration
│   ├── map.tsx         # Room map view
│   ├── reservations.tsx # Booking management
│   ├── profile.tsx     # User profile
│   ├── settings.tsx    # User settings
│   ├── admin.tsx       # Admin dashboard
│   ├── admin.rooms.tsx # Room management (admin)
│   ├── admin.users.tsx # User management (admin)
│   └── api/            # API endpoints
│
├── services/           # Backend business logic
│   ├── auth.server.ts      # Authentication service
│   ├── email.server.ts     # Email service (Resend)
│   └── security.server.ts  # Brute force protection
│
├── utils/              # Helper functions
│   └── session.server.ts   # Session management
│
├── styles/             # CSS stylesheets
│   └── global.css      # Global styles (2894 lines)
│
├── db.server.ts        # PostgreSQL connection pool
├── migrate.ts          # Database migrations
├── seed.ts             # Sample data seeding
└── root.tsx            # Root component (layout)

public/
└── locales/            # i18next translations
    ├── en/
    │   └── translation.json  # English (285 lines)
    └── hu/
        └── translation.json  # Hungarian (285 lines)
```

---

## 🎨 Theme System

### Available Themes
- **Default**: Purple gradient (`#667eea` → `#764ba2`)
- **Light Mode**: Blue-gray gradient (`#c5d3e8` → `#b0bfd4`)
- **Dark Mode**: Deep purple (`#110F1B` → `#1a1825`)

### CSS Variables
All components use CSS variables for theming:
- `--glass-bg`: Background with transparency
- `--glass-border`: Border color
- `--text-primary`: Main text color
- `--text-secondary`: Secondary text
- `--shadow-color`: Shadow effects

Theme switching is handled automatically via `data-theme` attribute on `<body>`.

---

## 📱 Responsive Design

Breakpoints tested and validated:
- **Desktop**: 1200px+ (full layout)
- **Large Tablet**: 1024px-1200px
- **Tablet**: 768px-1024px (2-column)
- **Mobile**: 640px-767px (1-column)
- **Small Mobile**: 480px-640px (compact)
- **Extra Small**: <480px (minimal padding)
- **Landscape**: max-height 600px (scrollable modals)

All components are mobile-first and fully responsive.

---

## 🔒 Security Features

### Implemented Protections
- ✅ Brute force protection (5 attempts → lockout)
- ✅ IP address logging
- ✅ Automatic account lockout emails
- ✅ One-time unlock tokens (1-hour expiry)
- ✅ Strong password validation
- ✅ SQL injection prevention (parameterized queries)
- ✅ Session-based authentication (httpOnly cookies)
- ✅ Password hashing (bcrypt, 10 rounds)

### Database Tables
- `login_attempts`: Tracks all login attempts with IP
- `account_lockouts`: Manages locked accounts with unlock tokens

---

## 📧 Email Configuration

### Resend API Setup

1. **Get API key**: [resend.com/api-keys](https://resend.com/api-keys)
2. **Add to `.env`**:
   ```env
   RESEND_API_KEY=re_YourApiKey
   ```
3. **Free tier limits**: 3,000 emails/month, 100 emails/day
4. **Domain verification** (optional): Custom sender domain

### Email Types
- Email verification (registration)
- 2FA codes
- Password reset links
- Account lockout notifications (with unlock token)
- Admin notifications (new registrations)

---

## 🧪 Testing

### Manual Testing Checklist
- [x] User registration → email verification
- [x] Login with valid/invalid credentials
- [x] Brute force protection (5 attempts)
- [x] Password reset flow
- [x] Room reservation creation
- [x] Theme switching (light/dark)
- [x] Language switching (EN/HU)
- [x] Responsive design (mobile → desktop)
- [x] Bug report submission
- [x] Admin room/user management

### Build Validation
```bash
npm run build  # Should complete without errors
```

---

## 🚢 Deployment

### Production Checklist

1. **Environment Variables**
   ```env
   DATABASE_URL=postgresql://prod-host/prod-db
   SESSION_SECRET=long-random-production-secret
   RESEND_API_KEY=re_ProductionKey
   NODE_ENV=production
   ```

2. **Database Migration**
   ```bash
   NODE_ENV=production npm run db:migrate
   ```

3. **Build**
   ```bash
   npm run build
   ```

4. **Start**
   ```bash
   npm start
   ```

5. **SSL/HTTPS** (required for production)
   - Let's Encrypt
   - CloudFlare
   - Reverse proxy (nginx)

6. **Monitoring** (recommended)
   - Error tracking: Sentry
   - Email delivery: Resend dashboard
   - Database backups: Daily

---

## 📊 Database Schema

### Main Tables
- **users** (12 columns): User accounts, roles, 2FA settings
- **rooms** (14 columns): Room data, positions, availability, access levels
- **reservations** (8 columns): Booking records
- **user_reservations** (3 columns): Many-to-many relationship
- **login_attempts** (5 columns): Security tracking
- **account_lockouts** (6 columns): Lockout management
- **bug_reports** (7 columns): Bug tracking

See `app/migrate.ts` for full schema definitions.

---

## 🤝 Contributing

### Development Workflow

1. **Fork & Clone**
2. **Create feature branch**: `git checkout -b feature/my-feature`
3. **Make changes** following existing patterns
4. **Test thoroughly** (responsive, themes, i18n)
5. **Build**: `npm run build` (ensure no errors)
6. **Commit**: `git commit -m "feat: description"`
7. **Push**: `git push origin feature/my-feature`
8. **Pull Request**

### Code Style
- Use TypeScript (`.tsx` for components)
- Follow existing naming conventions (camelCase, PascalCase)
- Add translations for new UI strings (EN + HU)
- Use CSS variables for theming
- Ensure responsive design

---

## 📝 License

[Specify your license here - e.g., MIT, GPL, Proprietary]

---

## 👥 Authors & Contributors

- **Developer**: HUNWo
- **AI Assistant**: GitHub Copilot
- **Documentation**: Auto-generated with AI assistance

---

## 📞 Support

For issues, questions, or contributions:
- **Documentation**: See `docs/` folder
- **Quick Reference**: [QUICK-REFERENCE.md](./QUICK-REFERENCE.md)
- **Implementation Details**: [IMPLEMENTATION-SUMMARY.md](./IMPLEMENTATION-SUMMARY.md)
- **Changelog**: [CHANGELOG.md](./CHANGELOG.md)

---

## 🎉 Acknowledgments

- [Remix](https://remix.run/) - Full-stack React framework
- [Resend](https://resend.com/) - Email delivery service
- [PostgreSQL](https://www.postgresql.org/) - Database
- [i18next](https://www.i18next.com/) - Internationalization
- [Vite](https://vite.dev/) - Build tool

---

**QueueForRoom** - Bilingual Room Reservation System  
Version 1.0.0 - Production Ready ✅  
Last Updated: January 2025