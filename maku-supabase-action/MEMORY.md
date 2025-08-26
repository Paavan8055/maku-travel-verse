# MAKU Project Memory – 26 August 2025 (Sydney)

## Context & Objectives

- Build and deploy a GPT Action server for the MAKU travel business.
- Integrate Supabase backend for financial and itinerary data.
- Provide guidelines and memory for future tasks across GitHub, Supabase, Lovable dev, Railway, Netlify and domain management.

## Timeline & Progress

### 22–25 August 2025

- **Repository preparation:** Added `maku‑supabase‑action` directory with `app.py`, `bootstrap.sql`, `openapi.yaml`, `.env` and `requirements.txt` to the `maku‑travel‑verse` repository.  The server uses FastAPI and connects to Supabase via the service‑role key.
- **Supabase setup via Lovable dev:** Using the Lovable dev agent chat, created two new tables in Supabase – `funds` (user_id, balance, updated_at) and `itineraries` (id, user_id, data, created_at).  Enabled Row Level Security (RLS) with permissive policies for reading and updating.  Approved the agent's changes.
- **Environment configuration:** Populated `.env` with `SUPABASE_URL`, `SUPABASE_SERVICE_ROLE_KEY`, `APP_BASE_URL`, `ALLOWED_ORIGINS`.  Committed `.env` to the repository for local development; environment variables in Railway store the real keys.

### 25 August 2025

- **Railway deployment:** Linked the GitHub repository to a new Railway project.  Configured the root directory to `maku‑supabase‑action/server` and set environment variables.  Added `requirements.txt` to ensure build detection.
- **Start command:** Set a custom start command `uvicorn app:app --host 0.0.0.0 --port 3333` and removed the default pre‑deploy command.
- **Generated domain:** Created public domain `maku‑travel‑verse‑production.up.railway.app` via Railway's networking settings.
- **CORS update:** Updated `APP_BASE_URL` and `ALLOWED_ORIGINS` environment variables to include the Railway domain and local hosts.
- **Re‑deployment:** Redeployed the service after changing `ALLOWED_ORIGINS`.  Verified the health endpoint at `/healthz` returned `{"status":"ok"}`【556621800353373†screenshot】.

## Guidelines for Future Tasks

### GitHub

- Use the GitHub UI’s **Add file → Create new file** to add or edit repository files when a file uploader is not available.
- Commit each logical change with a clear message.
- When editing multiple files, stage and commit each file individually to avoid losing unsaved work due to page navigation.

### Supabase & Lovable dev

- Use the Lovable dev chat to run SQL on Supabase.  Compose your SQL query in the input box and click the small arrow to send; avoid pressing **Enter** (it only creates a new line).
- Lovable dev may cancel messages containing sensitive keys; **do not** send environment variables in chat.
- Wait for the agent to process (it may take ~30 seconds), review the proposed changes, then click **Approve**.
- For table changes, always include primary keys (`id` or `user_id`) and update timestamps.  Enable Row Level Security and define policies.

### Railway

- When creating a new service, set the **root directory** to the correct subfolder (e.g. `maku‑supabase‑action/server`).
- Add environment variables in the **Variables** tab (`SUPABASE_URL`, `SUPABASE_SERVICE_ROLE_KEY`, `APP_BASE_URL`, `ALLOWED_ORIGINS`).
- Define a **Custom Start Command** for Python services (e.g. `uvicorn app:app --host 0.0.0.0 --port 3333`).
- After editing environment variables, redeploy using the **Deployments** tab → 3‑dot menu → **Redeploy**.
- Generate a public domain and update `APP_BASE_URL` and CORS (`ALLOWED_ORIGINS`) accordingly.

### Netlify (for Frontend)

- Connect the repository, pick the `main` branch and root directory (e.g. `frontend`).
- Set environment variables if needed (e.g. `VITE_SUPABASE_URL`, `VITE_SUPABASE_ANON_KEY`).
- After deployment, adjust DNS if using a custom domain.

### Porkbun (Domain)

- To point a custom domain to Railway, add a CNAME record to `maku‑travel‑verse‑production.up.railway.app`.
- Wait for DNS propagation (~5–30 minutes).  Update CORS settings accordingly.

### General Best Practices

- Use **absolute dates** (e.g. “26 Aug 2025”) in conversation and commit messages to avoid confusion.
- Always store sensitive keys in environment variables, not in code or chats.
- Before executing high‑impact actions (e.g. deploying, approving schema changes), confirm with the user.
- Document every step and error to aid auditing and debugging.

## Full Audit Summary (Up to 26 Aug 2025)

- All server code and SQL scripts are stored in the `maku‑supabase‑action` directory.
- Supabase tables `funds` and `itineraries` exist with permissive RLS policies; no additional tables or triggers are currently defined.
- The GPT Action server is deployed on Railway and reachable at `https://maku‑travel‑verse‑production.up.railway.app`.
- The `/healthz` endpoint confirms service health【556621800353373†screenshot】; other endpoints (`/funds/balance`, `/funds/topup`, `/itineraries/{user_id}`) rely on Supabase connectivity.
- CORS is configured to allow requests from `localhost:3000`, `localhost:3333`, and the Railway domain.
- `.env` in the repository contains placeholders for local development; actual secrets are stored in Railway variables.
- There is no separate frontend deployed yet; this needs to be set up on Netlify or another platform.

---

This memory file serves as a living document of what has been accomplished and how to approach new tasks autonomously.
