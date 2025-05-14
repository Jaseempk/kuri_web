import { cn } from "../../lib/utils";

interface LoadingSkeletonProps {
  className?: string;
}

export const LoadingSkeleton = ({ className }: LoadingSkeletonProps) => {
  return (
    <div className={cn("min-h-screen bg-background", className)}>
      {/* Stats Banner Skeleton */}
      <div className="bg-[#F9F5F1] border-b border-[#E8DED1]">
        <div className="container mx-auto px-4 py-6">
          <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
            {[1, 2, 3].map((i) => (
              <div
                key={i}
                className="bg-white rounded-xl p-6 shadow-sm border border-[#E8DED1] animate-pulse"
              >
                <div className="h-4 bg-gray-200 rounded w-24 mb-4" />
                <div className="h-8 bg-gray-200 rounded w-32" />
              </div>
            ))}
          </div>
        </div>
      </div>

      {/* Main Content Skeleton */}
      <div className="container mx-auto px-4 py-8">
        {/* Header Skeleton */}
        <div className="flex flex-col md:flex-row justify-between items-center mb-8">
          <div className="text-left mb-4 md:mb-0">
            <div className="h-8 bg-gray-200 rounded w-48 mb-2" />
            <div className="h-4 bg-gray-200 rounded w-64" />
          </div>
          <div className="h-10 bg-gray-200 rounded w-32" />
        </div>

        {/* Filter Bar Skeleton */}
        <div className="sticky top-0 z-10 bg-background/80 backdrop-blur-sm border-b border-[#E8DED1] py-4 mb-8">
          <div className="flex flex-wrap gap-4 items-center">
            <div className="flex-1 min-w-[200px]">
              <div className="h-10 bg-gray-200 rounded-full" />
            </div>
            <div className="flex gap-3">
              {[1, 2, 3, 4].map((i) => (
                <div key={i} className="h-10 bg-gray-200 rounded-full w-24" />
              ))}
            </div>
          </div>
        </div>

        {/* Market Sections Skeleton */}
        {[1, 2].map((section) => (
          <section key={section} className="mb-12">
            <div className="flex items-center justify-between mb-6">
              <div>
                <div className="h-6 bg-gray-200 rounded w-40 mb-2" />
                <div className="h-4 bg-gray-200 rounded w-64" />
              </div>
            </div>
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-6">
              {[1, 2, 3].map((card) => (
                <div
                  key={card}
                  className="bg-white rounded-xl border border-gray-200 overflow-hidden animate-pulse"
                >
                  <div className="h-48 bg-gray-200" />
                  <div className="p-6 space-y-4">
                    <div className="h-4 bg-gray-200 rounded w-3/4" />
                    <div className="grid grid-cols-2 gap-4">
                      <div className="h-4 bg-gray-200 rounded" />
                      <div className="h-4 bg-gray-200 rounded" />
                    </div>
                    <div className="h-10 bg-gray-200 rounded" />
                  </div>
                </div>
              ))}
            </div>
          </section>
        ))}
      </div>
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
