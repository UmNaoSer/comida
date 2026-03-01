import React, { useState } from "react";
import { Card, CardHeader, CardTitle, CardContent } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { Label } from "@/components/ui/label";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { ShoppingBag, Database, LayoutPanelLeft, Zap } from "lucide-react";
import { useFirestore, useCollection, useMemoFirebase } from "@/firebase";
import { doc, collection, query, orderBy } from "firebase/firestore";
import { setDocumentNonBlocking } from "@/firebase/non-blocking-updates";

interface AddTransactionFormProps {
  userId: string;
}

export function AddTransactionForm({ userId }: AddTransactionFormProps) {
  const db = useFirestore();
  const [selectedProductId, setSelectedProductId] = useState("");
  const [amount, setAmount] = useState("");
  const [date, setDate] = useState(new Date().toISOString().split('T')[0]);

  // Fetch products to populate the selection
  const productsQuery = useMemoFirebase(() => {
    if (!db) return null;
    return query(collection(db, "users", userId, "products"), orderBy("name"));
  }, [db, userId]);

  const { data: products } = useCollection(productsQuery);

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!selectedProductId || !amount || !db) return;

    const product = products?.find(p => p.id === selectedProductId);
    if (!product) return;

    const transactionId = Math.random().toString(36).substr(2, 9);
    const transactionRef = doc(db, "users", userId, "transactions", transactionId);
    
    const newTx = {
      id: transactionId,
      description: product.name,
      amount: parseFloat(amount),
      type: 'expense' as const, // Always expense for products
      date: new Date(date).toISOString(),
      category: product.category || 'Mercado',
      categoryId: 'expense_default',
    };

    setDocumentNonBlocking(transactionRef, newTx, { merge: true });

    setSelectedProductId("");
    setAmount("");
  };

  return (
    <Card className="nebula-card border-accent/10 rounded-[2.5rem] overflow-hidden relative p-4 group">
      <div className="absolute top-0 right-0 p-8 opacity-[0.02] group-hover:opacity-[0.05] transition-opacity">
        <Database className="h-32 w-32 text-accent" />
      </div>
      <CardHeader>
        <CardTitle className="text-2xl font-headline font-black flex items-center gap-3 text-accent italic uppercase tracking-tighter">
          <LayoutPanelLeft className="h-6 w-6 glow-accent" />
          Registrar Compra
        </CardTitle>
      </CardHeader>
      <CardContent>
        <form onSubmit={handleSubmit} className="space-y-8">
          <div className="grid gap-8 sm:grid-cols-2">
            <div className="space-y-3">
              <Label htmlFor="product" className="text-[10px] font-black uppercase tracking-[0.2em] text-muted-foreground ml-1">Produto</Label>
              <Select value={selectedProductId} onValueChange={setSelectedProductId}>
                <SelectTrigger id="product" className="bg-white/5 border-white/5 h-14 rounded-2xl focus:border-accent/50 focus:bg-white/[0.08] transition-all px-5 text-sm font-medium">
                  <SelectValue placeholder="Selecione um produto..." />
                </SelectTrigger>
                <SelectContent className="bg-slate-950 border-white/10 text-white">
                  {products?.map((product) => (
                    <SelectItem key={product.id} value={product.id}>
                      {product.name}
                    </SelectItem>
                  ))}
                  {(!products || products.length === 0) && (
                    <SelectItem value="none" disabled>Nenhum produto cadastrado</SelectItem>
                  )}
                </SelectContent>
              </Select>
            </div>
            <div className="space-y-3">
              <Label htmlFor="amount" className="text-[10px] font-black uppercase tracking-[0.2em] text-muted-foreground ml-1">Valor Pago (R$)</Label>
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
              <Label htmlFor="date" className="text-[10px] font-black uppercase tracking-[0.2em] text-muted-foreground ml-1">Data da Compra</Label>
              <Input
                id="date"
                type="date"
                value={date}
                onChange={(e) => setDate(e.target.value)}
                className="bg-white/5 border-white/5 h-14 rounded-2xl focus:border-accent/50 focus:bg-white/[0.08] transition-all px-5 text-sm font-medium"
              />
            </div>
            <div className="space-y-3">
               <div className="h-14 flex items-center px-5 bg-expense/10 rounded-2xl border border-expense/20">
                  <ShoppingBag className="h-4 w-4 text-expense mr-3" />
                  <span className="text-[10px] font-black uppercase tracking-widest text-expense">Lançamento de Saída</span>
               </div>
            </div>
          </div>

          <Button type="submit" className="w-full h-16 bg-accent hover:bg-accent/90 text-accent-foreground font-black text-sm uppercase tracking-[0.4em] shadow-xl shadow-accent/20 rounded-2xl group transition-all">
            Salvar no Extrato
            <Zap className="ml-3 h-4 w-4 group-hover:fill-current transition-all" />
          </Button>
        </form>
      </CardContent>
    </Card>
  );
}
