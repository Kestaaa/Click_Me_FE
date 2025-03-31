import React, { useMemo } from 'react';
import { IconLoader2, IconCoin, IconCoins } from "@tabler/icons-react";
import { formatTokenAmount, formatRewardsSol, parseTokenAmount } from "@/lib/utils";
import { StakingContextData } from './types';

interface StakeAndRewardsTabProps {
  data: StakingContextData;
}

const StakeAndRewardsTab: React.FC<StakeAndRewardsTabProps> = ({ data }) => {
  const {
    stakingInfo,
    tokenBalance,
    tokenDecimals,
    tokenSymbol,
    loading,
    rewardsLoading,
    stakeAmount,
    setStakeAmount,
    claimableRewardsBN,
    connected,
    handleClaimRewards,
    handleStakeTokens,
    handleMaxStake,
    isStakeProcessing
  } = data;

  const claimDisabled =
    !stakingInfo ||
    claimableRewardsBN.isZero() ||
    (stakingInfo &&
      BigInt(stakingInfo.pendingRewards.toString()) > data.vaultLamports + BigInt(50));

  const handleMinStake = (e: React.MouseEvent<HTMLButtonElement>) => {
    const minAmount = 1 / Math.pow(10, tokenDecimals);
    setStakeAmount(minAmount.toFixed(tokenDecimals));
  };

  const validateAndSetStakeAmount = (value: string) => {
    if (value === '' || /^\d*\.?\d*$/.test(value)) {
      setStakeAmount(value);
    }
  };

  // Check if the input amount exceeds the token balance
  const hasInsufficientFunds = useMemo(() => {
    if (!stakeAmount || parseFloat(stakeAmount) <= 0) {
      return false;
    }
    
    const inputAmount = parseFloat(stakeAmount);
    // Calculate available balance directly to avoid parseTokenAmount issues
    const availableBalance = tokenBalance 
      ? Number(tokenBalance) / Math.pow(10, tokenDecimals) 
      : 0;
    
    return inputAmount > availableBalance;
  }, [stakeAmount, tokenBalance, tokenDecimals]);

  // Button is disabled if loading, no stake amount, amount <= 0, or insufficient funds
  const stakeButtonDisabled = loading || 
    isStakeProcessing ||
    !stakeAmount || 
    parseFloat(stakeAmount) <= 0 || 
    hasInsufficientFunds;

  // Get button text based on state
  const getButtonText = () => {
    if (isStakeProcessing) {
      return "Processing Stake...";
    }
    if (hasInsufficientFunds) {
      return "Insufficient Funds";
    }
    return "Stake Tokens";
  };

  return (
    <div className="flex-1 flex flex-col">
      <div className="bg-gray-700 rounded-lg p-4 sm:p-5 mb-4">
        <div className="flex flex-col sm:flex-row sm:justify-between sm:items-center">
          <div className="mb-3 sm:mb-0">
            <p className="text-xs text-gray-400">Staked</p>
            <p className="text-sm font-semibold text-white truncate max-w-[180px]">
              {formatTokenAmount(stakingInfo?.amountStaked, tokenDecimals)} {tokenSymbol}
            </p>
          </div>
          <div>
            <p className="text-xs text-gray-400">Balance</p>
            <p className="text-sm font-semibold text-white truncate max-w-[180px]">
              {formatTokenAmount(tokenBalance, tokenDecimals)} {tokenSymbol}
            </p>
          </div>
        </div>
        
        <div className="mt-4 pt-4 border-t border-gray-600">
          <div className="flex flex-col sm:flex-row sm:justify-between sm:items-center">
            <div className="mb-3 sm:mb-0">
              <p className="text-xs text-yellow-400">Pending Rewards</p>
              <p className="text-sm font-semibold text-yellow-400">
                {formatRewardsSol(claimableRewardsBN)} SOL
              </p>
            </div>
            {!connected ? (
              <div className="text-white text-center font-bold">
                Please Connect Wallet
              </div>
            ) : (
              <button
                className="py-3 px-4 bg-indigo-600 hover:bg-indigo-700 disabled:bg-gray-600 disabled:opacity-50 text-white text-sm font-medium rounded-md transition-colors cursor-pointer w-full sm:w-auto"
                onClick={(e) => handleClaimRewards(e)}
                disabled={rewardsLoading || claimDisabled}
              >
                <div className="flex items-center justify-center">
                  {rewardsLoading ? (
                    <IconLoader2 className="animate-spin mr-2" size={16} />
                  ) : (
                    <IconCoin size={16} className="mr-2" />
                  )}
                  {rewardsLoading ? "Processing Claim..." : "Claim Rewards"}
                </div>
              </button>
            )}
          </div>
        </div>
      </div>

      <div className="flex-grow flex flex-col justify-end">
        <div className="mb-4">
          <div className="bg-gray-700 rounded-lg p-4">
            <div className="flex justify-between items-center mb-1">
              <span className="text-xs text-gray-400">Amount to stake</span>
              <div className="flex space-x-2">
                <button 
                  className="text-xs text-indigo-400 font-medium cursor-pointer border border-indigo-700 px-2 py-0.5 rounded hover:bg-indigo-900/30 disabled:opacity-50 disabled:cursor-not-allowed"
                  onClick={(e) => handleMaxStake(e)}
                  disabled={isStakeProcessing}
                >
                  MAX
                </button>
              </div>
            </div>
            <div className="flex items-center">
              <input
                type="text"
                placeholder="0.0"
                className="w-full bg-transparent text-gray-100 text-base font-medium focus:outline-none disabled:opacity-50"
                value={stakeAmount}
                onChange={(e) => validateAndSetStakeAmount(e.target.value)}
                disabled={isStakeProcessing}
              />
              <span className="text-gray-300 font-medium text-sm">{tokenSymbol}</span>
            </div>
            {stakeAmount && stakeAmount !== "0" && stakeAmount !== "0.0" && (
              <p className="mt-2 text-xs text-red-400">
                Note: Adding more tokens will reset the unstake timer
              </p>
            )}

          </div>
        </div>
        
        {!connected ? (
          <div className="text-white text-center font-bold text-xl">
            Please Connect Wallet
          </div>
        ) : (
          <button
            className="w-full py-3 px-4 bg-indigo-600 hover:bg-indigo-700 disabled:bg-gray-600 disabled:opacity-50 text-white font-medium rounded-lg transition-colors duration-200 ease-in-out text-sm cursor-pointer"
            onClick={(e) => handleStakeTokens(e)}
            disabled={stakeButtonDisabled}
          >
            <div className="flex items-center justify-center">
              {loading || isStakeProcessing ? (
                <IconLoader2 className="animate-spin mr-2" size={16} />
              ) : (
                <IconCoins size={16} className="mr-2" />
              )}
              {getButtonText()}
            </div>
          </button>
        )}
      </div>
    </div>
  );
};

export default StakeAndRewardsTab;