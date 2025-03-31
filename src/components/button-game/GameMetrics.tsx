import React from 'react';
import { IconCrown } from '@tabler/icons-react';
import { PublicKey } from "@solana/web3.js";
import { FormattedMetrics } from './types';
import { formatPublicKey, formatSol } from "@/lib/utils";

interface GameMetricsProps {
  formattedMetrics: FormattedMetrics;
  lastClicker: PublicKey | null;
  gameActive: boolean;
  publicKey: PublicKey | null;
}

const GameMetrics: React.FC<GameMetricsProps> = ({
  formattedMetrics,
  lastClicker,
  gameActive,
  publicKey
}) => {
  return (
    <div className="mb-6">
      <div className="grid grid-cols-2 gap-4">
        <div className="bg-gray-700 p-4 rounded-lg text-center">
          <div className="text-sm text-gray-400">Game #</div>
          <div className="font-bold">{formattedMetrics.currentGameId}</div>
        </div>
        <div className="bg-gray-700 p-4 rounded-lg text-center">
          <div className="text-sm text-gray-400">Total Clicks (All Time)</div>
          <div className="font-bold">{formattedMetrics.totalClicks}</div>
        </div>
      </div>
      <div className="grid grid-cols-2 gap-4 mt-4">
        <div className="bg-gray-700 p-4 rounded-lg text-center">
          <div className="text-sm text-gray-400">Current Winner</div>
          <div className="font-bold flex items-center justify-center">
            {lastClicker ? (
              publicKey && lastClicker && lastClicker.equals(publicKey) ? (
                <>
                  <IconCrown size={18} className="mr-2 text-yellow-500" />
                  <span className="text-yellow-300">YOU!</span>
                </>
              ) : (
                <>
                  <IconCrown size={18} className="mr-2 text-yellow-500" />
                  <span className="text-yellow-400 truncate">{formatPublicKey(lastClicker)}</span>
                </>
              )
            ) : (
              "No clicks yet"
            )}
          </div>
        </div>
        <div className="bg-gray-700 p-4 rounded-lg text-center">
          <div className="text-sm text-gray-400">Total SOL Contributed</div>
          <div className="font-bold">
            {formatSol(formattedMetrics.totalSolContributed)} SOL
          </div>
        </div>
      </div>
    </div>
  );
};

export default GameMetrics;