import React, { useState } from "react";
import { Card, CardHeader, CardTitle, CardContent } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { Label } from "@/components/ui/label";
import { RadioGroup, RadioGroupItem } from "@/components/ui/radio-group";
import { TransactionType } from "@/lib/types";
import { PlusCircle, Database } from "lucide-react";
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
    <Card className="nebula-card border-accent/10 overflow-hidden relative">
      <div className="absolute top-0 right-0 p-4 opacity-5">
        <Database className="h-12 w-12 text-accent" />
      </div>
      <CardHeader>
        <CardTitle className="text-xl font-headline flex items-center gap-2 text-accent">
          <PlusCircle className="h-5 w-5" />
          Log Neural Vector
        </CardTitle>
      </CardHeader>
      <CardContent>
        <form onSubmit={handleSubmit} className="space-y-6">
          <div className="grid gap-6 sm:grid-cols-2">
            <div className="space-y-2">
              <Label htmlFor="description" className="text-[10px] uppercase tracking-widest text-muted-foreground">Descriptor</Label>
              <Input
                id="description"
                placeholder="Ex: Mainframe Salary, Cafe..."
                value={description}
                onChange={(e) => setDescription(e.target.value)}
                className="bg-background/40 border-white/5 h-11 focus:border-accent/50 transition-colors"
              />
            </div>
            <div className="space-y-2">
              <Label htmlFor="amount" className="text-[10px] uppercase tracking-widest text-muted-foreground">Magnitude ($)</Label>
              <Input
                id="amount"
                type="number"
                step="0.01"
                placeholder="0.00"
                value={amount}
                onChange={(e) => setAmount(e.target.value)}
                className="bg-background/40 border-white/5 h-11 focus:border-accent/50 transition-colors"
              />
            </div>
          </div>

          <div className="grid gap-6 sm:grid-cols-2 items-end">
            <div className="space-y-2">
              <Label htmlFor="date" className="text-[10px] uppercase tracking-widest text-muted-foreground">Timestamp</Label>
              <Input
                id="date"
                type="date"
                value={date}
                onChange={(e) => setDate(e.target.value)}
                className="bg-background/40 border-white/5 h-11 focus:border-accent/50 transition-colors"
              />
            </div>
            <div className="space-y-2">
              <Label className="text-[10px] uppercase tracking-widest text-muted-foreground">Polarity</Label>
              <RadioGroup
                value={type}
                onValueChange={(v) => setType(v as TransactionType)}
                className="flex gap-6 pt-1"
              >
                <div className="flex items-center space-x-2">
                  <RadioGroupItem value="income" id="income" className="text-income border-income w-5 h-5" />
                  <Label htmlFor="income" className="text-income font-bold text-xs uppercase tracking-widest cursor-pointer">Income</Label>
                </div>
                <div className="flex items-center space-x-2">
                  <RadioGroupItem value="expense" id="expense" className="text-expense border-expense w-5 h-5" />
                  <Label htmlFor="expense" className="text-expense font-bold text-xs uppercase tracking-widest cursor-pointer">Expense</Label>
                </div>
              </RadioGroup>
            </div>
          </div>

          <Button type="submit" className="w-full h-12 bg-accent hover:bg-accent/90 text-accent-foreground font-bold text-sm uppercase tracking-[0.3em] shadow-lg shadow-accent/10">
            Submit Vector
          </Button>
        </form>
      </CardContent>
    </Card>
  );
}