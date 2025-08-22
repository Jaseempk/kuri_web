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
        "flex-1 bg-white rounded-2xl p-6 mx-4 shadow-lg min-h-[500px] flex flex-col md:p-8 md:mx-0 md:shadow-sm",
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
    <div className="text-center py-12 px-4 flex-1">
      <div className="flex justify-center items-center h-20 w-20 bg-gray-100 rounded-full mx-auto mb-6">
        <span className="material-icons text-4xl text-gray-400">
          {icon}
        </span>
      </div>
      <h3 className="text-xl font-semibold text-gray-800 mb-2">
        {title}
      </h3>
      <p className="text-gray-500 mb-6">
        {description}
      </p>
      {actionLabel && onAction && (
        <button
          onClick={onAction}
          className="bg-primary text-white font-semibold py-3 px-6 rounded-full shadow-md hover:bg-opacity-90 transition duration-300 flex items-center mx-auto"
        >
          <span className="material-icons mr-2">add_circle_outline</span>
          {actionLabel}
        </button>
      )}
    </div>
  );
}