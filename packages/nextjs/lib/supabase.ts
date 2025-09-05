import { createClient } from "@supabase/supabase-js";

const supabaseUrl = "https://kdcrsozlmgzeebpnfmqp.supabase.co";
const supabaseAnonKey =
  "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6ImtkY3Jzb3psbWd6ZWVicG5mbXFwIiwicm9sZSI6ImFub24iLCJpYXQiOjE3NTY1NTMyODcsImV4cCI6MjA3MjEyOTI4N30.F1aYx-4XxV9ZBmCE9jTzAeVnzvb7bP7TI0DNWUekmqs";

export const supabase = createClient(supabaseUrl, supabaseAnonKey);

// Types based on our database schema
export interface User {
  wallet_address: string;
  created_at?: string;
  last_active?: string;
}

export interface Fund {
  fund_address: string; // Contract address (PK)
  fund_id: number; // ID from FundFactory
  creator_address: string;
  name: string;
  ticker: string;
  description?: string;
  creation_date?: string;
  agi_burned?: number;
  underlying_tokens?: string[]; // Array of token addresses
}

export interface FundToken {
  id: string;
  fund_address: string; // References fund contract address
  token_address: string;
  weight_percentage: number;
}

export interface Investment {
  id: string;
  user_address: string;
  fund_address: string; // References fund contract address
  share_balance?: number;
  last_updated?: string;
}

export interface Transaction {
  id: string;
  user_address: string;
  fund_address: string; // References fund contract address
  txn_type: "buy" | "sell";
  amount: number;
  fee_paid?: number;
  timestamp?: string;
}

export interface Leaderboard {
  id: string;
  fund_address: string; // References fund contract address
  rank?: number;
  performance_metric?: number;
  last_updated?: string;
}
