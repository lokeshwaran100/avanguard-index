# Avaguard Index Project Summary, Frontend Screens, and Supabase Database Schema

## Project Summary
Avaguard Index is a decentralized platform on Avalanche that allows anyone to create and invest in cryptocurrency index funds. Each fund consists of a basket of tokens with equal weightings (for MVP), and issues a unique fund token representing ownership. The fund token’s value reflects the live combined value of its underlying assets, updated via a price oracle. Investors can buy and sell fund tokens, paying a small fee that rewards creators, funds buyback and burn of the governance token (AGI), and supports platform development. This platform brings transparency, accountability, and ease-of-use to crypto investing, enabling creators to earn rewards for performance and investors to gain diversified exposure without complex research.

---

## Next.js Frontend Screens

### 1. Landing Page
- Introductory overview and call-to-actions for fund creation and investment.
- Along with the wallet connect button in the navbar.

### 2. User Portfolio
- Display user AGI balance, created funds, and investmented funds overview.

### 3. Fund Creation Page
- Input fund name and unique ticker.
- Select tokens from Avalanche testnet.
- Along with the weights.
- Show AGI creation fee.
- Create fund action triggers smart contract interaction.

### 4. Fund Marketplace
- List active funds with search and filter options.
- Show fund details like creator, tokens, returns, along with the stats.

### 5. Fund Detail Page
- Display fund info, composition, and real-time price.
- Buy and sell fund shares with fee breakdown.
- Show user’s fund token balance.

### 7. Leaderboard (Optional)
- Top funds ranked by performance and volume.
- Weekly reward distribution display.

---

## Supabase Database Schema

### Table: `users`
| Column           | Type          | Description                           |
|------------------|---------------|-------------------------------------|
| wallet_address   | Text (PK)     | User’s blockchain wallet address    |
| created_at       | Timestamp     | Account creation time                |
| last_active      | Timestamp     | Last activity time                   |

### Table: `funds`
| Column           | Type          | Description                          |
|------------------|---------------|--------------------------------------|
| id               | UUID (PK)     | Unique fund identifier               |
| creator_address  | Text          | Wallet address of fund creator (FK) |
| name             | Text          | Name of the fund                    |
| ticker           | Text          | Unique ticker symbol for fund token |
| creation_date    | Timestamp     | Fund creation timestamp             |
| agi_burned       | Numeric       | AGI tokens burned at creation       |

### Table: `fund_tokens`
| Column           | Type          | Description                          |
|------------------|---------------|------------------------------------|
| id               | UUID (PK)    | Unique record identifier             |
| fund_id          | UUID (FK)    | Associated fund                     |
| token_address    | Text          | Address of token in fund             |
| weight_percentage| Numeric       | Equal weight percentage per token   |

### Table: `investments`
| Column           | Type          | Description                          |
|------------------|---------------|------------------------------------|
| id               | UUID (PK)    | Unique record identifier             |
| user_address     | Text (FK)    | Wallet address of investor           |
| fund_id          | UUID (FK)    | Fund invested in                    |
| share_balance    | Numeric       | Number of fund tokens owned          |
| last_updated     | Timestamp     | Last update timestamp                |

### Table: `transactions`
| Column           | Type          | Description                          |
|------------------|---------------|------------------------------------|
| id               | UUID (PK)    | Unique transaction identifier       |
| user_address     | Text (FK)    | Wallet address of investor           |
| fund_id          | UUID (FK)    | Fund involved                      |
| txn_type         | Text         | 'buy' or 'sell'                     |
| amount           | Numeric       | Number of shares bought or sold     |
| fee_paid         | Numeric       | Fee paid in AGI                     |
| timestamp        | Timestamp     | Timestamp of transaction            |

### Table: `leaderboard` (Optional)
| Column           | Type          | Description                          |
|------------------|---------------|------------------------------------|
| id               | UUID (PK)    | Unique record identifier             |
| fund_id          | UUID (FK)    | Associated fund                     |
| rank             | Integer      | Fund ranking position                |
| performance_metric| Numeric       | Performance measurement (ROI, etc.) |
| last_updated     | Timestamp     | Last update time                    |

---
## Frontend Guidelines

⚠️ **Do not use Shadcn or Radix UI.** Stick to lightweight, maintainable libraries and custom components.

- **UI Library Choices**:
  - TailwindCSS → primary styling
  - Headless UI (optional, for accessible modals/dropdowns)
  - React Hook Form for form handling
  - Chart.js or Recharts for basic portfolio/fund performance charts

- **Custom Components**:
  - `Button` (primary/secondary)
  - `Card` (fund display, form wrapper)
  - `Modal` (transaction confirmation, alerts)
  - `Input`, `Select`, `Slider` (for token weights)
  - `Navbar`, `Footer`

## Theme 

- **Primary Colors**:  
  - Blue (`#1E40AF` or similar deep blue) → for trust, professionalism, and highlights.  
  - White (`#FFFFFF`) → for clean backgrounds and readability.  
- **Secondary Colors**:  
  - Light Gray (`#F3F4F6`) for neutral sections and dividers.  
  - Green (`#10B981`) for success states (e.g., successful transactions).  
  - Red (`#EF4444`) for errors and warnings.

---

This combined setup provides a clear user interface flow with robust backend data structures to support the decentralized, tokenized fund investment experience for the Avaguard Index platform.