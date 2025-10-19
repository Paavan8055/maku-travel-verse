// SPDX-License-Identifier: MIT
pragma solidity ^0.8.20;

/**
 * @title MAKU Membership NFT
 * @notice ERC-721 NFT for tiered travel rewards membership
 * @dev Bronze (1%), Silver (3%), Gold (6%), Platinum (10%)
 */
contract MAKUMembership {
    string public name = "MAKU Membership";
    string public symbol = "MAKUM";
    
    address public owner;
    uint256 private _tokenIdCounter;
    
    enum Tier { Bronze, Silver, Gold, Platinum }
    
    struct Membership {
        Tier tier;
        uint256 cashbackRate; // In basis points (100 = 1%)
        uint256 mintedAt;
        string metadataURI;
    }
    
    // Tier cashback rates (basis points)
    mapping(Tier => uint256) public tierCashbackRates;
    
    // Tier prices in wei (for purchasing)
    mapping(Tier => uint256) public tierPrices;
    
    // Booking requirements for earning tiers
    mapping(Tier => uint256) public tierBookingRequirements;
    
    mapping(uint256 => address) public ownerOf;
    mapping(address => uint256) public balanceOf;
    mapping(uint256 => address) public getApproved;
    mapping(address => mapping(address => bool)) public isApprovedForAll;
    mapping(uint256 => Membership) public memberships;
    mapping(address => uint256[]) private _ownedTokens;
    
    event Transfer(address indexed from, address indexed to, uint256 indexed tokenId);
    event Approval(address indexed owner, address indexed approved, uint256 indexed tokenId);
    event ApprovalForAll(address indexed owner, address indexed operator, bool approved);
    event MembershipMinted(address indexed to, uint256 indexed tokenId, Tier tier, uint256 cashbackRate);
    event MembershipPurchased(address indexed buyer, uint256 indexed tokenId, Tier tier, uint256 price);
    
    modifier onlyOwner() {
        require(msg.sender == owner, "Only owner");
        _;
    }
    
    constructor() {
        owner = msg.sender;
        
        // Set cashback rates (basis points: 100 = 1%)
        tierCashbackRates[Tier.Bronze] = 100;    // 1%
        tierCashbackRates[Tier.Silver] = 300;    // 3%
        tierCashbackRates[Tier.Gold] = 600;      // 6%
        tierCashbackRates[Tier.Platinum] = 1000; // 10%
        
        // Set purchase prices (in wei, convert from USD)
        // For testnet, using small amounts
        tierPrices[Tier.Bronze] = 0;              // FREE
        tierPrices[Tier.Silver] = 0.01 ether;    // ~$99 equivalent on testnet
        tierPrices[Tier.Gold] = 0.03 ether;      // ~$299 equivalent
        tierPrices[Tier.Platinum] = 0.1 ether;   // ~$999 equivalent
        
        // Set booking requirements
        tierBookingRequirements[Tier.Bronze] = 1;
        tierBookingRequirements[Tier.Silver] = 10;
        tierBookingRequirements[Tier.Gold] = 50;
        tierBookingRequirements[Tier.Platinum] = 100;
    }
    
    /**
     * @notice Purchase a membership NFT
     */
    function purchaseMembership(Tier tier, string memory metadataURI) external payable returns (uint256) {
        uint256 price = tierPrices[tier];
        require(msg.value >= price, "Insufficient payment");
        
        uint256 tokenId = _mintMembership(msg.sender, tier, metadataURI);
        
        // Refund excess payment
        if (msg.value > price) {
            payable(msg.sender).transfer(msg.value - price);
        }
        
        emit MembershipPurchased(msg.sender, tokenId, tier, price);
        return tokenId;
    }
    
    /**
     * @notice Mint membership (only owner/backend for earned tiers)
     */
    function mintMembership(
        address to,
        Tier tier,
        string memory metadataURI
    ) external onlyOwner returns (uint256) {
        return _mintMembership(to, tier, metadataURI);
    }
    
    function _mintMembership(
        address to,
        Tier tier,
        string memory metadataURI
    ) internal returns (uint256) {
        require(to != address(0), "Invalid address");
        
        uint256 tokenId = _tokenIdCounter++;
        uint256 cashbackRate = tierCashbackRates[tier];
        
        ownerOf[tokenId] = to;
        balanceOf[to]++;
        _ownedTokens[to].push(tokenId);
        
        memberships[tokenId] = Membership({
            tier: tier,
            cashbackRate: cashbackRate,
            mintedAt: block.timestamp,
            metadataURI: metadataURI
        });
        
        emit Transfer(address(0), to, tokenId);
        emit MembershipMinted(to, tokenId, tier, cashbackRate);
        
        return tokenId;
    }
    
    /**
     * @notice Get highest tier multiplier for user
     */
    function getHighestCashbackRate(address user) external view returns (uint256) {
        uint256[] memory tokens = _ownedTokens[user];
        if (tokens.length == 0) return 100; // Default Bronze rate
        
        uint256 maxRate = 100;
        for (uint256 i = 0; i < tokens.length; i++) {
            uint256 rate = memberships[tokens[i]].cashbackRate;
            if (rate > maxRate) {
                maxRate = rate;
            }
        }
        return maxRate;
    }
    
    /**
     * @notice Get all tokens owned by address
     */
    function tokensOfOwner(address user) external view returns (uint256[] memory) {
        return _ownedTokens[user];
    }
    
    /**
     * @notice Get membership details
     */
    function getMembership(uint256 tokenId) external view returns (
        Tier tier,
        uint256 cashbackRate,
        uint256 mintedAt,
        string memory metadataURI
    ) {
        Membership memory membership = memberships[tokenId];
        return (
            membership.tier,
            membership.cashbackRate,
            membership.mintedAt,
            membership.metadataURI
        );
    }
    
    /**
     * @notice Get tier info
     */
    function getTierInfo(Tier tier) external view returns (
        uint256 cashbackRate,
        uint256 price,
        uint256 bookingsRequired
    ) {
        return (
            tierCashbackRates[tier],
            tierPrices[tier],
            tierBookingRequirements[tier]
        );
    }
    
    /**
     * @notice Transfer NFT
     */
    function transferFrom(address from, address to, uint256 tokenId) external {
        require(to != address(0), "Invalid address");
        require(ownerOf[tokenId] == from, "Not owner");
        require(
            msg.sender == from || 
            msg.sender == getApproved[tokenId] || 
            isApprovedForAll[from][msg.sender],
            "Not authorized"
        );
        
        // Remove from old owner
        uint256[] storage fromTokens = _ownedTokens[from];
        for (uint256 i = 0; i < fromTokens.length; i++) {
            if (fromTokens[i] == tokenId) {
                fromTokens[i] = fromTokens[fromTokens.length - 1];
                fromTokens.pop();
                break;
            }
        }
        
        balanceOf[from]--;
        delete getApproved[tokenId];
        
        // Add to new owner
        ownerOf[tokenId] = to;
        balanceOf[to]++;
        _ownedTokens[to].push(tokenId);
        
        emit Transfer(from, to, tokenId);
    }
    
    function approve(address to, uint256 tokenId) external {
        address tokenOwner = ownerOf[tokenId];
        require(msg.sender == tokenOwner || isApprovedForAll[tokenOwner][msg.sender], "Not authorized");
        getApproved[tokenId] = to;
        emit Approval(tokenOwner, to, tokenId);
    }
    
    function setApprovalForAll(address operator, bool approved) external {
        isApprovedForAll[msg.sender][operator] = approved;
        emit ApprovalForAll(msg.sender, operator, approved);
    }
    
    /**
     * @notice Update tier prices (only owner)
     */
    function updateTierPrice(Tier tier, uint256 newPrice) external onlyOwner {
        tierPrices[tier] = newPrice;
    }
    
    /**
     * @notice Withdraw contract balance (only owner)
     */
    function withdraw() external onlyOwner {
        uint256 balance = address(this).balance;
        require(balance > 0, "No balance");
        payable(owner).transfer(balance);
    }
    
    /**
     * @notice Transfer ownership
     */
    function transferOwnership(address newOwner) external onlyOwner {
        require(newOwner != address(0), "Invalid address");
        owner = newOwner;
    }
    
    // Required for receiving ETH
    receive() external payable {}
}
