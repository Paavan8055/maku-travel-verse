// MAKU Token Bridge for Sui Network
// Move language smart contract for cross-chain token transfers

module maku::cross_chain_bridge {
    use sui::coin::{Self, Coin, TreasuryCap};
    use sui::transfer;
    use sui::tx_context::{Self, TxContext};
    use sui::object::{Self, UID};
    use sui::balance::{Self, Balance};
    use sui::event;
    use std::option;
    
    /// MAKU token witness
    struct MAKU has drop {}
    
    /// Bridge configuration
    struct BridgeConfig has key {
        id: UID,
        admin: address,
        polygon_bridge_address: vector<u8>,  // Polygon contract address
        is_active: bool,
        total_locked: u64,
        total_minted: u64,
        min_bridge_amount: u64,
        max_bridge_amount: u64,
    }
    
    /// Pending bridge transaction
    struct PendingBridge has key {
        id: UID,
        user: address,
        amount: u64,
        destination_chain: vector<u8>,  // "polygon", "ethereum", etc.
        destination_address: vector<u8>,
        timestamp: u64,
        status: u8,  // 0=pending, 1=confirmed, 2=failed
    }
    
    /// Events
    struct BridgeToPolygonEvent has copy, drop {
        user: address,
        amount: u64,
        polygon_address: vector<u8>,
        tx_hash: vector<u8>,
    }
    
    struct BridgeFromPolygonEvent has copy, drop {
        user: address,
        amount: u64,
        polygon_tx_hash: vector<u8>,
    }
    
    struct CashbackClaimedEvent has copy, drop {
        user: address,
        amount: u64,
        booking_id: vector<u8>,
    }
    
    /// Initialize the bridge
    fun init(witness: MAKU, ctx: &mut TxContext) {
        // Create the currency
        let (treasury, metadata) = coin::create_currency(
            witness,
            9,  // 9 decimals
            b"MAKU",
            b"MAKU Travel Token",
            b"Cross-chain travel rewards token",
            option::none(),
            ctx
        );
        
        // Transfer treasury cap to deployer
        transfer::public_transfer(treasury, tx_context::sender(ctx));
        
        // Share metadata object
        transfer::public_share_object(metadata);
        
        // Create bridge configuration
        let bridge_config = BridgeConfig {
            id: object::new(ctx),
            admin: tx_context::sender(ctx),
            polygon_bridge_address: b"0x0000000000000000000000000000000000000000",  // To be updated
            is_active: false,
            total_locked: 0,
            total_minted: 0,
            min_bridge_amount: 10_000_000,  // 0.01 MAKU
            max_bridge_amount: 1_000_000_000_000,  // 1000 MAKU
        };
        
        transfer::share_object(bridge_config);
    }
    
    /// Bridge tokens FROM Polygon TO Sui
    public entry fun bridge_from_polygon(
        config: &mut BridgeConfig,
        treasury: &mut TreasuryCap<MAKU>,
        recipient: address,
        amount: u64,
        polygon_tx_hash: vector<u8>,
        ctx: &mut TxContext
    ) {
        // Verify caller is admin
        assert!(tx_context::sender(ctx) == config.admin, 0);
        assert!(config.is_active, 1);
        assert!(amount >= config.min_bridge_amount, 2);
        assert!(amount <= config.max_bridge_amount, 3);
        
        // Mint tokens on Sui (equivalent to locked tokens on Polygon)
        let minted_coins = coin::mint(treasury, amount, ctx);
        
        // Transfer to recipient
        transfer::public_transfer(minted_coins, recipient);
        
        // Update stats
        config.total_minted = config.total_minted + amount;
        
        // Emit event
        event::emit(BridgeFromPolygonEvent {
            user: recipient,
            amount,
            polygon_tx_hash,
        });
    }
    
    /// Bridge tokens FROM Sui TO Polygon
    public entry fun bridge_to_polygon(
        config: &mut BridgeConfig,
        payment: Coin<MAKU>,
        polygon_address: vector<u8>,
        ctx: &mut TxContext
    ) {
        assert!(config.is_active, 1);
        
        let amount = coin::value(&payment);
        assert!(amount >= config.min_bridge_amount, 2);
        assert!(amount <= config.max_bridge_amount, 3);
        
        // Lock tokens (burn on Sui side)
        let locked_balance = coin::into_balance(payment);
        balance::destroy_for_testing(locked_balance);  // In production, lock in treasury
        
        // Update stats
        config.total_locked = config.total_locked + amount;
        
        // Create pending bridge record
        let pending = PendingBridge {
            id: object::new(ctx),
            user: tx_context::sender(ctx),
            amount,
            destination_chain: b"polygon",
            destination_address: polygon_address,
            timestamp: tx_context::epoch(ctx),
            status: 0,  // pending
        };
        
        transfer::share_object(pending);
        
        // Emit event for bridge oracle to process
        event::emit(BridgeToPolygonEvent {
            user: tx_context::sender(ctx),
            amount,
            polygon_address,
            tx_hash: object::uid_to_bytes(&pending.id),
        });
    }
    
    /// Claim travel cashback
    public entry fun claim_cashback(
        treasury: &mut TreasuryCap<MAKU>,
        amount: u64,
        booking_id: vector<u8>,
        ctx: &mut TxContext
    ) {
        // In production, verify booking via oracle
        // For now, mint cashback directly
        
        let cashback_coins = coin::mint(treasury, amount, ctx);
        let recipient = tx_context::sender(ctx);
        
        transfer::public_transfer(cashback_coins, recipient);
        
        event::emit(CashbackClaimedEvent {
            user: recipient,
            amount,
            booking_id,
        });
    }
    
    /// Update bridge configuration
    public entry fun update_bridge_config(
        config: &mut BridgeConfig,
        polygon_bridge: vector<u8>,
        is_active: bool,
        ctx: &mut TxContext
    ) {
        assert!(tx_context::sender(ctx) == config.admin, 0);
        
        config.polygon_bridge_address = polygon_bridge;
        config.is_active = is_active;
    }
    
    /// Get bridge statistics
    public fun get_bridge_stats(config: &BridgeConfig): (u64, u64, bool) {
        (config.total_locked, config.total_minted, config.is_active)
    }
}
