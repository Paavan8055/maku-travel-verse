// SPDX-License-Identifier: MIT
pragma solidity ^0.8.20;

/**
 * @title MAKU Travel Token
 * @notice ERC-20 token for travel rewards with cashback system (1-10%)
 * @dev Implements tiered cashback rewards for travel bookings
 */
contract MAKUToken {
    string public name = "MAKU Travel Token";
    string public symbol = "MAKU";
    uint8 public decimals = 18;
    uint256 public totalSupply;
    
    address public owner;
    
    // Cashback rate: 100 = 1%, 1000 = 10%
    uint256 public cashbackRate = 100; // Default 1%
    uint256 public constant MAX_CASHBACK_RATE = 1000; // 10% maximum
    
    mapping(address => uint256) public balanceOf;
    mapping(address => mapping(address => uint256)) public allowance;
    mapping(address => uint256) public pendingCashback;
    
    event Transfer(address indexed from, address indexed to, uint256 value);
    event Approval(address indexed owner, address indexed spender, uint256 value);
    event CashbackEarned(address indexed user, uint256 amount, uint256 bookingAmount);
    event CashbackClaimed(address indexed user, uint256 amount);
    event CashbackRateUpdated(uint256 oldRate, uint256 newRate);
    
    modifier onlyOwner() {
        require(msg.sender == owner, "Only owner can call this");
        _;
    }
    
    constructor(uint256 _initialSupply) {
        owner = msg.sender;
        totalSupply = _initialSupply * 10**decimals;
        balanceOf[owner] = totalSupply;
        emit Transfer(address(0), owner, totalSupply);
    }
    
    function transfer(address _to, uint256 _value) public returns (bool success) {
        require(_to != address(0), "Invalid address");
        require(balanceOf[msg.sender] >= _value, "Insufficient balance");
        
        balanceOf[msg.sender] -= _value;
        balanceOf[_to] += _value;
        
        emit Transfer(msg.sender, _to, _value);
        return true;
    }
    
    function approve(address _spender, uint256 _value) public returns (bool success) {
        allowance[msg.sender][_spender] = _value;
        emit Approval(msg.sender, _spender, _value);
        return true;
    }
    
    function transferFrom(address _from, address _to, uint256 _value) public returns (bool success) {
        require(_to != address(0), "Invalid address");
        require(balanceOf[_from] >= _value, "Insufficient balance");
        require(allowance[_from][msg.sender] >= _value, "Allowance exceeded");
        
        balanceOf[_from] -= _value;
        balanceOf[_to] += _value;
        allowance[_from][msg.sender] -= _value;
        
        emit Transfer(_from, _to, _value);
        return true;
    }
    
    /**
     * @notice Set cashback rate (only owner)
     * @param _rate Rate in basis points (100 = 1%, max 1000 = 10%)
     */
    function setCashbackRate(uint256 _rate) external onlyOwner {
        require(_rate <= MAX_CASHBACK_RATE, "Rate exceeds maximum (10%)");
        uint256 oldRate = cashbackRate;
        cashbackRate = _rate;
        emit CashbackRateUpdated(oldRate, _rate);
    }
    
    /**
     * @notice Add cashback for a booking (only owner/backend)
     * @param user User address
     * @param bookingAmount Booking amount in USD (scaled by 10**18)
     */
    function addCashback(address user, uint256 bookingAmount) external onlyOwner {
        require(user != address(0), "Invalid user address");
        
        // Calculate cashback: (bookingAmount * cashbackRate) / 10000
        uint256 cashback = (bookingAmount * cashbackRate) / 10000;
        pendingCashback[user] += cashback;
        
        emit CashbackEarned(user, cashback, bookingAmount);
    }
    
    /**
     * @notice User claims their pending cashback
     */
    function claimCashback() external {
        uint256 amount = pendingCashback[msg.sender];
        require(amount > 0, "No pending cashback");
        require(balanceOf[owner] >= amount, "Insufficient contract balance");
        
        pendingCashback[msg.sender] = 0;
        balanceOf[owner] -= amount;
        balanceOf[msg.sender] += amount;
        
        emit Transfer(owner, msg.sender, amount);
        emit CashbackClaimed(msg.sender, amount);
    }
    
    /**
     * @notice Get user's pending cashback
     */
    function getPendingCashback(address user) external view returns (uint256) {
        return pendingCashback[user];
    }
    
    /**
     * @notice Transfer ownership
     */
    function transferOwnership(address newOwner) external onlyOwner {
        require(newOwner != address(0), "Invalid new owner");
        owner = newOwner;
    }
}
