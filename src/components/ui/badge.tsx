import { cn } from "@/lib/utils";

export type BadgeVariant =
  | "default"
  | "secondary"
  | "success"
  | "danger"
  | "warning";

export type BadgeProps = React.HTMLAttributes<HTMLSpanElement> & {
  variant?: BadgeVariant;
};

const variants: Record<BadgeVariant, string> = {
  default: "border-transparent bg-primary-100 text-primary-800",
  secondary: "border-transparent bg-neutral-100 text-neutral-700",
  success: "border-transparent bg-success-100 text-success-800",
  danger: "border-transparent bg-danger-100 text-danger-800",
  warning: "border-transparent bg-warning-100 text-warning-800",
};

export function Badge({
  className,
  variant = "default",
  ...props
}: BadgeProps) {
  return (
    <span
      className={cn(
        "inline-flex items-center rounded-full border px-2.5 py-0.5 text-xs font-semibold transition-colors",
        variants[variant],
        className,
      )}
      {...props}
    />
  );
}
