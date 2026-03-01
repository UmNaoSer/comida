
"use client";

import React, { useState, useEffect } from "react";
import { Card, CardContent } from "@/components/ui/card";
import { Calendar, TrendingUp, DollarSign } from "lucide-react";
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
    if (!isMounted) return "0,00";
    // Usamos Math.abs para garantir que os valores sejam exibidos sem o sinal de negativo,
    // conforme solicitado pelo usuário para uma visão de volume financeiro.
    return Math.abs(val).toLocaleString('pt-BR', { minimumFractionDigits: 2 });
  };

  return (
    <div className="grid gap-6 md:grid-cols-2">
      {/* Total Card */}
      <Card className="bg-gradient-to-br from-indigo-900/60 to-blue-900/40 border-white/5 rounded-[2rem] relative overflow-hidden h-48">
        <DollarSign className="absolute right-4 top-1/2 -translate-y-1/2 h-32 w-32 text-white/5 pointer-events-none" />
        <CardContent className="p-8 flex flex-col justify-between h-full relative z-10">
          <div className="flex items-center gap-2 text-indigo-200/80">
            <Calendar className="h-4 w-4" />
            <p className="text-xs font-bold uppercase tracking-[0.2em]">Total em 2026</p>
          </div>
          <div className="space-y-1">
            <div className="flex items-baseline gap-2">
              <span className="text-accent text-lg font-bold">R$</span>
              <h2 className="text-5xl font-black tracking-tighter">
                {formatCurrency(balance)}
              </h2>
            </div>
            <p className="text-[10px] text-indigo-300/60 uppercase tracking-[0.2em]">Soma de todos os lançamentos</p>
          </div>
        </CardContent>
      </Card>

      {/* Media Card */}
      <Card className="bg-card/40 border-white/5 rounded-[2rem] relative overflow-hidden h-48">
        <TrendingUp className="absolute right-4 top-1/2 -translate-y-1/2 h-24 w-24 text-white/5 pointer-events-none" />
        <CardContent className="p-8 flex flex-col justify-between h-full relative z-10">
          <div className="text-cyan-400">
            <p className="text-xs font-bold uppercase tracking-[0.2em]">Média Mensal</p>
          </div>
          <div className="space-y-1">
            <div className="flex items-baseline gap-2">
              <span className="text-cyan-400 text-lg font-bold">R$</span>
              <h2 className="text-5xl font-black tracking-tighter">
                {formatCurrency(balance / 12)}
              </h2>
            </div>
            <p className="text-[10px] text-muted-foreground uppercase tracking-[0.2em]">Baseado em meses com gastos</p>
          </div>
        </CardContent>
      </Card>
    </div>
  );
}
