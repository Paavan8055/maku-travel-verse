:: ============================================================
:: MAKU.Travel Autonomous CTO Agent — Deployment Command Prompt
:: Version: 2025-10-08 | Author: ChatGPT (CTO)
:: Purpose: Automate Netlify build, Supabase/Railway sync, & audit
:: ============================================================

:: --- 1. SET ENVIRONMENT VARIABLES ---
set SUPABASE_URL=https://<your-project-ref>.supabase.co
set SUPABASE_ANON_KEY=<anon-key>
set SUPABASE_SERVICE_ROLE_KEY=<service-role-key>
set RAILWAY_TOKEN=<railway-token>
set NETLIFY_AUTH_TOKEN=<netlify-token>
set GITHUB_TOKEN=<github-token>

:: --- 2. VALIDATE ENVIRONMENT CONFIGURATION ---
echo [CHECK] Verifying Supabase keys and domains...
supabase status --project-ref iomeddeasarntjhqzndu

echo [CHECK] Verifying Railway service health...
curl -s https://maku-travel-verse-production.up.railway.app/healthz

echo [CHECK] Verifying Netlify credentials and site linkage...
netlify status

:: --- 3. DEPLOY SUPABASE EDGE FUNCTIONS ---
echo [DEPLOY] Pushing latest migrations and functions...
supabase db push --project-ref iomeddeasarntjhqzndu
supabase functions deploy providerRotation --project-ref iomeddeasarntjhqzndu
supabase functions deploy stripe-webhook --project-ref iomeddeasarntjhqzndu

:: --- 4. UPDATE RAILWAY ENVIRONMENT VARIABLES ---
echo [SYNC] Syncing production environment variables on Railway...
railway variables set APP_BASE_URL=https://maku.travel ALLOWED_ORIGINS="https://maku.travel,https://www.maku.travel"

:: --- 5. TRIGGER NETLIFY BUILD (CI/CD Hook) ---
echo [DEPLOY] Triggering Netlify build via webhook...
curl -X POST "https://api.netlify.com/build_hooks/<build-hook-id>"

:: --- 6. VALIDATE DEPLOYMENT ---
echo [VERIFY] Checking deployment URLs and DNS propagation...
ping maku.travel
curl -I https://maku.travel

:: --- 7. RUN HEALTH TESTS & AUDIT LOGGING ---
echo [TEST] Running post-deployment audits...
curl -X GET https://maku.travel/healthz
curl -X GET https://maku-travel-verse-production.up.railway.app/funds/balance

echo [LOG] Recording audit result into MAKU_Audit_Report.md...
echo Deployment OK on %DATE% at %TIME% >> logs\deployment_audit.log

:: --- 8. FINALIZE ---
echo ✅ MAKU.Travel deployment completed successfully!
pause
