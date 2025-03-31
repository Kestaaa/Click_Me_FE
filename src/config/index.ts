// src/config/index.ts
import { WalletAdapterNetwork } from "@solana/wallet-adapter-base";
import { clusterApiUrl, PublicKey } from "@solana/web3.js";
import buttonConfig from "./button-config.json";
import stakingConfig from "./staking-config.json";

// Set the active network based on environment variable or default to Mainnet
const ACTIVE_NETWORK: WalletAdapterNetwork = process.env.NEXT_PUBLIC_NETWORK === "devnet" 
  ? WalletAdapterNetwork.Devnet
  : WalletAdapterNetwork.Mainnet;

export const network = ACTIVE_NETWORK;

export const isMainnet = (): boolean => ACTIVE_NETWORK === WalletAdapterNetwork.Mainnet;
export const isDevnet = (): boolean => !isMainnet();

export const getNetworkName = (): string => (isMainnet() ? "Mainnet" : "Devnet");

// Mainnet endpoint - prioritize environment variable
export const MAINNET_RPC_URL =
  process.env.NEXT_PUBLIC_SOLANA_RPC_URL ||
  process.env.NEXT_PUBLIC_MAINNET_RPC_URL ||
  "https://mainnet.helius-rpc.com/";

// Devnet endpoint - prioritize environment variable
export const DEVNET_RPC_URL = 
  process.env.NEXT_PUBLIC_SOLANA_RPC_URL ||
  process.env.NEXT_PUBLIC_DEVNET_RPC_URL || 
  clusterApiUrl("devnet");

// Use active endpoint based on network
export const endpoint = isMainnet() ? MAINNET_RPC_URL : DEVNET_RPC_URL;

// Program IDs and configuration
export const PROGRAM_ID = new PublicKey(
  process.env.NEXT_PUBLIC_BUTTON_GAME_PROGRAM_ID || 
  buttonConfig.programId
);

export const FALLBACK_WALLET = new PublicKey(buttonConfig.fallbackWallet);
export const STAKING_CONFIG_ACC = new PublicKey(buttonConfig.stakingConfigAccount);
export const FEE_VAULT_PDA = new PublicKey(buttonConfig.stakingFeeVaultPda);
export const GAME_STATE_SEED = "game_state_v3"; // Updated to v3
export const CONFIG_SEED = "config";
export const VAULT_SEED = "vault";
export const METRICS_SEED = "game_metrics";
export const LEADERBOARD_SEED = "leaderboard";
export const CONTRIBUTION_SEED = "contribution";

// Game configuration
export const INITIAL_CLICK_COST = 0.01; // in SOL
export const CLICK_INCREMENT = 0.01;    // in SOL
export const NEW_GAME_COST = 3;         // in SOL

// Staking program configuration
export const STAKING_PROGRAM_ID = new PublicKey(
  process.env.NEXT_PUBLIC_STAKING_PROGRAM_ID || 
  stakingConfig.programId
);

export const STAKING_TOKEN_MINT = new PublicKey(stakingConfig.tokenMint);

// Token live yes/no?
export const IS_TOKEN_LIVE = process.env.NEXT_PUBLIC_TOKEN_LIVE === "true" || false;