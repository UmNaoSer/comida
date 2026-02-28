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
import { cn } from "@/lib/utils";
import { Search, Trophy, Calendar, Store } from "lucide-react";

type Tab = 'comparador' | 'estabelecimentos';

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
  const [activeTab, setActiveTab] = useState<Tab>('comparador');
  const [search, setSearch] = useState("");
  const [category, setCategory] = useState("todas");

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
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          <Card className="bg-indigo-950/10 border-white/5 rounded-2xl p-6 flex items-center gap-4">
            <div className="p-3 bg-accent/10 rounded-xl">
              <Store className="h-6 w-6 text-accent" />
            </div>
            <div>
              <h4 className="font-bold">Pezzi</h4>
              <p className="text-[10px] text-muted-foreground uppercase tracking-widest">Estabelecimento Principal</p>
            </div>
          </Card>
        </div>
      )}
    </div>
  );
}
