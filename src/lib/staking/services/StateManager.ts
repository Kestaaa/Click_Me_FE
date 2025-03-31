import { FeeVault, StakeInfo } from '../types';
import { Logger } from '../utils/logger';
import { CACHE_TTL, MULTIPLIER } from '../utils/constants';
import { BN } from "@project-serum/anchor";

/**
 * Simple data cache implementation with TTL
 */
class DataCache<T> {
  private data: T | null = null;
  private lastUpdated: number = 0;
  private ttl: number;
  private updating = false;
  private updatePromise: Promise<T | null> | null = null;

  constructor(ttl: number) {
    this.ttl = ttl;
  }

  async get(fetchFn: () => Promise<T | null>): Promise<T | null> {
    const now = Date.now();
    if (this.data && now - this.lastUpdated < this.ttl) return this.data;
    if (this.updating && this.updatePromise) return this.updatePromise;
    
    this.updating = true;
    this.updatePromise = fetchFn()
      .then((result) => {
        if (result !== null) {
          this.data = result;
          this.lastUpdated = Date.now();
        }
        return result;
      })
      .catch((error) => {
        Logger.error("Cache update error:", error);
        return this.data;
      })
      .finally(() => {
        this.updating = false;
        this.updatePromise = null;
      });
    return this.updatePromise;
  }

  invalidate(): void {
    this.data = null;
    this.lastUpdated = 0;
  }
  
  set(data: T): void {
    // Skip update if data is effectively the same to avoid unnecessary rerenders
    if (this.data && JSON.stringify(this.data) === JSON.stringify(data)) {
      // Just update the timestamp but don't trigger listeners/effects
      this.lastUpdated = Date.now();
      return;
    }
    
    this.data = data;
    this.lastUpdated = Date.now();
  }
  
  hasValidData(): boolean {
    return this.data !== null && (Date.now() - this.lastUpdated) < this.ttl;
  }
  
  peek(): T | null {
    return this.data;
  }

  getLastUpdated(): number {
    return this.lastUpdated;
  }
}

/**
 * Optimized state manager for staking data
 */
export class StateManager {
  private stakeInfoCache: DataCache<StakeInfo>;
  private feeVaultCache: DataCache<FeeVault>;
  private cachedStakeWallet: string | null = null;
  private originalStakeInfo: StakeInfo | null = null;
  
  constructor() {
    this.stakeInfoCache = new DataCache<StakeInfo>(CACHE_TTL.STAKE_INFO);
    this.feeVaultCache = new DataCache<FeeVault>(CACHE_TTL.FEE_VAULT);
  }
  
  /**
   * Retrieve stake info.
   */
  async getStakeInfo(fetchFn: () => Promise<StakeInfo | null>, currentWallet: string): Promise<StakeInfo | null> {
    // If cache exists but for a different wallet, invalidate it
    if (this.cachedStakeWallet && this.cachedStakeWallet !== currentWallet) {
      this.invalidateStakeInfo();
    }
    return this.stakeInfoCache.get(fetchFn);
  }
  
  async getFeeVault(fetchFn: () => Promise<FeeVault | null>): Promise<FeeVault | null> {
    return this.feeVaultCache.get(fetchFn);
  }
  
  // Direct access methods for efficiency
  getStakeInfoDirect(): StakeInfo | null {
    return this.stakeInfoCache.peek();
  }
  
  getFeeVaultDirect(): FeeVault | null {
    return this.feeVaultCache.peek();
  }
  
  setStakeInfo(stakeInfo: StakeInfo): void {
    this.stakeInfoCache.set(stakeInfo);
    this.cachedStakeWallet = stakeInfo.user.toString();
  }
  
  setFeeVault(feeVault: FeeVault): void {
    this.feeVaultCache.set(feeVault);
  }
  
  backupStakeInfoState(stakeInfo: StakeInfo): void {
    // Create a deep copy to prevent reference issues
    this.originalStakeInfo = { ...stakeInfo };
  }
  
  restoreStakeInfoState(): boolean {
    if (this.originalStakeInfo) {
      this.stakeInfoCache.set(this.originalStakeInfo);
      return true;
    }
    return false;
  }
  
  clearBackup(): void {
    this.originalStakeInfo = null;
  }
  
  invalidateAll(): void {
    this.stakeInfoCache.invalidate();
    this.feeVaultCache.invalidate();
    this.originalStakeInfo = null;
    this.cachedStakeWallet = null;
  }
  
  invalidateStakeInfo(): void {
    this.stakeInfoCache.invalidate();
    this.cachedStakeWallet = null;
  }
  
  invalidateFeeVault(): void {
    this.feeVaultCache.invalidate();
  }

  getStakeInfoLastUpdated(): number {
    return this.stakeInfoCache.getLastUpdated();
  }

  getFeeVaultLastUpdated(): number {
    return this.feeVaultCache.getLastUpdated();
  }
  
  // Check if we have valid data in both caches
  hasValidCachedData(): boolean {
    return this.stakeInfoCache.hasValidData() && this.feeVaultCache.hasValidData();
  }
  
  // Calculate pending rewards based on stake info and fee vault
  calculatePendingRewards(stakeInfo: StakeInfo, feeVault: FeeVault): BN {
    if (!stakeInfo || !feeVault) return new BN(0);
    
    return stakeInfo.amountStaked
      .mul(feeVault.accRewardPerShare)
      .div(new BN(MULTIPLIER))
      .sub(stakeInfo.rewardDebt);
  }
}