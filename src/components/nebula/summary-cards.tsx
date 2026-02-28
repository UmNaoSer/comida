
"use client";

import React, { useState, useEffect } from "react";
import { Card, CardContent } from "@/components/ui/card";
import { Wallet, TrendingUp, TrendingDown } from "lucide-react";
import { cn } from "@/lib/utils";

interface SummaryCardsProps {
  balance: number;
  income: number;
  expenses: number;
}

export function SummaryCards({ balance, income, expenses }: SummaryCardsProps) {
  const [isMounted, setIsMounted] = useState(false);

  useEffect(() => {
    setIsMounted(true);
  }, []);

  const formatCurrency = (val: number) => {
    // Durante a renderização do servidor, usamos um formato estável para evitar erros de hidratação.
    if (!isMounted) return val.toFixed(2);
    // No cliente, após a montagem, usamos o formato local do usuário.
    return val.toLocaleString(undefined, { minimumFractionDigits: 2 });
  };

  return (
    <div className="grid gap-6 md:grid-cols-3">
      <Card className="nebula-card border-accent/20 bg-gradient-to-br from-card/80 to-primary/10 rounded-[2rem] relative overflow-hidden group">
        <div className="absolute -right-4 -top-4 w-24 h-24 bg-accent/10 rounded-full blur-2xl group-hover:bg-accent/20 transition-colors" />
        <CardContent className="p-8 flex flex-col gap-4 relative z-10">
          <div className="flex items-center justify-between">
            <p className="text-[10px] font-black text-muted-foreground uppercase tracking-[0.3em]">Neural Net Balance</p>
            <div className="p-2 bg-accent/10 rounded-xl">
              <Wallet className="h-4 w-4 text-accent" />
            </div>
          </div>
          <div className="space-y-1">
            <h2 className="text-4xl font-headline font-black tracking-tighter italic glow-text-accent">
              ${formatCurrency(balance)}
            </h2>
            <div className="flex items-center gap-2">
              <span className="text-[9px] font-mono text-accent uppercase tracking-widest px-2 py-0.5 bg-accent/10 rounded-full">Liquid Magnitude</span>
            </div>
          </div>
        </CardContent>
      </Card>

      <Card className="nebula-card border-income/20 bg-gradient-to-br from-card/80 to-income/5 rounded-[2rem] relative overflow-hidden group">
        <CardContent className="p-8 flex flex-col gap-4">
          <div className="flex items-center justify-between">
            <p className="text-[10px] font-black text-muted-foreground uppercase tracking-[0.3em]">Positive Flux</p>
            <div className="p-2 bg-income/10 rounded-xl">
              <TrendingUp className="h-4 w-4 text-income" />
            </div>
          </div>
          <div className="space-y-1">
            <h2 className="text-4xl font-headline font-black text-income tracking-tighter italic">
              +${formatCurrency(income)}
            </h2>
            <div className="flex items-center gap-2">
              <span className="text-[9px] font-mono text-income/60 uppercase tracking-widest">Inbound Vector</span>
            </div>
          </div>
        </CardContent>
      </Card>

      <Card className="nebula-card border-expense/20 bg-gradient-to-br from-card/80 to-expense/5 rounded-[2rem] relative overflow-hidden group">
        <CardContent className="p-8 flex flex-col gap-4">
          <div className="flex items-center justify-between">
            <p className="text-[10px] font-black text-muted-foreground uppercase tracking-[0.3em]">Negative Flux</p>
            <div className="p-2 bg-expense/10 rounded-xl">
              <TrendingDown className="h-4 w-4 text-expense" />
            </div>
          </div>
          <div className="space-y-1">
            <h2 className="text-4xl font-headline font-black text-expense tracking-tighter italic">
              -${formatCurrency(expenses)}
            </h2>
            <div className="flex items-center gap-2">
              <span className="text-[9px] font-mono text-expense/60 uppercase tracking-widest">Outbound Vector</span>
            </div>
          </div>
        </CardContent>
      </Card>
    </div>
  );
}
