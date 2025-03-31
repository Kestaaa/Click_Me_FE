// RewardBanner.tsx
import React from 'react';
import { IconCrown } from '@tabler/icons-react';
import { PublicKey } from "@solana/web3.js";
import { formatPublicKey } from "@/lib/utils";

interface RewardBannerProps {
  lastClicker: PublicKey;
  publicKey?: PublicKey | null;
}

const RewardBanner: React.FC<RewardBannerProps> = ({ lastClicker, publicKey }) => {
  return (
    <div className="bg-yellow-900 bg-opacity-30 border border-yellow-800 rounded-lg p-3 mb-3 transition-all duration-300">
      <div className="flex flex-col items-center text-center">
        {publicKey && lastClicker && lastClicker.equals(publicKey) ? (
          <p className="text-sm text-yellow-400">
            <span className="font-bold">
              Congratulations! <span className="text-yellow-300">You</span> won the pot!
            </span>
          </p>
        ) : (
          <p className="text-sm text-yellow-400">
            <span className="font-bold">{formatPublicKey(lastClicker)}</span> won the pot!
          </p>
        )}
        <p className="text-sm text-yellow-400 mt-1">
          Rewards will be distributed when the new game is started.
        </p>
      </div>
    </div>
  );
};

export default RewardBanner;