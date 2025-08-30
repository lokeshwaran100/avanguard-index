"use client";

import { useState } from "react";
import Link from "next/link";
import type { NextPage } from "next";
import { MagnifyingGlassIcon } from "@heroicons/react/24/outline";

const Invest: NextPage = () => {
  const [searchTerm, setSearchTerm] = useState("");
  const [sortBy, setSortBy] = useState("performance");
  const [category, setCategory] = useState("all");
  const [riskLevel, setRiskLevel] = useState("all");

  // Mock data - replace with real data from contracts/API
  const funds = [
    {
      id: 1,
      name: "DeFi Blue Chip Index",
      creator: "Alex Turner",
      category: "DeFi",
      riskLevel: "Low Risk",
      yearReturn: 120.5,
      assets: ["AVAX", "JOE"],
      apy: 15.2,
      tvl: 1234567,
      description: "A diversified portfolio of leading DeFi tokens on Avalanche.",
    },
    {
      id: 2,
      name: "Emerging Tech Index",
      creator: "Olivia Bennett",
      category: "AI",
      riskLevel: "Medium Risk",
      yearReturn: 250.8,
      assets: ["TECH", "AI"],
      apy: 22.1,
      tvl: 856432,
      description: "Focused on emerging AI and tech tokens with high growth potential.",
    },
    {
      id: 3,
      name: "Stablecoin Yield Index",
      creator: "Ethan Carter",
      category: "Yield",
      riskLevel: "Low Risk",
      yearReturn: 15.2,
      assets: ["USDC", "USDT"],
      apy: 8.5,
      tvl: 2145678,
      description: "Conservative yield strategy focused on stablecoin farming.",
    },
    {
      id: 4,
      name: "NFT Art Index",
      creator: "Sophia Davis",
      category: "NFT",
      riskLevel: "High Risk",
      yearReturn: -25.3,
      assets: ["ART", "NFT"],
      apy: 5.2,
      tvl: 432156,
      description: "Exposure to NFT and digital art ecosystem tokens.",
    },
    {
      id: 5,
      name: "Metaverse Land Index",
      creator: "Liam Foster",
      category: "Metaverse",
      riskLevel: "High Risk",
      yearReturn: -40.1,
      assets: ["LAND", "META"],
      apy: 12.8,
      tvl: 678234,
      description: "Investment in metaverse and virtual real estate tokens.",
    },
    {
      id: 6,
      name: "Gaming Guilds Index",
      creator: "Chloe Kim",
      category: "Gaming",
      riskLevel: "Medium Risk",
      yearReturn: 55.6,
      assets: ["GAME", "GUILD"],
      apy: 18.9,
      tvl: 945123,
      description: "Diversified exposure to gaming and guild tokens.",
    },
  ];

  const filteredFunds = funds.filter(fund => {
    const matchesSearch =
      fund.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
      fund.creator.toLowerCase().includes(searchTerm.toLowerCase());
    const matchesCategory = category === "all" || fund.category.toLowerCase() === category.toLowerCase();
    const matchesRisk = riskLevel === "all" || fund.riskLevel.toLowerCase().includes(riskLevel.toLowerCase());

    return matchesSearch && matchesCategory && matchesRisk;
  });

  const sortedFunds = [...filteredFunds].sort((a, b) => {
    switch (sortBy) {
      case "performance":
        return b.yearReturn - a.yearReturn;
      case "tvl":
        return b.tvl - a.tvl;
      case "apy":
        return b.apy - a.apy;
      default:
        return 0;
    }
  });

  return (
    <div className="container mx-auto px-4 py-8 max-w-7xl">
      <div className="mb-8">
        <h1 className="text-3xl font-bold mb-2">Explore Indexes</h1>
        <p className="text-gray-600">
          Discover, analyze, and invest in a diverse range of cryptocurrency index funds created by the community.
        </p>
      </div>

      {/* Search and Filters */}
      <div className="bg-white p-6 rounded-xl shadow-sm border mb-8">
        <div className="flex flex-col lg:flex-row gap-4">
          {/* Search */}
          <div className="flex-1 relative">
            <MagnifyingGlassIcon className="h-5 w-5 absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400" />
            <input
              type="text"
              placeholder="Search by name, symbol, or creator"
              value={searchTerm}
              onChange={e => setSearchTerm(e.target.value)}
              className="w-full pl-10 pr-4 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
            />
          </div>

          {/* Filters */}
          <div className="flex gap-4">
            <select
              value={sortBy}
              onChange={e => setSortBy(e.target.value)}
              className="px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
            >
              <option value="performance">Sort by Performance</option>
              <option value="tvl">Sort by TVL</option>
              <option value="apy">Sort by APY</option>
            </select>

            <select
              value={category}
              onChange={e => setCategory(e.target.value)}
              className="px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
            >
              <option value="all">All Categories</option>
              <option value="defi">DeFi</option>
              <option value="ai">AI</option>
              <option value="gaming">Gaming</option>
              <option value="nft">NFT</option>
              <option value="metaverse">Metaverse</option>
            </select>

            <select
              value={riskLevel}
              onChange={e => setRiskLevel(e.target.value)}
              className="px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
            >
              <option value="all">All Risk Levels</option>
              <option value="low">Low Risk</option>
              <option value="medium">Medium Risk</option>
              <option value="high">High Risk</option>
            </select>
          </div>
        </div>
      </div>

      {/* Fund Cards */}
      <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-6">
        {sortedFunds.map(fund => (
          <div key={fund.id} className="bg-white rounded-xl shadow-sm border hover:shadow-md transition-shadow">
            <div className="p-6">
              {/* Header */}
              <div className="flex justify-between items-start mb-4">
                <div>
                  <h3 className="text-lg font-semibold mb-1">{fund.name}</h3>
                  <p className="text-sm text-gray-600">Created by {fund.creator}</p>
                </div>
                <div className="flex gap-2">
                  <span className="px-2 py-1 bg-blue-100 text-blue-800 text-xs font-medium rounded-full">
                    {fund.category}
                  </span>
                  <span
                    className={`px-2 py-1 text-xs font-medium rounded-full ${
                      fund.riskLevel.includes("Low")
                        ? "bg-green-100 text-green-800"
                        : fund.riskLevel.includes("Medium")
                          ? "bg-yellow-100 text-yellow-800"
                          : "bg-red-100 text-red-800"
                    }`}
                  >
                    {fund.riskLevel}
                  </span>
                </div>
              </div>

              {/* Metrics */}
              <div className="grid grid-cols-2 gap-4 mb-4">
                <div>
                  <p className="text-sm text-gray-600">1Y Return</p>
                  <p className={`font-semibold ${fund.yearReturn >= 0 ? "text-green-600" : "text-red-600"}`}>
                    {fund.yearReturn >= 0 ? "+" : ""}
                    {fund.yearReturn}%
                  </p>
                </div>
                <div>
                  <p className="text-sm text-gray-600">APY</p>
                  <p className="font-semibold">{fund.apy}%</p>
                </div>
              </div>

              {/* Assets */}
              <div className="mb-4">
                <p className="text-sm text-gray-600 mb-2">Assets</p>
                <div className="flex gap-2">
                  {fund.assets.map((asset, index) => (
                    <div key={index} className="w-8 h-8 bg-gray-200 rounded-full flex items-center justify-center">
                      <span className="text-xs font-medium">{asset.slice(0, 2)}</span>
                    </div>
                  ))}
                </div>
              </div>

              {/* Description */}
              <p className="text-sm text-gray-600 mb-4">{fund.description}</p>

              {/* Action Button */}
              <Link
                href={`/fund/${fund.id}`}
                className="block w-full bg-blue-600 hover:bg-blue-700 text-white py-2 px-4 rounded-lg text-center font-medium transition-colors"
              >
                View Index
              </Link>
            </div>
          </div>
        ))}
      </div>

      {/* Pagination */}
      <div className="flex justify-center mt-12">
        <div className="flex gap-2">
          <button className="px-3 py-2 border border-gray-300 rounded-lg hover:bg-gray-50">←</button>
          <button className="px-3 py-2 bg-blue-600 text-white rounded-lg">1</button>
          <button className="px-3 py-2 border border-gray-300 rounded-lg hover:bg-gray-50">2</button>
          <button className="px-3 py-2 border border-gray-300 rounded-lg hover:bg-gray-50">3</button>
          <button className="px-3 py-2 border border-gray-300 rounded-lg hover:bg-gray-50">...</button>
          <button className="px-3 py-2 border border-gray-300 rounded-lg hover:bg-gray-50">8</button>
          <button className="px-3 py-2 border border-gray-300 rounded-lg hover:bg-gray-50">→</button>
        </div>
      </div>
    </div>
  );
};

export default Invest;
