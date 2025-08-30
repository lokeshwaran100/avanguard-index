import { useAccount } from "wagmi";
import { useScaffoldContract, useScaffoldReadContract, useScaffoldWriteContract } from "~~/hooks/scaffold-eth";

// Hook to interact with FundFactory contract
export const useFundFactory = () => {
  const { address } = useAccount();

  // Get the FundFactory contract instance
  const { data: fundFactory } = useScaffoldContract({
    contractName: "FundFactory",
  });

  // Read total funds count
  const { data: totalFunds } = useScaffoldReadContract({
    contractName: "FundFactory",
    functionName: "getTotalFunds",
  });

  // Write function to create a fund
  const { writeContractAsync: createFund, isPending: isCreatingFund } = useScaffoldWriteContract("FundFactory");

  // Function to create a new fund
  const createNewFund = async (fundName: string, fundTicker: string, tokens: string[]) => {
    if (!address) throw new Error("Wallet not connected");

    try {
      const result = await createFund({
        functionName: "createFund",
        args: [fundName, fundTicker, tokens],
      });
      return { success: true, txHash: result };
    } catch (error) {
      console.error("Error creating fund:", error);
      return { success: false, error: error instanceof Error ? error.message : "Unknown error" };
    }
  };

  return {
    fundFactory,
    totalFunds: totalFunds ? Number(totalFunds) : 0,
    createNewFund,
    isCreatingFund,
  };
};

// Hook to interact with AGI Token contract
export const useAGIToken = () => {
  const { address } = useAccount();

  // Read AGI balance
  const { data: agiBalance } = useScaffoldReadContract({
    contractName: "AGIToken",
    functionName: "balanceOf",
    args: [address || "0x0000000000000000000000000000000000000000"],
  });

  // Read AGI allowance for FundFactory
  const { data: agiAllowance } = useScaffoldReadContract({
    contractName: "AGIToken",
    functionName: "allowance",
    args: [address || "0x0000000000000000000000000000000000000000", "0xCf7Ed3AccA5a467e9e704C703E8D87F634fB0Fc9"], // FundFactory address
  });

  // Write function to approve AGI spending
  const { writeContractAsync: approveAGI, isPending: isApprovingAGI } = useScaffoldWriteContract("AGIToken");

  // Function to approve AGI spending for fund creation
  const approveAGIForFundCreation = async () => {
    if (!address) throw new Error("Wallet not connected");

    try {
      const result = await approveAGI({
        functionName: "approve",
        args: ["0xCf7Ed3AccA5a467e9e704C703E8D87F634fB0Fc9", BigInt("1000000000000000000000")], // 1000 AGI
      });
      return { success: true, txHash: result };
    } catch (error) {
      console.error("Error approving AGI:", error);
      return { success: false, error: error instanceof Error ? error.message : "Unknown error" };
    }
  };

  return {
    agiBalance: address && agiBalance ? Number(agiBalance) / 1e18 : 0, // Convert from wei
    agiAllowance: address && agiAllowance ? Number(agiAllowance) / 1e18 : 0,
    approveAGIForFundCreation,
    isApprovingAGI,
  };
};

// Hook to interact with individual Fund contracts (simplified for now)
export const useFundContract = (fundAddress?: string) => {
  // const { address } = useAccount();

  // For now, return mock data since individual Fund contracts are created dynamically
  // TODO: Implement dynamic contract interaction when we have actual fund addresses

  return {
    fundTokenBalance: 0, // Mock balance
    currentFundValue: 0, // Mock value
    investInFund: async (avaxAmount: bigint) => {
      // Mock investment function
      console.log(`Mock investment of ${avaxAmount} AVAX in fund ${fundAddress}`);
      return { success: true, txHash: "0x..." };
    },
    isBuyingTokens: false,
  };
};

// Helper function to get mock token addresses
export const getMockTokenAddresses = () => {
  return {
    USDC: "0xDc64a140Aa3E981100a9becA4E685f962f0cF6C9",
    USDT: "0x5FC8d32690cc91D4c39d9d3abcBD16989F875707",
    WBTC: "0x0165878A594ca255338adfa4d48449f69242Eb8F",
    // Add more as needed
  };
};
