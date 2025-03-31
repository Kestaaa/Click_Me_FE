import React from 'react';
import { IconLoader2 } from '@tabler/icons-react';
import { NEW_GAME_COST } from '@/config';

interface ActionButtonProps {
  connected: boolean;
  needsNewGame: boolean;
  transactionLoading: boolean;
  handleButtonClick: () => Promise<void>;
  handleStartNewGame: () => Promise<void>;
  isClient: boolean;
  currentCost: string;
}

const ActionButton: React.FC<ActionButtonProps> = ({
  connected,
  needsNewGame,
  transactionLoading,
  handleButtonClick,
  handleStartNewGame,
  isClient,
  currentCost
}) => {
  if (!connected) {
    return (
      <div className="text-white text-center font-bold text-xl w-full">
        Please Connect Wallet
      </div>
    );
  } else if (needsNewGame) {
    return (
      <div className="flex justify-center w-full">
        <button
          className="btn appearance-none bg-gradient-to-r from-indigo-600 via-purple-600 to-pink-600 hover:from-indigo-700 hover:via-purple-700 hover:to-pink-700 text-white border-none px-6 py-3 font-bold rounded-lg inline-flex items-center justify-center rainbow-glow"
          onClick={handleStartNewGame}
          disabled={transactionLoading}
          style={{ lineHeight: '1' }}
        >
          {isClient && transactionLoading ? (
            <span className="flex items-center justify-center">
              <IconLoader2 size={20} className="animate-spin mr-2" />
              <span>Starting...</span>
            </span>
          ) : (
            `Start New Game (${NEW_GAME_COST} SOL)`
          )}
        </button>
      </div>
    );
  } else {
    return (
      <div className="flex justify-center w-full">
        <button
          className="btn bg-gradient-to-r from-indigo-600 via-purple-600 to-pink-600 hover:from-indigo-700 hover:via-purple-700 hover:to-pink-700 text-white border-none px-6 py-3 text-xl font-bold rounded-xl inline-flex items-center justify-center h-14 w-40 rainbow-glow transform-none"
          onClick={handleButtonClick}
          disabled={transactionLoading}
          style={{ lineHeight: '1' }}
        >
          {isClient && transactionLoading ? (
            <IconLoader2 size={24} className="animate-spin" />
          ) : (
            <span>CLICK ME!</span>
          )}
        </button>
      </div>
    );
  }
};

export default ActionButton;