// src/lib/staking/utils/constants.ts
import { PublicKey } from '@solana/web3.js';
import { CommitmentLevel } from '../types';
import stakingConfig from '@/config/staking-config.json';
import { STAKING_PROGRAM_ID, STAKING_TOKEN_MINT, FEE_VAULT_PDA, STAKING_CONFIG_ACC } from '@/config';

// Use program ID and other constants from the main config
export { STAKING_PROGRAM_ID };
export const TOKEN_MINT = STAKING_TOKEN_MINT;
export const CONFIG_ACCOUNT = STAKING_CONFIG_ACC;

// Maintain the PDA for consistency
export { FEE_VAULT_PDA };

// Fee vault token account 
// Derived from the program and token mint
export const FEE_VAULT_TOKEN_ACCOUNT = new PublicKey(stakingConfig.feeVaultTokenAccount || "");

// Math constants
export const MULTIPLIER = 1_000_000_000_000;
export const SOL_DECIMALS = 9;
export const SOL_MULTIPLIER = 10 ** SOL_DECIMALS;

// Storage keys
export const STORAGE_KEYS = {
  STAKE_INFO: 'click-me-stake-info-account',
};

export const CACHE_TTL = {
  STAKE_INFO: 300 * 1000,  // 5 minutes instead of 1 minute
  FEE_VAULT: 300 * 1000,   // 5 minutes instead of 1 minute
};

// Transaction settings
export const MAX_TRANSACTION_RETRIES = 3;
export const TRANSACTION_RETRY_DELAY = 500; // ms

// RPC settings
export const COMMITMENT_LEVELS = {
  READ: 'confirmed' as CommitmentLevel,
  WRITE: 'confirmed' as CommitmentLevel,
};

// Stake info discriminator (8-byte buffer)
// This is the Anchor discriminator for the StakeInfo account
// The discriminator is a hash of the account name: "stake_info"
export const STAKE_INFO_DISCRIMINATOR = Buffer.from([
  66, 62, 68, 70, 108, 179, 183, 235
]);

// Account data discriminators (optional additional grouping)
export const DISCRIMINATORS = {
  STAKE_INFO: STAKE_INFO_DISCRIMINATOR,
};

// Instruction discriminators
export const INSTRUCTION_DISCRIMINATORS = {
  CLAIM_REWARDS: Buffer.from([4, 144, 132, 71, 116, 23, 151, 80]),
  CLAIM_UNSTAKED: Buffer.from([49, 80, 11, 252, 129, 53, 220, 84]),
  INITIALIZE_STAKE_INFO: Buffer.from([189, 157, 193, 226, 203, 212, 121, 233]),
  STAKE_TOKENS: Buffer.from([136, 126, 91, 162, 40, 131, 13, 127]),
  UNSTAKE_TOKENS: Buffer.from([58, 119, 215, 143, 203, 223, 32, 86])
};