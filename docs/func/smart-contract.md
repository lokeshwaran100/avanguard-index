# Avanguard Index Project and Solidity Contract Summary

## Project Summary
Avanguard Index is a decentralized crypto index fund platform built on Avalanche. It allows anyone to create and invest in index funds composed of baskets of tokens with equal weight in the MVP. Users buy fund tokens using AVAX; the contract swaps AVAX to underlying tokens on a DEX while deducting a 1% fee. Fund tokens represent ownership shares backed by the underlying assets held securely in the contract vault. When selling, fund tokens are burned, underlying tokens are swapped back to AVAX, fees deducted, and remaining AVAX returned to the user. The platform charges fees that reward fund creators, support buyback and burn of the platform’s AGI token, and sustain protocol development. Price oracles provide live token valuations ensuring transparency and fairness.

## Solidity Contract Functions

### AGI Token Contract (ERC-20)
- `constructor()`: Fixed 1 billion AGI supply, no minting after deployment.
- Standard ERC-20 functions: `transfer()`, `approve()`, `transferFrom()`, `balanceOf()`, `totalSupply()`.

### Fund Factory Contract
- `createFund(string fundName, string fundTicker, address[] tokens)`: Creates fund, burns 1000 AGI fee.
- `getFund(uint fundId)`: Receive fund metadata and address.

### Fund Contract
- `buy() payable`: Accept AVAX, deduct 1% fee, swap remaining AVAX equally to underlying tokens on DEX, hold tokens in contract, mint and transfer fund tokens.
- `sell(uint256 fundTokenAmount)`: Burn fund tokens, calculate proportional underlying tokens, swap them to AVAX on DEX, deduct 1% fee from AVAX, transfer AVAX to user.
- `getCurrentFundValue()`: Compute total fund value using oracle prices.
- `fundTokenBalanceOf(address)`: Return user fund token balance.

### Fee Distribution
- Internal logic to split 1% AVAX fee: 50% to fund creator, 25% to AGI buyback/burn, 25% to protocol treasury.

### Oracle Interface
- `getPrice(address token)`: Fetch live token price.

### Access Control
- `onlyCreator` modifier.
- Ownership transfer functions.

### Events
- `FundCreated()`, `FundTokenBought()`, `FundTokenSold()`, `FeesDistributed()`.

---

This design ensures seamless, transparent, and secure user interaction with on-chain index funds while aligning incentives for creators and maintaining protocol sustainability.
