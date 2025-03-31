import { PublicKey } from "@solana/web3.js";
import { BN } from "@project-serum/anchor";
import { StakingInfoData } from "@/lib/staking";

export interface ToastStyles {
  success: {
    style: {
      background: string;
      color: string;
    };
    iconTheme: {
      primary: string;
      secondary: string;
    };
  };
  error: {
    style: {
      background: string;
      color: string;
    };
    iconTheme: {
      primary: string;
      secondary: string;
    };
  };
  loading: {
    style: {
      background: string;
      color: string;
    };
  };
}

export interface StakingContextData {
  stakingInfo: StakingInfoData | null;
  tokenBalance: BN;
  tokenDecimals: number;
  tokenSymbol: string;
  hasStakingAccount: boolean;
  loading: boolean;
  rewardsLoading: boolean;
  stakeAmount: string;
  setStakeAmount: (amount: string) => void;
  unstakeAmount: string;
  setUnstakeAmount: (amount: string) => void;
  stakeUnlockTime: number;
  unstakeClaimableTime: number;
  vaultLamports: bigint;
  claimableRewardsBN: BN;
  formattedRewards: string;
  connected: boolean;
  publicKey: PublicKey | null;
  walletKey: string | null;
  lastFetchTime: number;
  refreshStakingData: () => Promise<void>;
  handleStakeTokens: (e: React.MouseEvent) => Promise<void>;
  handleUnstakeTokens: (e: React.MouseEvent) => Promise<void>;
  handleClaimRewards: (e: React.MouseEvent) => Promise<void>;
  handleClaimUnstaked: (e: React.MouseEvent) => Promise<void>;
  handleMaxStake: (e: React.MouseEvent) => void;
  handleMaxUnstake: (e: React.MouseEvent) => void;
  // Add transaction state properties
  isStakeProcessing: boolean;
  isUnstakeProcessing: boolean;
  isRedeemProcessing: boolean;
}