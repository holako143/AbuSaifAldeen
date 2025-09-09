"use client"

import { createContext, useContext, useState, ReactNode } from 'react';

type Mode = 'encode' | 'decode';

interface EncoderState {
  inputText: string;
  setInputText: (text: string) => void;
  outputText: string;
  setOutputText: (text: string) => void;
  errorText: string;
  setErrorText: (text: string) => void;
  mode: Mode;
  setMode: (mode: Mode) => void;
  selectedEmoji: string;
  setSelectedEmoji: (emoji: string) => void;
}

const EncoderStateContext = createContext<EncoderState | undefined>(undefined);

export function EncoderStateProvider({ children }: { children: ReactNode }) {
  const [inputText, setInputText] = useState("");
  const [outputText, setOutputText] = useState("");
  const [errorText, setErrorText] = useState("");
  const [mode, setMode] = useState<Mode>("encode");
  const [selectedEmoji, setSelectedEmoji] = useState("😀");

  const value = {
    inputText,
    setInputText,
    outputText,
    setOutputText,
    errorText,
    setErrorText,
    mode,
    setMode,
    selectedEmoji,
    setSelectedEmoji,
  };

  return (
    <EncoderStateContext.Provider value={value}>
      {children}
    </EncoderStateContext.Provider>
  );
}

export function useEncoderState() {
  const context = useContext(EncoderStateContext);
  if (context === undefined) {
    throw new Error('useEncoderState must be used within an EncoderStateProvider');
  }
  return context;
}
