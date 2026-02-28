import { Transaction } from "@/lib/types";
import { Card, CardHeader, CardTitle, CardContent } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { format } from "date-fns";
import { ArrowUpRight, ArrowDownLeft } from "lucide-react";
import { cn } from "@/lib/utils";

interface TransactionListProps {
  transactions: Transaction[];
}

export function TransactionList({ transactions }: TransactionListProps) {
  const sortedTransactions = [...transactions].sort(
    (a, b) => new Date(b.date).getTime() - new Date(a.date).getTime()
  );

  return (
    <Card className="nebula-card border-primary/20">
      <CardHeader>
        <CardTitle className="text-xl font-headline">Recent Transactions</CardTitle>
      </CardHeader>
      <CardContent className="p-0">
        <div className="divide-y divide-border/30">
          {sortedTransactions.length === 0 ? (
            <div className="p-8 text-center text-muted-foreground">
              No transactions yet. Add your first one above.
            </div>
          ) : (
            sortedTransactions.map((tx) => (
              <div
                key={tx.id}
                className="flex items-center justify-between p-4 hover:bg-white/5 transition-colors group"
              >
                <div className="flex items-center gap-4">
                  <div
                    className={cn(
                      "p-2 rounded-full",
                      tx.type === 'income' ? "bg-income/10 text-income" : "bg-expense/10 text-expense"
                    )}
                  >
                    {tx.type === 'income' ? <ArrowUpRight className="h-4 w-4" /> : <ArrowDownLeft className="h-4 w-4" />}
                  </div>
                  <div>
                    <p className="font-medium">{tx.description}</p>
                    <div className="flex items-center gap-2 text-xs text-muted-foreground">
                      <span>{format(new Date(tx.date), "MMM d, yyyy")}</span>
                      {tx.category && (
                        <>
                          <span>•</span>
                          <span>{tx.category}</span>
                        </>
                      )}
                    </div>
                  </div>
                </div>
                <div className="text-right">
                  <p
                    className={cn(
                      "font-headline font-bold",
                      tx.type === 'income' ? "text-income" : "text-expense"
                    )}
                  >
                    {tx.type === 'income' ? '+' : '-'}${tx.amount.toLocaleString()}
                  </p>
                </div>
              </div>
            ))
          )}
        </div>
      </CardContent>
    </Card>
  );
}
