import { useState, useEffect, useRef, useCallback } from 'react';
import { useHeaderButton } from '@/hooks/useHeaderButton';
import { ButtonPosition } from '../types';

export const useButtonEffect = () => {
  const [buttonPosition, setButtonPosition] = useState<ButtonPosition>({ x: 0, y: 0 });
  const [clickCount, setClickCount] = useState<number>(0);
  const [buttonText, setButtonText] = useState<string>("CLICK-ME!");
  const buttonRef = useRef<HTMLButtonElement>(null);
  const { coins, handleButtonClick, cleanup } = useHeaderButton();

  // Update button position when it renders or on window resize
  const updateButtonPosition = useCallback(() => {
    if (buttonRef.current) {
      const rect = buttonRef.current.getBoundingClientRect();
      setButtonPosition({
        x: rect.left + rect.width / 2,
        y: rect.top + rect.height / 2,
      });
    }
  }, []);

  // Update button text based on click count
  useEffect(() => {
    if (clickCount < 10) {
      setButtonText("CLICK-ME!");
    } else if (clickCount < 20) {
      setButtonText("more...");
    } else if (clickCount < 30) {
      setButtonText("Mooore..");
    } else if (clickCount < 40) {
      setButtonText("MORE!!!");
    } else if (clickCount < 50) {
      setButtonText("YES!");
    } else if (clickCount < 60) {
      setButtonText("OH BABY!");
    } else if (clickCount < 70) {
      setButtonText("HARDER!");
    } else if (clickCount < 80) {
      setButtonText("THAT'S IT!");
    } else if (clickCount < 90) {
      setButtonText("FASTER!");
    } else if (clickCount < 100) {
      setButtonText("ooooo");
    } else if (clickCount < 110) {
      setButtonText("ooOOoO!");
    } else if (clickCount < 120) {
      setButtonText("OOOOH!");
    } else if (clickCount < 130) {
      setButtonText("Ahhhhhh");
    } else if (clickCount < 140) {
      setButtonText("It's sensitive");
    } else if (clickCount < 150) {
      setButtonText("ok stop");
    } else if (clickCount < 160) {
      setButtonText("STOP!");
    } else if (clickCount < 170) {
      setButtonText("STOP IT!");
    } else if (clickCount < 180) {
      setButtonText("Oh nvm...");
    } else {
      // Rotate through all phrases after 180 clicks
      const phrases = [
        "more...", "Mooore..", "MORE!!!", "YES!", "OH BABY!", 
        "HARDER!", "THAT'S IT!", "FASTER!", "ooooo", "ooOOoO!",
        "OOOOH!", "Ahhhhhh", "It's sensitive", "ok stop", "STOP!",
        "STOP IT!", "Oh nvm keep goin"
      ];
      const index = Math.floor((clickCount - 180) / 10) % phrases.length;
      setButtonText(phrases[index]);
    }
  }, [clickCount]);

  useEffect(() => {
    updateButtonPosition();
    window.addEventListener('resize', updateButtonPosition);
    return () => {
      window.removeEventListener('resize', updateButtonPosition);
      cleanup();
    };
  }, [cleanup, updateButtonPosition]);

  // Handler for the button tilt effect
  const handleButtonTiltEffect = useCallback((e: React.MouseEvent<HTMLButtonElement>) => {
    const button = e.currentTarget;
    updateButtonPosition();
    button.classList.add('clicked');
    
    // Increment click count
    setClickCount(prevCount => prevCount + 1);
    
    // Trigger coin animation
    handleButtonClick(buttonPosition);
    
    setTimeout(() => {
      button.classList.remove('clicked');
    }, 500);
  }, [buttonPosition, handleButtonClick, updateButtonPosition]);

  return {
    buttonRef,
    buttonPosition,
    buttonText,
    coins,
    handleButtonTiltEffect,
    clickCount
  };
};