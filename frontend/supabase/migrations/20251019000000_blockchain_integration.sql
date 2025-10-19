-- Blockchain Integration Schema for MAKU Travel
-- Stores wallet addresses, transactions, NFT metadata, and cashback history

-- User Wallets Table
CREATE TABLE IF NOT EXISTS user_wallets (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    user_id UUID NOT NULL,
    wallet_address TEXT NOT NULL UNIQUE,
    chain_id INTEGER NOT NULL DEFAULT 80001, -- Polygon Mumbai testnet
    connected_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
    last_active TIMESTAMPTZ NOT NULL DEFAULT NOW(),
    is_verified BOOLEAN DEFAULT false,
    metadata JSONB DEFAULT '{}'::jsonb,
    CONSTRAINT valid_wallet_address CHECK (wallet_address ~ '^0x[a-fA-F0-9]{40}$')
);

CREATE INDEX idx_user_wallets_user_id ON user_wallets(user_id);
CREATE INDEX idx_user_wallets_address ON user_wallets(wallet_address);

-- MAKU Token Transactions Table
CREATE TABLE IF NOT EXISTS maku_transactions (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    user_wallet_address TEXT NOT NULL,
    transaction_hash TEXT NOT NULL UNIQUE,
    transaction_type TEXT NOT NULL, -- 'cashback_earned', 'cashback_claimed', 'transfer', 'purchase'
    amount DECIMAL(20, 8) NOT NULL,
    from_address TEXT,
    to_address TEXT,
    booking_id UUID, -- Reference to booking if applicable
    status TEXT NOT NULL DEFAULT 'pending', -- 'pending', 'confirmed', 'failed'
    block_number BIGINT,
    gas_used BIGINT,
    gas_price BIGINT,
    created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
    confirmed_at TIMESTAMPTZ,
    metadata JSONB DEFAULT '{}'::jsonb,
    CONSTRAINT valid_tx_hash CHECK (transaction_hash ~ '^0x[a-fA-F0-9]{64}$')
);

CREATE INDEX idx_maku_transactions_wallet ON maku_transactions(user_wallet_address);
CREATE INDEX idx_maku_transactions_type ON maku_transactions(transaction_type);
CREATE INDEX idx_maku_transactions_status ON maku_transactions(status);
CREATE INDEX idx_maku_transactions_booking ON maku_transactions(booking_id) WHERE booking_id IS NOT NULL;

-- NFT Memberships Table
CREATE TABLE IF NOT EXISTS nft_memberships (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    user_wallet_address TEXT NOT NULL,
    token_id BIGINT NOT NULL,
    tier TEXT NOT NULL, -- 'bronze', 'silver', 'gold', 'platinum'
    cashback_rate DECIMAL(5, 2) NOT NULL, -- Stored as percentage (e.g., 1.00, 3.00, 6.00, 10.00)
    contract_address TEXT NOT NULL,
    metadata_uri TEXT,
    purchase_type TEXT NOT NULL, -- 'purchased', 'earned'
    purchase_price DECIMAL(20, 8), -- In MATIC
    transaction_hash TEXT,
    minted_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
    is_active BOOLEAN DEFAULT true,
    metadata JSONB DEFAULT '{}'::jsonb,
    UNIQUE(contract_address, token_id)
);

CREATE INDEX idx_nft_memberships_wallet ON nft_memberships(user_wallet_address);
CREATE INDEX idx_nft_memberships_tier ON nft_memberships(tier);
CREATE INDEX idx_nft_memberships_active ON nft_memberships(is_active);

-- Cashback History Table
CREATE TABLE IF NOT EXISTS cashback_history (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    user_wallet_address TEXT NOT NULL,
    booking_id UUID NOT NULL,
    booking_amount DECIMAL(20, 2) NOT NULL,
    base_cashback_amount DECIMAL(20, 8) NOT NULL,
    nft_bonus_amount DECIMAL(20, 8) DEFAULT 0,
    provider_bonus_amount DECIMAL(20, 8) DEFAULT 0,
    total_cashback_amount DECIMAL(20, 8) NOT NULL,
    cashback_rate DECIMAL(5, 2) NOT NULL,
    tier TEXT NOT NULL,
    provider TEXT,
    nft_multiplier DECIMAL(5, 2) DEFAULT 1.00,
    status TEXT NOT NULL DEFAULT 'pending', -- 'pending', 'distributed', 'claimed'
    transaction_hash TEXT,
    earned_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
    distributed_at TIMESTAMPTZ,
    claimed_at TIMESTAMPTZ,
    metadata JSONB DEFAULT '{}'::jsonb
);

CREATE INDEX idx_cashback_history_wallet ON cashback_history(user_wallet_address);
CREATE INDEX idx_cashback_history_booking ON cashback_history(booking_id);
CREATE INDEX idx_cashback_history_status ON cashback_history(status);

-- Blockchain Configuration Table
CREATE TABLE IF NOT EXISTS blockchain_config (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    network TEXT NOT NULL UNIQUE, -- 'mumbai', 'polygon', 'testnet', 'mainnet'
    chain_id INTEGER NOT NULL,
    rpc_url TEXT NOT NULL,
    explorer_url TEXT NOT NULL,
    token_contract_address TEXT,
    nft_contract_address TEXT,
    is_active BOOLEAN DEFAULT true,
    deployed_at TIMESTAMPTZ,
    metadata JSONB DEFAULT '{}'::jsonb
);

-- Insert Mumbai testnet config
INSERT INTO blockchain_config (network, chain_id, rpc_url, explorer_url, is_active)
VALUES (
    'mumbai',
    80001,
    'https://rpc-mumbai.maticvigil.com',
    'https://mumbai.polygonscan.com',
    true
) ON CONFLICT (network) DO NOTHING;

-- User Tier Progression Table
CREATE TABLE IF NOT EXISTS user_tier_progression (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    user_wallet_address TEXT NOT NULL UNIQUE,
    current_tier TEXT NOT NULL DEFAULT 'bronze',
    total_bookings INTEGER NOT NULL DEFAULT 0,
    total_spent DECIMAL(20, 2) NOT NULL DEFAULT 0,
    total_cashback_earned DECIMAL(20, 8) NOT NULL DEFAULT 0,
    nfts_owned INTEGER NOT NULL DEFAULT 0,
    highest_nft_tier TEXT,
    next_tier TEXT,
    bookings_to_next_tier INTEGER,
    progress_percentage DECIMAL(5, 2),
    updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

CREATE INDEX idx_user_tier_progression_wallet ON user_tier_progression(user_wallet_address);
CREATE INDEX idx_user_tier_progression_tier ON user_tier_progression(current_tier);

-- Functions for automatic updates

-- Update tier progression after booking
CREATE OR REPLACE FUNCTION update_tier_progression()
RETURNS TRIGGER AS $$
BEGIN
    INSERT INTO user_tier_progression (
        user_wallet_address,
        total_bookings,
        total_spent,
        total_cashback_earned,
        updated_at
    )
    VALUES (
        NEW.user_wallet_address,
        1,
        NEW.booking_amount,
        NEW.total_cashback_amount,
        NOW()
    )
    ON CONFLICT (user_wallet_address)
    DO UPDATE SET
        total_bookings = user_tier_progression.total_bookings + 1,
        total_spent = user_tier_progression.total_spent + NEW.booking_amount,
        total_cashback_earned = user_tier_progression.total_cashback_earned + NEW.total_cashback_amount,
        updated_at = NOW();
    
    RETURN NEW;
END;
$$ LANGUAGE plpgsql;

CREATE TRIGGER trigger_update_tier_progression
    AFTER INSERT ON cashback_history
    FOR EACH ROW
    EXECUTE FUNCTION update_tier_progression();

-- Update NFT count in tier progression
CREATE OR REPLACE FUNCTION update_nft_count()
RETURNS TRIGGER AS $$
DECLARE
    nft_count INTEGER;
    highest_tier TEXT;
BEGIN
    -- Count active NFTs
    SELECT COUNT(*), MAX(tier)
    INTO nft_count, highest_tier
    FROM nft_memberships
    WHERE user_wallet_address = NEW.user_wallet_address
    AND is_active = true;
    
    -- Update progression
    UPDATE user_tier_progression
    SET 
        nfts_owned = nft_count,
        highest_nft_tier = highest_tier,
        updated_at = NOW()
    WHERE user_wallet_address = NEW.user_wallet_address;
    
    RETURN NEW;
END;
$$ LANGUAGE plpgsql;

CREATE TRIGGER trigger_update_nft_count
    AFTER INSERT OR UPDATE ON nft_memberships
    FOR EACH ROW
    EXECUTE FUNCTION update_nft_count();

-- Row Level Security (RLS) Policies

-- Enable RLS
ALTER TABLE user_wallets ENABLE ROW LEVEL SECURITY;
ALTER TABLE maku_transactions ENABLE ROW LEVEL SECURITY;
ALTER TABLE nft_memberships ENABLE ROW LEVEL SECURITY;
ALTER TABLE cashback_history ENABLE ROW LEVEL SECURITY;
ALTER TABLE user_tier_progression ENABLE ROW LEVEL SECURITY;

-- Users can view their own wallet data
CREATE POLICY user_wallets_select_policy ON user_wallets
    FOR SELECT
    USING (auth.uid() = user_id);

-- Users can view their own transactions
CREATE POLICY maku_transactions_select_policy ON maku_transactions
    FOR SELECT
    USING (user_wallet_address IN (
        SELECT wallet_address FROM user_wallets WHERE user_id = auth.uid()
    ));

-- Users can view their own NFTs
CREATE POLICY nft_memberships_select_policy ON nft_memberships
    FOR SELECT
    USING (user_wallet_address IN (
        SELECT wallet_address FROM user_wallets WHERE user_id = auth.uid()
    ));

-- Users can view their own cashback history
CREATE POLICY cashback_history_select_policy ON cashback_history
    FOR SELECT
    USING (user_wallet_address IN (
        SELECT wallet_address FROM user_wallets WHERE user_id = auth.uid()
    ));

-- Users can view their own tier progression
CREATE POLICY user_tier_progression_select_policy ON user_tier_progression
    FOR SELECT
    USING (user_wallet_address IN (
        SELECT wallet_address FROM user_wallets WHERE user_id = auth.uid()
    ));

-- Service role (backend) can insert/update all tables
CREATE POLICY service_role_all_policy ON user_wallets
    FOR ALL
    USING (auth.role() = 'service_role');

CREATE POLICY service_role_tx_policy ON maku_transactions
    FOR ALL
    USING (auth.role() = 'service_role');

CREATE POLICY service_role_nft_policy ON nft_memberships
    FOR ALL
    USING (auth.role() = 'service_role');

CREATE POLICY service_role_cashback_policy ON cashback_history
    FOR ALL
    USING (auth.role() = 'service_role');

CREATE POLICY service_role_progression_policy ON user_tier_progression
    FOR ALL
    USING (auth.role() = 'service_role');

-- Comments for documentation
COMMENT ON TABLE user_wallets IS 'Stores connected wallet addresses for users';
COMMENT ON TABLE maku_transactions IS 'All MAKU token transactions including cashback';
COMMENT ON TABLE nft_memberships IS 'NFT membership tokens owned by users';
COMMENT ON TABLE cashback_history IS 'Complete history of cashback earnings from bookings';
COMMENT ON TABLE blockchain_config IS 'Blockchain network configuration (Mumbai/Polygon)';
COMMENT ON TABLE user_tier_progression IS 'User tier progression and statistics';

-- Grant permissions
GRANT ALL ON ALL TABLES IN SCHEMA public TO service_role;
GRANT ALL ON ALL SEQUENCES IN SCHEMA public TO service_role;
GRANT USAGE ON ALL SEQUENCES IN SCHEMA public TO anon, authenticated;
