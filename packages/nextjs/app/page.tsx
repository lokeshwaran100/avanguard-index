"use client";

import Link from "next/link";
import type { NextPage } from "next";
import { useAccount } from "wagmi";
import { ChartBarIcon, ShieldCheckIcon, UsersIcon } from "@heroicons/react/24/outline";

const Home: NextPage = () => {
  const { isConnected } = useAccount();

  return (
    <>
      {/* Hero Section */}
      <div className="flex items-center flex-col grow pt-20 pb-10">
        <div className="px-5 max-w-4xl mx-auto text-center">
          <h1 className="text-center mb-8">
            <span className="block text-5xl font-bold mb-4">Decentralized Index Funds on</span>
            <span className="block text-5xl font-bold text-blue-600">Avalanche</span>
          </h1>

          <p className="text-xl text-gray-600 mb-12 max-w-2xl mx-auto">
            Create and invest in cryptocurrency index funds with ease and transparency on the Avaguard Index platform.
          </p>

          <div className="flex justify-center gap-4 mb-16">
            <Link
              href="/create"
              className="bg-blue-600 hover:bg-blue-700 text-white px-8 py-3 rounded-lg font-semibold text-lg transition-colors"
            >
              Create Fund
            </Link>
            <Link
              href="/invest"
              className="border-2 border-blue-600 text-blue-600 hover:bg-blue-50 px-8 py-3 rounded-lg font-semibold text-lg transition-colors"
            >
              Invest Now
            </Link>
          </div>
        </div>

        {/* Features Section */}
        <div className="w-full bg-gray-50 py-16">
          <div className="max-w-6xl mx-auto px-8">
            <h2 className="text-3xl font-bold text-center mb-4">Why Choose Avaguard Index?</h2>
            <p className="text-gray-600 text-center mb-12 max-w-2xl mx-auto">
              Avaguard Index offers a secure, transparent, and community-driven platform for creating and investing in
              decentralized index funds.
            </p>

            <div className="grid md:grid-cols-3 gap-8">
              <div className="bg-white p-8 rounded-xl shadow-sm text-center">
                <div className="w-16 h-16 bg-blue-100 rounded-full flex items-center justify-center mx-auto mb-4">
                  <ShieldCheckIcon className="h-8 w-8 text-blue-600" />
                </div>
                <h3 className="text-xl font-semibold mb-3">Security</h3>
                <p className="text-gray-600">Robust security measures ensure the safety of your investments.</p>
              </div>

              <div className="bg-white p-8 rounded-xl shadow-sm text-center">
                <div className="w-16 h-16 bg-blue-100 rounded-full flex items-center justify-center mx-auto mb-4">
                  <ChartBarIcon className="h-8 w-8 text-blue-600" />
                </div>
                <h3 className="text-xl font-semibold mb-3">Transparency</h3>
                <p className="text-gray-600">
                  All transactions and fund compositions are transparently recorded on the blockchain.
                </p>
              </div>

              <div className="bg-white p-8 rounded-xl shadow-sm text-center">
                <div className="w-16 h-16 bg-blue-100 rounded-full flex items-center justify-center mx-auto mb-4">
                  <UsersIcon className="h-8 w-8 text-blue-600" />
                </div>
                <h3 className="text-xl font-semibold mb-3">Community</h3>
                <p className="text-gray-600">
                  Join a growing community of creators and investors shaping the future of decentralized finance.
                </p>
              </div>
            </div>
          </div>
        </div>

        {/* CTA Section */}
        {!isConnected && (
          <div className="w-full py-16 text-center">
            <h2 className="text-2xl font-bold mb-4">Ready to Get Started?</h2>
            <p className="text-gray-600 mb-8">Connect your wallet to begin creating and investing in index funds.</p>
          </div>
        )}

        {/* Footer */}
        <div className="w-full py-8 text-center text-gray-500">
          <p>© 2024 Avaguard Index. All rights reserved.</p>
        </div>
      </div>
    </>
  );
};

export default Home;
