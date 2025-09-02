"use client"

import { useEffect, useState } from "react"
import { deleteFromHistory, getHistory, HistoryEntry } from "@/lib/history"
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Copy, Trash2 } from "lucide-react"
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
  AlertDialogTrigger,
} from "@/components/ui/alert-dialog"

export default function HistoryPage() {
  const [history, setHistory] = useState<HistoryEntry[]>([])

  useEffect(() => {
    setHistory(getHistory())
  }, [])

  const handleCopy = (text: string) => {
    navigator.clipboard.writeText(text)
    // TODO: Add a toast notification for feedback
  }

  const handleDelete = (id: string) => {
    const newHistory = deleteFromHistory(id)
    setHistory(newHistory)
  }

  if (history.length === 0) {
    return (
      <div>
        <h1 className="text-2xl font-bold mb-4">سجل التشفير</h1>
        <p>لا يوجد أي سجل حتى الآن. قم بتشفير بعض النصوص لتظهر هنا.</p>
      </div>
    )
  }

  return (
    <div>
      <h1 className="text-2xl font-bold mb-4">سجل التشفير</h1>
      <div className="space-y-4">
        {history.map((entry) => (
          <Card key={entry.id}>
            <CardHeader>
              <CardTitle className="truncate text-lg">{entry.originalText}</CardTitle>
              <CardDescription>
                {new Date(entry.timestamp).toLocaleString()} - بالرمز: {entry.emoji}
              </CardDescription>
            </CardHeader>
            <CardContent>
              <p className="font-mono bg-muted p-2 rounded-md break-all text-sm">{entry.encodedText}</p>
              <div className="flex gap-2 mt-4">
                <Button variant="outline" size="sm" onClick={() => handleCopy(entry.encodedText)}>
                  <Copy className="ml-2 h-4 w-4" />
                  نسخ النص المشفر
                </Button>

                <AlertDialog>
                  <AlertDialogTrigger asChild>
                    <Button variant="destructive" size="sm">
                      <Trash2 className="ml-2 h-4 w-4" />
                      حذف
                    </Button>
                  </AlertDialogTrigger>
                  <AlertDialogContent>
                    <AlertDialogHeader>
                      <AlertDialogTitle>هل أنت متأكد تمامًا؟</AlertDialogTitle>
                      <AlertDialogDescription>
                        هذا الإجراء لا يمكن التراجع عنه. سيؤدي هذا إلى حذف هذا الإدخال بشكل دائم من سجل التشفير الخاص بك.
                      </AlertDialogDescription>
                    </AlertDialogHeader>
                    <AlertDialogFooter>
                      <AlertDialogCancel>إلغاء</AlertDialogCancel>
                      <AlertDialogAction onClick={() => handleDelete(entry.id)}>
                        نعم، قم بالحذف
                      </AlertDialogAction>
                    </AlertDialogFooter>
                  </AlertDialogContent>
                </AlertDialog>

              </div>
            </CardContent>
          </Card>
        ))}
      </div>
    </div>
  )
}
