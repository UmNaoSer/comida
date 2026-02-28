"use client";

import React, { useState } from "react";
import { useFirestore, useCollection, useMemoFirebase } from "@/firebase";
import { collection, query, orderBy } from "firebase/firestore";
import { SummaryCards } from "@/components/nebula/summary-cards";
import { TransactionList } from "@/components/nebula/transaction-list";
import { AddTransactionForm } from "@/components/nebula/add-transaction-form";
import { FlowChart } from "@/components/nebula/flow-chart";
import { AdvisorView } from "@/components/nebula/advisor-view";
import { LayoutDashboard, History, Sparkles, Loader2, Network, ShieldCheck } from "lucide-react";
import { cn } from "@/lib/utils";
import { Button } from "@/components/ui/button";

type View = 'dashboard' | 'transactions' | 'advisor';

// Fixed user ID for guest access without login
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
      <div className="min-h-screen flex flex-col items-center justify-center bg-background gap-6">
        <div className="relative">
          <Loader2 className="h-16 w-16 text-accent animate-spin" />
          <Sparkles className="h-6 w-6 text-accent absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 animate-pulse" />
        </div>
        <div className="flex flex-col items-center gap-2">
          <p className="text-[10px] uppercase tracking-[0.4em] text-accent font-bold animate-pulse">Initializing Direct Link</p>
          <div className="w-48 h-1 bg-white/5 rounded-full overflow-hidden">
            <div className="h-full bg-accent animate-[loading_2s_ease-in-out_infinite]" style={{ width: '40%' }} />
          </div>
        </div>
      </div>
    );
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
    <div className="min-h-screen bg-background text-foreground flex flex-col selection:bg-accent/30 selection:text-accent">
      {/* Header */}
      <header className="border-b border-white/5 bg-background/40 backdrop-blur-xl sticky top-0 z-50">
        <div className="container mx-auto px-6 h-20 flex items-center justify-between">
          <div className="flex items-center gap-4">
            <div className="w-10 h-10 rounded-2xl bg-gradient-to-br from-accent to-primary flex items-center justify-center glow-accent shadow-lg shadow-accent/20 rotate-3 group hover:rotate-0 transition-transform cursor-pointer">
              <Sparkles className="h-6 w-6 text-accent-foreground" />
            </div>
            <div className="hidden sm:block">
              <h1 className="text-2xl font-headline font-black tracking-tighter uppercase italic">Nebula<span className="text-accent not-italic">Finanx</span></h1>
              <div className="flex items-center gap-2 mt-0.5">
                <div className="w-1.5 h-1.5 rounded-full bg-income animate-pulse shadow-[0_0_8px_rgba(131,240,131,0.5)]" />
                <span className="text-[9px] font-bold text-muted-foreground uppercase tracking-[0.3em]">Direct Access Active</span>
              </div>
            </div>
          </div>
          
          <div className="flex items-center gap-4">
            <div className="flex flex-col items-end">
              <span className="text-[9px] font-bold text-muted-foreground uppercase tracking-widest">Neural Mode</span>
              <span className="text-xs font-mono text-accent/80">Guest Protocol</span>
            </div>
          </div>
        </div>
      </header>

      {/* Main Content */}
      <main className="flex-1 container mx-auto px-6 py-10 max-w-7xl pb-32">
        {view === 'dashboard' && (
          <div className="space-y-10 animate-in fade-in slide-in-from-bottom-6 duration-700">
            <SummaryCards 
              balance={totalBalance} 
              income={totalIncome} 
              expenses={totalExpenses} 
            />
            
            <div className="grid gap-10 lg:grid-cols-12">
              <div className="lg:col-span-7 space-y-10">
                <AddTransactionForm userId={GUEST_USER_ID} />
                <TransactionList transactions={txs.slice(0, 5)} userId={GUEST_USER_ID} />
              </div>
              <div className="lg:col-span-5 space-y-10">
                <FlowChart transactions={txs} />
                
                <div className="nebula-card p-8 rounded-[2rem] border border-accent/10 relative overflow-hidden group">
                  <div className="absolute -top-10 -right-10 w-40 h-40 bg-accent/10 rounded-full blur-[80px] group-hover:bg-accent/20 transition-colors" />
                  <div className="relative z-10 space-y-8">
                    <div className="flex items-center justify-between">
                      <div className="space-y-1">
                        <h3 className="font-headline font-black text-xl text-accent italic uppercase">Strategic Overview</h3>
                        <p className="text-[9px] text-muted-foreground uppercase tracking-[0.2em]">Efficiency Analysis</p>
                      </div>
                      <Network className="h-10 w-10 text-accent/30 group-hover:text-accent transition-colors" />
                    </div>
                    
                    <div className="space-y-6">
                      <div className="flex justify-between items-end">
                        <div className="space-y-1">
                          <p className="text-[10px] text-muted-foreground uppercase tracking-widest">Retention Index</p>
                          <span className="text-income font-black text-3xl font-headline italic tracking-tighter">
                            {totalIncome > 0 ? ((totalBalance / totalIncome) * 100).toFixed(1) : '0.0'}%
                          </span>
                        </div>
                        <ShieldCheck className="h-6 w-6 text-income/40" />
                      </div>
                      <div className="w-full bg-white/5 h-2.5 rounded-full overflow-hidden p-0.5 border border-white/5">
                        <div 
                          className="bg-gradient-to-r from-primary to-accent h-full rounded-full transition-all duration-1000 shadow-[0_0_15px_rgba(187,71,59,0.3)]" 
                          style={{ width: `${Math.max(0, Math.min(100, totalIncome > 0 ? (totalBalance / totalIncome) * 100 : 0))}%` }}
                        />
                      </div>
                    </div>
                    
                    <Button 
                      onClick={() => setView('advisor')}
                      className="w-full h-14 bg-secondary hover:bg-accent hover:text-accent-foreground text-xs font-black uppercase tracking-[0.3em] rounded-2xl transition-all shadow-xl hover:shadow-accent/20 group"
                    >
                      Invoke Oracle
                      <Sparkles className="ml-2 h-4 w-4 group-hover:animate-spin" />
                    </Button>
                  </div>
                </div>
              </div>
            </div>
          </div>
        )}

        {view === 'transactions' && (
          <div className="space-y-8 animate-in fade-in slide-in-from-bottom-6 duration-700">
            <div className="flex flex-col sm:flex-row sm:items-end justify-between gap-4">
              <div className="space-y-1">
                <h2 className="text-4xl font-headline font-black tracking-tighter italic uppercase">Neural Audit Logs</h2>
                <p className="text-[10px] text-muted-foreground uppercase tracking-[0.4em]">Comprehensive Vector History</p>
              </div>
              <div className="flex items-center gap-2 px-4 py-2 bg-white/5 rounded-xl border border-white/5">
                <History className="h-4 w-4 text-accent" />
                <span className="text-[10px] font-mono font-bold text-accent uppercase tracking-widest">Sequence Status: Active</span>
              </div>
            </div>
            <TransactionList transactions={txs} userId={GUEST_USER_ID} showAll />
          </div>
        )}

        {view === 'advisor' && (
          <div className="animate-in fade-in slide-in-from-bottom-6 duration-700">
            <AdvisorView transactions={txs} />
          </div>
        )}
      </main>

      {/* Navigation Dock */}
      <nav className="fixed bottom-8 left-1/2 -translate-x-1/2 w-full max-w-sm px-6 z-50">
        <div className="nebula-card bg-background/60 border border-white/10 rounded-[2.5rem] h-20 px-4 flex items-center justify-between shadow-[0_32px_64px_-16px_rgba(0,0,0,0.6)]">
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
      
      {/* Footer Details */}
      <footer className="h-20 flex items-center justify-center opacity-20 pointer-events-none select-none">
        <p className="text-[8px] font-mono uppercase tracking-[1em]">Nebula Advanced Finance v4.0.0-PRO</p>
      </footer>
    </div>
  );
}

function NavButton({ active, onClick, icon, label }: { active: boolean; onClick: () => void; icon: React.ReactNode; label: string }) {
  return (
    <button 
      onClick={onClick}
      className={cn(
        "flex flex-col items-center gap-1.5 transition-all duration-500 px-6 py-3 rounded-2xl relative group",
        active ? "text-accent" : "text-muted-foreground hover:text-foreground"
      )}
    >
      {active && (
        <>
          <div className="absolute inset-0 bg-accent/10 rounded-2xl blur-md -z-10 animate-pulse" />
          <div className="absolute -bottom-1 left-1/2 -translate-x-1/2 w-1 h-1 bg-accent rounded-full shadow-[0_0_8px_hsl(var(--accent))]" />
        </>
      )}
      {React.cloneElement(icon as React.ReactElement, { 
        className: cn("h-5 w-5 transition-all duration-300", active ? "scale-110 drop-shadow-[0_0_8px_rgba(187,71,59,0.5)]" : "group-hover:scale-110") 
      })}
      <span className="text-[9px] font-black uppercase tracking-[0.2em]">{label}</span>
    </button>
  );
}
