import React, { useState, useEffect } from 'react';
import { IS_TOKEN_LIVE } from '@/config';

interface ContractAddressProps {
  address: string;
  isMobile: boolean;
}

const ContractAddress: React.FC<ContractAddressProps> = ({ address, isMobile }) => {
  const [copied, setCopied] = useState(false);
  
  useEffect(() => {
    if (copied) {
      const timer = setTimeout(() => {
        setCopied(false);
      }, 2000);
      return () => clearTimeout(timer);
    }
  }, [copied]);
  
  const copyToClipboard = () => {
    if (!IS_TOKEN_LIVE) return; // Prevent copying when token isn't live
    
    navigator.clipboard.writeText(address).then(() => {
      setCopied(true);
    }).catch(err => {
      console.error('Failed to copy: ', err);
    });
  };
  
  // Shorten address for mobile
  const getDisplayAddress = () => {
    if (isMobile) {
      return `${address.substring(0, 6)}...${address.substring(address.length - 6)}`;
    }
    return address;
  };

  return (
    <div className={`contract-address-container ${!IS_TOKEN_LIVE ? 'cursor-not-allowed' : ''}`} onClick={copyToClipboard}>
      <div className="address-label">Official Token</div>
      <div className="address-box">
        <span className={`mono-text overflow-hidden ${!IS_TOKEN_LIVE ? 'blur-md select-none' : ''}`}>
          {getDisplayAddress()}
        </span>
        <div className="copy-button flex-shrink-0">
          {IS_TOKEN_LIVE ? (
            copied ? (
              <svg
                xmlns="http://www.w3.org/2000/svg"
                width="14"
                height="14"
                viewBox="0 0 24 24"
                fill="none"
                stroke="#10B981"
                strokeWidth="2"
                strokeLinecap="round"
                strokeLinejoin="round"
              >
                <polyline points="20 6 9 17 4 12" />
              </svg>
            ) : (
              <svg
                xmlns="http://www.w3.org/2000/svg"
                width="14"
                height="14"
                viewBox="0 0 24 24"
                fill="none"
                stroke="currentColor"
                strokeWidth="2"
                strokeLinecap="round"
                strokeLinejoin="round"
              >
                <rect x="9" y="9" width="13" height="13" rx="2" ry="2" />
                <path d="M5 15H4a2 2 0 0 1-2-2V4a2 2 0 0 1 2-2h9a2 2 0 0 1 2 2v1" />
              </svg>
            )
          ) : (
            <svg
              xmlns="http://www.w3.org/2000/svg"
              width="14" 
              height="14"
              viewBox="0 0 24 24"
              fill="none"
              stroke="currentColor"
              strokeWidth="2"
              strokeLinecap="round"
              strokeLinejoin="round"
              opacity="0.5"
            >
              <rect x="9" y="9" width="13" height="13" rx="2" ry="2" />
              <path d="M5 15H4a2 2 0 0 1-2-2V4a2 2 0 0 1 2-2h9a2 2 0 0 1 2 2v1" />
            </svg>
          )}
        </div>
      </div>
      {!IS_TOKEN_LIVE && (
        <div className="absolute inset-0 flex items-center justify-center">
        </div>
      )}
    </div>
  );
};

export default ContractAddress;