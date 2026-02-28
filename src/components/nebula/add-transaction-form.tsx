import React, { useState } from "react";
import { Card, CardHeader, CardTitle, CardContent } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { Label } from "@/components/ui/label";
import { RadioGroup, RadioGroupItem } from "@/components/ui/radio-group";
import { TransactionType } from "@/lib/types";
import { PlusCircle, Database, Cpu, Zap } from "lucide-react";
import { useFirestore } from "@/firebase";
import { doc } from "firebase/firestore";
import { setDocumentNonBlocking } from "@/firebase/non-blocking-updates";

interface AddTransactionFormProps {
  userId: string;
}

export function AddTransactionForm({ userId }: AddTransactionFormProps) {
  const db = useFirestore();
  const [description, setDescription] = useState("");
  const [amount, setAmount] = useState("");
  const [type, setType] = useState<TransactionType>("expense");
  const [date, setDate] = useState(new Date().toISOString().split('T')[0]);

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!description || !amount || !db) return;

    const transactionId = Math.random().toString(36).substr(2, 9);
    const transactionRef = doc(db, "users", userId, "transactions", transactionId);
    
    const newTx = {
      id: transactionId,
      description,
      amount: parseFloat(amount),
      type,
      date: new Date(date).toISOString(),
      categoryId: type === 'income' ? 'income_default' : 'expense_default',
    };

    setDocumentNonBlocking(transactionRef, newTx, { merge: true });

    setDescription("");
    setAmount("");
  };

  return (
    <Card className="nebula-card border-accent/10 rounded-[2.5rem] overflow-hidden relative p-4 group">
      <div className="absolute top-0 right-0 p-8 opacity-[0.02] group-hover:opacity-[0.05] transition-opacity">
        <Database className="h-32 w-32 text-accent" />
      </div>
      <CardHeader>
        <CardTitle className="text-2xl font-headline font-black flex items-center gap-3 text-accent italic uppercase tracking-tighter">
          <Cpu className="h-6 w-6 glow-accent" />
          Log de Vetor Neural
        </CardTitle>
      </CardHeader>
      <CardContent>
        <form onSubmit={handleSubmit} className="space-y-8">
          <div className="grid gap-8 sm:grid-cols-2">
            <div className="space-y-3">
              <Label htmlFor="description" className="text-[10px] font-black uppercase tracking-[0.2em] text-muted-foreground ml-1">Descritor</Label>
              <Input
                id="description"
                placeholder="Ex: Salário, Bio-Combustível..."
                value={description}
                onChange={(e) => setDescription(e.target.value)}
                className="bg-white/5 border-white/5 h-14 rounded-2xl focus:border-accent/50 focus:bg-white/[0.08] transition-all px-5 text-sm font-medium"
              />
            </div>
            <div className="space-y-3">
              <Label htmlFor="amount" className="text-[10px] font-black uppercase tracking-[0.2em] text-muted-foreground ml-1">Magnitude (Créditos)</Label>
              <Input
                id="amount"
                type="number"
                step="0.01"
                placeholder="0,00"
                value={amount}
                onChange={(e) => setAmount(e.target.value)}
                className="bg-white/5 border-white/5 h-14 rounded-2xl focus:border-accent/50 focus:bg-white/[0.08] transition-all px-5 text-sm font-medium"
              />
            </div>
          </div>

          <div className="grid gap-8 sm:grid-cols-2 items-end">
            <div className="space-y-3">
              <Label htmlFor="date" className="text-[10px] font-black uppercase tracking-[0.2em] text-muted-foreground ml-1">Offset Temporal</Label>
              <Input
                id="date"
                type="date"
                value={date}
                onChange={(e) => setDate(e.target.value)}
                className="bg-white/5 border-white/5 h-14 rounded-2xl focus:border-accent/50 focus:bg-white/[0.08] transition-all px-5 text-sm font-medium"
              />
            </div>
            <div className="space-y-4">
              <Label className="text-[10px] font-black uppercase tracking-[0.2em] text-muted-foreground ml-1">Polaridade</Label>
              <RadioGroup
                value={type}
                onValueChange={(v) => setType(v as TransactionType)}
                className="flex gap-8 pt-1"
              >
                <div className="flex items-center space-x-3 cursor-pointer group/radio">
                  <RadioGroupItem value="income" id="income" className="text-income border-income/40 w-5 h-5" />
                  <Label htmlFor="income" className="text-income font-black text-xs uppercase tracking-[0.2em] cursor-pointer group-hover/radio:text-income/100">Entrada</Label>
                </div>
                <div className="flex items-center space-x-3 cursor-pointer group/radio">
                  <RadioGroupItem value="expense" id="expense" className="text-expense border-expense/40 w-5 h-5" />
                  <Label htmlFor="expense" className="text-expense font-black text-xs uppercase tracking-[0.2em] cursor-pointer group-hover/radio:text-expense/100">Saída</Label>
                </div>
              </RadioGroup>
            </div>
          </div>

          <Button type="submit" className="w-full h-16 bg-accent hover:bg-accent/90 text-accent-foreground font-black text-sm uppercase tracking-[0.4em] shadow-xl shadow-accent/20 rounded-2xl group transition-all">
            Commit de Vetor
            <Zap className="ml-3 h-4 w-4 group-hover:fill-current transition-all" />
          </Button>
        </form>
      </CardContent>
    </Card>
  );
}
