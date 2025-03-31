'use client';

import React, { ReactNode } from 'react';
import { ButtonGameProvider as OriginalButtonGameProvider } from '@/hooks/useButtonGame';

interface ButtonGameProviderProps {
  children: ReactNode;
}

const ButtonGameProvider: React.FC<ButtonGameProviderProps> = ({ children }) => {
  return (
    <OriginalButtonGameProvider>
      {children}
    </OriginalButtonGameProvider>
  );
};

export default ButtonGameProvider;