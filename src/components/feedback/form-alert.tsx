import { cn } from "@/lib/utils";

export type FormAlertProps = {
  tone?: "error" | "success";
  children: React.ReactNode;
  className?: string;
};

export function FormAlert({
  tone = "error",
  children,
  className,
}: FormAlertProps) {
  return (
    <div
      role={tone === "error" ? "alert" : "status"}
      className={cn(
        "rounded-lg border px-4 py-3 text-body",
        tone === "error"
          ? "border-danger-200 bg-danger-50 text-danger-800"
          : "border-success-200 bg-success-50 text-success-800",
        className,
      )}
    >
      {children}
    </div>
  );
}
