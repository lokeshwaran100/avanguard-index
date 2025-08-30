//SPDX-License-Identifier: MIT
pragma solidity >=0.8.0 <0.9.0;

import "@openzeppelin/contracts/access/Ownable.sol";
import "./IDEX.sol";
import "./IOracle.sol";

/**
 * Mock DEX Contract for testing purposes
 * @author Avanguard Index
 */
contract MockDEX is IDEX, Ownable {
    address public oracle;
    
    constructor(address _oracle) Ownable(msg.sender) {
        oracle = _oracle;
    }
    
    /**
     * @dev Mock swap function that simulates swapping tokens for AVAX
     * @param tokenIn The token address to swap from
     * @param amountIn The amount of tokens to swap
     * @param amountOutMin The minimum amount of AVAX to receive
     * @param to The address to receive the AVAX
     * @param deadline The deadline for the swap
     * @return amountOut The amount of AVAX received
     */
    function swapExactTokensForAVAX(
        address tokenIn,
        uint256 amountIn,
        uint256 amountOutMin,
        address to,
        uint256 deadline
    ) external returns (uint256 amountOut) {
        require(block.timestamp <= deadline, "Swap deadline passed");
        require(amountIn > 0, "Amount must be greater than 0");
        
        // Calculate expected AVAX output based on oracle prices
        amountOut = getAmountsOut(tokenIn, amountIn);
        require(amountOut >= amountOutMin, "Insufficient output amount");
        
        // In a real implementation, this would:
        // 1. Transfer tokens from the caller to this contract
        // 2. Perform the actual swap on a DEX
        // 3. Transfer AVAX to the recipient
        
        // For mock purposes, we just return the calculated amount
        // The actual AVAX transfer would be handled by the calling contract
    }
    
    /**
     * @dev Mock swap function that simulates swapping AVAX for tokens
     * @param tokenOut The token address to receive
     * @param amountOutMin The minimum amount of tokens to receive
     * @param to The address to receive the tokens
     * @param deadline The deadline for the swap
     * @return amountOut The amount of tokens received
     */
    function swapExactAVAXForTokens(
        address tokenOut,
        uint256 amountOutMin,
        address to,
        uint256 deadline
    ) external payable returns (uint256 amountOut) {
        require(block.timestamp <= deadline, "Swap deadline passed");
        require(msg.value > 0, "Must send AVAX");
        
        // Calculate expected token output based on oracle prices
        amountOut = getAmountsOut(address(0), msg.value);
        require(amountOut >= amountOutMin, "Insufficient output amount");
        
        // In a real implementation, this would:
        // 1. Use the AVAX sent with the transaction
        // 2. Perform the actual swap on a DEX
        // 3. Transfer tokens to the recipient
        
        // For mock purposes, we just return the calculated amount
        // The actual token transfer would be handled by the calling contract
    }
    
    /**
     * @dev Get the expected output amount for a swap
     * @param tokenIn The token address to swap from (address(0) for AVAX)
     * @param amountIn The amount to swap
     * @return amountOut The expected amount to receive
     */
    function getAmountsOut(address tokenIn, uint256 amountIn) public view returns (uint256 amountOut) {
        require(amountIn > 0, "Amount must be greater than 0");
        
        if (tokenIn == address(0)) {
            // AVAX to token swap
            // For mock purposes, assume 1:1 ratio
            amountOut = amountIn;
        } else {
            // Token to AVAX swap
            // Get token and AVAX prices from oracle
            uint256 tokenPriceUSD = IOracle(oracle).getPrice(tokenIn);
            uint256 avaxPriceUSD = IOracle(oracle).getPrice(address(0));
            
            if (tokenPriceUSD > 0 && avaxPriceUSD > 0) {
                // Calculate token value in USD (assuming 18 decimals for token amount)
                uint256 tokenValueUSD = (amountIn * tokenPriceUSD) / 1e8; // tokenPriceUSD has 8 decimals
                
                // Convert USD value to AVAX amount
                amountOut = (tokenValueUSD * 1e8) / avaxPriceUSD; // avaxPriceUSD has 8 decimals
            } else {
                // Fallback: assume 1:1 ratio if oracle prices are not available
                amountOut = amountIn;
            }
        }
        
        return amountOut;
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
