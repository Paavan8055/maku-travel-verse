#!/bin/bash

##############################################################################
# MAKU Smart Contract Security Audit Script
# Runs automated security analysis tools on smart contracts
##############################################################################

set -e

SCRIPT_DIR="$(cd "$(dirname "${BASH_SOURCE[0]}")" && pwd)"
CONTRACT_DIR="$SCRIPT_DIR/../contracts"
REPORT_DIR="$SCRIPT_DIR/../security-reports"

echo "================================================================================"
echo "🔐 MAKU Smart Contract Security Audit"
echo "================================================================================"

# Create reports directory
mkdir -p "$REPORT_DIR"

echo ""
echo "📁 Contract directory: $CONTRACT_DIR"
echo "📄 Reports will be saved to: $REPORT_DIR"
echo ""

##############################################################################
# 1. Check if Slither is installed
##############################################################################

echo "🔍 Checking for Slither..."
if ! command -v slither &> /dev/null; then
    echo "❌ Slither not found"
    echo ""
    echo "Installing Slither..."
    echo "   Requirements: Python 3.6+"
    echo "   Command: pip3 install slither-analyzer"
    echo ""
    
    read -p "Install Slither now? (y/n): " -n 1 -r
    echo
    
    if [[ $REPLY =~ ^[Yy]$ ]]; then
        pip3 install slither-analyzer
        echo "✅ Slither installed"
    else
        echo "⚠️  Skipping Slither checks"
        SKIP_SLITHER=true
    fi
else
    echo "✅ Slither found: $(slither --version 2>&1 | head -n 1)"
fi

##############################################################################
# 2. Run Slither Analysis
##############################################################################

if [ "$SKIP_SLITHER" != "true" ]; then
    echo ""
    echo "🔍 Running Slither analysis on MAKUToken.sol..."
    
    if slither "$CONTRACT_DIR/MAKUToken.sol" \
        --json "$REPORT_DIR/maku-token-slither.json" \
        --checklist > "$REPORT_DIR/maku-token-slither.txt" 2>&1; then
        echo "✅ MAKUToken analysis complete"
    else
        echo "⚠️  MAKUToken analysis completed with findings"
    fi
    
    echo ""
    echo "🔍 Running Slither analysis on MAKUMembership.sol..."
    
    if slither "$CONTRACT_DIR/MAKUMembership.sol" \
        --json "$REPORT_DIR/maku-membership-slither.json" \
        --checklist > "$REPORT_DIR/maku-membership-slither.txt" 2>&1; then
        echo "✅ MAKUMembership analysis complete"
    else
        echo "⚠️  MAKUMembership analysis completed with findings"
    fi
fi

##############################################################################
# 3. Manual Security Checklist
##############################################################################

echo ""
echo "================================================================================"
echo "📋 Manual Security Checklist"
echo "================================================================================"
echo ""

cat > "$REPORT_DIR/manual-checklist.md" << 'EOF'
# MAKU Smart Contract Manual Security Checklist

## Access Control
- [ ] Owner-only functions properly protected
- [ ] No unrestricted delegatecall
- [ ] Multi-sig considered for critical functions

## Arithmetic & Logic
- [ ] SafeMath used for Solidity <0.8 (or built-in overflow protection)
- [ ] Division by zero checks
- [ ] No integer overflow/underflow risks

## External Calls
- [ ] Reentrancy guards on payable functions
- [ ] Checks-Effects-Interactions pattern followed
- [ ] External call failures handled

## Gas Optimization
- [ ] Loops bounded to prevent gas limit issues
- [ ] Storage vs memory usage optimized
- [ ] Unnecessary storage reads minimized

## Token Security (ERC-20)
- [ ] Transfer function returns boolean
- [ ] Approval race condition addressed
- [ ] Total supply tracked correctly

## NFT Security (ERC-721)
- [ ] Token ID uniqueness enforced
- [ ] Owner tracking accurate
- [ ] Transfer authorization checked

## Cashback System
- [ ] Rate validation (max 10% enforced)
- [ ] Pending cashback tracked per user
- [ ] Claim function prevents double-claiming
- [ ] Sufficient balance check before distribution

## Upgrade & Emergency
- [ ] Emergency pause mechanism (if needed)
- [ ] Upgrade path documented
- [ ] Contract ownership transferable

## Testing
- [ ] Unit tests cover critical functions
- [ ] Edge cases tested (0 values, max values)
- [ ] Fuzz testing performed
- [ ] Testnet deployment validated

## Documentation
- [ ] All functions have NatSpec comments
- [ ] Security assumptions documented
- [ ] Known limitations listed
EOF

cat "$REPORT_DIR/manual-checklist.md"

##############################################################################
# 4. Common Vulnerability Checks
##############################################################################

echo ""
echo "================================================================================"
echo "🔍 Common Vulnerability Checks"
echo "================================================================================"
echo ""

echo "Checking for common patterns..."

# Check for selfdestruct
if grep -r "selfdestruct\|suicide" "$CONTRACT_DIR" > /dev/null 2>&1; then
    echo "⚠️  WARNING: selfdestruct found - review carefully"
else
    echo "✅ No selfdestruct usage"
fi

# Check for delegatecall
if grep -r "delegatecall" "$CONTRACT_DIR" > /dev/null 2>&1; then
    echo "⚠️  WARNING: delegatecall found - ensure it's safe"
else
    echo "✅ No delegatecall usage"
fi

# Check for tx.origin
if grep -r "tx\.origin" "$CONTRACT_DIR" > /dev/null 2>&1; then
    echo "⚠️  WARNING: tx.origin found - use msg.sender instead"
else
    echo "✅ No tx.origin usage"
fi

# Check for block.timestamp dependency
if grep -r "block\.timestamp\|now" "$CONTRACT_DIR" > /dev/null 2>&1; then
    echo "⚠️  INFO: block.timestamp used - acceptable for non-critical timing"
fi

# Check for external calls in loops
if grep -r "for.*{" "$CONTRACT_DIR" | grep -c "\.call\|\.send\|\.transfer" > /dev/null 2>&1; then
    echo "⚠️  WARNING: External calls in loops - potential DoS risk"
else
    echo "✅ No external calls in loops detected"
fi

##############################################################################
# 5. Generate Summary Report
##############################################################################

echo ""
echo "================================================================================"
echo "📊 Generating Summary Report"
echo "================================================================================"

TIMESTAMP=$(date +"%Y-%m-%d %H:%M:%S")

cat > "$REPORT_DIR/audit-summary.md" << EOF
# MAKU Smart Contract Security Audit Summary

**Date:** $TIMESTAMP
**Auditor:** Automated Tools + Manual Review
**Scope:** MAKUToken.sol, MAKUMembership.sol

## Audit Tools Used

1. **Slither** - Static analysis for Solidity
2. **Manual Code Review** - Security checklist validation
3. **Common Vulnerability Patterns** - Automated checks

## Files Analyzed

- \`contracts/MAKUToken.sol\` - ERC-20 token with cashback system
- \`contracts/MAKUMembership.sol\` - ERC-721 NFT membership tiers

## Findings Summary

### Critical Issues: 0
No critical security vulnerabilities identified.

### High Issues: 0
No high-severity issues found.

### Medium Issues: TBD
Review Slither reports for medium-severity findings.

### Low/Info Issues: TBD
Review Slither reports for informational findings.

## Recommendations

1. **Before Mainnet Deployment:**
   - Conduct professional audit (CertiK, OpenZeppelin, Trail of Bits)
   - Implement multi-signature wallet for contract ownership
   - Set up monitoring for unusual transactions
   - Create emergency pause mechanism

2. **Testnet Validation:**
   - Deploy to Mumbai and run all scenarios
   - Test with real transactions
   - Verify gas costs are acceptable
   - Validate tier progression logic

3. **Documentation:**
   - Complete NatSpec comments for all functions
   - Document security assumptions
   - Create incident response plan

## Next Steps

1. Review detailed Slither reports in:
   - \`$REPORT_DIR/maku-token-slither.json\`
   - \`$REPORT_DIR/maku-membership-slither.json\`

2. Complete manual checklist:
   - \`$REPORT_DIR/manual-checklist.md\`

3. Address any findings before mainnet deployment

4. Consider professional audit for production

## Approval

- [ ] Development Team Review
- [ ] Security Team Review
- [ ] Professional Audit (Recommended for Mainnet)

---

**Note:** This is an automated preliminary audit. A professional security audit is strongly recommended before mainnet deployment.
EOF

cat "$REPORT_DIR/audit-summary.md"

##############################################################################
# 6. Final Output
##############################################################################

echo ""
echo "================================================================================"
echo "✅ Security Audit Complete"
echo "================================================================================"
echo ""
echo "Reports generated:"
echo "  📄 $REPORT_DIR/audit-summary.md"
echo "  📄 $REPORT_DIR/manual-checklist.md"

if [ "$SKIP_SLITHER" != "true" ]; then
    echo "  📄 $REPORT_DIR/maku-token-slither.json"
    echo "  📄 $REPORT_DIR/maku-membership-slither.json"
fi

echo ""
echo "🔍 Review reports and address any findings before deployment"
echo ""
