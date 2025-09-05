# Avaguard Index

## Project Description
Avaguard Index is a simple and decentralized platform that enables anyone to create and invest in diversified cryptocurrency index funds using AVAX. Investors buy a single fund token, which the platform swaps via Pangolin DEX for the fund’s underlying tokens securely held in smart contract vaults managed by the fund creator. Fund creators set custom token weightings that sum to 100% and can rebalance allocations to optimize performance. Transaction fees are minimal and shared fairly to reward fund creators and support platform development. Avaguard Index simplifies diversified crypto investing with low cost and ease of use.

## Features
- Create custom crypto index funds with flexible token weightings.  
- Single AVAX token investment, automatically swapped for underlying tokens.  
- Secure token custody in on-chain vaults managed by fund creators.  
- Rebalancing ability for fund creators to adjust token allocations.  
- Low 1% fees with fair distribution to creators, treasury, and governance token buybacks.  
- DEX integration with Pangolin on Avalanche for token swaps.

## Future Enhancements
- Automated staking of vault tokens for additional yield generation.  
- Borrowing and lending using fund tokens as collateral.  
- AI-based fund managers that rebalance automatically, mimicking investment personalities.  
- Cross-chain fund creation and management using Avalanche’s interoperability.  
- DAO governance to empower token holders with platform control and fund oversight.

## Tech Stack
- **Smart Contracts:** Written in Solidity, deployed on Avalanche C-Chain.  
- **Development Framework:** Built using Scaffold-ETH for rapid prototyping and deployment.  
- **Frontend:** React/Next.js interface for user interaction and wallet integration.  
- **DEX Integration:** Pangolin DEX for AVAX-token swaps.  
- **Oracles:** Chainlink or Avalanche-native oracles for live token pricing.  
- **Backend:** Supabase for user data and transaction metadata storage.

## Getting Started

### Prerequisites
- Node.js (v16 or above)  
- Yarn or npm  
- Hardhat & Scaffold-ETH dependencies  
- MetaMask or another Web3 wallet connected to Avalanche testnet

### Installation
```
git clone https://github.com/lokeshwaran100/avanguard-index.git
cd avanguard-index
yarn install
```

### Running Locally
Start local blockchain and deploy contracts:
```
yarn chain
yarn deploy
```

Start frontend:
```
yarn start
```

### Testing
Run smart contract tests:
```
yarn test
```

## Usage
- Connect wallet (MetaMask) on Avalanche network.  
- Create fund by specifying token list and weightings.  
- Investors buy fund tokens using AVAX; contract swaps automatically.  
- Creators rebalance fund allocations as needed.  
- Sell fund tokens anytime to redeem AVAX.