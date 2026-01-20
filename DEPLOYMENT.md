# Deployment Guide

## Vercel Deployment (Recommended)

### Quick Setup

1. **Install Vercel CLI** (optional):
   ```bash
   npm i -g vercel
   ```

2. **Connect to GitHub**:
   - Push your code to GitHub (create a new repo if needed)
   - Go to [vercel.com](https://vercel.com)
   - Click **Import Project** → select your GitHub repo
   - Vercel auto-detects Next.js and configures build

3. **Set Environment Variables** in Vercel Dashboard:
   - Go to **Settings** → **Environment Variables**
   - Add:
     - `DATABASE_URL`: Your database connection string (SQLite or Postgres)
     - `MUSICBRAINZ_API_URL`: `https://musicbrainz.org/ws/2` (pre-filled)

4. **Deploy**:
   - Click **Deploy**
   - Vercel builds and deploys automatically
   - Your app is live at `https://your-project.vercel.app`

5. **Connect Your Domain** (pixie-ss1-ftp.porkbun.com):
   - In Vercel Dashboard → **Domains** → Add `thebeatlesarchive.com`
   - Update DNS records at Porkbun to point to Vercel nameservers
   - Wait 24–48 hours for DNS propagation

### Environment Setup

**For SQLite** (development/small-scale):
```env
DATABASE_URL="file:./prisma/dev.db"
```

**For PostgreSQL** (recommended for production):
```env
DATABASE_URL="postgresql://user:password@host:port/dbname"
```

Get a free PostgreSQL:
- [Supabase](https://supabase.com) — PostgreSQL hosting + free tier
- [Railway](https://railway.app) — Pay-as-you-go, simple setup
- [Heroku Postgres](https://www.heroku.com/postgres) — Legacy but available

### Database Setup on Vercel

1. Choose a PostgreSQL provider (e.g., Supabase)
2. Create a project and get the connection string
3. Add `DATABASE_URL` to Vercel Environment Variables
4. Vercel will run `prisma migrate` automatically on deploy

### Manual Deploy with Vercel CLI

```bash
vercel                     # Deploy to preview
vercel --prod              # Deploy to production
vercel env pull            # Fetch env vars locally
vercel env add             # Add new env vars interactively
```

### Automatic Deploys

Once connected to GitHub, Vercel deploys automatically on:
- Push to `main` (production)
- Push to other branches (preview deployments)

### Redeploy Current Version

If you need to rebuild without code changes:
- Vercel Dashboard → **Deployments** → select a build → **Redeploy**

---

## Alternative: Self-Hosted Node

If you prefer to run on your own server:

### Railway
```bash
npm install -g @railway/cli
railway link
railway up
```

### Fly.io
```bash
curl -L https://fly.io/install.sh | sh
fly launch
fly deploy
```

### VPS (AWS EC2, DigitalOcean, etc.)
```bash
ssh user@your-vps.com
git clone https://github.com/your-user/thebeatlesarchive.git
cd thebeatlesarchive
npm install
npx prisma db push
npm run build
npm start
```

---

## Sync Strategy on Vercel

**Problem**: Serverless can't run long background tasks.

**Solution**: Schedule syncs separately:

1. **Local sync** (your machine):
   ```bash
   npm run sync:all
   ```
   Run this locally whenever you want to refresh the database.

2. **Database replication**:
   - Use Supabase/PostgreSQL on Vercel
   - Sync to the live database, not local SQLite
   - Update `DATABASE_URL` in `.env.local` to point to Vercel DB

3. **Scheduled cron** (optional):
   - Use [GitHub Actions](https://github.com/features/actions) to run syncs on a schedule
   - Or use a service like [Cron-job.org](https://cron-job.org) to hit an endpoint

---

## Checklist

- [ ] Code pushed to GitHub
- [ ] Vercel project created and connected
- [ ] `DATABASE_URL` set in Vercel Environment Variables
- [ ] Domain DNS configured (if using custom domain)
- [ ] Test app at `https://your-vercel-app.vercel.app`
- [ ] Sync data to live database as needed

