import { Transaction } from "@/lib/types";
import { Card, CardHeader, CardTitle, CardContent } from "@/components/ui/card";
import { format } from "date-fns";
import { ArrowUpRight, ArrowDownLeft, Trash2, Cpu } from "lucide-react";
import { cn } from "@/lib/utils";
import { useFirestore } from "@/firebase";
import { doc } from "firebase/firestore";
import { deleteDocumentNonBlocking } from "@/firebase/non-blocking-updates";
import { Button } from "@/components/ui/button";

interface TransactionListProps {
  transactions: Transaction[];
  userId: string;
  showAll?: boolean;
}

export function TransactionList({ transactions, userId, showAll = false }: TransactionListProps) {
  const db = useFirestore();

  const sortedTransactions = [...transactions].sort(
    (a, b) => new Date(b.date).getTime() - new Date(a.date).getTime()
  );

  const handleDelete = (txId: string) => {
    if (!db) return;
    const txRef = doc(db, "users", userId, "transactions", txId);
    deleteDocumentNonBlocking(txRef);
  };

  return (
    <Card className="nebula-card border-white/5 overflow-hidden">
      <CardHeader className="flex flex-row items-center justify-between">
        <CardTitle className="text-xl font-headline flex items-center gap-2">
          <Cpu className="h-5 w-5 text-primary" />
          {showAll ? "All Fluctuations" : "Recent Signals"}
        </CardTitle>
        <span className="text-[9px] font-mono text-muted-foreground uppercase tracking-widest">
          Count: {transactions.length}
        </span>
      </CardHeader>
      <CardContent className="p-0">
        <div className="divide-y divide-white/5">
          {sortedTransactions.length === 0 ? (
            <div className="p-16 text-center text-muted-foreground italic font-mono text-[10px] uppercase tracking-widest">
              Zero signals detected in current timeframe.
            </div>
          ) : (
            sortedTransactions.map((tx) => (
              <div
                key={tx.id}
                className="flex items-center justify-between p-5 hover:bg-white/[0.03] transition-colors group relative"
              >
                <div className="flex items-center gap-5">
                  <div
                    className={cn(
                      "p-3 rounded-2xl transition-all duration-300 group-hover:rotate-12",
                      tx.type === 'income' ? "bg-income/10 text-income" : "bg-expense/10 text-expense"
                    )}
                  >
                    {tx.type === 'income' ? <ArrowUpRight className="h-5 w-5" /> : <ArrowDownLeft className="h-5 w-5" />}
                  </div>
                  <div>
                    <p className="font-bold text-foreground/90 tracking-tight">{tx.description}</p>
                    <div className="flex items-center gap-3 mt-0.5">
                      <span className="text-[9px] font-mono text-muted-foreground uppercase">{format(new Date(tx.date), "dd MMM yyyy")}</span>
                      {tx.category && (
                        <>
                          <div className="w-1 h-1 rounded-full bg-white/10" />
                          <span className="text-[9px] font-mono text-accent/60 uppercase">{tx.category}</span>
                        </>
                      )}
                    </div>
                  </div>
                </div>
                <div className="flex items-center gap-6">
                  <div className="text-right">
                    <p
                      className={cn(
                        "font-headline font-bold text-lg tracking-tighter",
                        tx.type === 'income' ? "text-income" : "text-expense"
                      )}
                    >
                      {tx.type === 'income' ? '+' : '-'}${tx.amount.toLocaleString(undefined, { minimumFractionDigits: 2 })}
                    </p>
                  </div>
                  <Button 
                    variant="ghost" 
                    size="icon" 
                    onClick={() => handleDelete(tx.id)}
                    className="opacity-0 group-hover:opacity-100 text-muted-foreground hover:text-expense hover:bg-expense/10 transition-all rounded-full h-8 w-8"
                  >
                    <Trash2 className="h-4 w-4" />
                  </Button>
                </div>
              </div>
            ))
          )}
        </div>
      </CardContent>
    </Card>
  );
}
