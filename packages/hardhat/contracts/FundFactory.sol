//SPDX-License-Identifier: MIT
pragma solidity >=0.8.0 <0.9.0;

import "@openzeppelin/contracts/access/Ownable.sol";
import "./Fund.sol";
import "./AGIToken.sol";

/**
 * Fund Factory Contract - Creates and manages index funds
 * @author Avanguard Index
 */
contract FundFactory is Ownable {
    // Fund creation fee in AGI tokens
    uint256 public constant FUND_CREATION_FEE = 1000 * 10**18; // 1000 AGI tokens
    
    // Contracts
    AGIToken public agiToken;
    address public oracle;
    address public treasury;
    
    // Fund tracking
    Fund[] public funds;
    mapping(uint256 => Fund) public fundById;
    mapping(address => uint256[]) public creatorFunds;
    
    // Events
    event FundCreated(
        uint256 indexed fundId,
        address indexed creator,
        string fundName,
        string fundTicker,
        address fundAddress,
        address[] underlyingTokens
    );
    
    constructor(
        address _agiToken,
        address _oracle,
        address _treasury,
        address initialOwner
    ) Ownable(initialOwner) {
        agiToken = AGIToken(_agiToken);
        oracle = _oracle;
        treasury = _treasury;
    }
    
    /**
     * @dev Create a new fund
     * @param fundName Name of the fund
     * @param fundTicker Ticker symbol for the fund
     * @param tokens Array of underlying token addresses
     */
    function createFund(
        string memory fundName,
        string memory fundTicker,
        address[] memory tokens
    ) external {
        require(bytes(fundName).length > 0, "Fund name cannot be empty");
        require(bytes(fundTicker).length > 0, "Fund ticker cannot be empty");
        require(tokens.length > 0, "Must have at least one token");
        require(tokens.length <= 20, "Maximum 20 tokens per fund");
        
        // Check for duplicate tokens
        for (uint256 i = 0; i < tokens.length; i++) {
            require(tokens[i] != address(0), "Invalid token address");
            for (uint256 j = i + 1; j < tokens.length; j++) {
                require(tokens[i] != tokens[j], "Duplicate tokens not allowed");
            }
        }
        
        // Burn AGI tokens as creation fee
        require(
            agiToken.balanceOf(msg.sender) >= FUND_CREATION_FEE,
            "Insufficient AGI balance for fund creation fee"
        );
        agiToken.burnFrom(msg.sender, FUND_CREATION_FEE);
        
        // Create new fund
        Fund newFund = new Fund(
            fundName,
            fundTicker,
            tokens,
            msg.sender,
            oracle,
            treasury
        );
        
        // Track the fund
        uint256 fundId = funds.length;
        funds.push(newFund);
        fundById[fundId] = newFund;
        creatorFunds[msg.sender].push(fundId);
        
        emit FundCreated(
            fundId,
            msg.sender,
            fundName,
            fundTicker,
            address(newFund),
            tokens
        );
    }
    
    /**
     * @dev Get fund information by ID
     * @param fundId The fund ID
     * @return fundAddress The fund contract address
     * @return fundName The fund name
     * @return fundTicker The fund ticker
     * @return underlyingTokens Array of underlying token addresses
     */
    function getFund(uint256 fundId) external view returns (
        address fundAddress,
        string memory fundName,
        string memory fundTicker,
        address[] memory underlyingTokens
    ) {
        require(fundId < funds.length, "Fund does not exist");
        Fund fund = funds[fundId];
        fundAddress = address(fund);
        fundName = fund.fundName();
        fundTicker = fund.fundTicker();
        underlyingTokens = fund.getUnderlyingTokens();
    }
    
    /**
     * @dev Get all funds created by a specific creator
     * @param creator The creator address
     * @return Array of fund IDs created by the creator
     */
    function getCreatorFunds(address creator) external view returns (uint256[] memory) {
        return creatorFunds[creator];
    }
    
    /**
     * @dev Get total number of funds
     * @return Total number of funds created
     */
    function getTotalFunds() external view returns (uint256) {
        return funds.length;
    }
    
    /**
     * @dev Get all funds (for frontend pagination)
     * @param startIndex Starting index
     * @param endIndex Ending index
     * @return Array of fund addresses
     */
    function getFunds(uint256 startIndex, uint256 endIndex) external view returns (address[] memory) {
        require(startIndex < funds.length, "Start index out of bounds");
        require(endIndex <= funds.length, "End index out of bounds");
        require(startIndex <= endIndex, "Invalid index range");
        
        uint256 count = endIndex - startIndex;
        address[] memory fundAddresses = new address[](count);
        
        for (uint256 i = 0; i < count; i++) {
            fundAddresses[i] = address(funds[startIndex + i]);
        }
        
        return fundAddresses;
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
     * @dev Update treasury address (only owner)
     * @param newTreasury New treasury address
     */
    function updateTreasury(address newTreasury) external onlyOwner {
        require(newTreasury != address(0), "Invalid treasury address");
        treasury = newTreasury;
    }
    
    /**
     * @dev Update AGI token address (only owner)
     * @param newAgiToken New AGI token address
     */
    function updateAgiToken(address newAgiToken) external onlyOwner {
        require(newAgiToken != address(0), "Invalid AGI token address");
        agiToken = AGIToken(newAgiToken);
    }
}
