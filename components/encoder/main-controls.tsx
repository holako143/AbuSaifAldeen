"use client"

import { Switch } from "@/components/ui/switch"
import { Label } from "@/components/ui/label"
import { useEncoderState } from "@/hooks/use-encoder-state"

export function MainControls() {
  const { mode, setMode, setInputText, setOutputText, setErrorText } = useEncoderState()
  const isEncoding = mode === 'encode'

  const handleModeToggle = (checked: boolean) => {
    setMode(checked ? "encode" : "decode")
    setInputText("")
    setOutputText("")
    setErrorText("")
  }

  return (
    <>
      {isEncoding && (
        <div className="flex justify-between items-center">
          <p className="text-sm sm:text-base">شفر الي تشتيه وانبسط 😋 </p>
        </div>
      )}
      <div className="flex items-center justify-center space-x-2">
        <Label htmlFor="mode-toggle">فك التشفير</Label>
        <Switch id="mode-toggle" checked={isEncoding} onCheckedChange={handleModeToggle} />
        <Label htmlFor="mode-toggle">تشفير النص</Label>
      </div>
    </>
  )
}
