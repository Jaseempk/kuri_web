import { ReactNode } from "react";
import { cn } from "../../lib/utils";

interface ContentPanelProps {
  children: ReactNode;
  className?: string;
}

export function ContentPanel({ children, className }: ContentPanelProps) {
  return (
    <div 
      className={cn(
        "flex-1 bg-white rounded-2xl p-8 shadow-sm min-h-[500px] flex flex-col",
        className
      )}
    >
      {children}
    </div>
  );
}

interface EmptyStateProps {
  icon: string;
  title: string;
  description: string;
  actionLabel?: string;
  onAction?: () => void;
}

export function EmptyState({ 
  icon, 
  title, 
  description, 
  actionLabel, 
  onAction 
}: EmptyStateProps) {
  return (
    <div className="flex flex-col items-center justify-center text-center py-12 flex-1">
      <span className="material-icons text-6xl text-muted-foreground mb-4">
        {icon}
      </span>
      <h2 className="text-xl font-semibold text-foreground mb-2">
        {title}
      </h2>
      <p className="text-muted-foreground max-w-xs mb-6">
        {description}
      </p>
      {actionLabel && onAction && (
        <button
          onClick={onAction}
          className="bg-primary text-primary-foreground px-6 py-3 rounded-full font-medium hover:bg-primary/90 transition-colors"
        >
          {actionLabel}
        </button>
      )}
    </div>
  );
}