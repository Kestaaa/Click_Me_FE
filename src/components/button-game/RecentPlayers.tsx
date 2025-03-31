import React from 'react';
import { IconCrown, IconFlame, IconLoader2 } from '@tabler/icons-react';
import { PublicKey } from "@solana/web3.js";
import { UniquePlayer } from './types';
import { formatPublicKey } from "@/lib/utils";

interface RecentPlayersProps {
  uniquePlayers: UniquePlayer[];
}

const RecentPlayers: React.FC<RecentPlayersProps> = ({ uniquePlayers }) => {
  // Create placeholder items to always show 5 rows when fewer than 5 players
  const placeholderCount = Math.max(0, 5 - uniquePlayers.length);
  const placeholders = Array(placeholderCount).fill(null);

  return (
    <div className="flex flex-col h-full">
      <h4 className="font-bold mb-3 text-center text-transparent bg-clip-text bg-gradient-to-r from-indigo-400 via-purple-400 to-pink-400 flex items-center justify-center text-xl">
        <IconFlame size={22} className="text-orange-500 mr-2" /> Recent Players
      </h4>
      
      {/* Container taking remaining height with scrollable content */}
      <div className="flex-1 bg-gradient-to-b from-gray-800 to-gray-900 rounded-lg shadow-xl border border-gray-700 overflow-hidden">
        {/* This is the key scrollable container */}
        <div className="h-full overflow-y-auto">
          {uniquePlayers.length > 0 ? (
            <div className="divide-y divide-gray-700">
              {uniquePlayers.map((player, index) => (
                <div 
                  key={index} 
                  className={`relative p-4 hover:bg-gray-750 transition-all duration-200 ${index === 0 ? 'bg-gradient-to-r from-purple-900/30 to-transparent border-l-4 border-purple-600' : ''}`}
                >
                  <div className="flex items-center justify-between">
                    <div className="flex items-center overflow-hidden">
                      <div className={`w-8 h-8 flex-shrink-0 rounded-full flex items-center justify-center mr-3 ${
                        index === 0 ? 'bg-purple-700' : 
                        index === 1 ? 'bg-blue-700' : 
                        index === 2 ? 'bg-green-700' : 'bg-gray-700'
                      }`}>
                        {index === 0 ? (
                          <IconCrown size={16} className="text-yellow-400" />
                        ) : (
                          <span className="text-xs text-white font-bold">{index + 1}</span>
                        )}
                      </div>
                      <div className="overflow-hidden">
                        <div className="font-mono font-medium truncate max-w-[120px] sm:max-w-full">
                          {formatPublicKey(new PublicKey(player.publicKey))}
                        </div>
                      </div>
                    </div>
                    
                    <div className="flex items-center space-x-2">
                      {player.count > 1 && (
                        <div className="bg-gray-800 py-1 px-2 rounded-full flex items-center">
                          <IconFlame size={16} className="text-orange-500 mr-1" />
                          <span className="text-xs font-bold text-orange-400">{player.count} clicks</span>
                        </div>
                      )}
                    </div>
                  </div>
                  
                  <div className="absolute bottom-2 right-3 flex space-x-1">
                    {Array.from({ length: Math.min(player.count, 5) }).map((_, i) => (
                      <div key={i} className={`w-1.5 h-1.5 rounded-full ${
                        i === 0 ? 'bg-green-500' : 
                        i === 1 ? 'bg-green-400' : 
                        i === 2 ? 'bg-green-300' : 
                        'bg-green-200'
                      }`}></div>
                    ))}
                  </div>
                </div>
              ))}
              
              {/* Placeholder items to maintain consistent height */}
              {placeholders.map((_, index) => (
                <div key={`placeholder-${index}`} className="relative p-4 opacity-30">
                  <div className="flex items-center justify-between">
                    <div className="flex items-center overflow-hidden">
                      <div className="w-8 h-8 flex-shrink-0 rounded-full flex items-center justify-center mr-3 bg-gray-700">
                        <span className="text-xs text-white font-bold">{uniquePlayers.length + index + 1}</span>
                      </div>
                      <div className="overflow-hidden">
                        <div className="font-mono font-medium truncate max-w-[120px] sm:max-w-full text-gray-500">
                          ―――――――――――――
                        </div>
                      </div>
                    </div>
                  </div>
                </div>
              ))}
            </div>
          ) : (
            <div className="flex flex-col items-center justify-center h-full p-6">
              <div className="opacity-50 mb-4">
                <IconLoader2 size={32} className="mx-auto text-gray-500 animate-spin" />
              </div>
              <p className="text-gray-500">Waiting for players to join...</p>
              <p className="text-xs text-gray-600 mt-2">Be the first to click!</p>
            </div>
          )}
        </div>
      </div>
      
      {uniquePlayers.length > 0 && (
        <div className="mt-3 flex justify-center">
          <div className="flex items-center text-xs text-gray-500">
            <div className="w-2 h-2 bg-green-500 rounded-full mr-2 animate-pulse"></div>
            Live activity
          </div>
        </div>
      )}
    </div>
  );
};

export default RecentPlayers;