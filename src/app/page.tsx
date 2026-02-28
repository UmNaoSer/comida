"use client";

import React, { useState, useEffect } from "react";
import { Transaction } from "@/lib/types";
import { SummaryCards } from "@/components/nebula/summary-cards";
import { TransactionList } from "@/components/nebula/transaction-list";
import { AddTransactionForm } from "@/components/nebula/add-transaction-form";
import { FlowChart } from "@/components/nebula/flow-chart";
import { AdvisorView } from "@/components/nebula/advisor-view";
import { LayoutDashboard, History, Sparkles, LogOut, Menu } from "lucide-react";
import { cn } from "@/lib/utils";

type View = 'dashboard' | 'transactions' | 'advisor';

export default function NebulaFinanx() {
  const [view, setView] = useState<View>('dashboard');
  const [transactions, setTransactions] = useState<Transaction[]>([]);
  
  // Initial Mock Data
  useEffect(() => {
    setTransactions([
      { id: '1', description: 'Tech Corp Salary', amount: 5000, type: 'income', date: new Date(2024, 4, 1).toISOString(), category: 'Salary' },
      { id: '2', description: 'Monthly Rent', amount: 1500, type: 'expense', date: new Date(2024, 4, 2).toISOString(), category: 'Rent' },
      { id: '3', description: 'Grocery Store', amount: 200, type: 'expense', date: new Date(2024, 4, 5).toISOString(), category: 'Food' },
      { id: '4', description: 'Freelance Project', amount: 1200, type: 'income', date: new Date(2024, 4, 10).toISOString(), category: 'Business' },
      { id: '5', description: 'Utility Bills', amount: 150, type: 'expense', date: new Date(2024, 4, 12).toISOString(), category: 'Bills' },
    ]);
  }, []);

  const addTransaction = (newTx: Omit<Transaction, 'id'>) => {
    const tx: Transaction = {
      ...newTx,
      id: Math.random().toString(36).substr(2, 9),
    };
    setTransactions(prev => [tx, ...prev]);
  };

  const totalIncome = transactions
    .filter(t => t.type === 'income')
    .reduce((sum, t) => sum + t.amount, 0);

  const totalExpenses = transactions
    .filter(t => t.type === 'expense')
    .reduce((sum, t) => sum + t.amount, 0);

  const totalBalance = totalIncome - totalExpenses;

  return (
    <div className="min-h-screen bg-background text-foreground flex flex-col">
      {/* Header */}
      <header className="border-b border-white/5 bg-background/50 backdrop-blur-md sticky top-0 z-40">
        <div className="container mx-auto px-4 h-16 flex items-center justify-between">
          <div className="flex items-center gap-2">
            <div className="w-8 h-8 rounded-lg bg-accent flex items-center justify-center">
              <Sparkles className="h-5 w-5 text-accent-foreground" />
            </div>
            <h1 className="text-xl font-headline font-bold tracking-tight">Nebula Finanx</h1>
          </div>
          <div className="flex items-center gap-4">
            <div className="hidden sm:flex items-center gap-2 bg-white/5 px-3 py-1.5 rounded-full border border-white/10">
              <div className="w-2 h-2 rounded-full bg-income animate-pulse" />
              <span className="text-xs font-medium text-muted-foreground">System Online</span>
            </div>
          </div>
        </div>
      </header>

      {/* Main Content */}
      <main className="flex-1 container mx-auto px-4 py-8 max-w-7xl">
        {view === 'dashboard' && (
          <div className="space-y-8 animate-in fade-in slide-in-from-bottom-4 duration-500">
            <SummaryCards 
              balance={totalBalance} 
              income={totalIncome} 
              expenses={totalExpenses} 
            />
            
            <div className="grid gap-8 lg:grid-cols-2">
              <div className="space-y-8">
                <AddTransactionForm onAdd={addTransaction} />
                <TransactionList transactions={transactions.slice(0, 5)} />
              </div>
              <div className="space-y-8">
                <FlowChart transactions={transactions} />
                <div className="nebula-card p-6 rounded-xl border border-primary/20 space-y-4">
                  <h3 className="font-headline font-bold text-lg">Financial Quick-Link</h3>
                  <p className="text-sm text-muted-foreground leading-relaxed">
                    Analyzing your current flow: You've saved 
                    <span className="text-income font-bold mx-1">
                      {totalIncome > 0 ? ((totalBalance / totalIncome) * 100).toFixed(1) : 0}%
                    </span> 
                    of your total earnings this month.
                  </p>
                  <button 
                    onClick={() => setView('advisor')}
                    className="w-full py-2 bg-secondary rounded-lg text-sm font-medium hover:bg-secondary/80 transition-colors"
                  >
                    View Insights
                  </button>
                </div>
              </div>
            </div>
          </div>
        )}

        {view === 'transactions' && (
          <div className="space-y-6 animate-in fade-in slide-in-from-bottom-4 duration-500">
            <div className="flex items-center justify-between">
              <h2 className="text-3xl font-headline font-bold">All Transactions</h2>
            </div>
            <TransactionList transactions={transactions} />
          </div>
        )}

        {view === 'advisor' && (
          <div className="animate-in fade-in slide-in-from-bottom-4 duration-500">
            <AdvisorView transactions={transactions} />
          </div>
        )}
      </main>

      {/* Bottom Navigation */}
      <nav className="fixed bottom-0 left-0 right-0 border-t border-white/5 bg-background/80 backdrop-blur-xl z-50">
        <div className="container mx-auto px-4 max-w-lg h-20 flex items-center justify-around">
          <NavButton 
            active={view === 'dashboard'} 
            onClick={() => setView('dashboard')}
            icon={<LayoutDashboard />}
            label="Dashboard"
          />
          <NavButton 
            active={view === 'transactions'} 
            onClick={() => setView('transactions')}
            icon={<History />}
            label="History"
          />
          <NavButton 
            active={view === 'advisor'} 
            onClick={() => setView('advisor')}
            icon={<Sparkles />}
            label="Advisor"
          />
        </div>
      </nav>
      
      {/* Spacer for bottom nav */}
      <div className="h-20" />
    </div>
  );
}

function NavButton({ active, onClick, icon, label }: { active: boolean; onClick: () => void; icon: React.ReactNode; label: string }) {
  return (
    <button 
      onClick={onClick}
      className={cn(
        "flex flex-col items-center gap-1 transition-all duration-300 px-4 py-2 rounded-xl",
        active ? "text-accent bg-accent/10" : "text-muted-foreground hover:text-foreground"
      )}
    >
      {React.cloneElement(icon as React.ReactElement, { className: "h-6 w-6" })}
      <span className="text-[10px] font-bold uppercase tracking-widest">{label}</span>
    </button>
  );
}
