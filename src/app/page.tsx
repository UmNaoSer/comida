"use client";

import React, { useState } from "react";
import { useFirestore, useCollection, useMemoFirebase } from "@/firebase";
import { collection, query, orderBy } from "firebase/firestore";
import { SummaryCards } from "@/components/nebula/summary-cards";
import { TransactionList } from "@/components/nebula/transaction-list";
import { FlowChart } from "@/components/nebula/flow-chart";
import { AdvisorView } from "@/components/nebula/advisor-view";
import { AddTransactionForm } from "@/components/nebula/add-transaction-form";
import { LayoutDashboard, History, Sparkles, Loader2, Search, User } from "lucide-react";
import { cn } from "@/lib/utils";

type View = 'dashboard' | 'transactions' | 'advisor';

const GUEST_USER_ID = "guest-protocol-v1";

export default function NebulaFinanx() {
  const db = useFirestore();
  const [view, setView] = useState<View>('dashboard');

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
  const totalIncome = txs.filter(t => t.type === 'income').reduce((sum, t) => sum + t.amount, 0);
  const totalExpenses = txs.filter(t => t.type === 'expense').reduce((sum, t) => sum + t.amount, 0);
  const totalBalance = totalIncome - totalExpenses;

  return (
    <div className="min-h-screen bg-background text-foreground flex flex-col font-headline">
      {/* Header */}
      <header className="container mx-auto px-6 h-24 flex items-center justify-between">
        <div className="flex items-center gap-3">
          <Sparkles className="h-6 w-6 text-accent" />
          <div className="flex flex-col">
            <h1 className="text-xl font-bold tracking-widest uppercase">Nebula</h1>
            <span className="text-[10px] text-muted-foreground uppercase tracking-[0.2em] -mt-1">Finance Intelligence</span>
          </div>
        </div>
        
        <div className="w-10 h-10 rounded-full bg-gradient-to-br from-blue-400 to-blue-600 shadow-lg shadow-blue-500/20 border border-white/10" />
      </header>

      {/* Main Content */}
      <main className="flex-1 container mx-auto px-6 max-w-5xl pb-32">
        {view === 'dashboard' && (
          <div className="space-y-8 animate-in fade-in duration-500">
            <div className="flex items-center justify-between">
              <div className="space-y-0.5">
                <div className="flex items-center gap-2">
                  <LayoutDashboard className="h-4 w-4 text-accent" />
                  <h2 className="text-2xl font-bold uppercase tracking-tight">Dashboard</h2>
                </div>
                <p className="text-[10px] text-muted-foreground uppercase tracking-[0.3em]">Visão Analítica</p>
              </div>
              <div className="bg-accent/10 border border-accent/20 px-4 py-1.5 rounded-lg">
                <span className="text-accent font-bold text-sm tracking-widest">2026</span>
              </div>
            </div>

            <SummaryCards 
              balance={totalBalance} 
              income={totalIncome} 
              expenses={totalExpenses} 
            />
            
            <FlowChart transactions={txs} />
          </div>
        )}

        {view === 'transactions' && (
          <div className="space-y-8 animate-in fade-in duration-500">
            <div className="space-y-1">
              <h2 className="text-3xl font-bold uppercase tracking-tight italic">Audit Logs</h2>
              <p className="text-[10px] text-muted-foreground uppercase tracking-[0.4em]">Neural Vector History</p>
            </div>
            <AddTransactionForm userId={GUEST_USER_ID} />
            <TransactionList transactions={txs} userId={GUEST_USER_ID} showAll />
          </div>
        )}

        {view === 'advisor' && (
          <div className="animate-in fade-in duration-500">
            <AdvisorView transactions={txs} />
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
            label="Visão Geral"
          />
          <NavButton 
            active={view === 'transactions'} 
            onClick={() => setView('transactions')}
            icon={<History />}
            label="Finanças"
          />
          <NavButton 
            active={view === 'advisor'} 
            onClick={() => setView('advisor')}
            icon={<Search />}
            label="Consultor"
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