# GitHub Secret Push Protection - Resolution Guide

## Issue
GitHub detected an OpenAI API key in commit `232833e59c83d2dab4d3e203d37fd7513f9ac766` at `docs/RAILWAY_DEPLOYMENT_GUIDE.md:116`.

---

## ⚠️ IMPORTANT: Security First

**The exposed API key MUST be rotated immediately:**
1. Go to https://platform.openai.com/api-keys
2. Delete the compromised key that starts with: `sk-svcacct-FlmF...` (REDACTED)
3. Generate a new API key
4. Update your Railway/Netlify environment variables with the new key
5. **NEVER** commit the new key to Git

---

## 🔧 Resolution Options

### Option 1: Allow Secret on GitHub (Recommended - Fastest)

Since the key is already exposed in Git history and needs to be rotated anyway:

1. **Rotate the API key first** (see above)
2. **Allow the secret on GitHub:**
   - Go to: https://github.com/Paavan8055/maku-travel-verse/security/secret-scanning/unblock-secret/34h9q7iGQdoqoK6Isqj8hjxKr0s
   - Click "Allow secret"
   - This tells GitHub you've acknowledged and handled this secret
3. **Push your code:**
   ```bash
   git push origin main
   ```

**Why this works:**
- The old key is already compromised (it's in Git history)
- Rotating the key solves the security issue
- Allowing it on GitHub lets you push
- Faster than rewriting Git history

---

### Option 2: Clean Git History (Advanced - Takes Longer)

If you want to completely remove the secret from Git history:

#### Using BFG Repo-Cleaner (Recommended)

1. **Install BFG:**
   ```bash
   # On Mac
   brew install bfg
   
   # On Ubuntu
   sudo apt-get install bfg
   
   # Or download from: https://rtyley.github.io/bfg-repo-cleaner/
   ```

2. **Create a passwords file:**
   ```bash
   cat > /tmp/secrets.txt << EOF
   sk-svcacct-REDACTED-EXPOSED-KEY-STARTS-WITH-FlmF
   EOF
   ```

3. **Clean the repository:**
   ```bash
   cd /app
   bfg --replace-text /tmp/secrets.txt .git
   git reflog expire --expire=now --all
   git gc --prune=now --aggressive
   ```

4. **Force push:**
   ```bash
   git push origin main --force
   ```

#### Using git filter-branch (Alternative)

```bash
cd /app

# Remove the secret from history
git filter-branch --tree-filter '
  if [ -f docs/RAILWAY_DEPLOYMENT_GUIDE.md ]; then
    sed -i "s/sk-svcacct-REDACTED-EXPOSED-KEY/YOUR_OPENAI_API_KEY_HERE/g" docs/RAILWAY_DEPLOYMENT_GUIDE.md
  fi
' --all

# Clean up
git reflog expire --expire=now --all
git gc --prune=now --aggressive

# Force push
git push origin main --force
```

⚠️ **Warning:** Force pushing rewrites history. Coordinate with team members.

---

## 🛡️ Prevention Measures (Already Implemented)

We've implemented comprehensive secret protection:

### 1. Enhanced Pre-commit Hook
Location: `/app/.git/hooks/pre-commit`
- Blocks commits with secrets before they happen
- Uses comprehensive pattern matching
- Allows placeholders (YOUR_KEY_HERE)

### 2. Secret Scanner Script
Location: `/app/scripts/scan-secrets.sh`
- Detects 11+ types of secrets (OpenAI, AWS, GitHub, etc.)
- Smart placeholder detection
- Colored output for clarity

### 3. .gitignore Configuration
All `.env` files are ignored:
```
.env
.env.local
.env.production
backend/.env
frontend/.env
```

### 4. Documentation Best Practices
All documentation now uses placeholders:
```bash
# ✅ GOOD - Placeholder
OPENAI_API_KEY=YOUR_OPENAI_API_KEY_HERE

# ❌ BAD - Real key
OPENAI_API_KEY=sk-proj-actual-key-here
```

---

## 🚀 Quick Start (After Resolution)

Once you've resolved the secret issue:

1. **Verify current files are clean:**
   ```bash
   /app/scripts/scan-secrets.sh
   ```

2. **Test the pre-commit hook:**
   ```bash
   # Try to commit a test file with a fake secret
   echo "sk-proj-testkey123456789012345" > /tmp/test.txt
   git add /tmp/test.txt
   git commit -m "test"  # Should be blocked
   rm /tmp/test.txt
   ```

3. **Normal workflow:**
   ```bash
   git add .
   git commit -m "Your message"  # Hook runs automatically
   git push origin main
   ```

---

## 📋 Checklist

- [ ] Rotate the compromised OpenAI API key
- [ ] Update Railway/Netlify environment variables with new key
- [ ] Choose resolution option (Allow on GitHub or Clean History)
- [ ] Test the new secret scanner
- [ ] Successfully push to GitHub
- [ ] Verify deployment with new key
- [ ] Document new key location (Supabase Vault or Railway)

---

## 🔐 Best Practices Going Forward

1. **NEVER commit real API keys**
   - Use placeholders in documentation
   - Store real keys in environment variables
   - Use Supabase Vault for production secrets

2. **Use the secret scanner**
   ```bash
   /app/scripts/scan-secrets.sh
   ```

3. **Verify before pushing**
   ```bash
   git diff HEAD
   ```

4. **Rotate keys regularly**
   - Every 90 days minimum
   - Immediately after any exposure
   - When team members leave

5. **Monitor for leaks**
   - Enable GitHub Secret Scanning: https://github.com/Paavan8055/maku-travel-verse/settings/security_analysis
   - Set up alerts for exposed secrets
   - Regular security audits

---

## 🆘 Need Help?

If you encounter issues:

1. Check the error message carefully
2. Run the secret scanner: `/app/scripts/scan-secrets.sh`
3. Verify .env files aren't staged: `git status`
4. Review the pre-commit hook logs
5. Contact the team if stuck

---

**Remember:** Security is not optional. Always protect your API keys! 🔐
