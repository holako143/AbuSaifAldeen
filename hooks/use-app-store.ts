import { create } from 'zustand';
import { Algorithm } from '@/lib/encoders';

interface AppState {
  inputText: string;
  outputText: string;
  errorText: string;
  selectedEmoji: string;
  algorithm: Algorithm;
  password: string;
  copyButtonText: string;
  isPasswordDialogOpen: boolean; // For prompting when decoding
  isNewPasswordDialogOpen: boolean; // For setting the password
  isQrDialogOpen: boolean;
  isScannerOpen: boolean;
  showPassword: boolean;
  autoDecodeQr: boolean;

  setInputText: (text: string) => void;
  setOutputText: (text: string) => void;
  setErrorText: (text: string) => void;
  setSelectedEmoji: (emoji: string) => void;
  setAlgorithm: (algo: Algorithm) => void;
  setPassword: (password: string) => void;
  setCopyButtonText: (text: string) => void;
  setIsPasswordDialogOpen: (isOpen: boolean) => void;
  setIsNewPasswordDialogOpen: (isOpen: boolean) => void;
  setIsQrDialogOpen: (isOpen: boolean) => void;
  setIsScannerOpen: (isOpen: boolean) => void;
  setShowPassword: (show: boolean) => void;
  toggleAutoDecodeQr: () => void;
  clearOutput: () => void;
}

export const useAppStore = create<AppState>((set) => ({
  inputText: "",
  outputText: "",
  errorText: "",
  selectedEmoji: "😀",
  algorithm: 'emojiCipher',
  password: "",
  copyButtonText: "Copy",
  isPasswordDialogOpen: false,
  isNewPasswordDialogOpen: false,
  isQrDialogOpen: false,
  isScannerOpen: false,
  showPassword: false,
  autoDecodeQr: false,

  setInputText: (text) => set({ inputText: text, errorText: '' }),
  setOutputText: (text) => set({ outputText: text, errorText: '' }),
  setErrorText: (text) => set({ errorText: text, outputText: '' }),
  setSelectedEmoji: (emoji) => set({ selectedEmoji: emoji }),
  setAlgorithm: (algo) => set({ algorithm: algo }),
  setPassword: (password) => set({ password }),
  setCopyButtonText: (text) => set({ copyButtonText: text }),
  setIsPasswordDialogOpen: (isOpen) => set({ isPasswordDialogOpen: isOpen }),
  setIsNewPasswordDialogOpen: (isOpen) => set({ isNewPasswordDialogOpen: isOpen }),
  setIsQrDialogOpen: (isOpen) => set({ isQrDialogOpen: isOpen }),
  setIsScannerOpen: (isOpen) => set({ isScannerOpen: isOpen }),
  setShowPassword: (show) => set({ showPassword: show }),
  toggleAutoDecodeQr: () => set((state) => ({ autoDecodeQr: !state.autoDecodeQr })),
  clearOutput: () => set({ outputText: "", errorText: "" }),
}));
