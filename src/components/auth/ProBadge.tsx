import { Sparkles } from "lucide-react";
import { cn } from "@/lib/utils";

interface Props {
  className?: string;
  variant?: "default" | "compact";
}

/**
 * Small "PRO" tag shown on UI elements that require a Pro subscription.
 * Compact variant drops the icon for tight spaces (table cells, dropdowns).
 */
export function ProBadge({ className, variant = "default" }: Props) {
  return (
    <span
      className={cn(
        "inline-flex items-center gap-1 rounded-md bg-gradient-to-r from-amber-400 to-orange-500 px-1.5 py-0.5 text-[10px] font-semibold uppercase tracking-wider text-white shadow-sm",
        className,
      )}
      aria-label="Pro feature"
    >
      {variant === "default" && <Sparkles className="h-2.5 w-2.5" />}
      Pro
    </span>
  );
}
