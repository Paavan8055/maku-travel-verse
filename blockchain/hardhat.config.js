require("@nomicfoundation/hardhat-toolbox");
require('dotenv').config({ path: '../backend/.env' });

/** @type import('hardhat/config').HardhatUserConfig */
module.exports = {
  solidity: {
    version: "0.8.20",
    settings: {
      optimizer: {
        enabled: true,
        runs: 200
      }
    }
  },
  networks: {
    mumbai: {
      url: process.env.POLYGON_RPC_URL || "https://rpc-mumbai.maticvigil.com",
      accounts: process.env.BLOCKCHAIN_PRIVATE_KEY && process.env.BLOCKCHAIN_PRIVATE_KEY !== 'mock_key_for_testing_only' 
        ? [process.env.BLOCKCHAIN_PRIVATE_KEY] 
        : [],
      chainId: 80001,
      gasPrice: 20000000000, // 20 gwei
      gas: 6000000
    },
    localhost: {
      url: "http://127.0.0.1:8545"
    }
  },
  etherscan: {
    apiKey: {
      polygonMumbai: process.env.POLYGONSCAN_API_KEY || ""
    }
  },
  paths: {
    sources: "./contracts",
    tests: "./test",
    cache: "./cache",
    artifacts: "./artifacts"
  }
};
