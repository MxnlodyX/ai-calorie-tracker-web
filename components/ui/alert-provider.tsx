"use client";

import {
  createContext,
  type ReactNode,
  useCallback,
  useContext,
  useMemo,
  useState,
} from "react";
import { AlertCircle, CheckCircle2, Info, X } from "lucide-react";

type AlertType = "success" | "error" | "info";

type AlertInput = {
  type?: AlertType;
  title: string;
  message?: string;
};

type AlertItem = AlertInput & {
  id: string;
  type: AlertType;
};

type AlertContextValue = {
  showAlert: (alert: AlertInput) => void;
};

const AlertContext = createContext<AlertContextValue | null>(null);

const alertStyles: Record<AlertType, string> = {
  success: "bg-[#f3fbf1]",
  error: "bg-[#fff0df]",
  info: "bg-[#e9fbff]",
};

const alertIcons = {
  success: CheckCircle2,
  error: AlertCircle,
  info: Info,
};

export function AlertProvider({ children }: { children: ReactNode }) {
  const [alerts, setAlerts] = useState<AlertItem[]>([]);

  const dismissAlert = useCallback((id: string) => {
    setAlerts((currentAlerts) =>
      currentAlerts.filter((alert) => alert.id !== id),
    );
  }, []);

  const showAlert = useCallback(
    ({ type = "success", title, message }: AlertInput) => {
      const id = crypto.randomUUID();

      setAlerts((currentAlerts) => [
        ...currentAlerts,
        { id, type, title, message },
      ]);
      window.setTimeout(() => dismissAlert(id), 3600);
    },
    [dismissAlert],
  );

  const value = useMemo(() => ({ showAlert }), [showAlert]);

  return (
    <AlertContext.Provider value={value}>
      {children}
      <div
        className="fixed right-3 top-3 z-[200] flex w-[calc(100vw-1.5rem)] max-w-sm flex-col gap-3 sm:right-5 sm:top-5"
        aria-live="polite"
        aria-atomic="true"
      >
        {alerts.map((alert) => {
          const Icon = alertIcons[alert.type];

          return (
            <div
              key={alert.id}
              className={`rounded-[1rem] border-2 border-[#20342d] p-3 text-[#20342d] shadow-[0_5px_0_#20342d] ${alertStyles[alert.type]}`}
              role={alert.type === "error" ? "alert" : "status"}
            >
              <div className="flex items-start gap-3">
                <span className="grid size-9 shrink-0 place-items-center rounded-full border-2 border-[#20342d] bg-white">
                  <Icon className="size-5" aria-hidden="true" />
                </span>
                <div className="min-w-0 flex-1">
                  <p className="text-sm font-black">{alert.title}</p>
                  {alert.message ? (
                    <p className="mt-1 text-xs font-bold leading-5 text-[#66766f]">
                      {alert.message}
                    </p>
                  ) : null}
                </div>
                <button
                  type="button"
                  onClick={() => dismissAlert(alert.id)}
                  className="grid size-8 shrink-0 place-items-center rounded-full border-2 border-[#20342d] bg-white transition hover:-translate-y-0.5 focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-[#20342d]"
                  aria-label="Dismiss alert"
                >
                  <X className="size-4" aria-hidden="true" />
                </button>
              </div>
            </div>
          );
        })}
      </div>
    </AlertContext.Provider>
  );
}

export function useAlert() {
  const context = useContext(AlertContext);

  if (!context) {
    throw new Error("useAlert must be used inside AlertProvider.");
  }

  return context;
}
