import React from 'react';
import Tooltip from '@/components/ui/Tooltip';
import { NEW_GAME_COST, INITIAL_CLICK_COST, CLICK_INCREMENT } from '@/config'; // Import from config

const GameRules: React.FC = () => {
  const tooltipContent = (
    <div className="space-y-3">
      <div className="flex items-start">
        <div className="flex-shrink-0 w-5 h-5 rounded-full bg-gradient-to-br from-indigo-500 to-violet-600 flex items-center justify-center mr-2 mt-0.5 text-white text-xs font-bold">1</div>
        <div>
          <p className="text-sm text-white font-medium">Starting a game</p>
          <p className="text-xs text-gray-400 mt-0.5">Pay {NEW_GAME_COST} SOL to start a new game with a 3 minute timer</p>
        </div>
      </div>
      <div className="flex items-start">
        <div className="flex-shrink-0 w-5 h-5 rounded-full bg-gradient-to-br from-indigo-500 to-violet-600 flex items-center justify-center mr-2 mt-0.5 text-white text-xs font-bold">2</div>
        <div>
          <p className="text-sm text-white font-medium">Clicking the button</p>
          <p className="text-xs text-gray-400 mt-0.5">First click costs {INITIAL_CLICK_COST} SOL. Each click adds to the pot and resets timer to 3 minutes</p>
        </div>
      </div>
      <div className="flex items-start">
        <div className="flex-shrink-0 w-5 h-5 rounded-full bg-gradient-to-br from-indigo-500 to-violet-600 flex items-center justify-center mr-2 mt-0.5 text-white text-xs font-bold">3</div>
        <div>
          <p className="text-sm text-white font-medium">Increasing costs</p>
          <p className="text-xs text-gray-400 mt-0.5">Each click increases the next click cost by {CLICK_INCREMENT} SOL</p>
        </div>
      </div>
      <div className="flex items-start">
        <div className="flex-shrink-0 w-5 h-5 rounded-full bg-gradient-to-br from-indigo-500 to-violet-600 flex items-center justify-center mr-2 mt-0.5 text-white text-xs font-bold">4</div>
        <div>
          <p className="text-sm text-white font-medium">Winning the pot</p>
          <p className="text-xs text-gray-400 mt-0.5">When timer expires, the last person to click wins the entire pot!</p>
        </div>
      </div>
    </div>
  );

  const tooltipIcon = (
    <svg className="h-4 w-4 text-indigo-300" viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg">
      <path d="M12 16V12M12 8H12.01M22 12C22 17.5228 17.5228 22 12 22C6.47715 22 2 17.5228 2 12C2 6.47715 6.47715 2 12 2C17.5228 2 22 6.47715 22 12Z" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"/>
    </svg>
  );

  return (
    <div className="w-full bg-gray-700 rounded-lg p-4 mb-6">
      <div className="flex items-center justify-between mb-2">
        <span className="text-sm text-gray-400">Game Rules</span>
        <div className="h-px bg-gray-600 flex-grow mx-3"></div>
        
        <Tooltip 
          title="HOW TO PLAY" 
          badge="GAME RULES" 
          icon={tooltipIcon}
          content={tooltipContent}
        >
          <button className="w-6 h-6 rounded-full bg-indigo-600 hover:bg-indigo-700 flex items-center justify-center text-white font-semibold text-xs shadow-md transition-colors cursor-pointer ring-2 ring-indigo-400/30">
            i
          </button>
        </Tooltip>
      </div>

      <div className="space-y-2">
        <div className="flex items-center">
          <div className="w-6 h-6 rounded-full bg-indigo-900 flex items-center justify-center mr-2">
            <span className="text-xs text-indigo-400">1</span>
          </div>
          <span className="text-xs text-gray-300 overflow-hidden text-ellipsis">New game: <span className="font-bold text-white">{NEW_GAME_COST} SOL</span></span>
        </div>
        <div className="flex items-center">
          <div className="w-6 h-6 rounded-full bg-indigo-900 flex items-center justify-center mr-2">
            <span className="text-xs text-indigo-400">2</span>
          </div>
          <span className="text-xs text-gray-300 overflow-hidden text-ellipsis">First click: <span className="font-bold text-white">{INITIAL_CLICK_COST} SOL</span></span>
        </div>
        <div className="flex items-center">
          <div className="w-6 h-6 rounded-full bg-indigo-900 flex items-center justify-center mr-2">
            <span className="text-xs text-indigo-400">3</span>
          </div>
          <span className="text-xs text-gray-300 overflow-hidden text-ellipsis">Each click increases by <span className="font-bold text-white">{CLICK_INCREMENT} SOL</span></span>
        </div>
        <div className="flex items-center">
          <div className="w-6 h-6 rounded-full bg-indigo-900 flex items-center justify-center mr-2">
            <span className="text-xs text-indigo-400">4</span>
          </div>
          <span className="text-xs text-gray-300 overflow-hidden text-ellipsis">Click resets timer to <span className="font-bold text-white">3m00s</span></span>
        </div>
        <div className="flex items-center">
          <div className="w-6 h-6 rounded-full bg-indigo-900 flex items-center justify-center mr-2">
            <span className="text-xs text-indigo-400">5</span>
          </div>
          <span className="text-xs text-gray-300 overflow-hidden text-ellipsis">Last person to click the button when timer runs out <span className="font-bold text-white">wins the pot!</span></span>
        </div>
        <div className="flex items-center">
          <div className="w-6 h-6 rounded-full bg-indigo-900 flex items-center justify-center mr-2">
            <span className="text-xs text-indigo-400">6</span>
          </div>
          <span className="text-xs text-gray-300 overflow-hidden text-ellipsis">Rewards paid when the next game starts!</span>
        </div>
      </div>
    </div>
  );
};

export default GameRules;