//SPDX-License-Identifier: MIT
pragma solidity >=0.8.0 <0.9.0;

import "@openzeppelin/contracts/token/ERC20/ERC20.sol";
import "@openzeppelin/contracts/access/Ownable.sol";
import "./IOracle.sol";

/**
 * Fund Contract - Manages individual index funds
 * @author Avanguard Index
 */
contract Fund is ERC20, Ownable {
    // Fund metadata
    string public fundName;
    string public fundTicker;
    address[] public underlyingTokens;
    address public creator;
    address public oracle;
    
    // Fee structure (1% = 100 basis points)
    uint256 public constant FEE_BASIS_POINTS = 100; // 1%
    uint256 public constant BASIS_POINTS_DENOMINATOR = 10000;
    
    // Fee distribution percentages
    uint256 public constant CREATOR_FEE_PERCENT = 50; // 50% to creator
    uint256 public constant AGI_BUYBACK_PERCENT = 25; // 25% to AGI buyback
    uint256 public constant TREASURY_PERCENT = 25;    // 25% to treasury
    
    // Treasury address
    address public treasury;
    
    // Events
    event FundTokenBought(address indexed buyer, uint256 avaxAmount, uint256 fundTokensMinted, uint256 feePaid);
    event FundTokenSold(address indexed seller, uint256 fundTokensBurned, uint256 avaxReturned, uint256 feePaid);
    event FeesDistributed(uint256 creatorFee, uint256 agiBuybackFee, uint256 treasuryFee);
    
    constructor(
        string memory _fundName,
        string memory _fundTicker,
        address[] memory _underlyingTokens,
        address _creator,
        address _oracle,
        address _treasury
    ) ERC20(_fundName, _fundTicker) Ownable(_creator) {
        fundName = _fundName;
        fundTicker = _fundTicker;
        underlyingTokens = _underlyingTokens;
        creator = _creator;
        oracle = _oracle;
        treasury = _treasury;
        _transferOwnership(_creator);
    }
    
    /**
     * @dev Buy fund tokens with AVAX
     */
    function buy() external payable {
        require(msg.value > 0, "Must send AVAX");
        require(underlyingTokens.length > 0, "No underlying tokens");
        
        uint256 fee = (msg.value * FEE_BASIS_POINTS) / BASIS_POINTS_DENOMINATOR;
        uint256 remainingAmount = msg.value - fee;
        
        // Calculate how many fund tokens to mint based on current fund value
        uint256 fundTokensToMint = calculateFundTokensToMint(remainingAmount);
        
        // Mint fund tokens to buyer
        _mint(msg.sender, fundTokensToMint);
        
        // Distribute fees
        distributeFees(fee);
        
        // Simulate buying underlying tokens (in real implementation, this would use DEX)
        // For now, we just hold the AVAX in the contract
        
        emit FundTokenBought(msg.sender, msg.value, fundTokensToMint, fee);
    }
    
    /**
     * @dev Sell fund tokens for AVAX
     * @param fundTokenAmount Amount of fund tokens to sell
     */
    function sell(uint256 fundTokenAmount) external {
        require(fundTokenAmount > 0, "Amount must be greater than 0");
        require(balanceOf(msg.sender) >= fundTokenAmount, "Insufficient fund tokens");
        
        // Calculate AVAX value of fund tokens
        uint256 avaxValue = calculateAvaxValue(fundTokenAmount);
        require(avaxValue > 0, "No value to return");
        
        // Calculate fee
        uint256 fee = (avaxValue * FEE_BASIS_POINTS) / BASIS_POINTS_DENOMINATOR;
        uint256 avaxToReturn = avaxValue - fee;
        
        // Burn fund tokens
        _burn(msg.sender, fundTokenAmount);
        
        // Distribute fees
        distributeFees(fee);
        
        // Transfer AVAX to seller
        (bool success, ) = payable(msg.sender).call{value: avaxToReturn}("");
        require(success, "Failed to transfer AVAX");
        
        emit FundTokenSold(msg.sender, fundTokenAmount, avaxToReturn, fee);
    }
    
    /**
     * @dev Get current fund value in AVAX
     * @return Total fund value in AVAX
     */
    function getCurrentFundValue() external view returns (uint256) {
        if (totalSupply() == 0) return 0;
        
        uint256 totalValue = 0;
        for (uint256 i = 0; i < underlyingTokens.length; i++) {
            uint256 tokenPrice = IOracle(oracle).getPrice(underlyingTokens[i]);
            // In real implementation, you'd get actual token balances
            // For now, we assume equal distribution of AVAX value
            totalValue += address(this).balance / underlyingTokens.length;
        }
        return totalValue;
    }
    
    /**
     * @dev Get fund token balance for a specific address
     * @param user Address to check balance for
     * @return Fund token balance
     */
    function fundTokenBalanceOf(address user) external view returns (uint256) {
        return balanceOf(user);
    }
    
    /**
     * @dev Calculate how many fund tokens to mint for given AVAX amount
     * @param avaxAmount Amount of AVAX to invest
     * @return Fund tokens to mint
     */
    function calculateFundTokensToMint(uint256 avaxAmount) internal view returns (uint256) {
        if (totalSupply() == 0) {
            // First investment - mint tokens based on AVAX amount
            return avaxAmount;
        }
        
        uint256 currentFundValue = this.getCurrentFundValue();
        return (avaxAmount * totalSupply()) / currentFundValue;
    }
    
    /**
     * @dev Calculate AVAX value for given fund token amount
     * @param fundTokenAmount Amount of fund tokens
     * @return AVAX value
     */
    function calculateAvaxValue(uint256 fundTokenAmount) internal view returns (uint256) {
        if (totalSupply() == 0) return 0;
        
        uint256 currentFundValue = this.getCurrentFundValue();
        return (fundTokenAmount * currentFundValue) / totalSupply();
    }
    
    /**
     * @dev Distribute fees to creator, AGI buyback, and treasury
     * @param totalFee Total fee amount to distribute
     */
    function distributeFees(uint256 totalFee) internal {
        uint256 creatorFee = (totalFee * CREATOR_FEE_PERCENT) / 100;
        uint256 agiBuybackFee = (totalFee * AGI_BUYBACK_PERCENT) / 100;
        uint256 treasuryFee = (totalFee * TREASURY_PERCENT) / 100;
        
        // Send to creator
        if (creatorFee > 0) {
            (bool success1, ) = payable(creator).call{value: creatorFee}("");
            require(success1, "Failed to send creator fee");
        }
        
        // Send to treasury (AGI buyback will be handled by treasury)
        if (agiBuybackFee + treasuryFee > 0) {
            (bool success2, ) = payable(treasury).call{value: agiBuybackFee + treasuryFee}("");
            require(success2, "Failed to send treasury fee");
        }
        
        emit FeesDistributed(creatorFee, agiBuybackFee, treasuryFee);
    }
    
    /**
     * @dev Get underlying tokens array
     * @return Array of underlying token addresses
     */
    function getUnderlyingTokens() external view returns (address[] memory) {
        return underlyingTokens;
    }
    
    /**
     * @dev Update treasury address (only owner)
     * @param newTreasury New treasury address
     */
    function updateTreasury(address newTreasury) external onlyOwner {
        require(newTreasury != address(0), "Invalid treasury address");
        treasury = newTreasury;
    }
    
    /**
     * @dev Update oracle address (only owner)
     * @param newOracle New oracle address
     */
    function updateOracle(address newOracle) external onlyOwner {
        require(newOracle != address(0), "Invalid oracle address");
        oracle = newOracle;
    }
    
    /**
     * @dev Allow contract to receive AVAX
     */
    receive() external payable {}
}
