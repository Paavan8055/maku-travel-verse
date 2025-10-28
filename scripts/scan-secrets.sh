#!/bin/bash
# Comprehensive Secret Scanner for Git Commits
# Prevents accidental secret commits

set -e

# Colors for output
RED='\033[0;31m'
YELLOW='\033[1;33m'
GREEN='\033[0;32m'
NC='\033[0m' # No Color

echo "🔍 Scanning for secrets before commit..."

# Define secret patterns to detect
declare -a SECRET_PATTERNS=(
    "sk-[a-zA-Z0-9]{20,}" # OpenAI keys
    "sk-proj-[a-zA-Z0-9_-]{20,}" # OpenAI project keys
    "sk-svcacct-[a-zA-Z0-9_-]{20,}" # OpenAI service account keys
    "sk-emergent-[a-zA-Z0-9]{10,}" # Emergent keys
    "AKIA[0-9A-Z]{16}" # AWS Access Key
    "AIza[0-9A-Za-z-_]{35}" # Google API Key
    "ghp_[0-9a-zA-Z]{36}" # GitHub Personal Access Token
    "gho_[0-9a-zA-Z]{36}" # GitHub OAuth Token
    "glpat-[0-9a-zA-Z_-]{20}" # GitLab Personal Access Token
    "eyJ[0-9a-zA-Z_-]*\\.eyJ[0-9a-zA-Z_-]*\\.[0-9a-zA-Z_-]*" # JWT tokens (long)
)

# Define allowed placeholder patterns (won't trigger alerts)
declare -a ALLOWED_PATTERNS=(
    "YOUR_KEY_HERE"
    "YOUR_OPENAI_API_KEY_HERE"
    "YOUR_API_KEY_HERE"
    "sk-proj-..."
    "sk-..."
    "example.com"
    "localhost"
    "REPLACE_WITH"
    "PLACEHOLDER"
)

# Files to scan (staged files)
STAGED_FILES=$(git diff --cached --name-only --diff-filter=ACM)

if [ -z "$STAGED_FILES" ]; then
    echo "✅ No files to scan"
    exit 0
fi

SECRETS_FOUND=0

# Function to check if a line contains allowed placeholder
is_allowed_placeholder() {
    local line="$1"
    for allowed in "${ALLOWED_PATTERNS[@]}"; do
        if [[ "$line" =~ $allowed ]]; then
            return 0
        fi
    done
    return 1
}

# Scan each staged file
while IFS= read -r file; do
    # Skip binary files
    if file "$file" | grep -q "binary"; then
        continue
    fi
    
    # Skip if file doesn't exist (deleted files)
    if [ ! -f "$file" ]; then
        continue
    fi
    
    # Check each secret pattern
    for pattern in "${SECRET_PATTERNS[@]}"; do
        # Find matches
        matches=$(grep -n -E "$pattern" "$file" 2>/dev/null || true)
        
        if [ -n "$matches" ]; then
            # Check if it's an allowed placeholder
            while IFS= read -r match; do
                if ! is_allowed_placeholder "$match"; then
                    echo -e "${RED}❌ Secret detected in: $file${NC}"
                    echo -e "${YELLOW}   Line: $match${NC}"
                    SECRETS_FOUND=$((SECRETS_FOUND + 1))
                fi
            done <<< "$matches"
        fi
    done
done <<< "$STAGED_FILES"

# Check environment files
if echo "$STAGED_FILES" | grep -q "\.env"; then
    echo -e "${RED}⚠️  WARNING: .env file detected in commit${NC}"
    echo -e "${YELLOW}   .env files should never be committed${NC}"
    SECRETS_FOUND=$((SECRETS_FOUND + 1))
fi

# Result
if [ $SECRETS_FOUND -gt 0 ]; then
    echo ""
    echo -e "${RED}╔════════════════════════════════════════════════════════╗${NC}"
    echo -e "${RED}║  ❌ COMMIT BLOCKED: Secrets detected!                 ║${NC}"
    echo -e "${RED}╚════════════════════════════════════════════════════════╝${NC}"
    echo ""
    echo "📋 To fix this issue:"
    echo "  1. Remove the actual secrets from the files"
    echo "  2. Replace with placeholders like: YOUR_KEY_HERE"
    echo "  3. Store secrets in .env files (which are gitignored)"
    echo "  4. Re-stage your files and commit again"
    echo ""
    echo "🔐 For production secrets, use:"
    echo "  • Supabase Vault (for API keys)"
    echo "  • Railway Environment Variables"
    echo "  • Never commit .env files"
    echo ""
    exit 1
else
    echo -e "${GREEN}✅ No secrets detected - commit allowed${NC}"
    exit 0
fi
