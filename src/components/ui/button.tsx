import * as React from "react";
import { Slot } from "@radix-ui/react-slot";
import { cva, type VariantProps } from "class-variance-authority";
import { cn } from "../../lib/utils";

const buttonVariants = cva(
  "inline-flex items-center justify-center whitespace-nowrap rounded-xl text-sm font-medium transition-all duration-300 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[hsl(var(--terracotta))] focus-visible:ring-offset-2 disabled:pointer-events-none disabled:opacity-50 hover:-translate-y-0.5 shadow-sm hover:shadow-md",
  {
    variants: {
      variant: {
        default:
          "bg-[hsl(var(--terracotta))] text-white hover:bg-[hsl(var(--terracotta))/90]",
        destructive: "bg-red-500 text-white hover:bg-red-500/90",
        outline:
          "border border-[hsl(var(--gold))] bg-transparent text-foreground hover:bg-[hsl(var(--gold))/10]",
        secondary:
          "bg-[hsl(var(--sand))] text-foreground hover:bg-[hsl(var(--sand))/90]",
        ghost: "hover:bg-[hsl(var(--sand))/10] hover:text-foreground",
        link: "text-[hsl(var(--terracotta))] underline-offset-4 hover:underline",
        gold: "bg-[hsl(var(--gold))] text-foreground hover:bg-[hsl(var(--gold))/90]",
        forest:
          "bg-[hsl(var(--forest))] text-white hover:bg-[hsl(var(--forest))/90]",
        ochre:
          "bg-[hsl(var(--ochre))] text-white hover:bg-[hsl(var(--ochre))/90]",
        glass:
          "bg-white/10 backdrop-blur-[1px] text-white border border-white/20 hover:bg-white/20 hover:border-white/40",
      },
      size: {
        default: "h-10 px-4 py-2",
        sm: "h-9 rounded-lg px-3 text-xs",
        lg: "h-12 rounded-xl px-8 text-base",
        xl: "h-14 rounded-xl px-10 text-base",
        icon: "h-10 w-10 rounded-lg",
      },
    },
    defaultVariants: {
      variant: "default",
      size: "default",
    },
  }
);

export interface ButtonProps
  extends React.ButtonHTMLAttributes<HTMLButtonElement>,
    VariantProps<typeof buttonVariants> {
  asChild?: boolean;
}

const Button = React.forwardRef<HTMLButtonElement, ButtonProps>(
  ({ className, variant, size, asChild = false, ...props }, ref) => {
    const Comp = asChild ? Slot : "button";
    return (
      <Comp
        className={cn(buttonVariants({ variant, size, className }))}
        ref={ref}
        {...props}
      />
    );
  }
);
Button.displayName = "Button";

export { Button, buttonVariants };
