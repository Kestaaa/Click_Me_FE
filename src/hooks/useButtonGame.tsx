'use client';

import { useState, useEffect, useMemo, createContext, useContext, ReactNode, useRef } from "react";
import { AnchorProvider, BN } from "@project-serum/anchor";
import { PublicKey, Transaction } from "@solana/web3.js";
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
 */
const getPollingInterval = (timeRemaining: number): number => {
  if (timeRemaining <= 0) return 5000;
  if (timeRemaining <= 1) return 1000;
  if (timeRemaining <= 5) return 1000;
  if (timeRemaining <= 10) return 1000;
  if (timeRemaining <= 30) return 5000;
  if (timeRemaining <= 60) return 10000;
  if (timeRemaining <= 120) return 20000;
  return 30000;
};

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

  // Refs for intervals and state caching
  const countdownIntervalRef = useRef<NodeJS.Timeout | null>(null);
  const pollingTimeoutRef = useRef<NodeJS.Timeout | null>(null);
  const cachedEndgameTimeRef = useRef<BN | null>(null);
  const gameDurationRef = useRef<number | null>(null);
  const timeLeftRef = useRef<number>(0);
  const isPollingRef = useRef<boolean>(false);
  const prevTimeLeftRef = useRef<number>(0);
  const gameJustEndedRef = useRef<boolean>(false);
  const hasPolledEndedGameRef = useRef<boolean>(false);

  // Dummy wallet for read-only RPC calls if needed
  const dummyWallet = useMemo(() => ({
    publicKey: new PublicKey("11111111111111111111111111111111"),
    signTransaction: async (tx: Transaction) => { throw new Error("Wallet not connected"); },
    signAllTransactions: async (txs: Transaction[]) => { throw new Error("Wallet not connected"); },
  }), []);

  const activeWallet = wallet || dummyWallet;

  const buttonGameClient = useMemo(() => {
    if (!connection || !activeWallet) return null;
    const provider = new AnchorProvider(connection, activeWallet, {
      commitment: "confirmed",
      preflightCommitment: "confirmed"
    });
    try {
      const client = new ButtonGameClient(provider);
      console.log("ButtonGameClient created successfully");
      return client;
    } catch (error) {
      console.error("Error creating ButtonGameClient:", error);
      return null;
    }
  }, [connection, activeWallet]);

  const fetchGameState = async (): Promise<void> => {
    if (!buttonGameClient || isPollingRef.current) return;
    isPollingRef.current = true;
    try {
      const stateResult = await buttonGameClient.getGameState();
      if (stateResult) {
        const now = Math.floor(Date.now() / 1000);
        const endTime = stateResult.endgameTime.toNumber();
        const startTime = stateResult.startingTime.toNumber();
        const gameDuration = endTime - startTime;
        if (gameDurationRef.current === null || gameDurationRef.current !== gameDuration) {
          gameDurationRef.current = gameDuration;
          console.log(`Cached game duration: ${gameDuration}s`);
        }
        // Log only the essential fetched state info.
        console.log(`Fetched game state - remaining time: ${endTime - now}s`);

        setGameState(stateResult);
        setCurrentClickCost(buttonGameClient.getCurrentClickCost(stateResult));
        const initialRemaining = endTime - now;
        setTimeLeft(initialRemaining);
        timeLeftRef.current = initialRemaining;

        const hasChangedEndgameTime = !cachedEndgameTimeRef.current || 
                                      !stateResult.endgameTime.eq(cachedEndgameTimeRef.current);
        if (hasChangedEndgameTime) {
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

  const fetchGameMetrics = async (): Promise<void> => {
    if (!buttonGameClient) return;
    try {
      const metricsResult = await buttonGameClient.getGameMetrics();
      if (metricsResult) {
        setGameMetrics(metricsResult);
        const entries = metricsResult.recentClickers.slice().reverse().map((pubkey) => ({
          contributor: pubkey,
          amount: new BN(0)
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

  const scheduleNextPoll = () => {
    if (pollingTimeoutRef.current) {
      clearTimeout(pollingTimeoutRef.current);
    }
    const currentTime = Math.floor(Date.now() / 1000);
    const remaining = timeLeftRef.current;
    const isGameEnded = gameState && gameState.startingTime && remaining <= 0;
                        
    console.log(`Polling: remaining=${remaining}s, isGameEnded=${isGameEnded}`);

    if (isGameEnded) {
      if (!hasPolledEndedGameRef.current) {
        console.log("Game ended - scheduling a single poll in 5 seconds");
        hasPolledEndedGameRef.current = true;
        pollingTimeoutRef.current = setTimeout(() => fetchGameState(), 5000);
      }
      return;
    }
    
    const interval = !wallet ? 60000 : getPollingInterval(remaining);
    console.log(`Next poll scheduled in ${interval}ms`);
    pollingTimeoutRef.current = setTimeout(() => fetchGameState(), interval);
  };

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

  const triggerRefresh = () => {
    console.log("Manual refresh triggered");
    gameJustEndedRef.current = false;
    hasPolledEndedGameRef.current = false;
    if (pollingTimeoutRef.current) {
      clearTimeout(pollingTimeoutRef.current);
      pollingTimeoutRef.current = null;
    }
    setRefreshTrigger(prev => prev + 1);
  };

  const clickButton = async (): Promise<string> => {
    if (!wallet) throw new Error("Please connect your wallet first");
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

  const startNewGame = async (): Promise<string> => {
    if (!wallet) throw new Error("Please connect your wallet first");
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

  const getDisplayCost = (): string => {
    const isGameActive = gameState && 
                         !gameState.startingTime.isZero() && 
                         Math.floor(Date.now() / 1000) < gameState.endgameTime.toNumber();
    if (!isGameActive) return NEW_GAME_COST.toFixed(3);
    return currentClickCost 
      ? (currentClickCost.toNumber() / 1_000_000_000).toFixed(3) 
      : INITIAL_CLICK_COST.toFixed(3);
  };

  useEffect(() => {
    const updateCountdown = () => {
      if (gameState && gameState.endgameTime && gameState.startingTime && gameDurationRef.current !== null) {
        const now = Math.floor(Date.now() / 1000);
        const startTime = gameState.startingTime.toNumber();
        const elapsed = now - startTime;
        let diff = gameDurationRef.current - elapsed;
        if (diff < 0) diff = 0;
        
        setTimeLeft(diff);
        timeLeftRef.current = diff;
        
        if (prevTimeLeftRef.current > 0 && diff === 0 && !gameJustEndedRef.current) {
          console.log("Game just ended");
          gameJustEndedRef.current = true;
          triggerRefresh();
        }
        prevTimeLeftRef.current = diff;
      }
    };
    updateCountdown();
    countdownIntervalRef.current = setInterval(updateCountdown, 1000);
    return () => {
      if (countdownIntervalRef.current) clearInterval(countdownIntervalRef.current);
    };
  }, [gameState]);

  useEffect(() => {
    if (buttonGameClient) fetchGameState();
    return () => {
      if (pollingTimeoutRef.current) clearTimeout(pollingTimeoutRef.current);
    };
  }, [buttonGameClient]);

  useEffect(() => {
    if (buttonGameClient && refreshTrigger > 0) refreshGameData();
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
