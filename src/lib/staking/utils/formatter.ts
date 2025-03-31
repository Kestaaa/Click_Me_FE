// src/lib/staking/utils/formatter.ts
import { BN } from '@project-serum/anchor';
import { SOL_DECIMALS, SOL_MULTIPLIER } from './constants';

/**
 * Format a BN value representing lamports to SOL with specified decimal places
 * 
 * @param lamports Amount in lamports (the smallest unit of SOL)
 * @param decimals Number of decimal places to display (default 4)
 * @returns Formatted SOL amount as a string
 */
export function formatSolAmount(lamports: BN, decimals: number = 4): string {
  if (!lamports || lamports.isZero()) {
    return '0';
  }

  try {
    // Convert lamports to SOL
    const solValue = lamports.toNumber() / SOL_MULTIPLIER;
    
    // Format with the specified number of decimal places
    return solValue.toFixed(decimals);
  } catch (error) {
    // For extremely large numbers that might overflow toNumber()
    // Implement a fallback string-based conversion for huge numbers
    const lamportsStr = lamports.toString();
    if (lamportsStr.length <= SOL_DECIMALS) {
      // Less than 1 SOL
      const padded = lamportsStr.padStart(SOL_DECIMALS, '0');
      const integerPart = '0';
      const fractionalPart = padded.slice(0, decimals);
      return `${integerPart}.${fractionalPart}`;
    } else {
      // More than 1 SOL
      const integerPart = lamportsStr.slice(0, -SOL_DECIMALS);
      const fractionalPart = lamportsStr.slice(-SOL_DECIMALS).padStart(SOL_DECIMALS, '0').slice(0, decimals);
      return `${integerPart}.${fractionalPart}`;
    }
  }
}

/**
 * Format time in seconds to a human-readable duration
 * 
 * @param seconds Time in seconds
 * @returns Formatted duration string
 */
export function formatDuration(seconds: number): string {
  if (!seconds || seconds <= 0) {
    return 'Available now';
  }

  if (seconds < 60) {
    return `${seconds} second${seconds !== 1 ? 's' : ''}`;
  }

  if (seconds < 3600) {
    const minutes = Math.floor(seconds / 60);
    return `${minutes} minute${minutes !== 1 ? 's' : ''}`;
  }

  const hours = Math.floor(seconds / 3600);
  const minutes = Math.floor((seconds % 3600) / 60);
  
  if (minutes === 0) {
    return `${hours} hour${hours !== 1 ? 's' : ''}`;
  }
  
  return `${hours} hour${hours !== 1 ? 's' : ''} ${minutes} minute${minutes !== 1 ? 's' : ''}`;
}