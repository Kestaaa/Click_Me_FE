'use client';

import { useState, useEffect, useMemo, createContext, useContext, ReactNode, useRef } from "react";
import { AnchorProvider, BN } from "@project-serum/anchor";
import { Connection, PublicKey, Transaction } from "@solana/web3.js";
import { useAnchorWallet, useConnection } from "@solana/wallet-adapter-react";
import { ButtonGameClient } from "@/lib/ButtonGameClient";
import {
  GameStateView,
  GameMetricsView,
  LeaderboardView,
  Config,
} from "@/lib/types";
import { NEW_GAME_COST, INITIAL_CLICK_COST } from "@/config";

// Define the context type
type ButtonGameContextType = {
  loading: boolean;
  gameState: GameStateView | null;
  gameMetrics: GameMetricsView | null;
  leaderboard: LeaderboardView | null;
  config: Config | null;
  error: string | null;
  timeLeft: number;
  currentClickCost: BN | null;
  clickButton: () => Promise<string>;
  startNewGame: () => Promise<string>;
  refreshGameData: () => Promise<void>;
  triggerRefresh: () => void;
  connected: boolean;
  getDisplayCost: () => string;
};

// Create context with default values
const ButtonGameContext = createContext<ButtonGameContextType>({
  loading: false,
  gameState: null,
  gameMetrics: null,
  leaderboard: null,
  config: null,
  error: null,
  timeLeft: 0,
  currentClickCost: null,
  clickButton: async () => "",
  startNewGame: async () => "",
  refreshGameData: async () => {},
  triggerRefresh: () => {},
  connected: false,
  getDisplayCost: () => NEW_GAME_COST.toFixed(3),
});

// Provider component
export const ButtonGameProvider = ({ children }: { children: ReactNode }) => {
  const value = useButtonGameState();
  return (
    <ButtonGameContext.Provider value={value}>
      {children}
    </ButtonGameContext.Provider>
  );
};

// Custom hook for consuming the context
export function useButtonGame() {
  return useContext(ButtonGameContext);
}

/**
 * Get polling interval based on remaining time.
 * Implements progressive polling to minimize RPC calls.
 */
const getPollingInterval = (timeRemaining: number): number => {
  if (timeRemaining <= 0) return 5000; // After game ends, poll every 5 seconds (only once)
  if (timeRemaining <= 1) return 1000; // Last second: every 1 second
  if (timeRemaining <= 5) return 1000; // Last 5 seconds: every 1 second
  if (timeRemaining <= 10) return 1000; // Last 10 seconds: every 1 second
  if (timeRemaining <= 30) return 5000; // Last 30 seconds: every 5 seconds
  if (timeRemaining <= 60) return 10000; // Last minute: every 10 seconds
  if (timeRemaining <= 120) return 20000; // 1-2 minutes: every 20 seconds
  return 30000; // Otherwise: every 30 seconds
};

// Main hook with all game state logic and optimized polling
function useButtonGameState(): ButtonGameContextType {
  const { connection } = useConnection();
  const wallet = useAnchorWallet();

  const [loading, setLoading] = useState(false);
  const [gameState, setGameState] = useState<GameStateView | null>(null);
  const [gameMetrics, setGameMetrics] = useState<GameMetricsView | null>(null);
  const [leaderboard, setLeaderboard] = useState<LeaderboardView | null>(null);
  const [config, setConfig] = useState<Config | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [timeLeft, setTimeLeft] = useState<number>(0);
  const [refreshTrigger, setRefreshTrigger] = useState<number>(0);
  const [currentClickCost, setCurrentClickCost] = useState<BN | null>(null);

  // Refs for managing intervals, caching, and polling flags
  const countdownIntervalRef = useRef<NodeJS.Timeout | null>(null);
  const pollingTimeoutRef = useRef<NodeJS.Timeout | null>(null);
  const cachedEndgameTimeRef = useRef<BN | null>(null);
  const isPollingRef = useRef<boolean>(false);
  const prevTimeLeftRef = useRef<number>(0);
  const gameJustEndedRef = useRef<boolean>(false);
  const hasPolledEndedGameRef = useRef<boolean>(false);

  // Define a dummy wallet for read-only RPC calls if no wallet is connected.
  const dummyWallet = useMemo(() => ({
    publicKey: new PublicKey("11111111111111111111111111111111"),
    signTransaction: async (tx: Transaction) => {
      throw new Error("Wallet not connected");
    },
    signAllTransactions: async (txs: Transaction[]) => {
      throw new Error("Wallet not connected");
    },
  }), []);

  const activeWallet = wallet || dummyWallet;

  // Create an AnchorProvider and ButtonGameClient only when connection or activeWallet changes.
  const buttonGameClient = useMemo(() => {
    if (!connection || !activeWallet) return null;
    const provider = new AnchorProvider(
      connection,
      activeWallet,
      { commitment: "confirmed", preflightCommitment: "confirmed" }
    );
    try {
      const client = new ButtonGameClient(provider);
      console.log("ButtonGameClient created successfully");
      return client;
    } catch (error) {
      console.error("Error creating ButtonGameClient:", error);
      return null;
    }
  }, [connection, activeWallet]);

  // Fetch game state from the client.
  const fetchGameState = async (): Promise<void> => {
    if (!buttonGameClient || isPollingRef.current) return;
    isPollingRef.current = true;
    try {
      const stateResult = await buttonGameClient.getGameState();
      if (stateResult) {
        setGameState(stateResult);
        const clickCost = buttonGameClient.getCurrentClickCost(stateResult);
        setCurrentClickCost(clickCost);
        const remainingTime = buttonGameClient.getRemainingTime(stateResult);
        setTimeLeft(remainingTime);
        // Check if the game state changed by comparing endgameTime.
        if (
          !cachedEndgameTimeRef.current || 
          !stateResult.endgameTime.eq(cachedEndgameTimeRef.current)
        ) {
          console.log("Game state changed, fetching metrics");
          cachedEndgameTimeRef.current = stateResult.endgameTime;
          await fetchGameMetrics();
        }
      }
    } catch (err) {
      console.error("Error fetching game state:", err);
    } finally {
      isPollingRef.current = false;
      scheduleNextPoll();
    }
  };

  // Fetch game metrics when the game state changes.
  const fetchGameMetrics = async (): Promise<void> => {
    if (!buttonGameClient) return;
    try {
      const metricsResult = await buttonGameClient.getGameMetrics();
      if (metricsResult) {
        setGameMetrics(metricsResult);
        const entries = metricsResult.recentClickers.slice().reverse().map((pubkey) => ({
          contributor: pubkey,
          amount: new BN(0) // Dummy value; not used in the UI
        }));
        setLeaderboard({
          gameCycle: metricsResult.currentGameId,
          entries,
          count: entries.length,
        });
      }
      if (!config) {
        const configResult = await buttonGameClient.getConfig();
        setConfig(configResult);
      }
    } catch (err) {
      console.error("Error fetching game metrics:", err);
    }
  };

  // Schedule the next polling call based on the remaining time.
  const scheduleNextPoll = () => {
    if (pollingTimeoutRef.current) {
      clearTimeout(pollingTimeoutRef.current);
    }
    // Reset the ended game poll flag when the game is active.
    if (timeLeft > 0) {
      hasPolledEndedGameRef.current = false;
    }
    // If game has ended, poll only once.
    if (timeLeft <= 0) {
      if (!hasPolledEndedGameRef.current) {
        console.log('Game just ended - polling once in 5 seconds, then stopping automatic polling');
        hasPolledEndedGameRef.current = true;
        pollingTimeoutRef.current = setTimeout(() => {
          fetchGameState();
        }, 5000);
      } else {
        console.log('Game has ended and already polled; automatic polling halted.');
      }
      return;
    }
    let interval: number;
    if (!wallet) {
      interval = 60000; // Poll once per minute if wallet not connected
    } else if (timeLeft <= 1) interval = 1000;
    else if (timeLeft <= 5) interval = 1000;
    else if (timeLeft <= 10) interval = 1000;
    else if (timeLeft <= 30) interval = 5000;
    else if (timeLeft <= 60) interval = 10000;
    else if (timeLeft <= 120) interval = 20000;
    else interval = 30000;
    console.log(`Scheduling next poll in ${interval}ms (remaining time: ${timeLeft}s, wallet connected: ${!!wallet})`);
    pollingTimeoutRef.current = setTimeout(() => {
      fetchGameState();
    }, interval);
  };

  // Full refresh for manual updates or after transactions.
  const refreshGameData = async (): Promise<void> => {
    if (!buttonGameClient) return;
    setLoading(true);
    setError(null);
    try {
      cachedEndgameTimeRef.current = null;
      await fetchGameState();
    } catch (err) {
      console.error("Error refreshing game data:", err);
      setError("Failed to load game data. Please try again.");
    } finally {
      setLoading(false);
    }
  };

  // Trigger a manual refresh.
  const triggerRefresh = () => {
    gameJustEndedRef.current = false;
    setRefreshTrigger(prev => prev + 1);
  };

  // Click button transaction.
  const clickButton = async (): Promise<string> => {
    if (!wallet) {
      throw new Error("Please connect your wallet first");
    }
    const isGameActive = gameState && 
                         !gameState.startingTime.isZero() && 
                         Math.floor(Date.now() / 1000) < gameState.endgameTime.toNumber();
    if (!isGameActive) {
      throw new Error(`No active game. Please start a new game first (costs ${NEW_GAME_COST} SOL).`);
    }
    setLoading(true);
    try {
      const tx = await buttonGameClient!.clickButton();
      triggerRefresh();
      return tx;
    } catch (err: any) {
      console.error("Error clicking button:", err);
      throw err;
    } finally {
      setLoading(false);
    }
  };

  // Start new game transaction.
  const startNewGame = async (): Promise<string> => {
    if (!wallet) {
      throw new Error("Please connect your wallet first");
    }
    setLoading(true);
    try {
      const tx = await buttonGameClient!.startNewGame();
      triggerRefresh();
      return tx;
    } catch (err: any) {
      console.error("Error starting new game:", err);
      throw err;
    } finally {
      setLoading(false);
    }
  };

  // Get the cost to display in the UI.
  const getDisplayCost = (): string => {
    const isGameActive = gameState && 
                         !gameState.startingTime.isZero() && 
                         Math.floor(Date.now() / 1000) < gameState.endgameTime.toNumber();
    if (!isGameActive) {
      return NEW_GAME_COST.toFixed(3);
    }
    return currentClickCost ? (currentClickCost.toNumber() / 1_000_000_000).toFixed(3) : INITIAL_CLICK_COST.toFixed(3);
  };

  // Local countdown timer (avoids extra RPC calls).
  useEffect(() => {
    const updateCountdown = () => {
      if (gameState && gameState.endgameTime) {
        const now = Math.floor(Date.now() / 1000);
        const endTime = gameState.endgameTime.toNumber();
        let diff = endTime - now;
        if (diff < 0) diff = 0;
        setTimeLeft(diff);
      }
    };
    updateCountdown();
    countdownIntervalRef.current = setInterval(updateCountdown, 1000);
    return () => {
      if (countdownIntervalRef.current) {
        clearInterval(countdownIntervalRef.current);
      }
    };
  }, [gameState]);

  // Start polling when the client is ready.
  useEffect(() => {
    if (buttonGameClient) {
      fetchGameState();
    }
    return () => {
      if (pollingTimeoutRef.current) {
        clearTimeout(pollingTimeoutRef.current);
      }
    };
  }, [buttonGameClient]);

  // Handle manual refresh trigger.
  useEffect(() => {
    if (buttonGameClient && refreshTrigger > 0) {
      refreshGameData();
    }
  }, [buttonGameClient, refreshTrigger]);

  return {
    loading,
    gameState,
    gameMetrics,
    leaderboard,
    config,
    error,
    timeLeft,
    currentClickCost,
    clickButton,
    startNewGame,
    refreshGameData,
    triggerRefresh,
    connected: !!wallet,
    getDisplayCost,
  };
}

export default useButtonGameState;
