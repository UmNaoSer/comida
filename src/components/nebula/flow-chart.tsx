"use client";

import { useState } from "react";
import { Transaction } from "@/lib/types";
import { Card, CardHeader, CardTitle, CardContent } from "@/components/ui/card";
import { TrendingUp, ChevronLeft, ChevronRight, Calendar as CalendarIcon } from "lucide-react";
import {
  ChartConfig,
  ChartContainer,
  ChartTooltip,
  ChartTooltipContent,
} from "@/components/ui/chart";
import { Area, AreaChart, CartesianGrid, XAxis, YAxis } from "recharts";
import { format, startOfMonth, endOfMonth, eachMonthOfInterval, setYear, getYear } from "date-fns";
import { ptBR } from "date-fns/locale";
import { ScrollArea, ScrollBar } from "@/components/ui/scroll-area";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";

interface FlowChartProps {
  transactions: Transaction[];
}

export function FlowChart({ transactions }: FlowChartProps) {
  const currentYear = getYear(new Date());
  const [selectedYear, setSelectedYear] = useState<string>(currentYear.toString());

  // Generate all 12 months for the selected year
  const yearStart = new Date(parseInt(selectedYear), 0, 1);
  const yearEnd = new Date(parseInt(selectedYear), 11, 31);
  
  const months = eachMonthOfInterval({
    start: yearStart,
    end: yearEnd,
  });

  const chartData = months.map((month) => {
    const start = startOfMonth(month);
    const end = endOfMonth(month);
    
    const monthTransactions = transactions.filter((tx) => {
      const txDate = new Date(tx.date);
      return txDate >= start && txDate <= end;
    });

    const expenses = monthTransactions
      .filter((tx) => tx.type === 'expense')
      .reduce((sum, tx) => sum + tx.amount, 0);

    return {
      month: format(month, "MMM", { locale: ptBR }),
      expenses,
    };
  });

  const chartConfig = {
    expenses: {
      label: "Gastos",
      color: "hsl(var(--expense))",
    },
  } satisfies ChartConfig;

  // Generate year options (last 5 years)
  const yearOptions = Array.from({ length: 5 }, (_, i) => (currentYear - i).toString());

  return (
    <Card className="bg-card/40 border-white/5 rounded-[2rem] overflow-hidden">
      <CardHeader className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4 pb-0">
        <div className="space-y-1">
          <CardTitle className="text-lg font-bold uppercase tracking-tight flex items-center gap-2">
            <TrendingUp className="h-4 w-4 text-accent" />
            Fluxo de Caixa
          </CardTitle>
          <p className="text-[10px] text-muted-foreground uppercase tracking-widest">Gastos Mensais Detalhados</p>
        </div>

        <div className="flex items-center gap-3">
          <div className="flex items-center gap-2 bg-white/5 border border-white/10 rounded-xl px-3 py-1">
            <CalendarIcon className="h-3 w-3 text-accent" />
            <Select value={selectedYear} onValueChange={setSelectedYear}>
              <SelectTrigger className="h-7 border-none bg-transparent p-0 text-[11px] font-black uppercase tracking-widest focus:ring-0 w-20">
                <SelectValue />
              </SelectTrigger>
              <SelectContent className="bg-slate-950 border-white/10">
                {yearOptions.map(year => (
                  <SelectItem key={year} value={year} className="text-[11px] font-bold">{year}</SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>
        </div>
      </CardHeader>
      
      <CardContent className="pt-6">
        <ScrollArea className="w-full whitespace-nowrap rounded-md">
          <div className="w-[800px] h-[320px]">
            <ChartContainer config={chartConfig} className="h-full w-full">
              <AreaChart data={chartData} margin={{ left: 0, right: 20, top: 10, bottom: 0 }}>
                <defs>
                  <linearGradient id="fillExpenses" x1="0" y1="0" x2="0" y2="1">
                    <stop offset="5%" stopColor="hsl(var(--expense))" stopOpacity={0.3} />
                    <stop offset="95%" stopColor="hsl(var(--expense))" stopOpacity={0} />
                  </linearGradient>
                </defs>
                <CartesianGrid vertical={false} strokeDasharray="3 3" stroke="rgba(255,255,255,0.05)" />
                <XAxis
                  dataKey="month"
                  tickLine={false}
                  axisLine={false}
                  tickMargin={12}
                  tick={{ fill: 'rgba(255,255,255,0.5)', fontSize: 10, fontWeight: 'bold' }}
                />
                <YAxis
                  tickLine={false}
                  axisLine={false}
                  tickMargin={12}
                  tick={{ fill: 'rgba(255,255,255,0.5)', fontSize: 10, fontWeight: 'bold' }}
                  tickFormatter={(value) => `R$${value}`}
                />
                <ChartTooltip cursor={false} content={<ChartTooltipContent />} />
                <Area
                  dataKey="expenses"
                  type="monotone"
                  fill="url(#fillExpenses)"
                  stroke="hsl(var(--expense))"
                  strokeWidth={3}
                  dot={{ fill: 'hsl(var(--expense))', r: 4, strokeWidth: 2, stroke: '#000' }}
                  activeDot={{ r: 6, strokeWidth: 0 }}
                />
              </AreaChart>
            </ChartContainer>
          </div>
          <ScrollBar orientation="horizontal" className="bg-white/5" />
        </ScrollArea>
        
        <div className="mt-4 flex items-center justify-center gap-4 text-[9px] text-muted-foreground uppercase tracking-[0.3em] font-black">
          <ChevronLeft className="h-3 w-3 animate-pulse" />
          Arraste para navegar no ano
          <ChevronRight className="h-3 w-3 animate-pulse" />
        </div>
      </CardContent>
    </Card>
  );
}
