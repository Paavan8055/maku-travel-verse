# Maku Travel OTA

Maku Travel is an open-source Online Travel Agency built with Vite, React and Supabase. It provides a unified booking experience for flights, hotels and activities while monitoring provider health and costs in real time.

## Features
- Search and book flights, hotels and activities
- Personalized offers and saved travel preferences
- Stripe-powered checkout with vaulted payment methods
- Provider rotation, quota monitoring and circuit breakers
- Admin dashboard for system metrics and provider analytics

## Provider API integrations
Edge functions in `supabase/functions` wrap external providers and expose simple REST endpoints. Current integrations include:

- **Amadeus** – flight, hotel and activity data
- **Sabre** – PNR management and flight booking
- **HotelBeds** – hotel content and availability
- **Stripe** – payments and webhooks

## Environment variables
### Frontend (`.env.local`)
Create a `.env.local` in the project root so Vite can load your Supabase credentials:

```
VITE_SUPABASE_URL=your-supabase-url
VITE_SUPABASE_ANON_KEY=your-supabase-anon-key
```

### Edge functions (`supabase/.env`)
Edge functions use service-role credentials and provider API keys. Copy `.env.example` to `supabase/.env` and fill in values such as:

```
SUPABASE_URL=...
SUPABASE_SERVICE_ROLE_KEY=...
AMADEUS_CLIENT_ID=...
AMADEUS_CLIENT_SECRET=...
HOTELBEDS_API_KEY=...
HOTELBEDS_API_SECRET=...
SABRE_CLIENT_ID=...
SABRE_CLIENT_SECRET=...
STRIPE_SECRET_KEY=...
```

Restart the dev server after creating or updating environment files.

## Running locally
1. Install dependencies: `npm install`
2. Start the Vite dev server: `npm run dev`
3. Run edge functions locally: `supabase functions serve <function> --env-file supabase/.env`
4. Visit [http://localhost:5173](http://localhost:5173) to use the app.
5. Access the admin dashboard at [http://localhost:5173/admin](http://localhost:5173/admin) and sign in with a Supabase user marked as an admin.

## Deployment
### Supabase
Apply migrations and deploy edge functions:

```
supabase db push
supabase functions deploy <function> --project-ref YOUR_REF
# or deploy all functions
./scripts/deploy.sh
```

### Netlify
1. Connect this repository in the Netlify dashboard.
2. Set build command to `npm run build` and publish directory to `dist`.
3. Configure the same environment variables used locally (Supabase keys, provider API keys, Stripe keys, etc.).
4. Deploy via the Netlify UI or `netlify deploy --prod`.

### Vercel
1. Connect this repository in the Vercel dashboard.
2. Vercel uses `vercel.json` to run `npm run build` and serve the `dist` output directory.
3. Add the following environment variables in **Project Settings → Environment Variables**:
   - `VITE_SUPABASE_URL`
   - `VITE_SUPABASE_ANON_KEY`
   - `SUPABASE_URL`
   - `SUPABASE_SERVICE_ROLE_KEY`
   - `AMADEUS_CLIENT_ID`
   - `AMADEUS_CLIENT_SECRET`
   - `HOTELBEDS_API_KEY`
   - `HOTELBEDS_API_SECRET`
   - `SABRE_CLIENT_ID`
   - `SABRE_CLIENT_SECRET`
   - `STRIPE_SECRET_KEY`
4. Preview deployments for pull requests and production builds from `main` mirror the Netlify setup.

## Tests
Run the Vitest suite with:

```
npm test
```
