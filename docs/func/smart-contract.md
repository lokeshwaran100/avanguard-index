# Avanguard Index Project Summary and Solidity Contract Overview

## Project Summary
Avanguard Index is a decentralized blockchain platform built on Avalanche that enables anyone to create, manage, and invest in cryptocurrency index funds. Each fund is a basket of selected tokens, initially with equal weightings per token for MVP simplicity. Fund creators assign a unique ticker symbol to the fund’s own token which represents ownership shares. The value of these fund tokens reflects the real-time combined value of the underlying assets fetched via an integrated price oracle. Investors can easily buy and sell these fund tokens, paying a small fee on each transaction that rewards fund creators, supports platform treasury, and funds buyback-and-burn of the platform’s governance token (AGI). This system brings transparent, automated, and accessible crypto fund management to users while rewarding quality fund creators and supporting platform sustainability.

---

## Key Solidity Contract Functions

### 1. AGI Token Contract (ERC-20)
- `constructor()`: Deploy fixed supply (1 billion) AGI tokens, no minting post-deployment.
- `transfer()`, `approve()`, `transferFrom()`: Standard ERC-20 token functionality.
- `balanceOf()`, `totalSupply()`: Token balance queries.

### 2. Fund Factory Contract
- `createFund(string fundName, string fundTicker, address[] tokens)`: Creates a new fund with equal weights for tokens; burns 1000 AGI tokens from creator as fee.
- `getFund(uint256 fundId)`: Fetches fund metadata and address.

### 3. Fund Contract
- `buy(uint256 amount)`: Allows investors to deposit underlying tokens proportionally to buy fund tokens; applies 1% fee distributed to creator, treasury, and buyback burn.
- `sell(uint256 fundTokenAmount)`: Allows redemption of underlying tokens by selling fund tokens with 1% fee.
- `getCurrentFundValue()`: Computes up-to-date fund valuation using oracle prices.
- `fundTokenBalanceOf(address investor)`: Returns shares owned by investor.

### 4. Fee Distribution
- Internal logic to split 1% buy/sell fee: 50% creator reward, 25% buyback and burn AGI, 25% to treasury.
- `distributeFees(uint256 feeAmount)`: Handles distribution.

### 5. Oracle Interface
- `getPrice(address token)`: Fetches current token prices for fund valuation.

### 6. Access Control
- `onlyCreator` modifier to restrict sensitive operations to fund creator.
- Ownership transfer functionality if needed.

### 7. Events
- `FundCreated()`, `FundTokenBought()`, `FundTokenSold()`, `FeesDistributed()` for transparency and frontend integration.

---

This comprehensive framework facilitates transparent, automated crypto index funds with decentralized governance and incentivization mechanisms.
