import { Card, CardContent } from "@/components/ui/card";
import { Wallet, TrendingUp, TrendingDown } from "lucide-react";
import { cn } from "@/lib/utils";

interface SummaryCardsProps {
  balance: number;
  income: number;
  expenses: number;
}

export function SummaryCards({ balance, income, expenses }: SummaryCardsProps) {
  return (
    <div className="grid gap-4 md:grid-cols-3">
      <Card className="nebula-card border-accent/20 bg-gradient-to-br from-card to-primary/20">
        <CardContent className="p-6 flex flex-col gap-2">
          <div className="flex items-center justify-between">
            <p className="text-sm font-medium text-muted-foreground">Overall Balance</p>
            <Wallet className="h-4 w-4 text-accent" />
          </div>
          <h2 className="text-3xl font-headline font-bold tracking-tight">
            ${balance.toLocaleString(undefined, { minimumFractionDigits: 2 })}
          </h2>
        </CardContent>
      </Card>

      <Card className="nebula-card border-income/20">
        <CardContent className="p-6 flex flex-col gap-2">
          <div className="flex items-center justify-between">
            <p className="text-sm font-medium text-muted-foreground">Total Income</p>
            <TrendingUp className="h-4 w-4 text-income" />
          </div>
          <h2 className="text-3xl font-headline font-bold text-income tracking-tight">
            +${income.toLocaleString(undefined, { minimumFractionDigits: 2 })}
          </h2>
        </CardContent>
      </Card>

      <Card className="nebula-card border-expense/20">
        <CardContent className="p-6 flex flex-col gap-2">
          <div className="flex items-center justify-between">
            <p className="text-sm font-medium text-muted-foreground">Total Expenses</p>
            <TrendingDown className="h-4 w-4 text-expense" />
          </div>
          <h2 className="text-3xl font-headline font-bold text-expense tracking-tight">
            -${expenses.toLocaleString(undefined, { minimumFractionDigits: 2 })}
          </h2>
        </CardContent>
      </Card>
    </div>
  );
}
