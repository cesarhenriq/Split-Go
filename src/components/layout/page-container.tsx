import { cn } from "@/lib/utils";

export type PageContainerProps = React.HTMLAttributes<HTMLDivElement>;

export function PageContainer({ className, ...props }: PageContainerProps) {
  return (
    <div
      className={cn(
        "mx-auto w-full max-w-app px-4 py-6 sm:px-6 lg:px-8",
        className,
      )}
      {...props}
    />
  );
}
