
"use client";

import React, { useState } from "react";
import { useFirestore, useCollection, useMemoFirebase } from "@/firebase";
import { collection, query, orderBy } from "firebase/firestore";
import { SummaryCards } from "@/components/nebula/summary-cards";
import { TransactionList } from "@/components/nebula/transaction-list";
import { FlowChart } from "@/components/nebula/flow-chart";
import { AIInsights } from "@/components/nebula/ai-insights";
import { AdvisorView } from "@/components/nebula/advisor-view";
import { AddTransactionForm } from "@/components/nebula/add-transaction-form";
import { LayoutDashboard, History, Sparkles, Loader2, Search, ArrowRight } from "lucide-react";
import { cn } from "@/lib/utils";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { getYear } from "date-fns";

type View = 'dashboard' | 'transactions' | 'advisor';

const GUEST_USER_ID = "guest-protocol-v1";

export default function NebulaFinanx() {
  const db = useFirestore();
  const [view, setView] = useState<View>('dashboard');
  const [selectedYear, setSelectedYear] = useState<string>(getYear(new Date()).toString());

  const transactionsQuery = useMemoFirebase(() => {
    if (!db) return null;
    return query(
      collection(db, "users", GUEST_USER_ID, "transactions"),
      orderBy("date", "desc")
    );
  }, [db]);

  const { data: transactions, isLoading: isTxLoading } = useCollection(transactionsQuery);

  if (isTxLoading && !transactions) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-background">
        <Loader2 className="h-8 w-8 text-accent animate-spin" />
      </div>
    );
  }

  const txs = transactions || [];
  
  // Filter transactions by selected year
  const filteredTxs = txs.filter(t => {
    const txYear = getYear(new Date(t.date)).toString();
    return txYear === selectedYear;
  });

  const totalIncome = filteredTxs.filter(t => t.type === 'income').reduce((sum, t) => sum + t.amount, 0);
  const totalExpenses = filteredTxs.filter(t => t.type === 'expense').reduce((sum, t) => sum + t.amount, 0);
  const totalBalance = totalIncome - totalExpenses;

  // Accurate Monthly Average: Divide year total by number of months with entries in that year
  const monthsWithEntries = new Set(filteredTxs.map(t => new Date(t.date).getMonth())).size;
  const monthlyAverage = monthsWithEntries > 0 ? totalBalance / monthsWithEntries : 0;

  // Recent transactions for the dashboard (limit to 5) - uses all txs for historical view
  const recentTxs = txs.slice(0, 5);

  return (
    <div className="min-h-screen bg-background text-foreground flex flex-col font-headline">
      {/* Header */}
      <header className="container mx-auto px-6 h-24 flex items-center justify-between">
        <div className="flex items-center gap-3">
          <Sparkles className="h-6 w-6 text-accent" />
          <div className="flex flex-col">
            <h1 className="text-xl font-bold tracking-widest uppercase">Nebula</h1>
            <span className="text-[10px] text-muted-foreground uppercase tracking-[0.2em] -mt-1">Gestão Financeira</span>
          </div>
        </div>
        
        <div className="w-10 h-10 rounded-full bg-gradient-to-br from-indigo-400 to-indigo-600 shadow-lg shadow-indigo-500/20 border border-white/10" />
      </header>

      {/* Main Content */}
      <main className="flex-1 container mx-auto px-6 max-w-5xl pb-32">
        {view === 'dashboard' && (
          <div className="space-y-10 animate-in fade-in duration-500">
            <div className="flex items-center justify-between">
              <div className="space-y-0.5">
                <div className="flex items-center gap-2">
                  <LayoutDashboard className="h-4 w-4 text-accent" />
                  <h2 className="text-2xl font-bold uppercase tracking-tight">Dashboard</h2>
                </div>
                <p className="text-[10px] text-muted-foreground uppercase tracking-[0.3em]">Visão Geral</p>
              </div>
              <div className="bg-accent/10 border border-accent/20 px-4 py-1.5 rounded-lg">
                <span className="text-accent font-bold text-sm tracking-widest">{selectedYear}</span>
              </div>
            </div>

            <SummaryCards 
              balance={totalBalance} 
              income={totalIncome} 
              expenses={totalExpenses} 
              selectedYear={selectedYear}
              average={monthlyAverage}
            />
            
            <FlowChart 
              transactions={txs} 
              selectedYear={selectedYear}
              onYearChange={setSelectedYear}
            />

            <AIInsights transactions={txs} />

            {/* Últimos Lançamentos Section */}
            <Card className="bg-indigo-950/10 border-indigo-500/10 rounded-[2rem] overflow-hidden shadow-[0_0_30px_rgba(79,70,229,0.05)]">
              <CardHeader className="flex flex-row items-center justify-between pb-4">
                <CardTitle className="text-lg font-bold tracking-tight">Últimos Lançamentos</CardTitle>
                <button 
                  onClick={() => setView('transactions')}
                  className="text-[10px] text-indigo-400 hover:text-indigo-300 font-bold uppercase tracking-widest transition-colors flex items-center gap-1 group"
                >
                  Ver Todos
                  <ArrowRight className="h-3 w-3 transition-transform group-hover:translate-x-0.5" />
                </button>
              </CardHeader>
              <CardContent>
                {recentTxs.length === 0 ? (
                  <div className="py-12 text-center">
                    <p className="text-[11px] text-indigo-300/40 uppercase tracking-[0.3em] font-medium">Nenhuma atividade recente.</p>
                  </div>
                ) : (
                  <div className="space-y-4">
                    <TransactionList transactions={recentTxs} userId={GUEST_USER_ID} compact />
                  </div>
                )}
              </CardContent>
            </Card>
          </div>
        )}

        {view === 'transactions' && (
          <div className="space-y-10 animate-in fade-in duration-500">
            <div className="space-y-1">
              <h2 className="text-3xl font-bold uppercase tracking-tight italic">Finanças</h2>
              <p className="text-[10px] text-muted-foreground uppercase tracking-[0.4em]">Registrar Compra</p>
            </div>
            
            <AddTransactionForm userId={GUEST_USER_ID} />
          </div>
        )}

        {view === 'advisor' && (
          <div className="animate-in fade-in duration-500">
            <AdvisorView />
          </div>
        )}
      </main>

      {/* Navigation Dock */}
      <nav className="fixed bottom-0 left-0 right-0 h-24 bg-background/80 backdrop-blur-xl border-t border-white/5 z-50">
        <div className="container mx-auto px-10 h-full flex items-center justify-around max-w-2xl">
          <NavButton 
            active={view === 'dashboard'} 
            onClick={() => setView('dashboard')}
            icon={<LayoutDashboard />}
            label="Home"
          />
          <NavButton 
            active={view === 'transactions'} 
            onClick={() => setView('transactions')}
            icon={<History />}
            label="Extrato"
          />
          <NavButton 
            active={view === 'advisor'} 
            onClick={() => setView('advisor')}
            icon={<Search />}
            label="Preços"
          />
        </div>
      </nav>
    </div>
  );
}

function NavButton({ active, onClick, icon, label }: { active: boolean; onClick: () => void; icon: React.ReactNode; label: string }) {
  return (
    <button 
      onClick={onClick}
      className={cn(
        "flex flex-col items-center gap-1.5 transition-all duration-300",
        active ? "text-accent" : "text-muted-foreground hover:text-foreground"
      )}
    >
      <div className={cn(
        "p-2 rounded-xl transition-all duration-300",
        active && "bg-accent/10 shadow-[0_0_15px_rgba(255,230,120,0.1)]"
      )}>
        {React.cloneElement(icon as React.ReactElement, { className: "h-5 w-5" })}
      </div>
      <span className="text-[9px] font-bold uppercase tracking-[0.2em]">{label}</span>
    </button>
  );
}
