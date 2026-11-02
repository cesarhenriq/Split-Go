import Link from "next/link";
import {
  type ButtonSize,
  type ButtonVariant,
  buttonClassName,
} from "@/components/ui/button";

export type ButtonLinkProps = React.ComponentProps<typeof Link> & {
  variant?: ButtonVariant;
  size?: ButtonSize;
};

export function ButtonLink({
  className,
  variant = "default",
  size = "md",
  ...props
}: ButtonLinkProps) {
  return (
    <Link
      className={buttonClassName({ variant, size, className })}
      {...props}
    />
  );
}
