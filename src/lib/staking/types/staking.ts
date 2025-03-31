import { PublicKey } from '@solana/web3.js';
import { BN } from '@project-serum/anchor';

/**
 * Fee Vault account data
 */
export interface FeeVault {
  totalStaked: BN;
  totalRewards: BN;
  accRewardPerShare: BN;
  rewardOffset: BN; // Added this field present in the program
  lastDistributionTime: BN;
  lastStakeSlot: BN;
  currentSlotStaked: BN;
  pendingDistributionRewards: BN;
}

/**
 * Stake Info account data
 */
export interface StakeInfo {
  pubkey: PublicKey; // The address of the stake info account
  user: PublicKey;
  amountStaked: BN;
  rewardDebt: BN;
  unstakedPending: BN;
  lastStakeTime: BN;
  unstakeLockupTime: BN;
  redeemLockupTime: BN; // Added the new redemption lockup timer
}

/**
 * Computed staking information for UI display
 */
export interface StakingInfoData {
  amountStaked: BN;
  rewardDebt: BN;
  unstakedPending: BN;
  lastStakeTime: BN;
  unstakeLockupTime: BN;
  pendingRewards: BN;
  timeUntilClaimable: number;
}

/**
 * Stored stake info in browser storage
 */
export interface StoredStakeInfo {
  pubkey: string;
  user: string;
}

/**
 * Parameters for staking tokens
 */
export interface StakeParams {
  amount: BN;
  stakeInfo?: StakeInfo;
  stakeInfoPubkey?: PublicKey;
}

/**
 * Parameters for unstaking tokens
 */
export interface UnstakeParams {
  amount: BN;
  stakeInfo: StakeInfo;
}

/**
 * Parameters for claiming rewards
 */
export interface ClaimParams {
  stakeInfo: StakeInfo;
  pendingRewards: BN;
}

/**
 * Parameters for claiming unstaked tokens
 */
export interface ClaimUnstakedParams {
  stakeInfo: StakeInfo;
  unstakedPending: BN;
}

/**
 * Status of a transaction
 */
export type TransactionStatus = 'pending' | 'confirmed' | 'failed';

/**
 * Commitment levels for RPC requests
 */
export type CommitmentLevel = 'processed' | 'confirmed' | 'finalized';