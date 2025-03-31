import BN from 'bn.js';
import { PublicKey } from '@solana/web3.js';
import { ButtonGameClient } from '@/lib/ButtonGameClient';

export interface ToastStyles {
  success: {
    style: {
      background: string;
      color: string;
    };
    iconTheme: {
      primary: string;
      secondary: string;
    };
  };
  error: {
    style: {
      background: string;
      color: string;
    };
    iconTheme: {
      primary: string;
      secondary: string;
    };
  };
  loading: {
    style: {
      background: string;
      color: string;
    };
  };
}

export interface FormattedMetrics {
  currentGameId: string;
  totalClicks: string;
  totalSolContributed: BN | number;
  currentGameClicks: string;
}

export interface UniquePlayer {
  publicKey: string;
  count: number;
}

// New interfaces for the ButtonGame context
export interface GameStateView {
  startingTime: BN;
  endgameTime: BN;
  lastClicker: PublicKey;
  vaultBalance: BN;
  currentClickAmount: BN;
  clickCount: BN;
}

export interface GameMetricsView {
  totalGames: BN;
  totalClicksAllTime: BN;
  totalSolSpentAllTime: BN;
  currentGameId: BN;
  currentGameClicks: BN;
  recentClickers: PublicKey[];
}

export interface ButtonGameContextType {
  client: ButtonGameClient | null;
  gameState: GameStateView | null;
  gameMetrics: GameMetricsView | null;
  isLoading: boolean;
  isGameActive: boolean;
  clickButton: () => Promise<string | undefined>;
  startNewGame: () => Promise<string | undefined>;
  refreshData: () => void;
  clickCost: string;
  remainingTime: number;
}