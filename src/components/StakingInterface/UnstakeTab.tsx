import React, { useMemo } from 'react';
import { IconLoader2, IconArrowDown, IconClock, IconAlarmOff } from "@tabler/icons-react";
import { formatTokenAmount, formatDuration } from "@/lib/utils";
import { StakingContextData } from './types';

interface UnstakeTabProps {
  data: StakingContextData;
}

const UnstakeTab: React.FC<UnstakeTabProps> = ({ data }) => {
  const {
    stakingInfo,
    tokenDecimals,
    tokenSymbol,
    loading,
    unstakeAmount,
    setUnstakeAmount,
    stakeUnlockTime,
    connected,
    handleUnstakeTokens,
    handleMaxUnstake,
    isStakeProcessing,
    isUnstakeProcessing
  } = data;

  // Calculate the full staked amount in human-readable form.
  const totalStaked = stakingInfo?.amountStaked 
    ? Number(stakingInfo.amountStaked) / Math.pow(10, tokenDecimals)
    : 0;
  const unstakeValue = parseFloat(unstakeAmount || "0");

  // Check if we have staked tokens
  // We don't care about unstakedPending for this check anymore
  const isInStakingPhase = useMemo(() => {
    return !!(stakingInfo && !stakingInfo.amountStaked.isZero());
  }, [stakingInfo]);

  // Only show the staking timer if we're in the staking phase and the timer is active
  const showUnstakeTimer = useMemo(() => {
    return isInStakingPhase && stakeUnlockTime > 0;
  }, [isInStakingPhase, stakeUnlockTime]);

  // Validate if unstake amount exceeds the available staked tokens
  const hasInsufficientStaked = useMemo(() => {
    if (!unstakeAmount || parseFloat(unstakeAmount) <= 0 || !stakingInfo?.amountStaked) {
      return false;
    }
    
    const inputAmount = parseFloat(unstakeAmount);
    // Use totalStaked which is already calculated safely
    return inputAmount > totalStaked;
  }, [unstakeAmount, totalStaked, stakingInfo]);

  // Validate unstake amount input
  const validateAndSetUnstakeAmount = (value: string) => {
    if (value === '' || /^\d*\.?\d*$/.test(value)) {
      setUnstakeAmount(value);
    }
  };

  // Button is disabled based on multiple conditions
  const unstakeButtonDisabled = loading || 
    isUnstakeProcessing || 
    !unstakeAmount || 
    parseFloat(unstakeAmount) <= 0 || 
    (stakingInfo?.amountStaked.isZero() ?? true) || 
    showUnstakeTimer || 
    hasInsufficientStaked;

  // Get button text based on state
  const getButtonText = () => {
    if (isUnstakeProcessing) {
      return "Processing Unstake...";
    }
    if (hasInsufficientStaked) {
      return "Insufficient Staked Tokens";
    }
    if (showUnstakeTimer) {
      return `Unstake in ${formatDuration(stakeUnlockTime)}`;
    }
    return "Unstake Tokens";
  };

  return (
    <div className="flex-1 flex flex-col">
      <div className="bg-gray-700 rounded-lg p-4 sm:p-5 mb-4">
        <div className="flex flex-col sm:flex-row sm:justify-between sm:items-center">
          <div className="mb-3 sm:mb-0">
            <p className="text-xs text-gray-400">Currently Staked</p>
            <p className="text-sm font-semibold text-white truncate max-w-[180px]">
              {formatTokenAmount(stakingInfo?.amountStaked, tokenDecimals)} {tokenSymbol}
            </p>
          </div>
          <div>
            <p className="text-xs text-gray-400">Pending Unstake</p>
            <p className="text-sm font-semibold text-white truncate max-w-[180px]">
              {formatTokenAmount(stakingInfo?.unstakedPending, tokenDecimals)} {tokenSymbol}
            </p>
          </div>
        </div>
      </div>
      
      <div className="flex flex-col mb-4 bg-indigo-900 bg-opacity-20 border border-indigo-800 border-opacity-30 rounded-lg p-3">
        <div className="flex items-center justify-between mb-2 flex-wrap">
          <div className="flex items-center mb-2 sm:mb-0">
            {stakingInfo?.amountStaked.isZero() ? (
              <IconAlarmOff className="w-4 h-4 text-gray-400 shrink-0 mr-2" size={16} />
            ) : showUnstakeTimer ? (
              <IconClock className="w-4 h-4 text-amber-400 shrink-0 mr-2" size={16} />
            ) : (
              <IconAlarmOff className="w-4 h-4 text-green-400 shrink-0 mr-2" size={16} />
            )}
            <span className="text-sm font-medium text-gray-300">Unstake Availability:</span>
          </div>
          <span className={`text-sm font-medium ${
            stakingInfo?.amountStaked.isZero() 
              ? 'text-gray-400' 
              : showUnstakeTimer 
                ? 'text-amber-400' 
                : 'text-green-400'
          }`}>
            {stakingInfo?.amountStaked.isZero()
              ? "You have no staked tokens"
              : showUnstakeTimer 
                ? formatDuration(stakeUnlockTime)
                : "Available Now"}
          </span>
        </div>
        <div className="flex items-start mt-1 border-t border-indigo-800 border-opacity-30 pt-2">
          <p className="text-xs text-indigo-400">
            {stakingInfo?.unstakedPending.isZero()
              ? "Unstaked tokens will have a separate lockup period before they can be redeemed."
              : "You have pending unstaked tokens that can be redeemed once the lockup period ends."}
          </p>
        </div>
      </div>
      
      <div className="mt-auto pt-4">
        <div className="bg-gray-700 rounded-lg p-4 mb-4">
          <div className="flex justify-between items-center mb-1">
            <span className="text-xs text-gray-400">Amount to unstake</span>
            <button 
              className="text-xs text-indigo-400 font-medium cursor-pointer border border-indigo-700 px-2 py-0.5 rounded hover:bg-indigo-900/30"
              onClick={handleMaxUnstake}
              disabled={isUnstakeProcessing}
            >
              MAX
            </button>
          </div>
          <div className="flex items-center">
            <input
              type="text"
              placeholder="0.0"
              className="w-full bg-transparent text-gray-100 text-base font-medium focus:outline-none"
              value={unstakeAmount}
              onChange={(e) => validateAndSetUnstakeAmount(e.target.value)}
              disabled={isUnstakeProcessing}
            />
            <span className="text-gray-300 font-medium text-sm">
              {tokenSymbol}
            </span>
          </div>
          
          {/* Display warning for partial unstake */}
          {unstakeAmount &&
            unstakeAmount !== "0" &&
            unstakeValue > 0 &&
            unstakeValue < totalStaked && (
              <p className="mt-2 text-xs text-red-400">
                Note: Partial unstake will reset the unstake timer countdown.
              </p>
          )}
          
          {/* Display note about already pending unstaked tokens */}
          {!stakingInfo?.unstakedPending.isZero() && (
            <p className="mt-2 text-xs text-amber-400">
              You already have unstaked tokens pending. Unstaking more will reset the redemption timer.
            </p>
          )}
        </div>
        
        {!connected ? (
          <div className="text-white text-center font-bold text-xl">
            Please Connect Wallet
          </div>
        ) : (
          <button
            className="w-full py-3 px-4 bg-indigo-600 hover:bg-indigo-700 disabled:bg-gray-600 disabled:opacity-50 text-white font-medium rounded-lg transition-colors duration-200 ease-in-out text-sm cursor-pointer"
            onClick={handleUnstakeTokens}
            disabled={unstakeButtonDisabled}
          >
            <div className="flex items-center justify-center whitespace-nowrap">
              {loading || isUnstakeProcessing ? <IconLoader2 className="animate-spin mr-2" size={16} /> : <IconArrowDown size={16} className="mr-2" />}
              {getButtonText()}
            </div>
          </button>
        )}
      </div>
    </div>
  );
};

export default UnstakeTab;