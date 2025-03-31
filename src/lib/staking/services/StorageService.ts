import { PublicKey } from '@solana/web3.js';
import { Logger } from '../utils/logger';
import { STORAGE_KEYS } from '../utils/constants';
import { StoredStakeInfo } from '../types';

export class StorageService {
  private isAvailable(): boolean {
    try {
      if (typeof localStorage === 'undefined') return false;
      const testKey = '__storage_test__';
      localStorage.setItem(testKey, 'test');
      localStorage.removeItem(testKey);
      return true;
    } catch {
      return false;
    }
  }
  
  getItem<T>(key: string): T | null {
    if (!this.isAvailable()) return null;
    try {
      const item = localStorage.getItem(key);
      return item ? JSON.parse(item) as T : null;
    } catch (e) {
      return null;
    }
  }
  
  setItem<T>(key: string, value: T): boolean {
    if (!this.isAvailable()) return false;
    try {
      localStorage.setItem(key, JSON.stringify(value));
      return true;
    } catch (e) {
      return false;
    }
  }
  
  removeItem(key: string): boolean {
    if (!this.isAvailable()) return false;
    try {
      localStorage.removeItem(key);
      return true;
    } catch (e) {
      return false;
    }
  }
  
  getStakeInfoKey(walletAddress: string): string {
    return `${STORAGE_KEYS.STAKE_INFO}-${walletAddress}`;
  }
  
  saveStakeInfo(walletAddress: string, pubkey: PublicKey, user: PublicKey): boolean {
    const stakeInfo: StoredStakeInfo = {
      pubkey: pubkey.toString(),
      user: user.toString()
    };
    const key = this.getStakeInfoKey(walletAddress);
    return this.setItem(key, stakeInfo);
  }
  
  getStakeInfo(walletAddress: string): StoredStakeInfo | null {
    return this.getItem<StoredStakeInfo>(this.getStakeInfoKey(walletAddress));
  }
  
  isStakeInfoStored(walletAddress: string, pubkey: PublicKey): boolean {
    const stored = this.getStakeInfo(walletAddress);
    return stored !== null && stored.pubkey === pubkey.toString();
  }
  
  clearStakeInfo(walletAddress: string): boolean {
    return this.removeItem(this.getStakeInfoKey(walletAddress));
  }
}