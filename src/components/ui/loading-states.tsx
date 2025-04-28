import { cn } from "../../lib/utils";

interface LoadingSkeletonProps {
  className?: string;
}

export const LoadingSkeleton = ({ className }: LoadingSkeletonProps) => {
  return (
    <div className={cn("container mx-auto px-4 py-8 space-y-16", className)}>
      {/* Hero Section Skeleton */}
      <section className="text-center space-y-4 mb-16">
        <div className="h-10 bg-gray-200 rounded-lg w-64 mx-auto" />{" "}
        {/* Title */}
        <div className="h-6 bg-gray-200 rounded-lg w-96 mx-auto" />{" "}
        {/* Subtitle */}
        <div className="h-10 bg-gray-200 rounded-full w-32 mx-auto" />{" "}
        {/* Button */}
      </section>

      {/* CTA Section Skeleton */}
      <section className="bg-[#FEF6F0]/50 p-6 rounded-xl mb-8">
        <div className="max-w-4xl mx-auto">
          <div className="grid md:grid-cols-[1fr,auto] gap-6 items-center">
            <div className="space-y-4">
              <div className="h-8 bg-gray-200 rounded-lg w-3/4" /> {/* Title */}
              <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                {[1, 2, 3].map((i) => (
                  <div key={i} className="flex items-center gap-2">
                    <div className="w-5 h-5 rounded-full bg-gray-200" />{" "}
                    {/* Icon */}
                    <div className="h-4 bg-gray-200 rounded w-24" />{" "}
                    {/* Text */}
                  </div>
                ))}
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* Market Sections */}
      {[1, 2].map((section) => (
        <section key={section} className="mb-12">
          <div className="flex justify-between items-center mb-6">
            <div className="h-8 bg-gray-200 rounded-lg w-48" />{" "}
            {/* Section Title */}
          </div>
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
            {[1, 2, 3].map((card) => (
              <div
                key={card}
                className="bg-white rounded-xl border border-gray-200 overflow-hidden"
              >
                {/* Card Header */}
                <div className="p-6 border-b border-gray-100">
                  <div className="flex items-center justify-between">
                    <div className="h-6 bg-gray-200 rounded w-24" />{" "}
                    {/* Title */}
                    <div className="h-5 bg-gray-200 rounded-full w-16" />{" "}
                    {/* Badge */}
                  </div>
                </div>

                {/* Card Content */}
                <div className="p-6 space-y-4">
                  <div className="space-y-2">
                    <div className="h-4 bg-gray-200 rounded w-20" />{" "}
                    {/* Label */}
                    <div className="h-4 bg-gray-200 rounded w-full" />{" "}
                    {/* Description */}
                  </div>

                  {/* Timer Box (for launch state) */}
                  <div className="bg-amber-50/30 p-3 rounded-lg space-y-2">
                    <div className="h-4 bg-gray-200 rounded w-32" />
                    <div className="h-4 bg-gray-200 rounded w-24" />
                  </div>

                  {/* Stats Grid */}
                  <div className="grid grid-cols-2 gap-4">
                    <div className="space-y-1">
                      <div className="h-3 bg-gray-200 rounded w-16" />{" "}
                      {/* Label */}
                      <div className="h-4 bg-gray-200 rounded w-20" />{" "}
                      {/* Value */}
                    </div>
                    <div className="space-y-1">
                      <div className="h-3 bg-gray-200 rounded w-16" />{" "}
                      {/* Label */}
                      <div className="h-4 bg-gray-200 rounded w-20" />{" "}
                      {/* Value */}
                    </div>
                  </div>
                </div>

                {/* Card Footer */}
                <div className="p-6 border-t border-gray-100">
                  <div className="h-9 bg-gray-200 rounded-lg w-full" />{" "}
                  {/* Button */}
                </div>
              </div>
            ))}
          </div>
        </section>
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
