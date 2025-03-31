// src/lib/staking/ButtonGameClient.ts
import { BN, AnchorProvider } from "@project-serum/anchor";
import {
  Connection,
  PublicKey,
  SystemProgram,
  Transaction,
  TransactionInstruction,
  Commitment,
} from "@solana/web3.js";
import {
  PROGRAM_ID,
  GAME_STATE_SEED,
  CONFIG_SEED,
  VAULT_SEED,
  METRICS_SEED,
  FEE_VAULT_PDA,
  STAKING_PROGRAM_ID,
  STAKING_CONFIG_ACC,
  INITIAL_CLICK_COST,
  CLICK_INCREMENT,
  NEW_GAME_COST,
} from "@/config";

// Type imports
import {
  GameStateView,
  GameMetricsView,
} from "./types";

// Constants
const DISCRIMINATOR_LENGTH = 8;
const NEW_GAME_AMOUNT = new BN(NEW_GAME_COST * 1_000_000_000); // Convert SOL to lamports
const DEFAULT_CLICK_AMOUNT = new BN(INITIAL_CLICK_COST * 1_000_000_000); // Convert SOL to lamports
const INSTRUCTION_DISCRIMINATORS = {
  CLICK: Buffer.from([11, 147, 179, 178, 145, 118, 45, 186]),
  START_NEW_GAME: Buffer.from([240, 115, 44, 106, 216, 74, 190, 168]),
  INITIALIZE_CONFIG: Buffer.from([208, 127, 21, 1, 194, 190, 196, 70]),
};

/**
 * Helper for detailed error logging
 */
function logTransactionError(error: any): void {
  console.error("Transaction Error:", error?.message || error);
  if (error?.logs) {
    console.error("Error Logs:", error.logs);
  }
}

/**
 * Optimized ButtonGameClient implementation for credit conservation.
 * This client now focuses on essential methods and uses minimal RPC calls.
 */
export class ButtonGameClient {
  private connection: Connection;
  private wallet: any;
  private provider: AnchorProvider;
  private programId: PublicKey;
  private gameStatePDA: PublicKey;
  private configPDA: PublicKey;
  private vaultPDA: PublicKey;
  private metricsPDA: PublicKey;
  
  // Request prioritization
  private readonly COMMITMENT_LEVELS = {
    READ: 'confirmed' as Commitment,
    WRITE: 'confirmed' as Commitment,
  };

  // Cache for config data
  private configCache: any = null;

  constructor(provider: AnchorProvider) {
    this.provider = provider;
    this.connection = provider.connection;
    this.wallet = provider.wallet;
    this.programId = new PublicKey(PROGRAM_ID);

    // Initialize PDAs
    [this.gameStatePDA] = PublicKey.findProgramAddressSync(
      [Buffer.from(GAME_STATE_SEED)],
      this.programId
    );
    [this.configPDA] = PublicKey.findProgramAddressSync(
      [Buffer.from(CONFIG_SEED)],
      this.programId
    );
    [this.vaultPDA] = PublicKey.findProgramAddressSync(
      [Buffer.from(VAULT_SEED), this.gameStatePDA.toBuffer()],
      this.programId
    );
    [this.metricsPDA] = PublicKey.findProgramAddressSync(
      [Buffer.from(METRICS_SEED)],
      this.programId
    );
  }

  /**
   * Fetch game state - this is the primary method used for polling
   * based on the time-based strategy
   */
  async getGameState(): Promise<GameStateView | null> {
    try {
      const accountInfo = await this.connection.getAccountInfo(
        this.gameStatePDA,
        this.COMMITMENT_LEVELS.READ
      );
      
      if (!accountInfo) {
        return null;
      }
      
      const data = accountInfo.data.slice(DISCRIMINATOR_LENGTH);

      return {
        startingTime: new BN(data.slice(0, 8), "le"),
        endgameTime: new BN(data.slice(8, 16), "le"),
        lastClicker: new PublicKey(data.slice(16, 48)),
        vaultBalance: new BN(data.slice(48, 56), "le"),
        currentClickAmount: new BN(data.slice(56, 64), "le"),
        clickCount: new BN(data.slice(64, 72), "le"),
      };
    } catch (error) {
      console.error("Error fetching game state:", error);
      return null;
    }
  }

  /**
   * Fetch game metrics - only called when a game state change is detected
   */
  async getGameMetrics(): Promise<GameMetricsView | null> {
    try {
      const accountInfo = await this.connection.getAccountInfo(
        this.metricsPDA,
        this.COMMITMENT_LEVELS.READ
      );
      
      if (!accountInfo) {
        return null;
      }
      
      const data = accountInfo.data.slice(DISCRIMINATOR_LENGTH);
      
      // Parse fixed fields
      const totalGames = new BN(data.slice(0, 8), "le");
      const totalClicksAllTime = new BN(data.slice(8, 16), "le");
      const totalSolSpentAllTime = new BN(data.slice(16, 24), "le");
      const currentGameId = new BN(data.slice(24, 32), "le");
      const currentGameClicks = new BN(data.slice(32, 40), "le");
      
      let offset = 40;
      // Parse the recentClickers vector
      const recentClickersLength = data.readUInt32LE(offset);
      offset += 4;
      
      const recentClickers: PublicKey[] = [];
      for (let i = 0; i < recentClickersLength; i++) {
        const pubkeyBytes = data.slice(offset, offset + 32);
        recentClickers.push(new PublicKey(pubkeyBytes));
        offset += 32;
      }
      
      return {
        totalGames,
        totalClicksAllTime,
        totalSolSpentAllTime,
        currentGameId,
        currentGameClicks,
        recentClickers,
      };
    } catch (error) {
      console.error("Error fetching metrics:", error);
      return null;
    }
  }

  /**
   * Get or fetch config - lazily loaded and cached
   */
  async getConfig(): Promise<any | null> {
    // Return cached config if available
    if (this.configCache) {
      return this.configCache;
    }

    try {
      const accountInfo = await this.connection.getAccountInfo(
        this.configPDA,
        this.COMMITMENT_LEVELS.READ
      );
      
      if (!accountInfo) {
        return null;
      }
      
      // Skip the 8-byte discriminator
      const data = accountInfo.data.slice(DISCRIMINATOR_LENGTH);
      
      const devWallet = new PublicKey(data.slice(0, 32));
      // For option<PublicKey>, first byte is 1 if Some, 0 if None
      const hasStakingProgram = data[32] === 1;
      let stakingProgram = null;
      if (hasStakingProgram) {
        stakingProgram = new PublicKey(data.slice(33, 65));
      }
      
      const initialized = data.length > 65 ? Boolean(data[65]) : true;
      
      // Cache the config since it rarely changes
      this.configCache = {
        devWallet,
        stakingProgram,
        initialized
      };
      
      return this.configCache;
    } catch (error) {
      console.error("Error fetching config:", error);
      return null;
    }
  }

  /**
   * Click the button with a single transaction attempt.
   */
  async clickButton(): Promise<string> {
    try {
      const config = await this.getConfig();
      if (!config) throw new Error("Config not initialized");
      if (!config.initialized) throw new Error("Config not properly initialized");
      
      const gameState = await this.getGameState();
      
      // Game state validations
      if (!gameState || gameState.startingTime.isZero()) {
        throw new Error("No active game. Please start a new game first.");
      }
      
      if (Date.now() / 1000 >= gameState.endgameTime.toNumber()) {
        throw new Error("Game has ended. Please start a new game.");
      }
      
      // Build the transaction
      const transaction = new Transaction();
      
      transaction.add(
        new TransactionInstruction({
          keys: [
            { pubkey: this.gameStatePDA, isSigner: false, isWritable: true },
            { pubkey: this.vaultPDA, isSigner: false, isWritable: true },
            { pubkey: this.wallet.publicKey, isSigner: true, isWritable: true },
            { pubkey: SystemProgram.programId, isSigner: false, isWritable: false },
            { pubkey: this.configPDA, isSigner: false, isWritable: false },
            { pubkey: config.devWallet, isSigner: false, isWritable: true },
            { pubkey: new PublicKey(STAKING_PROGRAM_ID), isSigner: false, isWritable: true },
            { pubkey: new PublicKey(FEE_VAULT_PDA), isSigner: false, isWritable: true },
            { pubkey: new PublicKey(STAKING_CONFIG_ACC), isSigner: false, isWritable: false },
            { pubkey: this.metricsPDA, isSigner: false, isWritable: true },
          ],
          programId: this.programId,
          data: INSTRUCTION_DISCRIMINATORS.CLICK,
        })
      );

      return this.sendTransaction(transaction);
    } catch (error) {
      console.error("Error clicking button:", error);
      throw error;
    }
  }

  /**
   * Start a new game.
   */
  async startNewGame(): Promise<string> {
    try {
      // Verify wallet has enough SOL
      const balance = await this.connection.getBalance(
        this.wallet.publicKey,
        this.COMMITMENT_LEVELS.READ
      );
      
      if (balance < NEW_GAME_AMOUNT.toNumber()) {
        throw new Error(`Insufficient balance to start a new game. Need at least ${NEW_GAME_COST} SOL.`);
      }

      // Get or initialize config
      let config = await this.getConfig();
      if (!config) {
        await this.initializeConfig();
        config = await this.getConfig();
        if (!config) throw new Error("Config initialization failed");
      }
      
      if (!config.initialized) {
        throw new Error("Config not properly initialized");
      }
      
      // Get game state to determine first game or subsequent game
      const state = await this.getGameState();
      const isFirstGame = !state || state.startingTime.isZero();
      
      // For subsequent games, verify the game has ended
      if (!isFirstGame && Date.now() / 1000 < state.endgameTime.toNumber()) {
        throw new Error("Game hasn't ended yet. Current game is still active.");
      }

      // Determine previous winner
      const previousWinner = isFirstGame ? this.wallet.publicKey : state?.lastClicker;
      if (!previousWinner) {
        throw new Error("Unable to determine previous winner.");
      }

      // Build transaction
      const transaction = new Transaction();
      
      transaction.add(
        new TransactionInstruction({
          keys: [
            { pubkey: this.gameStatePDA, isSigner: false, isWritable: true },
            { pubkey: this.vaultPDA, isSigner: false, isWritable: true },
            { pubkey: this.wallet.publicKey, isSigner: true, isWritable: true },
            { pubkey: previousWinner, isSigner: false, isWritable: true },
            { pubkey: config.devWallet, isSigner: false, isWritable: true },
            { pubkey: new PublicKey(STAKING_PROGRAM_ID), isSigner: false, isWritable: true },
            { pubkey: new PublicKey(FEE_VAULT_PDA), isSigner: false, isWritable: true },
            { pubkey: new PublicKey(STAKING_CONFIG_ACC), isSigner: false, isWritable: false },
            { pubkey: this.configPDA, isSigner: false, isWritable: false },
            { pubkey: SystemProgram.programId, isSigner: false, isWritable: false },
            { pubkey: this.metricsPDA, isSigner: false, isWritable: true },
          ],
          programId: this.programId,
          data: INSTRUCTION_DISCRIMINATORS.START_NEW_GAME,
        })
      );

      return this.sendTransaction(transaction);
    } catch (error) {
      console.error("Error starting new game:", error);
      throw error;
    }
  }

  /**
   * Initialize configuration.
   * This is a private method now, only used internally by startNewGame if needed
   */
  private async initializeConfig(): Promise<string> {
    try {
      const transaction = new Transaction();
      
      transaction.add(
        new TransactionInstruction({
          keys: [
            { pubkey: this.configPDA, isSigner: false, isWritable: true },
            { pubkey: this.wallet.publicKey, isSigner: true, isWritable: true },
            { pubkey: SystemProgram.programId, isSigner: false, isWritable: false },
          ],
          programId: this.programId,
          data: INSTRUCTION_DISCRIMINATORS.INITIALIZE_CONFIG,
        })
      );

      return this.sendTransaction(transaction);
    } catch (error) {
      console.error("Error initializing config:", error);
      throw error;
    }
  }

  /**
   * Helper method to send transactions.
   * Updated to use wallet.sendTransaction for Phantom compatibility
   */
  private async sendTransaction(transaction: Transaction): Promise<string> {
    try {
      const blockhash = await this.connection.getLatestBlockhash(this.COMMITMENT_LEVELS.WRITE);
      transaction.recentBlockhash = blockhash.blockhash;
      transaction.feePayer = this.wallet.publicKey;
      
      // Use wallet.sendTransaction instead of provider.sendAndConfirm
      // This change helps bypass Phantom's phishing warning
      let signature;
      
      if (typeof this.wallet.sendTransaction === 'function') {
        // Use the wallet adapter's sendTransaction method which will handle signing and sending
        signature = await this.wallet.sendTransaction(transaction, this.connection, {
          skipPreflight: false,
          preflightCommitment: this.COMMITMENT_LEVELS.WRITE,
        });
      } else {
        // Fallback to provider method as before
        signature = await this.provider.sendAndConfirm(transaction, [], {
          commitment: this.COMMITMENT_LEVELS.WRITE
        });
      }
      
      // Wait for confirmation
      await this.connection.confirmTransaction({
        signature,
        blockhash: blockhash.blockhash,
        lastValidBlockHeight: blockhash.lastValidBlockHeight
      }, this.COMMITMENT_LEVELS.WRITE);
      
      return signature;
    } catch (error: unknown) {
      if (error instanceof Error) {
        logTransactionError(error);
        throw error;
      } else {
        throw new Error(String(error));
      }
    }
  }

  /**
   * Check if game is active.
   */
  isGameActive(gameState: GameStateView | null): boolean {
    if (!gameState || gameState.startingTime.isZero()) return false;
    return Date.now() / 1000 < gameState.endgameTime.toNumber();
  }
  
  /**
   * Get remaining time in seconds for current game.
   */
  getRemainingTime(gameState: GameStateView | null): number {
    if (!gameState || gameState.startingTime.isZero()) return 0;
    
    const now = Math.floor(Date.now() / 1000);
    const endTime = gameState.endgameTime.toNumber();
    return Math.max(0, endTime - now);
  }
  
  /**
   * Get current click cost based on game state
   */
  getCurrentClickCost(gameState: GameStateView | null): BN {
    // If no game state exists yet, or the game hasn't started yet,
    // or the game has ended - return NEW_GAME_AMOUNT
    if (
      !gameState ||
      gameState.startingTime.isZero() ||
      Math.floor(Date.now() / 1000) >= gameState.endgameTime.toNumber()
    ) {
      return NEW_GAME_AMOUNT;
    }
    
    // Game is active, return the progressive click cost
    if (gameState.currentClickAmount && !gameState.currentClickAmount.isZero()) {
      return gameState.currentClickAmount;
    }
    
    // Default amount if not set
    return DEFAULT_CLICK_AMOUNT;
  }
}