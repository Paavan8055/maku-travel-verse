# Rotation request email templates

Use these templates to notify providers and internal teams. Replace bracketed placeholders (for example: [PROJECT_NAME], [OWNER_EMAIL]).

## 1) Supabase — rotation request (internal)

**Subject:** [URGENT] Rotate Supabase service_role key (security incident)

Hi [Owner/Team],

During a repository security audit we discovered a Supabase service_role key in the repo history. We have removed the file from the repository history, but the key may have been exposed. Please rotate the service_role key for the project [PROJECT_NAME] immediately and update all usage locations (server envs, CI secrets, deploy providers).

Steps we recommend you take now:

1. Visit the Supabase dashboard and open the relevant project.
2. Navigate to Settings → API.
3. Regenerate the service_role key (create a new key) and copy it.
4. Update the following places with the new key:
   - CI provider secrets (GitHub Actions secrets)
   - Hosting provider environment variables (Railway/Render/Fly/Heroku)
   - Any server-side apps or deployments that use this key
5. If the key was used in production, consider revoking sessions and issuing a rolling restart where necessary.

Suggested Slack/Email text to end-users:

"We detected a committed Supabase service_role key in the repo history. The repository history has been cleaned; however the key should be rotated immediately. Please follow the rotation instructions and confirm when complete."

Contact: [security@example.com] (include rotation confirmation and any suspicious activity found)

---

## 2) Stripe — rotation request (internal)

**Subject:** [URGENT] Rotate Stripe secret keys (security incident)

Hi [Payments/Engineering Team],

A Stripe secret key (or a file that may contain one) was found in our repository history. Please rotate any secret API keys for the account [STRIPE_ACCOUNT_NAME] immediately.

Steps:

1. Sign in to the Stripe Dashboard.
2. Developers → API keys.
3. Create a new secret key and update the following places:
   - CI secrets
   - Server environment variables
   - Any external services using the key
4. Revoke older keys after confirming the new key functions correctly.

Suggested message:

"Rotate Stripe API keys immediately. A secret key was discovered in the repository history and has been removed. Please confirm once completed."

Contact: [payments@example.com]

---

## 3) Amadeus / Hotelbeds / other travel APIs — rotation request (provider)

**Subject:** [ACTION REQUIRED] Rotate API credentials for [PROVIDER] (security incident)

Hello [Provider Support],

We have discovered an instance where API credentials for [PROVIDER] were committed to our repository history for project [PROJECT_NAME]. We have removed the credentials from our repository history and would like to request rotation/revocation of the affected credentials and assistance confirming whether the key was used in a way that requires further remediation.

Request:

- Please revoke the credential ID [CREDENTIAL_ID] and issue a new credential.
- If possible, provide logs showing recent activity for the credential for the last 30 days so we can triage any suspicious usage.

Contact: [security@example.com]

---

## 4) Generic external provider rotation template (internal)

**Subject:** [URGENT] Rotate [PROVIDER] credentials — security incident

Team,

A credential for [PROVIDER] was exposed in the repository history and has been removed from the repo. Please rotate the credential and update all environments and CI secrets that rely on it.

Steps:

1. Rotate the credential in the provider console.
2. Update CI and environment variables.
3. Revoke any old credentials and regenerate any tokens if applicable.

Notify the security team once complete.

---

## 5) Short Slack alert (for rapid notification)


"[SECURITY] We found a committed secret in the repo history. Files removed from history and PR created: <https://github.com/Paavan8055/maku-travel-verse/pull/48>. Rotate any keys you own now (Supabase, Stripe, third-party APIs). Ping [security] when done."

---

Generated for `maku-travel-verse` security incident.
