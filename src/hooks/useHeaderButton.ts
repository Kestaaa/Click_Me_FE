'use client';

import { useState, useCallback, useRef } from 'react';

interface Coin {
  id: string;  // Unique identifier for each coin
  tx: number;
  ty: number;
  size: number;
  delay: number;
  duration: number;
}

interface ButtonPosition {
  x: number;
  y: number;
}

export function useHeaderButton() {
  const [coins, setCoins] = useState<Coin[]>([]);
  const animationTimeoutsRef = useRef<number[]>([]);
  
  // Function to create coins in a burst pattern
  const createCoins = useCallback((buttonPosition?: ButtonPosition) => {
    if (!buttonPosition) return [];
    
    const newCoins: Coin[] = [];
    const coinCount = 20; // Number of coins
    const timestamp = Date.now(); // Unique timestamp for this burst
    
    // Create a burst pattern from the button
    for (let i = 0; i < coinCount; i++) {
      // Calculate angle for circular burst (in radians)
      const angle = (i / coinCount) * Math.PI * 2;
      
      // Random distance from center (px)
      const distance = 80 + Math.random() * 120;
      
      // Calculate end position with some randomness
      const tx = Math.cos(angle) * distance * (0.8 + Math.random() * 0.4);
      const ty = Math.sin(angle) * distance * (0.8 + Math.random() * 0.4);
      
      // Random size and delay
      const size = Math.floor(Math.random() * 12) + 8; // Size between 8-20px
      const delay = Math.random() * 0.15; // Shorter random delays
      const duration = 0.6 + Math.random() * 0.4; // Faster durations
      
      newCoins.push({ 
        id: `coin-${timestamp}-${i}`,
        tx, 
        ty, 
        size, 
        delay, 
        duration 
      });
    }
    
    return newCoins;
  }, []);
  
  // Handler for the logo button click
  const handleButtonClick = useCallback((buttonPosition?: ButtonPosition) => {
    // Generate new coins based on button position
    const newCoins = createCoins(buttonPosition);
    
    // Add these new coins to existing coins
    setCoins(prevCoins => [...prevCoins, ...newCoins]);
    
    // Set up cleanup timeout for this batch of coins
    const timeout = window.setTimeout(() => {
      setCoins(prevCoins => 
        prevCoins.filter(coin => !newCoins.some(newCoin => newCoin.id === coin.id))
      );
    }, 2000); // Slightly longer than animation to ensure all coins are gone
    
    // Store timeout for cleanup
    animationTimeoutsRef.current.push(timeout);
    
    // Clean up old timeouts to prevent memory leaks
    if (animationTimeoutsRef.current.length > 5) {
      window.clearTimeout(animationTimeoutsRef.current[0]);
      animationTimeoutsRef.current.shift();
    }
    
  }, [createCoins]);

  // Clean up all timeouts on unmount
  const cleanup = useCallback(() => {
    animationTimeoutsRef.current.forEach(timeout => {
      window.clearTimeout(timeout);
    });
    animationTimeoutsRef.current = [];
  }, []);

  return {
    coins,
    handleButtonClick,
    cleanup
  };
}