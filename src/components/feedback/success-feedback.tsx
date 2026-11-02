import { CircleCheck } from "lucide-react";
import { cn } from "@/lib/utils";

export type SuccessFeedbackProps = {
  title: string;
  description?: string;
  action?: React.ReactNode;
  className?: string;
};

export function SuccessFeedback({
  title,
  description,
  action,
  className,
}: SuccessFeedbackProps) {
  return (
    <div
      aria-live="polite"
      className={cn(
        "flex flex-col gap-3 rounded-xl border border-success-200 bg-success-50 p-4 text-success-900 sm:flex-row sm:items-center sm:justify-between",
        className,
      )}
    >
      <div className="flex items-start gap-3">
        <CircleCheck
          className="mt-0.5 h-5 w-5 shrink-0 text-success-600"
          aria-hidden="true"
        />
        <div className="space-y-1">
          <p className="text-sm font-semibold">{title}</p>
          {description && (
            <p className="text-body text-success-800">{description}</p>
          )}
        </div>
      </div>
      {action && <div className="shrink-0">{action}</div>}
    </div>
  );
}
