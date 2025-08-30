import { decodeEventLog, parseEther } from "viem";
import type { Abi } from "viem";
import { useAccount } from "wagmi";
import { usePublicClient, useReadContract, useWriteContract } from "wagmi";
import { useScaffoldContract, useScaffoldReadContract, useScaffoldWriteContract } from "~~/hooks/scaffold-eth";

// Hook to interact with FundFactory contract
export const useFundFactory = () => {
  const { address } = useAccount();
  const publicClient = usePublicClient();

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
        args: [fundName, fundTicker, tokens] as const,
      });

      if (!result) {
        alert("Error creating fund");
        return { success: false, error: "Error creating fund" };
      }

      // If we have a public client and contract metadata, parse FundCreated from the receipt
      if (publicClient && fundFactory?.address && fundFactory?.abi) {
        const receipt = await publicClient.waitForTransactionReceipt({ hash: result });

        let createdFundAddress: string | undefined;
        let createdFundId: number | undefined;

        for (const log of receipt.logs) {
          if (log.address.toLowerCase() !== fundFactory.address.toLowerCase()) continue;
          try {
            const decoded = decodeEventLog({
              abi: fundFactory.abi as Abi,
              data: log.data,
              topics: log.topics,
            });
            if (decoded.eventName === "FundCreated") {
              const args = decoded.args as unknown as {
                fundId: bigint;
                creator: string;
                fundName: string;
                fundTicker: string;
                fundAddress: string;
                underlyingTokens: string[];
              };
              createdFundAddress = args.fundAddress;
              createdFundId = Number(args.fundId);
              break;
            }
          } catch (error) {
            console.log("error parsing event", error);
          }
        }

        return { success: true, txHash: result, fundAddress: createdFundAddress, fundId: createdFundId };
      }

      // Fallback: return only tx hash
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
    args: [address || "0x0000000000000000000000000000000000000000"] as const,
  });

  // Read AGI allowance for FundFactory
  const { data: agiAllowance } = useScaffoldReadContract({
    contractName: "AGIToken",
    functionName: "allowance",
    args: [
      address || "0x0000000000000000000000000000000000000000",
      "0xCf7Ed3AccA5a467e9e704C703E8D87F634fB0Fc9",
    ] as const, // FundFactory address
  });

  // Write function to approve AGI spending
  const { writeContractAsync: approveAGI, isPending: isApprovingAGI } = useScaffoldWriteContract("AGIToken");

  // Function to approve AGI spending for fund creation
  const approveAGIForFundCreation = async () => {
    if (!address) throw new Error("Wallet not connected");

    try {
      const result = await approveAGI({
        functionName: "approve",
        args: ["0xCf7Ed3AccA5a467e9e704C703E8D87F634fB0Fc9", BigInt("1000000000000000000000")] as const, // 1000 AGI
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

// Hook to interact with individual Fund contracts
export const useFundContract = (fundAddress?: string) => {
  const { address } = useAccount();

  // Fund contract ABI (simplified - just the functions we need)
  const fundABI = [
    {
      inputs: [],
      name: "buy",
      outputs: [],
      stateMutability: "payable",
      type: "function",
    },
    {
      inputs: [{ internalType: "uint256", name: "fundTokenAmount", type: "uint256" }],
      name: "sell",
      outputs: [],
      stateMutability: "nonpayable",
      type: "function",
    },
    {
      inputs: [{ internalType: "address", name: "account", type: "address" }],
      name: "balanceOf",
      outputs: [{ internalType: "uint256", name: "", type: "uint256" }],
      stateMutability: "view",
      type: "function",
    },
    {
      inputs: [],
      name: "getCurrentFundValue",
      outputs: [{ internalType: "uint256", name: "", type: "uint256" }],
      stateMutability: "view",
      type: "function",
    },
    {
      inputs: [],
      name: "totalSupply",
      outputs: [{ internalType: "uint256", name: "", type: "uint256" }],
      stateMutability: "view",
      type: "function",
    },
  ] as const;

  // Read fund token balance for user
  const { data: fundTokenBalance } = useReadContract({
    address: fundAddress as `0x${string}`,
    abi: fundABI,
    functionName: "balanceOf",
    args: [address || "0x0000000000000000000000000000000000000000"],
    query: { enabled: !!(fundAddress && address) },
  });

  // Read current fund value
  const { data: currentFundValue } = useReadContract({
    address: fundAddress as `0x${string}`,
    abi: fundABI,
    functionName: "getCurrentFundValue",
    query: { enabled: !!fundAddress },
  });

  // Read total supply
  const { data: totalSupply } = useReadContract({
    address: fundAddress as `0x${string}`,
    abi: fundABI,
    functionName: "totalSupply",
    query: { enabled: !!fundAddress },
  });

  // Write contract hook for transactions
  const { writeContractAsync, isPending: isBuyingTokens } = useWriteContract();

  // Function to buy fund tokens
  const buyFundTokens = async (avaxAmount: string) => {
    if (!address || !fundAddress) throw new Error("Wallet not connected or fund address missing");

    try {
      const result = await writeContractAsync({
        address: fundAddress as `0x${string}`,
        abi: fundABI,
        functionName: "buy",
        value: parseEther(avaxAmount),
      });
      return { success: true, txHash: result };
    } catch (error) {
      console.error("Error buying fund tokens:", error);
      return { success: false, error: error instanceof Error ? error.message : "Unknown error" };
    }
  };

  // Function to sell fund tokens
  const sellFundTokens = async (fundTokenAmount: string) => {
    if (!address || !fundAddress) throw new Error("Wallet not connected or fund address missing");

    try {
      const result = await writeContractAsync({
        address: fundAddress as `0x${string}`,
        abi: fundABI,
        functionName: "sell",
        args: [parseEther(fundTokenAmount)],
      });
      return { success: true, txHash: result };
    } catch (error) {
      console.error("Error selling fund tokens:", error);
      return { success: false, error: error instanceof Error ? error.message : "Unknown error" };
    }
  };

  return {
    fundTokenBalance: fundTokenBalance ? Number(fundTokenBalance) / 1e18 : 0,
    currentFundValue: currentFundValue ? Number(currentFundValue) / 1e18 : 0,
    totalSupply: totalSupply ? Number(totalSupply) / 1e18 : 0,
    buyFundTokens,
    sellFundTokens,
    isBuyingTokens,
  };
};

// Helper function to get mock token addresses
export const getMockTokenAddresses = () => {
  return {
    USDC: "0x9A676e781A523b5d0C0e43731313A708CB607508",
    USDT: "0x0B306BF915C4d645ff596e518fAf3F9669b97016",
    WBTC: "0x959922bE3CAee4b8Cd9a407cc3ac1C251C2007B1",
    // Add more as needed
  };
};
