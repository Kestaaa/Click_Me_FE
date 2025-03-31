import { PublicKey } from '@solana/web3.js';
import { BN } from '@project-serum/anchor';
import { StakeInfo } from '../types'; // adjust the path as needed

export function deserializeStakeInfo(data: Buffer): StakeInfo {
  if (data.length < 80) {
    throw new Error("Invalid stake info data length");
  }
  
  const user = new PublicKey(data.slice(0, 32));
  const amountStaked = new BN(data.slice(32, 40), 'le');
  const rewardDebt = new BN(data.slice(40, 48), 'le');
  const unstakedPending = new BN(data.slice(48, 56), 'le');
  const lastStakeTime = new BN(data.slice(56, 64), 'le');
  const unstakeLockupTime = new BN(data.slice(64, 72), 'le');
  const redeemLockupTime = new BN(data.slice(72, 80), 'le');
  
  return {
    // Use a placeholder PublicKey; the caller can override this with the actual account pubkey.
    pubkey: new PublicKey("11111111111111111111111111111111"),
    user,
    amountStaked,
    rewardDebt,
    unstakedPending,
    lastStakeTime,
    unstakeLockupTime,
    redeemLockupTime,
  };
}
