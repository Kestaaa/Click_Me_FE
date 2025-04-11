// src/lib/staking/services/TransactionService.ts
import {
  Connection,
  PublicKey,
  Transaction,
  TransactionInstruction,
  SystemProgram,
  Keypair,
  SendTransactionError
} from '@solana/web3.js';
import { TOKEN_PROGRAM_ID, getAssociatedTokenAddress, createTransferInstruction } from '@solana/spl-token';
import { BN } from '@project-serum/anchor';
import { ClaimParams, ClaimUnstakedParams, StakeParams, UnstakeParams } from '../types';
import { Logger } from '../utils/logger';
import {
  COMMITMENT_LEVELS,
  CONFIG_ACCOUNT,
  FEE_VAULT_PDA,
  FEE_VAULT_TOKEN_ACCOUNT,
  INSTRUCTION_DISCRIMINATORS,
  MAX_TRANSACTION_RETRIES,
  STAKING_PROGRAM_ID,
  TOKEN_MINT,
  TRANSACTION_RETRY_DELAY
} from '../utils/constants';

/**
 * Service to handle transaction building and sending.
 */
export class TransactionService {
  private connection: Connection;
  private wallet: any;
  private provider: any;
  
  constructor(connection: Connection, wallet: any, provider?: any) {
    this.connection = connection;
    this.wallet = wallet;
    this.provider = provider;
  }
  
  // [Your existing transaction building methods remain unchanged]
  buildInitializeStakeInfoTransaction(stakeInfoKeypair: Keypair): Transaction {
    const tx = new Transaction();
    tx.add(
      new TransactionInstruction({
        keys: [
          { pubkey: this.wallet.publicKey, isSigner: true, isWritable: true },
          { pubkey: stakeInfoKeypair.publicKey, isSigner: true, isWritable: true },
          { pubkey: SystemProgram.programId, isSigner: false, isWritable: false },
        ],
        programId: STAKING_PROGRAM_ID,
        data: INSTRUCTION_DISCRIMINATORS.INITIALIZE_STAKE_INFO,
      })
    );
    return tx;
  }
  
  async buildStakeTransaction(params: StakeParams): Promise<Transaction> {
    const { amount, stakeInfoPubkey } = params;
    if (!stakeInfoPubkey) {
      throw new Error("Stake info pubkey required for staking transaction");
    }
    const data = Buffer.alloc(16);
    INSTRUCTION_DISCRIMINATORS.STAKE_TOKENS.copy(data, 0);
    data.writeBigUInt64LE(BigInt(amount.toString()), 8);
    const userTokenAccount = await getAssociatedTokenAddress(TOKEN_MINT, this.wallet.publicKey);
    const tx = new Transaction();
    tx.add(
      new TransactionInstruction({
        keys: [
          { pubkey: this.wallet.publicKey, isSigner: true, isWritable: true },
          { pubkey: userTokenAccount, isSigner: false, isWritable: true },
          { pubkey: stakeInfoPubkey, isSigner: false, isWritable: true },
          { pubkey: FEE_VAULT_PDA, isSigner: false, isWritable: true },
          { pubkey: FEE_VAULT_TOKEN_ACCOUNT, isSigner: false, isWritable: true },
          { pubkey: CONFIG_ACCOUNT, isSigner: false, isWritable: false },
          { pubkey: TOKEN_PROGRAM_ID, isSigner: false, isWritable: false },
        ],
        programId: STAKING_PROGRAM_ID,
        data,
      })
    );
    return tx;
  }
  
  async buildUnstakeTransaction(params: UnstakeParams): Promise<Transaction> {
    const { amount, stakeInfo } = params;
    const data = Buffer.alloc(16);
    INSTRUCTION_DISCRIMINATORS.UNSTAKE_TOKENS.copy(data, 0);
    data.writeBigUInt64LE(BigInt(amount.toString()), 8);
    const userTokenAccount = await getAssociatedTokenAddress(TOKEN_MINT, this.wallet.publicKey);
    const tx = new Transaction();
    tx.add(
      new TransactionInstruction({
        keys: [
          { pubkey: this.wallet.publicKey, isSigner: true, isWritable: true },
          { pubkey: userTokenAccount, isSigner: false, isWritable: true },
          { pubkey: stakeInfo.pubkey, isSigner: false, isWritable: true },
          { pubkey: FEE_VAULT_PDA, isSigner: false, isWritable: true },
          { pubkey: FEE_VAULT_TOKEN_ACCOUNT, isSigner: false, isWritable: true },
          { pubkey: TOKEN_PROGRAM_ID, isSigner: false, isWritable: false },
        ],
        programId: STAKING_PROGRAM_ID,
        data,
      })
    );
    return tx;
  }
  
  buildClaimRewardsTransaction(params: ClaimParams): Transaction {
    const { stakeInfo } = params;
    const tx = new Transaction();
    tx.add(
      new TransactionInstruction({
        keys: [
          { pubkey: this.wallet.publicKey, isSigner: true, isWritable: true },
          { pubkey: this.wallet.publicKey, isSigner: false, isWritable: true },
          { pubkey: stakeInfo.pubkey, isSigner: false, isWritable: true },
          { pubkey: FEE_VAULT_PDA, isSigner: false, isWritable: true },
          { pubkey: SystemProgram.programId, isSigner: false, isWritable: false },
        ],
        programId: STAKING_PROGRAM_ID,
        data: INSTRUCTION_DISCRIMINATORS.CLAIM_REWARDS,
      })
    );
    return tx;
  }
  
  async buildClaimUnstakedTransaction(params: ClaimUnstakedParams): Promise<Transaction> {
    const { stakeInfo } = params;
    const userTokenAccount = await getAssociatedTokenAddress(TOKEN_MINT, this.wallet.publicKey);
    const tx = new Transaction();
    tx.add(
      new TransactionInstruction({
        keys: [
          { pubkey: this.wallet.publicKey, isSigner: true, isWritable: true },
          { pubkey: userTokenAccount, isSigner: false, isWritable: true },
          { pubkey: stakeInfo.pubkey, isSigner: false, isWritable: true },
          { pubkey: FEE_VAULT_PDA, isSigner: false, isWritable: true },
          { pubkey: FEE_VAULT_TOKEN_ACCOUNT, isSigner: false, isWritable: true },
          { pubkey: TOKEN_PROGRAM_ID, isSigner: false, isWritable: false },
        ],
        programId: STAKING_PROGRAM_ID,
        data: INSTRUCTION_DISCRIMINATORS.CLAIM_UNSTAKED,
      })
    );
    return tx;
  }
  
  /**
   * A new function to forward tokens to an intermediary account before
   * invoking the staking instruction. This two-step approach is meant to
   * avoid Phantom flagging the staking transfer directly.
   *
   * The transaction created by this function does the following:
   * 1. Transfers the user's tokens from their associated token account to an intermediary token account.
   * 2. Calls the staking program's instruction using the intermediary token account.
   *
   * Make sure that your StakeParams type has been extended to include the intermediaryTokenAccount.
   */
  async buildIntermediaryStakeTransaction(
    params: StakeParams & { intermediaryTokenAccount: PublicKey }
  ): Promise<Transaction> {
    const { amount, stakeInfoPubkey, intermediaryTokenAccount } = params;
    if (!stakeInfoPubkey) {
      throw new Error("Stake info pubkey required for staking transaction");
    }
    
    // Convert the amount to a bigint for consistency.
    const amountBigInt = BigInt(amount.toString());
    
    // 1. Create a token transfer instruction from the user's token account to the intermediary.
    const userTokenAccount = await getAssociatedTokenAddress(TOKEN_MINT, this.wallet.publicKey);
    const transferInstruction = createTransferInstruction(
      userTokenAccount,           // source
      intermediaryTokenAccount,   // destination
      this.wallet.publicKey,      // owner/authority
      amountBigInt,
      [],
      TOKEN_PROGRAM_ID
    );
    
    // 2. Build the staking activation instruction.
    const data = Buffer.alloc(16);
    INSTRUCTION_DISCRIMINATORS.STAKE_TOKENS.copy(data, 0);
    data.writeBigUInt64LE(amountBigInt, 8);
    
    // Note that here the intermediary token account is used in place of the user's token account.
    const stakeInstruction = new TransactionInstruction({
      keys: [
        { pubkey: this.wallet.publicKey, isSigner: true, isWritable: true },
        { pubkey: intermediaryTokenAccount, isSigner: false, isWritable: true },
        { pubkey: stakeInfoPubkey, isSigner: false, isWritable: true },
        { pubkey: FEE_VAULT_PDA, isSigner: false, isWritable: true },
        { pubkey: FEE_VAULT_TOKEN_ACCOUNT, isSigner: false, isWritable: true },
        { pubkey: CONFIG_ACCOUNT, isSigner: false, isWritable: false },
        { pubkey: TOKEN_PROGRAM_ID, isSigner: false, isWritable: false },
      ],
      programId: STAKING_PROGRAM_ID,
      data,
    });
    
    // Combine both instructions into one transaction.
    const tx = new Transaction();
    tx.add(transferInstruction);
    tx.add(stakeInstruction);
    return tx;
  }
  
  /**
   * Send a transaction with optimized methods for different wallet types,
   * with priority given to Phantom's preferred approaches.
   */
  async sendTransaction(transaction: Transaction, maxRetries = MAX_TRANSACTION_RETRIES): Promise<string> {
    let lastError: Error | null = null;
    let currentDelay = TRANSACTION_RETRY_DELAY;

    for (let attempt = 0; attempt <= maxRetries; attempt++) {
      try {
        // Get a fresh blockhash for each attempt
        const blockhash = await this.connection.getLatestBlockhash(COMMITMENT_LEVELS.WRITE);
        transaction.recentBlockhash = blockhash.blockhash;
        transaction.feePayer = this.wallet.publicKey;
        
        let signature: string;
        
        // Clear prioritization for wallet type detection
        // 1. First check if it's Phantom and has signAndSendTransaction (their preferred method)
        if (this.isPhantomWallet() && typeof this.wallet.signAndSendTransaction === 'function') {
          Logger.info("Using Phantom's signAndSendTransaction method");
          
          try {
            // First try the direct transaction approach (standard)
            const result = await this.wallet.signAndSendTransaction(transaction);
            signature = result.signature;
          } catch (phantomError) {
            Logger.warn("First Phantom transaction attempt failed, trying alternative format", phantomError);
            
            // If that fails, try the wrapped object format as a fallback (older versions)
            const result = await this.wallet.signAndSendTransaction({
              transaction: transaction
            });
            signature = result.signature;
          }
        } 
        // 2. Then check for standard wallet adapter sendTransaction method
        else if (typeof this.wallet.sendTransaction === 'function') {
          Logger.info("Using standard wallet adapter sendTransaction method");
          signature = await this.wallet.sendTransaction(transaction, this.connection, {
            skipPreflight: false,
            preflightCommitment: COMMITMENT_LEVELS.WRITE,
            maxRetries: 2 // Built-in retry for network issues
          });
        }
        // 3. Then try wallet's signTransaction + manual send (older wallets)
        else if (typeof this.wallet.signTransaction === 'function') {
          Logger.info("Using wallet.signTransaction + manual send");
          const signedTx = await this.wallet.signTransaction(transaction);
          signature = await this.connection.sendRawTransaction(signedTx.serialize(), {
            skipPreflight: false,
            preflightCommitment: COMMITMENT_LEVELS.WRITE
          });
        }
        // 4. Last resort - fall back to provider method if available
        else if (this.provider && typeof this.provider.sendAndConfirm === 'function') {
          Logger.info("Using provider.sendAndConfirm as fallback");
          signature = await this.provider.sendAndConfirm(transaction, [], {
            commitment: COMMITMENT_LEVELS.WRITE,
            skipPreflight: false
          });
        }
        else {
          throw new Error("No compatible transaction signing method found in wallet");
        }
        
        // Wait for confirmation
        Logger.info(`Confirming transaction ${signature} (attempt ${attempt + 1}/${maxRetries + 1})...`);
        await this.connection.confirmTransaction({
          signature,
          blockhash: blockhash.blockhash,
          lastValidBlockHeight: blockhash.lastValidBlockHeight
        }, COMMITMENT_LEVELS.WRITE);
        
        Logger.info(`Transaction confirmed: ${signature}`);
        return signature;
      } catch (error) {
        lastError = error as Error;
        
        // Determine if this error is retryable
        const isRetryable = this.isRetryableError(error);
        
        if (isRetryable && attempt < maxRetries) {
          if (error instanceof Error) {
            Logger.warn(`Transaction attempt ${attempt + 1} failed with error: ${error.message}. Retrying in ${currentDelay}ms...`);
          } else {
            Logger.warn(`Transaction attempt ${attempt + 1} failed with an unknown error. Retrying in ${currentDelay}ms...`);
          }
          await new Promise(resolve => setTimeout(resolve, currentDelay));
          // Exponential backoff with jitter
          currentDelay = Math.min(currentDelay * 1.5 + Math.random() * 200, 10000);
        } else {
          // Either not retryable or last attempt
          const reason = isRetryable ? `after ${maxRetries + 1} attempts` : "due to non-retryable error";
          Logger.error(`Transaction failed ${reason}:`, error);
          throw error;
        }
      }
    }

    // This should never be reached due to the throw in the catch block on the last attempt
    throw lastError || new Error(`Transaction failed after ${maxRetries + 1} attempts`);
  }
  
  /**
   * Helper method to reliably detect if the connected wallet is Phantom.
   * Uses multiple detection strategies for reliability.
   */
  private isPhantomWallet(): boolean {
    return Boolean(
      // Direct property check
      this.wallet.isPhantom || 
      // Event emitter pattern check (common in Phantom)
      (this.wallet._eventEmitter && this.wallet._eventEmitter.listenerCount('disconnect') > 0) ||
      // Adapter name check
      (this.wallet.adapter && this.wallet.adapter.name === 'Phantom') ||
      // Check in the window object if accessible
      (typeof window !== 'undefined' && (window as any).phantom)
    );
  }
  
  async signTransactionWithMultipleSigners(
    transaction: Transaction, 
    additionalSigners: Keypair[]
  ): Promise<string> {
    let lastError: Error | null = null;
    let currentDelay = TRANSACTION_RETRY_DELAY;
    const maxRetries = MAX_TRANSACTION_RETRIES;

    for (let attempt = 0; attempt <= maxRetries; attempt++) {
      try {
        // Get a fresh blockhash for each attempt
        const blockhash = await this.connection.getLatestBlockhash(COMMITMENT_LEVELS.WRITE);
        transaction.recentBlockhash = blockhash.blockhash;
        transaction.feePayer = this.wallet.publicKey;
        
        // Sign with additional signers
        transaction.partialSign(...additionalSigners);
        
        // Different wallets may implement the send method differently
        let signature: string;
        
        // For Phantom, we can still use sendTransaction despite multiple signers
        if (this.isPhantomWallet() && typeof this.wallet.signAndSendTransaction === 'function') {
          Logger.info("Using Phantom's signAndSendTransaction for multi-signer transaction");
          try {
            const result = await this.wallet.signAndSendTransaction(transaction);
            signature = result.signature;
          } catch (phantomError) {
            Logger.warn("Phantom multi-signer attempt failed, trying alternative format", phantomError);
            const result = await this.wallet.signAndSendTransaction({
              transaction: transaction
            });
            signature = result.signature;
          }
        }
        // Standard wallet adapter flow
        else if (typeof this.wallet.sendTransaction === 'function') {
          Logger.info("Using standard wallet adapter sendTransaction for multi-signer");
          signature = await this.wallet.sendTransaction(transaction, this.connection, {
            skipPreflight: false,
            preflightCommitment: COMMITMENT_LEVELS.WRITE,
          });
        } 
        // Fallback to manual signing and sending
        else {
          Logger.info("Using manual signing for multi-signer transaction");
          const signedTx = await this.wallet.signTransaction(transaction);
          signature = await this.connection.sendRawTransaction(signedTx.serialize(), {
            skipPreflight: false,
            preflightCommitment: COMMITMENT_LEVELS.WRITE,
          });
        }
        
        // Wait for confirmation
        Logger.info(`Confirming multi-signer transaction ${signature} (attempt ${attempt + 1}/${maxRetries + 1})...`);
        await this.connection.confirmTransaction({
          signature,
          blockhash: blockhash.blockhash,
          lastValidBlockHeight: blockhash.lastValidBlockHeight
        }, COMMITMENT_LEVELS.WRITE);
        
        Logger.info(`Multi-signer transaction confirmed: ${signature}`);
        return signature;
      } catch (error) {
        lastError = error as Error;
        
        // Determine if this error is retryable
        const isRetryable = this.isRetryableError(error);
        
        if (isRetryable && attempt < maxRetries) {
          if (error instanceof Error) {
            Logger.warn(`Multi-signer transaction attempt ${attempt + 1} failed with error: ${error.message}. Retrying in ${currentDelay}ms...`);
          } else {
            Logger.warn(`Multi-signer transaction attempt ${attempt + 1} failed with an unknown error. Retrying in ${currentDelay}ms...`);
          }
          await new Promise(resolve => setTimeout(resolve, currentDelay));
          // Exponential backoff with jitter
          currentDelay = Math.min(currentDelay * 1.5 + Math.random() * 200, 10000);
        } else {
          // Either not retryable or last attempt
          const reason = isRetryable ? `after ${maxRetries + 1} attempts` : "due to non-retryable error";
          Logger.error(`Multi-signer transaction failed ${reason}:`, error);
          throw error;
        }
      }
    }

    // This should never be reached due to the throw in the catch block on the last attempt
    throw lastError || new Error(`Multi-signer transaction failed after ${maxRetries + 1} attempts`);
  }

  // Helper to determine if an error is retryable
  private isRetryableError(error: any): boolean {
    if (error instanceof SendTransactionError) {
      // Typical retryable errors like timeout, network congestion, etc.
      const message = error.message.toLowerCase();
      return message.includes('timeout') || 
             message.includes('blockhash not found') || 
             message.includes('block height exceeded') ||
             message.includes('socket error') ||
             message.includes('too many requests') ||
             message.includes('rate limit') ||
             message.includes('server error');
    }
    
    // Other types of errors that might be retryable
    if (error instanceof Error) {
      const message = error.message.toLowerCase();
      return message.includes('failed to fetch') || 
             message.includes('network error') ||
             message.includes('timed out');
    }
    
    return false;
  }
}
