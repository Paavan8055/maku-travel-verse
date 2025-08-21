# Welcome to your Lovable project

## Project info

**URL**: https://lovable.dev/projects/70b60dfe-602f-470b-aa3d-b4fc2fe1e77e

## How can I edit this code?

There are several ways of editing your application.

**Use Lovable**

Simply visit the [Lovable Project](https://lovable.dev/projects/70b60dfe-602f-470b-aa3d-b4fc2fe1e77e) and start prompting.

Changes made via Lovable will be committed automatically to this repo.

**Use your preferred IDE**

If you want to work locally using your own IDE, you can clone this repo and push changes. Pushed changes will also be reflected in Lovable.

The only requirement is having Node.js & npm installed - [install with nvm](https://github.com/nvm-sh/nvm#installing-and-updating)

Follow these steps:

```sh
# Step 1: Clone the repository using the project's Git URL.
git clone <YOUR_GIT_URL>

# Step 2: Navigate to the project directory.
cd <YOUR_PROJECT_NAME>

# Step 3: Install the necessary dependencies.
npm i

# Step 4: Start the development server with auto-reloading and an instant preview.
npm run dev
```

**Edit a file directly in GitHub**

- Navigate to the desired file(s).
- Click the "Edit" button (pencil icon) at the top right of the file view.
- Make your changes and commit the changes.

**Use GitHub Codespaces**

- Navigate to the main page of your repository.
- Click on the "Code" button (green button) near the top right.
- Select the "Codespaces" tab.
- Click on "New codespace" to launch a new Codespace environment.
- Edit files directly within the Codespace and commit and push your changes once you're done.

## What technologies are used for this project?

This project is built with:

- Vite
- TypeScript
- React
- shadcn-ui
- Tailwind CSS

## Logging

Control log verbosity with environment variables:

- `VITE_LOG_LEVEL` for client-side logging
- `LOG_LEVEL` for server-side functions

Both default to `info` in production and `debug` otherwise.

## How can I deploy this project?

Simply open [Lovable](https://lovable.dev/projects/70b60dfe-602f-470b-aa3d-b4fc2fe1e77e) and click on Share -> Publish.

## Can I connect a custom domain to my Lovable project?

Yes, you can!

To connect a domain, navigate to Project > Settings > Domains and click Connect Domain.

Read more here: [Setting up a custom domain](https://docs.lovable.dev/tips-tricks/custom-domain#step-by-step-guide)

## Database & Booking Enhancements

### New Booking Tables & APIs

1. **Review and run migrations:**
   ```bash
   supabase db push
   ```

2. **Deploy edge functions:**
   ```bash
   supabase functions deploy validate-passport generate-offers --project-ref YOUR_REF
   ```

3. **Components available:**
   - `UserPreferencesForm` - Capture and update user travel preferences
   - `PaymentVault` - Manage saved payment methods  
   - `OffersWidget` - Display dynamic offers and discounts
   - `LocalTipsPanel` - Show local insights and tips

### Database Tables Created

- `user_preferences` - Store user travel preferences (airlines, seat class, etc.)
- `payment_methods` - Securely store payment method details
- `passport_info` - Store passport information and verification status
- `saved_favorites` - User's favorite hotels, flights, and experiences
- `visa_documents` - Track visa applications and documentation
- `dynamic_offers` - Time-limited offers and discounts
- `local_insights` - Community-curated local tips and advice

### Integrating Booking Enhancements

1. **Deploy edge functions:**
   ```bash
   supabase functions deploy validate-passport generate-offers --project-ref YOUR_REF
   ```

2. **Run tests:**
   ```bash
   npm test
   ```

3. **Restart your dev server and enjoy one-click, personalized booking!**

### Unified Search Integration

1. Add search pages and components under `/src/pages/search/` and `/src/features/search/`.

2. Deploy Supabase functions:
   ```bash
   supabase functions deploy flight-search hotel-search activity-search --project-ref YOUR_REF
   ```

3. Restart dev server and verify styles match existing layout/colors.
