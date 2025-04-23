import React, { useState } from 'react';
import { IconClock, IconCoins, IconTrophy, IconUsers, IconBarChart } from '@tabler/icons-react';

interface ClientStats {
  id: number;
  rank: number;
  name: string;
  icon: string;
  timeAlive: string;
  tokensEarned: string;
  tokenSymbol: string;
  totalPlayers: number;
  totalVolume: string;
  clickRate: string;
  winRate: string;
  description: string;
}

const mockClients: ClientStats[] = [
  {
    id: 1,
    rank: 1,
    name: "BONK",
    icon: "/assets/bonk-icon.png",
    timeAlive: "2m10s",
    tokensEarned: "24.8m",
    tokenSymbol: "BONK",
    totalPlayers: 15420,
    totalVolume: "892.5m BONK",
    clickRate: "32.5/min",
    winRate: "68%",
    description: "The fastest-growing meme token game on Solana. Players compete in high-stakes clicking competitions with progressive rewards."
  },
  {
    id: 2,
    rank: 2,
    name: "Popcat",
    icon: "/assets/popcat-icon.png",
    timeAlive: "1m01s",
    tokensEarned: "124.8m",
    tokenSymbol: "POPCAT",
    totalPlayers: 12350,
    totalVolume: "1.2b POPCAT",
    clickRate: "28.3/min",
    winRate: "62%",
    description: "Community-driven clicking game with unique NFT rewards and daily tournaments."
  },
  {
    id: 3,
    rank: 3,
    name: "cat in a dogs world",
    icon: "/assets/cat-icon.png",
    timeAlive: "2m10s",
    tokensEarned: "24.8m",
    tokenSymbol: "MEW",
    totalPlayers: 8940,
    totalVolume: "458.6m MEW",
    clickRate: "25.1/min",
    winRate: "58%",
    description: "The ultimate cat-themed gaming experience with progressive difficulty and dynamic rewards."
  }
];

const CliquesPage: React.FC = () => {
  const [expandedClient, setExpandedClient] = useState<number | null>(null);

  const handleBetClick = (clientName: string) => {
    // Placeholder function for handling the bet click
    alert(`Betting on ${clientName}'s game! (Functionality to be implemented)`);
  };

  return (
    <div className="min-h-screen bg-zinc-900 text-gray-300 flex flex-col items-center py-10 px-4">
      <h1 className="text-4xl font-bold mb-4 bg-clip-text text-transparent bg-gradient-to-r from-purple-400 via-pink-400 to-red-400">
        Click Me Cliques
      </h1>
      <p className="text-lg text-gray-400 mb-8 text-center max-w-2xl">
        Discover the top performing Click Me game implementations. These clients combine competitive gameplay with unique token economies.
      </p>

      <div className="w-full max-w-3xl space-y-4">
        {mockClients.map((client) => (
          <div
            key={client.id}
            className={`rounded-lg transition-all duration-300 ${
              client.rank === 1 ? 'bg-gradient-to-r from-amber-500/20 to-yellow-500/5' :
              client.rank === 2 ? 'bg-gradient-to-r from-gray-500/20 to-gray-600/5' :
              client.rank === 3 ? 'bg-gradient-to-r from-orange-800/20 to-orange-700/5' : 
              'bg-gray-800/50'
            }`}
          >
            <button
              onClick={() => setExpandedClient(expandedClient === client.id ? null : client.id)}
              className="w-full p-4"
            >
              <div className="flex items-center justify-between">
                <div className="flex items-center space-x-4">
                  <div className="flex items-center space-x-3">
                    <span className={`text-xl font-bold ${
                      client.rank === 1 ? 'text-amber-400' :
                      client.rank === 2 ? 'text-gray-400' :
                      client.rank === 3 ? 'text-orange-700' : 'text-gray-500'
                    }`}>#{client.rank}</span>
                    <div className="w-10 h-10 bg-gray-700 rounded-full overflow-hidden">
                      <div className="w-full h-full bg-gradient-to-br from-gray-600 to-gray-800" />
                    </div>
                  </div>
                  <div className="flex flex-col">
                    <span className="text-xl font-medium">{client.name}</span>
                    <div className="flex items-center space-x-2 text-sm text-gray-400">
                      <IconUsers size={14} />
                      <span>{client.totalPlayers.toLocaleString()} players</span>
                    </div>
                  </div>
                </div>
                
                <div className="flex items-center space-x-6">
                  <div className="flex items-center space-x-2">
                    <IconClock size={18} className="text-gray-400" />
                    <span className="text-gray-300">{client.timeAlive}</span>
                  </div>
                  
                  <div className="flex items-center space-x-2">
                    <IconCoins size={18} className="text-yellow-500" />
                    <span className="text-gray-300">{client.tokensEarned}</span>
                    <span className="text-gray-400">{client.tokenSymbol}</span>
                  </div>
                  
                  <svg
                    className={`w-6 h-6 transform transition-transform ${
                      expandedClient === client.id ? 'rotate-180' : ''
                    }`}
                    fill="none"
                    stroke="currentColor"
                    viewBox="0 0 24 24"
                  >
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 9l-7 7-7-7" />
                  </svg>
                </div>
              </div>
            </button>
            
            {expandedClient === client.id && (
              <div className="px-4 pb-4">
                <div className="bg-black/30 rounded-lg p-4 space-y-4">
                  <p className="text-gray-300">{client.description}</p>
                  
                  <div className="grid grid-cols-1 md:grid-cols-3 gap-4 mt-4">
                    <div className="bg-black/30 p-3 rounded-lg">
                      <div className="flex items-center space-x-2 text-gray-400 mb-1">
                        <IconCoins size={16} />
                        <span>Volume</span>
                      </div>
                      <div className="text-lg font-medium text-gray-200">{client.totalVolume}</div>
                    </div>
                    
                    <div className="bg-black/30 p-3 rounded-lg">
                      <div className="flex items-center space-x-2 text-gray-400 mb-1">
                        <IconBarChart size={16} />
                        <span>Click Rate</span>
                      </div>
                      <div className="text-lg font-medium text-gray-200">{client.clickRate}</div>
                    </div>
                    
                    <div className="bg-black/30 p-3 rounded-lg">
                      <div className="flex items-center space-x-2 text-gray-400 mb-1">
                        <IconTrophy size={16} />
                        <span>Win Rate</span>
                      </div>
                      <div className="text-lg font-medium text-gray-200">{client.winRate}</div>
                    </div>
                  </div>
                </div>
                <button
                  className="inline-flex items-center justify-center rounded-md text-sm font-medium transition-colors focus:outline-none focus:ring-2 focus:ring-slate-400 focus:ring-offset-2 disabled:opacity-50 disabled:pointer-events-none data-[state=open]:bg-slate-100 bg-emerald-500 text-white hover:bg-emerald-600 h-9 px-4 py-2"
                  onClick={() => handleBetClick(client.name)}
                >
                  CLICK ME
                </button>
              </div>
            )}
          </div>
        ))}
      </div>
      
      <p className="text-sm text-gray-500 mt-10">
        Note: These statistics are placeholders. Real data will be integrated when the Click Me team implements the Solana programs.
      </p>
    </div>
  );
};

export default CliquesPage;