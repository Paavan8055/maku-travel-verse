"""
Cross-Chain Bridge Service
Handles token bridging between Polygon, Sui, and other chains via Agglayer
"""

from fastapi import APIRouter, HTTPException, Query
from pydantic import BaseModel
from typing import Dict, List, Any, Optional
from datetime import datetime
import httpx
import os

router = APIRouter(prefix="/api/bridge", tags=["Cross-Chain Bridge"])

# Configuration
AGGLAYER_RPC = os.getenv('AGGLAYER_RPC_URL', 'https://rpc.agglayer.polygon.technology')
SUI_RPC = os.getenv('SUI_RPC_URL', 'https://fullnode.mainnet.sui.io:443')
POLYGON_RPC = os.getenv('POLYGON_RPC_URL', 'https://polygon-rpc.com')


class BridgeRequest(BaseModel):
    """Bridge request model"""
    from_chain: str  # 'polygon', 'sui', 'ethereum'
    to_chain: str
    amount: float
    recipient_address: str
    user_wallet: str


class BridgeQuote(BaseModel):
    """Bridge quote response"""
    from_chain: str
    to_chain: str
    amount: float
    estimated_fee: float
    estimated_time_seconds: int
    exchange_rate: float
    min_amount: float
    max_amount: float


@router.get("/supported-chains")
async def get_supported_chains():
    """
    Get list of supported chains for bridging
    
    Returns:
        List of chains with bridge capabilities
    """
    return {
        "success": True,
        "chains": [
            {
                "chain_id": "polygon",
                "name": "Polygon PoS",
                "network_id": 137,
                "native_currency": "MATIC",
                "maku_contract": os.getenv('MAKU_TOKEN_ADDRESS_POLYGON'),
                "bridge_method": "agglayer",
                "avg_bridge_time_seconds": 30,
                "avg_fee_usd": 0.01
            },
            {
                "chain_id": "polygon_zkevm",
                "name": "Polygon zkEVM",
                "network_id": 1101,
                "native_currency": "ETH",
                "maku_contract": os.getenv('MAKU_TOKEN_ADDRESS_ZKEVM'),
                "bridge_method": "agglayer",
                "avg_bridge_time_seconds": 45,
                "avg_fee_usd": 0.02
            },
            {
                "chain_id": "sui",
                "name": "Sui Network",
                "network_id": 101,
                "native_currency": "SUI",
                "maku_contract": os.getenv('MAKU_PACKAGE_ID_SUI'),
                "bridge_method": "custom",
                "avg_bridge_time_seconds": 10,
                "avg_fee_usd": 0.001
            },
            {
                "chain_id": "ethereum",
                "name": "Ethereum Mainnet",
                "network_id": 1,
                "native_currency": "ETH",
                "maku_contract": os.getenv('MAKU_TOKEN_ADDRESS_ETH'),
                "bridge_method": "0x_api",
                "avg_bridge_time_seconds": 300,
                "avg_fee_usd": 5.00
            }
        ]
    }


@router.post("/quote", response_model=Dict[str, Any])
async def get_bridge_quote(request: BridgeRequest):
    """
    Get bridge quote for cross-chain transfer
    
    Args:
        request: Bridge request details
        
    Returns:
        Quote with fees and estimated time
    """
    try:
        # Validate chains
        supported_chains = ['polygon', 'sui', 'ethereum', 'polygon_zkevm']
        
        if request.from_chain not in supported_chains:
            raise HTTPException(status_code=400, detail=f"Unsupported source chain: {request.from_chain}")
        
        if request.to_chain not in supported_chains:
            raise HTTPException(status_code=400, detail=f"Unsupported destination chain: {request.to_chain}")
        
        # Calculate fees based on route
        fee_estimates = {
            ('polygon', 'sui'): {'fee': 0.01, 'time': 60},
            ('sui', 'polygon'): {'fee': 0.01, 'time': 60},
            ('polygon', 'ethereum'): {'fee': 5.00, 'time': 300},
            ('ethereum', 'polygon'): {'fee': 3.00, 'time': 300},
            ('polygon', 'polygon_zkevm'): {'fee': 0.005, 'time': 30},  # Via Agglayer
        }
        
        route = (request.from_chain, request.to_chain)
        estimate = fee_estimates.get(route, {'fee': 1.00, 'time': 120})
        
        return {
            "success": True,
            "quote": {
                "from_chain": request.from_chain,
                "to_chain": request.to_chain,
                "amount": request.amount,
                "estimated_fee_usd": estimate['fee'],
                "estimated_time_seconds": estimate['time'],
                "exchange_rate": 1.0,  # 1:1 for same token
                "min_amount": 0.01,
                "max_amount": 10000.0,
                "bridge_method": "agglayer" if 'polygon' in route else "0x_api",
                "recipient": request.recipient_address
            },
            "warnings": [] if request.amount >= 0.01 else ["Amount below minimum (0.01 MAKU)"]
        }
        
    except HTTPException:
        raise
    except Exception as e:
        raise HTTPException(status_code=500, detail=f"Quote failed: {str(e)}")


@router.post("/execute")
async def execute_bridge(request: BridgeRequest):
    """
    Execute cross-chain bridge transaction
    
    Process:
    1. Lock tokens on source chain
    2. Submit bridge request to Agglayer/0x
    3. Mint tokens on destination chain
    4. Return transaction hashes
    
    Args:
        request: Bridge execution details
        
    Returns:
        Transaction confirmation with tracking info
    """
    try:
        # In production, this would:
        # 1. Call source chain contract to lock tokens
        # 2. Submit to Agglayer bridge oracle
        # 3. Wait for confirmation
        # 4. Mint on destination chain
        
        # For now, return mock bridge transaction
        bridge_tx_id = f"BRIDGE_{datetime.now().strftime('%Y%m%d%H%M%S')}"
        
        return {
            "success": True,
            "bridge_transaction_id": bridge_tx_id,
            "from_chain": request.from_chain,
            "to_chain": request.to_chain,
            "amount": request.amount,
            "status": "pending",
            "estimated_completion": datetime.now().isoformat(),
            "transactions": {
                "source_chain_lock_tx": f"0x{bridge_tx_id}_lock",
                "bridge_oracle_tx": f"0x{bridge_tx_id}_oracle",
                "destination_chain_mint_tx": None  # Will be available after confirmation
            },
            "tracking_url": f"https://agglayer.polygon.technology/tx/{bridge_tx_id}",
            "next_steps": [
                "Tokens locked on source chain",
                "Waiting for bridge oracle confirmation (30-60 seconds)",
                "Tokens will be minted on destination chain",
                "Check tracking URL for status updates"
            ]
        }
        
    except Exception as e:
        raise HTTPException(status_code=500, detail=f"Bridge execution failed: {str(e)}")


@router.get("/status/{bridge_tx_id}")
async def get_bridge_status(bridge_tx_id: str):
    """
    Get status of bridge transaction
    
    Args:
        bridge_tx_id: Bridge transaction ID
        
    Returns:
        Current status and confirmations
    """
    try:
        # In production, query Agglayer oracle or indexer
        # For now, return mock status
        
        return {
            "success": True,
            "bridge_tx_id": bridge_tx_id,
            "status": "completed",  # pending, confirming, completed, failed
            "confirmations": {
                "source_chain": 12,
                "bridge_oracle": 6,
                "destination_chain": 8
            },
            "transactions": {
                "source_lock": f"0x{bridge_tx_id}_lock",
                "bridge_oracle": f"0x{bridge_tx_id}_oracle",
                "destination_mint": f"0x{bridge_tx_id}_mint"
            },
            "timeline": [
                {"step": "Lock on source", "status": "confirmed", "timestamp": datetime.now().isoformat()},
                {"step": "Bridge oracle", "status": "confirmed", "timestamp": datetime.now().isoformat()},
                {"step": "Mint on destination", "status": "confirmed", "timestamp": datetime.now().isoformat()}
            ]
        }
        
    except Exception as e:
        raise HTTPException(status_code=500, detail=f"Status check failed: {str(e)}")


@router.get("/history/{wallet_address}")
async def get_bridge_history(
    wallet_address: str,
    limit: int = Query(20, ge=1, le=100)
):
    """
    Get bridge transaction history for wallet
    
    Args:
        wallet_address: User's wallet address
        limit: Number of transactions to return
        
    Returns:
        List of bridge transactions
    """
    try:
        # In production, query from database or indexer
        # For now, return mock history
        
        return {
            "success": True,
            "wallet": wallet_address,
            "transactions": [
                {
                    "bridge_tx_id": "BRIDGE_20260125120000",
                    "from_chain": "polygon",
                    "to_chain": "sui",
                    "amount": 100.0,
                    "fee": 0.01,
                    "status": "completed",
                    "timestamp": datetime.now().isoformat()
                }
            ],
            "statistics": {
                "total_bridges": 1,
                "total_volume": 100.0,
                "total_fees_paid": 0.01,
                "favorite_route": "polygon -> sui"
            }
        }
        
    except Exception as e:
        raise HTTPException(status_code=500, detail=f"History fetch failed: {str(e)}")


@router.get("/liquidity")
async def get_bridge_liquidity():
    """
    Get current bridge liquidity across all chains
    
    Returns:
        Liquidity pools and available amounts
    """
    try:
        return {
            "success": True,
            "timestamp": datetime.now().isoformat(),
            "liquidity_pools": [
                {
                    "chain": "polygon",
                    "available": 500000.0,
                    "locked": 100000.0,
                    "total": 600000.0,
                    "utilization_percent": 16.67
                },
                {
                    "chain": "sui",
                    "available": 300000.0,
                    "locked": 50000.0,
                    "total": 350000.0,
                    "utilization_percent": 14.29
                },
                {
                    "chain": "ethereum",
                    "available": 200000.0,
                    "locked": 100000.0,
                    "total": 300000.0,
                    "utilization_percent": 33.33
                }
            ],
            "total_liquidity": 1250000.0,
            "total_locked": 250000.0,
            "global_utilization": 20.0
        }
        
    except Exception as e:
        raise HTTPException(status_code=500, detail=f"Liquidity check failed: {str(e)}")
