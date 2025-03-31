import { PublicKey } from '@solana/web3.js';
import { BN } from '@project-serum/anchor';

// Constants
const SOL_DECIMALS = 9;
const SOL_DECIMALS_MULTIPLIER = 10 ** SOL_DECIMALS;
const SOL_DECIMALS_BIG = BigInt(10 ** SOL_DECIMALS);

/**
 * Format time remaining from seconds to MM:SS
 */
export function formatTimeRemaining(seconds: number): string {
  if (!Number.isFinite(seconds) || seconds < 0) return '0:00';
  
  const minutes = Math.floor(seconds / 60);
  const remainingSeconds = Math.floor(seconds % 60);
  return `${minutes}:${remainingSeconds.toString().padStart(2, '0')}`;
}

/**
 * Format public key to a shortened display format
 */
export function formatPublicKey(pubkey: PublicKey | null | undefined): string {
  if (!pubkey) return 'Not Available';
  const pubkeyStr = pubkey.toString();
  return `${pubkeyStr.substring(0, 4)}...${pubkeyStr.substring(pubkeyStr.length - 4)}`;
}

/**
 * Convert lamports to SOL using standard number operations (faster)
 * @param lamports Amount in lamports
 * @param decimals Number of decimal places to show
 */
function lamportsToSol(lamports: number, decimals: number = 2): string {
  if (!lamports) return `0.${'0'.repeat(decimals)}`;
  
  const sol = lamports / SOL_DECIMALS_MULTIPLIER;
  return sol.toFixed(decimals);
}

/**
 * Convert lamports from BN to SOL using BigInt (for large numbers)
 * @param lamportsBN BN amount in lamports
 * @param decimals Number of decimal places to show
 */
function bnLamportsToSol(lamportsBN: BN, decimals: number = 2): string {
  try {
    const lamportsBig = BigInt(lamportsBN.toString());
    const solWhole = lamportsBig / SOL_DECIMALS_BIG;
    const remainder = lamportsBig % SOL_DECIMALS_BIG;
    
    // Calculate fractional part with correct number of decimals
    const fractionalMultiplier = BigInt(10 ** decimals);
    const fractional = (remainder * fractionalMultiplier) / SOL_DECIMALS_BIG;
    const fractionalStr = fractional.toString().padStart(decimals, '0');
    
    return `${solWhole.toString()}.${fractionalStr}`;
  } catch (e) {
    console.error('Error converting BN to SOL:', e);
    return `0.${'0'.repeat(decimals)}`;
  }
}

/**
 * Format lamports to SOL with two decimals (for general use)
 * Uses number operations for small values and BigInt for large values
 */
export function formatSol(lamports: number | BN | undefined | null): string {
  if (lamports === undefined || lamports === null) return '0.00';
  
  if (typeof lamports === 'number') {
    // Fast path for small numbers
    if (lamports < Number.MAX_SAFE_INTEGER) {
      return lamportsToSol(lamports, 2);
    }
    // For large numbers, convert to BN first
    lamports = new BN(lamports.toString());
  }
  
  return bnLamportsToSol(lamports, 2);
}

/**
 * Format lamports to SOL for rewards (six decimals for higher precision)
 */
export function formatRewardsSol(lamports: number | BN | undefined | null): string {
  if (lamports === undefined || lamports === null) return '0.000000';
  
  if (typeof lamports === 'number') {
    // Fast path for small numbers
    if (lamports < Number.MAX_SAFE_INTEGER) {
      return lamportsToSol(lamports, 6);
    }
    // For large numbers, convert to BN first
    lamports = new BN(lamports.toString());
  }
  
  return bnLamportsToSol(lamports, 6);
}

/**
 * Get Solana Explorer URL for a transaction or address
 */
export function getExplorerUrl(signature: string, cluster: string = 'mainnet-beta'): string {
  if (!signature) return '';
  return `https://explorer.solana.com/tx/${signature}?cluster=${cluster}`;
}

/**
 * Get Solana Explorer URL for an address
 */
export function getAddressExplorerUrl(address: string, cluster: string = 'mainnet-beta'): string {
  if (!address) return '';
  return `https://explorer.solana.com/address/${address}?cluster=${cluster}`;
}

/**
 * Format leaderboard data from metrics
 * Optimized to avoid redundant computations
 */
export function formatLeaderboardFromMetrics(metrics: any): { publicKey: string, solContributed: string }[] {
  if (!metrics?.recentClickers?.length) {
    return [];
  }
  
  // Create entries with formatted values
  const entries = metrics.recentClickers.map((pubkey: PublicKey) => ({
    publicKey: pubkey.toString(),
    displayPublicKey: formatPublicKey(pubkey),
    solContributed: '0' // We don't have contribution amounts anymore
  }));
  
  return entries;
}

/**
 * Converts a human-readable string (like "1.23") into a BN value with the correct decimals.
 * Optimized to handle edge cases better
 */
export function parseTokenAmount(amountStr: string, decimals: number): BN {
  // Handle empty or invalid input
  if (!amountStr || isNaN(parseFloat(amountStr))) return new BN(0);
  
  // Clean the input string
  amountStr = amountStr.replace(/,/g, '').trim();
  
  // Split into whole and fractional parts
  const parts = amountStr.split('.');
  const whole = parts[0] || '0';
  let fraction = parts[1] || '';
  
  // Ensure fraction has correct number of decimals
  if (fraction.length > decimals) {
    fraction = fraction.slice(0, decimals);
  } else {
    fraction = fraction.padEnd(decimals, '0');
  }
  
  // Handle negative numbers properly
  const isNegative = whole.startsWith('-');
  const absWhole = isNegative ? whole.substring(1) : whole;
  const combined = absWhole + fraction;
  let result = new BN(combined);
  
  // Apply negative sign if needed
  if (isNegative) {
    result = result.neg();
  }
  
  return result;
}

/**
 * Converts a BN amount into a human-readable string for input display.
 * Optimized to trim unnecessary zeros
 */
export function formatStakeAmountForInput(amount: BN | null | undefined, decimals: number): string {
  if (!amount) return '0';
  
  // Handle negative numbers
  const isNegative = amount.isNeg();
  const absAmount = isNegative ? amount.neg() : amount;
  
  const amountStr = absAmount.toString();
  if (amountStr.length <= decimals) {
    // Amount is less than 1
    const formatted = "0." + amountStr.padStart(decimals, '0');
    return isNegative ? `-${formatted}` : formatted;
  }
  
  // Amount is 1 or more
  const integerPart = amountStr.slice(0, amountStr.length - decimals);
  let decimalPart = amountStr.slice(amountStr.length - decimals);
  
  // Trim trailing zeros
  decimalPart = decimalPart.replace(/0+$/, '');
  
  const formatted = decimalPart ? `${integerPart}.${decimalPart}` : integerPart;
  return isNegative ? `-${formatted}` : formatted;
}

/**
 * Format token amount with thousands separators and limited decimal places
 */
export function formatTokenAmount(amount: BN | null | undefined, decimals: number, displayDecimals: number = 4): string {
  if (!amount) return "0";
  
  const amountStr = amount.toString().padStart(decimals + 1, '0');
  const decimalIndex = amountStr.length - decimals;
  
  if (decimalIndex <= 0) {
    // Very small amount
    const zeros = Math.abs(decimalIndex);
    const significantDigits = amountStr.substring(0, displayDecimals);
    return `0.${"0".repeat(zeros)}${significantDigits}`;
  }
  
  const integerPart = amountStr.slice(0, decimalIndex);
  let decimalPart = amountStr.slice(decimalIndex);
  
  // Limit decimal places
  if (decimalPart.length > displayDecimals) {
    decimalPart = decimalPart.substring(0, displayDecimals);
  }
  
  // Remove trailing zeros
  decimalPart = decimalPart.replace(/0+$/, '');
  
  // Add thousands separators to integer part
  const integerWithSeparators = parseInt(integerPart).toLocaleString();
  
  return decimalPart 
    ? `${integerWithSeparators}.${decimalPart}` 
    : integerWithSeparators;
}

/**
 * Format duration for display like "5m 30s remaining" or "Available now"
 */
export function formatDuration(seconds: number): string {
  if (seconds <= 0) return "Available now";
  
  const days = Math.floor(seconds / 86400);
  const hours = Math.floor((seconds % 86400) / 3600);
  const minutes = Math.floor((seconds % 3600) / 60);
  const remainingSeconds = Math.floor(seconds % 60);
  
  if (days > 0) {
    return `${days}d ${hours}h remaining`;
  } else if (hours > 0) {
    return `${hours}h ${minutes}m remaining`;
  } else if (minutes > 0) {
    return `${minutes}m ${remainingSeconds}s remaining`;
  } else {
    return `${remainingSeconds}s remaining`;
  }
}

/**
 * Format a number with thousands separators
 */
export function formatNumber(num: number | string): string {
  if (typeof num === 'string') {
    num = parseFloat(num);
  }
  
  if (isNaN(num)) return '0';
  return num.toLocaleString();
}

/**
 * Truncate text to a specific length with ellipsis
 */
export function truncateText(text: string, maxLength: number): string {
  if (!text || text.length <= maxLength) return text;
  return text.slice(0, maxLength) + '...';
}

/**
 * Memoization wrapper to cache expensive calculations
 */
export function memoize<T, R>(fn: (arg: T) => R): (arg: T) => R {
  const cache = new Map<string, R>();
  
  return (arg: T) => {
    const key = JSON.stringify(arg);
    if (cache.has(key)) {
      return cache.get(key)!;
    }
    
    const result = fn(arg);
    cache.set(key, result);
    return result;
  };
}