import React, { useState } from "react";
import { Card, CardContent } from "@/components/ui/card";
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
import { Search, Trophy, Store, Plus, Cpu, Zap } from "lucide-react";
import { useFirestore, useCollection, useMemoFirebase } from "@/firebase";
import { collection, doc } from "firebase/firestore";
import { setDocumentNonBlocking } from "@/firebase/non-blocking-updates";

type Tab = 'comparador' | 'estabelecimentos';

const GUEST_USER_ID = "guest-protocol-v1";

interface ProductPrice {
  store: string;
  date: string;
  price: number;
  isMinHist?: boolean;
}

interface Product {
  id: string;
  name: string;
  category: string;
  currentBestPrice: number;
  minHistoryGlobal: number;
  totalVariation: number;
  bestOfferToday: {
    store: string;
    price: number;
  };
  history: ProductPrice[];
}

const MOCK_PRODUCTS: Product[] = [
  {
    id: "1",
    name: "Leite",
    category: "BEBIDAS",
    currentBestPrice: 5.00,
    minHistoryGlobal: 5.00,
    totalVariation: 0.00,
    bestOfferToday: {
      store: "Pezzi",
      price: 5.00
    },
    history: [
      { store: "Pezzi", date: "27/02", price: 5.00, isMinHist: true }
    ]
  }
];

export function AdvisorView() {
  const db = useFirestore();
  const [activeTab, setActiveTab] = useState<Tab>('comparador');
  const [search, setSearch] = useState("");
  const [category, setCategory] = useState("todas");
  const [newEstName, setNewEstName] = useState("");

  const estQuery = useMemoFirebase(() => {
    if (!db) return null;
    return collection(db, "users", GUEST_USER_ID, "establishments");
  }, [db]);

  const { data: establishments, isLoading: isEstLoading } = useCollection(estQuery);

  const handleAddEstablishment = (e: React.FormEvent) => {
    e.preventDefault();
    if (!newEstName || !db) return;

    const estId = Math.random().toString(36).substr(2, 9);
    const estRef = doc(db, "users", GUEST_USER_ID, "establishments", estId);
    
    const newEst = {
      id: estId,
      name: newEstName,
      type: "Estabelecimento Logged",
      createdAt: new Date().toISOString(),
    };

    setDocumentNonBlocking(estRef, newEst, { merge: true });
    setNewEstName("");
  };

  return (
    <div className="space-y-6 animate-in fade-in duration-500">
      {/* Tabs Selector */}
      <div className="flex gap-2 p-1 bg-indigo-950/20 border border-white/5 rounded-xl w-fit">
        <button
          onClick={() => setActiveTab('comparador')}
          className={cn(
            "px-6 py-2 rounded-lg text-xs font-bold uppercase tracking-widest transition-all",
            activeTab === 'comparador' 
              ? "bg-accent text-accent-foreground shadow-[0_0_15px_rgba(255,230,120,0.3)]" 
              : "text-muted-foreground hover:text-foreground"
          )}
        >
          Comparador
        </button>
        <button
          onClick={() => setActiveTab('estabelecimentos')}
          className={cn(
            "px-6 py-2 rounded-lg text-xs font-bold uppercase tracking-widest transition-all",
            activeTab === 'estabelecimentos' 
              ? "bg-accent text-accent-foreground shadow-[0_0_15px_rgba(255,230,120,0.3)]" 
              : "text-muted-foreground hover:text-foreground"
          )}
        >
          Estabelecimentos
        </button>
      </div>

      {activeTab === 'comparador' ? (
        <div className="space-y-6">
          {/* Filters */}
          <div className="flex flex-col sm:flex-row gap-4">
            <div className="relative flex-1">
              <Search className="absolute left-4 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
              <Input
                placeholder="Buscar produto..."
                value={search}
                onChange={(e) => setSearch(e.target.value)}
                className="bg-indigo-950/20 border-white/10 h-12 pl-12 rounded-xl focus:border-accent/40 transition-all"
              />
            </div>
            <Select value={category} onValueChange={setCategory}>
              <SelectTrigger className="w-full sm:w-64 bg-indigo-950/20 border-white/10 h-12 rounded-xl text-xs font-bold uppercase tracking-widest">
                <SelectValue placeholder="Todas Categorias" />
              </SelectTrigger>
              <SelectContent className="bg-slate-950 border-white/10">
                <SelectItem value="todas">Todas Categorias</SelectItem>
                <SelectItem value="mercado">Mercado</SelectItem>
                <SelectItem value="hortifruti">Hortifruti</SelectItem>
                <SelectItem value="carnes">Carnes</SelectItem>
                <SelectItem value="higiene">Higiene</SelectItem>
                <SelectItem value="limpeza">Limpeza</SelectItem>
                <SelectItem value="bebidas">Bebidas</SelectItem>
                <SelectItem value="eletronicos">Eletrônicos</SelectItem>
                <SelectItem value="outros">Outros</SelectItem>
              </SelectContent>
            </Select>
          </div>

          {/* Product Cards */}
          <div className="space-y-4">
            {MOCK_PRODUCTS.map((product) => (
              <Card key={product.id} className="bg-indigo-950/10 border-white/5 rounded-[1.5rem] overflow-hidden">
                <CardContent className="p-6 space-y-6">
                  {/* Top Header */}
                  <div className="flex justify-between items-start">
                    <div className="space-y-1">
                      <span className="text-[9px] font-black tracking-[0.2em] bg-white/5 px-3 py-1 rounded text-muted-foreground uppercase">
                        {product.category}
                      </span>
                      <h3 className="text-2xl font-bold tracking-tight">{product.name}</h3>
                    </div>
                    <div className="text-right">
                      <p className="text-[9px] font-black tracking-[0.2em] text-muted-foreground uppercase">Melhor Atual</p>
                      <p className="text-2xl font-black text-cyan-400">R$ {product.currentBestPrice.toFixed(2)}</p>
                    </div>
                  </div>

                  {/* Stats Row */}
                  <div className="grid grid-cols-2 gap-8 border-t border-white/5 pt-6">
                    <div className="space-y-1">
                      <p className="text-[9px] font-black tracking-[0.2em] text-indigo-400/60 uppercase">Menor Histórico (Global)</p>
                      <p className="text-sm font-bold">R$ {product.minHistoryGlobal.toFixed(2)}</p>
                    </div>
                    <div className="space-y-1 border-l border-white/5 pl-8">
                      <p className="text-[9px] font-black tracking-[0.2em] text-indigo-400/60 uppercase">Variação Total</p>
                      <p className="text-sm font-bold">R$ {product.totalVariation.toFixed(2)}</p>
                    </div>
                  </div>

                  {/* Highlight Box */}
                  <div className="bg-cyan-500/10 border border-cyan-500/20 rounded-xl p-4 flex justify-between items-center group hover:bg-cyan-500/20 transition-all">
                    <div className="flex items-center gap-4">
                      <div className="p-2 bg-cyan-500/20 rounded-lg">
                        <Trophy className="h-5 w-5 text-cyan-400" />
                      </div>
                      <div>
                        <p className="text-[10px] font-black text-cyan-400 uppercase tracking-widest">Melhor Oferta Hoje</p>
                        <p className="font-bold">{product.bestOfferToday.store}</p>
                      </div>
                    </div>
                    <p className="text-xl font-black text-cyan-400">R$ {product.bestOfferToday.price.toFixed(2)}</p>
                  </div>

                  {/* History Table */}
                  <div className="space-y-3 pt-2">
                    {product.history.map((entry, idx) => (
                      <div key={idx} className="flex items-center justify-between text-xs py-2 group/entry">
                        <div className="flex items-center gap-10">
                          <span className="font-bold text-indigo-400 w-20">{entry.store}</span>
                          <span className="text-muted-foreground">{entry.date}</span>
                        </div>
                        <div className="flex items-center gap-8">
                          <div className="text-right">
                            <p className="text-[8px] font-black text-accent uppercase tracking-tighter">Min Hist.</p>
                            <p className="font-bold text-accent">R$ {product.minHistoryGlobal.toFixed(2)}</p>
                          </div>
                          <div className="text-right">
                            <p className="text-[8px] font-black text-income uppercase tracking-tighter">Atual</p>
                            <p className="font-bold text-income">R$ {entry.price.toFixed(2)}</p>
                          </div>
                        </div>
                      </div>
                    ))}
                  </div>
                </CardContent>
              </Card>
            ))}
          </div>
        </div>
      ) : (
        <div className="space-y-8 animate-in slide-in-from-bottom-4 duration-500">
          {/* Add Establishment Form */}
          <Card className="nebula-card border-accent/20 rounded-[2rem] p-6">
            <h3 className="text-lg font-black uppercase tracking-widest text-accent mb-6 flex items-center gap-2">
              <Cpu className="h-5 w-5 glow-accent" />
              Register New Point
            </h3>
            <form onSubmit={handleAddEstablishment} className="flex flex-col sm:flex-row gap-4">
              <Input
                placeholder="Ex: Mainframe Store, Neo-Market..."
                value={newEstName}
                onChange={(e) => setNewEstName(e.target.value)}
                className="bg-white/5 border-white/5 h-14 rounded-xl focus:border-accent/40 transition-all text-sm font-medium flex-1"
              />
              <Button type="submit" className="h-14 px-8 bg-accent text-accent-foreground font-black uppercase tracking-[0.2em] rounded-xl shadow-lg shadow-accent/10 group transition-all">
                Add Node
                <Plus className="ml-2 h-4 w-4 transition-transform group-hover:rotate-90" />
              </Button>
            </form>
          </Card>

          {/* Establishments Grid */}
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            {(!establishments || establishments.length === 0) ? (
              <div className="md:col-span-2 py-20 text-center border-2 border-dashed border-white/5 rounded-[2rem]">
                <p className="text-[10px] text-muted-foreground uppercase tracking-[0.3em] font-black">No neural nodes detected.</p>
              </div>
            ) : (
              establishments.map((est) => (
                <Card key={est.id} className="bg-indigo-950/10 border-white/5 rounded-2xl p-6 flex items-center justify-between group hover:border-accent/20 transition-all">
                  <div className="flex items-center gap-4">
                    <div className="p-3 bg-accent/10 rounded-xl group-hover:bg-accent/20 transition-colors">
                      <Store className="h-6 w-6 text-accent" />
                    </div>
                    <div>
                      <h4 className="font-bold text-lg">{est.name}</h4>
                      <p className="text-[9px] text-muted-foreground uppercase tracking-widest">{est.type || "Estabelecimento"}</p>
                    </div>
                  </div>
                  <Zap className="h-4 w-4 text-accent/20 group-hover:text-accent transition-colors" />
                </Card>
              ))
            )}
          </div>
        </div>
      )}
    </div>
  );
}
