'use client';

import { useState, useEffect, useMemo, useRef, useCallback } from "react";
import { useWallet, useConnection } from "@solana/wallet-adapter-react";
import { AnchorProvider, BN } from "@project-serum/anchor";
import toast from "react-hot-toast";
import {
  formatTokenAmount,
  parseTokenAmount,
  formatStakeAmountForInput,
} from "@/lib/utils";
import { StakingClient, StakingInfoData } from "@/lib/staking";
import { PublicKey } from "@solana/web3.js";
import { getAssociatedTokenAddress, getMint } from "@solana/spl-token";
import { ToastStyles } from "../types";
import { FEE_VAULT_PDA, TOKEN_MINT, STAKING_PROGRAM_ID, MULTIPLIER } from "@/lib/staking/utils/constants";
import { StakeInfo, FeeVault } from "@/lib/staking/types";
import { calculatePendingRewards, calculateTimeUntilClaimable, calculateStakingInfoData } from "@/lib/staking/utils/rewardsCalculator";
import { formatSolAmount, formatDuration } from "@/lib/staking/utils/formatter";
import { IS_TOKEN_LIVE } from "@/config"; // Import the token flag

// Toast styles configuration
const toastStyles: ToastStyles = {
  success: {
    style: { background: "#34d399", color: "white" },
    iconTheme: { primary: "white", secondary: "#34d399" },
  },
  error: {
    style: { background: "#f87171", color: "white" },
    iconTheme: { primary: "white", secondary: "#f87171" },
  },
  loading: {
    style: { background: "#60a5fa", color: "white" },
  },
};

// Time constants - modified to reduce RPC calls but keep smooth UI
const TRANSACTION_REFRESH_DELAY = 10000; // 10 seconds after transaction
const LOCAL_TIMER_INTERVAL = 1000; // Update UI timers every second
const REWARDS_UPDATE_INTERVAL = 60000; // Calculate rewards every minute

// Lockup periods in seconds
const UNSTAKE_LOCKUP_PERIOD = 7 * 24 * 60 * 60; // 7 days
const REDEEM_LOCKUP_PERIOD = 7 * 24 * 60 * 60; // 7 days

export const useStakingData = () => {
  const { publicKey, connected, signTransaction, signAllTransactions } = useWallet();
  const { connection } = useConnection();

  // Loading states and data
  const [loading, setLoading] = useState(false);
  const [rewardsLoading, setRewardsLoading] = useState(false);
  const [stakingInfo, setStakingInfo] = useState<StakingInfoData | null>(null);
  const [rawStakeInfo, setRawStakeInfo] = useState<StakeInfo | null>(null);
  const [rawFeeVault, setRawFeeVault] = useState<FeeVault | null>(null);
  const [tokenBalance, setTokenBalance] = useState<BN>(new BN(0));
  const [tokenDecimals, setTokenDecimals] = useState<number>(6);
  const [tokenSymbol, setTokenSymbol] = useState("TOKEN");
  const [hasStakingAccount, setHasStakingAccount] = useState(false);
  const [vaultLamports, setVaultLamports] = useState<bigint>(BigInt(0));
  const [stakeAmount, setStakeAmount] = useState("");
  const [unstakeAmount, setUnstakeAmount] = useState("");
  const [stakeUnlockTime, setStakeUnlockTime] = useState<number>(0);
  const [unstakeClaimableTime, setUnstakeClaimableTime] = useState<number>(0);
  const [lastFetchTime, setLastFetchTime] = useState<number>(0);
  const [walletKey, setWalletKey] = useState<string | null>(null);
  
  // Track transaction states for optimistic UI updates
  const [isStakeProcessing, setIsStakeProcessing] = useState(false);
  const [isUnstakeProcessing, setIsUnstakeProcessing] = useState(false);
  const [isRedeemProcessing, setIsRedeemProcessing] = useState(false);

  // Refs for timers and client/state management
  const timerIntervalRef = useRef<NodeJS.Timeout | null>(null);
  const refreshTimeoutRef = useRef<NodeJS.Timeout | null>(null);
  const lastRewardsUpdateRef = useRef<number>(0);
  
  const stakingClient = useMemo(() => {
    if (!IS_TOKEN_LIVE) {
      return null;
    }
    
    if (!publicKey || !signTransaction || !signAllTransactions) return null;
    try {
      const wrappedWallet = { publicKey, signTransaction, signAllTransactions };
      const provider = new AnchorProvider(connection, wrappedWallet, {
        commitment: "confirmed",
        preflightCommitment: "confirmed",
      });
      const client = new StakingClient(provider);
      console.log("StakingClient initialized with program ID:", STAKING_PROGRAM_ID.toString());
      return client;
    } catch (error) {
      console.error("Error creating StakingClient:", error);
      return null;
    }
  }, [connection, publicKey, signTransaction, signAllTransactions]);

  // Cleanup timers and client resources on unmount.
  useEffect(() => {
    return () => {
      if (timerIntervalRef.current) clearInterval(timerIntervalRef.current);
      if (refreshTimeoutRef.current) clearTimeout(refreshTimeoutRef.current);
      // Assume the StakingClient handles its own cleanup.
    };
  }, []);

  // Reset state when the wallet changes.
  useEffect(() => {
    if (!IS_TOKEN_LIVE) {
      return;
    }
    
    if (publicKey) {
      const newWalletKey = publicKey.toString();
      if (walletKey !== newWalletKey) {
        console.log("Wallet changed: resetting staking data for wallet", newWalletKey);
        setWalletKey(newWalletKey);
        if (stakingClient) {
          stakingClient.invalidateCache();
        }
        setHasStakingAccount(false);
        setStakingInfo(null);
        setRawStakeInfo(null);
        setRawFeeVault(null);
        setStakeUnlockTime(0);
        setUnstakeClaimableTime(0);
        setTokenBalance(new BN(0));
        fetchInitialData();
      }
    } else {
      setWalletKey(null);
      setHasStakingAccount(false);
      setStakingInfo(null);
      setRawStakeInfo(null);
      setRawFeeVault(null);
      setStakeUnlockTime(0);
      setUnstakeClaimableTime(0);
      setTokenBalance(new BN(0));
    }
  }, [publicKey, walletKey, stakingClient]);

  // Optimized updateClientSideRewards function to skip unnecessary calculations
  const updateClientSideRewards = useCallback(() => {
    if (!IS_TOKEN_LIVE) {
      return;
    }
    
    if (!rawStakeInfo || !rawFeeVault || !stakingInfo) return;
    
    // Skip rewards calculation if no tokens are staked and no unstaked pending
    if (rawStakeInfo.amountStaked.isZero() && rawStakeInfo.unstakedPending.isZero()) {
      return;
    }
    
    try {
      const pendingRewards = calculatePendingRewards(rawStakeInfo, rawFeeVault);
      const timeUntilClaimable = calculateTimeUntilClaimable(rawStakeInfo);
      setStakingInfo(prev => prev ? { ...prev, pendingRewards, timeUntilClaimable } : null);
      
      // Don't override the UI timer if we're in the middle of a transaction
      if (!isRedeemProcessing) {
        setUnstakeClaimableTime(timeUntilClaimable);
      }
    } catch (error) {
      console.error("Error updating client-side rewards:", error);
    }
  }, [rawStakeInfo, rawFeeVault, stakingInfo, isRedeemProcessing]);

  // Local timer for updating UI timers - optimized to reduce updates frequency
  useEffect(() => {
    if (!IS_TOKEN_LIVE) {
      return;
    }
    
    if (!connected || !stakingInfo) return;
    const interval = setInterval(() => {
      // Only decrement unstake timer if we're not in the middle of processing a stake
      if (!isStakeProcessing) {
        setStakeUnlockTime(prev => Math.max(0, prev - 1));
      }
      
      // Only decrement redeem timer if we're not in the middle of processing a transaction
      if (!isUnstakeProcessing && !isRedeemProcessing) {
        setUnstakeClaimableTime(prev => Math.max(0, prev - 1));
      }
      
      const now = Date.now();
      
      // Only update rewards if it's been long enough AND user has staked or unstaked tokens
      if (rawStakeInfo && 
          rawFeeVault && 
          now - lastRewardsUpdateRef.current >= REWARDS_UPDATE_INTERVAL &&
          (!rawStakeInfo.amountStaked.isZero() || !rawStakeInfo.unstakedPending.isZero())) {
        lastRewardsUpdateRef.current = now;
        updateClientSideRewards();
      }
    }, LOCAL_TIMER_INTERVAL);
    
    timerIntervalRef.current = interval;
    return () => clearInterval(interval);
  }, [connected, stakingInfo, rawStakeInfo, rawFeeVault, updateClientSideRewards, isStakeProcessing, isUnstakeProcessing, isRedeemProcessing]);

  // Fetch token decimals.
  const fetchTokenDecimals = useCallback(async () => {
    if (!IS_TOKEN_LIVE) {
      return;
    }
    
    try {
      const mintInfo = await getMint(connection, TOKEN_MINT);
      setTokenDecimals(mintInfo.decimals);
      setTokenSymbol("CLICKME");
    } catch (error) {
      console.error("Error fetching token decimals:", error);
    }
  }, [connection]);

  // Fetch token balance.
  const fetchTokenBalance = useCallback(async () => {
    if (!IS_TOKEN_LIVE) {
      return;
    }
    
    if (!publicKey) return;
    try {
      const tokenAddress = await getAssociatedTokenAddress(TOKEN_MINT, publicKey);
      const accountInfo = await connection.getAccountInfo(tokenAddress);
      if (accountInfo) {
        const tokenAccount = await connection.getTokenAccountBalance(tokenAddress);
        setTokenBalance(new BN(tokenAccount.value.amount));
      } else {
        setTokenBalance(new BN(0));
      }
    } catch (error) {
      console.error("Error fetching token balance:", error);
      setTokenBalance(new BN(0));
    }
  }, [connection, publicKey]);

  // Fetch fee vault balance.
  const fetchFeeVaultBalance = useCallback(async (): Promise<bigint> => {
    if (!IS_TOKEN_LIVE) {
      return BigInt(0);
    }
    
    try {
      const vaultInfo = await connection.getAccountInfo(FEE_VAULT_PDA);
      return vaultInfo ? BigInt(vaultInfo.lamports) : BigInt(0);
    } catch (error) {
      console.error("Error fetching fee vault balance:", error);
      return BigInt(0);
    }
  }, [connection]);

  // Fetch staking info and update timers.
  const fetchStakingInfo = useCallback(async (forceRefresh = false) => {
    if (!IS_TOKEN_LIVE) {
      return;
    }
    
    if (!stakingClient || !publicKey) return;
    try {
      console.log(`Fetching staking info with forceRefresh=${forceRefresh}`);
      const stakeInfo = await stakingClient.getStakeInfo(forceRefresh);
      if (stakeInfo) setRawStakeInfo(stakeInfo);
      const feeVault = await stakingClient.getFeeVault(forceRefresh);
      if (feeVault) setRawFeeVault(feeVault);
      if (stakeInfo && feeVault) {
        const { pendingRewards, timeUntilClaimable } = calculateStakingInfoData(stakeInfo, feeVault);
        const stakingInfoData: StakingInfoData = {
          amountStaked: stakeInfo.amountStaked,
          rewardDebt: stakeInfo.rewardDebt,
          unstakedPending: stakeInfo.unstakedPending,
          lastStakeTime: stakeInfo.lastStakeTime,
          unstakeLockupTime: stakeInfo.unstakeLockupTime,
          pendingRewards,
          timeUntilClaimable,
        };
        console.log("Calculated staking info data:", {
          amountStaked: stakingInfoData.amountStaked.toString(),
          unstakedPending: stakingInfoData.unstakedPending.toString(),
          pendingRewards: stakingInfoData.pendingRewards.toString(),
          timeUntilClaimable: stakingInfoData.timeUntilClaimable,
        });
        setHasStakingAccount(true);
        setStakingInfo(stakingInfoData);
        
        // Only update UI timers if we're not in the middle of a transaction
        const now = Math.floor(Date.now() / 1000);
        
        if (!isStakeProcessing && stakingInfoData.unstakeLockupTime && !stakingInfoData.amountStaked.isZero()) {
          const unstakeTimestamp = Number(stakingInfoData.unstakeLockupTime);
          setStakeUnlockTime(Math.max(0, unstakeTimestamp - now));
        } else if (isStakeProcessing) {
          // Keep the optimistic UI timer
        } else {
          setStakeUnlockTime(0);
        }
        
        if (!isUnstakeProcessing && !isRedeemProcessing) {
          setUnstakeClaimableTime(stakingInfoData.timeUntilClaimable);
        }
        
        lastRewardsUpdateRef.current = Date.now();
      } else {
        console.log("No staking account or fee vault data found");
        setHasStakingAccount(false);
        setStakingInfo(null);
        
        // Only reset timers if we're not in the middle of a transaction
        if (!isStakeProcessing) {
          setStakeUnlockTime(0);
        }
        if (!isUnstakeProcessing && !isRedeemProcessing) {
          setUnstakeClaimableTime(0);
        }
      }
    } catch (error) {
      console.error("Error fetching staking info:", error);
      setHasStakingAccount(false);
      setStakingInfo(null);
      
      // Only reset timers if we're not in the middle of a transaction
      if (!isStakeProcessing) {
        setStakeUnlockTime(0);
      }
      if (!isUnstakeProcessing && !isRedeemProcessing) {
        setUnstakeClaimableTime(0);
      }
    }
  }, [stakingClient, publicKey, isStakeProcessing, isUnstakeProcessing, isRedeemProcessing]);

  // Optimized initial data load - removed the second fetch attempt
  const fetchInitialData = useCallback(async () => {
    if (!IS_TOKEN_LIVE) {
      console.log("Token is not live. Skipping initial data fetch.");
      return;
    }
    
    if (!stakingClient || !publicKey) return;
    setLoading(true);
    try {
      console.log("Performing initial data refresh...");
      
      // Parallelize initial data fetching
      const [_, __, stakeInfoResult, vaultBalance] = await Promise.all([
        fetchTokenDecimals(),
        fetchTokenBalance(),
        fetchStakingInfo(true),
        fetchFeeVaultBalance()
      ]);
      
      setVaultLamports(vaultBalance);
      setLastFetchTime(Math.floor(Date.now() / 1000));
    } catch (error) {
      console.error("Error during initial data fetch:", error);
      toast.error("Failed to load staking data", toastStyles.error);
    } finally {
      setLoading(false);
    }
  }, [stakingClient, publicKey, fetchTokenDecimals, fetchTokenBalance, fetchStakingInfo, fetchFeeVaultBalance]);

  // Optimized refreshAfterTransaction to use a single Promise.all
  const refreshAfterTransaction = useCallback(async () => {
    if (!IS_TOKEN_LIVE) {
      return;
    }
    
    if (!stakingClient) return;
    try {
      console.log("Refreshing data after transaction...");
      await new Promise(resolve => setTimeout(resolve, TRANSACTION_REFRESH_DELAY));
      
      // Bundle related RPC calls in parallel
      const [_, __, vaultBalance] = await Promise.all([
        fetchStakingInfo(true),
        fetchTokenBalance(),
        fetchFeeVaultBalance()
      ]);
      
      setVaultLamports(vaultBalance);
      setLastFetchTime(Math.floor(Date.now() / 1000));
    } catch (error) {
      console.error("Error refreshing data after transaction:", error);
    }
  }, [stakingClient, fetchStakingInfo, fetchTokenBalance, fetchFeeVaultBalance]);

  // Manual refresh function - more aggressive about clearing caches
  const refreshStakingData = useCallback(async () => {
    if (!IS_TOKEN_LIVE) {
      console.log("Token is not live. Skipping data refresh.");
      return;
    }
    
    if (!stakingClient) return;
    setLoading(true);
    try {
      console.log("Forcefully refreshing all staking data...");
      stakingClient.invalidateCache(); // Clear all cached data first
      
      // Add a small delay to ensure any in-progress operations complete
      await new Promise(resolve => setTimeout(resolve, 100));
      
      // Bundle related RPC calls in parallel
      const [_, __, vaultBalance] = await Promise.all([
        fetchStakingInfo(true),
        fetchTokenBalance(),
        fetchFeeVaultBalance()
      ]);
      
      setVaultLamports(vaultBalance);
      setLastFetchTime(Math.floor(Date.now() / 1000));
      
      // If we're still not finding the account, log more details
      if (!stakingInfo) {
        console.error("Still not finding staking account despite forced refresh.");
        console.log("Current wallet address:", publicKey?.toString());
        console.log("Looking for account with key from logs:", "AUz9CS7qPNs1A2LtqXsRvraSoJMWZACjnfMwyBSnvJa7");
      } else {
        toast.success("Data refreshed", { duration: 2000 });
      }
    } catch (error) {
      console.error("Error refreshing staking data:", error);
      toast.error("Failed to refresh data", toastStyles.error);
    } finally {
      setLoading(false);
    }
  }, [stakingClient, fetchStakingInfo, fetchTokenBalance, fetchFeeVaultBalance, publicKey, stakingInfo]);

  // Compute claimable rewards with safety checks.
  let claimableRewardsBN = new BN(0);
  if (rawStakeInfo && rawFeeVault) {
    const pendingRewards = calculatePendingRewards(rawStakeInfo, rawFeeVault);
    const computedRewards = BigInt(pendingRewards.toString());
    const tolerance = BigInt(50);
    if (computedRewards > vaultLamports && (computedRewards - vaultLamports) > tolerance) {
      claimableRewardsBN = new BN(vaultLamports.toString());
    } else {
      claimableRewardsBN = pendingRewards;
    }
  } else if (stakingInfo) {
    const computedRewards = BigInt(stakingInfo.pendingRewards.toString());
    const tolerance = BigInt(50);
    if (computedRewards > vaultLamports && (computedRewards - vaultLamports) > tolerance) {
      claimableRewardsBN = new BN(vaultLamports.toString());
    } else {
      claimableRewardsBN = stakingInfo.pendingRewards;
    }
  }

  const formattedRewards = useMemo(() => {
    if (claimableRewardsBN.isZero()) return "0";
    return formatSolAmount(claimableRewardsBN);
  }, [claimableRewardsBN]);

  return {
    stakingInfo,
    tokenBalance,
    tokenDecimals,
    tokenSymbol,
    hasStakingAccount,
    loading,
    rewardsLoading,
    stakeAmount,
    setStakeAmount,
    unstakeAmount,
    setUnstakeAmount,
    stakeUnlockTime,
    unstakeClaimableTime,
    vaultLamports,
    claimableRewardsBN,
    formattedRewards,
    connected,
    publicKey,
    walletKey,
    lastFetchTime,
    refreshStakingData,
    // Transaction states for the UI
    isStakeProcessing,
    isUnstakeProcessing,
    isRedeemProcessing,
    handleStakeTokens: async (e: React.MouseEvent) => {
      e.preventDefault();
      if (!IS_TOKEN_LIVE) {
        toast.error("Token staking is not yet available", toastStyles.error);
        return;
      }
      
      if (!stakingClient || !stakeAmount) return;
      setLoading(true);
      setIsStakeProcessing(true);
      
      try {
        const amount = parseTokenAmount(stakeAmount, tokenDecimals);
        
        // Apply immediate optimistic UI updates
        const currentTime = Math.floor(Date.now() / 1000);
        
        if (rawStakeInfo && rawFeeVault) {
          // Update local state for optimistic UI
          const updatedRawStakeInfo = {
            ...rawStakeInfo,
            amountStaked: rawStakeInfo.amountStaked.add(amount),
            rewardDebt: rawStakeInfo.amountStaked.add(amount)
              .mul(rawFeeVault.accRewardPerShare)
              .div(new BN(MULTIPLIER)),
            // Set unstake lockup time to now + 7 days
            unstakeLockupTime: new BN(currentTime + UNSTAKE_LOCKUP_PERIOD)
          };
          
          setRawStakeInfo(updatedRawStakeInfo);
          
          // Update stake unlock time immediately for UI
          setStakeUnlockTime(UNSTAKE_LOCKUP_PERIOD);
          
          if (stakingInfo) {
            const { pendingRewards, timeUntilClaimable } = calculateStakingInfoData(updatedRawStakeInfo, rawFeeVault);
            setStakingInfo({
              ...stakingInfo,
              amountStaked: updatedRawStakeInfo.amountStaked,
              rewardDebt: updatedRawStakeInfo.rewardDebt,
              unstakeLockupTime: updatedRawStakeInfo.unstakeLockupTime,
              pendingRewards,
              timeUntilClaimable
            });
          }
        } else {
          // First time staking, create optimistic stake info
          const zeroAmount = new BN(0);
          const newStakeInfo = {
            pubkey: new PublicKey("11111111111111111111111111111111"),
            user: publicKey!,
            amountStaked: amount,
            rewardDebt: zeroAmount,
            unstakedPending: zeroAmount,
            lastStakeTime: new BN(currentTime),
            unstakeLockupTime: new BN(currentTime + UNSTAKE_LOCKUP_PERIOD),
            redeemLockupTime: zeroAmount
          };
          
          setRawStakeInfo(newStakeInfo);
          setStakeUnlockTime(UNSTAKE_LOCKUP_PERIOD);
          setHasStakingAccount(true);
        }
        
        // Execute the actual transaction
        await stakingClient.stakeTokens(amount);
        
        toast.success("Tokens staked successfully!", { id: "transaction", ...toastStyles.success });
        setStakeAmount("");
        
        // Refresh data after transaction
        refreshAfterTransaction();
      } catch (error: any) {
        console.error("Error staking tokens:", error);
        toast.error(error.message || "Failed to stake tokens", { id: "transaction", ...toastStyles.error });
        
        // Revert optimistic updates and refresh data
        refreshStakingData();
      } finally {
        setLoading(false);
        
        // Allow UI to show the timer for a moment before clearing the processing state
        setTimeout(() => {
          setIsStakeProcessing(false);
        }, 500);
      }
    },
    handleUnstakeTokens: async (e: React.MouseEvent) => {
      e.preventDefault();
      e.stopPropagation();
      if (!IS_TOKEN_LIVE) {
        toast.error("Token unstaking is not yet available", toastStyles.error);
        return;
      }
      
      if (!stakingClient || !unstakeAmount) return;
      
      // Check if we're in lockup period
      if (stakeUnlockTime > 0 && !isStakeProcessing) {
        toast.error(`Cannot unstake yet. Available in ${formatDuration(stakeUnlockTime)}`, toastStyles.error);
        return;
      }
      
      setLoading(true);
      setIsUnstakeProcessing(true);
      
      try {
        const amount = parseTokenAmount(unstakeAmount, tokenDecimals);
        const currentTime = Math.floor(Date.now() / 1000);
        
        if (rawStakeInfo && rawFeeVault) {
          // Calculate pending rewards before updating state
          const pendingRewards = calculatePendingRewards(rawStakeInfo, rawFeeVault);
          
          // Apply immediate optimistic UI updates
          const updatedRawStakeInfo = {
            ...rawStakeInfo,
            amountStaked: rawStakeInfo.amountStaked.sub(amount),
            unstakedPending: rawStakeInfo.unstakedPending.add(amount),
            rewardDebt: rawStakeInfo.amountStaked.sub(amount)
              .mul(rawFeeVault.accRewardPerShare)
              .div(new BN(MULTIPLIER)),
            // Set redeem lockup time to now + redeem period
            redeemLockupTime: new BN(currentTime + REDEEM_LOCKUP_PERIOD)
          };
          
          setRawStakeInfo(updatedRawStakeInfo);
          
          // Update redeem timer immediately for UI
          setUnstakeClaimableTime(REDEEM_LOCKUP_PERIOD);
          
          if (stakingInfo) {
            setStakingInfo({
              ...stakingInfo,
              amountStaked: updatedRawStakeInfo.amountStaked,
              unstakedPending: updatedRawStakeInfo.unstakedPending,
              rewardDebt: updatedRawStakeInfo.rewardDebt,
              pendingRewards,
              timeUntilClaimable: REDEEM_LOCKUP_PERIOD
            });
          }
        }
        
        // Execute the actual transaction
        await stakingClient.unstakeTokens(amount);
        
        toast.success("Tokens unstaked successfully!", { id: "transaction", ...toastStyles.success });
        setUnstakeAmount("");
        
        // Refresh data after transaction
        refreshAfterTransaction();
      } catch (error: any) {
        console.error("Error unstaking tokens:", error);
        toast.error(error.message || "Failed to unstake tokens", { id: "transaction", ...toastStyles.error });
        
        // Revert optimistic updates and refresh data
        refreshStakingData();
      } finally {
        setLoading(false);
        
        // Allow UI to show the timer for a moment before clearing the processing state
        setTimeout(() => {
          setIsUnstakeProcessing(false);
        }, 500);
      }
    },
    handleClaimRewards: async (e: React.MouseEvent) => {
      e.preventDefault();
      if (!IS_TOKEN_LIVE) {
        toast.error("Token rewards are not yet available", toastStyles.error);
        return;
      }
      
      if (!stakingClient) return;
      setRewardsLoading(true);
      try {
        if (rawStakeInfo && rawFeeVault) {
          const pendingRewards = calculatePendingRewards(rawStakeInfo, rawFeeVault);
          const updatedRawStakeInfo = {
            ...rawStakeInfo,
            rewardDebt: rawStakeInfo.amountStaked
              .mul(rawFeeVault.accRewardPerShare)
              .div(new BN(MULTIPLIER))
          };
          setRawStakeInfo(updatedRawStakeInfo);
          if (stakingInfo) {
            setStakingInfo({
              ...stakingInfo,
              rewardDebt: updatedRawStakeInfo.rewardDebt,
              pendingRewards: new BN(0)
            });
          }
        }
        await stakingClient.claimRewards();
        toast.success("Rewards claimed!", { id: "transaction", ...toastStyles.success });
        refreshAfterTransaction();
      } catch (error: any) {
        console.error("Error claiming rewards:", error);
        toast.error(error.message || "Failed to claim rewards", { id: "transaction", ...toastStyles.error });
        refreshStakingData();
      } finally {
        setRewardsLoading(false);
      }
    },
    handleClaimUnstaked: async (e: React.MouseEvent) => {
      e.preventDefault();
      if (!IS_TOKEN_LIVE) {
        toast.error("Token redemption is not yet available", toastStyles.error);
        return;
      }
      
      if (!stakingClient) return;
      
      // Check if we're in redeem lockup period
      if (unstakeClaimableTime > 0 && !isUnstakeProcessing) {
        toast.error(`Cannot redeem yet. Available in ${formatDuration(unstakeClaimableTime)}`, toastStyles.error);
        return;
      }
      
      setLoading(true);
      setIsRedeemProcessing(true);
      
      try {
        // Apply immediate optimistic UI update
        if (rawStakeInfo) {
          const updatedRawStakeInfo = { 
            ...rawStakeInfo, 
            unstakedPending: new BN(0) 
          };
          setRawStakeInfo(updatedRawStakeInfo);
          if (stakingInfo) {
            setStakingInfo({ 
              ...stakingInfo, 
              unstakedPending: new BN(0) 
            });
          }
        }
        
        // Execute the actual transaction
        await stakingClient.claimUnstaked();
        
        toast.success("Unstaked tokens claimed!", { id: "transaction", ...toastStyles.success });
        
        // Refresh data after transaction
        refreshAfterTransaction();
      } catch (error: any) {
        console.error("Error claiming unstaked tokens:", error);
        toast.error(error.message || "Failed to claim unstaked tokens", { id: "transaction", ...toastStyles.error });
        
        // Revert optimistic updates and refresh data
        refreshStakingData();
      } finally {
        setLoading(false);
        
        // Allow UI to show the update for a moment before clearing the processing state
        setTimeout(() => {
          setIsRedeemProcessing(false);
        }, 500);
      }
    },
    handleMaxStake: (e: React.MouseEvent) => {
      e.preventDefault();
      if (!IS_TOKEN_LIVE) {
        return;
      }
      
      if (tokenBalance && !tokenBalance.isZero()) {
        const formatted = formatStakeAmountForInput(tokenBalance, tokenDecimals);
        setStakeAmount(formatted);
      }
    },
    handleMaxUnstake: (e: React.MouseEvent) => {
      e.preventDefault();
      if (!IS_TOKEN_LIVE) {
        return;
      }
      
      if (stakingInfo && !stakingInfo.amountStaked.isZero()) {
        const formatted = formatStakeAmountForInput(stakingInfo.amountStaked, tokenDecimals);
        setUnstakeAmount(formatted);
      }
    },
  };
};

export default useStakingData;