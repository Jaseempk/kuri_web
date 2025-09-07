import { CheckCircle, Clock } from "lucide-react";
import type { PaymentStatus } from "../../hooks/useCircleMembers";

interface PaymentStatusBadgeProps {
  paymentStatus?: PaymentStatus;
  className?: string;
}

export const PaymentStatusBadge: React.FC<PaymentStatusBadgeProps> = ({ 
  paymentStatus,
  className = ""
}) => {
  // Only render if payment is due
  if (!paymentStatus?.isPaymentDue) return null;
  
  const isPaid = paymentStatus.isPaid;
  
  return (
    <div className={`inline-flex items-center gap-1 px-2 py-1 rounded-full text-xs font-medium transition-all duration-200 ${
      isPaid 
        ? 'bg-green-100 text-green-800 border border-green-200' 
        : 'bg-amber-100 text-amber-800 border border-amber-200'
    } ${className}`}>
      {isPaid ? (
        <>
          <CheckCircle className="w-3 h-3" />
          <span>Paid</span>
        </>
      ) : (
        <>
          <Clock className="w-3 h-3" />
          <span>Due</span>
        </>
      )}
    </div>
  );
};