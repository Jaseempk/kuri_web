import * as React from "react";
import { cva, type VariantProps } from "class-variance-authority";
import { cn } from "../../lib/utils";

const badgeVariants = cva(
  "inline-flex items-center rounded-xl border px-2.5 py-0.5 text-xs font-semibold transition-all duration-300 focus:outline-none focus:ring-2 focus:ring-[hsl(var(--terracotta))] focus:ring-offset-2 hover:-translate-y-0.5 shadow-sm hover:shadow-md",
  {
    variants: {
      variant: {
        default:
          "border-transparent bg-[hsl(var(--terracotta))] text-white hover:bg-[hsl(var(--terracotta))/90]",
        secondary:
          "border-transparent bg-[hsl(var(--sand))] text-foreground hover:bg-[hsl(var(--sand))/90]",
        destructive:
          "border-transparent bg-red-500 text-white hover:bg-red-500/90",
        outline:
          "text-foreground border-[hsl(var(--gold))] hover:bg-[hsl(var(--gold))/10]",
        success:
          "border-transparent bg-[hsl(var(--forest))] text-white hover:bg-[hsl(var(--forest))/90]",
        warning:
          "border-transparent bg-[hsl(var(--ochre))] text-white hover:bg-[hsl(var(--ochre))/90]",
        gold: "border-transparent bg-[hsl(var(--gold))] text-foreground hover:bg-[hsl(var(--gold))/90]",
      },
    },
    defaultVariants: {
      variant: "default",
    },
  }
);

export interface BadgeProps
  extends React.HTMLAttributes<HTMLDivElement>,
    VariantProps<typeof badgeVariants> {}

function Badge({ className, variant, ...props }: BadgeProps) {
  return (
    <div className={cn(badgeVariants({ variant }), className)} {...props} />
  );
}

export { Badge, badgeVariants };
