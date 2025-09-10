import { Textarea } from "@/components/ui/textarea"
import { Button } from "@/components/ui/button"
import { FileUp, ClipboardPaste, Trash2, Camera, QrCode, Share, ArrowRightLeft, FileDown, Copy, Save, Key } from "lucide-react"

interface TextAreaWithControlsProps {
  id: string
  value: string
  placeholder: string
  isReadOnly: boolean
  isEncoding: boolean
  charCount: number
  byteCount: number
  onValueChange?: (value: string) => void
  onClear: () => void
  onPaste: () => void
  onFileSelect: (event: React.ChangeEvent<HTMLInputElement>) => void
  onScan: () => void
  onCopy?: () => void
  onSwap?: () => void
  onSave?: () => void
  onDownload?: () => void
  onShare?: () => void
  onGenerateQr?: () => void
  onPasswordClick?: () => void;
  isPasswordSet?: boolean;
  copyButtonText?: string
  fileInputRef: React.RefObject<HTMLInputElement>
}

export function TextAreaWithControls({
  id,
  value,
  placeholder,
  isReadOnly,
  isEncoding,
  charCount,
  byteCount,
  onValueChange,
  onClear,
  onPaste,
  onFileSelect,
  onScan,
  onCopy,
  onSwap,
  onSave,
  onDownload,
  onShare,
  onGenerateQr,
  onPasswordClick,
  isPasswordSet,
  copyButtonText,
  fileInputRef,
}: TextAreaWithControlsProps) {

  const isInput = !isReadOnly

  return (
    <div>
      <Textarea
        id={id}
        placeholder={placeholder}
        value={value}
        onChange={(e) => onValueChange?.(e.target.value)}
        readOnly={isReadOnly}
        className="min-h-[100px]"
      />
      <div className="flex justify-center items-center space-x-2 mt-2">
        {isInput ? (
          <>
            <Button variant="ghost" size="icon" onClick={() => fileInputRef.current?.click()} title="Upload File">
              <FileUp className="h-5 w-5" />
            </Button>
            <Button variant="ghost" size="icon" onClick={onScan} title="Scan QR Code">
              <Camera className="h-5 w-5" />
            </Button>
            <Button variant="ghost" size="icon" onClick={onPaste} title="Paste">
              <ClipboardPaste className="h-5 w-5" />
            </Button>
            <Button variant="ghost" size="icon" onClick={onClear} disabled={!value} title="Clear">
              <Trash2 className="h-5 w-5" />
            </Button>
            {onPasswordClick && (
              <Button variant="ghost" size="icon" onClick={onPasswordClick} title="Set Password">
                <Key className={`h-5 w-5 ${isPasswordSet ? 'text-green-500' : ''}`} />
              </Button>
            )}
          </>
        ) : (
          <>
            <Button variant="ghost" size="icon" onClick={onGenerateQr} disabled={!value} title="Generate QR Code">
              <QrCode className="h-5 w-5" />
            </Button>
            {navigator.share && (
              <Button variant="ghost" size="icon" onClick={onShare} disabled={!value} title="Share">
                <Share className="h-5 w-5" />
              </Button>
            )}
            <Button variant="ghost" size="icon" onClick={onSwap} disabled={!value} title="Swap Input/Output">
              <ArrowRightLeft className="h-5 w-5" />
            </Button>
            <Button variant="ghost" size="icon" onClick={onSave} disabled={!value} title="Save to History">
              <Save className="h-5 w-5" />
            </Button>
            <Button variant="ghost" size="icon" onClick={onDownload} disabled={!value} title="Download Output">
              <FileDown className="h-5 w-5" />
            </Button>
            <Button variant="ghost" size="icon" onClick={onCopy} disabled={!value} title={copyButtonText}>
              <Copy className="h-5 w-5" />
            </Button>
          </>
        )}
      </div>
      <input type="file" ref={fileInputRef} onChange={onFileSelect} className="hidden" />
      <div className="text-sm text-muted-foreground text-right -mt-2">
        {charCount} characters, {byteCount} bytes
      </div>
    </div>
  )
}
