import React from "react";
import { Check } from "lucide-react";

interface CheckboxProps {
  checked?: boolean;
  onCheckedChange?: (checked: boolean) => void;
  className?: string;
  disabled?: boolean;
}

export const Checkbox: React.FC<CheckboxProps> = ({
  checked = false,
  onCheckedChange,
  className = "",
  disabled = false,
}) => {
  const handleClick = () => {
    if (!disabled && onCheckedChange) {
      onCheckedChange(!checked);
    }
  };

  return (
    <button
      type="button"
      onClick={handleClick}
      disabled={disabled}
      className={`
        w-4 h-4 border border-gray-300 rounded flex items-center justify-center
        ${checked ? "bg-blue-600 border-blue-600" : "bg-white"}
        ${disabled ? "opacity-50 cursor-not-allowed" : "cursor-pointer hover:border-gray-400"}
        ${className}
      `}
    >
      {checked && <Check className="w-3 h-3 text-white" />}
    </button>
  );
};