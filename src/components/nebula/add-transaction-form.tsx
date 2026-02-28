import React, { useState } from "react";
import { Card, CardHeader, CardTitle, CardContent } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { Label } from "@/components/ui/label";
import { RadioGroup, RadioGroupItem } from "@/components/ui/radio-group";
import { TransactionType, Transaction } from "@/lib/types";
import { PlusCircle } from "lucide-react";

interface AddTransactionFormProps {
  onAdd: (transaction: Omit<Transaction, 'id'>) => void;
}

export function AddTransactionForm({ onAdd }: AddTransactionFormProps) {
  const [description, setDescription] = useState("");
  const [amount, setAmount] = useState("");
  const [type, setType] = useState<TransactionType>("expense");
  const [date, setDate] = useState(new Date().toISOString().split('T')[0]);

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!description || !amount) return;

    onAdd({
      description,
      amount: parseFloat(amount),
      type,
      date: new Date(date).toISOString(),
      category: type === 'income' ? 'Earnings' : 'General',
    });

    setDescription("");
    setAmount("");
  };

  return (
    <Card className="nebula-card border-accent/20">
      <CardHeader>
        <CardTitle className="text-xl font-headline flex items-center gap-2">
          <PlusCircle className="h-5 w-5 text-accent" />
          Add Transaction
        </CardTitle>
      </CardHeader>
      <CardContent>
        <form onSubmit={handleSubmit} className="space-y-4">
          <div className="grid gap-4 sm:grid-cols-2">
            <div className="space-y-2">
              <Label htmlFor="description">Description</Label>
              <Input
                id="description"
                placeholder="e.g. Monthly Salary, Coffee..."
                value={description}
                onChange={(e) => setDescription(e.target.value)}
                className="bg-background/50"
              />
            </div>
            <div className="space-y-2">
              <Label htmlFor="amount">Amount ($)</Label>
              <Input
                id="amount"
                type="number"
                step="0.01"
                placeholder="0.00"
                value={amount}
                onChange={(e) => setAmount(e.target.value)}
                className="bg-background/50"
              />
            </div>
          </div>

          <div className="grid gap-4 sm:grid-cols-2 items-end">
            <div className="space-y-2">
              <Label htmlFor="date">Date</Label>
              <Input
                id="date"
                type="date"
                value={date}
                onChange={(e) => setDate(e.target.value)}
                className="bg-background/50"
              />
            </div>
            <div className="space-y-2">
              <Label>Transaction Type</Label>
              <RadioGroup
                value={type}
                onValueChange={(v) => setType(v as TransactionType)}
                className="flex gap-4 pt-2"
              >
                <div className="flex items-center space-x-2">
                  <RadioGroupItem value="income" id="income" className="text-income border-income" />
                  <Label htmlFor="income" className="text-income font-medium">Income</Label>
                </div>
                <div className="flex items-center space-x-2">
                  <RadioGroupItem value="expense" id="expense" className="text-expense border-expense" />
                  <Label htmlFor="expense" className="text-expense font-medium">Expense</Label>
                </div>
              </RadioGroup>
            </div>
          </div>

          <Button type="submit" className="w-full bg-accent hover:bg-accent/90 text-accent-foreground font-bold">
            Add Transaction
          </Button>
        </form>
      </CardContent>
    </Card>
  );
}
