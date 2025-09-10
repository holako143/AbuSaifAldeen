import { Algorithm } from "@/lib/encoders"

export interface AppState {
  inputText: string
  outputText: string
  errorText: string
  selectedEmoji: string
  algorithm: Algorithm
  copyButtonText: string
  isPasswordDialogOpen: boolean
  isQrDialogOpen: boolean
  isScannerOpen: boolean
  showPassword: boolean
  autoDecodeQr: boolean
}

export const initialState: AppState = {
  inputText: "",
  outputText: "",
  errorText: "",
  selectedEmoji: "😀",
  algorithm: 'emojiCipher',
  copyButtonText: "Copy",
  isPasswordDialogOpen: false,
  isQrDialogOpen: false,
  isScannerOpen: false,
  showPassword: false,
  autoDecodeQr: false,
}

export type Action =
  | { type: 'SET_INPUT_TEXT'; payload: string }
  | { type: 'ENCODE_SUCCESS'; payload: string }
  | { type: 'DECODE_SUCCESS'; payload: string }
  | { type: 'SET_ERROR'; payload: string }
  | { type: 'CLEAR_OUTPUT' }
  | { type: 'REQUEST_PASSWORD' }
  | { type: 'CLOSE_PASSWORD_DIALOG' }
  | { type: 'SET_ALGORITHM'; payload: Algorithm }
  | { type: 'SET_EMOJI'; payload: string }
  | { type: 'SET_COPY_BUTTON_TEXT'; payload: string }
  | { type: 'SET_QR_DIALOG_OPEN'; payload: boolean }
  | { type: 'SET_PASSWORD_DIALOG_OPEN'; payload: boolean }
  | { type: 'SET_SCANNER_OPEN'; payload: boolean }
  | { type: 'TOGGLE_SHOW_PASSWORD' }
  | { type: 'TOGGLE_AUTO_DECODE_QR' }

export function reducer(state: AppState, action: Action): AppState {
  switch (action.type) {
    case 'SET_INPUT_TEXT':
      return { ...state, inputText: action.payload }
    case 'ENCODE_SUCCESS':
      return { ...state, outputText: action.payload, errorText: "" }
    case 'DECODE_SUCCESS':
      return { ...state, outputText: action.payload, errorText: "" }
    case 'SET_ERROR':
      return { ...state, outputText: "", errorText: action.payload }
    case 'CLEAR_OUTPUT':
      return { ...state, outputText: "", errorText: "" }
    case 'REQUEST_PASSWORD':
      return { ...state, isPasswordDialogOpen: true, outputText: "", errorText: "This might be password protected." }
    case 'CLOSE_PASSWORD_DIALOG':
        return { ...state, isPasswordDialogOpen: false }
    case 'SET_ALGORITHM':
      return { ...state, algorithm: action.payload }
    case 'SET_EMOJI':
      return { ...state, selectedEmoji: action.payload }
    case 'SET_COPY_BUTTON_TEXT':
      return { ...state, copyButtonText: action.payload }
    case 'SET_QR_DIALOG_OPEN':
      return { ...state, isQrDialogOpen: action.payload }
    case 'SET_PASSWORD_DIALOG_OPEN':
      return { ...state, isPasswordDialogOpen: action.payload }
    case 'SET_SCANNER_OPEN':
      return { ...state, isScannerOpen: action.payload }
    case 'TOGGLE_SHOW_PASSWORD':
      return { ...state, showPassword: !state.showPassword }
    case 'TOGGLE_AUTO_DECODE_QR':
        return { ...state, autoDecodeQr: !state.autoDecodeQr }
    default:
      return state
  }
}
