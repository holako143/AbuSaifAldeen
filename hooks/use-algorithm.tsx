"use client"

import { createContext, useContext, useState, ReactNode } from 'react';
import type { Algorithm } from '@/lib/encoders';

interface AlgorithmContextType {
  algorithm: Algorithm;
  setAlgorithm: (algorithm: Algorithm) => void;
}

const AlgorithmContext = createContext<AlgorithmContextType | undefined>(undefined);

export function AlgorithmProvider({ children }: { children: ReactNode }) {
  const [algorithm, setAlgorithm] = useState<Algorithm>('emojiCipher');

  return (
    <AlgorithmContext.Provider value={{ algorithm, setAlgorithm }}>
      {children}
    </AlgorithmContext.Provider>
  );
}

export function useAlgorithm() {
  const context = useContext(AlgorithmContext);
  if (context === undefined) {
    throw new Error('useAlgorithm must be used within an AlgorithmProvider');
  }
  return context;
}
