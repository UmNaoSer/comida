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
import { Search, Trophy, Store, Plus, Cpu, Zap, ShoppingBag, History, Trash2 } from "lucide-react";
import { useFirestore, useCollection, useMemoFirebase } from "@/firebase";
import { collection, doc, query, where, orderBy } from "firebase/firestore";
import { setDocumentNonBlocking, deleteDocumentNonBlocking } from "@/firebase/non-blocking-updates";

type Tab = 'produtos' | 'estabelecimentos';

const GUEST_USER_ID = "guest-protocol-v1";

const CATEGORIES = [
  "Mercado", "Hortifruti", "Carnes", "Higiene", "Limpeza", "Bebidas", "Eletrônicos", "Outros"
];

export function AdvisorView() {
  const db = useFirestore();
  const [activeTab, setActiveTab] = useState<Tab>('produtos');
  const [search, setSearch] = useState("");
  const [filterCategory, setFilterCategory] = useState("todas");
  
  // Establishment Registration State
  const [newEstName, setNewEstName] = useState("");

  // Product Registration State
  const [newProdName, setNewProdName] = useState("");
  const [newProdCategory, setNewProdCategory] = useState("Mercado");

  // New Price Entry State
  const [selectedStoreId, setSelectedStoreId] = useState("");
  const [newPrice, setNewPrice] = useState("");
  const [addingToProductId, setAddingToProductId] = useState<string | null>(null);

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

  const handleAddEstablishment = (e: React.FormEvent) => {
    e.preventDefault();
    if (!newEstName || !db) return;
    const estId = Math.random().toString(36).substr(2, 9);
    const estRef = doc(db, "users", GUEST_USER_ID, "establishments", estId);
    setDocumentNonBlocking(estRef, {
      id: estId,
      name: newEstName,
      type: "Estabelecimento Logged",
      createdAt: new Date().toISOString(),
    }, { merge: true });
    setNewEstName("");
  };

  const handleAddProduct = (e: React.FormEvent) => {
    e.preventDefault();
    if (!newProdName || !db) return;
    const prodId = Math.random().toString(36).substr(2, 9);
    const prodRef = doc(db, "users", GUEST_USER_ID, "products", prodId);
    setDocumentNonBlocking(prodRef, {
      id: prodId,
      name: newProdName,
      category: newProdCategory,
    }, { merge: true });
    setNewProdName("");
  };

  const handleAddPriceEntry = (productId: string) => {
    if (!selectedStoreId || !newPrice || !db) return;
    const store = establishments?.find(e => e.id === selectedStoreId);
    if (!store) return;

    const entryId = Math.random().toString(36).substr(2, 9);
    const entryRef = doc(db, "users", GUEST_USER_ID, "price_entries", entryId);
    setDocumentNonBlocking(entryRef, {
      id: entryId,
      productId,
      storeId: store.id,
      storeName: store.name,
      price: parseFloat(newPrice),
      date: new Date().toISOString(),
    }, { merge: true });

    setNewPrice("");
    setSelectedStoreId("");
    setAddingToProductId(null);
  };

  const handleDeleteProduct = (productId: string) => {
    if (!db) return;
    deleteDocumentNonBlocking(doc(db, "users", GUEST_USER_ID, "products", productId));
    // Also cleanup entries? In a real app yes. Here we'll just delete the prod.
  };

  const filteredProducts = products?.filter(p => {
    const matchesSearch = p.name.toLowerCase().includes(search.toLowerCase());
    const matchesCategory = filterCategory === "todas" || p.category === filterCategory;
    return matchesSearch && matchesCategory;
  });

  return (
    <div className="space-y-8 animate-in fade-in duration-500 pb-20">
      {/* Tabs Selector */}
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
          Estabelecimentos
        </button>
      </div>

      {activeTab === 'produtos' ? (
        <div className="space-y-8">
          {/* Add Product Form */}
          <Card className="nebula-card border-accent/20 rounded-[2rem] p-6 relative overflow-hidden">
             <div className="absolute -right-10 -top-10 opacity-[0.03]">
                <ShoppingBag className="h-40 w-40 text-accent" />
             </div>
            <h3 className="text-lg font-black uppercase tracking-widest text-accent mb-6 flex items-center gap-2">
              <Plus className="h-5 w-5 glow-accent" />
              New Neural Product
            </h3>
            <form onSubmit={handleAddProduct} className="grid grid-cols-1 sm:grid-cols-3 gap-4">
              <Input
                placeholder="Product Name..."
                value={newProdName}
                onChange={(e) => setNewProdName(e.target.value)}
                className="bg-white/5 border-white/5 h-14 rounded-xl focus:border-accent/40 transition-all text-sm font-medium"
              />
              <Select value={newProdCategory} onValueChange={setNewProdCategory}>
                <SelectTrigger className="h-14 bg-white/5 border-white/5 rounded-xl text-xs font-bold uppercase tracking-widest">
                  <SelectValue />
                </SelectTrigger>
                <SelectContent className="bg-slate-950 border-white/10">
                  {CATEGORIES.map(cat => (
                    <SelectItem key={cat} value={cat}>{cat}</SelectItem>
                  ))}
                </SelectContent>
              </Select>
              <Button type="submit" className="h-14 bg-accent text-accent-foreground font-black uppercase tracking-[0.2em] rounded-xl shadow-lg shadow-accent/10 group transition-all">
                Commit Product
                <Zap className="ml-2 h-4 w-4 transition-transform group-hover:scale-125" />
              </Button>
            </form>
          </Card>

          {/* Filters */}
          <div className="flex flex-col sm:flex-row gap-4">
            <div className="relative flex-1">
              <Search className="absolute left-4 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
              <Input
                placeholder="Scan neural patterns..."
                value={search}
                onChange={(e) => setSearch(e.target.value)}
                className="bg-indigo-950/20 border-white/10 h-12 pl-12 rounded-xl focus:border-accent/40 transition-all"
              />
            </div>
            <Select value={filterCategory} onValueChange={setFilterCategory}>
              <SelectTrigger className="w-full sm:w-64 bg-indigo-950/20 border-white/10 h-12 rounded-xl text-xs font-bold uppercase tracking-widest">
                <SelectValue placeholder="Todas Categorias" />
              </SelectTrigger>
              <SelectContent className="bg-slate-950 border-white/10">
                <SelectItem value="todas">Todas Categorias</SelectItem>
                {CATEGORIES.map(cat => (
                  <SelectItem key={cat} value={cat}>{cat}</SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>

          {/* Product Cards Grid */}
          <div className="grid grid-cols-1 gap-6">
            {!filteredProducts || filteredProducts.length === 0 ? (
              <div className="py-20 text-center border-2 border-dashed border-white/5 rounded-[2rem]">
                <p className="text-[10px] text-muted-foreground uppercase tracking-[0.3em] font-black italic">No product signals found.</p>
              </div>
            ) : (
              filteredProducts.map((product) => {
                const productEntries = allEntries?.filter(e => e.productId === product.id) || [];
                const currentBest = productEntries.length > 0 ? Math.min(...productEntries.map(e => e.price)) : 0;
                const minHistory = productEntries.length > 0 ? Math.min(...productEntries.map(e => e.price)) : 0;
                const variation = productEntries.length > 1 ? (Math.max(...productEntries.map(e => e.price)) - currentBest) : 0;
                const bestEntryToday = productEntries.length > 0 ? productEntries.reduce((prev, curr) => prev.price < curr.price ? prev : curr) : null;

                return (
                  <Card key={product.id} className="bg-indigo-950/10 border-white/5 rounded-[2rem] overflow-hidden group hover:border-accent/20 transition-all">
                    <CardContent className="p-8 space-y-8">
                      {/* Top Header */}
                      <div className="flex justify-between items-start">
                        <div className="space-y-1">
                          <span className="text-[9px] font-black tracking-[0.2em] bg-accent/10 text-accent px-4 py-1.5 rounded-full uppercase">
                            {product.category}
                          </span>
                          <h3 className="text-3xl font-bold tracking-tight mt-3">{product.name}</h3>
                        </div>
                        <div className="flex gap-4 items-start">
                           <div className="text-right">
                              <p className="text-[9px] font-black tracking-[0.2em] text-muted-foreground uppercase">MAGNITUDE ATUAL</p>
                              <p className="text-3xl font-black text-cyan-400">R$ {currentBest.toFixed(2)}</p>
                            </div>
                            <Button 
                              variant="ghost" 
                              size="icon" 
                              onClick={() => handleDeleteProduct(product.id)}
                              className="text-muted-foreground hover:text-expense hover:bg-expense/10"
                            >
                              <Trash2 className="h-5 w-5" />
                            </Button>
                        </div>
                      </div>

                      {/* Stats Row */}
                      <div className="grid grid-cols-2 gap-8 border-t border-white/5 pt-8">
                        <div className="space-y-2">
                          <p className="text-[9px] font-black tracking-[0.2em] text-indigo-400/60 uppercase">Menor Histórico (Global)</p>
                          <p className="text-lg font-bold">R$ {minHistory.toFixed(2)}</p>
                        </div>
                        <div className="space-y-2 border-l border-white/5 pl-8">
                          <p className="text-[9px] font-black tracking-[0.2em] text-indigo-400/60 uppercase">Variação de Vetor</p>
                          <p className="text-lg font-bold">R$ {variation.toFixed(2)}</p>
                        </div>
                      </div>

                      {/* Best Offer Highlight */}
                      {bestEntryToday && (
                        <div className="bg-cyan-500/10 border border-cyan-500/20 rounded-2xl p-5 flex justify-between items-center group/highlight hover:bg-cyan-500/20 transition-all shadow-[0_0_20px_rgba(34,211,238,0.05)]">
                          <div className="flex items-center gap-4">
                            <div className="p-3 bg-cyan-500/20 rounded-xl">
                              <Trophy className="h-6 w-6 text-cyan-400" />
                            </div>
                            <div>
                              <p className="text-[10px] font-black text-cyan-400 uppercase tracking-[0.2em]">Otimização de Compra</p>
                              <p className="font-bold text-lg">{bestEntryToday.storeName}</p>
                            </div>
                          </div>
                          <p className="text-2xl font-black text-cyan-400">R$ {bestEntryToday.price.toFixed(2)}</p>
                        </div>
                      )}

                      {/* Action: Log Price */}
                      <div className="pt-2">
                        {addingToProductId === product.id ? (
                           <div className="bg-white/5 p-6 rounded-2xl space-y-4 animate-in slide-in-from-top-2">
                              <p className="text-[10px] font-black uppercase tracking-widest text-accent">Log New Observation</p>
                              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                                <Select value={selectedStoreId} onValueChange={setSelectedStoreId}>
                                  <SelectTrigger className="bg-slate-900 border-white/10 h-12 rounded-xl text-xs font-bold uppercase tracking-widest">
                                    <SelectValue placeholder="Select Establishment" />
                                  </SelectTrigger>
                                  <SelectContent className="bg-slate-950 border-white/10">
                                    {establishments?.map(est => (
                                      <SelectItem key={est.id} value={est.id}>{est.name}</SelectItem>
                                    ))}
                                    {(!establishments || establishments.length === 0) && (
                                      <SelectItem value="none" disabled>No establishments registered</SelectItem>
                                    )}
                                  </SelectContent>
                                </Select>
                                <Input
                                  type="number"
                                  step="0.01"
                                  placeholder="Price Magnitude..."
                                  value={newPrice}
                                  onChange={(e) => setNewPrice(e.target.value)}
                                  className="bg-slate-900 border-white/10 h-12 rounded-xl text-sm"
                                />
                              </div>
                              <div className="flex gap-2">
                                <Button 
                                  onClick={() => handleAddPriceEntry(product.id)}
                                  className="flex-1 bg-accent text-accent-foreground font-black uppercase tracking-widest text-[10px]"
                                >
                                  Commit Entry
                                </Button>
                                <Button 
                                  variant="ghost"
                                  onClick={() => setAddingToProductId(null)}
                                  className="text-muted-foreground text-[10px] uppercase font-black"
                                >
                                  Abort
                                </Button>
                              </div>
                           </div>
                        ) : (
                          <Button 
                            variant="outline" 
                            onClick={() => setAddingToProductId(product.id)}
                            className="w-full h-12 border-accent/20 hover:bg-accent/10 text-accent font-black uppercase tracking-[0.3em] text-[10px] rounded-xl"
                          >
                            Add New Price Signal
                          </Button>
                        )}
                      </div>

                      {/* History Feed */}
                      <div className="space-y-4 pt-4 border-t border-white/5">
                        <div className="flex items-center gap-2 mb-2">
                          <History className="h-4 w-4 text-indigo-400" />
                          <p className="text-[10px] font-black text-indigo-400 uppercase tracking-widest">Neural History Feed</p>
                        </div>
                        {productEntries.length === 0 ? (
                           <p className="text-[10px] text-muted-foreground italic uppercase tracking-widest text-center py-4">No historical signals captured yet.</p>
                        ) : (
                          productEntries.map((entry) => (
                            <div key={entry.id} className="flex items-center justify-between text-xs py-3 group/entry border-b border-white/[0.03] last:border-0">
                              <div className="flex items-center gap-10">
                                <span className="font-bold text-indigo-200 w-24 truncate">{entry.storeName}</span>
                                <span className="text-muted-foreground font-mono text-[10px]">{new Date(entry.date).toLocaleDateString()}</span>
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
          {/* Add Establishment Form */}
          <Card className="nebula-card border-accent/20 rounded-[2.5rem] p-8 relative overflow-hidden">
             <div className="absolute -right-10 -top-10 opacity-[0.03]">
                <Store className="h-40 w-40 text-accent" />
             </div>
            <h3 className="text-xl font-black uppercase tracking-[0.2em] text-accent mb-8 flex items-center gap-3">
              <Cpu className="h-6 w-6 glow-accent" />
              Register New Node
            </h3>
            <form onSubmit={handleAddEstablishment} className="flex flex-col sm:flex-row gap-4 relative z-10">
              <Input
                placeholder="Ex: Mainframe Store, Neo-Market..."
                value={newEstName}
                onChange={(e) => setNewEstName(e.target.value)}
                className="bg-white/5 border-white/5 h-16 rounded-2xl focus:border-accent/40 transition-all text-sm font-medium flex-1 px-6"
              />
              <Button type="submit" className="h-16 px-10 bg-accent text-accent-foreground font-black uppercase tracking-[0.3em] rounded-2xl shadow-xl shadow-accent/10 group transition-all">
                Add Node
                <Plus className="ml-3 h-5 w-5 transition-transform group-hover:rotate-90" />
              </Button>
            </form>
          </Card>

          {/* Establishments Grid */}
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
            {(!establishments || establishments.length === 0) ? (
              <div className="md:col-span-2 lg:col-span-3 py-24 text-center border-2 border-dashed border-white/5 rounded-[3rem]">
                <p className="text-[11px] text-muted-foreground uppercase tracking-[0.4em] font-black italic">No neural nodes detected in sector.</p>
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
                      <p className="text-[9px] text-muted-foreground uppercase tracking-[0.2em] mt-1">{est.type || "Estabelecimento"}</p>
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