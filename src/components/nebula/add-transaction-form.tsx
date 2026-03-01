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
  Store,
  Sparkles
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
  const [selectedCategory, setSelectedCategory] = useState("Mercado");
  const [selectedProduct, setSelectedProduct] = useState<any>(null);
  const [amount, setAmount] = useState("");
  const [quantity, setQuantity] = useState("1");

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

  // Fetch price entries
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

    const totalAmount = parseFloat(amount) * (parseInt(quantity) || 1);
    const description = `${selectedProduct.name}${parseInt(quantity) > 1 ? ` (x${quantity})` : ''}`;
    
    saveTransaction(description, totalAmount, selectedProduct.category);
    
    setSelectedProduct(null);
    setSearchTerm("");
    setAmount("");
    setQuantity("1");
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
    <div className="space-y-12 pb-20 animate-in fade-in duration-700">
      {/* Visual Header / Action Area */}
      <div className="flex flex-col sm:flex-row items-center justify-between gap-6">
        <div className="space-y-1 w-full sm:w-auto">
          <h2 className="text-3xl font-black uppercase tracking-tighter italic flex items-center gap-3">
            <ShoppingBag className="h-8 w-8 text-accent" />
            Nova Compra
          </h2>
          <p className="text-[10px] text-muted-foreground uppercase tracking-[0.4em] font-bold">Registro Direto</p>
        </div>
        
        <Button 
          onClick={() => setIsCameraOpen(true)}
          className="w-full sm:w-auto h-14 px-8 rounded-2xl bg-cyan-500 hover:bg-cyan-600 text-white font-black text-xs uppercase tracking-[0.2em] shadow-lg shadow-cyan-500/20 flex items-center justify-center gap-3 active:scale-95 transition-all"
        >
          <Camera className="h-5 w-5" />
          Escanear Nota
        </Button>
      </div>

      {/* Category Section - Modern Grid */}
      <div className="space-y-6">
        <div className="flex items-center justify-between px-1">
          <Label className="text-[11px] font-black uppercase tracking-[0.3em] text-indigo-300/60">Escolher Categoria</Label>
        </div>
        <div className="grid grid-cols-2 md:grid-cols-4 gap-4 px-1">
          {CATEGORIES.map((cat) => (
            <button
              key={cat.id}
              onClick={() => setSelectedCategory(cat.id)}
              className={cn(
                "flex items-center gap-4 p-5 rounded-3xl border-2 transition-all duration-300 active:scale-95",
                selectedCategory === cat.id 
                  ? "bg-accent border-accent text-accent-foreground shadow-2xl shadow-accent/20 scale-105" 
                  : "bg-white/5 border-white/5 text-indigo-200/40 hover:bg-white/10 hover:border-white/10"
              )}
            >
              <div className={cn(
                "p-3 rounded-2xl transition-all",
                selectedCategory === cat.id ? "bg-accent-foreground/10" : "bg-white/5"
              )}>
                <cat.icon className="h-6 w-6" />
              </div>
              <span className="text-[11px] font-black uppercase tracking-widest">{cat.name}</span>
            </button>
          ))}
        </div>
      </div>

      {/* Product Selection Area - Robust Grid */}
      <div className="space-y-6">
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 px-1">
          <Label className="text-[11px] font-black uppercase tracking-[0.3em] text-indigo-300/60">Produtos Disponíveis</Label>
          <div className="relative w-full sm:w-72">
            <Search className="absolute left-4 top-1/2 -translate-y-1/2 h-4 w-4 text-indigo-300/30" />
            <Input
              placeholder="Pesquisar item..."
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              className="bg-white/5 border-white/10 h-12 pl-12 rounded-xl focus:border-accent/50 text-xs font-bold transition-all"
            />
          </div>
        </div>

        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-6">
          {filteredProducts.length === 0 ? (
            <div className="col-span-full py-24 text-center border-2 border-dashed border-white/5 rounded-[3rem]">
              <Sparkles className="h-12 w-12 text-white/5 mx-auto mb-4" />
              <p className="text-[11px] text-muted-foreground uppercase tracking-[0.4em] font-black italic">Nenhum produto encontrado</p>
            </div>
          ) : (
            filteredProducts.map(p => {
              const productEntries = allEntries?.filter(e => e.productId === p.id) || [];
              const latestByStore = new Map();
              productEntries.forEach(entry => {
                if (!latestByStore.has(entry.storeId)) latestByStore.set(entry.storeId, entry);
              });
              const storePrices = Array.from(latestByStore.values()) as any[];

              return (
                <div 
                  key={p.id}
                  className={cn(
                    "relative overflow-hidden rounded-[2.5rem] border-2 transition-all duration-500 group",
                    selectedProduct?.id === p.id 
                      ? "bg-accent/10 border-accent shadow-2xl shadow-accent/10" 
                      : "bg-white/[0.03] border-white/5 hover:border-white/10 hover:bg-white/[0.05]"
                  )}
                >
                  <div className="p-8 space-y-6">
                    <div className="flex items-start justify-between">
                      <div className="space-y-1">
                        <p className="text-lg font-black tracking-tight leading-tight group-hover:text-accent transition-colors">{p.name}</p>
                        <p className="text-[9px] font-black uppercase tracking-[0.3em] text-indigo-300/40 italic">{p.category}</p>
                      </div>
                      <button 
                        type="button"
                        onClick={() => {
                          setSelectedProduct(p);
                          setQuantity("1");
                        }}
                        className={cn(
                          "h-12 w-12 rounded-2xl flex items-center justify-center transition-all duration-300",
                          selectedProduct?.id === p.id 
                            ? "bg-accent text-accent-foreground shadow-lg shadow-accent/30 rotate-0" 
                            : "bg-white/5 text-muted-foreground hover:text-white rotate-90"
                        )}
                      >
                        {selectedProduct?.id === p.id ? <Check className="h-6 w-6" /> : <Plus className="h-6 w-6" />}
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
                            setQuantity("1");
                          }}
                          className="flex items-center gap-3 px-4 py-2.5 rounded-xl bg-indigo-500/10 border border-indigo-500/20 text-[10px] font-black uppercase tracking-widest hover:bg-accent hover:text-accent-foreground hover:border-accent transition-all group/price"
                        >
                          <Store className="h-3 w-3 opacity-40 group-hover/price:opacity-100" />
                          <span>{sp.storeName}</span>
                          <span className="text-accent group-hover/price:text-accent-foreground">R$ {sp.price.toFixed(2)}</span>
                        </button>
                      ))}
                      {storePrices.length === 0 && (
                        <p className="text-[9px] text-muted-foreground/30 font-bold uppercase tracking-[0.2em] italic py-2">Sem histórico de preços</p>
                      )}
                    </div>
                  </div>
                  
                  {/* Subtle Background Icon */}
                  <div className="absolute -right-8 -bottom-8 p-12 opacity-[0.03] group-hover:opacity-[0.08] transition-all group-hover:scale-110 pointer-events-none">
                    <Database className="h-32 w-32 text-accent" />
                  </div>
                </div>
              );
            })
          )}
        </div>
      </div>

      {/* Confirmation Area - Floating Footer */}
      {selectedProduct && (
        <div className="fixed bottom-32 left-0 right-0 z-50 px-4 sm:px-6 animate-in slide-in-from-bottom-10 duration-500">
          <div className="max-w-4xl mx-auto bg-card/90 backdrop-blur-2xl border-2 border-accent/20 rounded-[2.5rem] sm:rounded-[3rem] p-6 sm:p-8 shadow-[0_30px_60px_rgba(0,0,0,0.5)] flex flex-col items-stretch gap-6 sm:gap-8">
            <div className="flex flex-col md:flex-row items-center gap-6 sm:gap-8">
              <div className="flex-1 space-y-2 w-full">
                <div className="flex items-center gap-3 text-accent mb-1">
                  <Check className="h-4 w-4" />
                  <span className="text-[10px] font-black uppercase tracking-[0.4em]">Confirmar Item</span>
                </div>
                <h4 className="text-xl font-black italic">{selectedProduct.name}</h4>
                <p className="text-[9px] text-muted-foreground uppercase tracking-widest">{selectedProduct.category}</p>
              </div>

              <div className="flex flex-col sm:flex-row items-center gap-4 sm:gap-6 w-full md:w-auto">
                <div className="w-full sm:w-24 space-y-2">
                  <Label className="text-[9px] font-black uppercase tracking-[0.3em] text-muted-foreground ml-1 text-center block sm:text-left">Qtd</Label>
                  <Input
                    type="number"
                    min="1"
                    value={quantity}
                    onChange={(e) => setQuantity(e.target.value)}
                    className="bg-white/5 border-white/10 h-14 sm:h-16 rounded-2xl focus:border-accent/50 text-center text-xl font-black text-white"
                  />
                </div>

                <div className="w-full sm:w-48 space-y-2">
                  <Label className="text-[9px] font-black uppercase tracking-[0.3em] text-muted-foreground ml-1 text-center block sm:text-left">Preço Un.</Label>
                  <div className="relative">
                    <span className="absolute left-4 top-1/2 -translate-y-1/2 font-black text-accent text-lg">R$</span>
                    <Input
                      type="number"
                      step="0.01"
                      placeholder="0,00"
                      value={amount}
                      onChange={(e) => setAmount(e.target.value)}
                      className="bg-white/5 border-white/10 h-14 sm:h-16 rounded-2xl focus:border-accent/50 pl-12 text-xl sm:text-2xl font-black text-accent"
                    />
                  </div>
                </div>
              </div>
            </div>

            <div className="flex gap-4 w-full">
              <Button 
                onClick={() => setSelectedProduct(null)}
                variant="ghost"
                className="flex-1 sm:flex-none h-14 sm:h-16 px-6 rounded-2xl text-muted-foreground hover:text-white font-black uppercase text-[10px] tracking-widest"
              >
                Cancelar
              </Button>
              <Button 
                onClick={handleManualSubmit}
                disabled={!amount}
                className="flex-[2] sm:flex-none h-14 sm:h-16 px-12 bg-accent hover:bg-accent/90 text-accent-foreground font-black text-sm uppercase tracking-[0.3em] shadow-2xl shadow-accent/20 rounded-2xl transition-all active:scale-95"
              >
                Confirmar
                <Zap className="ml-3 h-4 w-4" />
              </Button>
            </div>
          </div>
        </div>
      )}

      {/* Camera UI */}
      {isCameraOpen && (
        <div className="fixed inset-0 z-[100] bg-black/95 flex flex-col items-center justify-center p-6 animate-in fade-in">
          <button onClick={() => setIsCameraOpen(false)} className="absolute top-8 right-8 text-white/50 hover:text-white p-2">
            <X className="h-8 w-8" />
          </button>
          <div className="w-full max-w-2xl aspect-[3/4] bg-indigo-950/20 border-2 border-dashed border-white/20 rounded-[3rem] overflow-hidden relative shadow-2xl">
            <video ref={videoRef} className="w-full h-full object-cover" autoPlay playsInline muted />
            <canvas ref={canvasRef} className="hidden" />
            {isAnalyzing && (
              <div className="absolute inset-0 bg-black/80 backdrop-blur-xl flex flex-col items-center justify-center gap-6">
                <div className="relative">
                  <div className="absolute inset-0 bg-cyan-400/20 blur-2xl rounded-full animate-pulse" />
                  <Loader2 className="h-16 w-16 text-cyan-400 animate-spin relative z-10" />
                </div>
                <p className="text-cyan-400 font-black uppercase tracking-[0.5em] text-sm animate-pulse">Lendo Nota...</p>
              </div>
            )}
          </div>
          {!isAnalyzing && (
            <button onClick={captureAndAnalyze} className="mt-12 w-24 h-24 rounded-full border-[6px] border-white/20 flex items-center justify-center group transition-all hover:border-white">
              <div className="w-16 h-16 rounded-full bg-white group-hover:bg-cyan-400 transition-all scale-90 group-hover:scale-100" />
            </button>
          )}
        </div>
      )}

      {/* Review Dialog */}
      <Dialog open={isReviewOpen} onOpenChange={setIsReviewOpen}>
        <DialogContent className="max-w-2xl bg-[#1a1b2e] border-indigo-500/20 text-white rounded-[3rem] p-0 overflow-hidden shadow-2xl">
          <DialogHeader className="p-10 pb-6 bg-gradient-to-br from-indigo-950/40 to-transparent">
            <DialogTitle className="text-3xl font-black uppercase tracking-tighter text-accent flex items-center gap-4 italic">
              <ShoppingBag className="h-8 w-8 glow-accent" />
              Itens da Nota
            </DialogTitle>
          </DialogHeader>
          <ScrollArea className="max-h-[50vh] px-10 py-6">
            <div className="grid gap-4">
              {reviewItems.map((item, idx) => (
                <div 
                  key={idx} 
                  className={cn(
                    "p-6 rounded-[2rem] border-2 transition-all flex items-center justify-between gap-6",
                    item.matchedProduct 
                      ? "bg-accent/5 border-accent/20" 
                      : "bg-white/[0.02] border-white/5 opacity-50"
                  )}
                >
                  <div className="flex-1 min-w-0 space-y-1">
                    <p className="font-black text-base truncate">{item.name}</p>
                    <div className="flex items-center gap-3">
                      <p className="text-xs font-black text-accent">R$ {item.price.toFixed(2)}</p>
                      {!item.matchedProduct && (
                        <span className="flex items-center gap-1.5 text-[9px] font-black uppercase tracking-widest text-muted-foreground">
                          <AlertCircle className="h-3 w-3" /> não cadastrado
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
                      "h-12 w-12 rounded-2xl transition-all",
                      item.selected ? "bg-accent text-accent-foreground shadow-lg shadow-accent/20" : "bg-white/5 text-muted-foreground"
                    )}
                  >
                    {item.selected ? <Check className="h-5 w-5" /> : <ChevronRight className="h-5 w-5" />}
                  </Button>
                </div>
              ))}
            </div>
          </ScrollArea>
          <DialogFooter className="p-10 pt-6 border-t border-white/5 bg-white/[0.02]">
            <Button variant="ghost" onClick={() => setIsReviewOpen(false)} className="h-16 px-8 font-black uppercase tracking-widest text-xs hover:bg-white/5">Descartar</Button>
            <Button onClick={handleBulkAdd} className="h-16 px-12 bg-accent text-accent-foreground font-black uppercase tracking-[0.2em] text-xs rounded-2xl shadow-2xl shadow-accent/30 active:scale-95 transition-all">
              Confirmar ({reviewItems.filter(i => i.selected).length})
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
}
