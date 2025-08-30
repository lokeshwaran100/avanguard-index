"use client";

import { useState } from "react";
import Link from "next/link";
import { useAccount } from "wagmi";
import { ArrowLeftIcon } from "@heroicons/react/24/outline";

const FundDetail = (props: any) => {
  const { params } = props as { params: { id: string } };
  const { isConnected } = useAccount();
  const [activeTab, setActiveTab] = useState("overview");
  const [amount, setAmount] = useState("");
  const [action, setAction] = useState("buy");

  // Mock data - replace with real data from contracts/API
  const fundData = {
    id: params.id,
    name: "DeFi Blue Chip Index",
    description: "A diversified portfolio of leading DeFi tokens on Avalanche.",
    creator: "Alex Turner",
    tvl: 1234567,
    currentPrice: 12.34,
    totalSupply: 100000,
    userBalance: 250.5,
    holdings: [
      { token: "Token A", allocation: 20, price: 100.0, value: 246913 },
      { token: "Token B", allocation: 20, price: 50.0, value: 246913 },
      { token: "Token C", allocation: 20, price: 75.0, value: 246913 },
      { token: "Token D", allocation: 20, price: 125.0, value: 246913 },
      { token: "Token E", allocation: 20, price: 25.0, value: 246913 },
    ],
  };

  const estimatedFees = parseFloat(amount) * 0.01 || 0;
  const total = parseFloat(amount) + estimatedFees || 0;

  return (
    <div className="container mx-auto px-4 py-8 max-w-7xl">
      {/* Breadcrumb */}
      <div className="mb-6">
        <Link href="/invest" className="flex items-center text-blue-600 hover:text-blue-800 mb-4">
          <ArrowLeftIcon className="h-4 w-4 mr-2" />
          Browse / Index Fund Details
        </Link>
      </div>

      {/* Fund Header */}
      <div className="mb-8">
        <h1 className="text-3xl font-bold mb-2">{fundData.name}</h1>
        <p className="text-gray-600 mb-4">{fundData.description}</p>
      </div>

      {/* Key Metrics */}
      <div className="grid md:grid-cols-3 gap-6 mb-8">
        <div className="bg-white p-6 rounded-xl shadow-sm border">
          <h3 className="text-sm font-medium text-gray-600 mb-2">Total Value Locked</h3>
          <p className="text-2xl font-bold">${fundData.tvl.toLocaleString()}</p>
        </div>

        <div className="bg-white p-6 rounded-xl shadow-sm border">
          <h3 className="text-sm font-medium text-gray-600 mb-2">Current Price</h3>
          <p className="text-2xl font-bold">${fundData.currentPrice}</p>
        </div>

        <div className="bg-white p-6 rounded-xl shadow-sm border">
          <h3 className="text-sm font-medium text-gray-600 mb-2">Total Supply</h3>
          <p className="text-2xl font-bold">{fundData.totalSupply.toLocaleString()}</p>
        </div>
      </div>

      <div className="grid lg:grid-cols-3 gap-8">
        {/* Main Content */}
        <div className="lg:col-span-2">
          {/* Tabs */}
          <div className="bg-white rounded-xl shadow-sm border">
            <div className="border-b">
              <nav className="flex">
                {[
                  { id: "overview", label: "Overview" },
                  { id: "holdings", label: "Holdings" },
                  { id: "performance", label: "Performance" },
                ].map(tab => (
                  <button
                    key={tab.id}
                    onClick={() => setActiveTab(tab.id)}
                    className={`px-6 py-4 font-medium text-sm border-b-2 ${
                      activeTab === tab.id
                        ? "border-blue-600 text-blue-600"
                        : "border-transparent text-gray-500 hover:text-gray-700"
                    }`}
                  >
                    {tab.label}
                  </button>
                ))}
              </nav>
            </div>

            <div className="p-6">
              {activeTab === "overview" && (
                <div>
                  <h3 className="text-lg font-semibold mb-4">Fund Overview</h3>
                  <p className="text-gray-600 mb-4">{fundData.description}</p>
                  <div className="grid md:grid-cols-2 gap-4">
                    <div>
                      <h4 className="font-medium mb-2">Fund Creator</h4>
                      <p className="text-gray-600">{fundData.creator}</p>
                    </div>
                    <div>
                      <h4 className="font-medium mb-2">Strategy</h4>
                      <p className="text-gray-600">Equal-weighted index of top DeFi tokens</p>
                    </div>
                  </div>
                </div>
              )}

              {activeTab === "holdings" && (
                <div>
                  <h3 className="text-lg font-semibold mb-4">Holdings</h3>
                  <div className="overflow-x-auto">
                    <table className="w-full">
                      <thead>
                        <tr className="text-left text-sm text-gray-600 border-b">
                          <th className="pb-3">Token</th>
                          <th className="pb-3">Allocation</th>
                          <th className="pb-3">Price</th>
                          <th className="pb-3">Value</th>
                        </tr>
                      </thead>
                      <tbody>
                        {fundData.holdings.map((holding, index) => (
                          <tr key={index} className="border-b last:border-b-0">
                            <td className="py-4 font-medium">{holding.token}</td>
                            <td className="py-4">{holding.allocation}%</td>
                            <td className="py-4">${holding.price.toFixed(2)}</td>
                            <td className="py-4">${holding.value.toLocaleString()}</td>
                          </tr>
                        ))}
                      </tbody>
                    </table>
                  </div>
                </div>
              )}

              {activeTab === "performance" && (
                <div>
                  <h3 className="text-lg font-semibold mb-4">Performance</h3>
                  <div className="h-64 bg-gray-50 rounded-lg flex items-center justify-center">
                    <p className="text-gray-500">Performance chart will be displayed here</p>
                  </div>
                </div>
              )}
            </div>
          </div>
        </div>

        {/* Buy/Sell Panel */}
        <div className="lg:col-span-1">
          <div className="bg-white rounded-xl shadow-sm border p-6 sticky top-8">
            <h3 className="text-lg font-semibold mb-4">Buy / Sell</h3>

            {!isConnected ? (
              <div className="text-center py-8">
                <p className="text-gray-600 mb-4">Connect your wallet to trade</p>
              </div>
            ) : (
              <>
                {/* Action Tabs */}
                <div className="flex mb-4">
                  <button
                    onClick={() => setAction("buy")}
                    className={`flex-1 py-2 px-4 rounded-l-lg font-medium ${
                      action === "buy" ? "bg-blue-600 text-white" : "bg-gray-100 text-gray-600 hover:bg-gray-200"
                    }`}
                  >
                    Buy
                  </button>
                  <button
                    onClick={() => setAction("sell")}
                    className={`flex-1 py-2 px-4 rounded-r-lg font-medium ${
                      action === "sell" ? "bg-blue-600 text-white" : "bg-gray-100 text-gray-600 hover:bg-gray-200"
                    }`}
                  >
                    Sell
                  </button>
                </div>

                {/* Amount Input */}
                <div className="mb-4">
                  <label className="block text-sm font-medium text-gray-700 mb-2">Amount</label>
                  <input
                    type="number"
                    value={amount}
                    onChange={e => setAmount(e.target.value)}
                    placeholder="Enter amount"
                    className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
                  />
                </div>

                {/* Balance */}
                <div className="mb-4">
                  <p className="text-sm text-gray-600">Your Balance</p>
                  <p className="font-semibold">{fundData.userBalance} DBCI</p>
                </div>

                {/* Fee Breakdown */}
                {amount && (
                  <div className="mb-4 p-3 bg-gray-50 rounded-lg">
                    <div className="flex justify-between text-sm mb-1">
                      <span>Estimated Fees</span>
                      <span>${estimatedFees.toFixed(2)}</span>
                    </div>
                    <div className="flex justify-between font-semibold">
                      <span>Total</span>
                      <span>${total.toFixed(2)}</span>
                    </div>
                  </div>
                )}

                {/* Action Button */}
                <button
                  disabled={!amount || parseFloat(amount) <= 0}
                  className={`w-full py-3 px-4 rounded-lg font-semibold transition-colors ${
                    action === "buy"
                      ? "bg-blue-600 hover:bg-blue-700 text-white disabled:bg-gray-300"
                      : "bg-red-600 hover:bg-red-700 text-white disabled:bg-gray-300"
                  } disabled:cursor-not-allowed`}
                >
                  {action === "buy" ? "Buy" : "Sell"}
                </button>
              </>
            )}
          </div>
        </div>
      </div>
    </div>
  );
};

export default FundDetail;
