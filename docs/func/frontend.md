# Avanguard Index Frontend Screens and Supabase Schemas

The Avanguard Index MVP smart contracts will provide the core decentralized mutual fund functionality on Avalanche testnet by enabling token creation, fund creation with token-weighted indexes, and basic buy/sell functionality with associated fees and tokenomics.

## Frontend Screens

1. **Landing Page**
   - Overview of Avanguard Index
   - Call-to-actions for creating funds or investing

2. **Connect Wallet / User Dashboard**
   - Wallet connection status
   - AGI token balance display
   - Overview of user’s created funds and investments
   - Quick links to create new fund or invest

3. **Create New Fund**
   - Form to select Avalanche testnet tokens
   - Input for token weight allocations (sum to 100%)
   - Estimated AGI creation fee display
   - Submit button to trigger fund creation transaction

4. **Fund Marketplace**
   - List of all active funds with key metadata
   - Filters and search (by creator, performance, tokens)
   - Fund cards showing fund name, creator, returns, AUM, fees

5. **Fund Detail Page**
   - Detailed fund info (tokens, weights, creator, fees, creation date)
   - Current price per fund share
   - Buy and sell input forms with calculator and fee estimates
   - User’s current share balance in the fund
   - Historical fund performance chart (if available)

6. **Buy Fund Shares**
   - Token amount inputs based on fund weights
   - Fee and total cost breakdown
   - Confirm transaction button with wallet interaction

7. **Sell Fund Shares**
   - Share amount input
   - Estimated tokens to receive and fee breakdown
   - Confirm transaction button

8. **Leaderboard (Stretch)**
   - Top performing funds ranked by ROI or volume
   - Rewards distributed and fund stats

9. **Admin / Treasury Dashboard (Optional)**
   - Treasury balance and withdrawal controls (admin only)
   - Fee distribution overview

---

## Supabase Database Schemas

### Table: `users`
| Column           | Type          | Description                            |
|------------------|---------------|--------------------------------------|
| wallet_address   | Text (PK)     | User’s blockchain wallet address     |
| created_at       | Timestamp     | Account creation time                 |
| last_active      | Timestamp     | Last login or transaction time       |

### Table: `funds`
| Column           | Type          | Description                           |
|------------------|---------------|-------------------------------------|
| id               | UUID          | Primary key                         |
| creator_address  | Text          | Wallet address of fund creator (FK) |

### Table: `fund_tokens`
| Column           | Type          | Description                           |
|------------------|---------------|-------------------------------------|
| id               | UUID          | Primary key                         |
| fund_id          | UUID          | Foreign key to `funds`               |

### Table: `investments`
| Column           | Type          | Description                           |
|------------------|---------------|-------------------------------------|
| id               | UUID          | Primary key                         |
| user_address     | Text          | Wallet address of investor (FK)      |
| fund_id          | UUID          | Foreign key to `funds`               |

### Table: `transactions`
| Column           | Type          | Description                           |
|------------------|---------------|-------------------------------------|
| id               | UUID          | Primary key                         |
| user_address     | Text          | Wallet address of investor (FK)      |
| fund_id          | UUID          | Foreign key to `funds`               |

### Table: `leaderboard`
| Column           | Type          | Description                           |
|------------------|---------------|-------------------------------------|
| id               | UUID          | Primary key                         |
| fund_id          | UUID          | Foreign key to `funds`               |
