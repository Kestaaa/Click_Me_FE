import React, { useState, useEffect, useRef } from 'react';
import { IconX, IconClock, IconCoins, IconChevronUp, IconAward, IconHeart, IconAlertCircle, IconShieldCheck } from '@tabler/icons-react';
import { CLICK_INCREMENT, NEW_GAME_COST, INITIAL_CLICK_COST, STAKING_TOKEN_MINT, IS_TOKEN_LIVE } from '@/config';

const GameMechanicsPopup: React.FC = () => {
  const [isOpen, setIsOpen] = useState(false);
  const [isVisible, setIsVisible] = useState(false);
  const [disclaimerAccepted, setDisclaimerAccepted] = useState(false);
  const [isCheckboxHighlighted, setIsCheckboxHighlighted] = useState(false);
  const disclaimerCheckboxRef = useRef<HTMLInputElement>(null);
  
  // Pop this bad boy on load—unless they've already bowed to the rules
  useEffect(() => {
    const hasAcceptedDisclaimer = localStorage.getItem('hasAcceptedGameMechanicsDisclaimer');
    
    if (hasAcceptedDisclaimer === 'true') {
      setIsOpen(false); // They're already in the cult, chill
      return;
    }
    
    // Delayed entrance for that drama—800ms of suspense!
    const timer = setTimeout(() => {
      setIsOpen(true);
      setTimeout(() => {
        setIsVisible(true);
        // Disable body scroll when popup becomes visible
        document.body.style.overflow = 'hidden';
      }, 50); // Smooth fade-in, baby
    }, 800);

    return () => clearTimeout(timer); // Cleanup crew
  }, []);

  const closePopup = () => {
    if (!disclaimerAccepted) {
      // If disclaimer not accepted, scroll the checkbox into view and highlight it
      disclaimerCheckboxRef.current?.scrollIntoView({ 
        behavior: 'smooth', 
        block: 'center' 
      });
      setIsCheckboxHighlighted(true);
      
      // No timeout to remove the highlight - it will remain until user checks the box
      return; // Prevent closing if disclaimer not accepted
    }
    
    setIsVisible(false);
    // Re-enable body scrolling when popup is closing
    document.body.style.overflow = '';
    
    // Add a delay before fully removing from DOM for exit animation
    setTimeout(() => setIsOpen(false), 300);
    
    // Save user acceptance in local storage
    localStorage.setItem('hasAcceptedGameMechanicsDisclaimer', 'true');
  };

  const handleAcceptClick = () => {
    if (!disclaimerAccepted) {
      // If disclaimer not accepted, scroll the checkbox into view and highlight it
      disclaimerCheckboxRef.current?.scrollIntoView({ 
        behavior: 'smooth', 
        block: 'center' 
      });
      setIsCheckboxHighlighted(true);
      
      // No timeout to remove the highlight - it will remain until user checks the box
      return;
    }
    
    closePopup();
  };
  
  // Hook into component mount to sync button width with popup container
  useEffect(() => {
    const syncButtonWidth = () => {
      const popupContainer = document.getElementById('game-mechanics-popup');
      const buttonContainer = document.querySelector('.game-mechanics-button') as HTMLElement;
      
      if (popupContainer && buttonContainer) {
        const popupWidth = popupContainer.offsetWidth;
        buttonContainer.style.width = `${popupWidth}px`;
      }
    };
    
    // Initial sync
    if (isVisible) {
      setTimeout(syncButtonWidth, 100);
    }
    
    // Sync on resize
    window.addEventListener('resize', syncButtonWidth);
    
    return () => {
      window.removeEventListener('resize', syncButtonWidth);
    };
  }, [isVisible]);

  // Clean up effect to ensure body scroll is re-enabled if component unmounts while popup is open
  useEffect(() => {
    return () => {
      if (isOpen) {
        document.body.style.overflow = '';
      }
    };
  }, [isOpen]);

  if (!isOpen) return null;

  return (
    <div 
      className={`fixed inset-0 z-[1000] flex items-center justify-center p-4 transition-all duration-300 ease-in-out game-mechanics-overlay ${
        isVisible ? 'bg-black/70 backdrop-blur-sm' : 'bg-black/0 backdrop-blur-none'
      }`}
      onClick={closePopup} // Click outside? Begone!
    >
      <div 
        className={`w-full max-w-2xl max-h-[90vh] bg-gray-900 border border-gray-800 rounded-xl shadow-2xl overflow-hidden transition-all duration-300 ease-in-out relative game-mechanics-content z-[1100] ${
          isVisible ? 'opacity-100 scale-100' : 'opacity-0 scale-95'
        }`}
        onClick={(e) => e.stopPropagation()}
        id="game-mechanics-popup"
      >
        {/* Header - Gradient vibes incoming */}
        <div className="bg-gradient-to-r from-indigo-600 to-violet-600 px-6 py-4 flex justify-between items-center">
          <h2 className="text-white font-bold text-xl tracking-tight">CLICK-ME: THE MAD MECHANICS</h2>
          <button 
            onClick={closePopup}
            className="text-white/80 hover:text-white transition-colors p-1 rounded-full hover:bg-white/10"
          >
            <IconX size={20} /> {/* X marks the exit */}
          </button>
        </div>

        {/* Content - Scrollable area with proper padding for footer button */}
        <div className="p-6 overflow-y-auto max-h-[70vh] text-gray-200 space-y-6 pb-24">
          {/* Game overview - Let's hype it */}
          <div className="space-y-2">
            <p className="text-white text-sm leading-relaxed">
              <b>CLICK-ME</b> is a SOL-fueled brawl where you smack a button, juice the timer, and stack the pot. Timer dies? Last clicker snags the whole damn loot!
            </p>
          </div>
          
          {/* Risk Disclaimer - Red alert, fam */}
          <div className="rounded-lg border border-red-800 bg-red-900/20 overflow-hidden">
            <div className="bg-red-900/30 px-4 py-2 border-b border-red-800">
              <h3 className="font-medium text-red-300 flex items-center">
                <IconAlertCircle className="mr-1.5 h-4 w-4" />
                DANGER ZONE: READ OR REGRET
              </h3>
            </div>
            <div className="p-4 space-y-2 text-sm">
              <p className="text-red-200">
                CLICK-ME runs wild on Solana's blockchain. Jump in, and you're owning these risks:
              </p>
              <ul className="list-disc pl-5 space-y-1 text-gray-300">
                <li>Smart contracts have been audited, but no audit can guarantee complete security.</li>
                <li>This software is experimental and may contain bugs or vulnerabilities.</li>
                <li>Interaction could result in partial or complete loss of funds.</li>
                <li>No promises, no refunds, no crying to devs.</li>
                <li>Blockchain's a one-way street—lost SOL's gone forever.</li>
                <li>Your moves, your mess—own it.</li>
              </ul>
              <p className="text-red-200 font-medium mt-2">
                Keep going? You're saying "I get it, I'm in, no whining."
              </p>
              <div className={`flex items-center mt-3 p-2 rounded ${isCheckboxHighlighted ? 'bg-red-900/40 border border-red-500 animate-pulse' : ''}`} id="disclaimer-checkbox">
                <input 
                  type="checkbox" 
                  id="disclaimerAccepted" 
                  className={`h-4 w-4 rounded ${isCheckboxHighlighted ? 'border-red-500' : 'border-gray-700'} text-indigo-600 focus:ring-indigo-500 bg-gray-800`}
                  checked={disclaimerAccepted}
                  onChange={(e) => {
                    setDisclaimerAccepted(e.target.checked);
                    if (e.target.checked) setIsCheckboxHighlighted(false); // Glow off, you're good
                  }}
                  ref={disclaimerCheckboxRef}
                />
                <label htmlFor="disclaimerAccepted" className={`ml-2 block text-sm ${isCheckboxHighlighted ? 'text-red-300 font-medium' : 'text-gray-300'}`}>
                  I'm down with the risks—let's roll!
                </label>
              </div>
            </div>
          </div>

          {/* Core mechanics - The meat of the madness */}
          <div className="rounded-lg border border-gray-800 overflow-hidden">
            <div className="bg-indigo-900/30 px-4 py-2 border-b border-gray-800">
              <h3 className="font-medium text-indigo-300 flex items-center">
                <IconChevronUp className="mr-1.5 h-4 w-4" />
                THE CORE CHAOS
              </h3>
            </div>
            <div className="divide-y divide-gray-800">
              <div className="p-3 flex">
                <div className="flex-shrink-0 h-6 w-6 rounded-full bg-indigo-900/50 flex items-center justify-center mr-3 text-xs font-medium text-indigo-300">1</div>
                <div>
                  <p className="text-sm"><span className="text-indigo-300 font-medium">Kickoff</span> costs {NEW_GAME_COST} SOL</p>
                  <p className="text-xs text-gray-400 mt-0.5">3-minute timer's live—go!</p>
                </div>
              </div>
              <div className="p-3 flex">
                <div className="flex-shrink-0 h-6 w-6 rounded-full bg-indigo-900/50 flex items-center justify-center mr-3 text-xs font-medium text-indigo-300">2</div>
                <div>
                  <p className="text-sm"><span className="text-indigo-300 font-medium">First smack</span> is {INITIAL_CLICK_COST} SOL</p>
                  <p className="text-xs text-gray-400 mt-0.5">Resets timer to 3—keep it rockin'</p>
                </div>
              </div>
              <div className="p-3 flex">
                <div className="flex-shrink-0 h-6 w-6 rounded-full bg-indigo-900/50 flex items-center justify-center mr-3 text-xs font-medium text-indigo-300">3</div>
                <div>
                  <p className="text-sm"><span className="text-indigo-300 font-medium">Costs climb</span> by {CLICK_INCREMENT} SOL per click</p>
                  <p className="text-xs text-gray-400 mt-0.5">Stakes rise, tension spikes!</p>
                </div>
              </div>
              <div className="p-3 flex">
                <div className="flex-shrink-0 h-6 w-6 rounded-full bg-indigo-900/50 flex items-center justify-center mr-3 text-xs font-medium text-indigo-300">4</div>
                <div>
                  <p className="text-sm"><span className="text-indigo-300 font-medium">Victory</span>—last clicker snags the pot at zero</p>
                  <p className="text-xs text-gray-400 mt-0.5">Paid out when the next game fires up</p>
                </div>
              </div>
            </div>
          </div>

          {/* Timeline - Visual flexin' */}
          <div className="py-2">
            <div className="relative">
              <div className="absolute inset-0 flex items-center">
                <div className="w-full border-t border-gray-800"></div>
              </div>
              <div className="relative flex justify-between">
                <div className="flex flex-col items-center">
                  <div className="rounded-full h-6 w-6 flex items-center justify-center bg-indigo-900 border border-indigo-600 text-xs text-indigo-300">1</div>
                  <span className="mt-1 text-xs text-gray-400">Game ignites</span>
                </div>
                <div className="flex flex-col items-center">
                  <div className="rounded-full h-6 w-6 flex items-center justify-center bg-indigo-900 border border-indigo-600 text-xs text-indigo-300">2</div>
                  <span className="mt-1 text-xs text-gray-400">Clicks go brrr</span>
                </div>
                <div className="flex flex-col items-center">
                  <div className="rounded-full h-6 w-6 flex items-center justify-center bg-indigo-900 border border-indigo-600 text-xs text-indigo-300">3</div>
                  <span className="mt-1 text-xs text-gray-400">Timer's toast</span>
                </div>
                <div className="flex flex-col items-center">
                  <div className="rounded-full h-6 w-6 flex items-center justify-center bg-indigo-900 border border-indigo-600 text-xs text-indigo-300">4</div>
                  <span className="mt-1 text-xs text-gray-400">Winner feasts</span>
                </div>
              </div>
            </div>
          </div>

          {/* Staking - Passive loot vibes */}
          <div className="rounded-lg border border-gray-800 overflow-hidden">
            <div className="bg-indigo-900/30 px-4 py-2 border-b border-gray-800">
              <h3 className="font-medium text-indigo-300 flex items-center">
                <IconCoins className="mr-1.5 h-4 w-4" />
                STAKING: CASH WITHOUT THE CLASH
              </h3>
            </div>
            <div className="p-4 space-y-3 text-sm">
              <p className="flex items-start">
                <IconAward className="h-4 w-4 text-yellow-500 mr-2 mt-0.5" />
                <span><span className="text-yellow-400 font-medium">5% of all SOL</span> gets yeeted to stakers—cha-ching!</span>
              </p>
              <p className="flex items-start">
                <IconHeart className="h-4 w-4 text-yellow-500 mr-2 mt-0.5" />
                <span>Stake any SPL tokens, watch SOL stack—easy mode activated</span>
              </p>
              <p className="flex items-start">
                <IconClock className="h-4 w-4 text-yellow-500 mr-2 mt-0.5" />
                <span>7-day chill before unstaking—patience is power</span>
              </p>
              <p className="flex items-start">
                <IconClock className="h-4 w-4 text-yellow-500 mr-2 mt-0.5" />
                <span>Another 7-day wait post-unstake—plan your exit</span>
              </p>
              <p className="flex items-start text-amber-400 bg-amber-900/20 p-2 rounded border border-amber-900/30">
                <IconAlertCircle className="h-4 w-4 mr-2 mt-0.5" />
                <span>Heads up: Unstaking? No rewards 'til you're out—choose wisely</span>
              </p>
            </div>
          </div>

          {/* Token info - Legit check */}
          <div className="rounded-lg border border-gray-800 overflow-hidden">
            <div className="bg-indigo-900/30 px-4 py-2 border-b border-gray-800">
              <h3 className="font-medium text-indigo-300 flex items-center">
                <IconShieldCheck className="mr-1.5 h-4 w-4" />
                TOKEN REALNESS
              </h3>
            </div>
            <div className="p-4 space-y-3">
              <div className="bg-gray-800/50 rounded-lg p-3 border border-gray-700">
                <p className="text-sm text-gray-300 mb-1.5">SPL Token Address:</p>
                <div className={`relative ${!IS_TOKEN_LIVE ? 'cursor-not-allowed' : ''}`}>
                  <p className={`text-xs font-mono bg-gray-950 p-2 rounded border border-gray-700 overflow-x-auto whitespace-nowrap text-green-400 ${!IS_TOKEN_LIVE ? 'blur-md select-none' : ''}`}>
                    {STAKING_TOKEN_MINT.toString()}
                  </p>
                  {!IS_TOKEN_LIVE && (
                    <div className="absolute inset-0 flex items-center justify-center">
                      <span className="text-xs text-amber-400 bg-gray-900/90 px-2 py-1 rounded">Coming Soon</span>
                    </div>
                  )}
                </div>
              </div>
              <div className="bg-amber-900/10 border border-amber-700/20 rounded-lg p-3 flex">
                <IconAlertCircle className="h-5 w-5 text-amber-500 mr-2 flex-shrink-0 mt-0.5" />
                <p className="text-xs text-amber-400">
                  Scammers are out here drooling for your SOL—verify this madness with the TEAM only! Seed phrase? Private keys? Guard 'em like your life!
                </p>
              </div>
            </div>
          </div>
        </div>

        {/* Fixed Footer Button - Always visible at the bottom with high z-index */}
        <div 
          className="bg-gray-800 border-t border-gray-800 fixed bottom-0 shadow-lg z-[1200] game-mechanics-button"
          style={{ 
            left: '50%',
            transform: 'translateX(-50%)'
          }}
        >
          <button
            onClick={handleAcceptClick}
            className={`w-full py-4 text-white text-base font-medium transition-colors ${
              disclaimerAccepted 
                ? 'bg-indigo-600 hover:bg-indigo-700' 
                : 'bg-gray-600 cursor-not-allowed'
            }`}
          >
            {disclaimerAccepted ? 'I\'M IN—LET\'S ROLL!' : 'CHECK THE DISCLAIMER FIRST!'}
          </button>
        </div>
      </div>
    </div>
  );
};

export default GameMechanicsPopup;