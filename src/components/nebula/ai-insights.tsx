'use client';

import React, { useState } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Sparkles, BrainCircuit, Lightbulb, Loader2 } from 'lucide-react';
import { getFinancialAdvisorInsights, type FinancialAdvisorInsightsOutput } from '@/ai/flows/financial-advisor-insights-flow';
import { Transaction } from '@/lib/types';

interface AIInsightsProps {
  transactions: Transaction[];
}

export function AIInsights({ transactions }: AIInsightsProps) {
  const [loading, setLoading] = useState(false);
  const [insights, setInsights] = useState<FinancialAdvisorInsightsOutput | null>(null);

  async function handleGenerateInsights() {
    if (transactions.length === 0) return;
    setLoading(true);
    try {
      const result = await getFinancialAdvisorInsights({
        transactions: transactions.map(t => ({
          id: t.id,
          description: t.description,
          amount: t.amount,
          type: t.type,
          date: t.date
        }))
      });
      setInsights(result);
    } catch (error) {
      console.error("Erro ao gerar insights:", error);
    } finally {
      setLoading(false);
    }
  }

  return (
    <Card className="nebula-card border-accent/20 rounded-[2rem] overflow-hidden relative group">
      <div className="absolute inset-0 bg-gradient-to-br from-accent/5 to-transparent opacity-0 group-hover:opacity-100 transition-opacity" />
      
      <CardHeader className="flex flex-row items-center justify-between pb-2 relative z-10">
        <CardTitle className="text-xl font-headline font-black flex items-center gap-3 text-accent italic uppercase tracking-tighter">
          <BrainCircuit className="h-6 w-6 glow-accent" />
          Assistente de IA
        </CardTitle>
        <Button 
          onClick={handleGenerateInsights} 
          disabled={loading || transactions.length === 0}
          className="bg-accent text-accent-foreground hover:bg-accent/90 rounded-full h-10 px-6 font-bold uppercase text-[10px] tracking-widest shadow-lg shadow-accent/20 transition-all active:scale-95"
        >
          {loading ? <Loader2 className="h-4 w-4 animate-spin" /> : <><Sparkles className="mr-2 h-4 w-4" /> Gerar Insights</>}
        </Button>
      </CardHeader>

      <CardContent className="relative z-10">
        {!insights && !loading ? (
          <div className="py-8 text-center">
            <p className="text-[10px] text-muted-foreground uppercase tracking-[0.3em] font-medium max-w-xs mx-auto">
              {transactions.length > 0 
                ? "Clique para analisar suas finanças."
                : "Nenhuma transação disponível para análise."}
            </p>
          </div>
        ) : loading ? (
          <div className="py-12 flex flex-col items-center gap-4">
            <div className="relative">
              <div className="absolute inset-0 bg-accent/20 blur-xl rounded-full animate-pulse" />
              <div className="h-10 w-10 text-accent animate-bounce relative z-10 flex items-center justify-center">
                <BrainCircuit className="h-8 w-8" />
              </div>
            </div>
            <p className="text-[10px] text-accent font-black uppercase tracking-[0.4em] animate-pulse">Processando dados...</p>
          </div>
        ) : (
          <div className="space-y-6 animate-in fade-in slide-in-from-bottom-2 duration-500">
            <div className="bg-white/5 rounded-2xl p-5 border border-white/5">
              <div className="flex items-center gap-2 mb-3">
                <BrainCircuit className="h-4 w-4 text-accent" />
                <h4 className="text-[11px] font-black uppercase tracking-widest text-accent">Padrões Identificados</h4>
              </div>
              <p className="text-sm text-indigo-100/80 leading-relaxed font-medium">{insights?.spendingPatterns}</p>
            </div>

            <div className="bg-accent/5 rounded-2xl p-5 border border-accent/10">
              <div className="flex items-center gap-2 mb-3">
                <Lightbulb className="h-4 w-4 text-accent" />
                <h4 className="text-[11px] font-black uppercase tracking-widest text-accent">Sugestões</h4>
              </div>
              <p className="text-sm text-indigo-100/80 leading-relaxed font-medium italic">{insights?.financialTips}</p>
            </div>
          </div>
        )}
      </CardContent>
    </Card>
  );
}
