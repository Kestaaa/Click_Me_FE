'use client';

import React, { useState } from "react";
import StakingInfoTooltip from "./StakingInfoTooltip";
import StakeAndRewardsTab from "./StakeAndRewardsTab";
import UnstakeTab from "./UnstakeTab";
import ClaimTab from "./RedeemTab";
import { useStakingData } from "./hooks/useStakingData";
import { IS_TOKEN_LIVE } from "@/config"; // Import the flag

const StakingInterface: React.FC = () => {
  const [activeTab, setActiveTab] = useState("stakeAndRewards");
  const stakingData = useStakingData();
  
  if (!IS_TOKEN_LIVE) {
    // Return a placeholder UI when token is not live
    return (
      <div className="w-full max-w-5xl mx-auto overflow-hidden">
        <div className="flex justify-between items-center mb-6 px-2">
          <div className="flex items-center">
            <h2 className="text-2xl font-bold text-indigo-400">Token Staking</h2>
            <StakingInfoTooltip />
          </div>
        </div>

        <div className="bg-gray-800 border border-gray-700 rounded-xl shadow-lg overflow-hidden p-6">
          <div className="flex flex-col items-center justify-center min-h-[300px] text-center">
            <div className="bg-indigo-900 bg-opacity-20 border border-indigo-800 border-opacity-30 rounded-lg p-5 mb-4 max-w-xl">
              <h3 className="text-xl font-semibold text-indigo-400 mb-3">STAKING NOT LIVE YET</h3>
              <p className="text-gray-300 mb-4">
                The CLICKME token is not yet active. Staking features will be enabled once the token has been integrated.
              </p>
            </div>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="w-full max-w-5xl mx-auto overflow-hidden">
      <div className="flex justify-between items-center mb-6 px-2">
        <div className="flex items-center">
          <h2 className="text-2xl font-bold text-indigo-400">Token Staking</h2>
          <StakingInfoTooltip />
        </div>
      </div>

      <div className="bg-gray-800 border border-gray-700 rounded-xl shadow-lg overflow-hidden">
        <div className="flex border-b border-gray-700 overflow-x-auto">
          <button
            className={`py-4 px-3 sm:px-6 text-sm font-medium transition-colors duration-200 ease-in-out flex-1 cursor-pointer whitespace-nowrap
                      ${activeTab === "stakeAndRewards" 
                      ? "text-indigo-400 border-b-2 border-indigo-500" 
                      : "text-gray-400 hover:text-gray-200"}`}
            onClick={() => setActiveTab("stakeAndRewards")}
          >
            Stake & Rewards
          </button>
          <button
            className={`py-4 px-3 sm:px-6 text-sm font-medium transition-colors duration-200 ease-in-out flex-1 cursor-pointer whitespace-nowrap
                     ${activeTab === "pendingUnstake" 
                     ? "text-indigo-400 border-b-2 border-indigo-500" 
                     : "text-gray-400 hover:text-gray-200"}`}
            onClick={() => setActiveTab("pendingUnstake")}
          >
            Unstake
          </button>
          <button
            className={`py-4 px-3 sm:px-6 text-sm font-medium transition-colors duration-200 ease-in-out flex-1 cursor-pointer whitespace-nowrap
                     ${activeTab === "claimUnstaked" 
                     ? "text-indigo-400 border-b-2 border-indigo-500" 
                     : "text-gray-400 hover:text-gray-200"}`}
            onClick={() => setActiveTab("claimUnstaked")}
          >
            Redeem
          </button>
        </div>
      
        <div className="p-4 sm:p-6 min-h-[420px] flex flex-col">
          {activeTab === "stakeAndRewards" && (
            <StakeAndRewardsTab data={stakingData} />
          )}
          
          {activeTab === "pendingUnstake" && (
            <UnstakeTab data={stakingData} />
          )}
          
          {activeTab === "claimUnstaked" && (
            <ClaimTab data={stakingData} />
          )}
          
          <div className="flex justify-end items-center mt-4 pt-3 border-t border-gray-700 overflow-hidden">
            <div className="text-xs sm:text-sm text-gray-400 truncate">
              <span>Last update: {new Date(stakingData.lastFetchTime * 1000).toLocaleTimeString()}</span>
              {stakingData.publicKey && (
                <span className="ml-2">
                  {stakingData.publicKey.toString().slice(0, 4)}...{stakingData.publicKey.toString().slice(-4)}
                </span>
              )}
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

export default StakingInterface;