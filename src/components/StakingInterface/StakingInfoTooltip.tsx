import React from 'react';

const StakingInfoTooltip: React.FC = () => {
  return (
    <div className="relative ml-3 group">
      <button className="w-6 h-6 rounded-full bg-indigo-600 hover:bg-indigo-700 flex items-center justify-center text-white font-semibold text-xs shadow-md transition-colors cursor-pointer ring-2 ring-indigo-400/30">
        i
      </button>
      <div className="fixed z-[999] top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 sm:absolute sm:top-0 sm:left-full sm:translate-x-0 sm:translate-y-0 sm:ml-2 w-[90vw] max-w-[380px] sm:w-[350px] bg-gray-900/95 backdrop-blur-md rounded-xl shadow-[0_0_15px_rgba(99,102,241,0.4)] border border-indigo-500/40 invisible group-hover:visible overflow-hidden animate-in fade-in duration-150">
        <div className="bg-gradient-to-r from-indigo-800 to-violet-700 px-4 py-3 flex items-center justify-between">
          <h3 className="font-bold text-white tracking-wide text-sm flex items-center">
            <svg className="h-4 w-4 mr-2 text-indigo-300" viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg">
              <path d="M12 16V12M12 8H12.01M22 12C22 17.5228 17.5228 22 12 22C6.47715 22 2 17.5228 2 12C2 6.47715 6.47715 2 12 2C17.5228 2 22 6.47715 22 12Z" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"/>
            </svg>
            STAKING DETAILS
          </h3>
        </div>
        <div className="p-0 divide-y divide-gray-800">
          <div className="p-4 bg-indigo-600/5">
            <div className="flex items-center mb-2 text-indigo-400">
              <svg className="h-4 w-4 mr-2" viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg">
                <path d="M12 8V12L15 15M21 12C21 16.9706 16.9706 21 12 21C7.02944 21 3 16.9706 3 12C3 7.02944 7.02944 3 12 3C16.9706 3 21 7.02944 21 12Z" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"/>
              </svg>
              <span className="font-medium text-xs uppercase tracking-wider">Timeline</span>
            </div>
            <div className="flex items-center mb-4">
              <div className="flex-1 bg-gray-800 h-1 rounded-full overflow-hidden">
                <div className="bg-gradient-to-r from-indigo-500 to-violet-500 h-1 w-1/2 rounded-full"></div>
              </div>
              <span className="text-xs text-gray-400 ml-2">14 days</span>
            </div>
            <div className="flex justify-between text-xs text-gray-400">
              <div className="flex flex-col items-center">
                <div className="w-2 h-2 bg-indigo-500 rounded-full mb-1"></div>
                <span>Stake</span>
              </div>
              <div className="flex flex-col items-center">
                <div className="w-2 h-2 bg-indigo-500 rounded-full mb-1"></div>
                <span>7 days</span>
              </div>
              <div className="flex flex-col items-center">
                <div className="w-2 h-2 bg-indigo-500 rounded-full mb-1"></div>
                <span>Unstake</span>
              </div>
              <div className="flex flex-col items-center">
                <div className="w-2 h-2 bg-indigo-500 rounded-full mb-1"></div>
                <span>7 days</span>
              </div>
              <div className="flex flex-col items-center">
                <div className="w-2 h-2 bg-indigo-500 rounded-full mb-1"></div>
                <span>Claim</span>
              </div>
            </div>
          </div>
          <div className="p-4">
            <ul className="space-y-2.5 text-sm text-gray-200">
              <li className="flex items-start">
                <div className="flex-shrink-0 w-5 h-5 rounded-full bg-gradient-to-br from-indigo-500 to-violet-600 flex items-center justify-center mr-2 mt-0.5 text-white text-xs font-bold">✓</div>
                <span>Stakers earn SOL rewards paid by clickers</span>
              </li>
              <li className="flex items-start">
                <div className="flex-shrink-0 w-5 h-5 rounded-full bg-gradient-to-br from-indigo-500 to-violet-600 flex items-center justify-center mr-2 mt-0.5 text-white text-xs font-bold">✓</div>
                <span>5% of all protocol revenue is paid to stakers</span>
              </li>
              <li className="flex items-start">
                <div className="flex-shrink-0 w-5 h-5 rounded-full bg-gradient-to-br from-indigo-500 to-violet-600 flex items-center justify-center mr-2 mt-0.5 text-white text-xs font-bold">✓</div>
                <span>Stake/unstake lock period: 7 days each</span>
              </li>
              <li className="flex items-start">
                <div className="flex-shrink-0 w-5 h-5 rounded-full bg-gradient-to-br from-indigo-500 to-violet-600 flex items-center justify-center mr-2 mt-0.5 text-white text-xs font-bold">✓</div>
                <span>No rewards during unstake period</span>
              </li>
            </ul>
          </div>
          <div className="px-4 py-3 bg-indigo-600/10 flex items-center justify-between">
          </div>
        </div>
      </div>
    </div>
  );
};

export default StakingInfoTooltip;