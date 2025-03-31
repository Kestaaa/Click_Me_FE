// src/lib/staking/utils/rewardsCalculator.ts
import { BN } from '@project-serum/anchor';
import { StakeInfo, FeeVault } from '../types';
import { MULTIPLIER } from './constants';
import { Logger } from './logger';

/**
 * Calculate pending rewards based on stake info and fee vault data.
 * 
 * This calculation matches the smart contract's logic:
 * pendingRewards = (amountStaked * accRewardPerShare / MULTIPLIER) - rewardDebt
 * 
 * @param stakeInfo User's stake information
 * @param feeVault Global fee vault data
 * @returns Calculated pending rewards as BN
 */
export function calculatePendingRewards(stakeInfo: StakeInfo, feeVault: FeeVault): BN {
  if (!stakeInfo || !feeVault) {
    Logger.debug("Missing stake info or fee vault data for rewards calculation");
    return new BN(0);
  }

  // If no tokens are staked, there are no pending rewards
  if (stakeInfo.amountStaked.isZero()) {
    Logger.debug("No tokens staked, pending rewards = 0");
    return new BN(0);
  }

  try {
    // Calculate: (amountStaked * accRewardPerShare) / MULTIPLIER
    // Note: We're working with potentially large numbers, so we must be careful with precision
    Logger.debug("Calculating pending rewards with:", {
      amountStaked: stakeInfo.amountStaked.toString(),
      accRewardPerShare: feeVault.accRewardPerShare.toString(),
      rewardDebt: stakeInfo.rewardDebt.toString(),
      multiplier: MULTIPLIER.toString()
    });

    // Calculate accumulated rewards
    const accumulated = stakeInfo.amountStaked
      .mul(feeVault.accRewardPerShare)
      .div(new BN(MULTIPLIER));
    
    // Subtract reward debt to get pending rewards
    // If for some reason reward debt is higher (shouldn't happen in normal operation),
    // we default to zero rewards instead of negative
    const pendingRewards = accumulated.gte(stakeInfo.rewardDebt) 
      ? accumulated.sub(stakeInfo.rewardDebt)
      : new BN(0);
    
    Logger.debug("Calculated pending rewards:", {
      accumulated: accumulated.toString(),
      pendingRewards: pendingRewards.toString()
    });
    
    return pendingRewards;
  } catch (error) {
    Logger.error("Error calculating pending rewards:", error);
    return new BN(0);
  }
}

/**
 * Calculate time until unstaked tokens are claimable.
 * 
 * @param stakeInfo User's stake information
 * @returns Time in seconds until tokens can be claimed, or 0 if already claimable
 */
export function calculateTimeUntilClaimable(stakeInfo: StakeInfo): number {
  if (!stakeInfo || stakeInfo.unstakedPending.isZero()) {
    return 0;
  }

  try {
    const currentTime = Math.floor(Date.now() / 1000);
    
    // If redeem lockup time is in the future, calculate time remaining
    if (currentTime < stakeInfo.redeemLockupTime.toNumber()) {
      return stakeInfo.redeemLockupTime.toNumber() - currentTime;
    }
    
    // Otherwise, tokens are already claimable
    return 0;
  } catch (error) {
    Logger.error("Error calculating time until claimable:", error);
    return 0;
  }
}

/**
 * Comprehensive function that calculates full staking information data.
 * 
 * @param stakeInfo User's stake information
 * @param feeVault Global fee vault data
 * @returns StakingInfoData object with all calculated values
 */
export function calculateStakingInfoData(stakeInfo: StakeInfo, feeVault: FeeVault): {
  pendingRewards: BN;
  timeUntilClaimable: number;
} {
  if (!stakeInfo || !feeVault) {
    return {
      pendingRewards: new BN(0),
      timeUntilClaimable: 0
    };
  }

  const pendingRewards = calculatePendingRewards(stakeInfo, feeVault);
  const timeUntilClaimable = calculateTimeUntilClaimable(stakeInfo);

  return {
    pendingRewards,
    timeUntilClaimable
  };
}