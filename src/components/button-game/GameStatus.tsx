import React from 'react';
import { IconClock, IconCoins, IconCoin, IconRefresh } from '@tabler/icons-react';
import { formatTimeRemaining, formatSol } from "@/lib/utils";
import { NEW_GAME_COST } from '@/config'; // Import from config
import BN from 'bn.js';

interface GameStatusProps {
  gameActive: boolean;
  timeRemaining: number | null;
  vaultBalance: number | BN;
  currentCost: string;
}

const GameStatus: React.FC<GameStatusProps> = ({
  gameActive,
  timeRemaining,
  vaultBalance,
  currentCost
}) => {
  // Determine time display style based on remaining time
  const getTimeStyle = () => {
    if (!gameActive || timeRemaining === null) return "";
    if (timeRemaining < 10) return "text-red-400 animate-pulse font-bold";
    if (timeRemaining < 30) return "text-yellow-400";
    return "";
  };

  // Get class for status indicator dot
  const getStatusDotClass = () => {
    if (gameActive) {
      if (timeRemaining !== null && timeRemaining < 30) {
        return "bg-yellow-500 animate-pulse";
      }
      return "bg-green-500 animate-pulse";
    }
    return "bg-red-500";
  };

  return (
    <div className="grid grid-cols-2 gap-4 sm:gap-6">
      <div className="bg-gray-700 p-3 sm:p-5 rounded-lg text-center h-24 flex flex-col justify-center transform transition-transform hover:scale-105">
        <div className="text-sm text-gray-400 mb-1">Status</div>
        <div className={`font-bold text-lg ${gameActive ? "text-green-500" : "text-red-500"} flex items-center justify-center`}>
          <>
            <span className={`inline-block w-2 h-2 ${getStatusDotClass()} rounded-full mr-2`}></span>
            {gameActive ? "Active" : "Ended"}
          </>
        </div>
      </div>
      <div className="bg-gray-700 p-3 sm:p-5 rounded-lg text-center h-24 flex flex-col justify-center transform transition-transform hover:scale-105">
        <div className="text-sm text-gray-400 mb-1 flex items-center justify-center">
          Time Remaining
        </div>
        <div className="font-mono font-bold text-lg flex items-center justify-center">
          <IconClock size={18} className={`mr-2 ${timeRemaining !== null && timeRemaining < 30 ? "text-yellow-400" : "text-indigo-400"}`} />
          <span className={getTimeStyle()}>
            {timeRemaining !== null ? formatTimeRemaining(timeRemaining) : "Loading..."}
          </span>
        </div>
      </div>
      <div className="bg-gray-700 p-3 sm:p-5 rounded-lg text-center h-24 flex flex-col justify-center transform transition-transform hover:scale-105">
        <div className="text-sm text-gray-400 mb-1">Pot Size</div>
        <div className="font-bold text-lg flex items-center justify-center">
          <IconCoins size={18} className="mr-2 text-yellow-500" />
          <span className="text-yellow-400">{formatSol(vaultBalance)} SOL</span>
        </div>
      </div>
      <div className="bg-gray-700 p-3 sm:p-5 rounded-lg text-center h-24 flex flex-col justify-center transform transition-transform hover:scale-105">
        <div className="text-sm text-gray-400 mb-1">Current Click Cost</div>
        <div className="font-bold text-lg flex items-center justify-center">
          <IconCoin size={18} className="mr-2 text-green-500" />
          {gameActive ? (
            <span className="text-green-400">{currentCost} SOL</span>
          ) : (
            <span className="text-green-400">{NEW_GAME_COST} SOL</span>
          )}
        </div>
      </div>
    </div>
  );
};

export default GameStatus;