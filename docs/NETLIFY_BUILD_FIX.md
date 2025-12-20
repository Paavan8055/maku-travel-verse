# Netlify Build & Deployment Guide

## Build Configuration

### Current Setup
- **Build Base:** `frontend/`
- **Build Command:** `yarn install --frozen-lockfile && yarn build`
- **Publish Directory:** `build` (NOT `dist` - Vite outputs to `build`)
- **Node Version:** 18
- **Yarn Version:** 1.22.22

### Build Output Location
Vite is configured to output to `frontend/build/` (not `dist`).
This is set in `/app/frontend/vite.config.ts`:
```typescript
build: {
  outDir: 'build',
  ...
}
```

---

## Environment Variables Required in Netlify

### Critical Variables (MUST SET)
```bash
# Supabase
VITE_SUPABASE_URL=https://iomeddeasarntjhqzndu.supabase.co
VITE_SUPABASE_ANON_KEY=REDACTED_SUPABASE_KEY
VITE_SUPABASE_PROJECT_ID=iomeddeasarntjhqzndu
VITE_SUPABASE_PUBLISHABLE_KEY=REDACTED_SUPABASE_KEY

# Backend URL (Railway or your backend service)
VITE_REACT_APP_BACKEND_URL=https://your-backend-url.railway.app
REACT_APP_BACKEND_URL=https://your-backend-url.railway.app

# WebSocket Port
WDS_SOCKET_PORT=443

# Feature Flags
VITE_OFFSEASON_FEATURES=true
REACT_APP_ENABLE_VISUAL_EDITS=false
```

### Optional Variables
```bash
# Gemini AI (if using)
VITE_GEMINI_API_KEY=your-gemini-api-key

# Node Environment
NODE_ENV=production
```

---

## Common Netlify Build Failures & Fixes

### 1. Wrong Publish Directory
**Error:** "Publish directory not found"
**Fix:** Ensure `publish = "build"` in netlify.toml (NOT `dist` or `frontend/dist`)

### 2. Missing Environment Variables
**Error:** "Vite config error" or blank site
**Fix:** Set all VITE_* environment variables in Netlify UI:
- Go to: Site Settings → Environment Variables
- Add all variables from frontend/.env

### 3. Build Command Fails
**Error:** "yarn build failed"
**Possible Causes:**
- Missing dependencies
- TypeScript errors
- Import errors
- Memory issues

**Fix:** Check build logs for specific error, usually one of:
```bash
# Fix 1: Clear cache
yarn cache clean

# Fix 2: Update dependencies
yarn install --frozen-lockfile

# Fix 3: Increase memory
NODE_OPTIONS=--max_old_space_size=4096 yarn build
```

### 4. Backend URL Not Set
**Error:** Site loads but API calls fail
**Fix:** Set VITE_REACT_APP_BACKEND_URL to your Railway backend URL

---

## Step-by-Step Netlify Deployment

### 1. Connect Repository
1. Log into Netlify
2. Click "Add new site" → "Import an existing project"
3. Connect to GitHub
4. Select repository: `Paavan8055/maku-travel-verse`
5. Select branch: `main`

### 2. Configure Build Settings
**Base directory:** `frontend`
**Build command:** `yarn install --frozen-lockfile && yarn build`
**Publish directory:** `build`

### 3. Set Environment Variables
Go to Site Settings → Environment Variables → Add:

**Copy these exactly:**
```
VITE_SUPABASE_URL=https://iomeddeasarntjhqzndu.supabase.co
VITE_SUPABASE_ANON_KEY=REDACTED_SUPABASE_KEY
VITE_SUPABASE_PROJECT_ID=iomeddeasarntjhqzndu
VITE_REACT_APP_BACKEND_URL=YOUR_RAILWAY_BACKEND_URL
REACT_APP_BACKEND_URL=YOUR_RAILWAY_BACKEND_URL
WDS_SOCKET_PORT=443
VITE_OFFSEASON_FEATURES=true
NODE_ENV=production
```

### 4. Deploy
Click "Deploy site"

### 5. Verify
Once deployed:
- Check build logs for errors
- Visit site URL
- Test authentication
- Test booking flow
- Verify all dashboards load

---

## Troubleshooting Netlify Deploy

### Check Build Logs
1. Go to Netlify dashboard
2. Click on latest deploy
3. Scroll to "Deploy log"
4. Look for errors (usually at the bottom)

### Common Errors

#### "Module not found"
**Cause:** Import path error or missing dependency
**Fix:** 
```bash
# Check package.json has all dependencies
# Verify import paths use @/ alias correctly
# Check for typos in component names
```

#### "Build exceeded time limit"
**Cause:** Large dependencies or slow build
**Fix:** 
- Add to netlify.toml: `command = "CI= yarn build"`
- Optimize dependencies
- Use dynamic imports for large components

#### "Command failed with exit code 1"
**Cause:** TypeScript errors or linting failures
**Fix:**
```bash
# Test locally first
cd frontend
yarn build

# If it fails locally, fix errors first
# Then commit and redeploy
```

#### "Site loads but is blank"
**Cause:** Missing environment variables or wrong backend URL
**Fix:**
- Check browser console for errors
- Verify VITE_REACT_APP_BACKEND_URL is set
- Ensure Supabase keys are correct

---

## Testing Locally Before Deploy

### Full Production Build Test
```bash
cd /app/frontend

# Clean build
rm -rf build node_modules/.vite

# Install dependencies
yarn install --frozen-lockfile

# Build for production
yarn build

# Check output
ls -la build/
ls -la build/assets/ | head -20

# Serve locally to test
npx serve -s build -p 3001
# Visit: http://localhost:3001
```

### Verify Build Size
```bash
du -sh build/
# Should be < 50MB

du -sh build/assets/
# Should be < 45MB
```

---

## Current Build Status

### Local Build (Verified ✅)
- **Status:** ✅ SUCCESS
- **Time:** 27.51 seconds
- **Output:** `/app/frontend/build/`
- **Size:** ~45MB assets
- **Warnings:** Large chunks (expected for comprehensive app)

### Netlify Build (To Fix)
**Issue:** Outdated deployment on https://maku.travel/

**Likely Causes:**
1. ✅ FIXED: Wrong publish directory (was `frontend/dist`, now `build`)
2. ⚠️ Pending: Environment variables not set in Netlify
3. ⚠️ Pending: Backend URL not configured
4. ⚠️ Pending: Need to trigger new deploy after fixes

---

## Immediate Actions for Netlify

### Action 1: Update netlify.toml (Already Done ✅)
Changed `publish = "frontend/dist"` to `publish = "build"`

### Action 2: Set Environment Variables in Netlify UI
1. Go to: https://app.netlify.com/sites/YOUR_SITE/settings/deploys#environment
2. Add all variables from section above
3. **Critical:** Set your Railway backend URL

### Action 3: Trigger New Deploy
Either:
- Push to GitHub (will auto-deploy)
- OR Click "Trigger deploy" in Netlify UI

### Action 4: Verify Deployment
- Check build logs
- Visit https://maku.travel/
- Test authentication
- Verify dashboards load

---

## Expected Build Output

### Successful Build Shows:
```
✓ built in 25-30 seconds
✓ Output to: build/
✓ index.html
✓ assets/*.js (150+ files)
✓ assets/*.css (20+ files)
```

### Failed Build Shows:
```
✗ error: [specific error message]
✗ Command failed with exit code 1
```

---

## Post-Deployment Checklist

- [ ] Build completes successfully
- [ ] No TypeScript errors
- [ ] Site loads at https://maku.travel/
- [ ] Authentication works
- [ ] Dashboards load
- [ ] Backend API calls work
- [ ] No console errors
- [ ] Mobile responsive

---

## Support

If Netlify deploy still fails:
1. Share the complete build log
2. Verify environment variables are set
3. Check Railway backend is running
4. Ensure GitHub push went through

**Current Status:** netlify.toml fixed, ready for redeploy after GitHub secret issue is resolved.
