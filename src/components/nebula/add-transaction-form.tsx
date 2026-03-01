import React, { useState, useRef, useEffect } from "react";
import { Card, CardHeader, CardTitle, CardContent } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { Label } from "@/components/ui/label";
import { 
  ShoppingBag, 
  Database, 
  LayoutPanelLeft, 
  Zap, 
  Search, 
  Camera, 
  Loader2, 
  X, 
  Check, 
  AlertCircle,
  Utensils,
  Apple,
  Beef,
  Droplets,
  Wind,
  Coffee,
  Laptop,
  Box,
  ChevronRight,
  Plus,
  Store
} from "lucide-react";
import { useFirestore, useCollection, useMemoFirebase } from "@/firebase";
import { doc, collection, query, orderBy } from "firebase/firestore";
import { setDocumentNonBlocking } from "@/firebase/non-blocking-updates";
import { ScrollArea, ScrollBar } from "@/components/ui/scroll-area";
import { cn } from "@/lib/utils";
import { analyzeReceipt } from "@/ai/flows/analyze-receipt-flow";
import { toast } from "@/hooks/use-toast";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogFooter,
} from "@/components/ui/dialog";

interface AddTransactionFormProps {
  userId: string;
}

const CATEGORIES = [
  { id: 'all', name: "Tudo", icon: LayoutPanelLeft },
  { id: 'Mercado', name: "Mercado", icon: Utensils },
  { id: 'Hortifruti', name: "Hortifruti", icon: Apple },
  { id: 'Carnes', name: "Carnes", icon: Beef },
  { id: 'Higiene', name: "Higiene", icon: Droplets },
  { id: 'Limpeza', name: "Limpeza", icon: Wind },
  { id: 'Bebidas', name: "Bebidas", icon: Coffee },
  { id: 'Eletrônicos', name: "Eletrônicos", icon: Laptop },
  { id: 'Outros', name: "Outros", icon: Box }
];

export function AddTransactionForm({ userId }: AddTransactionFormProps) {
  const db = useFirestore();
  const [searchTerm, setSearchTerm] = useState("");
  const [selectedCategory, setSelectedCategory] = useState("all");
  const [selectedProduct, setSelectedProduct] = useState<any>(null);
  const [amount, setAmount] = useState("");

  // Camera & AI State
  const [isCameraOpen, setIsCameraOpen] = useState(false);
  const [isAnalyzing, setIsAnalyzing] = useState(false);
  const videoRef = useRef<HTMLVideoElement>(null);
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const [isReviewOpen, setIsReviewOpen] = useState(false);
  const [reviewItems, setReviewItems] = useState<any[]>([]);

  // Fetch products
  const productsQuery = useMemoFirebase(() => {
    if (!db) return null;
    return query(collection(db, "users", userId, "products"), orderBy("name"));
  }, [db, userId]);

  const { data: products } = useCollection(productsQuery);

  // Fetch price entries to show store-specific prices in the selector
  const entriesQuery = useMemoFirebase(() => {
    if (!db) return null;
    return query(collection(db, "users", userId, "price_entries"), orderBy("date", "desc"));
  }, [db, userId]);

  const { data: allEntries } = useCollection(entriesQuery);

  const filteredProducts = products?.filter(p => {
    const matchesSearch = p.name.toLowerCase().includes(searchTerm.toLowerCase());
    const matchesCategory = selectedCategory === 'all' || p.category === selectedCategory;
    return matchesSearch && matchesCategory;
  }) || [];

  const handleManualSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!selectedProduct || !amount || !db) return;

    saveTransaction(selectedProduct.name, parseFloat(amount), selectedProduct.category);
    
    setSelectedProduct(null);
    setSearchTerm("");
    setAmount("");
  };

  const saveTransaction = (description: string, val: number, cat: string) => {
    if (!db) return;
    const transactionId = Math.random().toString(36).substr(2, 9);
    const transactionRef = doc(db, "users", userId, "transactions", transactionId);
    
    setDocumentNonBlocking(transactionRef, {
      id: transactionId,
      description: description,
      amount: val,
      type: 'expense',
      date: new Date().toISOString(),
      category: cat || 'Mercado',
      categoryId: 'expense_default',
    }, { merge: true });
  };

  // Camera logic
  useEffect(() => {
    if (isCameraOpen) {
      navigator.mediaDevices.getUserMedia({ video: { facingMode: 'environment' } })
        .then(stream => {
          if (videoRef.current) videoRef.current.srcObject = stream;
        })
        .catch(err => console.error("Erro câmera:", err));
    } else {
      if (videoRef.current?.srcObject) {
        (videoRef.current.srcObject as MediaStream).getTracks().forEach(t => t.stop());
      }
    }
  }, [isCameraOpen]);

  const captureAndAnalyze = async () => {
    if (!videoRef.current || !canvasRef.current) return;
    const canvas = canvasRef.current;
    const video = videoRef.current;
    canvas.width = video.videoWidth;
    canvas.height = video.videoHeight;
    canvas.getContext('2d')?.drawImage(video, 0, 0);
    const photoDataUri = canvas.toDataURL('image/jpeg');
    
    setIsAnalyzing(true);
    try {
      const result = await analyzeReceipt({ photoDataUri });
      const matched = result.items.map(item => {
        const match = products?.find(p => p.name.toLowerCase() === item.name.toLowerCase());
        return { ...item, matchedProduct: match || null, selected: !!match };
      });
      setReviewItems(matched);
      setIsReviewOpen(true);
      setIsCameraOpen(false);
    } catch (e) {
      toast({ variant: "destructive", title: "Erro na leitura", description: "Tente novamente." });
    } finally {
      setIsAnalyzing(false);
    }
  };

  const handleBulkAdd = () => {
    reviewItems.filter(i => i.selected).forEach(item => {
      saveTransaction(item.name, item.price, item.category);
    });
    toast({ title: "Itens adicionados", description: "As compras foram registradas no seu extrato." });
    setIsReviewOpen(false);
  };

  return (
    <div className="space-y-6">
      <Card className="nebula-card border-accent/10 rounded-[2.5rem] overflow-hidden relative group">
        <div className="absolute top-0 right-0 p-8 opacity-[0.02] group-hover:opacity-[0.05] transition-opacity">
          <Database className="h-32 w-32 text-accent" />
        </div>
        <CardHeader className="flex flex-row items-center justify-between">
          <CardTitle className="text-xl font-headline font-black flex items-center gap-3 text-accent italic uppercase tracking-tighter">
            <ShoppingBag className="h-5 w-5 glow-accent" />
            Novo Gasto
          </CardTitle>
          <Button 
            onClick={() => setIsCameraOpen(true)}
            variant="outline"
            className="h-9 px-4 rounded-xl border-cyan-500/30 text-cyan-400 bg-cyan-500/5 hover:bg-cyan-500/10 font-black text-[10px] uppercase tracking-widest"
          >
            <Camera className="mr-2 h-4 w-4" />
            Escanear Nota
          </Button>
        </CardHeader>
        <CardContent className="space-y-8">
          {/* visual category selector */}
          <div className="space-y-4">
            <Label className="text-[10px] font-black uppercase tracking-[0.2em] text-muted-foreground ml-1">Categorias</Label>
            <ScrollArea className="w-full whitespace-nowrap">
              <div className="flex gap-3 pb-4">
                {CATEGORIES.map((cat) => (
                  <button
                    key={cat.id}
                    onClick={() => setSelectedCategory(cat.id)}
                    className={cn(
                      "flex flex-col items-center gap-2 p-3 min-w-[80px] rounded-2xl border transition-all",
                      selectedCategory === cat.id 
                        ? "bg-accent border-accent text-accent-foreground shadow-lg shadow-accent/20" 
                        : "bg-white/5 border-white/5 text-muted-foreground hover:bg-white/10"
                    )}
                  >
                    <cat.icon className="h-5 w-5" />
                    <span className="text-[10px] font-bold uppercase tracking-widest">{cat.name}</span>
                  </button>
                ))}
              </div>
              <ScrollBar orientation="horizontal" />
            </ScrollArea>
          </div>

          <form onSubmit={handleManualSubmit} className="space-y-8">
            <div className="space-y-4">
              <div className="flex items-center justify-between">
                <Label className="text-[10px] font-black uppercase tracking-[0.2em] text-muted-foreground ml-1">Selecionar Produto</Label>
                <div className="relative w-1/2">
                  <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-3 w-3 text-muted-foreground" />
                  <Input
                    placeholder="Filtrar..."
                    value={searchTerm}
                    onChange={(e) => setSearchTerm(e.target.value)}
                    className="bg-white/5 border-white/5 h-9 pl-9 rounded-xl focus:border-accent/50 text-xs"
                  />
                </div>
              </div>

              <ScrollArea className="h-72 rounded-2xl border border-white/5 bg-white/[0.02]">
                <div className="grid grid-cols-1 gap-3 p-3">
                  {filteredProducts.length === 0 ? (
                    <div className="py-12 text-center">
                      <p className="text-[10px] text-muted-foreground uppercase tracking-widest">Nenhum produto cadastrado nesta categoria.</p>
                    </div>
                  ) : (
                    filteredProducts.map(p => {
                      // Logic: Get latest entry per store for this product
                      const productEntries = allEntries?.filter(e => e.productId === p.id) || [];
                      const latestByStore = new Map();
                      productEntries.forEach(entry => {
                        if (!latestByStore.has(entry.storeId)) {
                          latestByStore.set(entry.storeId, entry);
                        }
                      });
                      const storePrices = Array.from(latestByStore.values()) as any[];

                      return (
                        <div 
                          key={p.id}
                          className={cn(
                            "p-4 rounded-2xl border transition-all space-y-4",
                            selectedProduct?.id === p.id 
                              ? "bg-accent/5 border-accent/30" 
                              : "bg-white/[0.03] border-white/5"
                          )}
                        >
                          <div className="flex items-start justify-between">
                            <div className="text-left min-w-0">
                              <p className="text-sm font-black truncate">{p.name}</p>
                              <p className="text-[9px] uppercase tracking-widest text-muted-foreground">{p.category}</p>
                            </div>
                            <button 
                              type="button"
                              onClick={() => setSelectedProduct(p)}
                              className={cn(
                                "p-2 rounded-xl transition-all",
                                selectedProduct?.id === p.id 
                                  ? "bg-accent text-accent-foreground shadow-lg shadow-accent/20" 
                                  : "bg-white/5 text-muted-foreground hover:bg-white/10"
                              )}
                            >
                              {selectedProduct?.id === p.id ? <Check className="h-4 w-4" /> : <Plus className="h-4 w-4" />}
                            </button>
                          </div>
                          
                          <div className="flex flex-wrap gap-2">
                            {storePrices.map(sp => (
                              <button
                                key={sp.id}
                                type="button"
                                onClick={() => {
                                  setSelectedProduct(p);
                                  setAmount(sp.price.toString());
                                }}
                                className="px-3 py-1.5 rounded-lg bg-indigo-500/10 border border-indigo-500/20 text-[9px] font-black uppercase tracking-widest hover:bg-accent hover:text-accent-foreground hover:border-accent transition-all flex items-center gap-2 group/store"
                              >
                                <Store className="h-3 w-3 opacity-40 group-hover/store:opacity-100" />
                                <span>{sp.storeName}</span>
                                <span className="text-accent group-hover/store:text-accent-foreground font-black">R$ {sp.price.toFixed(2)}</span>
                              </button>
                            ))}
                            {storePrices.length === 0 && (
                              <p className="text-[8px] text-muted-foreground/40 italic uppercase tracking-[0.2em] font-medium">Nenhum preço registrado</p>
                            )}
                          </div>
                        </div>
                      );
                    })
                  )}
                </div>
              </ScrollArea>
            </div>

            <div className="space-y-4">
              <div className="flex flex-col sm:flex-row items-end gap-6">
                <div className="flex-1 w-full space-y-2">
                  <Label className="text-[10px] font-black uppercase tracking-[0.2em] text-muted-foreground ml-1">Valor do Item (R$)</Label>
                  <Input
                    type="number"
                    step="0.01"
                    placeholder="0,00"
                    value={amount}
                    onChange={(e) => setAmount(e.target.value)}
                    className="bg-white/5 border-white/5 h-16 rounded-2xl focus:border-accent/50 focus:bg-white/[0.08] transition-all px-6 text-2xl font-black text-accent"
                  />
                </div>
                <Button 
                  type="submit" 
                  disabled={!selectedProduct || !amount}
                  className="w-full sm:w-auto h-16 px-12 bg-accent hover:bg-accent/90 text-accent-foreground font-black text-sm uppercase tracking-[0.3em] shadow-xl shadow-accent/20 rounded-2xl transition-all"
                >
                  Confirmar
                  <Zap className="ml-3 h-4 w-4" />
                </Button>
              </div>
              
              {selectedProduct && (
                <p className="text-[10px] text-accent/60 font-bold uppercase tracking-widest flex items-center gap-2">
                  <Check className="h-3 w-3" />
                  Item Selecionado: {selectedProduct.name}
                </p>
              )}
            </div>
          </form>
        </CardContent>
      </Card>

      {/* Camera UI */}
      {isCameraOpen && (
        <div className="fixed inset-0 z-[100] bg-black/95 flex flex-col items-center justify-center p-6 animate-in fade-in">
          <button onClick={() => setIsCameraOpen(false)} className="absolute top-8 right-8 text-white/50 hover:text-white p-2">
            <X className="h-8 w-8" />
          </button>
          <div className="w-full max-w-2xl aspect-[3/4] bg-indigo-950/20 border-2 border-dashed border-white/20 rounded-3xl overflow-hidden relative">
            <video ref={videoRef} className="w-full h-full object-cover" autoPlay playsInline muted />
            <canvas ref={canvasRef} className="hidden" />
            {isAnalyzing && (
              <div className="absolute inset-0 bg-black/60 backdrop-blur-sm flex flex-col items-center justify-center gap-4">
                <Loader2 className="h-12 w-12 text-cyan-400 animate-spin" />
                <p className="text-cyan-400 font-black uppercase tracking-widest text-sm">Analisando Nota...</p>
              </div>
            )}
          </div>
          {!isAnalyzing && (
            <button onClick={captureAndAnalyze} className="mt-8 w-20 h-20 rounded-full border-4 border-white flex items-center justify-center group">
              <div className="w-16 h-16 rounded-full bg-white group-hover:bg-cyan-400 transition-colors" />
            </button>
          )}
        </div>
      )}

      {/* Review Dialog */}
      <Dialog open={isReviewOpen} onOpenChange={setIsReviewOpen}>
        <DialogContent className="max-w-2xl bg-[#1a1b2e] border-indigo-500/20 text-white rounded-[2rem] p-0 overflow-hidden">
          <DialogHeader className="p-8 pb-4">
            <DialogTitle className="text-2xl font-black uppercase tracking-tight text-accent flex items-center gap-3 italic">
              <ShoppingBag className="h-6 w-6" />
              Itens da Notinha
            </DialogTitle>
          </DialogHeader>
          <ScrollArea className="max-h-[50vh] px-8 py-4">
            <div className="space-y-3">
              {reviewItems.map((item, idx) => (
                <div 
                  key={idx} 
                  className={cn(
                    "p-4 rounded-2xl border transition-all flex items-center justify-between gap-4",
                    item.matchedProduct 
                      ? "bg-accent/5 border-accent/20" 
                      : "bg-white/[0.02] border-white/5 opacity-60"
                  )}
                >
                  <div className="flex-1 min-w-0">
                    <p className="font-bold text-sm truncate">{item.name}</p>
                    <div className="flex items-center gap-2 mt-1">
                      <p className="text-xs font-black text-accent">R$ {item.price.toFixed(2)}</p>
                      {!item.matchedProduct && (
                        <span className="flex items-center gap-1 text-[8px] uppercase tracking-widest text-muted-foreground">
                          <AlertCircle className="h-2 w-2" /> não cadastrado
                        </span>
                      )}
                    </div>
                  </div>
                  <Button
                    size="icon"
                    variant="ghost"
                    disabled={!item.matchedProduct}
                    onClick={() => {
                      const newItems = [...reviewItems];
                      newItems[idx].selected = !newItems[idx].selected;
                      setReviewItems(newItems);
                    }}
                    className={cn(
                      "rounded-xl",
                      item.selected ? "bg-accent text-accent-foreground" : "bg-white/5 text-muted-foreground"
                    )}
                  >
                    {item.selected ? <Check className="h-4 w-4" /> : <ChevronRight className="h-4 w-4" />}
                  </Button>
                </div>
              ))}
            </div>
          </ScrollArea>
          <DialogFooter className="p-8 pt-4 border-t border-white/5 bg-white/[0.02]">
            <Button variant="ghost" onClick={() => setIsReviewOpen(false)} className="h-14 font-black uppercase tracking-widest text-xs">Descartar</Button>
            <Button onClick={handleBulkAdd} className="h-14 px-10 bg-accent text-accent-foreground font-black uppercase tracking-widest text-xs rounded-xl shadow-lg shadow-accent/20">
              Adicionar Lançamentos ({reviewItems.filter(i => i.selected).length})
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
}
