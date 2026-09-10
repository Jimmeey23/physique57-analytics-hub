import * as React from "react"
import { cva, type VariantProps } from "class-variance-authority"

import { cn } from "@/lib/utils"

const badgeVariants = cva(
  "inline-flex items-center gap-1 rounded-full border px-2.5 py-0.5 text-[11px] font-bold tracking-wide transition-colors focus:outline-none focus:ring-2 focus:ring-ring focus:ring-offset-2 tabular-nums",
  {
    variants: {
      variant: {
        default: "border-transparent bg-ink text-white dark:bg-white dark:text-slate-900",
        brand: "border-transparent bg-primary text-white",
        secondary: "border-border bg-secondary text-secondary-foreground",
        success: "border-transparent bg-[#eaf8f2] text-[#147153] dark:bg-[rgba(20,128,92,0.2)] dark:text-[#4ade9e]",
        warning: "border-transparent bg-[#fff7dc] text-[#8a6512] dark:bg-[rgba(180,129,20,0.2)] dark:text-[#f2ce72]",
        destructive: "border-transparent bg-destructive text-destructive-foreground",
        info: "border-transparent bg-[#eaf2ff] text-[#0052c9] dark:bg-[rgba(0,94,237,0.2)] dark:text-[#8cb8ff]",
        outline: "text-foreground border-border",
      },
    },
    defaultVariants: {
      variant: "default",
    },
  }
)

export interface BadgeProps
  extends React.HTMLAttributes<HTMLDivElement>,
    VariantProps<typeof badgeVariants> {}

function Badge({ className, variant, ...props }: BadgeProps) {
  return (
    <div className={cn(badgeVariants({ variant }), className)} {...props} />
  )
}

export { Badge, badgeVariants }
