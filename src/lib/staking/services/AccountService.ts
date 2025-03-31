import { Connection, PublicKey, Keypair, AccountInfo } from '@solana/web3.js';
import { BN } from '@project-serum/anchor';
import { StakeInfo } from '../types';
import { Logger } from '../utils/logger';
import { COMMITMENT_LEVELS, DISCRIMINATORS, MULTIPLIER, STAKE_INFO_DISCRIMINATOR } from '../utils/constants';
import { StorageService } from './StorageService';
import { StateManager } from './StateManager';
import { STAKING_PROGRAM_ID } from '@/config';
import { deserializeStakeInfo } from '../utils/deserialization';

// The stake info account size with the redeemLockupTime field
const STAKE_INFO_ACCOUNT_SIZE = 88;

// Key under which we store the current staking program id in local storage
const PROGRAM_ID_STORAGE_KEY = 'current-staking-program-id';

export class AccountService {
  private connection: Connection;
  private storageService: StorageService;
  private stateManager: StateManager;
  private persistedStakeInfoPubkey: string | null = null;
  
  constructor(
    connection: Connection,
    storageService: StorageService,
    stateManager: StateManager
  ) {
    this.connection = connection;
    this.storageService = storageService;
    this.stateManager = stateManager;
    
    // Compare cached STAKING_PROGRAM_ID with the current one from config
    const cachedProgramId = localStorage.getItem(PROGRAM_ID_STORAGE_KEY);
    const currentProgramId = STAKING_PROGRAM_ID.toString();
    if (cachedProgramId !== currentProgramId) {
      // Clear all staking-related storage
      this.storageService.clearStakeInfo("");
      localStorage.setItem(PROGRAM_ID_STORAGE_KEY, currentProgramId);
    }
  }
  
  async loadPersistedStakeInfo(walletAddress: string): Promise<boolean> {
    try {
      const storedInfo = this.storageService.getStakeInfo(walletAddress);
      if (!storedInfo) return false;
      
      this.persistedStakeInfoPubkey = storedInfo.pubkey;
      
      if (storedInfo.user === walletAddress) {
        return await this.validateAndSetStakeInfoFromStorage(storedInfo, walletAddress);
      }
      return false;
    } catch (error) {
      return false;
    }
  }
  
  private async validateAndSetStakeInfoFromStorage(
    storedInfo: { pubkey: string, user: string },
    walletAddress: string
  ): Promise<boolean> {
    try {
      const pubkey = new PublicKey(storedInfo.pubkey);
      
      const accountInfo = await this.connection.getAccountInfo(pubkey, COMMITMENT_LEVELS.READ);
      if (!accountInfo) {
        return false;
      }
      
      // Validate account size
      if (accountInfo.data.length !== STAKE_INFO_ACCOUNT_SIZE) {
        return false;
      }
      
      const disc = accountInfo.data.slice(0, 8);
      if (!Buffer.from(disc).equals(DISCRIMINATORS.STAKE_INFO)) {
        return false;
      }
      
      const data = accountInfo.data.slice(8);
      const user = new PublicKey(data.slice(0, 32));
      if (user.toString() !== walletAddress) {
        return false;
      }
      
      const amountStaked = new BN(data.slice(32, 40), "le");
      const rewardDebt = new BN(data.slice(40, 48), "le");
      const unstakedPending = new BN(data.slice(48, 56), "le");
      const lastStakeTime = new BN(data.slice(56, 64), "le");
      const unstakeLockupTime = new BN(data.slice(64, 72), "le");
      const redeemLockupTime = new BN(data.slice(72, 80), "le");
      
      this.stateManager.setStakeInfo({
        pubkey,
        user,
        amountStaked,
        rewardDebt,
        unstakedPending,
        lastStakeTime,
        unstakeLockupTime,
        redeemLockupTime
      });
      
      return true;
    } catch (error) {
      return false;
    }
  }
  
  async findStakeInfoAccount(userWalletPubkey: PublicKey): Promise<StakeInfo | null> {
    const stakeInfoSize = 88; // Total size including discriminator
  
    try {
      // Query accounts using a filter on the user field (starting at offset 8)
      const filters = [
        { dataSize: stakeInfoSize },
        {
          memcmp: {
            offset: 8,
            bytes: userWalletPubkey.toBase58(),
          },
        },
      ];
    
      const accounts = await this.connection.getProgramAccounts(STAKING_PROGRAM_ID, {
        filters,
        commitment: COMMITMENT_LEVELS.READ,
      });
    
      if (accounts.length > 0) {
        const account = accounts[0];
        const data = account.account.data.slice(8);
        const stakeInfo = deserializeStakeInfo(data);
        stakeInfo.pubkey = account.pubkey;
        return stakeInfo;
      }
    
      // Fallback to direct lookup if we have the account pubkey stored
      const storedInfo = this.storageService.getStakeInfo(userWalletPubkey.toString());
      if (storedInfo) {
        try {
          const pubkey = new PublicKey(storedInfo.pubkey);
          const accountInfo = await this.connection.getAccountInfo(pubkey, COMMITMENT_LEVELS.READ);
        
          if (accountInfo && accountInfo.owner.equals(STAKING_PROGRAM_ID)) {
            const parsedInfo = this.parseStakeInfo(accountInfo, pubkey);
            if (parsedInfo && parsedInfo.user.equals(userWalletPubkey)) {
              return parsedInfo;
            }
          }
        } catch (fallbackError) {
          // Silent error handling in production
        }
      }
  
      return null;
    } catch (error) {
      return null;
    }
  }
  
  generateStakeInfoKeypair(): Keypair {
    return Keypair.generate();
  }
  
  calculatePendingRewards(stakeInfo: StakeInfo, accRewardPerShare: BN): BN {
    return stakeInfo.amountStaked
      .mul(accRewardPerShare)
      .div(new BN(MULTIPLIER))
      .sub(stakeInfo.rewardDebt);
  }
  
  persistStakeInfo(stakeInfo: StakeInfo, walletAddress: string): void {
    try {
      const pubkeyStr = stakeInfo.pubkey.toString();
      if (this.persistedStakeInfoPubkey === pubkeyStr) {
        return;
      }
      
      if (this.storageService.isStakeInfoStored(walletAddress, stakeInfo.pubkey)) {
        this.persistedStakeInfoPubkey = pubkeyStr;
        return;
      }
      
      this.storageService.saveStakeInfo(
        walletAddress,
        stakeInfo.pubkey,
        stakeInfo.user
      );
      
      this.persistedStakeInfoPubkey = pubkeyStr;
    } catch (error) {
      // Silent error handling in production
    }
  }
  
  public parseStakeInfo(accountInfo: AccountInfo<Buffer>, pubkey: PublicKey): StakeInfo | null {
    try {
      // Check for the expected minimum size
      if (accountInfo.data.length < STAKE_INFO_ACCOUNT_SIZE) {
        return null;
      }
      
      // Check discriminator to identify if it's a StakeInfo account
      const discriminator = accountInfo.data.slice(0, 8);
      if (!discriminator.equals(STAKE_INFO_DISCRIMINATOR)) {
        return null;
      }
      
      // Parse account data
      const data = accountInfo.data.slice(8);
      const user = new PublicKey(data.slice(0, 32));
      const amountStaked = new BN(data.slice(32, 40), "le");
      const rewardDebt = new BN(data.slice(40, 48), "le");
      const unstakedPending = new BN(data.slice(48, 56), "le");
      const lastStakeTime = new BN(data.slice(56, 64), "le");
      const unstakeLockupTime = new BN(data.slice(64, 72), "le");
      const redeemLockupTime = new BN(data.slice(72, 80), "le");
      
      return {
        pubkey,
        user,
        amountStaked,
        rewardDebt,
        unstakedPending,
        lastStakeTime,
        unstakeLockupTime,
        redeemLockupTime
      };
    } catch (error) {
      return null;
    }
  }
}