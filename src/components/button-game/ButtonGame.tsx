import React, { useEffect, useState, useMemo, useCallback } from "react";
import { useButtonGame } from "@/hooks/useButtonGame";
import { useWallet } from "@solana/wallet-adapter-react";
import toast from "react-hot-toast";
import { IconCoin } from "@tabler/icons-react";
import { buttonGlowStyle } from "./animations";
import ActionButton from "./ActionButton";
import GameStatus from "./GameStatus";
import GameRules from "./GameRules";
import GameMetrics from "./GameMetrics";
import RecentPlayers from "./RecentPlayers";
import RewardBanner from "./RewardBanner";
import { UniquePlayer, ToastStyles } from "./types";

const toastStyles: ToastStyles = {
  success: {
    style: { background: "#34d399", color: "white" },
    iconTheme: { primary: "white", secondary: "#34d399" },
  },
  error: {
    style: { background: "#f87171", color: "white" },
    iconTheme: { primary: "white", secondary: "#f87171" },
  },
  loading: {
    style: { background: "#60a5fa", color: "white" },
  },
};

const getPollingStatusMessage = (timeRemaining: number, isWalletConnected: boolean): string => {
  if (!isWalletConnected) return "Connect wallet for live updates";
  if (timeRemaining <= 0) return "Game has ended";
  if (timeRemaining <= 5) return "Final countdown";
  if (timeRemaining <= 30) return "Almost over";
  if (timeRemaining <= 60) return "Last minute";
  if (timeRemaining <= 120) return "Underway";
  return "In progress";
};

const ButtonGame: React.FC = () => {
  const { publicKey, connected } = useWallet();
  const {
    loading: isLoading,
    gameState,
    gameMetrics,
    leaderboard,
    timeLeft: timeRemaining,
    clickButton,
    startNewGame,
    refreshGameData,
    currentClickCost,
    getDisplayCost,
  } = useButtonGame();

  const [needsNewGame, setNeedsNewGame] = useState(false);
  const [isClient, setIsClient] = useState(false);
  const [transactionLoading, setTransactionLoading] = useState(false);
  const [isAnimating, setIsAnimating] = useState(false);

  useEffect(() => {
    setIsClient(true);
  }, []);

  const triggerCascade = useCallback(() => {
    setIsAnimating(true);
    setTimeout(() => setIsAnimating(false), 1500);
  }, []);

  useEffect(() => {
    triggerCascade();
    const intervalId = setInterval(triggerCascade, 7000);
    return () => clearInterval(intervalId);
  }, [triggerCascade]);

  // Calculate game status
  const gameActive = gameState && timeRemaining !== null && timeRemaining > 0;
  const vaultBalance = gameState?.vaultBalance || 0;
  const lastClicker = gameState?.lastClicker || null;
  const currentCost = getDisplayCost();

  const uniquePlayers = useMemo(() => {
    if (!leaderboard || leaderboard.count === 0) return [];
    const freqMap: { [key: string]: number } = {};
    const uniqueList: UniquePlayer[] = [];
    leaderboard.entries.forEach((entry) => {
      const pk = entry.contributor.toString();
      freqMap[pk] = (freqMap[pk] || 0) + 1;
      if (!uniqueList.some((item) => item.publicKey === pk)) {
        uniqueList.push({ publicKey: pk, count: 0 });
      }
    });
    uniqueList.forEach((item) => (item.count = freqMap[item.publicKey]));
    return uniqueList.slice(0, 5);
  }, [leaderboard]);

  const formattedMetrics = gameMetrics
    ? {
        currentGameId: gameMetrics.currentGameId.toString(),
        totalClicks: gameMetrics.totalClicksAllTime.toString(),
        totalSolContributed: gameMetrics.totalSolSpentAllTime,
        currentGameClicks: gameMetrics.currentGameClicks.toString(),
      }
    : null;

  useEffect(() => {
    if (gameState) {
      setNeedsNewGame(!gameActive);
    } else {
      setNeedsNewGame(true);
    }
  }, [gameState, gameActive]);

  const handleButtonClick = async () => {
    setTransactionLoading(true);
    toast.loading("Processing transaction...", { id: "transaction", ...toastStyles.loading });
    try {
      await clickButton();
      toast.success("Button clicked successfully!", { id: "transaction", ...toastStyles.success });
      setTimeout(refreshGameData, 2000);
    } catch (error) {
      console.error(error);
      const errorMsg = error instanceof Error ? error.message : String(error);
      toast.error(errorMsg, { id: "transaction", ...toastStyles.error });
    } finally {
      setTransactionLoading(false);
    }
  };

  const handleStartNewGame = async () => {
    setTransactionLoading(true);
    toast.loading("Starting new game...", { id: "transaction", ...toastStyles.loading });
    try {
      await startNewGame();
      toast.success("New game started!", { id: "transaction", ...toastStyles.success });
      setTimeout(refreshGameData, 2000);
    } catch (error) {
      console.error(error);
      const errorMsg = error instanceof Error ? error.message : String(error);
      toast.error(errorMsg, { id: "transaction", ...toastStyles.error });
    } finally {
      setTransactionLoading(false);
    }
  };

  return (
    <div className="w-full max-w-5xl mx-auto overflow-x-hidden">
      <style dangerouslySetInnerHTML={{ __html: buttonGlowStyle }} />

      <div className="relative flex flex-col justify-center items-center mb-16 mt-8 pt-6">
        <div className="absolute w-56 h-56 bg-gradient-to-br from-indigo-900/40 via-purple-900/30 to-pink-900/40 rounded-full blur-xl"></div>
        <div className="absolute w-full h-full pointer-events-none" style={{ zIndex: 15 }}>
          <div
            className="absolute left-1/4 top-5 text-yellow-500 animate-[float_4s_ease-in-out_infinite]"
            style={{ animationDelay: "-0.5s" }}
          >
            <IconCoin size={24} />
          </div>
          <div
            className="absolute right-1/4 top-1/3 text-yellow-400 animate-[float_3.5s_ease-in-out_infinite]"
            style={{ animationDelay: "-1.5s" }}
          >
            <IconCoin size={18} />
          </div>
          <div
            className="absolute left-1/3 bottom-0 text-yellow-300 animate-[float_5s_ease-in-out_infinite]"
            style={{ animationDelay: "-2.5s" }}
          >
            <IconCoin size={22} />
          </div>
        </div>
        <h2 className="text-6xl font-black text-center relative z-10 mb-4 tracking-tighter max-w-full px-2">
          <div className={`cascade-container ${isAnimating ? "animating" : ""}`}>
            <span className="click-me-letter" style={{ animationDelay: "0s" }}>
              C
            </span>
            <span className="click-me-letter" style={{ animationDelay: "0.1s" }}>
              L
            </span>
            <span className="click-me-letter" style={{ animationDelay: "0.2s" }}>
              I
            </span>
            <span className="click-me-letter" style={{ animationDelay: "0.3s" }}>
              C
            </span>
            <span className="click-me-letter" style={{ animationDelay: "0.4s" }}>
              K
            </span>
            <span className="click-me-letter mx-2" style={{ animationDelay: "0.5s" }}>
              -
            </span>
            <span className="click-me-letter" style={{ animationDelay: "0.6s" }}>
              M
            </span>
            <span className="click-me-letter" style={{ animationDelay: "0.7s" }}>
              E
            </span>
            <span className="click-me-letter" style={{ animationDelay: "0.8s" }}>
              !
            </span>
          </div>
        </h2>
        <div className="text-lg font-semibold text-center bg-clip-text text-transparent bg-gradient-to-r from-indigo-400 via-purple-400 to-pink-400 px-4 w-full">
          Last clicker takes the pot!
        </div>
        
        <div className="relative mt-2 w-80 max-w-[90%] h-1">
          <div className="absolute inset-0 bg-gradient-to-r from-purple-600 via-pink-600 to-red-600"></div>
          <div className="absolute inset-0 bg-gradient-to-r from-purple-400 via-pink-500 to-red-500 animate-pulse"></div>
        </div>
        <div className="absolute top-1/2 w-3/4 h-20 bg-purple-500/20 blur-3xl rounded-full -z-10"></div>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* Left Card */}
        <div className="card bg-gray-800 border border-gray-700 rounded-xl shadow-lg">
          <div className="card-body flex flex-col p-6">
            {gameState ? (
              <div className="space-y-8 flex-grow flex flex-col">
                <GameStatus
                  gameActive={!!gameActive}
                  timeRemaining={timeRemaining}
                  vaultBalance={vaultBalance}
                  currentCost={currentCost}
                />
                <div className="flex-grow flex flex-col items-center justify-center mt-6">
                  <GameRules />
                </div>
                <ActionButton
                  connected={connected}
                  needsNewGame={needsNewGame}
                  transactionLoading={transactionLoading}
                  handleButtonClick={handleButtonClick}
                  handleStartNewGame={handleStartNewGame}
                  isClient={isClient}
                  currentCost={currentCost}
                />
              </div>
            ) : (
              <div className="flex-grow flex flex-col items-center justify-center py-8">
                <p className="mb-6 text-gray-400">No active game found</p>
                <ActionButton
                  connected={connected}
                  needsNewGame={needsNewGame}
                  transactionLoading={transactionLoading}
                  handleButtonClick={handleButtonClick}
                  handleStartNewGame={handleStartNewGame}
                  isClient={isClient}
                  currentCost={currentCost}
                />
              </div>
            )}
          </div>
        </div>

        {/* Right Card: Metrics, Reward Banner, and RecentPlayers */}
        <div className="card bg-gray-800 border border-gray-700 rounded-xl shadow-lg">
          <div className="card-body flex flex-col p-6">
            {formattedMetrics ? (
              <div className="flex flex-col h-full">
                {/* Fixed-size top section for metrics */}
                <GameMetrics
                  formattedMetrics={formattedMetrics}
                  lastClicker={lastClicker}
                  gameActive={!!gameActive}
                  publicKey={publicKey}
                />
                
                {/* Fixed-height container for reward banner and players list */}
                <div className="flex flex-col" style={{ height: '400px' }}>
                  {/* Only rendered when game is not active and there's a last clicker */}
                  {!gameActive && lastClicker && (
                    <RewardBanner
                      lastClicker={lastClicker}
                      publicKey={publicKey}
                    />
                  )}
                  
                  {/* This container will take all remaining height */}
                  <div className="flex-1 overflow-hidden">
                    <RecentPlayers uniquePlayers={uniquePlayers} />
                  </div>
                </div>
              </div>
            ) : (
              <div className="flex-grow flex flex-col items-center justify-center">
                <p className="mb-6 text-center text-gray-400">Game metrics not available</p>
              </div>
            )}
          </div>
        </div>
      </div>
    </div>
  );
};

export default ButtonGame;