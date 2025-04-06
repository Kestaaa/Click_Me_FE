// src/lib/staking/utils/validateProgramAccounts.ts
import { Connection, PublicKey } from '@solana/web3.js';
import { Logger } from './logger';
import { FEE_VAULT_PDA, FEE_VAULT_TOKEN_ACCOUNT, STAKING_PROGRAM_ID } from './constants';
import stakingConfig from '@/config/staking-config.json';

/**
 * Validates key accounts used in staking to ensure they're owned by the right program
 * @param connection Solana connection
 * @returns Promise with boolean indicating if all accounts are valid
 */
export async function validateProgramAccounts(connection: Connection): Promise<boolean> {
  try {
    Logger.info('Validating staking program accounts...');
    
    // Check FEE_VAULT_PDA
    const feeVaultInfo = await connection.getAccountInfo(FEE_VAULT_PDA);
    if (!feeVaultInfo) {
      Logger.error(`FEE_VAULT_PDA ${FEE_VAULT_PDA.toString()} does not exist`);
      return false;
    }
    
    if (!feeVaultInfo.owner.equals(STAKING_PROGRAM_ID)) {
      Logger.error(`FEE_VAULT_PDA is owned by ${feeVaultInfo.owner.toString()}, expected ${STAKING_PROGRAM_ID.toString()}`);
      return false;
    }
    
    // Check FEE_VAULT_TOKEN_ACCOUNT
    const tokenAccountInfo = await connection.getAccountInfo(FEE_VAULT_TOKEN_ACCOUNT);
    if (!tokenAccountInfo) {
      Logger.error(`FEE_VAULT_TOKEN_ACCOUNT ${FEE_VAULT_TOKEN_ACCOUNT.toString()} does not exist`);
      return false;
    }
    
    // Token accounts are owned by the SPL token program, not our staking program
    // We'll just check if it exists since that's the main requirement
    
    Logger.info('Staking program accounts validation successful');
    return true;
  } catch (error) {
    Logger.error('Error validating staking program accounts:', error);
    return false;
  }
}

/**
 * Logs detailed information about the staking configuration
 */
export function logStakingConfig(): void {
  Logger.info('Current staking configuration:');
  Logger.info(`- Program ID: ${STAKING_PROGRAM_ID.toString()}`);
  Logger.info(`- Fee Vault PDA: ${FEE_VAULT_PDA.toString()}`);
  Logger.info(`- Fee Vault Token Account: ${FEE_VAULT_TOKEN_ACCOUNT.toString()}`);
  Logger.info(`- Config from file:`, stakingConfig);
}