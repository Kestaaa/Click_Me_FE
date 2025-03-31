import React, { ReactNode } from 'react';

interface TooltipProps {
  children: ReactNode;
  content: ReactNode;
  title?: string;
  badge?: string;
  icon?: ReactNode;
}

const Tooltip: React.FC<TooltipProps> = ({ 
  children, 
  content, 
  title, 
  badge, 
  icon 
}) => {
  return (
    <div className="relative group">
      {/* Trigger element */}
      {children}
      
      {/* Tooltip */}
      <div className="fixed z-[999] top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 sm:absolute sm:top-0 sm:left-full sm:translate-x-0 sm:translate-y-0 sm:ml-2 w-[90vw] max-w-[380px] sm:w-[350px] bg-gray-900/95 backdrop-blur-md rounded-xl shadow-[0_0_15px_rgba(99,102,241,0.4)] border border-indigo-500/40 invisible group-hover:visible overflow-hidden animate-in fade-in duration-150 tooltip-container">
        {title && (
          <div className="bg-gradient-to-r from-indigo-800 to-violet-700 px-4 py-3 flex items-center justify-between">
            <h3 className="font-bold text-white tracking-wide text-sm flex items-center">
              {icon && <span className="mr-2">{icon}</span>}
              {title}
            </h3>
            {badge && (
              <div className="px-1.5 py-0.5 bg-indigo-900/50 rounded-md border border-indigo-600/30 text-xs text-indigo-300 font-medium">
                {badge}
              </div>
            )}
          </div>
        )}
        <div className="p-4 divide-y divide-gray-800">
          {content}
        </div>
      </div>
    </div>
  );
};

export default Tooltip;