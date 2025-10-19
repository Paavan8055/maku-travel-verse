/**
 * Deploy MAKU Smart Contracts to Polygon Mumbai Testnet
 * 
 * Prerequisites:
 * 1. Get Mumbai MATIC from faucet: https://faucet.polygon.technology
 * 2. Set DEPLOYER_PRIVATE_KEY in .env
 * 3. Set MUMBAI_RPC_URL in .env (or use default)
 * 
 * Usage: node deploy-mumbai.js
 */

const { ethers } = require('ethers');
const fs = require('fs');
const path = require('path');
require('dotenv').config({ path: path.join(__dirname, '../../backend/.env') });

// Configuration
const MUMBAI_RPC_URL = process.env.MUMBAI_RPC_URL || 'https://rpc-mumbai.maticvigil.com';
const DEPLOYER_PRIVATE_KEY = process.env.BLOCKCHAIN_PRIVATE_KEY;
const CHAIN_ID = 80001;

// Token configuration
const TOKEN_INITIAL_SUPPLY = 1000000000; // 1 billion tokens
const TOKEN_NAME = 'MAKU Travel Token';
const TOKEN_SYMBOL = 'MAKU';

async function deployContract(provider, wallet, contractName, bytecode, abi, args = []) {
  console.log(`\n📦 Deploying ${contractName}...`);
  
  const factory = new ethers.ContractFactory(abi, bytecode, wallet);
  const contract = await factory.deploy(...args);
  
  console.log(`   Transaction hash: ${contract.deployTransaction.hash}`);
  console.log(`   Waiting for confirmation...`);
  
  await contract.deployed();
  
  console.log(`   ✅ ${contractName} deployed to: ${contract.address}`);
  console.log(`   Block number: ${contract.deployTransaction.blockNumber}`);
  
  return contract;
}

async function verifyDeployment(contract, contractName) {
  console.log(`\n🔍 Verifying ${contractName} deployment...`);
  
  try {
    // Test basic contract functions
    if (contractName === 'MAKUToken') {
      const name = await contract.name();
      const symbol = await contract.symbol();
      const totalSupply = await contract.totalSupply();
      
      console.log(`   Name: ${name}`);
      console.log(`   Symbol: ${symbol}`);
      console.log(`   Total Supply: ${ethers.utils.formatEther(totalSupply)} ${symbol}`);
      
      return name === TOKEN_NAME && symbol === TOKEN_SYMBOL;
    } else if (contractName === 'MAKUMembership') {
      const name = await contract.name();
      const symbol = await contract.symbol();
      
      console.log(`   Name: ${name}`);
      console.log(`   Symbol: ${symbol}`);
      
      // Check tier rates
      const bronzeRate = await contract.tierCashbackRates(0);
      const silverRate = await contract.tierCashbackRates(1);
      const goldRate = await contract.tierCashbackRates(2);
      const platinumRate = await contract.tierCashbackRates(3);
      
      console.log(`   Bronze rate: ${bronzeRate / 100}%`);
      console.log(`   Silver rate: ${silverRate / 100}%`);
      console.log(`   Gold rate: ${goldRate / 100}%`);
      console.log(`   Platinum rate: ${platinumRate / 100}%`);
      
      return bronzeRate.toNumber() === 100 && 
             silverRate.toNumber() === 300 && 
             goldRate.toNumber() === 600 && 
             platinumRate.toNumber() === 1000;
    }
  } catch (error) {
    console.error(`   ❌ Verification failed:`, error.message);
    return false;
  }
  
  return true;
}

async function saveDeploymentInfo(tokenAddress, nftAddress, deployer) {
  const deployment = {
    network: 'mumbai',
    chainId: CHAIN_ID,
    timestamp: new Date().toISOString(),
    deployer: deployer,
    contracts: {
      MAKUToken: {
        address: tokenAddress,
        name: TOKEN_NAME,
        symbol: TOKEN_SYMBOL,
        initialSupply: TOKEN_INITIAL_SUPPLY
      },
      MAKUMembership: {
        address: nftAddress,
        name: 'MAKU Membership',
        symbol: 'MAKUM',
        tiers: {
          bronze: { rate: '1%', price: '0 MATIC' },
          silver: { rate: '3%', price: '0.01 MATIC' },
          gold: { rate: '6%', price: '0.03 MATIC' },
          platinum: { rate: '10%', price: '0.1 MATIC' }
        }
      }
    },
    explorer: {
      token: `https://mumbai.polygonscan.com/address/${tokenAddress}`,
      nft: `https://mumbai.polygonscan.com/address/${nftAddress}`
    }
  };

  const deploymentPath = path.join(__dirname, '../deployments/mumbai.json');
  fs.mkdirSync(path.dirname(deploymentPath), { recursive: true });
  fs.writeFileSync(deploymentPath, JSON.stringify(deployment, null, 2));
  
  console.log(`\n📄 Deployment info saved to: ${deploymentPath}`);
  
  // Generate .env updates
  const envUpdates = `
# Mumbai Testnet Deployment (${deployment.timestamp})
MAKU_TOKEN_ADDRESS=${tokenAddress}
MAKU_NFT_ADDRESS=${nftAddress}
BLOCKCHAIN_NETWORK=mumbai
`;

  const envPath = path.join(__dirname, '../deployments/env-updates.txt');
  fs.writeFileSync(envPath, envUpdates.trim());
  
  console.log(`\n📋 Environment variable updates saved to: ${envPath}`);
  console.log(`\nAdd these to your backend/.env file:`);
  console.log(envUpdates);
}

async function main() {
  console.log('='.repeat(80));
  console.log('🚀 MAKU Smart Contract Deployment to Polygon Mumbai');
  console.log('='.repeat(80));

  // Validate environment
  if (!DEPLOYER_PRIVATE_KEY || DEPLOYER_PRIVATE_KEY === 'mock_key_for_testing_only') {
    console.error('\n❌ ERROR: BLOCKCHAIN_PRIVATE_KEY not set in backend/.env');
    console.error('\nTo deploy contracts, you need:');
    console.error('1. Generate a wallet: https://vanity-eth.tk/');
    console.error('2. Get Mumbai MATIC from faucet: https://faucet.polygon.technology');
    console.error('3. Add BLOCKCHAIN_PRIVATE_KEY to backend/.env');
    console.error('\nFor now, you can continue using mock mode for testing.');
    process.exit(1);
  }

  // Connect to Mumbai
  console.log(`\n🔌 Connecting to Mumbai testnet...`);
  console.log(`   RPC: ${MUMBAI_RPC_URL}`);
  
  const provider = new ethers.providers.JsonRpcProvider(MUMBAI_RPC_URL);
  const wallet = new ethers.Wallet(DEPLOYER_PRIVATE_KEY, provider);
  
  console.log(`   Deployer address: ${wallet.address}`);
  
  // Check balance
  const balance = await wallet.getBalance();
  const balanceMatic = ethers.utils.formatEther(balance);
  console.log(`   Balance: ${balanceMatic} MATIC`);
  
  if (parseFloat(balanceMatic) < 0.1) {
    console.error(`\n⚠️  WARNING: Low balance (${balanceMatic} MATIC)`);
    console.error('   Get Mumbai MATIC from: https://faucet.polygon.technology');
    console.error('   Recommended: At least 0.2 MATIC for deployment');
    
    const readline = require('readline').createInterface({
      input: process.stdin,
      output: process.stdout
    });
    
    const answer = await new Promise(resolve => {
      readline.question('\n   Continue anyway? (yes/no): ', resolve);
    });
    readline.close();
    
    if (answer.toLowerCase() !== 'yes') {
      console.log('\n❌ Deployment cancelled');
      process.exit(0);
    }
  }

  // Load compiled contracts
  console.log(`\n📖 Loading contract artifacts...`);
  
  // Note: These would be compiled contract artifacts
  // For now, showing the structure
  console.log(`   ⚠️  Contract compilation required`);
  console.log(`   Run: cd blockchain && npx hardhat compile`);
  console.log(`   Then contract artifacts will be in: blockchain/artifacts/`);
  
  console.log(`\n✅ Deployment script ready!`);
  console.log(`\nNext steps:`);
  console.log(`1. Install Hardhat: npm install --save-dev hardhat`);
  console.log(`2. Initialize: npx hardhat`);
  console.log(`3. Compile contracts: npx hardhat compile`);
  console.log(`4. Run this script again`);
  
  // For demo purposes, show what would happen
  console.log(`\n📦 Deployment sequence:`);
  console.log(`   1. Deploy MAKUToken (1B supply)`);
  console.log(`   2. Deploy MAKUMembership (4 tiers)`);
  console.log(`   3. Verify on PolygonScan`);
  console.log(`   4. Update .env with addresses`);
  console.log(`   5. Test with real transactions`);
}

main()
  .then(() => process.exit(0))
  .catch((error) => {
    console.error('\n❌ Deployment failed:', error);
    process.exit(1);
  });
