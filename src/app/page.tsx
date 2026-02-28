"use client";

import React, { useState } from "react";
import { useUser, useFirestore, useCollection, useMemoFirebase, useAuth } from "@/firebase";
import { collection, query, orderBy, doc } from "firebase/firestore";
import { SummaryCards } from "@/components/nebula/summary-cards";
import { TransactionList } from "@/components/nebula/transaction-list";
import { AddTransactionForm } from "@/components/nebula/add-transaction-form";
import { FlowChart } from "@/components/nebula/flow-chart";
import { AdvisorView } from "@/components/nebula/advisor-view";
import { AuthView } from "@/components/nebula/auth-view";
import { LayoutDashboard, History, Sparkles, LogOut, Loader2, Network } from "lucide-react";
import { cn } from "@/lib/utils";
import { Button } from "@/components/ui/button";

type View = 'dashboard' | 'transactions' | 'advisor';

export default function NebulaFinanx() {
  const { user, isUserLoading } = useUser();
  const db = useFirestore();
  const auth = useAuth();
  const [view, setView] = useState<View>('dashboard');

  const transactionsQuery = useMemoFirebase(() => {
    if (!db || !user) return null;
    return query(
      collection(db, "users", user.uid, "transactions"),
      orderBy("date", "desc")
    );
  }, [db, user]);

  const { data: transactions, isLoading: isTxLoading } = useCollection(transactionsQuery);

  if (isUserLoading) {
    return (
      <div className="min-h-screen flex flex-col items-center justify-center bg-background gap-4">
        <Loader2 className="h-10 w-10 text-accent animate-spin" />
        <p className="text-[10px] uppercase tracking-[0.3em] text-accent/50 animate-pulse">Establishing Connection...</p>
      </div>
    );
  }

  if (!user) {
    return <AuthView />;
  }

  const txs = transactions || [];
  const totalIncome = txs
    .filter(t => t.type === 'income')
    .reduce((sum, t) => sum + t.amount, 0);

  const totalExpenses = txs
    .filter(t => t.type === 'expense')
    .reduce((sum, t) => sum + t.amount, 0);

  const totalBalance = totalIncome - totalExpenses;

  return (
    <div className="min-h-screen bg-background text-foreground flex flex-col selection:bg-accent selection:text-accent-foreground">
      {/* Header */}
      <header className="border-b border-white/5 bg-background/50 backdrop-blur-md sticky top-0 z-40">
        <div className="container mx-auto px-4 h-16 flex items-center justify-between">
          <div className="flex items-center gap-3">
            <div className="w-9 h-9 rounded-xl bg-accent flex items-center justify-center glow-accent">
              <Sparkles className="h-5 w-5 text-accent-foreground" />
            </div>
            <div>
              <h1 className="text-xl font-headline font-bold tracking-tight">Nebula</h1>
              <div className="flex items-center gap-1.5 -mt-1">
                <div className="w-1.5 h-1.5 rounded-full bg-income animate-pulse" />
                <span className="text-[9px] font-medium text-muted-foreground uppercase tracking-widest">Active Link</span>
              </div>
            </div>
          </div>
          <div className="flex items-center gap-2">
            <Button 
              variant="ghost" 
              size="sm" 
              onClick={() => auth.signOut()} 
              className="text-muted-foreground hover:text-expense hover:bg-expense/10 group"
            >
              <LogOut className="h-4 w-4 mr-2 group-hover:-translate-x-1 transition-transform" />
              <span className="hidden sm:inline text-[10px] font-bold uppercase tracking-widest">Disconnect</span>
            </Button>
          </div>
        </div>
      </header>

      {/* Main Content */}
      <main className="flex-1 container mx-auto px-4 py-8 max-w-7xl">
        {view === 'dashboard' && (
          <div className="space-y-8 animate-in fade-in slide-in-from-bottom-4 duration-700">
            <SummaryCards 
              balance={totalBalance} 
              income={totalIncome} 
              expenses={totalExpenses} 
            />
            
            <div className="grid gap-8 lg:grid-cols-12">
              <div className="lg:col-span-7 space-y-8">
                <AddTransactionForm userId={user.uid} />
                <TransactionList transactions={txs.slice(0, 5)} />
              </div>
              <div className="lg:col-span-5 space-y-8">
                <FlowChart transactions={txs} />
                <div className="nebula-card p-6 rounded-2xl border border-primary/20 space-y-6 relative overflow-hidden group">
                  <div className="absolute top-0 right-0 p-4 opacity-10 group-hover:opacity-20 transition-opacity">
                    <Network className="h-16 w-16 text-accent" />
                  </div>
                  <h3 className="font-headline font-bold text-lg text-accent">Strategic Overview</h3>
                  <div className="space-y-4">
                    <div className="flex justify-between items-end">
                      <p className="text-xs text-muted-foreground uppercase tracking-widest">Retention Rate</p>
                      <span className="text-income font-bold text-xl">
                        {totalIncome > 0 ? ((totalBalance / totalIncome) * 100).toFixed(1) : '0.0'}%
                      </span>
                    </div>
                    <div className="w-full bg-white/5 h-1.5 rounded-full overflow-hidden">
                      <div 
                        className="bg-accent h-full transition-all duration-1000" 
                        style={{ width: `${Math.max(0, Math.min(100, totalIncome > 0 ? (totalBalance / totalIncome) * 100 : 0))}%` }}
                      />
                    </div>
                  </div>
                  <Button 
                    onClick={() => setView('advisor')}
                    className="w-full h-11 bg-secondary hover:bg-secondary/80 text-xs font-bold uppercase tracking-[0.2em] rounded-xl transition-all"
                  >
                    Invoke Oracle
                  </Button>
                </div>
              </div>
            </div>
          </div>
        )}

        {view === 'transactions' && (
          <div className="space-y-6 animate-in fade-in slide-in-from-bottom-4 duration-700">
            <div className="flex items-center justify-between">
              <h2 className="text-3xl font-headline font-bold tracking-tighter">Neural Audit Logs</h2>
            </div>
            <TransactionList transactions={txs} showAll />
          </div>
        )}

        {view === 'advisor' && (
          <div className="animate-in fade-in slide-in-from-bottom-4 duration-700">
            <AdvisorView transactions={txs} />
          </div>
        )}
      </main>

      {/* Bottom Navigation */}
      <nav className="fixed bottom-6 left-1/2 -translate-x-1/2 w-[calc(100%-2rem)] max-w-md z-50">
        <div className="nebula-card border border-white/10 rounded-3xl h-18 px-2 flex items-center justify-around shadow-[0_20px_50px_rgba(0,0,0,0.5)]">
          <NavButton 
            active={view === 'dashboard'} 
            onClick={() => setView('dashboard')}
            icon={<LayoutDashboard />}
            label="Nexus"
          />
          <NavButton 
            active={view === 'transactions'} 
            onClick={() => setView('transactions')}
            icon={<History />}
            label="Audit"
          />
          <NavButton 
            active={view === 'advisor'} 
            onClick={() => setView('advisor')}
            icon={<Sparkles />}
            label="Oracle"
          />
        </div>
      </nav>
      
      {/* Spacer for bottom nav */}
      <div className="h-28" />
    </div>
  );
}

function NavButton({ active, onClick, icon, label }: { active: boolean; onClick: () => void; icon: React.ReactNode; label: string }) {
  return (
    <button 
      onClick={onClick}
      className={cn(
        "flex flex-col items-center gap-1 transition-all duration-500 px-6 py-2 rounded-2xl relative group",
        active ? "text-accent" : "text-muted-foreground hover:text-foreground"
      )}
    >
      {active && (
        <div className="absolute inset-0 bg-accent/10 rounded-2xl blur-md -z-10 animate-pulse" />
      )}
      {React.cloneElement(icon as React.ReactElement, { 
        className: cn("h-5 w-5 transition-transform", active && "scale-110") 
      })}
      <span className="text-[8px] font-bold uppercase tracking-[0.2em]">{label}</span>
    </button>
  );
}