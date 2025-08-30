//SPDX-License-Identifier: MIT
pragma solidity >=0.8.0 <0.9.0;

import "@openzeppelin/contracts/token/ERC20/ERC20.sol";
import "@openzeppelin/contracts/token/ERC20/IERC20.sol";
import "@openzeppelin/contracts/access/Ownable.sol";
import "./IOracle.sol";
import "./IDEX.sol";

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
    address public dex;
    
    // Token balance tracking
    mapping(address => uint256) public tokenBalances;
    
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
        address _treasury,
        address _dex
    ) ERC20(_fundName, _fundTicker) Ownable(_creator) {
        fundName = _fundName;
        fundTicker = _fundTicker;
        underlyingTokens = _underlyingTokens;
        creator = _creator;
        oracle = _oracle;
        treasury = _treasury;
        dex = _dex;
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
        
        // Buy underlying tokens with remaining AVAX
        buyUnderlyingTokens(remainingAmount);
        
        emit FundTokenBought(msg.sender, msg.value, fundTokensToMint, fee);
    }
    
    /**
     * @dev Buy underlying tokens with AVAX
     * @param avaxAmount Amount of AVAX to spend on tokens
     */
    function buyUnderlyingTokens(uint256 avaxAmount) internal {
        require(avaxAmount > 0, "Amount must be greater than 0");
        require(dex != address(0), "DEX not set");
        
        uint256 amountPerToken = avaxAmount / underlyingTokens.length;
        
        for (uint256 i = 0; i < underlyingTokens.length; i++) {
            if (amountPerToken > 0) {
                // Swap AVAX for the underlying token using DEX
                uint256 tokensReceived = swapAvaxForTokens(underlyingTokens[i], amountPerToken);
                tokenBalances[underlyingTokens[i]] += tokensReceived;
            }
        }
    }
    
    /**
     * @dev Sell underlying tokens proportionally based on sell percentage
     * @param sellPercentage The percentage of fund tokens being sold (18 decimals)
     * @return totalAvaxReceived Total AVAX received from all token swaps
     */
    function sellUnderlyingTokens(uint256 sellPercentage) internal returns (uint256 totalAvaxReceived) {
        require(dex != address(0), "DEX not set");
        require(sellPercentage > 0, "Sell percentage must be greater than 0");
        
        totalAvaxReceived = 0;
        
        // Sell each underlying token proportionally
        for (uint256 i = 0; i < underlyingTokens.length; i++) {
            address token = underlyingTokens[i];
            uint256 tokenBalance = tokenBalances[token];
            
            if (tokenBalance > 0) {
                // Calculate how much of this token to sell based on the sell percentage
                uint256 tokensToSell = (tokenBalance * sellPercentage) / 1e18;
                
                if (tokensToSell > 0) {
                    // Swap tokens for AVAX using DEX
                    uint256 avaxReceived = swapTokensForAvax(token, tokensToSell);
                    totalAvaxReceived += avaxReceived;
                    
                    // Update token balance
                    tokenBalances[token] -= tokensToSell;
                }
            }
        }
        
        return totalAvaxReceived;
    }
    
    /**
     * @dev Sell fund tokens for AVAX
     * @param fundTokenAmount Amount of fund tokens to sell
     */
    function sell(uint256 fundTokenAmount) external {
        require(fundTokenAmount > 0, "Amount must be greater than 0");
        require(balanceOf(msg.sender) >= fundTokenAmount, "Insufficient fund tokens");
        require(totalSupply() > 0, "No fund tokens in circulation");
        
        // Calculate the percentage of fund tokens being sold
        uint256 sellPercentage = (fundTokenAmount * 1e18) / totalSupply(); // 18 decimals for precision
        
        // Sell underlying tokens proportionally and get total AVAX received
        uint256 totalAvaxReceived = sellUnderlyingTokens(sellPercentage);
        require(totalAvaxReceived > 0, "No value to return");
        
        // Calculate fee (1%)
        uint256 fee = (totalAvaxReceived * FEE_BASIS_POINTS) / BASIS_POINTS_DENOMINATOR;
        uint256 avaxToReturn = totalAvaxReceived - fee;
        
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
     * @dev Swap tokens for AVAX using DEX
     * @param token The token address to swap
     * @param amount The amount of tokens to swap
     * @return avaxReceived The amount of AVAX received
     */
    function swapTokensForAvax(address token, uint256 amount) internal returns (uint256 avaxReceived) {
        require(dex != address(0), "DEX not set");
        require(amount > 0, "Amount must be greater than 0");
        
        // Get the expected AVAX output from DEX
        uint256 expectedAvax = IDEX(dex).getAmountsOut(token, amount);
        require(expectedAvax > 0, "No AVAX value for tokens");
        
        // In a real implementation, this would:
        // 1. Approve the DEX to spend the tokens: IERC20(token).approve(dex, amount)
        // 2. Call the DEX swap function: IDEX(dex).swapExactTokensForAVAX(token, amount, expectedAvax, address(this), block.timestamp)
        // 3. Handle the actual token transfer and AVAX receipt
        
        // For now, we'll simulate the swap by returning the expected value
        // The actual DEX integration would be implemented here
        avaxReceived = expectedAvax;
        
        return avaxReceived;
    }
    
    /**
     * @dev Swap AVAX for tokens using DEX
     * @param token The token address to receive
     * @param avaxAmount The amount of AVAX to swap
     * @return tokensReceived The amount of tokens received
     */
    function swapAvaxForTokens(address token, uint256 avaxAmount) internal returns (uint256 tokensReceived) {
        require(dex != address(0), "DEX not set");
        require(avaxAmount > 0, "Amount must be greater than 0");
        
        // Get the expected token output from DEX
        uint256 expectedTokens = IDEX(dex).getAmountsOut(address(0), avaxAmount);
        require(expectedTokens > 0, "No token value for AVAX");
        
        // Call the DEX swap function with AVAX value
        // Note: In a real implementation, this would require the contract to have AVAX balance
        // For now, we'll simulate the swap by returning the expected value
        // The actual DEX integration would be: IDEX(dex).swapExactAVAXForTokens{value: avaxAmount}(token, expectedTokens, address(this), block.timestamp)
        tokensReceived = expectedTokens;
        
        return tokensReceived;
    }
    
    /**
     * @dev Get current fund value in AVAX
     * @return Total fund value in AVAX
     */
    function getCurrentFundValue() external view returns (uint256) {
        if (totalSupply() == 0) return 0;
        
        uint256 totalValue = 0;
        for (uint256 i = 0; i < underlyingTokens.length; i++) {
            address token = underlyingTokens[i];
            uint256 tokenBalance = tokenBalances[token];
            
            if (tokenBalance > 0) {
                // Convert token balance to AVAX value using oracle prices
                uint256 tokenPriceUSD = IOracle(oracle).getPrice(token);
                uint256 avaxPriceUSD = IOracle(oracle).getPrice(address(0));
                
                if (tokenPriceUSD > 0 && avaxPriceUSD > 0) {
                    // Calculate token value in USD
                    uint256 tokenValueUSD = (tokenBalance * tokenPriceUSD) / 1e8;
                    // Convert USD value to AVAX
                    uint256 tokenValueInAvax = (tokenValueUSD * 1e8) / avaxPriceUSD;
                    totalValue += tokenValueInAvax;
                } else {
                    // Fallback: use token balance as AVAX value
                    totalValue += tokenBalance;
                }
            }
        }
        return totalValue;
    }
    
    /**
     * @dev Get current fund value in USD
     * @return Total fund value in USD (18 decimals)
     */
    function getCurrentFundValueUSD() internal view returns (uint256) {
        if (totalSupply() == 0) return 0;
        
        uint256 totalValueUSD = 0;
        for (uint256 i = 0; i < underlyingTokens.length; i++) {
            address token = underlyingTokens[i];
            uint256 tokenBalance = tokenBalances[token];
            
            if (tokenBalance > 0) {
                uint256 tokenPriceUSD = IOracle(oracle).getPrice(token);
                // Calculate token value in USD
                uint256 tokenValueUSD = (tokenBalance * tokenPriceUSD) / 1e8;
                totalValueUSD += tokenValueUSD;
            }
        }
        return totalValueUSD;
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
        
        // Get AVAX price in USD (8 decimals)
        uint256 avaxPriceUSD = IOracle(oracle).getPrice(address(0));
        
        // Convert AVAX amount to USD value (18 decimals for AVAX, 8 decimals for price)
        // avaxAmount * avaxPriceUSD / 10^8 = USD value with 18 decimals
        uint256 avaxValueUSD = (avaxAmount * avaxPriceUSD) / 1e8;
        
        // Get current fund value in USD
        uint256 currentFundValueUSD = getCurrentFundValueUSD();
        
        // Calculate fund tokens to mint based on USD proportion
        // (avaxValueUSD * totalSupply) / currentFundValueUSD
        return (avaxValueUSD * totalSupply()) / currentFundValueUSD;
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
     * @dev Update DEX address (only owner)
     * @param newDex New DEX address
     */
    function updateDex(address newDex) external onlyOwner {
        require(newDex != address(0), "Invalid DEX address");
        dex = newDex;
    }
    
    /**
     * @dev Get token balance for a specific token
     * @param token The token address
     * @return balance The token balance
     */
    function getTokenBalance(address token) external view returns (uint256) {
        return tokenBalances[token];
    }
    
    /**
     * @dev Allow contract to receive AVAX
     */
    receive() external payable {}
}
