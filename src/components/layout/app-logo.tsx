import { Wallet } from "lucide-react";
import Link from "next/link";
import { siteConfig } from "@/config/site";
import { cn } from "@/lib/utils";

export type AppLogoProps = {
  href?: string;
  showName?: boolean;
  tone?: "default" | "inverse";
  className?: string;
};

const tones = {
  default: {
    icon: "bg-primary-600 text-white shadow-sm",
    name: "text-foreground",
  },
  inverse: {
    icon: "bg-white/15 text-white",
    name: "text-white",
  },
};

export function AppLogo({
  href,
  showName = true,
  tone = "default",
  className,
}: AppLogoProps) {
  const classes = tones[tone];

  const content = (
    <>
      <span
        className={cn(
          "flex h-10 w-10 items-center justify-center rounded-xl",
          classes.icon,
        )}
      >
        <Wallet className="h-5 w-5" aria-hidden="true" />
      </span>
      {showName && (
        <span className={cn("text-lg font-bold tracking-tight", classes.name)}>
          {siteConfig.name}
        </span>
      )}
    </>
  );

  const baseClasses = cn("inline-flex items-center gap-3", className);

  if (href) {
    return (
      <Link href={href} className={baseClasses}>
        {content}
      </Link>
    );
  }

  return <div className={baseClasses}>{content}</div>;
}
