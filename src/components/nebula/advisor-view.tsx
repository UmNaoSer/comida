
import React, { useState, useRef, useEffect } from "react";
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
import { Switch } from "@/components/ui/switch";
import { cn } from "@/lib/utils";
import { 
  Search, 
  Trophy, 
  Store, 
  Trash2, 
  Plus, 
  ChevronDown, 
  Camera, 
  Loader2, 
  X,
  Edit2,
  History,
  Scale,
  Calendar as CalendarIcon
} from "lucide-react";
import { useFirestore, useCollection, useMemoFirebase } from "@/firebase";
import { collection, doc, query, orderBy } from "firebase/firestore";
import { setDocumentNonBlocking, deleteDocumentNonBlocking } from "@/firebase/non-blocking-updates";
import { Popover, PopoverContent, PopoverTrigger } from "@/components/ui/popover";
import { Calendar } from "@/components/ui/calendar";
import { format } from "date-fns";
import { ptBR } from "date-fns/locale";
import { Collapsible, CollapsibleTrigger, CollapsibleContent } from "@/components/ui/collapsible";
import { analyzeReceipt } from "@/ai/flows/analyze-receipt-flow";
import { useToast } from "@/hooks/use-toast";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogFooter,
} from "@/components/ui/dialog";
import { ScrollArea } from "@/components/ui/scroll-area";
import { Label } from "@/components/ui/label";

type Tab = 'produtos' | 'estabelecimentos';

const GUEST_USER_ID = "guest-protocol-v1";

const CATEGORIES = [
  { name: "Açougue", emoji: "🥩", color: "bg-[#FFB7B2]" },
  { name: "Hortifruti", emoji: "🍎", color: "bg-[#B2FFB2]" },
  { name: "Padaria", emoji: "🥖", color: "bg-[#FFFFB2]" },
  { name: "Laticínios", emoji: "🥛", color: "bg-[#B2D6FF]" },
  { name: "Mercearia", emoji: "🧺", color: "bg-[#FFD1B2]" },
  { name: "Temperos", emoji: "🌶️", color: "bg-[#FFB2D6]" },
  { name: "Bebidas", emoji: "🥤", color: "bg-[#B2B2FF]" },
  { name: "Limpeza", emoji: "🧹", color: "bg-[#B2FFFF]" },
  { name: "Higiene", emoji: "🧼", color: "bg-[#E2FFB2]" },
  { name: "Pets", emoji: "🐾", color: "bg-[#F2B2FF]" },
  { name: "Lazer", emoji: "🎡", color: "bg-[#FFB2B2]" },
  { name: "Transporte", emoji: "🚌", color: "bg-[#D1B2FF]" },
  { name: "Alimentação", emoji: "🍽️", color: "bg-[#B2FFD1]" },
  { name: "Compras", emoji: "🛍️", color: "bg-[#FFB2E2]" }
];

export function AdvisorView() {
  const db = useFirestore();
  const { toast } = useToast();
  const [activeTab, setActiveTab] = useState<Tab>('produtos');
  const [search, setSearch] = useState("");
  const [filterCategory, setFilterCategory] = useState("todas");
  const [mounted, setMounted] = useState(false);
  
  const [isCameraOpen, setIsCameraOpen] = useState(false);
  const [isAnalyzing, setIsAnalyzing] = useState(false);
  const videoRef = useRef<HTMLVideoElement>(null);
  const canvasRef = useRef<HTMLCanvasElement>(null);

  const [isReviewOpen, setIsReviewOpen] = useState(false);
  const [reviewItems, setReviewItems] = useState<any[]>([]);
  const [reviewEstablishment, setReviewEstablishment] = useState("");
  const [reviewDate, setReviewDate] = useState<Date>(new Date());

  const [formEstId, setFormEstId] = useState("");
  const [formProdName, setFormProdName] = useState("");
  const [formPrice, setFormPrice] = useState("");
  const [formCategory, setFormCategory] = useState("Compras");
  const [formDate, setFormDate] = useState<Date | undefined>(undefined);
  const [formIsKg, setFormIsKg] = useState(false);

  const [newEstName, setNewEstName] = useState("");

  useEffect(() => {
    setFormDate(new Date());
    setReviewDate(new Date());
    setMounted(true);
  }, []);

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

  useEffect(() => {
    let currentStream: MediaStream | null = null;

    const startCamera = async () => {
      try {
        const constraints = { 
          video: { 
            facingMode: 'environment',
            width: { ideal: 1280 },
            height: { ideal: 720 }
          } 
        };
        
        try {
          currentStream = await navigator.mediaDevices.getUserMedia(constraints);
        } catch (e) {
          currentStream = await navigator.mediaDevices.getUserMedia({ video: true });
        }
        
        if (videoRef.current) {
          videoRef.current.srcObject = currentStream;
        }
      } catch (err: any) {
        console.error("Erro ao acessar a câmera:", err);
        toast({
          variant: "destructive",
          title: "Erro na Câmera",
          description: "Não foi possível acessar a câmera.",
        });
        setIsCameraOpen(false);
      }
    };

    if (isCameraOpen) {
      startCamera();
    }

    return () => {
      if (currentStream) {
        currentStream.getTracks().forEach(track => track.stop());
      }
    };
  }, [isCameraOpen, toast]);

  const captureAndAnalyze = async () => {
    if (!videoRef.current || !canvasRef.current || !db) return;
    const video = videoRef.current;
    const canvas = canvasRef.current;

    if (video.readyState !== 4) {
      toast({ variant: "destructive", title: "Câmera não carregou", description: "Aguarde o vídeo." });
      return;
    }

    canvas.width = video.videoWidth;
    canvas.height = video.videoHeight;
    canvas.getContext('2d')?.drawImage(video, 0, 0);
    const photoDataUri = canvas.toDataURL('image/jpeg', 0.8);
    
    setIsAnalyzing(true);
    try {
      const existingProductNames = products?.map(p => p.name) || [];
      const existingEstNames = establishments?.map(e => e.name) || [];
      const result = await analyzeReceipt({ 
        photoDataUri, 
        existingProducts: existingProductNames,
        existingEstablishments: existingEstNames
      });
      
      const processed = result.items.map(item => {
        const matchName = item.matchedProductName || item.name;
        const match = products?.find(p => p.name.toLowerCase() === matchName.toLowerCase());
        return { 
          ...item, 
          name: match ? match.name : item.name, 
          selected: true,
          quantity: "1",
          isKg: false 
        };
      });

      setReviewItems(processed);
      setReviewEstablishment(result.matchedEstablishmentName || result.establishmentName || "");
      setReviewDate(new Date());
      setIsReviewOpen(true);
      setIsCameraOpen(false);
    } catch (error: any) {
      console.error("Erro na análise:", error);
      toast({ variant: "destructive", title: "Erro na leitura", description: error.message || "Falha na análise." });
    } finally {
      setIsAnalyzing(false);
    }
  };

  const handleConfirmReview = () => {
    if (!db) return;
    let storeId = "";
    const existingEst = establishments?.find(e => e.name.toLowerCase() === reviewEstablishment.toLowerCase());
    
    if (existingEst) {
      storeId = existingEst.id;
    } else {
      storeId = Math.random().toString(36).substr(2, 9);
      setDocumentNonBlocking(doc(db, "users", GUEST_USER_ID, "establishments", storeId), {
        id: storeId,
        name: reviewEstablishment,
        type: "Estabelecimento",
        createdAt: new Date().toISOString(),
      }, { merge: true });
    }

    reviewItems.filter(i => i.selected).forEach(item => {
      const normalizedName = item.name.trim().toLowerCase();
      const existingProduct = products?.find(p => p.name.toLowerCase() === normalizedName);
      let prodId = existingProduct ? existingProduct.id : Math.random().toString(36).substr(2, 9);
      
      if (!existingProduct) {
        setDocumentNonBlocking(doc(db, "users", GUEST_USER_ID, "products", prodId), {
          id: prodId,
          name: item.name.trim(),
          category: item.category,
        }, { merge: true });
      }

      const entryId = Math.random().toString(36).substr(2, 9);
      setDocumentNonBlocking(doc(db, "users", GUEST_USER_ID, "price_entries", entryId), {
        id: entryId,
        productId: prodId,
        storeId: storeId,
        storeName: reviewEstablishment,
        price: item.price,
        date: reviewDate.toISOString(),
        unit: item.isKg ? "Kg" : "Un"
      }, { merge: true });
    });

    toast({ title: "Nota Processada", description: "Histórico atualizado." });
    setIsReviewOpen(false);
  };

  const handleSaveProduct = (e: React.FormEvent) => {
    e.preventDefault();
    if (!formProdName || !formPrice || !formEstId || !db) return;
    const store = establishments?.find(e => e.id === formEstId);
    if (!store) return;

    const normalizedName = formProdName.trim().toLowerCase();
    const existingProduct = products?.find(p => p.name.toLowerCase() === normalizedName);
    let prodId = existingProduct ? existingProduct.id : Math.random().toString(36).substr(2, 9);
    
    if (!existingProduct) {
      setDocumentNonBlocking(doc(db, "users", GUEST_USER_ID, "products", prodId), {
        id: prodId,
        name: formProdName.trim(),
        category: formCategory,
      }, { merge: true });
    }

    const entryId = Math.random().toString(36).substr(2, 9);
    setDocumentNonBlocking(doc(db, "users", GUEST_USER_ID, "price_entries", entryId), {
      id: entryId,
      productId: prodId,
      storeId: store.id,
      storeName: store.name,
      price: parseFloat(formPrice),
      date: formDate?.toISOString() || new Date().toISOString(),
      unit: formIsKg ? "Kg" : "Un"
    }, { merge: true });

    setFormProdName("");
    setFormPrice("");
    setFormIsKg(false);
    toast({ title: "Produto salvo" });
  };

  const handleDeleteProductGroup = (productName: string) => {
    if (!db || !products || !allEntries) return;
    const relatedIds = products.filter(p => p.name.toLowerCase() === productName.toLowerCase()).map(p => p.id);
    relatedIds.forEach(id => deleteDocumentNonBlocking(doc(db, "users", GUEST_USER_ID, "products", id)));
    allEntries.filter(e => relatedIds.includes(e.productId)).forEach(entry => deleteDocumentNonBlocking(doc(db, "users", GUEST_USER_ID, "price_entries", entry.id)));
    toast({ title: "Produto removido" });
  };

  if (!mounted) return null;

  const groupedProducts: any[] = [];
  const processedNames = new Set<string>();
  products?.filter(p => {
    const matchesSearch = p.name.toLowerCase().includes(search.toLowerCase());
    const matchesCategory = filterCategory === "todas" || p.category === filterCategory;
    return matchesSearch && matchesCategory;
  }).forEach(p => {
    const lowerName = p.name.toLowerCase();
    if (!processedNames.has(lowerName)) {
      processedNames.add(lowerName);
      const ids = products?.filter(prod => prod.name.toLowerCase() === lowerName).map(prod => prod.id) || [];
      groupedProducts.push({ ...p, relatedIds: ids });
    }
  });

  return (
    <div className="space-y-8 animate-in fade-in duration-500 pb-20">
      <div className="flex flex-col sm:flex-row items-center justify-between gap-4">
        <div className="flex gap-2 p-1 bg-indigo-950/20 border border-white/5 rounded-xl w-full sm:w-fit overflow-x-auto no-scrollbar">
          <button onClick={() => setActiveTab('produtos')} className={cn("flex-1 sm:flex-none px-6 py-2.5 rounded-lg text-xs font-black uppercase tracking-[0.2em] transition-all", activeTab === 'produtos' ? "bg-accent text-accent-foreground shadow-lg" : "text-muted-foreground hover:text-foreground")}>Produtos</button>
          <button onClick={() => setActiveTab('estabelecimentos')} className={cn("flex-1 sm:flex-none px-6 py-2.5 rounded-lg text-xs font-black uppercase tracking-[0.2em] transition-all", activeTab === 'estabelecimentos' ? "bg-accent text-accent-foreground shadow-lg" : "text-muted-foreground hover:text-foreground")}>Lojas</button>
        </div>
        <Button onClick={() => setIsCameraOpen(true)} className="w-full sm:w-auto h-12 px-6 rounded-xl bg-cyan-500 text-white font-black uppercase tracking-widest text-xs flex items-center gap-2"><Camera className="h-4 w-4" />Notinha</Button>
      </div>

      {isCameraOpen && (
        <div className="fixed inset-0 z-[100] bg-black/95 flex flex-col items-center justify-center p-6 animate-in fade-in">
          <button onClick={() => setIsCameraOpen(false)} className="absolute top-8 right-8 text-white/50 hover:text-white p-2"><X className="h-8 w-8" /></button>
          <div className="w-full max-w-2xl aspect-[3/4] bg-indigo-950/20 border-2 border-dashed border-white/20 rounded-3xl overflow-hidden relative shadow-2xl">
            <video ref={videoRef} className="w-full h-full object-cover" autoPlay playsInline muted />
            <canvas ref={canvasRef} className="hidden" />
            {isAnalyzing && (
              <div className="absolute inset-0 bg-black/80 backdrop-blur-xl flex flex-col items-center justify-center gap-6">
                <Loader2 className="h-16 w-16 text-cyan-400 animate-spin" />
                <p className="text-cyan-400 font-black uppercase tracking-[0.5em] text-sm animate-pulse">Lendo Nota...</p>
              </div>
            )}
          </div>
          {!isAnalyzing && (
            <button onClick={captureAndAnalyze} className="mt-8 w-24 h-24 rounded-full border-[6px] border-white/20 flex items-center justify-center group active:scale-95 transition-all hover:border-white">
              <div className="w-16 h-16 rounded-full bg-white group-hover:bg-cyan-400 transition-colors scale-90 group-hover:scale-100" />
            </button>
          )}
        </div>
      )}

      <Dialog open={isReviewOpen} onOpenChange={setIsReviewOpen}>
        <DialogContent className="max-w-2xl bg-[#1a1b2e] border-indigo-500/20 text-white rounded-[2.5rem] p-0 overflow-hidden shadow-2xl h-[90vh] flex flex-col">
          <DialogHeader className="p-8 sm:p-10 pb-6 flex-shrink-0">
            <DialogTitle className="text-2xl font-black uppercase tracking-tighter text-accent flex items-center gap-4 italic">
              <Edit2 className="h-6 w-6" />
              Revisar Notinha
            </DialogTitle>
          </DialogHeader>

          <ScrollArea className="flex-grow px-6 sm:px-10 py-4">
            <div className="space-y-8">
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-6 bg-white/[0.03] p-6 rounded-[2rem] border border-white/5">
                <div className="space-y-2">
                  <Label className="text-[9px] font-black uppercase tracking-[0.3em] text-muted-foreground">Estabelecimento</Label>
                  <Input 
                    value={reviewEstablishment}
                    onChange={(e) => setReviewEstablishment(e.target.value)}
                    className="bg-white/5 border-indigo-500/20 h-12 rounded-xl font-bold"
                  />
                </div>
                <div className="space-y-2">
                  <Label className="text-[9px] font-black uppercase tracking-[0.3em] text-muted-foreground">Data</Label>
                  <Popover>
                    <PopoverTrigger asChild>
                      <button className="w-full bg-white/5 border border-white/10 h-12 rounded-xl flex items-center justify-between px-4 text-white">
                        <span className="text-sm font-bold">{format(reviewDate, "dd/MM/yyyy")}</span>
                        <CalendarIcon className="h-4 w-4 text-accent" />
                      </button>
                    </PopoverTrigger>
                    <PopoverContent className="w-auto p-0 bg-card border-white/10" align="end">
                      <Calendar
                        mode="single"
                        selected={reviewDate}
                        onSelect={(date) => date && setReviewDate(date)}
                        locale={ptBR}
                        initialFocus
                      />
                    </PopoverContent>
                  </Popover>
                </div>
              </div>

              <div className="space-y-4">
                {reviewItems.map((item, idx) => (
                  <div 
                    key={idx} 
                    className={cn(
                      "p-5 rounded-[2rem] border-2 transition-all flex flex-col gap-4",
                      item.selected ? "bg-accent/5 border-accent/20" : "bg-white/[0.02] border-white/5"
                    )}
                  >
                    <div className="flex items-start justify-between gap-4">
                      <div className="flex-1 min-w-0">
                        <Input 
                          value={item.name}
                          onChange={(e) => {
                            const newItems = [...reviewItems];
                            newItems[idx].name = e.target.value;
                            setReviewItems(newItems);
                          }}
                          className="bg-transparent border-none p-0 h-auto text-sm font-black focus-visible:ring-0"
                        />
                        <p className="text-[10px] font-black uppercase tracking-widest text-accent mt-1">R$ {item.price.toFixed(2)}</p>
                      </div>
                      <Button
                        size="icon"
                        variant="ghost"
                        onClick={() => {
                          const newItems = [...reviewItems];
                          newItems[idx].selected = !newItems[idx].selected;
                          setReviewItems(newItems);
                        }}
                        className={cn("h-10 w-10 rounded-xl", item.selected ? "bg-accent text-accent-foreground" : "bg-white/5 text-muted-foreground")}
                      >
                        {item.selected ? <Check className="h-4 w-4" /> : <Plus className="h-4 w-4" />}
                      </Button>
                    </div>

                    {item.selected && (
                      <div className="grid grid-cols-2 gap-4 pt-4 border-t border-white/5">
                        <div className="space-y-2">
                          <Label className="text-[8px] font-black uppercase tracking-widest text-muted-foreground">Unid / Kg</Label>
                          <div className="flex items-center gap-2">
                             <Switch 
                               checked={item.isKg} 
                               onCheckedChange={(val) => {
                                 const newItems = [...reviewItems];
                                 newItems[idx].isKg = val;
                                 setReviewItems(newItems);
                               }}
                             />
                             <span className="text-[9px] font-black uppercase text-accent">{item.isKg ? "Kg" : "Un"}</span>
                          </div>
                        </div>
                        <div className="space-y-2">
                          <Label className="text-[8px] font-black uppercase tracking-widest text-muted-foreground">Preço (R$)</Label>
                          <Input 
                            type="number"
                            step="0.01"
                            value={item.price}
                            onChange={(e) => {
                              const newItems = [...reviewItems];
                              newItems[idx].price = parseFloat(e.target.value);
                              setReviewItems(newItems);
                            }}
                            className="bg-white/5 border-white/10 h-10 rounded-lg text-center font-bold"
                          />
                        </div>
                      </div>
                    )}
                  </div>
                ))}
              </div>
            </div>
          </ScrollArea>

          <DialogFooter className="p-8 sm:p-10 pt-6 border-t border-white/5 flex-shrink-0">
            <Button variant="ghost" onClick={() => setIsReviewOpen(false)} className="font-black uppercase tracking-widest text-[10px]">Descartar</Button>
            <Button onClick={handleConfirmReview} className="bg-accent text-accent-foreground font-black uppercase tracking-[0.2em] text-xs rounded-2xl">
              Confirmar ({reviewItems.filter(i => i.selected).length})
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {activeTab === 'produtos' ? (
        <div className="space-y-8">
          <Card className="bg-[#1a1b2e] border-indigo-500/10 rounded-[2rem] p-6 sm:p-8 max-w-4xl mx-auto shadow-2xl relative overflow-hidden">
            <h3 className="text-xl font-headline font-black text-accent italic uppercase tracking-tighter flex items-center gap-3 mb-8"><Plus className="h-5 w-5" />Adicionar Produto</h3>
            <form onSubmit={handleSaveProduct} className="space-y-6">
              <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-5 gap-4">
                <div className="space-y-1.5">
                  <Label className="text-[9px] font-black uppercase tracking-[0.2em] text-muted-foreground">Estabelecimento</Label>
                  <Select value={formEstId} onValueChange={setFormEstId}><SelectTrigger className="bg-[#121321] border-indigo-500/20 h-12 rounded-xl text-indigo-100"><SelectValue placeholder="Selecione" /></SelectTrigger><SelectContent className="bg-[#121321]">{establishments?.map(est => <SelectItem key={est.id} value={est.id}>{est.name}</SelectItem>)}</SelectContent></Select>
                </div>
                <div className="space-y-1.5">
                  <Label className="text-[9px] font-black uppercase tracking-[0.2em] text-muted-foreground">Produto</Label>
                  <Input placeholder="Ex: Arroz" value={formProdName} onChange={(e) => setFormProdName(e.target.value)} className="bg-[#121321] border-indigo-500/20 h-12 rounded-xl" />
                </div>
                <div className="space-y-1.5">
                  <Label className="text-[9px] font-black uppercase tracking-[0.2em] text-muted-foreground">Preço (R$)</Label>
                  <Input type="number" step="0.01" value={formPrice} onChange={(e) => setFormPrice(e.target.value)} className="bg-[#121321] border-indigo-500/20 h-12 rounded-xl" />
                </div>
                <div className="space-y-1.5">
                  <Label className="text-[9px] font-black uppercase tracking-[0.2em] text-muted-foreground">Unid / Kg</Label>
                  <div className="flex items-center gap-2 h-12">
                     <Switch checked={formIsKg} onCheckedChange={(val) => setFormIsKg(val)} />
                     <span className="text-[10px] font-black text-accent uppercase">{formIsKg ? "Kg" : "Un"}</span>
                  </div>
                </div>
                <div className="space-y-1.5">
                  <Label className="text-[9px] font-black uppercase tracking-[0.2em] text-muted-foreground">Categoria</Label>
                  <Select value={formCategory} onValueChange={setFormCategory}><SelectTrigger className="bg-[#121321] border-indigo-500/20 h-12 rounded-xl"><SelectValue /></SelectTrigger><SelectContent className="bg-[#121321]">{CATEGORIES.map(cat => <SelectItem key={cat.name} value={cat.name}>{cat.emoji} {cat.name}</SelectItem>)}</SelectContent></Select>
                </div>
              </div>
              <div className="flex justify-end pt-4"><Button type="submit" className="h-12 px-12 rounded-xl bg-accent text-accent-foreground font-black uppercase text-xs">Salvar Produto</Button></div>
            </form>
          </Card>
          <div className="flex flex-col sm:flex-row gap-4">
            <div className="relative flex-1"><Search className="absolute left-4 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" /><Input placeholder="Pesquisar..." value={search} onChange={(e) => setSearch(e.target.value)} className="bg-indigo-950/20 border-white/10 h-12 pl-12 rounded-xl" /></div>
            <Select value={filterCategory} onValueChange={setFilterCategory}><SelectTrigger className="w-full sm:w-64 bg-indigo-950/20 border-white/10 h-12 rounded-xl font-black uppercase text-[10px]"><SelectValue /></SelectTrigger><SelectContent className="bg-slate-950"><SelectItem value="todas">Todas Categorias</SelectItem>{CATEGORIES.map(cat => <SelectItem key={cat.name} value={cat.name}>{cat.name}</SelectItem>)}</SelectContent></Select>
          </div>
          <div className="grid grid-cols-1 gap-6">
            {groupedProducts.map((product) => {
              const entries = allEntries?.filter(e => product.relatedIds.includes(e.productId)) || [];
              const best = entries.length > 0 ? entries.reduce((min, curr) => curr.price < min.price ? curr : min, entries[0]) : null;
              const categoryData = CATEGORIES.find(c => c.name === product.category);
              return (
                <Card key={product.name} className="bg-indigo-950/10 border-white/5 rounded-[2rem] p-6 sm:p-8 hover:border-accent/20 transition-all">
                  <div className="flex flex-col lg:flex-row justify-between items-start gap-6">
                    <div className="space-y-3 flex-1"><span className={cn("inline-block text-[9px] font-black px-4 py-1.5 rounded-full uppercase text-gray-900", categoryData?.color || "bg-accent/10 text-accent")}>{categoryData?.emoji} {product.category}</span><div className="flex justify-between items-start gap-4"><h3 className="text-2xl font-bold tracking-tight">{product.name}</h3><button onClick={() => handleDeleteProductGroup(product.name)} className="text-muted-foreground hover:text-expense"><Trash2 className="h-5 w-5" /></button></div></div>
                    {best && <div className="bg-cyan-500/10 border border-cyan-500/20 rounded-2xl px-6 py-4 flex items-center gap-6"><div className="flex items-center gap-4"> <Trophy className="h-5 w-5 text-cyan-400" /><div><p className="text-[10px] font-black text-cyan-400 uppercase">Melhor Loja</p><p className="font-bold text-lg">{best.storeName}</p></div></div><div className="border-l border-cyan-500/20 pl-6"><p className="text-2xl font-black text-cyan-400">R$ {best.price.toFixed(2)} / {best.unit || "Un"}</p></div></div>}
                  </div>
                  <Collapsible className="space-y-4 pt-6 border-t border-white/5 mt-6">
                    <CollapsibleTrigger className="flex items-center justify-between w-full group/collapsible"><div className="flex items-center gap-2"><History className="h-4 w-4 text-indigo-400" /><p className="text-[10px] font-black text-indigo-400 uppercase tracking-widest">Histórico</p></div><ChevronDown className="h-4 w-4 transition-transform group-data-[state=open]/collapsible:rotate-180" /></CollapsibleTrigger>
                    <CollapsibleContent className="space-y-3">{entries.map(e => <div key={e.id} className="flex justify-between text-xs py-2 border-b border-white/[0.03]"><span>{e.storeName} <span className="text-muted-foreground ml-2">({e.unit || "Un"})</span></span><span className="font-bold text-income">R$ {e.price.toFixed(2)} / {e.unit || "Un"}</span></div>)}</CollapsibleContent>
                  </Collapsible>
                </Card>
              );
            })}
          </div>
        </div>
      ) : (
        <div className="space-y-8">
          <Card className="nebula-card border-accent/20 rounded-[2.5rem] p-8">
            <h3 className="text-xl font-black uppercase text-accent mb-8 flex items-center gap-3"><Plus className="h-6 w-6" />Cadastrar Loja</h3>
            <form onSubmit={(e) => { e.preventDefault(); if (!newEstName || !db) return; const id = Math.random().toString(36).substr(2, 9); setDocumentNonBlocking(doc(db, "users", GUEST_USER_ID, "establishments", id), { id, name: newEstName, type: "Estabelecimento", createdAt: new Date().toISOString() }, { merge: true }); setNewEstName(""); }} className="flex flex-col sm:flex-row gap-4">
              <Input placeholder="Ex: Mercado Central..." value={newEstName} onChange={(e) => setNewEstName(e.target.value)} className="bg-white/5 h-14 rounded-2xl flex-1 px-6" /><Button type="submit" className="h-14 px-10 bg-accent text-accent-foreground font-black uppercase rounded-2xl">Adicionar</Button>
            </form>
          </Card>
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">{establishments?.map(est => <Card key={est.id} className="bg-indigo-950/10 border-white/5 rounded-[2rem] p-6 flex items-center justify-between group hover:border-accent/30 transition-all"><div className="flex items-center gap-4"><div className="p-3 bg-accent/10 rounded-2xl"><Store className="h-6 w-6 text-accent" /></div><div><h4 className="font-bold text-lg">{est.name}</h4><p className="text-[9px] text-muted-foreground uppercase mt-1">{est.type || "Loja"}</p></div></div><button onClick={() => deleteDocumentNonBlocking(doc(db, "users", GUEST_USER_ID, "establishments", est.id))} className="text-muted-foreground hover:text-expense"><Trash2 className="h-5 w-5" /></button></Card>)}</div>
        </div>
      )}
    </div>
  );
}
