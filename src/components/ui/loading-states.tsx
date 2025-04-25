import { cn } from "../../lib/utils";

interface LoadingSkeletonProps {
  className?: string;
  lines?: number;
}

export const LoadingSkeleton = ({
  className,
  lines = 3,
}: LoadingSkeletonProps) => {
  return (
    <div className={cn("animate-pulse space-y-4", className)}>
      {Array.from({ length: lines }).map((_, i) => (
        <div
          key={i}
          className={cn(
            "h-4 bg-gray-200 rounded",
            i === 0 ? "w-3/4" : i === lines - 1 ? "w-1/2" : "w-full"
          )}
        />
      ))}
    </div>
  );
};

interface TransactionLoadingProps {
  message?: string;
  className?: string;
}

export const TransactionLoading = ({
  message = "Transaction in progress...",
  className,
}: TransactionLoadingProps) => {
  return (
    <div
      className={cn("flex items-center justify-center space-x-2", className)}
    >
      <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-gray-900" />
      <span className="text-sm text-gray-600">{message}</span>
    </div>
  );
};

interface ErrorMessageProps {
  message: string;
  className?: string;
}

export const ErrorMessage = ({ message, className }: ErrorMessageProps) => {
  return (
    <div
      className={cn(
        "bg-red-50 border border-red-200 text-red-700 px-4 py-3 rounded relative",
        className
      )}
      role="alert"
    >
      <span className="block sm:inline">{message}</span>
    </div>
  );
};

interface SuccessMessageProps {
  message: string;
  className?: string;
}

export const SuccessMessage = ({ message, className }: SuccessMessageProps) => {
  return (
    <div
      className={cn(
        "bg-green-50 border border-green-200 text-green-700 px-4 py-3 rounded relative",
        className
      )}
      role="alert"
    >
      <span className="block sm:inline">{message}</span>
    </div>
  );
};
