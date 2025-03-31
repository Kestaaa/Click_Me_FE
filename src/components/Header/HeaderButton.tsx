import React, { useMemo, useState, useEffect, useRef } from 'react';
import { IconFlame } from '@tabler/icons-react';

interface HeaderButtonProps {
  buttonRef: React.RefObject<HTMLButtonElement>;
  buttonText: string;
  handleButtonTiltEffect: (e: React.MouseEvent<HTMLButtonElement>) => void;
}

const HeaderButton: React.FC<HeaderButtonProps> = ({ 
  buttonRef, 
  buttonText, 
  handleButtonTiltEffect 
}) => {
  const initialFontSize = useMemo(() => {
    if (buttonText.length <= 6) return 22;
    if (buttonText.length <= 8) return 20;
    if (buttonText.length <= 10) return 18;
    if (buttonText.length <= 12) return 16;
    if (buttonText.length <= 14) return 14;
    return 12;
  }, [buttonText]);

  const [fontSize, setFontSize] = useState(initialFontSize);
  const textRef = useRef<HTMLSpanElement>(null);

  useEffect(() => {
    const adjustFontSize = () => {
      if (textRef.current && buttonRef.current) {
        const availableWidth = buttonRef.current.clientWidth - 34;
        const textWidth = textRef.current.scrollWidth;
        if (textWidth > availableWidth) {
          const scaleFactor = availableWidth / textWidth;
          setFontSize(prev => Math.max(prev * scaleFactor, 8));
        } else {
          setFontSize(initialFontSize);
        }
      }
    };

    adjustFontSize();
    window.addEventListener('resize', adjustFontSize);
    return () => window.removeEventListener('resize', adjustFontSize);
  }, [buttonRef, buttonText, initialFontSize]);

  return (
    <div className="wallet-adapter-dropdown">
      <button
        ref={buttonRef}
        type="button"
        className="header-button wallet-adapter-button click-me-btn"
        onClick={handleButtonTiltEffect}
        style={{ 
          position: 'relative',       // Ensure a stacking context is created
          zIndex: 'var(--z-button)',   // Use your CSS variable here
          width: '150px',
          display: 'flex',
          alignItems: 'center',
          transition: 'all 0.2s ease',
          padding: '0 8px'
        }}
      >
        <IconFlame size={22} className="wallet-adapter-button-start-icon" />
        <span 
          ref={textRef}
          className="button-text-container"
          style={{ 
            fontSize: `${fontSize}px`,
            marginLeft: '1px',
            whiteSpace: 'nowrap'
          }}
        >
          {buttonText}
        </span>
      </button>
    </div>
  );
};

export default HeaderButton;
