import { Connection, Keypair, PublicKey } from '@solana/web3.js';
import { BN, AnchorProvider } from '@project-serum/anchor';
import { StakeInfo, StakingInfoData, FeeVault } from './types';
import { FEE_VAULT_PDA, COMMITMENT_LEVELS, MULTIPLIER } from '@/lib/staking/utils/constants';
import { AccountService } from './services/AccountService';
import { TransactionService } from './services/TransactionService';
import { StateManager } from './services/StateManager';
import { StorageService } from './services/StorageService';
import { STAKING_PROGRAM_ID } from '@/config';
import { calculateStakingInfoData, calculatePendingRewards } from './utils/rewardsCalculator';

/**
 * Optimized StakingClient with RPC efficiency improvements
 */
export class StakingClient {
  private provider: AnchorProvider;
  private connection: Connection;
  private wallet: any;
  
  // Underlying services
  private accountService: AccountService;
  private transactionService: TransactionService;
  private stateManager: StateManager;
  private storageService: StorageService;
  
  // Transaction refresh delay
  private readonly TRANSACTION_CONFIRMATION_WAIT = 10000;

  constructor(provider: AnchorProvider) {
    this.provider = provider;
    this.connection = provider.connection;
    this.wallet = provider.wallet;
    
    // Initialize services
    this.storageService = new StorageService();
    this.stateManager = new StateManager();
    this.accountService = new AccountService(
      this.connection, 
      this.storageService,
      this.stateManager
    );
    this.transactionService = new TransactionService(
      this.connection,
      this.wallet
    );
    
    // Attempt to load persisted stake info if available
    if (this.wallet && this.wallet.publicKey) {
      this.accountService.loadPersistedStakeInfo(this.wallet.publicKey.toString());
    }
  }

  /**
   * Invalidate all cached staking data
   */
  public invalidateCache(): void {
    this.stateManager.invalidateAll();
  }
  
  /**
   * Retrieve the user's StakeInfo directly
   */
  async getStakeInfo(forceRefresh: boolean = false): Promise<StakeInfo | null> {
    if (!this.wallet || !this.wallet.publicKey) {
      return null;
    }
    
    if (forceRefresh) {
      this.stateManager.invalidateStakeInfo();
    } else {
      const cachedInfo = this.stateManager.getStakeInfoDirect();
      if (cachedInfo) {
        return cachedInfo;
      }
    }
    
    const stakeInfo = await this.stateManager.getStakeInfo(
      () => this.accountService.findStakeInfoAccount(this.wallet.publicKey),
      this.wallet.publicKey.toString()
    );
    
    return stakeInfo;
  }
  
  /**
   * Retrieve FeeVault data
   */
  async getFeeVault(forceRefresh: boolean = false): Promise<FeeVault | null> {
    if (forceRefresh) {
      this.stateManager.invalidateFeeVault();
    } else {
      const cachedVault = this.stateManager.getFeeVaultDirect();
      if (cachedVault) {
        return cachedVault;
      }
    }
    
    const feeVault = await this.stateManager.getFeeVault(async () => {
      try {
        const accountInfo = await this.connection.getAccountInfo(
          FEE_VAULT_PDA,
          COMMITMENT_LEVELS.READ
        );
        if (!accountInfo) return null;
        const data = accountInfo.data.slice(8);
        return {
          totalStaked: new BN(data.slice(0, 8), "le"),
          totalRewards: new BN(data.slice(8, 16), "le"),
          accRewardPerShare: new BN(data.slice(16, 24), "le"),
          rewardOffset: new BN(data.slice(24, 32), "le"),
          lastDistributionTime: new BN(data.slice(32, 40), "le"),
          lastStakeSlot: new BN(data.slice(40, 48), "le"),
          currentSlotStaked: new BN(data.slice(48, 56), "le"),
          pendingDistributionRewards: new BN(data.slice(56, 64), "le")
        };
      } catch (error) {
        return null;
      }
    });
    
    return feeVault;
  }
  
  /**
   * Compute staking info including pending rewards and time until claimable
   */
  async getStakingInfo(forceRefresh: boolean = false): Promise<StakingInfoData | null> {
    try {
      const [stakeInfo, feeVault] = await Promise.all([
        this.getStakeInfo(forceRefresh),
        this.getFeeVault(forceRefresh)
      ]);
      
      if (!stakeInfo || !feeVault) {
        return null;
      }
      
      const { pendingRewards, timeUntilClaimable } = calculateStakingInfoData(stakeInfo, feeVault);
      
      const result: StakingInfoData = {
        amountStaked: stakeInfo.amountStaked,
        rewardDebt: stakeInfo.rewardDebt,
        unstakedPending: stakeInfo.unstakedPending,
        lastStakeTime: stakeInfo.lastStakeTime,
        unstakeLockupTime: stakeInfo.unstakeLockupTime,
        pendingRewards,
        timeUntilClaimable,
      };
      
      return result;
    } catch (error) {
      return null;
    }
  }
  
  /**
   * Initialize the stake info account
   */
  async initializeStakeInfo(): Promise<string> {
    this.stateManager.invalidateStakeInfo();
    try {
      const stakeInfoKeypair = this.accountService.generateStakeInfoKeypair();
      const tx = this.transactionService.buildInitializeStakeInfoTransaction(stakeInfoKeypair);
      const signature = await this.transactionService.signTransactionWithMultipleSigners(
        tx,
        [stakeInfoKeypair]
      );
      await new Promise(resolve => setTimeout(resolve, this.TRANSACTION_CONFIRMATION_WAIT));
      
      // Single refresh after initialization
      await this.getStakeInfo(true);
      return signature;
    } catch (error) {
      throw error;
    }
  }
  
  /**
   * Stake tokens into the contract
   */
  async stakeTokens(amount: BN): Promise<string> {
    this.stateManager.invalidateAll();
    
    if (!this.wallet || !this.wallet.publicKey) {
      throw new Error("Wallet not connected");
    }
    
    try {
      let stakeInfo = await this.getStakeInfo();
      let stakeInfoPubkey: PublicKey | undefined;
      
      if (!stakeInfo) {
        const stakeInfoKeypair = this.accountService.generateStakeInfoKeypair();
        stakeInfoPubkey = stakeInfoKeypair.publicKey;
        const initTx = this.transactionService.buildInitializeStakeInfoTransaction(stakeInfoKeypair);
        await this.transactionService.signTransactionWithMultipleSigners(initTx, [stakeInfoKeypair]);
        await new Promise(resolve => setTimeout(resolve, this.TRANSACTION_CONFIRMATION_WAIT));
        stakeInfo = await this.getStakeInfo(true);
      }
      
      if (stakeInfo) {
        this.stateManager.backupStakeInfoState(stakeInfo);
      }
      if (!stakeInfo && !stakeInfoPubkey) {
        throw new Error("Failed to create or find stake info account");
      }
      
      const finalStakeInfoPubkey = (stakeInfo?.pubkey || stakeInfoPubkey)!;
      const tx = await this.transactionService.buildStakeTransaction({
        amount,
        stakeInfo: stakeInfo || undefined,
        stakeInfoPubkey: finalStakeInfoPubkey
      });
      
      if (stakeInfo) {
        const updatedStakeInfo = {
          ...stakeInfo,
          amountStaked: stakeInfo.amountStaked.add(amount)
        };
        this.stateManager.setStakeInfo(updatedStakeInfo);
      }
      
      try {
        const signature = await this.transactionService.sendTransaction(tx);
        await new Promise(resolve => setTimeout(resolve, this.TRANSACTION_CONFIRMATION_WAIT));
        
        // Refresh both stake info and fee vault in parallel
        this.stateManager.invalidateAll();
        await Promise.all([
          this.getStakeInfo(true),
          this.getFeeVault(true)
        ]);
        
        return signature;
      } catch (txError) {
        const restored = this.stateManager.restoreStakeInfoState();
        if (!restored) this.stateManager.invalidateStakeInfo();
        throw txError;
      }
    } catch (error) {
      this.stateManager.restoreStakeInfoState();
      this.stateManager.clearBackup();
      throw error;
    }
  }
  
  /**
   * Unstake tokens
   */
  async unstakeTokens(amount: BN): Promise<string> {
    this.stateManager.invalidateAll();
    
    try {
      const stakeInfo = await this.getStakeInfo();
      if (!stakeInfo) throw new Error("Stake info not found");
      
      const currentTime = Math.floor(Date.now() / 1000);
      if (currentTime < stakeInfo.unstakeLockupTime.toNumber()) {
        throw new Error(`Unstake lockup active. Available in ${stakeInfo.unstakeLockupTime.toNumber() - currentTime} seconds`);
      }
      
      this.stateManager.backupStakeInfoState(stakeInfo);
      const tx = await this.transactionService.buildUnstakeTransaction({
        amount,
        stakeInfo
      });
      
      const updatedStakeInfo = {
        ...stakeInfo,
        amountStaked: stakeInfo.amountStaked.sub(amount),
        unstakedPending: stakeInfo.unstakedPending.add(amount),
        redeemLockupTime: new BN(currentTime + 300)
      };
      this.stateManager.setStakeInfo(updatedStakeInfo);
      
      try {
        const signature = await this.transactionService.sendTransaction(tx);
        await new Promise(resolve => setTimeout(resolve, this.TRANSACTION_CONFIRMATION_WAIT));
        
        // Refresh both stake info and fee vault in parallel
        this.stateManager.invalidateAll();
        await Promise.all([
          this.getStakeInfo(true),
          this.getFeeVault(true)
        ]);
        
        return signature;
      } catch (txError) {
        const restored = this.stateManager.restoreStakeInfoState();
        if (!restored) this.stateManager.invalidateStakeInfo();
        throw txError;
      }
    } catch (error) {
      this.stateManager.restoreStakeInfoState();
      this.stateManager.clearBackup();
      throw error;
    }
  }
  
  /**
   * Claim rewards
   */
  async claimRewards(): Promise<string> {
    this.stateManager.invalidateAll();
    
    try {
      const stakeInfo = await this.getStakeInfo();
      if (!stakeInfo) throw new Error("Stake info not found");
      
      this.stateManager.backupStakeInfoState(stakeInfo);
      const feeVault = await this.getFeeVault();
      if (!feeVault) throw new Error("Fee vault not found");
      
      const pendingRewards = calculatePendingRewards(stakeInfo, feeVault);
      
      if (pendingRewards.isZero()) {
        throw new Error("No rewards available to claim");
      }
      
      const tx = this.transactionService.buildClaimRewardsTransaction({
        stakeInfo,
        pendingRewards
      });
      
      const updatedStakeInfo = {
        ...stakeInfo,
        rewardDebt: stakeInfo.amountStaked
          .mul(feeVault.accRewardPerShare)
          .div(new BN(MULTIPLIER))
      };
      this.stateManager.setStakeInfo(updatedStakeInfo);
      
      try {
        const signature = await this.transactionService.sendTransaction(tx);
        await new Promise(resolve => setTimeout(resolve, this.TRANSACTION_CONFIRMATION_WAIT));
        
        // Refresh both stake info and fee vault in parallel
        this.stateManager.invalidateAll();
        await Promise.all([
          this.getStakeInfo(true),
          this.getFeeVault(true)
        ]);
        
        return signature;
      } catch (txError) {
        const restored = this.stateManager.restoreStakeInfoState();
        if (!restored) this.stateManager.invalidateStakeInfo();
        throw txError;
      }
    } catch (error) {
      this.stateManager.restoreStakeInfoState();
      this.stateManager.clearBackup();
      throw error;
    }
  }
  
  /**
   * Claim unstaked tokens
   */
  async claimUnstaked(): Promise<string> {
    this.stateManager.invalidateAll();
    
    try {
      const stakeInfo = await this.getStakeInfo();
      if (!stakeInfo) throw new Error("Stake info not found");
      
      const currentTime = Math.floor(Date.now() / 1000);
      if (currentTime < stakeInfo.redeemLockupTime.toNumber()) {
        throw new Error(`Redeem lockup active. Available in ${stakeInfo.redeemLockupTime.toNumber() - currentTime} seconds`);
      }
      
      this.stateManager.backupStakeInfoState(stakeInfo);
      const unstakedPending = stakeInfo.unstakedPending;
      const tx = await this.transactionService.buildClaimUnstakedTransaction({
        stakeInfo,
        unstakedPending
      });
      
      const updatedStakeInfo = {
        ...stakeInfo,
        unstakedPending: new BN(0)
      };
      this.stateManager.setStakeInfo(updatedStakeInfo);
      
      try {
        const signature = await this.transactionService.sendTransaction(tx);
        await new Promise(resolve => setTimeout(resolve, this.TRANSACTION_CONFIRMATION_WAIT));
        
        // Only refresh stake info since fee vault doesn't change for this operation
        this.stateManager.invalidateStakeInfo();
        await this.getStakeInfo(true);
        
        return signature;
      } catch (txError) {
        const restored = this.stateManager.restoreStakeInfoState();
        if (!restored) this.stateManager.invalidateStakeInfo();
        throw txError;
      }
    } catch (error) {
      this.stateManager.restoreStakeInfoState();
      this.stateManager.clearBackup();
      throw error;
    }
  }
  
  /**
   * Force refresh all cached data
   */
  refreshData(): void {
    this.stateManager.invalidateAll();
    
    // Use Promise.all to fetch both in parallel
    Promise.all([
      this.getStakeInfo(true),
      this.getFeeVault(true)
    ]).catch(() => {
      // Silent error handling in production
    });
  }
  
  /**
   * Clean up resources when the client is no longer needed
   */
  cleanup(): void {
    // Nothing to clean up
  }
}