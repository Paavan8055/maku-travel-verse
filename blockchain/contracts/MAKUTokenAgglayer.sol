// SPDX-License-Identifier: MIT
pragma solidity ^0.8.19;

import "@openzeppelin/contracts/token/ERC20/ERC20.sol";
import "@openzeppelin/contracts/access/Ownable.sol";
import "@openzeppelin/contracts/security/Pausable.sol";

/**
 * @title MAKUTokenAgglayer
 * @dev MAKU Token with Polygon Agglayer integration
 * 
 * Features:
 * - ERC20 token standard
 * - Polygon Agglayer Breakout Program integration
 * - Cross-chain bridge support
 * - Airdrop distribution to POL stakers
 * - Travel booking cashback system
 */
contract MAKUTokenAgglayer is ERC20, Ownable, Pausable {
    
    // Token configuration
    uint256 public constant TOTAL_SUPPLY = 10_000_000 * 10**18; // 10M tokens
    
    // Airdrop configuration for Polygon Agglayer
    uint256 public constant AIRDROP_ALLOCATION = 1_000_000 * 10**18; // 10% to POL stakers
    uint256 public constant PROVIDER_ALLOCATION = 1_500_000 * 10**18; // 15% to travel providers
    uint256 public constant TEAM_ALLOCATION = 1_000_000 * 10**18; // 10% to team
    uint256 public constant COMMUNITY_ALLOCATION = 1_000_000 * 10**18; // 10% to community
    uint256 public constant REWARDS_ALLOCATION = 2_500_000 * 10**18; // 25% to cashback rewards
    uint256 public constant NFT_REWARDS_ALLOCATION = 3_000_000 * 10**18; // 30% to NFT rewards
    
    // Agglayer integration
    address public agglayerBridge;
    bool public agglayerEnabled = false;
    
    // Cashback system
    mapping(address => uint256) public pendingCashback;
    mapping(address => uint256) public totalCashbackEarned;
    
    // Airdrop tracking
    mapping(address => bool) public hasClaimedAirdrop;
    uint256 public totalAirdropClaimed;
    
    // Events
    event CashbackAdded(address indexed user, uint256 amount, string bookingId);
    event CashbackClaimed(address indexed user, uint256 amount);
    event AirdropClaimed(address indexed user, uint256 amount);
    event AgglayerBridgeUpdated(address indexed newBridge);
    event CrossChainTransfer(address indexed from, address indexed to, uint256 amount, uint256 destinationChainId);
    
    constructor() ERC20("MAKU Travel Token", "MAKU") {
        // Mint total supply to contract for controlled distribution
        _mint(address(this), TOTAL_SUPPLY);
    }
    
    /**
     * @dev Add cashback for user booking
     * @param user User address
     * @param amount Cashback amount
     * @param bookingId Booking reference
     */
    function addCashback(address user, uint256 amount, string memory bookingId) 
        external 
        onlyOwner 
    {
        pendingCashback[user] += amount;
        emit CashbackAdded(user, amount, bookingId);
    }
    
    /**
     * @dev User claims accumulated cashback
     */
    function claimCashback() external whenNotPaused {
        uint256 amount = pendingCashback[msg.sender];
        require(amount > 0, "No cashback to claim");
        require(balanceOf(address(this)) >= amount, "Insufficient contract balance");
        
        pendingCashback[msg.sender] = 0;
        totalCashbackEarned[msg.sender] += amount;
        
        _transfer(address(this), msg.sender, amount);
        emit CashbackClaimed(msg.sender, amount);
    }
    
    /**
     * @dev Claim airdrop (for POL stakers)
     * @param amount Airdrop amount (verified off-chain)
     * @param proof Merkle proof of eligibility
     */
    function claimAirdrop(uint256 amount, bytes32[] memory proof) 
        external 
        whenNotPaused 
    {
        require(!hasClaimedAirdrop[msg.sender], "Already claimed");
        require(totalAirdropClaimed + amount <= AIRDROP_ALLOCATION, "Airdrop exhausted");
        
        // In production, verify merkle proof here
        // For now, allow claim (placeholder)
        
        hasClaimedAirdrop[msg.sender] = true;
        totalAirdropClaimed += amount;
        
        _transfer(address(this), msg.sender, amount);
        emit AirdropClaimed(msg.sender, amount);
    }
    
    /**
     * @dev Enable Agglayer bridge integration
     * @param bridgeAddress Agglayer bridge contract address
     */
    function enableAgglayer(address bridgeAddress) external onlyOwner {
        require(bridgeAddress != address(0), "Invalid bridge address");
        agglayerBridge = bridgeAddress;
        agglayerEnabled = true;
        emit AgglayerBridgeUpdated(bridgeAddress);
    }
    
    /**
     * @dev Cross-chain transfer via Agglayer
     * @param to Recipient address on destination chain
     * @param amount Amount to transfer
     * @param destinationChainId Target chain ID
     */
    function bridgeToChain(
        address to, 
        uint256 amount, 
        uint256 destinationChainId
    ) 
        external 
        whenNotPaused 
    {
        require(agglayerEnabled, "Agglayer not enabled");
        require(balanceOf(msg.sender) >= amount, "Insufficient balance");
        
        // Burn tokens on source chain
        _burn(msg.sender, amount);
        
        // Emit event for bridge oracle
        emit CrossChainTransfer(msg.sender, to, amount, destinationChainId);
        
        // In production, call agglayerBridge.lock() or similar
    }
    
    /**
     * @dev Emergency pause
     */
    function pause() external onlyOwner {
        _pause();
    }
    
    /**
     * @dev Unpause
     */
    function unpause() external onlyOwner {
        _unpause();
    }
    
    /**
     * @dev Get pending cashback for user
     */
    function getPendingCashback(address user) external view returns (uint256) {
        return pendingCashback[user];
    }
    
    /**
     * @dev Get total cashback earned by user
     */
    function getTotalCashbackEarned(address user) external view returns (uint256) {
        return totalCashbackEarned[user];
    }
    
    /**
     * @dev Check if user has claimed airdrop
     */
    function hasUserClaimedAirdrop(address user) external view returns (bool) {
        return hasClaimedAirdrop[user];
    }
    
    /**
     * @dev Get airdrop statistics
     */
    function getAirdropStats() external view returns (
        uint256 totalAllocated,
        uint256 totalClaimed,
        uint256 remaining
    ) {
        totalAllocated = AIRDROP_ALLOCATION;
        totalClaimed = totalAirdropClaimed;
        remaining = AIRDROP_ALLOCATION - totalAirdropClaimed;
    }
}
