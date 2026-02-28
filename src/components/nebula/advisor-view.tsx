import React, { useState } from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { 
  Select, 
  SelectContent, 
  SelectItem, 
  SelectTrigger, 
  SelectValue 
} from "@/components/ui/select";
import { Button } from "@/components/ui/button";
import { cn } from "@/lib/utils";
import { Search, Trophy, Store, LayoutPanelLeft, Zap, ShoppingBag, History, Trash2, Plus, Calendar as CalendarIcon } from "lucide-react";
import { useFirestore, useCollection, useMemoFirebase } from "@/firebase";
import { collection, doc, query, orderBy } from "firebase/firestore";
import { setDocumentNonBlocking, deleteDocumentNonBlocking } from "@/firebase/non-blocking-updates";
import { Popover, PopoverContent, PopoverTrigger } from "@/components/ui/popover";
import { Calendar } from "@/components/ui/calendar";
import { format } from "date-fns";
import { ptBR } from "date-fns/locale";

type Tab = 'produtos' | 'estabelecimentos';

const GUEST_USER_ID = "guest-protocol-v1";

const CATEGORIES = [
  { name: "Mercado", emoji: "🛒" },
  { name: "Hortifruti", emoji: "🍎" },
  { name: "Carnes", emoji: "🥩" },
  { name: "Higiene", emoji: "🧼" },
  { name: "Limpeza", emoji: "🧹" },
  { name: "Bebidas", emoji: "🥤" },
  { name: "Eletrônicos", emoji: "💻" },
  { name: "Outros", emoji: "📦" }
];

export function AdvisorView() {
  const db = useFirestore();
  const [activeTab, setActiveTab] = useState<Tab>('produtos');
  const [search, setSearch] = useState("");
  const [filterCategory, setFilterCategory] = useState("todas");
  
  // States for the "Add Product" form
  const [formEstId, setFormEstId] = useState("");
  const [formProdName, setFormProdName] = useState("");
  const [formPrice, setFormPrice] = useState("");
  const [formCategory, setFormCategory] = useState("Outros");
  const [formDate, setFormDate] = useState<Date | undefined>(new Date());

  // Establishment Registration State
  const [newEstName, setNewEstName] = useState("");

  // Firestore Data
  const estQuery = useMemoFirebase(() => {
    if (!db) return null;
    return query(collection(db, "users", GUEST_USER_ID, "establishments"), orderBy("name"));
  }, [db]);
  const { data: establishments } = useCollection(estQuery);

  const prodQuery = useMemoFirebase(() => {
    if (!db) return null;
    return query(collection(db, "users", GUEST_USER_ID, "products"), orderBy("name"));
  }, [db]);
  const { data: products } = useCollection(prodQuery);

  const entriesQuery = useMemoFirebase(() => {
    if (!db) return null;
    return query(collection(db, "users", GUEST_USER_ID, "price_entries"), orderBy("date", "desc"));
  }, [db]);
  const { data: allEntries } = useCollection(entriesQuery);

  const handleSaveProduct = (e: React.FormEvent) => {
    e.preventDefault();
    if (!formProdName || !formPrice || !formEstId || !db) return;

    const store = establishments?.find(e => e.id === formEstId);
    if (!store) return;

    const normalizedName = formProdName.trim().toLowerCase();
    const existingProduct = products?.find(p => p.name.toLowerCase() === normalizedName);
    
    let prodId: string;
    if (existingProduct) {
      prodId = existingProduct.id;
    } else {
      prodId = Math.random().toString(36).substr(2, 9);
      const prodRef = doc(db, "users", GUEST_USER_ID, "products", prodId);
      setDocumentNonBlocking(prodRef, {
        id: prodId,
        name: formProdName.trim(),
        category: formCategory,
      }, { merge: true });
    }

    const entryId = Math.random().toString(36).substr(2, 9);
    const entryRef = doc(db, "users", GUEST_USER_ID, "price_entries", entryId);
    setDocumentNonBlocking(entryRef, {
      id: entryId,
      productId: prodId,
      storeId: store.id,
      storeName: store.name,
      price: parseFloat(formPrice),
      date: formDate?.toISOString() || new Date().toISOString(),
    }, { merge: true });

    setFormProdName("");
    setFormPrice("");
    setFormEstId("");
    setFormCategory("Outros");
    setFormDate(new Date());
  };

  const handleAddEstablishment = (e: React.FormEvent) => {
    e.preventDefault();
    if (!newEstName || !db) return;
    const estId = Math.random().toString(36).substr(2, 9);
    const estRef = doc(db, "users", GUEST_USER_ID, "establishments", estId);
    setDocumentNonBlocking(estRef, {
      id: estId,
      name: newEstName,
      type: "Estabelecimento",
      createdAt: new Date().toISOString(),
    }, { merge: true });
    setNewEstName("");
  };

  const handleDeleteProductGroup = (productName: string) => {
    if (!db || !products || !allEntries) return;
    
    const relatedProducts = products.filter(p => p.name.toLowerCase() === productName.toLowerCase());
    const relatedIds = relatedProducts.map(p => p.id);

    relatedIds.forEach(id => {
      deleteDocumentNonBlocking(doc(db, "users", GUEST_USER_ID, "products", id));
    });

    const relatedEntries = allEntries.filter(e => relatedIds.includes(e.productId));
    relatedEntries.forEach(entry => {
      deleteDocumentNonBlocking(doc(db, "users", GUEST_USER_ID, "price_entries", entry.id));
    });
  };

  const groupedProducts: any[] = [];
  const processedNames = new Set<string>();

  const filteredRawProducts = products?.filter(p => {
    const matchesSearch = p.name.toLowerCase().includes(search.toLowerCase());
    const matchesCategory = filterCategory === "todas" || p.category === filterCategory;
    return matchesSearch && matchesCategory;
  }) || [];

  filteredRawProducts.forEach(p => {
    const lowerName = p.name.toLowerCase();
    if (!processedNames.has(lowerName)) {
      processedNames.add(lowerName);
      const relatedIds = products?.filter(prod => prod.name.toLowerCase() === lowerName).map(prod => prod.id) || [];
      groupedProducts.push({
        ...p,
        relatedIds
      });
    }
  });

  return (
    <div className="space-y-8 animate-in fade-in duration-500 pb-20">
      <div className="flex gap-2 p-1 bg-indigo-950/20 border border-white/5 rounded-xl w-fit">
        <button
          onClick={() => setActiveTab('produtos')}
          className={cn(
            "px-8 py-2.5 rounded-lg text-xs font-black uppercase tracking-[0.2em] transition-all",
            activeTab === 'produtos' 
              ? "bg-accent text-accent-foreground shadow-[0_0_20px_rgba(255,230,120,0.3)]" 
              : "text-muted-foreground hover:text-foreground"
          )}
        >
          Produtos
        </button>
        <button
          onClick={() => setActiveTab('estabelecimentos')}
          className={cn(
            "px-8 py-2.5 rounded-lg text-xs font-black uppercase tracking-[0.2em] transition-all",
            activeTab === 'estabelecimentos' 
              ? "bg-accent text-accent-foreground shadow-[0_0_20px_rgba(255,230,120,0.3)]" 
              : "text-muted-foreground hover:text-foreground"
          )}
        >
          Lojas
        </button>
      </div>

      {activeTab === 'produtos' ? (
        <div className="space-y-8">
          <Card className="bg-[#1a1b2e] border-indigo-500/10 rounded-[2.5rem] p-6 max-w-4xl mx-auto shadow-2xl relative overflow-hidden">
            <div className="absolute top-0 right-0 p-8 opacity-[0.02]">
              <LayoutPanelLeft className="h-32 w-32 text-accent" />
            </div>
            
            <div className="flex items-center justify-between mb-8">
              <h3 className="text-xl font-headline font-black text-accent italic uppercase tracking-tighter flex items-center gap-3">
                <Plus className="h-5 w-5 glow-accent" />
                Adicionar Produto
              </h3>
            </div>
            
            <form onSubmit={handleSaveProduct} className="space-y-6">
              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
                <div className="space-y-1.5">
                  <label className="text-[9px] font-black uppercase tracking-[0.2em] text-muted-foreground ml-1">Estabelecimento</label>
                  <Select value={formEstId} onValueChange={setFormEstId}>
                    <SelectTrigger className="bg-[#121321] border-indigo-500/20 h-12 rounded-xl text-indigo-100 focus:ring-accent/50 transition-all">
                      <SelectValue placeholder="Selecione a Loja" />
                    </SelectTrigger>
                    <SelectContent className="bg-[#121321] border-indigo-500/20 text-indigo-100">
                      {establishments?.map(est => (
                        <SelectItem key={est.id} value={est.id}>{est.name}</SelectItem>
                      ))}
                      {(!establishments || establishments.length === 0) && (
                        <SelectItem value="none" disabled>Nenhuma loja cadastrada</SelectItem>
                      )}
                    </SelectContent>
                  </Select>
                </div>

                <div className="space-y-1.5">
                  <label className="text-[9px] font-black uppercase tracking-[0.2em] text-muted-foreground ml-1">Produto</label>
                  <Input
                    placeholder="Ex: Arroz 5kg"
                    value={formProdName}
                    onChange={(e) => setFormProdName(e.target.value)}
                    className="bg-[#121321] border-indigo-500/20 h-12 rounded-xl text-indigo-100 placeholder:text-indigo-100/20 focus:border-accent/40 transition-all"
                  />
                </div>

                <div className="space-y-1.5">
                  <label className="text-[9px] font-black uppercase tracking-[0.2em] text-muted-foreground ml-1">Preço (R$)</label>
                  <Input
                    type="number"
                    step="0.01"
                    placeholder="0,00"
                    value={formPrice}
                    onChange={(e) => setFormPrice(e.target.value)}
                    className="bg-[#121321] border-indigo-500/20 h-12 rounded-xl text-indigo-100 focus:border-accent/40 transition-all"
                  />
                </div>

                <div className="space-y-1.5">
                  <label className="text-[9px] font-black uppercase tracking-[0.2em] text-muted-foreground ml-1">Categoria</label>
                  <Select value={formCategory} onValueChange={setFormCategory}>
                    <SelectTrigger className="bg-[#121321] border-indigo-500/20 h-12 rounded-xl text-indigo-100 focus:ring-accent/50 transition-all">
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent className="bg-[#121321] border-indigo-500/20 text-indigo-100">
                      {CATEGORIES.map(cat => (
                        <SelectItem key={cat.name} value={cat.name}>
                          <span className="mr-2">{cat.emoji}</span>
                          {cat.name}
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </div>
              </div>

              <div className="flex items-center justify-between pt-2">
                <div className="w-full max-w-[240px] space-y-1.5">
                  <label className="text-[9px] font-black uppercase tracking-[0.2em] text-muted-foreground ml-1">Data da Coleta</label>
                  <Popover>
                    <PopoverTrigger asChild>
                      <div className="relative cursor-pointer group">
                        <Input
                          readOnly
                          value={formDate ? format(formDate, "dd.MM.yyyy") : "dd.mm.yyyy"}
                          placeholder="dd.mm.yyyy"
                          className="bg-[#121321] border-indigo-500/20 h-12 rounded-xl text-indigo-100 pr-10 cursor-pointer focus:border-accent/40 transition-all"
                        />
                        <div className="absolute right-3 top-1/2 -translate-y-1/2 text-indigo-400/50 group-hover:text-accent transition-colors">
                          <CalendarIcon className="h-5 w-5" />
                        </div>
                      </div>
                    </PopoverTrigger>
                    <PopoverContent className="w-auto p-0 bg-[#121321] border-indigo-500/20" align="start">
                      <Calendar
                        mode="single"
                        selected={formDate}
                        onSelect={setFormDate}
                        locale={ptBR}
                        initialFocus
                      />
                    </PopoverContent>
                  </Popover>
                </div>

                <div className="flex gap-4">
                  <Button 
                    type="button" 
                    variant="ghost" 
                    onClick={() => {
                      setFormProdName("");
                      setFormPrice("");
                      setFormEstId("");
                      setFormDate(new Date());
                    }}
                    className="h-12 px-8 rounded-xl bg-white/5 hover:bg-white/10 text-muted-foreground text-xs font-black uppercase tracking-widest transition-all"
                  >
                    Resetar
                  </Button>
                  <Button 
                    type="submit" 
                    className="h-12 px-12 rounded-xl bg-accent hover:bg-accent/90 text-accent-foreground font-headline font-black uppercase tracking-widest text-xs shadow-lg shadow-accent/20 transition-all active:scale-95"
                  >
                    Salvar Produto
                  </Button>
                </div>
              </div>
            </form>
          </Card>

          <div className="flex flex-col sm:flex-row gap-4">
            <div className="relative flex-1 group">
              <Search className="absolute left-4 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground group-focus-within:text-accent transition-colors" />
              <Input
                placeholder="Pesquisar produtos..."
                value={search}
                onChange={(e) => setSearch(e.target.value)}
                className="bg-indigo-950/20 border-white/10 h-12 pl-12 rounded-xl focus:border-accent/40 transition-all"
              />
            </div>
            <Select value={filterCategory} onValueChange={setFilterCategory}>
              <SelectTrigger className="w-full sm:w-64 bg-indigo-950/20 border-white/10 h-12 rounded-xl text-xs font-black uppercase tracking-widest">
                <SelectValue placeholder="Todas Categorias" />
              </SelectTrigger>
              <SelectContent className="bg-slate-950 border-white/10 text-indigo-100">
                <SelectItem value="todas">Todas Categorias</SelectItem>
                {CATEGORIES.map(cat => (
                  <SelectItem key={cat.name} value={cat.name}>{cat.name}</SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>

          <div className="grid grid-cols-1 gap-6">
            {groupedProducts.length === 0 ? (
              <div className="py-20 text-center border-2 border-dashed border-white/5 rounded-[2rem]">
                <p className="text-[10px] text-muted-foreground uppercase tracking-[0.3em] font-black italic">Nenhum produto encontrado.</p>
              </div>
            ) : (
              groupedProducts.map((product) => {
                const productEntries = allEntries?.filter(e => product.relatedIds.includes(e.productId)) || [];
                
                // Find absolute minimum for historical reference
                const allPrices = productEntries.map(e => e.price);
                const minHistory = allPrices.length > 0 ? Math.min(...allPrices) : 0;
                
                // Logic for "Best Store" based on latest price PER store
                let bestEntryOverall = null;
                let currentBest = 0;
                
                if (productEntries.length > 0) {
                  // Get the latest entry for each individual store
                  const latestByStore = new Map();
                  // allEntries is ordered by date DESC, so the first time we see a storeId, it's the latest
                  productEntries.forEach(entry => {
                    if (!latestByStore.has(entry.storeId)) {
                      latestByStore.set(entry.storeId, entry);
                    }
                  });
                  
                  // From these latest entries across all stores, pick the cheapest one
                  const candidates = Array.from(latestByStore.values());
                  bestEntryOverall = candidates.reduce((min, curr) => curr.price < min.price ? curr : min, candidates[0]);
                  currentBest = bestEntryOverall.price;
                }

                const variation = allPrices.length > 1 ? (Math.max(...allPrices) - currentBest) : 0;
                const categoryData = CATEGORIES.find(c => c.name === product.category);

                return (
                  <Card key={product.name} className="bg-indigo-950/10 border-white/5 rounded-[2rem] overflow-hidden group hover:border-accent/20 transition-all">
                    <CardContent className="p-8 space-y-8">
                      <div className="flex justify-between items-start">
                        <div className="space-y-1">
                          <span className="text-[9px] font-black tracking-[0.2em] bg-accent/10 text-accent px-4 py-1.5 rounded-full uppercase">
                            {categoryData?.emoji} {product.category}
                          </span>
                          <h3 className="text-3xl font-bold tracking-tight mt-3">{product.name}</h3>
                        </div>
                        <div className="flex gap-4 items-start">
                           <div className="text-right">
                              <p className="text-[9px] font-black tracking-[0.2em] text-muted-foreground uppercase">Menor Preço Atual</p>
                              <p className="text-3xl font-black text-cyan-400">R$ {currentBest.toFixed(2)}</p>
                            </div>
                            <button 
                              onClick={() => handleDeleteProductGroup(product.name)}
                              className="text-muted-foreground hover:text-expense transition-colors mt-2"
                            >
                              <Trash2 className="h-5 w-5" />
                            </button>
                        </div>
                      </div>

                      <div className="grid grid-cols-2 gap-8 border-t border-white/5 pt-8">
                        <div className="space-y-2">
                          <p className="text-[9px] font-black tracking-[0.2em] text-indigo-400/60 uppercase">Menor Histórico</p>
                          <p className="text-lg font-bold">R$ {minHistory.toFixed(2)}</p>
                        </div>
                        <div className="space-y-2 border-l border-white/5 pl-8">
                          <p className="text-[9px] font-black tracking-[0.2em] text-indigo-400/60 uppercase">Variação de Preço</p>
                          <p className="text-lg font-bold">R$ {variation.toFixed(2)}</p>
                        </div>
                      </div>

                      {bestEntryOverall && (
                        <div className="bg-cyan-500/10 border border-cyan-500/20 rounded-2xl p-5 flex justify-between items-center group/highlight hover:bg-cyan-500/20 transition-all shadow-[0_0_20px_rgba(34,211,238,0.05)]">
                          <div className="flex items-center gap-4">
                            <div className="p-3 bg-cyan-500/20 rounded-xl">
                              <Trophy className="h-6 w-6 text-cyan-400" />
                            </div>
                            <div>
                              <p className="text-[10px] font-black text-cyan-400 uppercase tracking-[0.2em]">Melhor Loja para Compra</p>
                              <p className="font-bold text-lg">{bestEntryOverall.storeName}</p>
                            </div>
                          </div>
                          <p className="text-2xl font-black text-cyan-400">R$ {bestEntryOverall.price.toFixed(2)}</p>
                        </div>
                      )}

                      <div className="space-y-4 pt-4 border-t border-white/5">
                        <div className="flex items-center gap-2 mb-2">
                          <History className="h-4 w-4 text-indigo-400" />
                          <p className="text-[10px] font-black text-indigo-400 uppercase tracking-widest">Histórico de Coletas</p>
                        </div>
                        {productEntries.length === 0 ? (
                           <p className="text-[10px] text-muted-foreground italic uppercase tracking-widest text-center py-4">Nenhuma coleta encontrada.</p>
                        ) : (
                          productEntries.map((entry) => (
                            <div key={entry.id} className="flex items-center justify-between text-xs py-3 group/entry border-b border-white/[0.03] last:border-0">
                              <div className="flex items-center gap-10">
                                <span className="font-bold text-indigo-200 w-24 truncate">{entry.storeName}</span>
                                <span className="text-muted-foreground font-mono text-[10px]">{new Date(entry.date).toLocaleDateString('pt-BR')}</span>
                              </div>
                              <div className="flex items-center gap-8">
                                <div className="text-right">
                                  <p className="font-bold text-income">R$ {entry.price.toFixed(2)}</p>
                                </div>
                              </div>
                            </div>
                          ))
                        )}
                      </div>
                    </CardContent>
                  </Card>
                );
              })
            )}
          </div>
        </div>
      ) : (
        <div className="space-y-8 animate-in slide-in-from-bottom-4 duration-500">
          <Card className="nebula-card border-accent/20 rounded-[2.5rem] p-8 relative overflow-hidden">
             <div className="absolute -right-10 -top-10 opacity-[0.03]">
                <Store className="h-40 w-40 text-accent" />
             </div>
            <h3 className="text-xl font-black uppercase tracking-[0.2em] text-accent mb-8 flex items-center gap-3">
              <Plus className="h-6 w-6 glow-accent" />
              Cadastrar Loja
            </h3>
            <form onSubmit={handleAddEstablishment} className="flex flex-col sm:flex-row gap-4 relative z-10">
              <Input
                placeholder="Ex: Mercado Central..."
                value={newEstName}
                onChange={(e) => setNewEstName(e.target.value)}
                className="bg-white/5 border-white/5 h-16 rounded-2xl focus:border-accent/40 transition-all text-sm font-medium flex-1 px-6"
              />
              <Button type="submit" className="h-16 px-10 bg-accent text-accent-foreground font-black uppercase tracking-[0.3em] rounded-2xl shadow-xl shadow-accent/10 group transition-all">
                Adicionar
                <Plus className="ml-3 h-5 w-5 transition-transform group-hover:rotate-90" />
              </Button>
            </form>
          </Card>

          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
            {(!establishments || establishments.length === 0) ? (
              <div className="md:col-span-2 lg:col-span-3 py-24 text-center border-2 border-dashed border-white/5 rounded-[3rem]">
                <p className="text-[11px] text-muted-foreground uppercase tracking-[0.4em] font-black italic">Nenhuma loja cadastrada.</p>
              </div>
            ) : (
              establishments.map((est) => (
                <Card key={est.id} className="bg-indigo-950/10 border-white/5 rounded-[2rem] p-6 flex items-center justify-between group hover:border-accent/30 transition-all relative overflow-hidden">
                  <div className="flex items-center gap-5 relative z-10">
                    <div className="p-4 bg-accent/10 rounded-2xl group-hover:bg-accent/20 transition-colors">
                      <Store className="h-7 w-7 text-accent" />
                    </div>
                    <div>
                      <h4 className="font-bold text-lg tracking-tight">{est.name}</h4>
                      <p className="text-[9px] text-muted-foreground uppercase tracking-[0.2em] mt-1">{est.type || "Loja"}</p>
                    </div>
                  </div>
                  <Zap className="h-5 w-5 text-accent/10 group-hover:text-accent transition-all relative z-10" />
                  <div className="absolute inset-0 bg-gradient-to-br from-accent/0 to-accent/[0.02] opacity-0 group-hover:opacity-100 transition-opacity" />
                </Card>
              ))
            )}
          </div>
        </div>
      )}
    </div>
  );
}
