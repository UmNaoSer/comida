"use client"

import * as React from "react"
import { ChevronLeft, ChevronRight } from "lucide-react"
import { DayPicker } from "react-day-picker"
import { ptBR } from "date-fns/locale"

import { cn } from "@/lib/utils"
import { buttonVariants } from "@/components/ui/button"

export type CalendarProps = React.ComponentProps<typeof DayPicker>

function Calendar({
  className,
  classNames,
  showOutsideDays = true,
  ...props
}: CalendarProps) {
  return (
    <DayPicker
      showOutsideDays={showOutsideDays}
      className={cn("p-4 sm:p-6", className)}
      locale={ptBR}
      classNames={{
        months: "flex flex-col sm:flex-row space-y-4 sm:space-x-4 sm:space-y-0",
        month: "space-y-4 relative",
        month_caption: "flex justify-center relative items-center h-10 mb-6 px-10",
        caption_label: "text-sm font-bold uppercase tracking-widest text-indigo-100",
        nav: "flex items-center",
        button_previous: cn(
          buttonVariants({ variant: "outline" }),
          "h-8 w-8 bg-transparent p-0 opacity-50 hover:opacity-100 border-white/10 hover:bg-white/5 transition-all absolute left-0 top-1 z-20"
        ),
        button_next: cn(
          buttonVariants({ variant: "outline" }),
          "h-8 w-8 bg-transparent p-0 opacity-50 hover:opacity-100 border-white/10 hover:bg-white/5 transition-all absolute right-0 top-1 z-20"
        ),
        month_grid: "w-full border-collapse",
        weekdays: "flex mb-2",
        weekday: "text-indigo-400/50 rounded-md w-10 font-black text-[10px] uppercase tracking-tighter text-center",
        week: "flex w-full mt-1",
        day: cn(
          buttonVariants({ variant: "ghost" }),
          "h-10 w-10 p-0 font-medium aria-selected:opacity-100 hover:bg-accent/20 hover:text-accent transition-all rounded-md text-sm"
        ),
        day_button: "h-10 w-10 p-0 font-medium aria-selected:opacity-100 rounded-md",
        range_start: "day-range-start",
        range_end: "day-range-end",
        selected:
          "bg-accent text-accent-foreground hover:bg-accent hover:text-accent-foreground focus:bg-accent focus:text-accent-foreground shadow-lg shadow-accent/20 font-bold",
        today: "bg-white/5 text-accent border border-accent/30 font-bold",
        outside:
          "day-outside text-muted-foreground opacity-30 aria-selected:bg-accent/50 aria-selected:text-muted-foreground",
        disabled: "text-muted-foreground opacity-50",
        range_middle:
          "aria-selected:bg-accent aria-selected:text-accent-foreground",
        hidden: "invisible",
        ...classNames,
      }}
      components={{
        Chevron: ({ ...props }) => {
          if (props.orientation === 'left') return <ChevronLeft className="h-4 w-4" />;
          return <ChevronRight className="h-4 w-4" />;
        },
      }}
      {...props}
    />
  )
}
Calendar.displayName = "Calendar"

export { Calendar }
