import { PublicKey } from "@solana/web3.js";
import { BN } from "@project-serum/anchor";

// Game state structure - updated with new fields
export interface GameStateView {
  startingTime: BN;
  endgameTime: BN;
  lastClicker: PublicKey;
  vaultBalance: BN;
  // New fields for progressive click costs
  currentClickAmount: BN;
  clickCount: BN;
}

// Configuration structure - updated with initialized flag
export interface Config {
  devWallet: PublicKey;
  stakingProgram: PublicKey | null;
  initialized?: boolean;  // Added flag to check if config is properly initialized
}

// Game metrics structure - updated to store a fixed-size list of recent clickers
export interface GameMetricsView {
  totalGames: BN;
  totalClicksAllTime: BN;
  totalSolSpentAllTime: BN;
  currentGameId: BN;
  currentGameClicks: BN;
  recentClickers: PublicKey[];
}

// Leaderboard entry structure
export interface LeaderboardEntry {
  contributor: PublicKey;
  amount: BN; // This remains a placeholder (always 0) as individual contributions aren't tracked.
}

// Full leaderboard structure
export interface LeaderboardView {
  gameCycle: BN;
  entries: LeaderboardEntry[];
  count: number;
}

// Player contribution structure - now simply checks for presence in recent clickers.
export interface PlayerContributionView {
  contributor: PublicKey;
  amount: BN;
  gameCycle: BN;
}

// Game statistics structure
export interface GameStats {
  gameId: BN;
  totalClicks: BN;
  totalContributors: BN;
  totalSolContributed: BN;
}

// NEW: Staking info data structure for on-chain computed staking values.
export interface StakingInfoData {
  amountStaked: BN;
  rewardDebt: BN;
  unstakedPending: BN;
  lastStakeTime: BN;
  unstakeLockupTime: BN;
  pendingRewards: BN;
  // timeUntilClaimable is computed on-chain (via a getter instruction)
  // and represents the remaining seconds until unstaked tokens are claimable.
  timeUntilClaimable: number;
}