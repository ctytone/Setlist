"use client";

import { useContext } from "react";
import { ToastContext } from "./toast-context";
import { X } from "lucide-react";
import { Button } from "@/components/ui/button";

export function Toaster() {
  const context = useContext(ToastContext);
  if (!context) return null;

  return (
    <div className="fixed bottom-0 right-0 z-50 flex flex-col gap-2 p-4 max-w-sm">
      {context.toasts.map((toast) => (
        <div
          key={toast.id}
          className={`rounded-lg p-4 flex items-start justify-between gap-2 animate-in slide-in-from-bottom-5 ${
            toast.variant === "destructive"
              ? "bg-destructive text-destructive-foreground"
              : "bg-foreground text-background"
          }`}
        >
          <div className="flex-1">
            <h3 className="font-medium">{toast.title}</h3>
            {toast.description && (
              <p className="text-sm opacity-90 mt-1">{toast.description}</p>
            )}
          </div>
          <Button
            variant="ghost"
            size="sm"
            onClick={() => context.removeToast(toast.id)}
            className={
              toast.variant === "destructive"
                ? "text-destructive-foreground hover:bg-destructive/20"
                : "text-background hover:bg-foreground/20"
            }
          >
            <X className="h-4 w-4" />
          </Button>
        </div>
      ))}
    </div>
  );
}
