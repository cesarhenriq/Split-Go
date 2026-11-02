"use client";

import { CircleCheck, CircleX, Info, X } from "lucide-react";
import {
  createContext,
  useCallback,
  useContext,
  useEffect,
  useMemo,
  useRef,
  useState,
} from "react";
import { cn } from "@/lib/utils";

export type ToastVariant = "info" | "success" | "error";

export type ToastInput = {
  title: string;
  description?: string;
  variant?: ToastVariant;
  duration?: number;
};

type ToastItem = ToastInput & { id: number };

type ToastContextValue = {
  toast: (input: ToastInput) => void;
  dismiss: (id: number) => void;
};

const ToastContext = createContext<ToastContextValue | null>(null);

const toastVariants: Record<ToastVariant, string> = {
  info: "border-primary-200 bg-primary-50 text-primary-900",
  success: "border-success-200 bg-success-50 text-success-900",
  error: "border-danger-200 bg-danger-50 text-danger-900",
};

const toastIcons = {
  info: Info,
  success: CircleCheck,
  error: CircleX,
};

export function useToast() {
  const context = useContext(ToastContext);

  if (!context) {
    throw new Error("useToast must be used inside a <ToastProvider>");
  }

  return context;
}

export function ToastProvider({ children }: { children: React.ReactNode }) {
  const [toasts, setToasts] = useState<ToastItem[]>([]);
  const idRef = useRef(0);
  const timersRef = useRef(new Map<number, ReturnType<typeof setTimeout>>());

  const dismiss = useCallback((id: number) => {
    const timer = timersRef.current.get(id);

    if (timer) {
      clearTimeout(timer);
      timersRef.current.delete(id);
    }

    setToasts((current) => current.filter((toastItem) => toastItem.id !== id));
  }, []);

  const toast = useCallback(
    (input: ToastInput) => {
      const id = idRef.current + 1;
      idRef.current = id;

      setToasts((current) => [...current, { ...input, id }]);

      const timer = setTimeout(() => dismiss(id), input.duration ?? 5000);

      timersRef.current.set(id, timer);
    },
    [dismiss],
  );

  useEffect(() => {
    const timers = timersRef.current;

    return () => {
      for (const timer of timers.values()) {
        clearTimeout(timer);
      }
    };
  }, []);

  const value = useMemo(() => ({ toast, dismiss }), [toast, dismiss]);

  return (
    <ToastContext.Provider value={value}>
      {children}
      <section
        className="pointer-events-none fixed inset-x-4 bottom-4 z-50 flex flex-col items-end gap-2 sm:left-auto sm:right-6 sm:bottom-6"
        aria-label="Notificações"
      >
        {toasts.map((toastItem) => {
          const variant = toastItem.variant ?? "info";
          const Icon = toastIcons[variant];

          return (
            <div
              key={toastItem.id}
              role={variant === "error" ? "alert" : "status"}
              className={cn(
                "pointer-events-auto flex w-full max-w-sm items-start gap-3 rounded-xl border p-4 shadow-popover",
                toastVariants[variant],
              )}
            >
              <Icon className="mt-0.5 h-5 w-5 shrink-0" aria-hidden="true" />
              <div className="min-w-0 flex-1 space-y-1">
                <p className="text-sm font-semibold">{toastItem.title}</p>
                {toastItem.description && (
                  <p className="text-body opacity-90">
                    {toastItem.description}
                  </p>
                )}
              </div>
              <button
                type="button"
                className="rounded-md p-1 transition-colors hover:bg-black/5"
                aria-label="Fechar notificação"
                onClick={() => dismiss(toastItem.id)}
              >
                <X className="h-4 w-4" aria-hidden="true" />
              </button>
            </div>
          );
        })}
      </section>
    </ToastContext.Provider>
  );
}
