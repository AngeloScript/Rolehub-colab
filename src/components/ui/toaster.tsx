"use client"

import { useToast } from "@/hooks/use-toast"
import {
  Toast,
  ToastClose,
  ToastDescription,
  ToastProvider,
  ToastTitle,
  ToastViewport,
} from "@/components/ui/toast"
import { CheckCircle2, XCircle, AlertTriangle, Info } from "lucide-react"

const getToastIcon = (variant?: string | null) => {
  if (!variant) return null

  switch (variant) {
    case "success":
      return <CheckCircle2 className="h-5 w-5 text-green-600 dark:text-green-400" />
    case "destructive":
      return <XCircle className="h-5 w-5 text-red-600 dark:text-red-400" />
    case "warning":
      return <AlertTriangle className="h-5 w-5 text-yellow-600 dark:text-yellow-400" />
    case "info":
      return <Info className="h-5 w-5 text-blue-600 dark:text-blue-400" />
    default:
      return null
  }
}

export function Toaster() {
  const { toasts } = useToast()

  return (
    <ToastProvider>
      {toasts.map(function ({ id, title, description, action, variant, ...props }) {
        return (
          <Toast key={id} variant={variant} {...props}>
            <div className="flex items-start gap-3 w-full">
              {getToastIcon(variant)}
              <div className="grid gap-1 flex-1">
                {title && <ToastTitle>{title}</ToastTitle>}
                {description && (
                  <ToastDescription>{description}</ToastDescription>
                )}
              </div>
            </div>
            {action}
            <ToastClose />
          </Toast>
        )
      })}
      <ToastViewport />
    </ToastProvider>
  )
}
