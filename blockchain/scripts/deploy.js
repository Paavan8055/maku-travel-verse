/**
 * Deploy MAKU Smart Contracts to Polygon Mumbai Testnet
 * Updated with Hardhat integration
 * 
 * Prerequisites:
 * 1. Get Mumbai MATIC from faucet: https://faucet.polygon.technology
 * 2. Set BLOCKCHAIN_PRIVATE_KEY in backend/.env
 * 3. Run from blockchain directory: npx hardhat run scripts/deploy.js --network mumbai
 */

const hre = require("hardhat");
const fs = require('fs');
const path = require('path');

// Token configuration
const TOKEN_INITIAL_SUPPLY = 1000000000; // 1 billion tokens

async function main() {
  console.log('='.repeat(80));
  console.log('🚀 MAKU Smart Contract Deployment to Polygon Mumbai');
  console.log('='.repeat(80));

  const [deployer] = await hre.ethers.getSigners();
  
  console.log(`\n📍 Network: ${hre.network.name}`);
  console.log(`   Deployer address: ${deployer.address}`);
  
  const balance = await deployer.getBalance();
  const balanceMatic = hre.ethers.utils.formatEther(balance);
  console.log(`   Balance: ${balanceMatic} MATIC`);
  
  if (parseFloat(balanceMatic) < 0.1) {
    console.error(`\n⚠️  WARNING: Low balance (${balanceMatic} MATIC)`);
    console.error('   Get Mumbai MATIC from: https://faucet.polygon.technology');
    console.error('   Recommended: At least 0.2 MATIC for deployment\n');
  }

  // Deploy MAKUToken
  console.log(`\n📦 Deploying MAKUToken...`);
  const MAKUToken = await hre.ethers.getContractFactory("MAKUToken");
  const token = await MAKUToken.deploy(TOKEN_INITIAL_SUPPLY);
  await token.deployed();
  
  console.log(`   ✅ MAKUToken deployed to: ${token.address}`);
  console.log(`   Transaction: ${token.deployTransaction.hash}`);
  
  // Verify token deployment
  const tokenName = await token.name();
  const tokenSymbol = await token.symbol();
  const totalSupply = await token.totalSupply();
  console.log(`   Name: ${tokenName}`);
  console.log(`   Symbol: ${tokenSymbol}`);
  console.log(`   Total Supply: ${hre.ethers.utils.formatEther(totalSupply)} ${tokenSymbol}`);

  // Deploy MAKUMembership
  console.log(`\n📦 Deploying MAKUMembership...`);
  const MAKUMembership = await hre.ethers.getContractFactory("MAKUMembership");
  const nft = await MAKUMembership.deploy();
  await nft.deployed();
  
  console.log(`   ✅ MAKUMembership deployed to: ${nft.address}`);
  console.log(`   Transaction: ${nft.deployTransaction.hash}`);
  
  // Verify NFT deployment
  const nftName = await nft.name();
  const nftSymbol = await nft.symbol();
  console.log(`   Name: ${nftName}`);
  console.log(`   Symbol: ${nftSymbol}`);
  
  // Check tier rates
  const bronzeRate = await nft.tierCashbackRates(0);
  const silverRate = await nft.tierCashbackRates(1);
  const goldRate = await nft.tierCashbackRates(2);
  const platinumRate = await nft.tierCashbackRates(3);
  
  console.log(`\n   Tier Cashback Rates:`);
  console.log(`   • Bronze: ${bronzeRate / 100}%`);
  console.log(`   • Silver: ${silverRate / 100}%`);
  console.log(`   • Gold: ${goldRate / 100}%`);
  console.log(`   • Platinum: ${platinumRate / 100}%`);

  // Save deployment info
  const deployment = {
    network: hre.network.name,
    chainId: hre.network.config.chainId,
    timestamp: new Date().toISOString(),
    deployer: deployer.address,
    contracts: {
      MAKUToken: {
        address: token.address,
        name: tokenName,
        symbol: tokenSymbol,
        initialSupply: TOKEN_INITIAL_SUPPLY,
        transaction: token.deployTransaction.hash
      },
      MAKUMembership: {
        address: nft.address,
        name: nftName,
        symbol: nftSymbol,
        transaction: nft.deployTransaction.hash,
        tiers: {
          bronze: { rate: '1%', price: '0 MATIC' },
          silver: { rate: '3%', price: '0.01 MATIC' },
          gold: { rate: '6%', price: '0.03 MATIC' },
          platinum: { rate: '10%', price: '0.1 MATIC' }
        }
      }
    },
    explorer: {
      token: `https://mumbai.polygonscan.com/address/${token.address}`,
      nft: `https://mumbai.polygonscan.com/address/${nft.address}`
    }
  };

  const deploymentPath = path.join(__dirname, '../deployments/mumbai.json');
  fs.mkdirSync(path.dirname(deploymentPath), { recursive: true });
  fs.writeFileSync(deploymentPath, JSON.stringify(deployment, null, 2));
  
  console.log(`\n📄 Deployment info saved to: ${deploymentPath}`);
  
  // Generate .env updates
  const envUpdates = `
# Mumbai Testnet Deployment (${deployment.timestamp})
MAKU_TOKEN_ADDRESS=${token.address}
MAKU_NFT_ADDRESS=${nft.address}
BLOCKCHAIN_NETWORK=mumbai
BLOCKCHAIN_MODE=live
`;

  const envPath = path.join(__dirname, '../deployments/env-updates.txt');
  fs.writeFileSync(envPath, envUpdates.trim());
  
  console.log(`\n📋 Environment variable updates saved to: ${envPath}`);
  console.log(`\n${'='.repeat(80)}`);
  console.log('✅ DEPLOYMENT SUCCESSFUL');
  console.log(`${'='.repeat(80)}`);
  console.log(`\nAdd these to your backend/.env file:`);
  console.log(envUpdates);
  
  console.log(`\n🔍 Next Steps:`);
  console.log(`1. Update backend/.env with contract addresses above`);
  console.log(`2. Restart backend: sudo supervisorctl restart backend`);
  console.log(`3. Verify contracts on PolygonScan:`);
  console.log(`   npx hardhat verify --network mumbai ${token.address} ${TOKEN_INITIAL_SUPPLY}`);
  console.log(`   npx hardhat verify --network mumbai ${nft.address}`);
  console.log(`4. Test minting: Visit ${deployment.explorer.nft}`);
}

main()
  .then(() => process.exit(0))
  .catch((error) => {
    console.error('\n❌ Deployment failed:', error);
    process.exit(1);
  });
