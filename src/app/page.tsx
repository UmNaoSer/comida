
"use client";

import React, { useState, useEffect } from "react";
import { useFirestore, useCollection, useMemoFirebase } from "@/firebase";
import { collection, query, orderBy } from "firebase/firestore";
import { SummaryCards } from "@/components/nebula/summary-cards";
import { TransactionList } from "@/components/nebula/transaction-list";
import { FlowChart } from "@/components/nebula/flow-chart";
import { AIInsights } from "@/components/nebula/ai-insights";
import { AdvisorView } from "@/components/nebula/advisor-view";
import { AddTransactionForm } from "@/components/nebula/add-transaction-form";
import { LayoutDashboard, History, Loader2, Search, ChevronDown } from "lucide-react";
import { cn } from "@/lib/utils";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { getYear, getMonth } from "date-fns";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import {
  Collapsible,
  CollapsibleContent,
  CollapsibleTrigger,
} from "@/components/ui/collapsible";

// Configuração para o Vercel reconhecer o tempo de execução da IA
export const maxDuration = 60;

type View = 'dashboard' | 'transactions' | 'advisor';

const GUEST_USER_ID = "guest-protocol-v1";

const MONTHS = [
  "Janeiro", "Fevereiro", "Março", "Abril", "Maio", "Junho",
  "Julho", "Agosto", "Setembro", "Outubro", "Novembro", "Dezembro"
];

export default function NebulaFinanx() {
  const db = useFirestore();
  const [view, setView] = useState<View>('dashboard');
  const [mounted, setMounted] = useState(false);
  
  const [selectedYear, setSelectedYear] = useState<string>("");
  const [selectedMonth, setSelectedMonth] = useState<string>("");
  const [isAllMonthTxsOpen, setIsAllMonthTxsOpen] = useState(false);

  useEffect(() => {
    const now = new Date();
    setSelectedYear(getYear(now).toString());
    setSelectedMonth(getMonth(now).toString());
    setMounted(true);
  }, []);

  const transactionsQuery = useMemoFirebase(() => {
    if (!db) return null;
    return query(
      collection(db, "users", GUEST_USER_ID, "transactions"),
      orderBy("date", "desc")
    );
  }, [db]);

  const { data: transactions, isLoading: isTxLoading } = useCollection(transactionsQuery);

  if (!mounted || (isTxLoading && !transactions)) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-background">
        <Loader2 className="h-8 w-8 text-accent animate-spin" />
      </div>
    );
  }

  const txs = transactions || [];
  
  const filteredYearTxs = txs.filter(t => {
    const d = new Date(t.date);
    return d.getFullYear().toString() === selectedYear;
  });

  const monthTxs = txs.filter(t => {
    const d = new Date(t.date);
    return d.getFullYear().toString() === selectedYear && d.getMonth().toString() === selectedMonth;
  });

  const totalIncome = filteredYearTxs.filter(t => t.type === 'income').reduce((sum, t) => sum + t.amount, 0);
  const totalExpenses = filteredYearTxs.filter(t => t.type === 'expense').reduce((sum, t) => sum + t.amount, 0);
  const totalBalance = totalIncome - totalExpenses;

  const monthsWithEntries = new Set(filteredYearTxs.map(t => new Date(t.date).getMonth())).size;
  const monthlyAverage = monthsWithEntries > 0 ? totalBalance / monthsWithEntries : 0;

  const recentTxs = txs.slice(0, 5);
  const currentYear = getYear(new Date());
  const yearOptions = Array.from({ length: 5 }, (_, i) => (currentYear - i).toString());

  return (
    <div className="min-h-screen bg-background text-foreground flex flex-col font-headline">
      <header className="container mx-auto px-6 h-24 flex items-center justify-between">
        <div className="flex items-center gap-3">
          <div className="flex flex-col">
            <h1 className="text-xl font-bold tracking-widest uppercase">Nebula</h1>
            <span className="text-[10px] text-muted-foreground uppercase tracking-[0.2em] -mt-1">Gestão Financeira</span>
          </div>
        </div>
        <div className="w-10 h-10 rounded-full bg-gradient-to-br from-indigo-400 to-indigo-600 shadow-lg shadow-indigo-500/20 border border-white/10" />
      </header>

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

            <Card className="bg-indigo-950/10 border-indigo-500/10 rounded-[2rem] overflow-hidden shadow-[0_0_30px_rgba(79,70,229,0.05)]">
              <CardHeader className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4 pb-4">
                <div className="space-y-1">
                  <CardTitle className="text-lg font-bold tracking-tight">Lançamentos</CardTitle>
                  <p className="text-[9px] text-muted-foreground uppercase tracking-widest font-black">Total: {txs.length} registros</p>
                </div>
                
                <div className="flex items-center gap-2">
                  <div className="flex items-center gap-2 bg-white/5 border border-white/10 rounded-xl px-3 py-1">
                    <Select value={selectedMonth} onValueChange={setSelectedMonth}>
                      <SelectTrigger className="h-7 border-none bg-transparent p-0 text-[10px] font-black uppercase tracking-widest focus:ring-0 w-24">
                        <SelectValue />
                      </SelectTrigger>
                      <SelectContent className="bg-slate-950 border-white/10">
                        {MONTHS.map((month, idx) => (
                          <SelectItem key={month} value={idx.toString()} className="text-[10px] font-bold">{month}</SelectItem>
                        ))}
                      </SelectContent>
                    </Select>
                  </div>
                  <div className="flex items-center gap-2 bg-white/5 border border-white/10 rounded-xl px-3 py-1">
                    <Select value={selectedYear} onValueChange={setSelectedYear}>
                      <SelectTrigger className="h-7 border-none bg-transparent p-0 text-[10px] font-black uppercase tracking-widest focus:ring-0 w-16">
                        <SelectValue />
                      </SelectTrigger>
                      <SelectContent className="bg-slate-950 border-white/10">
                        {yearOptions.map(year => (
                          <SelectItem key={year} value={year} className="text-[10px] font-bold">{year}</SelectItem>
                        ))}
                      </SelectContent>
                    </Select>
                  </div>
                </div>
              </CardHeader>
              <CardContent className="space-y-6">
                {recentTxs.length === 0 ? (
                  <div className="py-12 text-center">
                    <p className="text-[11px] text-indigo-300/40 uppercase tracking-[0.3em] font-medium">Nenhuma atividade recente.</p>
                  </div>
                ) : (
                  <div className="space-y-6">
                    <div className="space-y-1">
                       <p className="text-[9px] font-black uppercase tracking-[0.2em] text-indigo-300/60 ml-1 mb-2">Últimos 5 globais</p>
                       <TransactionList transactions={recentTxs} userId={GUEST_USER_ID} compact />
                    </div>

                    <Collapsible open={isAllMonthTxsOpen} onOpenChange={setIsAllMonthTxsOpen} className="space-y-4">
                      <CollapsibleTrigger asChild>
                        <button className="w-full h-12 rounded-xl bg-white/5 border border-white/10 flex items-center justify-between px-6 hover:bg-white/10 transition-all group">
                          <span className="text-[10px] font-black uppercase tracking-widest text-indigo-200">
                            Exibir todos de {MONTHS[parseInt(selectedMonth)]}
                          </span>
                          <ChevronDown className={cn("h-4 w-4 text-indigo-400 transition-transform duration-300", isAllMonthTxsOpen && "rotate-180")} />
                        </button>
                      </CollapsibleTrigger>
                      <CollapsibleContent className="space-y-4 animate-in slide-in-from-top-2">
                        {monthTxs.length === 0 ? (
                          <div className="py-8 text-center border-2 border-dashed border-white/5 rounded-2xl">
                             <p className="text-[9px] text-muted-foreground uppercase tracking-widest">Nenhum lançamento em {MONTHS[parseInt(selectedMonth)]} de {selectedYear}</p>
                          </div>
                        ) : (
                          <div className="space-y-2">
                             <p className="text-[9px] font-black uppercase tracking-[0.2em] text-indigo-300/60 ml-1 mb-2">Todos do mês ({monthTxs.length})</p>
                             <TransactionList transactions={monthTxs} userId={GUEST_USER_ID} compact />
                          </div>
                        )}
                      </CollapsibleContent>
                    </Collapsible>
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
