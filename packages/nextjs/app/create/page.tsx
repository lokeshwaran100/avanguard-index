"use client";

import { useState } from "react";
import type { NextPage } from "next";
import { useAccount } from "wagmi";
import { PlusIcon } from "@heroicons/react/24/outline";
import { getAvalancheFujiTokenAddresses, useAGIToken, useFundFactory } from "~~/hooks/useContracts";
import { createFund, createFundRecord } from "~~/hooks/useSupabase";

const CreateFund: NextPage = () => {
  const { isConnected, address } = useAccount();
  const [fundName, setFundName] = useState("");
  const [ticker, setTicker] = useState("");
  const [isCreating, setIsCreating] = useState(false);
  const [showFaucet, setShowFaucet] = useState(false);
  const [isClaiming, setIsClaiming] = useState(false);

  // Contract hooks
  const { createNewFund, isCreatingFund } = useFundFactory();
  const { agiBalance, agiAllowance, approveAGIForFundCreation, isApprovingAGI } = useAGIToken();

  // Get real Avalanche Fuji token addresses
  const fujiTokens = getAvalancheFujiTokenAddresses();
  const [tokens, setTokens] = useState([
    { address: "", symbol: "", weight: 20 },
    { address: "", symbol: "", weight: 20 },
    { address: "", symbol: "", weight: 20 },
    { address: "", symbol: "", weight: 20 },
    { address: "", symbol: "", weight: 20 },
  ]);

  const addToken = () => {
    if (tokens.length < 8) {
      const newWeight = Math.floor(100 / (tokens.length + 1));
      const updatedTokens = tokens.map(token => ({ ...token, weight: newWeight }));
      setTokens([...updatedTokens, { address: "", symbol: "", weight: newWeight }]);
    }
  };

  const removeToken = (index: number) => {
    if (tokens.length > 2) {
      const newTokens = tokens.filter((_, i) => i !== index);
      const newWeight = Math.floor(100 / newTokens.length);
      setTokens(newTokens.map(token => ({ ...token, weight: newWeight })));
    }
  };

  const updateToken = (index: number, field: string, value: string | number) => {
    const updatedTokens = tokens.map((token, i) => (i === index ? { ...token, [field]: value } : token));
    setTokens(updatedTokens);
  };

  const updateWeight = (index: number, weight: number) => {
    const updatedTokens = tokens.map((token, i) => (i === index ? { ...token, weight } : token));
    setTokens(updatedTokens);
  };

  const redistributeWeights = () => {
    const equalWeight = Math.floor(100 / tokens.length);
    const updatedTokens = tokens.map(token => ({ ...token, weight: equalWeight }));
    setTokens(updatedTokens);
  };

  const getTotalWeight = () => {
    return tokens.reduce((sum, token) => sum + token.weight, 0);
  };

  const handleCreateFund = async () => {
    if (!address || !fundName || !ticker || getTotalWeight() !== 100) return;

    setIsCreating(true);
    try {
      const selectedTokens = tokens.filter(token => token.symbol);

      // Check AGI balance and allowance
      if (agiBalance < 1000) {
        alert("Insufficient AGI balance. You need 1000 AGI to create a fund.");
        return;
      }

      // Check if AGI allowance is sufficient
      if (agiAllowance < 1000) {
        alert("Please approve AGI spending first.");
        const approveResult = await approveAGIForFundCreation();
        if (!approveResult.success) {
          alert(`Error approving AGI: ${approveResult.error}`);
          return;
        }
        alert("AGI approved! Please try creating the fund again.");
        return;
      }

      // Convert token symbols to addresses
      const tokenAddresses = selectedTokens.map(token => {
        const address = fujiTokens[token.symbol as keyof typeof fujiTokens];
        if (!address) {
          throw new Error(`Unknown token: ${token.symbol}`);
        }
        return address;
      });

      // Create fund via smart contract
      const weightagesPercent = selectedTokens.map(t => t.weight);
      const contractResult = await createNewFund(fundName, ticker, tokenAddresses, weightagesPercent);
      console.log("contract result", contractResult);

      if (contractResult.success) {
        let supabaseResult;
        if (contractResult.fundAddress && contractResult.fundId !== undefined) {
          supabaseResult = await createFundRecord(
            contractResult.fundAddress,
            contractResult.fundId,
            address,
            fundName,
            ticker,
            selectedTokens,
          );
        } else {
          // Fallback to mock if event parsing fails
          supabaseResult = await createFund(address, fundName, ticker, selectedTokens);
        }

        if (supabaseResult.success) {
          const finalAddress = contractResult.fundAddress || supabaseResult.fund?.fund_address || "unknown";
          alert(
            `Fund "${fundName}" created successfully!\nTransaction: ${contractResult.txHash}\nFund Address: ${finalAddress}`,
          );
          // Reset form
          setFundName("");
          setTicker("");
          setTokens([
            { address: "", symbol: "", weight: 20 },
            { address: "", symbol: "", weight: 20 },
            { address: "", symbol: "", weight: 20 },
            { address: "", symbol: "", weight: 20 },
            { address: "", symbol: "", weight: 20 },
          ]);
        } else {
          console.log("Fund created on blockchain but database error: ", supabaseResult.error);
          alert(`Fund created on blockchain but database error: ${supabaseResult.error}`);
        }
      } else {
        alert(`Error creating fund: ${contractResult.error}`);
      }
    } catch (error) {
      console.error("Error creating fund:", error);
      alert("An unexpected error occurred");
    } finally {
      setIsCreating(false);
    }
  };

  const claimAgi = async () => {
    if (!address) return;
    try {
      setIsClaiming(true);
      const res = await fetch("/api/faucet", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ to: address, amount: "1500" }),
      });
      const data = await res.json();
      if (data.success) {
        alert("Claim submitted! TX: " + data.txHash);
      } else {
        alert("Faucet error: " + data.error);
      }
    } catch {
      alert("Faucet request failed");
    } finally {
      setIsClaiming(false);
    }
  };

  if (!isConnected) {
    return (
      <div className="flex items-center justify-center min-h-screen">
        <div className="text-center">
          <h2 className="text-2xl font-bold mb-4">Connect Your Wallet</h2>
          <p className="text-gray-600">Please connect your wallet to create a fund.</p>
        </div>
      </div>
    );
  }

  return (
    <div className="container mx-auto px-4 py-8 max-w-4xl">
      <div className="mb-8">
        <h1 className="text-3xl font-bold mb-2">Create a New Index Fund</h1>
        <p className="text-gray-600">Build and customize your own cryptocurrency index fund on Avalanche.</p>
      </div>

      <div className="bg-white rounded-xl shadow-sm border p-8">
        {/* Fund Details */}
        <div className="mb-8">
          <h2 className="text-xl font-semibold mb-4">Fund Details</h2>

          <div className="grid md:grid-cols-2 gap-6">
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">Fund Name</label>
              <input
                type="text"
                value={fundName}
                onChange={e => setFundName(e.target.value)}
                placeholder="E.g. Avalanche Blue Chip"
                className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
              />
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">Ticker</label>
              <input
                type="text"
                value={ticker}
                onChange={e => setTicker(e.target.value.toUpperCase())}
                placeholder="E.g. ABC"
                className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
                maxLength={5}
              />
            </div>
          </div>
        </div>

        {/* Token Selection */}
        <div className="mb-8">
          <div className="flex justify-between items-center mb-4">
            <h2 className="text-xl font-semibold">Select Tokens & Define Weights</h2>
            <div className="flex gap-2">
              <button
                onClick={redistributeWeights}
                className="px-4 py-2 bg-gray-100 text-gray-700 rounded-lg hover:bg-gray-200 text-sm font-medium"
              >
                Equal Weights
              </button>
              <button
                onClick={addToken}
                disabled={tokens.length >= 8}
                className="flex items-center gap-2 px-4 py-2 border-2 border-dashed border-gray-300 text-gray-600 rounded-lg hover:border-blue-500 hover:text-blue-500 disabled:opacity-50 disabled:cursor-not-allowed"
              >
                <PlusIcon className="h-4 w-4" />
                Add Token
              </button>
            </div>
          </div>

          <div className="mb-4 p-3 bg-gray-50 rounded-lg">
            <div className="flex justify-between items-center">
              <span className="text-sm font-medium text-gray-700">Total Weight:</span>
              <span className={`font-bold ${getTotalWeight() === 100 ? "text-green-600" : "text-red-600"}`}>
                {getTotalWeight()}%
              </span>
            </div>
            {getTotalWeight() !== 100 && (
              <p className="text-xs text-red-600 mt-1">Total weight must equal 100% to create the fund</p>
            )}
          </div>

          <p className="text-sm text-gray-600 mb-6">
            Choose up to 8 tokens for your index and set their allocation percentages.
          </p>

          <div className="space-y-4">
            {tokens.map((token, index) => (
              <div key={index} className="relative bg-gray-50 p-4 rounded-lg">
                <div className="grid md:grid-cols-3 gap-4 items-end">
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-2">Token {index + 1}</label>
                    <select
                      value={token.symbol}
                      onChange={e => updateToken(index, "symbol", e.target.value)}
                      className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
                    >
                      <option value="">Select token</option>
                      <option value="ELK">ELK</option>
                      <option value="COW">COW</option>
                      <option value="TUR">TUR (Turtle)</option>
                      <option value="PNG">PNG</option>
                      <option value="JOE">JOE (Joe Coin)</option>
                      <option value="UNI">UNI (Uniswap)</option>
                      <option value="SUSHI">SUSHI</option>
                    </select>
                  </div>

                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-2">Weight (%)</label>
                    <input
                      type="number"
                      min="0"
                      max="100"
                      value={token.weight}
                      onChange={e => updateWeight(index, parseInt(e.target.value) || 0)}
                      className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
                      placeholder="0"
                    />
                  </div>

                  <div className="flex justify-end">
                    {tokens.length > 2 && (
                      <button
                        onClick={() => removeToken(index)}
                        className="px-3 py-2 bg-red-100 text-red-700 rounded-lg hover:bg-red-200 text-sm font-medium"
                      >
                        Remove
                      </button>
                    )}
                  </div>
                </div>
              </div>
            ))}
          </div>
        </div>

        {/* AGI Balance, Faucet & Approval */}
        <div className="mb-8 space-y-4">
          <div className="p-4 bg-gray-50 rounded-lg">
            <div className="flex justify-between items-center">
              <span className="font-medium">Your AGI Balance</span>
              <span className="font-bold">{agiBalance.toFixed(2)} AGI</span>
            </div>
          </div>

          <div className="p-4 bg-blue-50 rounded-lg">
            <div className="flex justify-between items-center">
              <span className="font-medium">AGI Creation Fee</span>
              <span className="text-blue-600 font-bold">1000 AGI</span>
            </div>
            {agiBalance < 1000 && (
              <p className="text-red-600 text-sm mt-2">Insufficient AGI balance. You need 1000 AGI to create a fund.</p>
            )}
            <div className="mt-3 flex gap-2">
              <button
                onClick={() => setShowFaucet(true)}
                className="px-3 py-2 bg-[#3B82F6] hover:bg-[#3B82F6]/80 text-white rounded-lg text-sm font-medium"
              >
                Claim 1500 AGI (Faucet)
              </button>
              <button
                onClick={async () => {
                  const res = await approveAGIForFundCreation();
                  if (res.success) alert("AGI approved!");
                  else alert("Approve failed: " + res.error);
                }}
                className="px-3 py-2 bg-green-600 hover:bg-green-700 text-white rounded-lg text-sm font-medium"
              >
                Approve AGI
              </button>
            </div>
          </div>
        </div>

        {/* Create Button */}
        <button
          onClick={handleCreateFund}
          disabled={
            !fundName ||
            !ticker ||
            tokens.some(t => !t.symbol) ||
            getTotalWeight() !== 100 ||
            isCreating ||
            isCreatingFund ||
            isApprovingAGI
          }
          className="w-full bg-blue-600 hover:bg-blue-700 disabled:bg-gray-300 disabled:cursor-not-allowed text-white py-3 px-6 rounded-lg font-semibold text-lg transition-colors"
        >
          {isCreating || isCreatingFund ? "Creating Fund..." : isApprovingAGI ? "Approving AGI..." : "Create Fund"}
        </button>
      </div>

      {/* Faucet Modal */}
      {showFaucet && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/40">
          <div className="bg-white rounded-xl shadow-lg w-full max-w-md p-6">
            <h3 className="text-lg font-semibold mb-2">AGI Faucet</h3>
            <p className="text-sm text-gray-600 mb-4">Claim 1500 AGI test tokens to create a fund.</p>
            <div className="flex gap-2 justify-end">
              <button
                onClick={() => setShowFaucet(false)}
                className="px-3 py-2 border border-gray-300 rounded-lg text-sm"
                disabled={isClaiming}
              >
                Close
              </button>
              <button
                onClick={claimAgi}
                disabled={isClaiming}
                className="px-3 py-2 bg-purple-600 hover:bg-purple-700 text-white rounded-lg text-sm font-medium disabled:bg-gray-300"
              >
                {isClaiming ? "Claiming..." : "Claim 1500 AGI"}
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default CreateFund;
