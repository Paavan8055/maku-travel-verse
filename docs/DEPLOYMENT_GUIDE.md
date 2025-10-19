# MAKU.Travel Production Deployment Guide

## Table of Contents

1. [Prerequisites](#prerequisites)
2. [Pre-Deployment Checklist](#pre-deployment-checklist)
3. [Deployment Steps](#deployment-steps)
4. [Post-Deployment Verification](#post-deployment-verification)
5. [Rollback Procedures](#rollback-procedures)
6. [Troubleshooting](#troubleshooting)

---

## Prerequisites

### Required Tools

- [x] Git (for version control)
- [x] Node.js 18+ & Yarn (for frontend)
- [x] Python 3.9+ (for backend)
- [x] MongoDB access
- [x] Supabase account
- [x] Netlify account (or alternative hosting)

### Required Access

- [x] GitHub repository access
- [x] Production server SSH access (if self-hosting)
- [x] Environment variable access
- [x] DNS management access
- [x] Sentry/monitoring dashboard access

### Environment Setup

**Backend (.env):**
```env
# Database
MONGO_URL=mongodb+srv://user:pass@cluster.mongodb.net/maku

# Blockchain (Mock mode for initial deployment)
BLOCKCHAIN_MODE=mock
POLYGON_RPC_URL=https://rpc-mumbai.maticvigil.com
MAKU_TOKEN_ADDRESS=0x742d35Cc6634C0532925a3b844Bc9e7595f0bEb1
MAKU_NFT_ADDRESS=0x1234567890123456789012345678901234567890

# Error Tracking
SENTRY_DSN=https://your-backend-dsn@sentry.io/project
APP_VERSION=1.0.0
ENVIRONMENT=production
```

**Frontend (.env):**
```env
# API
VITE_BACKEND_URL=https://api.maku.travel

# Supabase
VITE_SUPABASE_URL=https://your-project.supabase.co
VITE_SUPABASE_ANON_KEY=your-anon-key

# Error Tracking
VITE_SENTRY_DSN=https://your-frontend-dsn@sentry.io/project
VITE_APP_VERSION=1.0.0
```

---

## Pre-Deployment Checklist

### Code Quality

- [ ] All Playwright tests passing (`yarn test:e2e`)
- [ ] Backend tests passing (9/9 endpoints)
- [ ] No console errors in development
- [ ] Lighthouse score ≥ 85
- [ ] Accessibility audit passed

### Environment

- [ ] All environment variables set
- [ ] Environment validation passed (`node scripts/validate-environment.js`)
- [ ] Database connections verified
- [ ] Supabase configured correctly

### Security

- [ ] Secrets not committed to Git
- [ ] HTTPS enabled
- [ ] CORS configured properly
- [ ] Rate limiting enabled
- [ ] Error tracking configured

### Documentation

- [ ] README.md updated
- [ ] API documentation current
- [ ] Deployment guide reviewed
- [ ] Rollback procedures documented

---

## Deployment Steps

### Option A: Netlify Deployment (Recommended for Frontend)

#### 1. Prepare Repository

```bash
# Ensure on main branch
git checkout main
git pull origin main

# Verify build works locally
cd /app/frontend
yarn build

# Check build output
ls -lh dist/
```

#### 2. Configure Netlify

**Via Netlify Dashboard:**

1. Go to https://app.netlify.com
2. Click "Add new site" → "Import an existing project"
3. Connect to GitHub repository
4. Configure build settings:

```yaml
Base directory: frontend
Build command: yarn install --frozen-lockfile && yarn build
Publish directory: frontend/dist
```

5. Add environment variables:
   - `VITE_BACKEND_URL`
   - `VITE_SUPABASE_URL`
   - `VITE_SUPABASE_ANON_KEY`
   - `VITE_SENTRY_DSN`

6. Deploy!

**Via netlify.toml (Alternative):**

File: `/app/netlify.toml`

```toml
[build]
  base = "frontend"
  command = "yarn install --frozen-lockfile && yarn build"
  publish = "frontend/dist"

[build.environment]
  NODE_VERSION = "18"

[[redirects]]
  from = "/*"
  to = "/index.html"
  status = 200

[[headers]]
  for = "/*"
  [headers.values]
    X-Frame-Options = "DENY"
    X-Content-Type-Options = "nosniff"
    X-XSS-Protection = "1; mode=block"
    Referrer-Policy = "strict-origin-when-cross-origin"
```

#### 3. Deploy Backend

**Self-Hosted (Recommended for Control):**

```bash
# SSH to production server
ssh user@your-server.com

# Clone repository
git clone https://github.com/your-org/maku-travel.git
cd maku-travel

# Setup Python environment
cd backend
python3 -m venv venv
source venv/bin/activate
pip install -r requirements.txt

# Configure environment
cp .env.example .env
nano .env  # Edit with production values

# Start with supervisor
sudo cp supervisor.conf /etc/supervisor/conf.d/maku-backend.conf
sudo supervisorctl reread
sudo supervisorctl update
sudo supervisorctl start maku-backend
```

**Cloud Platform (Railway/Render/Fly.io):**

1. Connect GitHub repository
2. Select `/app/backend` as root
3. Set build command: `pip install -r requirements.txt`
4. Set start command: `uvicorn server:app --host 0.0.0.0 --port $PORT`
5. Add environment variables
6. Deploy

#### 4. Database Setup

**MongoDB:**

```bash
# Verify connection
mongosh "mongodb+srv://cluster.mongodb.net" --username user

# Run migrations if any
# (Currently no migrations required)

# Create indexes for performance
use maku_production
db.bookings.createIndex({ user_id: 1, created_at: -1 })
db.travel_funds.createIndex({ user_id: 1, status: 1 })
```

**Supabase:**

```bash
# Apply migrations
cd /app/frontend/supabase
supabase db push

# Verify tables created
supabase db remote commit
```

#### 5. DNS Configuration

**Add DNS Records:**

```dns
Type    Name        Value                   TTL
A       @           Netlify IP              Auto
A       www         Netlify IP              Auto
CNAME   api         backend.your-host.com   Auto
```

**Wait for DNS propagation:** 15-60 minutes

#### 6. SSL Certificate

**Netlify (Automatic):**
- SSL is automatic with Let's Encrypt
- Enable "Force HTTPS" in site settings

**Self-Hosted:**
```bash
# Install certbot
sudo apt install certbot python3-certbot-nginx

# Get certificate
sudo certbot --nginx -d maku.travel -d www.maku.travel -d api.maku.travel

# Auto-renewal
sudo certbot renew --dry-run
```

---

## Post-Deployment Verification

### Automated Checks

```bash
# Run smoke tests
cd /app/frontend
yarn test:e2e --grep "smoke"

# Check API health
curl https://api.maku.travel/api/health

# Verify blockchain endpoints
curl https://api.maku.travel/api/blockchain/network-info

# Test Sentry
curl https://api.maku.travel/api/test-error
# Check Sentry dashboard for error
```

### Manual Checks

- [ ] Homepage loads correctly
- [ ] Navigation works
- [ ] Search functionality operational
- [ ] User can connect wallet (mock mode)
- [ ] Travel Fund page loads
- [ ] Collaborative planning works
- [ ] Mobile responsive
- [ ] No console errors

### Performance Checks

```bash
# Run Lighthouse
lighthouse https://maku.travel --view

# Check Core Web Vitals
npx unlighthouse --site https://maku.travel
```

**Expected Scores:**
- Performance: ≥ 85
- Accessibility: ≥ 90
- Best Practices: ≥ 90
- SEO: ≥ 90

### Monitoring Setup

**Sentry Verification:**
1. Check dashboard for incoming events
2. Verify error capture working
3. Configure alerts
4. Test Slack notifications

**Uptime Monitoring:**
```bash
# Setup UptimeRobot or similar
Endpoint: https://maku.travel
Check interval: 5 minutes
Alert via: Email + Slack
```

---

## Rollback Procedures

### Quick Rollback (Netlify)

**Option 1: Netlify Dashboard**
1. Go to Deploys tab
2. Find last known good deployment
3. Click "Publish deploy"
4. Verify site is working

**Option 2: Git Revert**
```bash
# Revert to previous commit
git revert HEAD
git push origin main

# Netlify auto-deploys
# Wait 2-3 minutes
```

### Backend Rollback

**Self-Hosted:**
```bash
# SSH to server
ssh user@your-server.com
cd maku-travel

# Checkout previous version
git fetch --all
git checkout <previous-commit-hash>

# Restart services
sudo supervisorctl restart maku-backend

# Verify
curl https://api.maku.travel/api/health
```

**Cloud Platform:**
1. Go to deployments dashboard
2. Select previous deployment
3. Click "Redeploy"

### Database Rollback

**MongoDB:**
```bash
# Restore from backup
mongorestore --uri="mongodb+srv://cluster.mongodb.net" \
  --archive=backup-2024-01-01.archive \
  --drop

# Verify restoration
mongosh "mongodb+srv://cluster.mongodb.net"
use maku_production
db.stats()
```

**Supabase:**
```bash
# Restore from snapshot
supabase db restore --project-ref your-project-ref --backup-id backup-id
```

### Emergency Procedures

**If Site is Down:**

1. **Enable Maintenance Mode:**
   ```html
   <!-- Create /app/frontend/dist/maintenance.html -->
   <!DOCTYPE html>
   <html>
   <body style="text-align:center;padding:50px">
     <h1>Scheduled Maintenance</h1>
     <p>We'll be back shortly. Thank you for your patience.</p>
   </body>
   </html>
   ```

2. **Redirect All Traffic:**
   ```nginx
   # In nginx config
   location / {
     return 503;
     error_page 503 /maintenance.html;
   }
   ```

3. **Communicate:**
   - Post on status page
   - Tweet from company account
   - Send email if critical

4. **Investigate:**
   - Check Sentry for errors
   - Review server logs
   - Check database connections
   - Verify DNS
   - Check SSL certificates

---

## Troubleshooting

### Common Issues

**Issue: Frontend shows blank page**

```bash
# Check browser console for errors
# Common causes:
# 1. VITE_BACKEND_URL not set
# 2. Supabase keys missing
# 3. Build artifacts not uploaded

# Fix:
# Verify .env variables in Netlify
# Rebuild and redeploy
```

**Issue: API returns 502/503**

```bash
# Check backend service
sudo supervisorctl status maku-backend

# Check logs
sudo tail -f /var/log/supervisor/maku-backend.err.log

# Common causes:
# 1. Service crashed (restart it)
# 2. MongoDB connection failed (check MONGO_URL)
# 3. Port already in use (change port or kill process)
```

**Issue: Blockchain features not working**

```bash
# Verify mock mode enabled
grep BLOCKCHAIN_MODE /app/backend/.env

# Should be "mock" for initial deployment
# Check blockchain endpoints
curl http://localhost:8001/api/blockchain/network-info
```

**Issue: Slow page loads**

```bash
# Check Lighthouse report
lighthouse https://maku.travel --view

# Common causes:
# 1. Large bundle size (check webpack-bundle-analyzer)
# 2. No CDN configured (enable in Netlify)
# 3. Images not optimized (compress with imagemin)
# 4. No caching headers (add to netlify.toml)
```

### Support Contacts

**Emergency:**
- On-call engineer: +1-xxx-xxx-xxxx
- CTO: cto@maku.travel

**Monitoring:**
- Sentry: https://sentry.io/maku-travel
- Netlify: https://app.netlify.com
- Status Page: https://status.maku.travel

---

## Post-Launch Tasks

### Week 1

- [ ] Monitor error rates (target: < 0.5%)
- [ ] Check performance metrics
- [ ] Review user feedback
- [ ] Optimize slow endpoints
- [ ] Fix critical bugs

### Month 1

- [ ] Conduct post-mortem
- [ ] Update documentation
- [ ] Plan Phase 8 (UI/UX improvements)
- [ ] Consider real blockchain deployment
- [ ] Scale infrastructure if needed

---

## Appendix

### Deployment Checklist Summary

**Pre-Deploy:**
- [ ] Tests passing
- [ ] Environment validated
- [ ] Secrets configured
- [ ] Backup created

**Deploy:**
- [ ] Frontend deployed
- [ ] Backend deployed
- [ ] Database migrated
- [ ] DNS configured
- [ ] SSL enabled

**Post-Deploy:**
- [ ] Smoke tests passed
- [ ] Monitoring active
- [ ] Performance verified
- [ ] Team notified

**Success Criteria:**
- [ ] Site accessible
- [ ] No critical errors
- [ ] Performance > 85
- [ ] Zero downtime

---

*Last Updated: 2025-01-19*
*Version: 1.0.0*
*Contact: devops@maku.travel*
