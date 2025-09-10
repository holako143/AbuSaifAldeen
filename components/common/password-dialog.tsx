"use client"

import { useState } from "react"
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogDescription,
  DialogFooter,
  DialogClose,
} from "@/components/ui/dialog"
import { Input } from "@/components/ui/input"
import { Button } from "@/components/ui/button"
import { Label } from "@/components/ui/label"

interface PasswordDialogProps {
  open: boolean
  onOpenChange: (open: boolean) => void
  onSetPassword: (password: string) => void
  initialPassword?: string
}

export function PasswordDialog({
  open,
  onOpenChange,
  onSetPassword,
  initialPassword = "",
}: PasswordDialogProps) {
  const [password, setPassword] = useState(initialPassword)

  const handleSetPassword = () => {
    onSetPassword(password)
    onOpenChange(false)
  }

  const handleClearPassword = () => {
    setPassword("")
    onSetPassword("")
    onOpenChange(false)
  }

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-[425px]">
        <DialogHeader>
          <DialogTitle>Set Encryption Password</DialogTitle>
          <DialogDescription>
            Set a password to encrypt your output. This password will be required for decryption.
            Leave it empty to remove password protection.
          </DialogDescription>
        </DialogHeader>
        <div className="grid gap-4 py-4">
          <div className="grid grid-cols-4 items-center gap-4">
            <Label htmlFor="password-input" className="text-right">
              Password
            </Label>
            <Input
              id="password-input"
              type="password"
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              className="col-span-3"
              placeholder="Enter your password"
            />
          </div>
        </div>
        <DialogFooter>
          <Button variant="outline" onClick={handleClearPassword}>Clear & Close</Button>
          <Button onClick={handleSetPassword}>Set Password & Close</Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  )
}
