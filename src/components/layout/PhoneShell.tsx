import { type ReactNode } from "react";
import { cn } from "@/lib/utils";

export function PhoneShell({
  children,
  className,
  padded = true,
}: {
  children: ReactNode;
  className?: string;
  padded?: boolean;
}) {
  return (
    <div className="min-h-screen bg-gradient-soft">
      <div className={cn("relative mx-auto flex min-h-screen max-w-[480px] flex-col bg-background", className)}>
        <div className={cn("flex-1", padded && "pb-28")}>{children}</div>
      </div>
    </div>
  );
}
