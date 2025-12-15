# QueueForRoom - Deployment Guide

## Demo Version Deployment (PostgreSQL Cloud + Cloudflare Pages)

### Prerequisites
- GitHub account
- Cloudflare account (free tier)
- PostgreSQL Cloud account (e.g., Neon, Supabase, or Railway)

---

## Step 1: Setup PostgreSQL Cloud Database

### Option A: Neon (Recommended for Free Tier)
1. Go to https://neon.tech
2. Sign up for free account
3. Create a new project: "queueforroom-demo"
4. Create a database: "queueforroom"
5. Copy the connection string (looks like: `postgresql://user:password@host/database`)

### Option B: Supabase
1. Go to https://supabase.com
2. Create new project
3. Go to Settings > Database
4. Copy the connection string (Connection pooling recommended)

### Option C: Railway
1. Go to https://railway.app
2. New Project > Add PostgreSQL
3. Copy the connection string from Variables tab

---

## Step 2: Initialize Database Schema

1. Update your `.env` file with the cloud database URL:
```env
DATABASE_URL="postgresql://user:password@host:5432/database?sslmode=require"
SESSION_SECRET="generate-a-strong-random-secret-here"
```

2. Run migrations:
```bash
npm run db:migrate
```

3. Seed with demo data:
```bash
npm run db:seed
```

---

## Step 3: Push to GitHub

1. Initialize git (if not already):
```bash
git init
git add .
git commit -m "Initial commit - QueueForRoom demo"
```

2. Create GitHub repository:
   - Go to https://github.com/new
   - Name: "queueforroom-demo"
   - Make it Public or Private
   - Don't initialize with README (you already have files)

3. Push to GitHub:
```bash
git remote add origin https://github.com/YOUR_USERNAME/queueforroom-demo.git
git branch -M main
git push -u origin main
```

---

## Step 4: Deploy to Cloudflare Pages

### Option A: Via Dashboard (Easier)

1. Go to https://dash.cloudflare.com
2. Navigate to **Workers & Pages**
3. Click **Create application** > **Pages** > **Connect to Git**
4. Select your GitHub repository: `queueforroom-demo`
5. Configure build settings:
   - **Framework preset**: Remix
   - **Build command**: `npm run build`
   - **Build output directory**: `build/client`
   - **Root directory**: (leave empty)

6. Add Environment Variables:
   - Click **Environment variables**
   - Add the following:
     ```
     NODE_ENV = production
     DATABASE_URL = your-postgresql-connection-string
     SESSION_SECRET = your-strong-secret-key
     ```

7. Click **Save and Deploy**

### Option B: Via Wrangler CLI

1. Install Wrangler:
```bash
npm install -g wrangler
```

2. Login to Cloudflare:
```bash
wrangler login
```

3. Create Pages project:
```bash
wrangler pages project create queueforroom-demo
```

4. Deploy:
```bash
npm run build
wrangler pages deploy build/client --project-name=queueforroom-demo
```

5. Add secrets:
```bash
wrangler pages secret put DATABASE_URL --project-name=queueforroom-demo
wrangler pages secret put SESSION_SECRET --project-name=queueforroom-demo
```

---

## Step 5: Post-Deployment Configuration

### Set Custom Domain (Optional)
1. In Cloudflare Pages dashboard
2. Go to your project > **Custom domains**
3. Add your domain or use the provided `*.pages.dev` subdomain

### Configure Environment Variables
Make sure these are set in Cloudflare:
- `DATABASE_URL`: Your PostgreSQL connection string
- `SESSION_SECRET`: A strong random string (min 32 characters)
- `NODE_ENV`: `production`

### Update Database Connection for SSL
If your database requires SSL, ensure the connection string includes:
```
?sslmode=require
```

---

## Step 6: Verify Deployment

1. Visit your Cloudflare Pages URL (e.g., `https://queueforroom-demo.pages.dev`)
2. Test login with demo credentials:
   - Email: `admin@example.com`
   - Password: `admin123`
3. Verify all features work:
   - User registration
   - Room reservation
   - Admin panel
   - Map interaction

---

## Troubleshooting

### Database Connection Issues
- Check if `sslmode=require` is in connection string
- Verify IP whitelist (some providers require this)
- Test connection locally first: `psql $DATABASE_URL`

### Build Failures
- Check Node.js version (should be >=20.0.0)
- Clear npm cache: `npm cache clean --force`
- Delete `node_modules` and reinstall: `rm -rf node_modules && npm install`

### Runtime Errors
- Check Cloudflare Pages Functions logs
- Verify environment variables are set correctly
- Check database migration status

---

## Free Tier Limits

### Neon PostgreSQL
- 512 MB storage
- 1 database
- Always available (no sleep)

### Cloudflare Pages
- Unlimited requests
- Unlimited bandwidth
- 500 builds per month
- 20,000 files

### Costs
- **Total: $0/month** (within free tier limits)

---

## Demo Badge

The demo badge is automatically displayed in the footer:
🚧 DEMO

---

## Next Steps for Production

When ready to go production:
1. Remove demo badge from Footer.tsx
2. Upgrade database to paid tier (more storage/connections)
3. Add custom domain
4. Set up monitoring (Cloudflare Analytics)
5. Configure email service (Resend API)
6. Add SSL certificate (automatic with Cloudflare)
7. Set up backups for database

---

## Support

For issues, check:
- Cloudflare Pages docs: https://developers.cloudflare.com/pages/
- Remix deployment guide: https://remix.run/docs/en/main/guides/deployment
- Project repository issues

---

**Current Status**: ✅ Demo Version Ready for Deployment
