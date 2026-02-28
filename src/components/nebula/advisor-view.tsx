import React, { useState, useEffect } from "react";
import { Transaction } from "@/lib/types";
import { getFinancialAdvisorInsights, FinancialAdvisorInsightsOutput } from "@/ai/flows/financial-advisor-insights-flow";
import { Card, CardHeader, CardTitle, CardContent } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Sparkles, Brain, RefreshCw, AlertCircle, TrendingUp, Zap, Cpu } from "lucide-react";
import { Skeleton } from "@/components/ui/skeleton";
import { cn } from "@/lib/utils";

interface AdvisorViewProps {
  transactions: Transaction[];
}

export function AdvisorView({ transactions }: AdvisorViewProps) {
  const [insights, setInsights] = useState<FinancialAdvisorInsightsOutput | null>(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const fetchInsights = async () => {
    if (transactions.length === 0) return;
    setLoading(true);
    setError(null);
    try {
      const result = await getFinancialAdvisorInsights({
        transactions: transactions.map(t => ({
          ...t,
          date: t.date
        }))
      });
      setInsights(result);
    } catch (err) {
      console.error(err);
      setError("COMMUNICATION_LINK_FAILURE: Neural connection unstable.");
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    if (transactions.length > 0 && !insights) {
      fetchInsights();
    }
  }, [transactions]);

  return (
    <div className="space-y-10 max-w-5xl mx-auto pb-10">
      <div className="flex flex-col sm:flex-row sm:items-end justify-between gap-6">
        <div className="space-y-1">
          <h2 className="text-4xl font-headline font-black flex items-center gap-4 tracking-tighter italic uppercase">
            <Brain className="text-accent h-10 w-10 glow-accent" />
            Neural Advisor
          </h2>
          <p className="text-muted-foreground text-[10px] uppercase tracking-[0.4em]">Advanced Predictive Analysis Protocol</p>
        </div>
        <Button 
          variant="outline" 
          size="lg" 
          onClick={fetchInsights} 
          disabled={loading || transactions.length === 0}
          className="border-accent/20 bg-accent/5 hover:bg-accent hover:text-accent-foreground transition-all uppercase text-[10px] font-black tracking-[0.3em] h-12 rounded-2xl px-6 group shadow-lg hover:shadow-accent/20"
        >
          <RefreshCw className={cn("h-4 w-4 mr-3 transition-transform duration-500", loading && "animate-spin")} />
          Sync Neural State
        </Button>
      </div>

      {transactions.length === 0 ? (
        <Card className="nebula-card border-dashed border-white/5 py-32 rounded-[3rem]">
          <CardContent className="flex flex-col items-center justify-center space-y-6">
            <div className="bg-primary/5 w-24 h-24 rounded-[2.5rem] flex items-center justify-center animate-pulse border border-white/5">
              <Sparkles className="h-12 w-12 text-accent/40" />
            </div>
            <div className="text-center space-y-2">
              <h3 className="text-2xl font-headline font-black tracking-tight uppercase italic">Insufficient Flux</h3>
              <p className="text-muted-foreground text-[10px] uppercase tracking-[0.3em] max-w-sm mx-auto leading-relaxed">
                Log additional transaction vectors to initialize the predictive neural framework.
              </p>
            </div>
          </CardContent>
        </Card>
      ) : loading ? (
        <div className="grid gap-10">
          <Skeleton className="h-[280px] w-full rounded-[2.5rem] bg-card/20 border border-white/5" />
          <Skeleton className="h-[280px] w-full rounded-[2.5rem] bg-card/20 border border-white/5" />
        </div>
      ) : error ? (
        <Card className="nebula-card border-expense/20 bg-expense/5 rounded-[2.5rem]">
          <CardContent className="p-12 flex flex-col items-center gap-6 text-expense text-center">
            <div className="p-4 bg-expense/10 rounded-full animate-bounce">
              <AlertCircle className="h-10 w-10" />
            </div>
            <div className="space-y-2">
              <p className="font-mono text-xs uppercase font-black tracking-[0.3em]">{error}</p>
              <p className="text-[10px] uppercase opacity-60 tracking-widest">Protocol Override Suggested</p>
            </div>
          </CardContent>
        </Card>
      ) : insights ? (
        <div className="grid gap-10">
          <Card className="nebula-card border-accent/20 relative overflow-hidden group rounded-[2.5rem] p-4">
            <div className="absolute top-0 right-0 p-8 opacity-[0.03] group-hover:opacity-[0.1] transition-opacity rotate-12">
              <Zap className="h-48 w-48 text-accent" />
            </div>
            <CardHeader className="relative z-10">
              <CardTitle className="flex items-center gap-4 text-accent text-2xl font-headline font-black italic uppercase">
                <Cpu className="h-6 w-6 glow-accent" />
                Pattern Recognition
              </CardTitle>
            </CardHeader>
            <CardContent className="relative z-10">
              <div className="prose prose-invert max-w-none">
                <p className="text-xl leading-relaxed text-foreground/90 font-medium tracking-tight bg-white/5 p-8 rounded-3xl border border-white/5">
                  {insights.spendingPatterns}
                </p>
              </div>
            </CardContent>
          </Card>

          <Card className="nebula-card border-income/20 relative overflow-hidden group rounded-[2.5rem] p-4">
            <div className="absolute top-0 right-0 p-8 opacity-[0.03] group-hover:opacity-[0.1] transition-opacity -rotate-12">
              <TrendingUp className="h-48 w-48 text-income" />
            </div>
            <CardHeader className="relative z-10">
              <CardTitle className="flex items-center gap-4 text-income text-2xl font-headline font-black italic uppercase">
                <Sparkles className="h-6 w-6" />
                Strategic Directives
              </CardTitle>
            </CardHeader>
            <CardContent className="relative z-10">
              <div className="prose prose-invert max-w-none">
                <p className="text-xl leading-relaxed text-foreground/90 font-medium tracking-tight bg-white/5 p-8 rounded-3xl border border-white/5">
                  {insights.financialTips}
                </p>
              </div>
            </CardContent>
          </Card>
        </div>
      ) : null}
    </div>
  );
}