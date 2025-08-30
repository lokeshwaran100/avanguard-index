"use client";

import { useState } from "react";
import type { NextPage } from "next";
import { useAccount } from "wagmi";
import { PlusIcon } from "@heroicons/react/24/outline";
import { createFund } from "~~/hooks/useSupabase";

const CreateFund: NextPage = () => {
  const { isConnected, address } = useAccount();
  const [fundName, setFundName] = useState("");
  const [ticker, setTicker] = useState("");
  const [isCreating, setIsCreating] = useState(false);
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
      const result = await createFund(address, fundName, ticker, selectedTokens);

      if (result.success) {
        alert(`Fund "${fundName}" created successfully!`);
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
        alert(`Error creating fund: ${result.error}`);
      }
    } catch (error) {
      console.error("Error creating fund:", error);
      alert("An unexpected error occurred");
    } finally {
      setIsCreating(false);
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
                      <option value="WAVAX">WAVAX</option>
                      <option value="USDC">USDC</option>
                      <option value="USDT">USDT</option>
                      <option value="JOE">JOE</option>
                      <option value="PNG">PNG</option>
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

        {/* Creation Fee */}
        <div className="mb-8 p-4 bg-blue-50 rounded-lg">
          <div className="flex justify-between items-center">
            <span className="font-medium">AGI Creation Fee</span>
            <span className="text-blue-600 font-bold">0.5%</span>
          </div>
        </div>

        {/* Create Button */}
        <button
          onClick={handleCreateFund}
          disabled={!fundName || !ticker || tokens.some(t => !t.symbol) || getTotalWeight() !== 100 || isCreating}
          className="w-full bg-blue-600 hover:bg-blue-700 disabled:bg-gray-300 disabled:cursor-not-allowed text-white py-3 px-6 rounded-lg font-semibold text-lg transition-colors"
        >
          {isCreating ? "Creating Fund..." : "Create Fund"}
        </button>
      </div>
    </div>
  );
};

export default CreateFund;
