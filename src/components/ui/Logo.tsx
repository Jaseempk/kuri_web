import React from "react";
import { Link } from "react-router-dom";

interface LogoProps {
  className?: string;
  showText?: boolean;
  onClick?: () => void;
  variant?: "landing" | "layout";
}

export const Logo: React.FC<LogoProps> = ({
  className = "",
  showText = true,
  onClick,
  variant = "landing",
}) => {
  const textColors =
    variant === "landing"
      ? {
          k: "text-[hsl(var(--gold))]",
          uri: "text-white",
          gradient: "from-[hsl(var(--gold))] to-white",
        }
      : {
          k: "text-[hsl(var(--gold))]",
          uri: "text-foreground",
          gradient: "from-[hsl(var(--gold))] to-foreground",
        };

  return (
    <Link
      to="/"
      className={`flex items-center hover:opacity-80 transition-opacity ${className}`}
      onClick={onClick}
    >
      <img
        src="/images/KuriLogo.png"
        alt="Kuri Logo"
        className="h-24 w-24 object-contain translate-y-1"
      />
    </Link>
  );
};
