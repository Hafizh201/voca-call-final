import { cn } from "@/lib/utils";
import type { ButtonHTMLAttributes, ReactNode } from "react";

type Props = ButtonHTMLAttributes<HTMLButtonElement> & {
  variant?: "primary" | "secondary" | "ghost" | "danger";
  size?: "md" | "lg";
  block?: boolean;
  leading?: ReactNode;
  trailing?: ReactNode;
};

export function BigButton({
  className,
  variant = "primary",
  size = "lg",
  block = true,
  leading,
  trailing,
  children,
  ...rest
}: Props) {
  const variants = {
    primary: "bg-primary text-primary-foreground shadow-glow hover:brightness-110",
    secondary: "bg-surface-2 text-foreground",
    ghost: "bg-transparent text-foreground",
    danger: "bg-destructive text-destructive-foreground",
  } as const;
  const sizes = { md: "h-12 px-5 text-sm", lg: "h-14 px-6 text-base" };
  return (
    <button
      className={cn(
        "inline-flex items-center justify-center gap-2 rounded-2xl font-semibold transition active:scale-[0.98] disabled:pointer-events-none disabled:opacity-50",
        variants[variant],
        sizes[size],
        block && "w-full",
        className,
      )}
      {...rest}
    >
      {leading}
      <span>{children}</span>
      {trailing}
    </button>
  );
}
