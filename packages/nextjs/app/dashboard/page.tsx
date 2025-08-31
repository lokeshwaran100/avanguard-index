"use client";

import { useState } from "react";
import Link from "next/link";
import type { NextPage } from "next";
import { useAccount } from "wagmi";
import { useUserFunds, useUserInvestments } from "~~/hooks/useSupabase";

const Dashboard: NextPage = () => {
  const { isConnected, address } = useAccount();
  const [timeframe, setTimeframe] = useState("1W");

  // Get real data from Supabase
  const { funds: createdFunds } = useUserFunds(address);
  const { investments } = useUserInvestments(address);

  // Calculate portfolio data from real investments
  const portfolioData = {
    totalValue: investments.reduce((sum, inv) => sum + (inv.share_balance || 0) * 12.34, 0), // Mock price
    agiBalance: 1234.56, // This would come from wallet/contract
    totalPL: investments.reduce((sum, inv) => sum + (inv.share_balance || 0) * 0.5, 0), // Mock P/L
    plPercentage: 2.5, // Mock percentage
  };

  // Transform data for display
  const myFunds = [
    ...createdFunds.map(fund => ({
      id: fund.fund_address,
      name: fund.name,
      type: "Created" as const,
      value: Math.random() * 20000, // Mock value - would calculate from TVL
      change24h: Math.random() * 4 - 2, // Mock 24h change
      totalPL: Math.random() * 2000, // Mock P/L
      status: "active" as const,
      ticker: fund.ticker,
    })),
    ...investments.map(inv => ({
      id: inv.fund?.fund_address || "",
      name: inv.fund?.name || "Unknown Fund",
      type: "Invested" as const,
      value: (inv.share_balance || 0) * 12.34, // Mock price per share
      change24h: Math.random() * 4 - 2, // Mock 24h change
      totalPL: (inv.share_balance || 0) * 0.5, // Mock P/L
      status: "active" as const,
      ticker: inv.fund?.ticker || "",
    })),
  ];

  if (!isConnected) {
    return (
      <div className="flex items-center justify-center min-h-screen">
        <div className="text-center">
          <h2 className="text-2xl font-bold mb-4">Connect Your Wallet</h2>
          <p className="text-gray-600">Please connect your wallet to view your dashboard.</p>
        </div>
      </div>
    );
  }

  return (
    <div className="container mx-auto px-4 py-8 max-w-7xl">
      <h1 className="text-3xl font-bold mb-8">Dashboard</h1>

      {/* Portfolio Overview */}
      <div className="grid md:grid-cols-4 gap-6 mb-8">
        <div className="bg-white p-6 rounded-xl shadow-sm border">
          <h3 className="text-sm font-medium text-gray-600 mb-2">Portfolio Value</h3>
          <p className="text-2xl font-bold">${portfolioData.totalValue.toLocaleString()}</p>
          <p className="text-sm text-green-600">+{portfolioData.plPercentage}% vs last month</p>
        </div>

        <div className="bg-white p-6 rounded-xl shadow-sm border">
          <h3 className="text-sm font-medium text-gray-600 mb-2">AGI Balance</h3>
          <p className="text-2xl font-bold">{portfolioData.agiBalance.toLocaleString()}</p>
          <p className="text-sm text-gray-500">≈ ${(portfolioData.agiBalance * 10.345).toFixed(2)} USD</p>
        </div>

        <div className="bg-white p-6 rounded-xl shadow-sm border">
          <h3 className="text-sm font-medium text-gray-600 mb-2">Total P/L</h3>
          <p className="text-2xl font-bold text-green-600">+${portfolioData.totalPL.toLocaleString()}</p>
          <p className="text-sm text-gray-500">All time</p>
        </div>

        <div className="bg-white p-6 rounded-xl shadow-sm border">
          <h3 className="text-sm font-medium text-gray-600 mb-2">Actions</h3>
          <div className="space-y-2">
            <Link
              href="/create"
              className="block w-full bg-blue-600 hover:bg-blue-700 text-white py-2 px-4 rounded-lg text-sm font-medium text-center transition-colors"
            >
              Create New Fund
            </Link>
            <Link
              href="/invest"
              className="block w-full border border-gray-300 hover:bg-gray-50 text-gray-700 py-2 px-4 rounded-lg text-sm font-medium text-center transition-colors"
            >
              Invest in a Fund
            </Link>
          </div>
        </div>
      </div>

      {/* Portfolio Performance Chart */}
      <div className="bg-white p-6 rounded-xl shadow-sm border mb-8">
        <div className="flex justify-between items-center mb-6">
          <h2 className="text-xl font-semibold">Portfolio Performance</h2>
          <div className="flex gap-2">
            {["1D", "1W", "1M", "1Y", "ALL"].map(period => (
              <button
                key={period}
                onClick={() => setTimeframe(period)}
                className={`px-3 py-1 rounded text-sm font-medium ${
                  timeframe === period ? "bg-blue-600 text-white" : "text-gray-600 hover:bg-gray-100"
                }`}
              >
                {period}
              </button>
            ))}
          </div>
        </div>

        {/* Placeholder for chart */}
        <div className="h-64 bg-gray-50 rounded-lg flex items-center justify-center">
          <p className="text-gray-500">Portfolio performance chart will be displayed here</p>
        </div>
      </div>

      {/* Asset Allocation & My Funds */}
      <div className="grid lg:grid-cols-2 gap-8">
        {/* Asset Allocation */}
        <div className="bg-white p-6 rounded-xl shadow-sm border">
          <h2 className="text-xl font-semibold mb-6">Asset Allocation</h2>

          {/* Placeholder for pie chart */}
          <div className="h-64 bg-gray-50 rounded-lg flex items-center justify-center mb-4">
            <p className="text-gray-500">Asset allocation chart will be displayed here</p>
          </div>

          <div className="space-y-2">
            <div className="flex justify-between items-center">
              <div className="flex items-center gap-2">
                <div className="w-3 h-3 bg-blue-600 rounded-full"></div>
                <span className="text-sm">Tech Index Fund</span>
              </div>
              <span className="text-sm font-medium">65%</span>
            </div>
            <div className="flex justify-between items-center">
              <div className="flex items-center gap-2">
                <div className="w-3 h-3 bg-green-500 rounded-full"></div>
                <span className="text-sm">My First Fund</span>
              </div>
              <span className="text-sm font-medium">35%</span>
            </div>
          </div>
        </div>

        {/* My Funds */}
        <div className="bg-white p-6 rounded-xl shadow-sm border">
          <h2 className="text-xl font-semibold mb-6">My Funds</h2>

          <div className="overflow-x-auto">
            <table className="w-full">
              <thead>
                <tr className="text-left text-sm text-gray-600 border-b">
                  <th className="pb-3">Fund Name</th>
                  <th className="pb-3">Type</th>
                  <th className="pb-3">Value</th>
                  <th className="pb-3">24h Change</th>
                  <th className="pb-3">Total P/L</th>
                  <th className="pb-3">Actions</th>
                </tr>
              </thead>
              <tbody>
                {myFunds.map((fund, index) => (
                  <tr key={index} className="border-b last:border-b-0">
                    <td className="py-4 font-medium">{fund.name}</td>
                    <td className="py-4">
                      <span
                        className={`px-2 py-1 rounded-full text-xs font-medium ${
                          fund.type === "Created" ? "bg-blue-100 text-blue-800" : "bg-green-100 text-green-800"
                        }`}
                      >
                        {fund.type}
                      </span>
                    </td>
                    <td className="py-4">${fund.value.toLocaleString()}</td>
                    <td className="py-4">
                      <span className={fund.change24h >= 0 ? "text-green-600" : "text-red-600"}>
                        {fund.change24h >= 0 ? "+" : ""}
                        {fund.change24h}%
                      </span>
                    </td>
                    <td className="py-4 text-green-600">+${fund.totalPL.toLocaleString()}</td>
                    <td className="py-4">
                      <button className="text-blue-600 hover:text-blue-800 text-sm font-medium">
                        {fund.type === "Created" ? "Manage" : "Details"}
                      </button>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      </div>
    </div>
  );
};

export default Dashboard;
