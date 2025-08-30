# Avaguard Index MVP Smart Contract Functionalities

The Avaguard Index MVP smart contracts will provide the core decentralized mutual fund functionality on Avalanche testnet by enabling token creation, fund creation with token-weighted indexes, and basic buy/sell functionality with associated fees and tokenomics.

---

## 1. Project Token (AGI) Contract
**Description:**  
Deploy an ERC-20 token representing AGI with a fixed supply of 1 billion tokens. Minting is disabled post-deployment to enforce scarcity. The token supports standard ERC-20 transfers and approvals.

---

## 2. Fund Creation Contract
**Description:**  
Allows users (fund creators) to create new index funds by specifying a basket of Avalanche testnet tokens and their respective weightages summing to 100%. A fixed fee of 1000 AGI tokens is permanently burned upon creation, ensuring creator commitment and deflationary pressure.

---

## 3. Fund Share Management
**Description:**  
Manages shares of each fund as tokenized representations of ownership. Investors receive fund share tokens proportional to their investment. Shares can be burned upon redemption or sale.

---

## 4. Buy and Sell Functions
**Description:**  
Enables users to buy shares by depositing underlying tokens in the defined weights and to sell/redeem shares, receiving tokens back accordingly. A 1% transaction fee is charged on both buy and sell orders. Fees are split as follows:  
- 50% to fund creator  
- 25% used for AGI token buyback and burn (simulated in MVP)  
- 25% sent to protocol treasury for development and maintenance

---

## 5. Ownership & Access Control
**Description:**  
Tracks fund creator ownership and restricts sensitive operations such as fund parameter updates and rebalancing to the original creator.

---

## 6. Fund Rebalancing (Optional / Stretch Goal)
**Description:**  
Fund creators can rebalance the index token weights periodically to adapt to market changes. Rebalancing incurs a burn fee of 1000 AGI tokens per action to prevent misuse and ensure thoughtful updates.

---

## 7. Treasury Management
**Description:**  
A smart contract-controlled treasury collects protocol treasury fees (25% of transaction fees). It supports admin withdrawals or governance-controlled disbursements for project funding.

---

## 8. Events & Logging
**Description:**  
Emits events on key actions such as fund creation, share buy/sell transactions, fee distributions, and rebalances to allow off-chain monitoring, UI updates, and analytics.

---

# Avaguard Index MVP Smart Contract Functions

## Project Token (AGI) Contract
- `constructor()`: Initialize fixed total supply (1 billion) and assign to deployer.
- `transfer(address recipient, uint256 amount)`: Standard ERC-20 token transfer.
- `approve(address spender, uint256 amount)`: Allowance approval.
- `transferFrom(address sender, address recipient, uint256 amount)`: Transfer tokens on behalf of another.
- `balanceOf(address account)`: Returns token balance.
- `totalSupply()`: Returns fixed total supply.
- (No mint function - supply capped)

## Fund Factory Contract
- `createFund(address[] tokenAddresses, uint256[] weights)`: Creates a new fund with specified tokens and their weights, burns 1000 AGI from creator.
- `getFund(uint256 fundId)`: Returns fund details including tokens, weights, creator, and fund address.

## Fund Contract
- `buy(uint256 amount)`: Buy shares of the fund by depositing underlying tokens proportional to weights; charges 1% fee.
- `sell(uint256 shareAmount)`: Sell/redeem shares and receive underlying tokens; charges 1% fee.
- `rebalance(address[] newTokens, uint256[] newWeights)`: (optional stretch) Allows creator to rebalance fund composition by paying 1000 AGI.

## Fee Distribution
- Internal to buy/sell functions:
  - Calculate 1% fee from transaction.
  - Distribute fee: 50% to creator, 25% to token buyback and burn, 25% to protocol treasury.
- `distributeFees()`: Handles fee allocation (called internally).

## Ownership & Access Control
- `onlyCreator` modifier: Restricts sensitive functions (e.g., rebalance, fund metadata update) to fund creator.
- `transferOwnership(address newOwner)`: Optionally allow transfer of fund ownership.

## Treasury Contract
- `withdraw(address to, uint256 amount)`: Allows project admins or governance to withdraw treasury funds.
- `getBalance()`: Returns treasury balance.

## Events
- `FundCreated(uint256 fundId, address creator, address fundAddress)`.
- `Buy(address indexed investor, uint256 amount, uint256 sharesMinted)`.
- `Sell(address indexed investor, uint256 sharesBurned, uint256 redeemedAmount)`.
- `Rebalance(address indexed creator, address[] newTokens, uint256[] newWeights)`.
- `FeeDistributed(uint256 totalFee, uint256 toCreator, uint256 buybackBurn, uint256 toTreasury)`.


---

This function list covers the MVP-level on-chain logic for token creation, fund lifecycle, investment actions, fee handling, and administrative control.
