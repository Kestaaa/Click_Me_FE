import React, { useMemo, useState, useEffect } from 'react';
import { IconLoader2, IconCoins, IconClock } from "@tabler/icons-react";
import { formatTokenAmount, formatDuration, formatRewardsSol } from "@/lib/utils";
import { StakingContextData } from './types';
import { BN } from "@project-serum/anchor";

interface ClaimTabProps {
  data: StakingContextData;
}

const ClaimTab: React.FC<ClaimTabProps> = ({ data }) => {
  const {
    stakingInfo,
    tokenBalance,
    tokenDecimals,
    tokenSymbol,
    loading,
    unstakeClaimableTime,
    claimableRewardsBN,
    connected,
    handleClaimUnstaked,
    refreshStakingData,
    isRedeemProcessing
  } = data;
  
  // Check if we have unstaked tokens pending
  const hasUnstakedPending = useMemo(() => {
    return !!(stakingInfo && !stakingInfo.unstakedPending.isZero());
  }, [stakingInfo]);

  // Only show the timer if we have unstaked tokens pending
  const showClaimableTimer = useMemo(() => {
    return hasUnstakedPending && unstakeClaimableTime > 0;
  }, [hasUnstakedPending, unstakeClaimableTime]);

  // Button disabled state
  const claimButtonDisabled = loading || 
    isRedeemProcessing ||
    !stakingInfo || 
    !hasUnstakedPending || 
    showClaimableTimer;

  // Get button text based on state
  const getButtonText = () => {
    if (isRedeemProcessing) {
      return "Processing Redemption...";
    }
    if (showClaimableTimer) {
      return `Redeem in ${formatDuration(unstakeClaimableTime)}`;
    }
    return "Redeem Tokens";
  };

  // Handle claim with immediate optimistic update and forced refresh
  const handleOptimisticClaim = async (e: React.MouseEvent<HTMLButtonElement>) => {
    if (!stakingInfo) return;
    await handleClaimUnstaked(e);
  };

  // Determine the display amount, showing zero immediately after claim
  const displayUnstakedAmount = useMemo(() => {
    // When processing a transaction, show zero
    if (isRedeemProcessing) {
      return "0";
    }
    
    // Otherwise show the actual amount
    return formatTokenAmount(stakingInfo?.unstakedPending, tokenDecimals);
  }, [stakingInfo?.unstakedPending, tokenDecimals, isRedeemProcessing]);

  return (
    <div className="flex-1 flex flex-col">
      <div className="bg-gray-700 rounded-lg p-4 sm:p-5 mb-4">
        <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between">
          <div className="flex items-center mb-2 sm:mb-0">
            <IconCoins size={16} className={`${showClaimableTimer ? 'text-amber-400' : 'text-green-400'} mr-2 shrink-0`} />
            <p className={`text-sm ${showClaimableTimer ? 'text-amber-400' : 'text-green-400'}`}>
              {showClaimableTimer ? 'Tokens pending unlock:' : 'Tokens redeemable:'}
            </p>
          </div>
          <p className={`text-lg font-bold ${showClaimableTimer ? 'text-amber-400' : 'text-green-400'} truncate max-w-[180px] sm:max-w-none`}>
            {displayUnstakedAmount} {tokenSymbol}
          </p>
        </div>
        {showClaimableTimer && (
          <div className="mt-3 pt-3 border-t border-gray-600 flex flex-col sm:flex-row sm:items-center sm:justify-between">
            <span className="text-sm text-amber-400 mb-1 sm:mb-0">Time until Redeemable:</span>
            <div className="flex items-center text-amber-400">
              <IconClock size={14} className="mr-1 shrink-0" />
              <span className="text-sm font-medium">
                {formatDuration(unstakeClaimableTime)}
              </span>
            </div>
          </div>
        )}
      </div>
      
      {showClaimableTimer && (
        <div className="bg-amber-900 bg-opacity-20 border border-amber-800 border-opacity-30 rounded-lg p-3 mb-4">
          <div className="flex items-start">
            <IconClock className="w-4 h-4 text-amber-400 shrink-0 mr-1 mt-0.5" size={16} />
            <p className="text-xs text-amber-400">
              Still in redemption lockup period. Please wait for the timer to end.
            </p>
          </div>
        </div>
      )}
      
      <div className="my-4 flex-1 bg-gray-700 bg-opacity-50 rounded-lg p-4">
        <div className="flex items-center mb-3">
          <IconCoins size={16} className="text-indigo-400 mr-2 shrink-0" />
          <span className="text-sm font-medium text-white">Redeem Information</span>
        </div>
        <div className="space-y-3">
          <div className="flex justify-between text-sm">
            <span className="text-gray-400">Token Balance:</span>
            <span className="text-white truncate ml-2 max-w-[180px]">
              {formatTokenAmount(tokenBalance, tokenDecimals)} {tokenSymbol}
            </span>
          </div>
          <div className="flex justify-between text-sm">
            <span className="text-gray-400">Currently Staked:</span>
            <span className="text-white truncate ml-2 max-w-[180px]">
              {formatTokenAmount(stakingInfo?.amountStaked, tokenDecimals)} {tokenSymbol}
            </span>
          </div>
          {(hasUnstakedPending || isRedeemProcessing) && (
            <div className="flex justify-between text-sm">
              <span className="text-gray-400">Pending Redemption:</span>
              <span className="text-white truncate ml-2 max-w-[180px]">
                {isRedeemProcessing ? "0" : formatTokenAmount(stakingInfo?.unstakedPending, tokenDecimals)} {tokenSymbol}
              </span>
            </div>
          )}
        </div>
      </div>
      
      <div className="mt-auto">
        {!connected ? (
          <div className="text-white text-center font-bold text-xl">
            Please Connect Wallet
          </div>
        ) : (
          <button
            className="w-full py-3 px-4 bg-green-600 hover:bg-green-700 disabled:bg-gray-600 disabled:opacity-50 text-white font-medium rounded-lg transition-colors duration-200 ease-in-out text-sm cursor-pointer"
            onClick={handleOptimisticClaim}
            disabled={claimButtonDisabled}
          >
            <div className="flex items-center justify-center">
              {loading || isRedeemProcessing ? <IconLoader2 className="animate-spin mr-2" size={16} /> : <IconCoins size={16} className="mr-2" />}
              {getButtonText()}
            </div>
          </button>
        )}
      </div>
    </div>
  );
};

export default ClaimTab;