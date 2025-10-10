# Netlify Deployment Guide

This guide documents the Netlify-only deployment workflow for MAKU.Travel.

## 1. Connect the repository
1. Visit the [Netlify dashboard](https://app.netlify.com/).
2. Choose **Add new site → Import an existing project** and connect the GitHub repository.
3. Authorize Netlify to access the repository when prompted.

## 2. Build settings
- **Build command:** `npm run build`
- **Publish directory:** `dist`
- **Node version:** `20.x` (configure under *Site settings → Build & deploy → Environment*)

## 3. Environment variables
Configure the same variables that are required locally:
- `VITE_SUPABASE_URL`
- `VITE_SUPABASE_ANON_KEY`
- `SUPABASE_URL`
- `SUPABASE_SERVICE_ROLE_KEY`
- Provider credentials (Amadeus, HotelBeds, Sabre)
- `STRIPE_SECRET_KEY`

For staging or preview contexts, use Netlify [deploy contexts](https://docs.netlify.com/site-deploys/overview/#deploy-contexts) to override values as needed.

## 4. GitHub Actions integration
The workflow defined in `.github/workflows/netlify-on-push.yml` triggers a Netlify build hook whenever commits land on `main`. Create a build hook in Netlify and add the URL to the `NETLIFY_BUILD_HOOK_URL` repository secret to enable this automation.

## 5. Manual deploys
You can trigger manual deploys with the Netlify CLI:

```bash
npm install -g netlify-cli
netlify login
netlify deploy --prod
```

## 6. Monitoring
- Monitor deploy logs in the Netlify dashboard.
- Review headers and asset optimization with the Netlify inspector.
- Use the Netlify analytics or integrate with your existing monitoring stack for uptime and performance tracking.
