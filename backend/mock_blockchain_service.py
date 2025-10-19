"""
Mock Blockchain Service for Frontend Testing
Simulates blockchain operations without actual deployment
"""

import os
import random
import uuid
from typing import Dict, List, Optional
from datetime import datetime
import hashlib


class MockBlockchainService:
    """
    Mock blockchain service for testing frontend integration
    Returns realistic data without actual blockchain transactions
    """
    
    def __init__(self):
        self.chain_id = 80001  # Mumbai testnet
        self.explorer_url = 'https://mumbai.polygonscan.com'
        self.token_address = "0x742d35Cc6634C0532925a3b844Bc9e7595f0bEb"
        self.nft_address = "0x1234567890123456789012345678901234567890"
        
        # Mock data storage
        self.mock_wallets = {}
        self.mock_nfts = {}
        self.mock_cashback = {}
        
        print("🎭 Mock Blockchain Service initialized for frontend testing")
    
    def _generate_mock_tx_hash(self) -> str:
        """Generate realistic-looking transaction hash"""
        random_bytes = os.urandom(32)
        return '0x' + random_bytes.hex()
    
    def _generate_mock_block_number(self) -> int:
        """Generate realistic block number"""
        return random.randint(40000000, 41000000)
    
    # ==================== WALLET OPERATIONS ====================
    
    def validate_wallet_address(self, address: str) -> bool:
        """Validate Ethereum address format"""
        if not address or not isinstance(address, str):
            return False
        return address.startswith('0x') and len(address) == 42
    
    def get_wallet_balance(self, address: str) -> Dict:
        """Get mock MATIC and MAKU token balance"""
        if not self.validate_wallet_address(address):
            return {'error': 'Invalid wallet address'}
        
        # Initialize mock wallet if not exists
        if address not in self.mock_wallets:
            self.mock_wallets[address] = {
                'matic': random.uniform(0.5, 5.0),
                'maku': random.uniform(0, 500.0),
                'created_at': datetime.utcnow()
            }
        
        wallet = self.mock_wallets[address]
        
        return {
            'address': address,
            'matic_balance': round(wallet['matic'], 4),
            'maku_balance': round(wallet['maku'], 2),
            'chain_id': self.chain_id,
            'network': 'mumbai',
            'mock_mode': True
        }
    
    # ==================== MAKU TOKEN OPERATIONS ====================
    
    def get_pending_cashback(self, address: str) -> float:
        """Get mock pending cashback"""
        if address not in self.mock_cashback:
            self.mock_cashback[address] = round(random.uniform(0, 50.0), 2)
        
        return self.mock_cashback[address]
    
    def add_cashback(self, user_address: str, booking_amount_usd: float) -> Dict:
        """
        Mock cashback addition (simulates blockchain transaction)
        """
        if not self.validate_wallet_address(user_address):
            return {'error': 'Invalid wallet address'}
        
        # Calculate cashback (1% default for mock)
        cashback_amount = booking_amount_usd * 0.01
        
        # Update mock pending cashback
        if user_address not in self.mock_cashback:
            self.mock_cashback[user_address] = 0
        
        self.mock_cashback[user_address] += cashback_amount
        
        tx_hash = self._generate_mock_tx_hash()
        block_number = self._generate_mock_block_number()
        
        return {
            'success': True,
            'transaction_hash': tx_hash,
            'block_number': block_number,
            'gas_used': random.randint(80000, 120000),
            'user_address': user_address,
            'booking_amount': booking_amount_usd,
            'cashback_amount': round(cashback_amount, 2),
            'explorer_url': f"{self.explorer_url}/tx/{tx_hash}",
            'mock_mode': True,
            'note': 'This is a simulated transaction for testing'
        }
    
    def claim_cashback(self, user_address: str) -> Dict:
        """
        Mock cashback claim (simulates user claiming their rewards)
        """
        if not self.validate_wallet_address(user_address):
            return {'error': 'Invalid wallet address'}
        
        pending = self.get_pending_cashback(user_address)
        
        if pending <= 0:
            return {'error': 'No pending cashback to claim'}
        
        # Update balances
        if user_address in self.mock_wallets:
            self.mock_wallets[user_address]['maku'] += pending
        
        # Clear pending
        self.mock_cashback[user_address] = 0
        
        tx_hash = self._generate_mock_tx_hash()
        
        return {
            'success': True,
            'transaction_hash': tx_hash,
            'amount_claimed': round(pending, 2),
            'new_balance': round(self.mock_wallets.get(user_address, {}).get('maku', 0), 2),
            'explorer_url': f"{self.explorer_url}/tx/{tx_hash}",
            'mock_mode': True
        }
    
    # ==================== NFT OPERATIONS ====================
    
    def get_user_nfts(self, address: str) -> List[Dict]:
        """Get mock NFTs for user"""
        if not self.validate_wallet_address(address):
            return []
        
        # Generate mock NFTs if not exists
        if address not in self.mock_nfts:
            # 30% chance of having NFTs
            if random.random() < 0.3:
                num_nfts = random.randint(1, 3)
                self.mock_nfts[address] = []
                
                tiers = ['Bronze', 'Silver', 'Gold', 'Platinum']
                cashback_rates = [1.0, 3.0, 6.0, 10.0]
                
                for i in range(num_nfts):
                    tier_idx = random.randint(0, min(i + 1, 3))
                    self.mock_nfts[address].append({
                        'token_id': random.randint(1, 10000),
                        'tier': tiers[tier_idx],
                        'cashback_rate': cashback_rates[tier_idx],
                        'minted_at': int(datetime.utcnow().timestamp()) - random.randint(0, 30*24*3600),
                        'metadata_uri': f'ipfs://Qm{uuid.uuid4().hex[:40]}',
                        'contract_address': self.nft_address,
                        'mock_mode': True
                    })
            else:
                self.mock_nfts[address] = []
        
        return self.mock_nfts[address]
    
    def get_highest_cashback_rate(self, address: str) -> float:
        """Get highest cashback rate from user's NFTs"""
        nfts = self.get_user_nfts(address)
        
        if not nfts:
            return 1.0  # Bronze default
        
        return max([nft['cashback_rate'] for nft in nfts])
    
    def mint_nft_for_user(
        self,
        user_address: str,
        tier: int,
        metadata_uri: str
    ) -> Dict:
        """
        Mock NFT minting
        tier: 0=Bronze, 1=Silver, 2=Gold, 3=Platinum
        """
        if not self.validate_wallet_address(user_address):
            return {'error': 'Invalid wallet address'}
        
        tier_names = ['Bronze', 'Silver', 'Gold', 'Platinum']
        cashback_rates = [1.0, 3.0, 6.0, 10.0]
        
        if tier < 0 or tier > 3:
            return {'error': 'Invalid tier'}
        
        token_id = random.randint(10000, 99999)
        
        nft = {
            'token_id': token_id,
            'tier': tier_names[tier],
            'cashback_rate': cashback_rates[tier],
            'minted_at': int(datetime.utcnow().timestamp()),
            'metadata_uri': metadata_uri,
            'contract_address': self.nft_address,
            'mock_mode': True
        }
        
        # Add to user's NFTs
        if user_address not in self.mock_nfts:
            self.mock_nfts[user_address] = []
        
        self.mock_nfts[user_address].append(nft)
        
        tx_hash = self._generate_mock_tx_hash()
        
        return {
            'success': True,
            'transaction_hash': tx_hash,
            'token_id': token_id,
            'tier': tier_names[tier],
            'cashback_rate': cashback_rates[tier],
            'block_number': self._generate_mock_block_number(),
            'gas_used': random.randint(200000, 300000),
            'explorer_url': f"{self.explorer_url}/tx/{tx_hash}",
            'mock_mode': True,
            'note': 'This is a simulated NFT mint for testing'
        }
    
    def purchase_nft(
        self,
        user_address: str,
        tier: int,
        payment_amount_matic: float
    ) -> Dict:
        """
        Mock NFT purchase with MATIC payment
        """
        tier_prices = [0, 0.01, 0.03, 0.1]  # Bronze, Silver, Gold, Platinum
        tier_names = ['Bronze', 'Silver', 'Gold', 'Platinum']
        
        if tier < 0 or tier > 3:
            return {'error': 'Invalid tier'}
        
        required_price = tier_prices[tier]
        
        if payment_amount_matic < required_price:
            return {'error': f'Insufficient payment. Required: {required_price} MATIC'}
        
        # Mock purchase
        metadata_uri = f'ipfs://Qm{uuid.uuid4().hex[:40]}'
        result = self.mint_nft_for_user(user_address, tier, metadata_uri)
        
        if result.get('success'):
            result['purchase_price'] = required_price
            result['payment_amount'] = payment_amount_matic
            result['refund'] = round(payment_amount_matic - required_price, 4)
        
        return result
    
    # ==================== UTILITY FUNCTIONS ====================
    
    def get_network_info(self) -> Dict:
        """Get mock network information"""
        return {
            'network': 'mumbai',
            'chain_id': self.chain_id,
            'rpc_url': 'https://rpc-mumbai.maticvigil.com',
            'explorer_url': self.explorer_url,
            'latest_block': self._generate_mock_block_number(),
            'gas_price_gwei': round(random.uniform(1.0, 5.0), 2),
            'token_address': self.token_address,
            'nft_address': self.nft_address,
            'connected': True,
            'mock_mode': True,
            'note': 'Using mock blockchain service for frontend testing'
        }
    
    def estimate_gas(self, transaction_type: str) -> Dict:
        """Estimate gas costs"""
        estimates = {
            'add_cashback': 150000,
            'claim_cashback': 100000,
            'mint_nft': 250000,
            'purchase_nft': 280000,
            'transfer': 21000
        }
        
        gas_limit = estimates.get(transaction_type, 100000)
        gas_price_gwei = round(random.uniform(1.0, 5.0), 2)
        
        cost_matic = (gas_limit * gas_price_gwei) / 1e9
        
        return {
            'transaction_type': transaction_type,
            'estimated_gas': gas_limit,
            'gas_price_gwei': gas_price_gwei,
            'estimated_cost_matic': round(cost_matic, 6),
            'estimated_cost_usd': round(cost_matic * 0.5, 4),
            'mock_mode': True
        }
    
    def get_tier_info(self) -> Dict:
        """Get tier information"""
        return {
            'tiers': [
                {
                    'name': 'Bronze',
                    'level': 0,
                    'cashback_rate': 1.0,
                    'price_matic': 0,
                    'price_usd': 0,
                    'bookings_required': 1,
                    'perks': ['Basic rewards', 'Travel NFTs']
                },
                {
                    'name': 'Silver',
                    'level': 1,
                    'cashback_rate': 3.0,
                    'price_matic': 0.01,
                    'price_usd': 99,
                    'bookings_required': 10,
                    'perks': ['Priority support', 'Enhanced collection']
                },
                {
                    'name': 'Gold',
                    'level': 2,
                    'cashback_rate': 6.0,
                    'price_matic': 0.03,
                    'price_usd': 299,
                    'bookings_required': 50,
                    'perks': ['Exclusive invitation-only stays', 'Premium support']
                },
                {
                    'name': 'Platinum',
                    'level': 3,
                    'cashback_rate': 10.0,
                    'price_matic': 0.1,
                    'price_usd': 999,
                    'bookings_required': 100,
                    'perks': ['VIP exclusive stays', 'Free Hugging Face LLM', 'Maximum rewards']
                }
            ],
            'mock_mode': True
        }


# Singleton instance
_mock_blockchain_service = None

def get_mock_blockchain_service() -> MockBlockchainService:
    """Get or create mock blockchain service instance"""
    global _mock_blockchain_service
    if _mock_blockchain_service is None:
        _mock_blockchain_service = MockBlockchainService()
    return _mock_blockchain_service
