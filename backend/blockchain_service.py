"""
Blockchain Service for MAKU Travel
Handles Polygon Mumbai testnet integration for MAKU token and NFT memberships
"""

from web3 import Web3
from eth_account import Account
from typing import Dict, Optional, List
import json
import os
from pathlib import Path
from dotenv import load_dotenv
import logging
from datetime import datetime

logger = logging.getLogger(__name__)

# Load environment
load_dotenv()


class BlockchainService:
    """
    Manages blockchain operations for MAKU Travel
    - MAKU Token (ERC-20) operations
    - NFT Membership (ERC-721) operations  
    - Wallet management
    - Transaction tracking
    """
    
    def __init__(self):
        """Initialize blockchain service with Polygon Mumbai testnet"""
        
        # Mumbai testnet configuration
        self.rpc_url = os.environ.get(
            'POLYGON_RPC_URL',
            'https://rpc-mumbai.maticvigil.com'
        )
        self.chain_id = 80001  # Mumbai testnet
        self.explorer_url = 'https://mumbai.polygonscan.com'
        
        # Initialize Web3
        self.w3 = Web3(Web3.HTTPProvider(self.rpc_url))
        
        # Check connection
        if not self.w3.is_connected():
            logger.error("Failed to connect to Polygon Mumbai testnet")
            raise ConnectionError("Cannot connect to blockchain")
        
        logger.info(f"✅ Connected to Polygon Mumbai testnet (Chain ID: {self.chain_id})")
        
        # Load deployer account (for backend operations)
        self.private_key = os.environ.get('BLOCKCHAIN_PRIVATE_KEY')
        if self.private_key:
            self.account = Account.from_key(self.private_key)
            logger.info(f"✅ Deployer account loaded: {self.account.address}")
        else:
            logger.warning("⚠️  No BLOCKCHAIN_PRIVATE_KEY found - read-only mode")
            self.account = None
        
        # Contract addresses (will be set after deployment)
        self.token_address = os.environ.get('MAKU_TOKEN_ADDRESS')
        self.nft_address = os.environ.get('MAKU_NFT_ADDRESS')
        
        # Load contract ABIs
        self.token_abi = self._load_token_abi()
        self.nft_abi = self._load_nft_abi()
        
        # Initialize contracts if addresses exist
        if self.token_address:
            self.token_contract = self.w3.eth.contract(
                address=Web3.to_checksum_address(self.token_address),
                abi=self.token_abi
            )
            logger.info(f"✅ MAKU Token contract loaded: {self.token_address}")
        else:
            self.token_contract = None
            logger.warning("⚠️  MAKU Token not deployed yet")
        
        if self.nft_address:
            self.nft_contract = self.w3.eth.contract(
                address=Web3.to_checksum_address(self.nft_address),
                abi=self.nft_abi
            )
            logger.info(f"✅ MAKU NFT contract loaded: {self.nft_address}")
        else:
            self.nft_contract = None
            logger.warning("⚠️  MAKU NFT not deployed yet")
    
    def _load_token_abi(self) -> List:
        """Load MAKU Token ABI (simplified for basic operations)"""
        return [
            {"inputs": [], "name": "name", "outputs": [{"type": "string"}], "stateMutability": "view", "type": "function"},
            {"inputs": [], "name": "symbol", "outputs": [{"type": "string"}], "stateMutability": "view", "type": "function"},
            {"inputs": [], "name": "decimals", "outputs": [{"type": "uint8"}], "stateMutability": "view", "type": "function"},
            {"inputs": [], "name": "totalSupply", "outputs": [{"type": "uint256"}], "stateMutability": "view", "type": "function"},
            {"inputs": [{"name": "account", "type": "address"}], "name": "balanceOf", "outputs": [{"type": "uint256"}], "stateMutability": "view", "type": "function"},
            {"inputs": [{"name": "user", "type": "address"}], "name": "getPendingCashback", "outputs": [{"type": "uint256"}], "stateMutability": "view", "type": "function"},
            {"inputs": [{"name": "user", "type": "address"}, {"name": "bookingAmount", "type": "uint256"}], "name": "addCashback", "outputs": [], "stateMutability": "nonpayable", "type": "function"},
            {"inputs": [], "name": "claimCashback", "outputs": [], "stateMutability": "nonpayable", "type": "function"},
            {"anonymous": False, "inputs": [{"indexed": True, "name": "user", "type": "address"}, {"indexed": False, "name": "amount", "type": "uint256"}, {"indexed": False, "name": "bookingAmount", "type": "uint256"}], "name": "CashbackEarned", "type": "event"},
            {"anonymous": False, "inputs": [{"indexed": True, "name": "user", "type": "address"}, {"indexed": False, "name": "amount", "type": "uint256"}], "name": "CashbackClaimed", "type": "event"}
        ]
    
    def _load_nft_abi(self) -> List:
        """Load MAKU NFT ABI (simplified)"""
        return [
            {"inputs": [], "name": "name", "outputs": [{"type": "string"}], "stateMutability": "view", "type": "function"},
            {"inputs": [], "name": "symbol", "outputs": [{"type": "string"}], "stateMutability": "view", "type": "function"},
            {"inputs": [{"name": "owner", "type": "address"}], "name": "balanceOf", "outputs": [{"type": "uint256"}], "stateMutability": "view", "type": "function"},
            {"inputs": [{"name": "user", "type": "address"}], "name": "tokensOfOwner", "outputs": [{"type": "uint256[]"}], "stateMutability": "view", "type": "function"},
            {"inputs": [{"name": "user", "type": "address"}], "name": "getHighestCashbackRate", "outputs": [{"type": "uint256"}], "stateMutability": "view", "type": "function"},
            {"inputs": [{"name": "tokenId", "type": "uint256"}], "name": "getMembership", "outputs": [{"type": "uint8"}, {"type": "uint256"}, {"type": "uint256"}, {"type": "string"}], "stateMutability": "view", "type": "function"},
            {"inputs": [{"name": "tier", "type": "uint8"}, {"name": "metadataURI", "type": "string"}], "name": "purchaseMembership", "outputs": [{"type": "uint256"}], "stateMutability": "payable", "type": "function"},
            {"inputs": [{"name": "to", "type": "address"}, {"name": "tier", "type": "uint8"}, {"name": "metadataURI", "type": "string"}], "name": "mintMembership", "outputs": [{"type": "uint256"}], "stateMutability": "nonpayable", "type": "function"}
        ]
    
    # ==================== WALLET OPERATIONS ====================
    
    def validate_wallet_address(self, address: str) -> bool:
        """Validate Ethereum address format"""
        try:
            return Web3.is_address(address)
        except:
            return False
    
    def get_wallet_balance(self, address: str) -> Dict:
        """Get MATIC and MAKU token balance for wallet"""
        try:
            checksum_address = Web3.to_checksum_address(address)
            
            # Get MATIC balance
            matic_balance_wei = self.w3.eth.get_balance(checksum_address)
            matic_balance = self.w3.from_wei(matic_balance_wei, 'ether')
            
            # Get MAKU token balance
            maku_balance = 0
            if self.token_contract:
                maku_balance_wei = self.token_contract.functions.balanceOf(checksum_address).call()
                maku_balance = self.w3.from_wei(maku_balance_wei, 'ether')
            
            return {
                'address': address,
                'matic_balance': float(matic_balance),
                'maku_balance': float(maku_balance),
                'chain_id': self.chain_id,
                'network': 'mumbai'
            }
        except Exception as e:
            logger.error(f"Error getting wallet balance: {e}")
            return {'error': str(e)}
    
    # ==================== MAKU TOKEN OPERATIONS ====================
    
    def get_pending_cashback(self, address: str) -> float:
        """Get user's pending cashback amount"""
        if not self.token_contract:
            return 0.0
        
        try:
            checksum_address = Web3.to_checksum_address(address)
            pending_wei = self.token_contract.functions.getPendingCashback(checksum_address).call()
            return float(self.w3.from_wei(pending_wei, 'ether'))
        except Exception as e:
            logger.error(f"Error getting pending cashback: {e}")
            return 0.0
    
    def add_cashback(self, user_address: str, booking_amount_usd: float) -> Dict:
        """
        Add cashback for user booking (backend only)
        
        Args:
            user_address: User's wallet address
            booking_amount_usd: Booking amount in USD
        
        Returns:
            Transaction details
        """
        if not self.token_contract or not self.account:
            return {'error': 'Blockchain service not fully configured'}
        
        try:
            checksum_address = Web3.to_checksum_address(user_address)
            
            # Convert USD amount to wei (1 MAKU = $1)
            amount_wei = self.w3.to_wei(booking_amount_usd, 'ether')
            
            # Build transaction
            tx = self.token_contract.functions.addCashback(
                checksum_address,
                amount_wei
            ).build_transaction({
                'from': self.account.address,
                'nonce': self.w3.eth.get_transaction_count(self.account.address),
                'gas': 200000,
                'gasPrice': self.w3.eth.gas_price,
                'chainId': self.chain_id
            })
            
            # Sign transaction
            signed_tx = self.w3.eth.account.sign_transaction(tx, self.private_key)
            
            # Send transaction
            tx_hash = self.w3.eth.send_raw_transaction(signed_tx.rawTransaction)
            
            # Wait for confirmation
            receipt = self.w3.eth.wait_for_transaction_receipt(tx_hash, timeout=120)
            
            return {
                'success': receipt['status'] == 1,
                'transaction_hash': tx_hash.hex(),
                'block_number': receipt['blockNumber'],
                'gas_used': receipt['gasUsed'],
                'user_address': user_address,
                'booking_amount': booking_amount_usd,
                'explorer_url': f"{self.explorer_url}/tx/{tx_hash.hex()}"
            }
        except Exception as e:
            logger.error(f"Error adding cashback: {e}")
            return {'error': str(e)}
    
    # ==================== NFT OPERATIONS ====================
    
    def get_user_nfts(self, address: str) -> List[Dict]:
        """Get all NFTs owned by user"""
        if not self.nft_contract:
            return []
        
        try:
            checksum_address = Web3.to_checksum_address(address)
            
            # Get token IDs
            token_ids = self.nft_contract.functions.tokensOfOwner(checksum_address).call()
            
            nfts = []
            tier_names = ['Bronze', 'Silver', 'Gold', 'Platinum']
            
            for token_id in token_ids:
                # Get membership details
                tier, cashback_rate, minted_at, metadata_uri = self.nft_contract.functions.getMembership(token_id).call()
                
                nfts.append({
                    'token_id': token_id,
                    'tier': tier_names[tier],
                    'cashback_rate': cashback_rate / 100,  # Convert from basis points
                    'minted_at': minted_at,
                    'metadata_uri': metadata_uri,
                    'contract_address': self.nft_address
                })
            
            return nfts
        except Exception as e:
            logger.error(f"Error getting user NFTs: {e}")
            return []
    
    def get_highest_cashback_rate(self, address: str) -> float:
        """Get user's highest cashback rate from NFTs"""
        if not self.nft_contract:
            return 1.0  # Default Bronze rate
        
        try:
            checksum_address = Web3.to_checksum_address(address)
            rate = self.nft_contract.functions.getHighestCashbackRate(checksum_address).call()
            return rate / 100  # Convert from basis points to percentage
        except Exception as e:
            logger.error(f"Error getting highest cashback rate: {e}")
            return 1.0
    
    def mint_nft_for_user(
        self,
        user_address: str,
        tier: int,
        metadata_uri: str
    ) -> Dict:
        """
        Mint NFT for user (earned through bookings)
        
        Args:
            user_address: User's wallet address
            tier: Tier level (0=Bronze, 1=Silver, 2=Gold, 3=Platinum)
            metadata_uri: IPFS URI for NFT metadata
        
        Returns:
            Transaction details
        """
        if not self.nft_contract or not self.account:
            return {'error': 'Blockchain service not fully configured'}
        
        try:
            checksum_address = Web3.to_checksum_address(user_address)
            
            # Build transaction
            tx = self.nft_contract.functions.mintMembership(
                checksum_address,
                tier,
                metadata_uri
            ).build_transaction({
                'from': self.account.address,
                'nonce': self.w3.eth.get_transaction_count(self.account.address),
                'gas': 300000,
                'gasPrice': self.w3.eth.gas_price,
                'chainId': self.chain_id
            })
            
            # Sign and send
            signed_tx = self.w3.eth.account.sign_transaction(tx, self.private_key)
            tx_hash = self.w3.eth.send_raw_transaction(signed_tx.rawTransaction)
            
            # Wait for confirmation
            receipt = self.w3.eth.wait_for_transaction_receipt(tx_hash, timeout=120)
            
            # Parse token ID from logs
            token_id = None
            for log in receipt['logs']:
                try:
                    # Try to decode Transfer event
                    if len(log['topics']) >= 3:
                        token_id = int(log['topics'][3].hex(), 16)
                        break
                except:
                    continue
            
            return {
                'success': receipt['status'] == 1,
                'transaction_hash': tx_hash.hex(),
                'token_id': token_id,
                'tier': ['Bronze', 'Silver', 'Gold', 'Platinum'][tier],
                'block_number': receipt['blockNumber'],
                'gas_used': receipt['gasUsed'],
                'explorer_url': f"{self.explorer_url}/tx/{tx_hash.hex()}"
            }
        except Exception as e:
            logger.error(f"Error minting NFT: {e}")
            return {'error': str(e)}
    
    # ==================== UTILITY FUNCTIONS ====================
    
    def get_network_info(self) -> Dict:
        """Get current network information"""
        try:
            latest_block = self.w3.eth.block_number
            gas_price = self.w3.eth.gas_price
            
            return {
                'network': 'mumbai',
                'chain_id': self.chain_id,
                'rpc_url': self.rpc_url,
                'explorer_url': self.explorer_url,
                'latest_block': latest_block,
                'gas_price_gwei': self.w3.from_wei(gas_price, 'gwei'),
                'token_address': self.token_address,
                'nft_address': self.nft_address,
                'connected': self.w3.is_connected()
            }
        except Exception as e:
            logger.error(f"Error getting network info: {e}")
            return {'error': str(e)}
    
    def estimate_gas(self, transaction_type: str) -> Dict:
        """Estimate gas costs for common operations"""
        estimates = {
            'add_cashback': 150000,
            'claim_cashback': 100000,
            'mint_nft': 250000,
            'transfer': 21000
        }
        
        try:
            gas_price = self.w3.eth.gas_price
            gas_limit = estimates.get(transaction_type, 100000)
            
            cost_wei = gas_price * gas_limit
            cost_matic = self.w3.from_wei(cost_wei, 'ether')
            
            return {
                'transaction_type': transaction_type,
                'estimated_gas': gas_limit,
                'gas_price_gwei': float(self.w3.from_wei(gas_price, 'gwei')),
                'estimated_cost_matic': float(cost_matic),
                'estimated_cost_usd': float(cost_matic) * 0.5  # Approximate MATIC price
            }
        except Exception as e:
            logger.error(f"Error estimating gas: {e}")
            return {'error': str(e)}


# Singleton instance
_blockchain_service = None

def get_blockchain_service() -> BlockchainService:
    """Get or create blockchain service instance"""
    global _blockchain_service
    if _blockchain_service is None:
        _blockchain_service = BlockchainService()
    return _blockchain_service
