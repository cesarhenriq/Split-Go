"use client";

import {
  cloneElement,
  createContext,
  isValidElement,
  useContext,
  useEffect,
  useRef,
  useState,
} from "react";
import { cn } from "@/lib/utils";

type DropdownMenuContextValue = {
  open: boolean;
  setOpen: (value: boolean) => void;
  triggerRef: React.RefObject<HTMLButtonElement | null>;
  contentRef: React.RefObject<HTMLDivElement | null>;
};

const DropdownMenuContext = createContext<DropdownMenuContextValue | null>(
  null,
);

function useDropdownMenuContext() {
  const context = useContext(DropdownMenuContext);

  if (!context) {
    throw new Error(
      "DropdownMenu components must be used inside a <DropdownMenu>",
    );
  }

  return context;
}

export function DropdownMenu({ children }: { children: React.ReactNode }) {
  const [open, setOpen] = useState(false);
  const triggerRef = useRef<HTMLButtonElement>(null);
  const contentRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    function handlePointerDown(event: Event) {
      const target = event.target as Node;
      const insideTrigger = triggerRef.current?.contains(target);
      const insideContent = contentRef.current?.contains(target);

      if (!insideTrigger && !insideContent) {
        setOpen(false);
      }
    }

    if (open) {
      document.addEventListener("mousedown", handlePointerDown);
      document.addEventListener("touchstart", handlePointerDown);
    }

    return () => {
      document.removeEventListener("mousedown", handlePointerDown);
      document.removeEventListener("touchstart", handlePointerDown);
    };
  }, [open]);

  return (
    <DropdownMenuContext.Provider
      value={{ open, setOpen, triggerRef, contentRef }}
    >
      <div className="relative inline-block text-left">{children}</div>
    </DropdownMenuContext.Provider>
  );
}

export function DropdownMenuTrigger({
  children,
  className,
  ...props
}: React.ButtonHTMLAttributes<HTMLButtonElement>) {
  const { open, setOpen, triggerRef } = useDropdownMenuContext();

  return (
    <button
      ref={triggerRef}
      type="button"
      aria-haspopup="menu"
      aria-expanded={open}
      onClick={() => setOpen(!open)}
      className={cn(
        "inline-flex items-center justify-center rounded-lg transition-colors",
        className,
      )}
      {...props}
    >
      {children}
    </button>
  );
}

function focusFirstItem(content: HTMLElement) {
  const items = content.querySelectorAll<HTMLElement>('[role="menuitem"]');
  items[0]?.focus();
}

function moveFocus(
  content: HTMLElement,
  direction: "next" | "previous" | "first" | "last",
) {
  const items = Array.from(
    content.querySelectorAll<HTMLElement>('[role="menuitem"]'),
  );

  if (items.length === 0) return;

  const active = document.activeElement as HTMLElement;
  let index = items.indexOf(active);

  if (direction === "first") index = 0;
  else if (direction === "last") index = items.length - 1;
  else if (direction === "next") index = (index + 1) % items.length;
  else index = index <= 0 ? items.length - 1 : index - 1;

  items[index]?.focus();
}

export function DropdownMenuContent({
  children,
  className,
  align = "start",
}: {
  children: React.ReactNode;
  className?: string;
  align?: "start" | "end";
}) {
  const { open, setOpen, contentRef, triggerRef } = useDropdownMenuContext();

  useEffect(() => {
    if (open && contentRef.current) {
      requestAnimationFrame(() => {
        if (contentRef.current) {
          focusFirstItem(contentRef.current);
        }
      });
    }
  }, [open, contentRef]);

  if (!open) return null;

  return (
    <div
      ref={contentRef}
      role="menu"
      aria-orientation="vertical"
      className={cn(
        "absolute z-50 mt-2 min-w-[12rem] rounded-xl border border-border bg-surface p-1 shadow-popover",
        align === "end" ? "right-0" : "left-0",
        className,
      )}
      onKeyDown={(event) => {
        if (event.key === "Escape") {
          event.preventDefault();
          setOpen(false);
          triggerRef.current?.focus();
        } else if (event.key === "ArrowDown") {
          event.preventDefault();
          moveFocus(event.currentTarget, "next");
        } else if (event.key === "ArrowUp") {
          event.preventDefault();
          moveFocus(event.currentTarget, "previous");
        } else if (event.key === "Home") {
          event.preventDefault();
          moveFocus(event.currentTarget, "first");
        } else if (event.key === "End") {
          event.preventDefault();
          moveFocus(event.currentTarget, "last");
        }
      }}
    >
      {children}
    </div>
  );
}

export function DropdownMenuLabel({
  className,
  ...props
}: React.HTMLAttributes<HTMLDivElement>) {
  return (
    <div
      className={cn(
        "px-2 py-1.5 text-xs font-semibold text-neutral-500",
        className,
      )}
      {...props}
    />
  );
}

export function DropdownMenuItem({
  asChild = false,
  className,
  onClick,
  children,
  ...props
}: React.ButtonHTMLAttributes<HTMLButtonElement> & { asChild?: boolean }) {
  const { setOpen } = useDropdownMenuContext();

  const handleClick = (event: React.MouseEvent<HTMLElement>) => {
    onClick?.(event as React.MouseEvent<HTMLButtonElement>);
    setOpen(false);
  };

  const classes = cn(
    "relative flex w-full cursor-pointer select-none items-center rounded-lg px-2 py-1.5 text-sm text-foreground transition-colors hover:bg-surface-muted focus:bg-surface-muted",
    className,
  );

  if (asChild && isValidElement(children)) {
    const child = children as React.ReactElement<
      React.HTMLAttributes<HTMLElement>
    >;

    return cloneElement(child, {
      role: "menuitem",
      className: cn(classes, child.props.className),
      onClick: (event: React.MouseEvent<HTMLElement>) => {
        child.props.onClick?.(event);
        handleClick(event);
      },
    });
  }

  return (
    <button
      type="button"
      role="menuitem"
      className={classes}
      onClick={handleClick}
      {...props}
    >
      {children}
    </button>
  );
}

export function DropdownMenuSeparator({
  className,
  ...props
}: React.HTMLAttributes<HTMLDivElement>) {
  return (
    <div className={cn("-mx-1 my-1 h-px bg-border", className)} {...props} />
  );
}
