import type { LucideIcon } from "lucide-react";
import { Button } from "@/components/ui/button";
import { cn } from "@/lib/utils";

interface EmptyStateProps {
  icon?: LucideIcon;
  title: string;
  description?: string;
  action?: {
    label: string;
    onClick: () => void;
    icon?: LucideIcon;
  };
  className?: string;
}

export function EmptyState({
  icon: Icon,
  title,
  description,
  action,
  className,
}: EmptyStateProps) {
  return (
    <div
      className={cn(
        "flex flex-col items-center justify-center px-6 py-12 text-center",
        className,
      )}
    >
      {Icon ? (
        <div className="mb-4 flex h-12 w-12 items-center justify-center rounded-full bg-secondary text-muted-foreground">
          <Icon className="h-6 w-6" />
        </div>
      ) : null}
      <p className="font-medium">{title}</p>
      {description ? (
        <p className="mt-1 max-w-sm text-sm text-muted-foreground">{description}</p>
      ) : null}
      {action ? (
        <Button onClick={action.onClick} className="mt-4">
          {action.icon ? <action.icon className="h-4 w-4" /> : null}
          {action.label}
        </Button>
      ) : null}
    </div>
  );
}
