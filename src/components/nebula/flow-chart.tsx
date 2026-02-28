import { Transaction } from "@/lib/types";
import { Card, CardHeader, CardTitle, CardContent, CardDescription } from "@/components/ui/card";
import {
  ChartConfig,
  ChartContainer,
  ChartTooltip,
  ChartTooltipContent,
  ChartLegend,
  ChartLegendContent,
} from "@/components/ui/chart";
import { Area, AreaChart, CartesianGrid, XAxis, YAxis, ResponsiveContainer } from "recharts";
import { format, startOfMonth, endOfMonth, eachMonthOfInterval, subMonths } from "date-fns";

interface FlowChartProps {
  transactions: Transaction[];
}

export function FlowChart({ transactions }: FlowChartProps) {
  // Aggregate data for the last 6 months
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

    const income = monthTransactions
      .filter((tx) => tx.type === 'income')
      .reduce((sum, tx) => sum + tx.amount, 0);
      
    const expense = monthTransactions
      .filter((tx) => tx.type === 'expense')
      .reduce((sum, tx) => sum + tx.amount, 0);

    return {
      month: format(month, "MMM"),
      income,
      expense,
    };
  });

  const chartConfig = {
    income: {
      label: "Income",
      color: "hsl(var(--income))",
    },
    expense: {
      label: "Expense",
      color: "hsl(var(--expense))",
    },
  } satisfies ChartConfig;

  return (
    <Card className="nebula-card border-primary/20">
      <CardHeader>
        <CardTitle className="text-xl font-headline">Financial Flow</CardTitle>
        <CardDescription>Income vs Expenses over the last 6 months</CardDescription>
      </CardHeader>
      <CardContent>
        <ChartContainer config={chartConfig} className="h-[300px] w-full">
          <AreaChart data={chartData} margin={{ left: -20, right: 10, top: 10, bottom: 0 }}>
            <defs>
              <linearGradient id="fillIncome" x1="0" y1="0" x2="0" y2="1">
                <stop offset="5%" stopColor="var(--color-income)" stopOpacity={0.3} />
                <stop offset="95%" stopColor="var(--color-income)" stopOpacity={0} />
              </linearGradient>
              <linearGradient id="fillExpense" x1="0" y1="0" x2="0" y2="1">
                <stop offset="5%" stopColor="var(--color-expense)" stopOpacity={0.3} />
                <stop offset="95%" stopColor="var(--color-expense)" stopOpacity={0} />
              </linearGradient>
            </defs>
            <CartesianGrid vertical={false} strokeDasharray="3 3" stroke="rgba(255,255,255,0.1)" />
            <XAxis
              dataKey="month"
              tickLine={false}
              axisLine={false}
              tickMargin={8}
              tickFormatter={(value) => value}
            />
            <YAxis
              tickLine={false}
              axisLine={false}
              tickMargin={8}
              tickFormatter={(value) => `$${value}`}
            />
            <ChartTooltip cursor={false} content={<ChartTooltipContent indicator="dot" />} />
            <Area
              dataKey="income"
              type="monotone"
              fill="url(#fillIncome)"
              stroke="var(--color-income)"
              strokeWidth={2}
              stackId="a"
            />
            <Area
              dataKey="expense"
              type="monotone"
              fill="url(#fillExpense)"
              stroke="var(--color-expense)"
              strokeWidth={2}
              stackId="a"
            />
            <ChartLegend content={<ChartLegendContent />} />
          </AreaChart>
        </ChartContainer>
      </CardContent>
    </Card>
  );
}
