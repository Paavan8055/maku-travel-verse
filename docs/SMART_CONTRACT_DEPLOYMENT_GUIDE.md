# Smart Contract Deployment Guide
**Target Network:** Polygon Mumbai Testnet
**Estimated Time:** 30-45 minutes
**Cost:** ~$0 (free Mumbai MATIC from faucet)

## Prerequisites Checklist

- [ ] Node.js installed (v16+)
- [ ] Backend .env file accessible
- [ ] Basic understanding of blockchain/wallets

## Step 1: Generate Deployment Wallet (5 minutes)

### Option A: Using MetaMask (Recommended)
1. Install MetaMask browser extension: https://metamask.io
2. Create new wallet or use existing
3. Switch to Mumbai Testnet:
   - Click network dropdown
   - "Add Network" > "Add Network Manually"
   - Network Name: Polygon Mumbai
   - RPC URL: https://rpc-mumbai.maticvigil.com
   - Chain ID: 80001
   - Currency Symbol: MATIC
   - Block Explorer: https://mumbai.polygonscan.com
4. Export private key:
   - Click account menu > Account details > Export private key
   - Enter password
   - **CRITICAL:** Copy private key (starts with 0x...)
   - **NEVER share or commit to Git**

### Option B: Generate Programmatically
```bash
cd /app
node -e "const ethers = require('ethers'); const wallet = ethers.Wallet.createRandom(); console.log('Address:', wallet.address); console.log('Private Key:', wallet.privateKey);"
```

**Save the output:**
- Address: 0x... (your wallet address)
- Private Key: 0x... (keep this SECRET)

## Step 2: Get Mumbai MATIC (10 minutes)

Mumbai MATIC is free testnet currency. You need ~0.2 MATIC for deployment.

### Faucet Options (try in order if one fails):

**1. Official Polygon Faucet**
- URL: https://faucet.polygon.technology
- Login with social (GitHub/Google)
- Select "Mumbai" network
- Paste your wallet address
- Complete CAPTCHA
- Receive 0.5 MATIC

**2. Alchemy Faucet**
- URL: https://mumbaifaucet.com
- Create free Alchemy account
- Paste wallet address
- Receive 0.2 MATIC

**3. QuickNode Faucet**
- URL: https://faucet.quicknode.com/polygon/mumbai
- Create free account
- Verify Twitter/Discord
- Receive 0.1 MATIC

**4. Community Faucets (if above fail)**
- https://mumbaifaucet.com
- https://faucet.paradigm.xyz
- Ask in Polygon Discord: https://discord.gg/polygon

### Verify Balance
```bash
# Check balance on PolygonScan
https://mumbai.polygonscan.com/address/YOUR_WALLET_ADDRESS

# Or use ethers.js
node -e "const ethers = require('ethers'); const provider = new ethers.providers.JsonRpcProvider('https://rpc-mumbai.maticvigil.com'); provider.getBalance('YOUR_ADDRESS').then(bal => console.log('Balance:', ethers.utils.formatEther(bal), 'MATIC'));"
```

**Wait for confirmation:** Faucets may take 1-5 minutes to send MATIC.

## Step 3: Configure Environment (2 minutes)

Edit `/app/backend/.env`:

```bash
# Find these lines and update:
BLOCKCHAIN_PRIVATE_KEY=0xYOUR_PRIVATE_KEY_HERE
POLYGON_RPC_URL=https://rpc-mumbai.maticvigil.com
BLOCKCHAIN_MODE=live  # Change from 'mock'

# Optional: PolygonScan API key for verification
# Get from: https://polygonscan.com/myapikey
POLYGONSCAN_API_KEY=YOUR_API_KEY  # Optional but recommended
```

**SECURITY CHECK:**
- ✅ Private key starts with `0x`
- ✅ Private key is 66 characters long (0x + 64 hex chars)
- ✅ `.env` file is in `.gitignore`
- ❌ NEVER use the mock key: `mock_key_for_testing_only`

## Step 4: Install Dependencies (3 minutes)

```bash
cd /app/blockchain

# Install Hardhat and dependencies
yarn install

# Expected output:
# Done in X.XXs
```

**Verify installation:**
```bash
npx hardhat --version
# Should show: 2.19.0 or higher
```

## Step 5: Compile Smart Contracts (2 minutes)

```bash
cd /app/blockchain
npx hardhat compile

# Expected output:
# Compiling 2 files with 0.8.20
# Compilation finished successfully
```

**Verify compilation:**
```bash
ls -l artifacts/contracts/

# Should see:
# MAKUToken.sol/
# MAKUMembership.sol/
```

## Step 6: Deploy to Mumbai (10-15 minutes)

```bash
cd /app/blockchain
npx hardhat run scripts/deploy.js --network mumbai
```

**Expected Output:**
```
================================================================================
🚀 MAKU Smart Contract Deployment to Polygon Mumbai
================================================================================

📍 Network: mumbai
   Deployer address: 0x...
   Balance: 0.5 MATIC

📦 Deploying MAKUToken...
   ✅ MAKUToken deployed to: 0xABCD...
   Transaction: 0x1234...
   Name: MAKU Travel Token
   Symbol: MAKU
   Total Supply: 1000000000 MAKU

📦 Deploying MAKUMembership...
   ✅ MAKUMembership deployed to: 0xEFGH...
   Transaction: 0x5678...
   Name: MAKU Membership
   Symbol: MAKUM

   Tier Cashback Rates:
   • Bronze: 1%
   • Silver: 3%
   • Gold: 6%
   • Platinum: 10%

📄 Deployment info saved to: /app/blockchain/deployments/mumbai.json

📋 Environment variable updates saved to: /app/blockchain/deployments/env-updates.txt

================================================================================
✅ DEPLOYMENT SUCCESSFUL
================================================================================

Add these to your backend/.env file:

# Mumbai Testnet Deployment (2025-01-XX)
MAKU_TOKEN_ADDRESS=0xABCD...
MAKU_NFT_ADDRESS=0xEFGH...
BLOCKCHAIN_NETWORK=mumbai
BLOCKCHAIN_MODE=live
```

**⚠️ IMPORTANT:** Copy the contract addresses from this output!

## Step 7: Update Backend Configuration (3 minutes)

1. Copy addresses from deployment output
2. Edit `/app/backend/.env`:

```bash
# Add/Update these lines with YOUR deployed addresses
MAKU_TOKEN_ADDRESS=0xABCD...  # From deployment output
MAKU_NFT_ADDRESS=0xEFGH...    # From deployment output
BLOCKCHAIN_NETWORK=mumbai
BLOCKCHAIN_MODE=live  # Must be 'live' not 'mock'
```

3. Restart backend:
```bash
sudo supervisorctl restart backend

# Verify restart
sudo supervisorctl status backend
# Should show: backend    RUNNING   pid XXXX, uptime X:XX:XX
```

## Step 8: Verify on PolygonScan (10 minutes)

### Manual Verification (Simple)
1. Visit: https://mumbai.polygonscan.com/address/YOUR_MAKU_TOKEN_ADDRESS
2. Check:
   - ✅ Contract created
   - ✅ Transaction successful
   - ✅ Balance shows 1B tokens

### Automated Verification (Recommended)
Get PolygonScan API key first (free): https://polygonscan.com/myapikey

```bash
cd /app/blockchain

# Verify MAKUToken
npx hardhat verify --network mumbai YOUR_MAKU_TOKEN_ADDRESS 1000000000

# Expected output:
# Successfully verified contract MAKUToken on Etherscan.
# https://mumbai.polygonscan.com/address/YOUR_ADDRESS#code

# Verify MAKUMembership
npx hardhat verify --network mumbai YOUR_MAKU_NFT_ADDRESS

# Expected output:
# Successfully verified contract MAKUMembership on Etherscan.
```

**Verification Benefits:**
- ✅ Source code visible on PolygonScan
- ✅ Users can read contract functions
- ✅ Increased trust and transparency
- ✅ Easier debugging

## Step 9: Test Deployment (5 minutes)

### Test 1: Check Token Contract
```bash
curl -X GET "https://dream-marketplace.preview.emergentagent.com/api/blockchain/network-info"

# Expected response:
{
  "chain_id": 80001,
  "network": "mumbai",
  "rpc_url": "https://rpc-mumbai.maticvigil.com",
  "explorer": "https://mumbai.polygonscan.com",
  "token_address": "0xABCD...",
  "nft_address": "0xEFGH...",
  "mode": "live"
}
```

### Test 2: Mint Free Bronze NFT
```bash
curl -X POST "https://dream-marketplace.preview.emergentagent.com/api/blockchain/nft/mint" \
  -H "Content-Type: application/json" \
  -d '{
    "wallet_address": "0xYOUR_WALLET_ADDRESS",
    "tier": 0
  }'

# Expected response:
{
  "success": true,
  "token_id": 0,
  "tier": "Bronze",
  "cashback_rate": "1%",
  "transaction_hash": "0x...",
  "explorer_url": "https://mumbai.polygonscan.com/tx/0x..."
}
```

### Test 3: Check NFT on PolygonScan
1. Visit the explorer_url from previous response
2. Verify:
   - ✅ Transaction successful
   - ✅ From: Contract address
   - ✅ To: Your wallet address
   - ✅ Token ID: 0

### Test 4: View NFT in MetaMask
1. Open MetaMask
2. Switch to Mumbai network
3. Click "NFTs" tab
4. Click "Import NFT"
5. Enter:
   - Address: YOUR_MAKU_NFT_ADDRESS
   - Token ID: 0
6. Click "Add"
7. See your Bronze MAKU Membership NFT! 🎉

## Step 10: Production Deployment (When Ready)

### Mumbai (Testnet) → Polygon Mainnet

**Differences:**
- Mainnet MATIC costs real money
- Transactions are permanent
- No faucets (must buy MATIC)

**Steps:**
1. Get production wallet with real MATIC
2. Update `.env`:
   ```bash
   POLYGON_RPC_URL=https://polygon-rpc.com
   BLOCKCHAIN_NETWORK=polygon
   ```
3. Deploy:
   ```bash
   npx hardhat run scripts/deploy.js --network polygon
   ```
4. Cost estimate: ~0.05 MATIC (~$0.04)

## Troubleshooting

### Error: "insufficient funds for intrinsic transaction cost"
**Cause:** Not enough MATIC in wallet
**Solution:**
1. Check balance: https://mumbai.polygonscan.com/address/YOUR_ADDRESS
2. Get more MATIC from faucet
3. Wait 2 minutes for confirmation
4. Retry deployment

### Error: "nonce too low"
**Cause:** MetaMask nonce mismatch
**Solution:**
1. Open MetaMask
2. Settings > Advanced > Reset Account
3. Confirm reset
4. Retry deployment

### Error: "Cannot find module 'hardhat'"
**Cause:** Dependencies not installed
**Solution:**
```bash
cd /app/blockchain
rm -rf node_modules
yarn install
```

### Error: "BLOCKCHAIN_PRIVATE_KEY not set"
**Cause:** Private key not in .env or still using mock key
**Solution:**
1. Check `/app/backend/.env`
2. Ensure `BLOCKCHAIN_PRIVATE_KEY=0x...`
3. Key must start with `0x`
4. Must NOT be `mock_key_for_testing_only`

### Error: "Compilation failed"
**Cause:** Solidity version mismatch
**Solution:**
```bash
cd /app/blockchain
npx hardhat clean
npx hardhat compile --force
```

### Deployment hangs / takes forever
**Cause:** Network congestion or RPC issues
**Solution:**
1. Cancel (Ctrl+C)
2. Try alternative RPC:
   ```bash
   # In backend/.env
   POLYGON_RPC_URL=https://polygon-testnet.public.blastapi.io
   # or
   POLYGON_RPC_URL=https://rpc.ankr.com/polygon_mumbai
   ```
3. Retry deployment

### Contract verification fails
**Cause:** PolygonScan API key issue or constructor arguments
**Solution:**
```bash
# Try with explicit constructor args
npx hardhat verify --network mumbai \
  --constructor-args scripts/constructor-args.js \
  YOUR_CONTRACT_ADDRESS
```

## Success Checklist

After completing all steps, verify:

- [ ] Wallet created with private key secured
- [ ] Mumbai MATIC received (>0.2)
- [ ] Backend .env updated with private key
- [ ] Dependencies installed (`node_modules` exists)
- [ ] Contracts compiled (`artifacts/` exists)
- [ ] MAKUToken deployed (address saved)
- [ ] MAKUMembership deployed (address saved)
- [ ] Backend .env updated with contract addresses
- [ ] Backend restarted successfully
- [ ] Network info API returns correct addresses
- [ ] Test NFT mint successful
- [ ] Transaction visible on PolygonScan
- [ ] NFT visible in MetaMask

## Next Steps

1. **Update Frontend:** Tell users contract is live on Mumbai
2. **Test All Features:**
   - Mint Bronze NFT (free)
   - Purchase Silver NFT (0.01 MATIC)
   - Earn cashback on bookings
   - Claim cashback
3. **Monitor:** Watch PolygonScan for all transactions
4. **Security Audit:** Run Slither before mainnet:
   ```bash
   cd /app/blockchain
   slither contracts/
   ```
5. **Mainnet Planning:** When ready for production

## Useful Links

- **Mumbai PolygonScan:** https://mumbai.polygonscan.com
- **Mumbai Faucet:** https://faucet.polygon.technology
- **Hardhat Docs:** https://hardhat.org/getting-started
- **Ethers.js Docs:** https://docs.ethers.io
- **OpenZeppelin:** https://docs.openzeppelin.com

## Support

If deployment fails after following all steps:
1. Check supervisor logs: `tail -100 /var/log/supervisor/backend.err.log`
2. Check deployment logs in `/app/blockchain/deployments/`
3. Review this guide for missed steps
4. Verify wallet has MATIC on PolygonScan

---

**Document Version:** 1.0
**Last Updated:** January 2025
**Tested On:** Polygon Mumbai Testnet
