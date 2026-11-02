import { Info } from "lucide-react";
import { cn } from "@/lib/utils";

export type DemoNoticeProps = {
  children: React.ReactNode;
  className?: string;
};

export function DemoNotice({ children, className }: DemoNoticeProps) {
  return (
    <div
      role="note"
      className={cn(
        "flex gap-3 rounded-lg border border-primary-200 bg-primary-50 px-4 py-3 text-body text-primary-800",
        className,
      )}
    >
      <Info className="mt-0.5 h-4 w-4 shrink-0" aria-hidden="true" />
      <p>{children}</p>
    </div>
  );
}
