"use client";

import { Transaction } from "@/lib/types";
import { Card, CardHeader, CardTitle, CardContent } from "@/components/ui/card";
import { TrendingUp, ChevronLeft, ChevronRight } from "lucide-react";
import {
  ChartConfig,
  ChartContainer,
  ChartTooltip,
  ChartTooltipContent,
} from "@/components/ui/chart";
import { Area, AreaChart, CartesianGrid, XAxis, YAxis, ResponsiveContainer } from "recharts";
import { format, startOfMonth, endOfMonth, eachMonthOfInterval, subMonths } from "date-fns";
import { ptBR } from "date-fns/locale";

interface FlowChartProps {
  transactions: Transaction[];
}

export function FlowChart({ transactions }: FlowChartProps) {
  const now = new Date();
  const months = eachMonthOfInterval({
    start: subMonths(now, 5),
    end: now,
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

  return (
    <Card className="bg-card/40 border-white/5 rounded-[2rem] overflow-hidden">
      <CardHeader className="flex flex-row items-center justify-between pb-0">
        <CardTitle className="text-lg font-bold uppercase tracking-tight flex items-center gap-2">
          <TrendingUp className="h-4 w-4 text-accent" />
          Gastos Mensais
        </CardTitle>
        <div className="flex items-center gap-4 text-[9px] text-muted-foreground uppercase tracking-widest">
          <div className="flex items-center gap-1 cursor-pointer hover:text-foreground transition-colors">
            <ChevronLeft className="h-3 w-3" />
            Arraste para ver mais
            <ChevronRight className="h-3 w-3" />
          </div>
        </div>
      </CardHeader>
      <CardContent className="pt-6">
        <ChartContainer config={chartConfig} className="h-[320px] w-full">
          <AreaChart data={chartData} margin={{ left: -20, right: 10, top: 10, bottom: 0 }}>
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
        
        {/* Scroll Indicator */}
        <div className="mt-4 h-1 w-full bg-white/5 rounded-full overflow-hidden">
          <div className="h-full w-full bg-accent rounded-full shadow-[0_0_10px_rgba(255,230,120,0.3)]" />
        </div>
      </CardContent>
    </Card>
  );
}