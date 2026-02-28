import React, { useState, useEffect } from "react";
import { Transaction } from "@/lib/types";
import { getFinancialAdvisorInsights, FinancialAdvisorInsightsOutput } from "@/ai/flows/financial-advisor-insights-flow";
import { Card, CardHeader, CardTitle, CardContent, CardFooter } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Sparkles, Brain, RefreshCw, AlertCircle, TrendingUp } from "lucide-react";
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
          date: t.date // ensured ISO by form
        }))
      });
      setInsights(result);
    } catch (err) {
      console.error(err);
      setError("Failed to fetch insights. Please try again.");
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
    <div className="space-y-6 max-w-4xl mx-auto pb-24">
      <div className="flex items-center justify-between">
        <div>
          <h2 className="text-3xl font-headline font-bold flex items-center gap-3">
            <Brain className="text-accent h-8 w-8" />
            AI Financial Advisor
          </h2>
          <p className="text-muted-foreground mt-1">Get personalized insights based on your spending habits.</p>
        </div>
        <Button 
          variant="outline" 
          size="sm" 
          onClick={fetchInsights} 
          disabled={loading || transactions.length === 0}
          className="border-primary/50 hover:bg-primary/20"
        >
          <RefreshCw className={cn("h-4 w-4 mr-2", loading && "animate-spin")} />
          Refresh Insights
        </Button>
      </div>

      {transactions.length === 0 ? (
        <Card className="nebula-card border-dashed border-primary/30">
          <CardContent className="p-12 text-center space-y-4">
            <div className="bg-primary/10 w-16 h-16 rounded-full flex items-center justify-center mx-auto">
              <Sparkles className="h-8 w-8 text-accent" />
            </div>
            <h3 className="text-xl font-headline font-semibold">No Data to Analyze</h3>
            <p className="text-muted-foreground max-w-sm mx-auto">
              Add some transactions in the Dashboard to allow the AI to generate financial tips and patterns for you.
            </p>
          </CardContent>
        </Card>
      ) : loading ? (
        <div className="grid gap-6">
          <Skeleton className="h-[200px] w-full rounded-xl bg-card/50" />
          <Skeleton className="h-[200px] w-full rounded-xl bg-card/50" />
        </div>
      ) : error ? (
        <Card className="nebula-card border-expense/20 bg-expense/5">
          <CardContent className="p-6 flex items-center gap-3 text-expense">
            <AlertCircle className="h-5 w-5" />
            <p>{error}</p>
          </CardContent>
        </Card>
      ) : insights ? (
        <div className="grid gap-6">
          <Card className="nebula-card border-accent/20">
            <CardHeader>
              <CardTitle className="flex items-center gap-2 text-accent">
                <Sparkles className="h-5 w-5" />
                Spending Patterns
              </CardTitle>
            </CardHeader>
            <CardContent>
              <div className="prose prose-invert max-w-none">
                <p className="text-lg leading-relaxed text-foreground/90">
                  {insights.spendingPatterns}
                </p>
              </div>
            </CardContent>
          </Card>

          <Card className="nebula-card border-income/20">
            <CardHeader>
              <CardTitle className="flex items-center gap-2 text-income">
                <TrendingUp className="h-5 w-5" />
                Financial Tips
              </CardTitle>
            </CardHeader>
            <CardContent>
              <div className="prose prose-invert max-w-none">
                <p className="text-lg leading-relaxed text-foreground/90">
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
