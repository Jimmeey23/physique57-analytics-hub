import * as React from "react"
import * as TabsPrimitive from "@radix-ui/react-tabs"

import { cn } from "@/lib/utils"

const Tabs = TabsPrimitive.Root

const TabsList = React.forwardRef<
  React.ElementRef<typeof TabsPrimitive.List>,
  React.ComponentPropsWithoutRef<typeof TabsPrimitive.List>
>(({ className, ...props }, ref) => (
  <TabsPrimitive.List
    ref={ref}
    className={cn(
      // Primary in-page navigation: a raised segmented bar, not a faint strip.
      "p57-tablist inline-flex max-w-full flex-wrap items-center gap-1 rounded-2xl border border-slate-200/90 p-1.5 text-muted-foreground",
      "bg-[linear-gradient(180deg,#ffffff_0%,#f4f6f9_100%)] shadow-[0_10px_26px_-18px_rgba(14,23,41,0.55)]",
      "dark:border-[#2a2a2e] dark:bg-[linear-gradient(180deg,#141416_0%,#0f0f11_100%)]",
      className
    )}
    {...props}
  />
))
TabsList.displayName = TabsPrimitive.List.displayName

const TabsTrigger = React.forwardRef<
  React.ElementRef<typeof TabsPrimitive.Trigger>,
  React.ComponentPropsWithoutRef<typeof TabsPrimitive.Trigger>
>(({ className, ...props }, ref) => (
  <TabsPrimitive.Trigger
    ref={ref}
    className={cn(
      "p57-tabtrigger relative inline-flex min-h-10 items-center justify-center gap-2 whitespace-nowrap rounded-xl px-4 py-2 text-[13.5px] font-bold tracking-[-0.01em]",
      "ring-offset-background transition-all duration-150",
      "focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2",
      "disabled:pointer-events-none disabled:opacity-50",
      "text-slate-500 hover:-translate-y-[1px] hover:text-slate-900 hover:bg-white dark:text-slate-400 dark:hover:bg-white/5 dark:hover:text-slate-100",
      "data-[state=active]:bg-[linear-gradient(180deg,#2BBCFF_0%,#059BFF_55%,#0484DC_100%)] data-[state=active]:text-white",
      "data-[state=active]:shadow-[0_12px_24px_-12px_rgba(5,155,255,0.85),inset_0_1px_0_rgba(255,255,255,0.45)]",
      "data-[state=active]:[text-shadow:0_1px_2px_rgba(0,60,120,0.35)]",
      className
    )}
    {...props}
  />
))
TabsTrigger.displayName = TabsPrimitive.Trigger.displayName

const TabsContent = React.forwardRef<
  React.ElementRef<typeof TabsPrimitive.Content>,
  React.ComponentPropsWithoutRef<typeof TabsPrimitive.Content>
>(({ className, ...props }, ref) => (
  <TabsPrimitive.Content
    ref={ref}
    className={cn(
      "mt-4 ring-offset-background focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2",
      "data-[state=active]:animate-p57-enter",
      className
    )}
    {...props}
  />
))
TabsContent.displayName = TabsPrimitive.Content.displayName

export { Tabs, TabsList, TabsTrigger, TabsContent }
