import React, { useState, useEffect } from "react";
import { Transaction } from "@/lib/types";
import { getFinancialAdvisorInsights, FinancialAdvisorInsightsOutput } from "@/ai/flows/financial-advisor-insights-flow";
import { Card, CardHeader, CardTitle, CardContent } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Sparkles, Brain, RefreshCw, AlertCircle, TrendingUp, Zap } from "lucide-react";
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
      setError("Communication Error: Neural link failure.");
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
    <div className="space-y-8 max-w-4xl mx-auto pb-24">
      <div className="flex items-center justify-between">
        <div className="space-y-1">
          <h2 className="text-3xl font-headline font-bold flex items-center gap-3 tracking-tighter">
            <Brain className="text-accent h-9 w-9" />
            Neural Advisor
          </h2>
          <p className="text-muted-foreground text-[10px] uppercase tracking-widest">Advanced predictive analysis of your financial vectors.</p>
        </div>
        <Button 
          variant="outline" 
          size="sm" 
          onClick={fetchInsights} 
          disabled={loading || transactions.length === 0}
          className="border-white/5 hover:bg-accent/10 hover:text-accent transition-all uppercase text-[9px] font-bold tracking-widest h-9"
        >
          <RefreshCw className={cn("h-3 w-3 mr-2", loading && "animate-spin")} />
          Sync Insights
        </Button>
      </div>

      {transactions.length === 0 ? (
        <Card className="nebula-card border-dashed border-white/5 py-20">
          <CardContent className="flex flex-col items-center justify-center space-y-4">
            <div className="bg-primary/5 w-20 h-20 rounded-3xl flex items-center justify-center animate-pulse">
              <Sparkles className="h-10 w-10 text-accent/50" />
            </div>
            <h3 className="text-xl font-headline font-bold tracking-tight">Insufficient Data</h3>
            <p className="text-muted-foreground text-[10px] uppercase tracking-widest text-center max-w-xs">
              Feed the neural network with transaction vectors to generate intelligence.
            </p>
          </CardContent>
        </Card>
      ) : loading ? (
        <div className="grid gap-8">
          <Skeleton className="h-[240px] w-full rounded-3xl bg-card/20 border border-white/5" />
          <Skeleton className="h-[240px] w-full rounded-3xl bg-card/20 border border-white/5" />
        </div>
      ) : error ? (
        <Card className="nebula-card border-expense/20 bg-expense/5">
          <CardContent className="p-8 flex items-center gap-4 text-expense">
            <AlertCircle className="h-6 w-6" />
            <p className="font-mono text-xs uppercase tracking-widest">{error}</p>
          </CardContent>
        </Card>
      ) : insights ? (
        <div className="grid gap-8">
          <Card className="nebula-card border-accent/10 relative overflow-hidden group">
            <div className="absolute top-0 right-0 p-6 opacity-[0.03] group-hover:opacity-[0.08] transition-opacity">
              <Zap className="h-24 w-24 text-accent" />
            </div>
            <CardHeader>
              <CardTitle className="flex items-center gap-3 text-accent text-xl font-headline">
                <Sparkles className="h-5 w-5" />
                Pattern Recognition
              </CardTitle>
            </CardHeader>
            <CardContent>
              <div className="prose prose-invert max-w-none">
                <p className="text-lg leading-relaxed text-foreground/80 font-medium">
                  {insights.spendingPatterns}
                </p>
              </div>
            </CardContent>
          </Card>

          <Card className="nebula-card border-income/10 relative overflow-hidden group">
            <div className="absolute top-0 right-0 p-6 opacity-[0.03] group-hover:opacity-[0.08] transition-opacity">
              <TrendingUp className="h-24 w-24 text-income" />
            </div>
            <CardHeader>
              <CardTitle className="flex items-center gap-3 text-income text-xl font-headline">
                <TrendingUp className="h-5 w-5" />
                Strategic Directives
              </CardTitle>
            </CardHeader>
            <CardContent>
              <div className="prose prose-invert max-w-none">
                <p className="text-lg leading-relaxed text-foreground/80 font-medium">
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