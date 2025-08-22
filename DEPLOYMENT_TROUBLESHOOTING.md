# Deployment Troubleshooting Guide

## Current Status
- **Issue**: Redirect loop between maku.travel and www.maku.travel
- **Action Taken**: Temporarily disabled apex domain redirect in netlify.toml

## Test Steps

### 1. Test Direct Deployment
Visit: `https://maku-travel.netlify.app/test-deployment.html`
- Should show a green "Deployment Test Successful" page
- Confirms Netlify deployment is working

### 2. Test www Domain
Visit: `https://www.maku.travel`
- Should load the main React application
- No redirects should occur

### 3. Test Apex Domain
Visit: `https://maku.travel`
- Should load directly (no redirect to www)
- If still redirecting, issue is at DNS/registrar level

## DNS Configuration Checklist

### Required DNS Records
```
Type: A
Name: @
Value: 185.158.133.1

Type: A  
Name: www
Value: 185.158.133.1
```

### Check for Conflicting Records
- No CNAME records for @ (root domain)
- No conflicting A records
- No domain forwarding at registrar level

## Manual Actions Required

1. **Trigger Fresh Deployment**
   - Go to Netlify dashboard
   - Click "Trigger deploy" → "Deploy site"
   - Wait for deployment to complete

2. **Check Domain Registrar**
   - Log into your domain registrar (GoDaddy, Namecheap, etc.)
   - Look for "Domain Forwarding" or "URL Forwarding" settings
   - Disable any redirects from www.maku.travel to maku.travel

3. **Verify DNS Propagation**
   - Use https://dnschecker.org
   - Check both maku.travel and www.maku.travel
   - Ensure both point to 185.158.133.1

## Recovery Steps

### If www.maku.travel works:
1. Re-enable apex redirect in netlify.toml
2. Ensure no external redirects exist

### If redirect loop persists:
1. Contact domain registrar support
2. Check for Cloudflare or other proxy services
3. Consider using CNAME flattening

## Files Modified
- `netlify.toml`: Commented out apex redirect
- `public/test-deployment.html`: Created test page
- `public/_redirects`: Already cleaned (SPA fallback only)