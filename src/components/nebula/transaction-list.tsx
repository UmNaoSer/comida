"use client";

import React, { useState, useEffect } from "react";
import { Transaction } from "@/lib/types";
import { Card, CardHeader, CardTitle, CardContent } from "@/components/ui/card";
import { format } from "date-fns";
import { ptBR } from "date-fns/locale";
import { ArrowUpRight, ArrowDownLeft, Trash2, ListChecks } from "lucide-react";
import { cn } from "@/lib/utils";
import { useFirestore } from "@/firebase";
import { doc } from "firebase/firestore";
import { deleteDocumentNonBlocking } from "@/firebase/non-blocking-updates";
import { Button } from "@/components/ui/button";

interface TransactionListProps {
  transactions: Transaction[];
  userId: string;
  showAll?: boolean;
  compact?: boolean;
}

export function TransactionList({ transactions, userId, showAll = false, compact = false }: TransactionListProps) {
  const db = useFirestore();
  const [isMounted, setIsMounted] = useState(false);

  useEffect(() => {
    setIsMounted(true);
  }, []);

  const sortedTransactions = [...transactions].sort(
    (a, b) => new Date(b.date).getTime() - new Date(a.date).getTime()
  );

  const handleDelete = (txId: string) => {
    if (!db) return;
    const txRef = doc(db, "users", userId, "transactions", txId);
    deleteDocumentNonBlocking(txRef);
  };

  const formatCurrency = (amount: number) => {
    if (!isMounted) return amount.toFixed(2);
    return amount.toLocaleString('pt-BR', { minimumFractionDigits: 2 });
  };

  const formatDate = (dateStr: string) => {
    const date = new Date(dateStr);
    return format(date, "dd MMM yyyy", { locale: ptBR });
  };

  if (compact) {
    return (
      <div className="divide-y divide-white/5 -mx-6">
        {sortedTransactions.map((tx) => (
          <div
            key={tx.id}
            className="flex items-center justify-between px-6 py-4 hover:bg-white/[0.02] transition-colors group"
          >
            <div className="flex items-center gap-4">
              <div
                className={cn(
                  "p-2 rounded-xl",
                  tx.type === 'income' ? "bg-income/10 text-income" : "bg-expense/10 text-expense"
                )}
              >
                {tx.type === 'income' ? <ArrowUpRight className="h-4 w-4" /> : <ArrowDownLeft className="h-4 w-4" />}
              </div>
              <div>
                <p className="font-bold text-sm text-foreground/90">{tx.description}</p>
                <p className="text-[9px] font-mono text-muted-foreground uppercase">{formatDate(tx.date)}</p>
              </div>
            </div>
            <div className="text-right">
              <p className={cn(
                "font-bold text-sm",
                tx.type === 'income' ? "text-income" : "text-expense"
              )}>
                {tx.type === 'income' ? '+' : '-'}R$ {formatCurrency(tx.amount)}
              </p>
            </div>
          </div>
        ))}
      </div>
    );
  }

  return (
    <Card className="nebula-card border-white/5 overflow-hidden">
      <CardHeader className="flex flex-row items-center justify-between">
        <CardTitle className="text-xl font-headline flex items-center gap-2">
          <ListChecks className="h-5 w-5 text-primary" />
          {showAll ? "Todas as Transações" : "Transações Recentes"}
        </CardTitle>
        <span className="text-[9px] font-mono text-muted-foreground uppercase tracking-widest">
          Total: {transactions.length}
        </span>
      </CardHeader>
      <CardContent className="p-0">
        <div className="divide-y divide-white/5">
          {sortedTransactions.length === 0 ? (
            <div className="p-16 text-center text-muted-foreground italic font-mono text-[10px] uppercase tracking-widest">
              Nenhuma transação encontrada.
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
                      <span className="text-[9px] font-mono text-muted-foreground uppercase">{formatDate(tx.date)}</span>
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
                      {tx.type === 'income' ? '+' : '-'}R$ {formatCurrency(tx.amount)}
                    </p>
                  </div>
                  <button 
                    onClick={() => handleDelete(tx.id)}
                    className="opacity-0 group-hover:opacity-100 text-muted-foreground hover:text-expense transition-all"
                  >
                    <Trash2 className="h-4 w-4" />
                  </button>
                </div>
              </div>
            ))
          )}
        </div>
      </CardContent>
    </Card>
  );
}
