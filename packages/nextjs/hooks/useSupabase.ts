import { useEffect, useState } from "react";
import { Fund, FundToken, Investment, Transaction, supabase } from "~~/lib/supabase";

// Hook to get all funds with their tokens
export const useFunds = () => {
  const [funds, setFunds] = useState<(Fund & { fund_tokens?: FundToken[] })[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    const fetchFunds = async () => {
      try {
        const { data: fundsData, error: fundsError } = await supabase.from("funds").select(`
            *,
            fund_tokens (*)
          `);

        if (fundsError) throw fundsError;
        setFunds(fundsData || []);
      } catch (err) {
        setError(err instanceof Error ? err.message : "An error occurred");
      } finally {
        setLoading(false);
      }
    };

    fetchFunds();
  }, []);

  return { funds, loading, error, refetch: () => setLoading(true) };
};

// Hook to get user's investments
export const useUserInvestments = (userAddress?: string) => {
  const [investments, setInvestments] = useState<(Investment & { fund?: Fund })[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    if (!userAddress) {
      setInvestments([]);
      setLoading(false);
      return;
    }

    const fetchInvestments = async () => {
      try {
        const { data, error } = await supabase
          .from("investments")
          .select(
            `
            *,
            fund:funds (*)
          `,
          )
          .eq("user_address", userAddress);

        if (error) throw error;
        setInvestments(data || []);
      } catch (err) {
        setError(err instanceof Error ? err.message : "An error occurred");
      } finally {
        setLoading(false);
      }
    };

    fetchInvestments();
  }, [userAddress]);

  return { investments, loading, error };
};

// Hook to get user's created funds
export const useUserFunds = (userAddress?: string) => {
  const [funds, setFunds] = useState<(Fund & { fund_tokens?: FundToken[] })[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const fetchUserFunds = async () => {
    if (!userAddress) {
      setFunds([]);
      setLoading(false);
      return;
    }

    try {
      setLoading(true);
      const { data, error } = await supabase
        .from("funds")
        .select(
          `
            *,
            fund_tokens (*)
          `,
        )
        .eq("creator_address", userAddress);

      if (error) throw error;
      setFunds(data || []);
    } catch (err) {
      setError(err instanceof Error ? err.message : "An error occurred");
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchUserFunds();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [userAddress]);

  return { funds, loading, error, refetch: fetchUserFunds };
};

// Hook to get a specific fund with details
export const useFund = (fundAddress?: string) => {
  const [fund, setFund] = useState<(Fund & { fund_tokens?: FundToken[] }) | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    if (!fundAddress) {
      setFund(null);
      setLoading(false);
      return;
    }

    const fetchFund = async () => {
      try {
        const { data, error } = await supabase
          .from("funds")
          .select(
            `
            *,
            fund_tokens (*)
          `,
          )
          .eq("fund_address", fundAddress)
          .single();

        if (error) throw error;
        setFund(data);
      } catch (err) {
        setError(err instanceof Error ? err.message : "An error occurred");
      } finally {
        setLoading(false);
      }
    };

    fetchFund();
  }, [fundAddress]);

  return { fund, loading, error };
};

// Hook to get user's transaction history
export const useTransactions = (userAddress?: string) => {
  const [transactions, setTransactions] = useState<(Transaction & { fund?: Fund })[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    if (!userAddress) {
      setTransactions([]);
      setLoading(false);
      return;
    }

    const fetchTransactions = async () => {
      try {
        const { data, error } = await supabase
          .from("transactions")
          .select(
            `
            *,
            fund:funds (*)
          `,
          )
          .eq("user_address", userAddress)
          .order("timestamp", { ascending: false });

        if (error) throw error;
        setTransactions(data || []);
      } catch (err) {
        setError(err instanceof Error ? err.message : "An error occurred");
      } finally {
        setLoading(false);
      }
    };

    fetchTransactions();
  }, [userAddress]);

  return { transactions, loading, error };
};

// Function to create a new fund record in Supabase (called after smart contract creation)
export const createFundRecord = async (
  fundAddress: string,
  fundId: number,
  creatorAddress: string,
  name: string,
  ticker: string,
  tokens: { symbol: string; weight: number }[],
) => {
  try {
    // First, ensure user exists
    const { error: userError } = await supabase
      .from("users")
      .upsert({ wallet_address: creatorAddress }, { onConflict: "wallet_address" });

    if (userError) throw userError;

    // Create the fund record with actual contract address
    const { data: fundData, error: fundError } = await supabase
      .from("funds")
      .insert({
        fund_address: fundAddress,
        fund_id: fundId,
        creator_address: creatorAddress,
        name,
        ticker,
        agi_burned: 1000, // Fixed creation fee
        underlying_tokens: tokens.map(t => t.symbol),
      })
      .select()
      .single();

    if (fundError) throw fundError;

    // Create fund tokens
    const fundTokens = tokens.map(token => ({
      fund_address: fundData.fund_address,
      token_address: token.symbol, // Using symbol as address for now
      weight_percentage: token.weight,
    }));

    const { error: tokensError } = await supabase.from("fund_tokens").insert(fundTokens);

    if (tokensError) throw tokensError;

    return { success: true, fund: fundData };
  } catch (error) {
    console.error("Error creating fund record:", error);
    return { success: false, error: error instanceof Error ? error.message : "Unknown error" };
  }
};

// Legacy function for backward compatibility (now just calls createFundRecord with mock data)
export const createFund = async (
  creatorAddress: string,
  name: string,
  ticker: string,
  tokens: { symbol: string; weight: number }[],
) => {
  // This is now a fallback - should be replaced by createFundRecord
  const mockFundAddress = `0x${Math.random().toString(16).substr(2, 40)}`;
  const mockFundId = Math.floor(Math.random() * 1000000);

  return createFundRecord(mockFundAddress, mockFundId, creatorAddress, name, ticker, tokens);
};

// Function to invest in a fund (will be updated to use smart contracts)
export const investInFund = async (userAddress: string, fundAddress: string, amount: number) => {
  try {
    // Ensure user exists
    const { error: userError } = await supabase
      .from("users")
      .upsert({ wallet_address: userAddress }, { onConflict: "wallet_address" });

    if (userError) throw userError;

    // Create or update investment
    const { data: existingInvestment } = await supabase
      .from("investments")
      .select("*")
      .eq("user_address", userAddress)
      .eq("fund_address", fundAddress)
      .single();

    if (existingInvestment) {
      // Update existing investment
      const { error } = await supabase
        .from("investments")
        .update({
          share_balance: (existingInvestment.share_balance || 0) + amount,
          last_updated: new Date().toISOString(),
        })
        .eq("id", existingInvestment.id);

      if (error) throw error;
    } else {
      // Create new investment
      const { error } = await supabase.from("investments").insert({
        user_address: userAddress,
        fund_address: fundAddress,
        share_balance: amount,
      });

      if (error) throw error;
    }

    // Record transaction
    const { error: txError } = await supabase.from("transactions").insert({
      user_address: userAddress,
      fund_address: fundAddress,
      txn_type: "buy",
      amount,
      fee_paid: amount * 0.01, // 1% fee
    });

    if (txError) throw txError;

    return { success: true };
  } catch (error) {
    console.error("Error investing in fund:", error);
    return { success: false, error: error instanceof Error ? error.message : "Unknown error" };
  }
};

// Function to update fund token weights (for rebalancing)
export const updateFundWeights = async (fundAddress: string, newWeights: { [tokenAddress: string]: number }) => {
  try {
    // Update each token's weight in the fund_tokens table
    const updates = Object.entries(newWeights).map(([tokenAddress, weight]) =>
      supabase
        .from("fund_tokens")
        .update({ weight_percentage: weight })
        .eq("fund_address", fundAddress)
        .eq("token_address", tokenAddress),
    );

    // Execute all updates
    const results = await Promise.all(updates);

    // Check if any updates failed
    const errors = results.filter(result => result.error);
    if (errors.length > 0) {
      throw new Error(`Failed to update ${errors.length} token weights`);
    }

    return { success: true };
  } catch (error) {
    console.error("Error updating fund weights:", error);
    return { success: false, error: error instanceof Error ? error.message : "Unknown error" };
  }
};
