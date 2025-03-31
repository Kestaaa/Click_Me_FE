'use client';

import React, { useState, useEffect } from 'react';
import dynamic from 'next/dynamic';
import CoinAnimation from './CoinAnimation';
import HeaderButton from './HeaderButton';
import { useButtonEffect } from './hooks/useButtonEffect';

// Dynamic import for wallet button
const WalletMultiButton = dynamic(
  () => import('@solana/wallet-adapter-react-ui').then((mod) => mod.WalletMultiButton),
  { ssr: false }
);

const Header: React.FC = () => {
  const [isClient, setIsClient] = useState<boolean>(false);
  const { buttonRef, buttonPosition, buttonText, coins, handleButtonTiltEffect } = useButtonEffect();

  useEffect(() => {
    setIsClient(true);
  }, []);

  return (
    <header className="header-bg fixed top-0 left-0 right-0 w-full py-4 px-4 sm:px-6 relative">
      {/* Coin Animation Container */}
      <div className="button-coin-animation absolute inset-0 pointer-events-none">
        <CoinAnimation coins={coins} buttonPosition={buttonPosition} />
      </div>

      {/* Header Content Container */}
      <div className="header-content relative container mx-auto flex items-center justify-between">
        <div className="flex items-center ml-16" id="click-me-container">
          {/* "Click-me!" Button */}
          <div className="wallet-button">
            <HeaderButton
              buttonRef={buttonRef}
              buttonText={buttonText}
              handleButtonTiltEffect={handleButtonTiltEffect}
            />
          </div>
        </div>

        {/* Wallet Connect Button */}
        {isClient && (
          <div className="wallet-button wallet-connect">
            <WalletMultiButton />
          </div>
        )}
      </div>
    </header>
  );
};

export default Header;