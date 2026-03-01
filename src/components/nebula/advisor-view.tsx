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
import { Alert, AlertTitle, AlertDescription } from "@/components/ui/alert";
import { cn } from "@/lib/utils";
import { 
  Search, 
  Trophy, 
  Store, 
  LayoutPanelLeft, 
  Zap, 
  ShoppingBag, 
  History, 
  Trash2, 
  Plus, 
  Calendar as CalendarIcon, 
  ChevronDown, 
  Camera, 
  Loader2, 
  X,
  Check,
  Edit2
} from "lucide-react";
import { useFirestore, useCollection, useMemoFirebase } from "@/firebase";
import { collection, doc, query, orderBy } from "firebase/firestore";
import { setDocumentNonBlocking, deleteDocumentNonBlocking } from "@/firebase/non-blocking-updates";
import { Popover, PopoverContent, PopoverTrigger } from "@/components/ui/popover";
import { Calendar } from "@/components/ui/calendar";
import { format } from "date-fns";
import { ptBR } from "date-fns/locale";
import { Collapsible, CollapsibleTrigger, CollapsibleContent } from "@/components/ui/collapsible";
import { analyzeReceipt, type AnalyzeReceiptOutput } from "@/ai/flows/analyze-receipt-flow";
import { toast } from "@/hooks/use-toast";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogFooter,
} from "@/components/ui/dialog";
import { ScrollArea } from "@/components/ui/scroll-area";

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
  
  // Camera & AI State
  const [isCameraOpen, setIsCameraOpen] = useState(false);
  const [isAnalyzing, setIsAnalyzing] = useState(false);
  const [hasCameraPermission, setHasCameraPermission] = useState<boolean | null>(null);
  const videoRef = useRef<HTMLVideoElement>(null);
  const canvasRef = useRef<HTMLCanvasElement>(null);

  // Review Modal State
  const [isReviewOpen, setIsReviewOpen] = useState(false);
  const [reviewData, setReviewData] = useState<AnalyzeReceiptOutput | null>(null);

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

  useEffect(() => {
    if (isCameraOpen) {
      const getCameraPermission = async () => {
        try {
          const stream = await navigator.mediaDevices.getUserMedia({ video: { facingMode: 'environment' } });
          setHasCameraPermission(true);
          if (videoRef.current) {
            videoRef.current.srcObject = stream;
          }
        } catch (error) {
          console.error('Error accessing camera:', error);
          setHasCameraPermission(false);
        }
      };
      getCameraPermission();
    } else {
      if (videoRef.current?.srcObject) {
        (videoRef.current.srcObject as MediaStream).getTracks().forEach(track => track.stop());
      }
    }
  }, [isCameraOpen]);

  const captureAndAnalyze = async () => {
    if (!videoRef.current || !canvasRef.current || !db) return;

    const canvas = canvasRef.current;
    const video = videoRef.current;
    canvas.width = video.videoWidth;
    canvas.height = video.videoHeight;
    const ctx = canvas.getContext('2d');
    if (!ctx) return;
    ctx.drawImage(video, 0, 0, canvas.width, canvas.height);
    
    const photoDataUri = canvas.toDataURL('image/jpeg');
    setIsAnalyzing(true);

    try {
      const result = await analyzeReceipt({ photoDataUri });
      setReviewData(result);
      setIsReviewOpen(true);
      setIsCameraOpen(false);
    } catch (error) {
      console.error("AI Error:", error);
      toast({
        variant: "destructive",
        title: "Erro na IA",
        description: "Não foi possível ler a nota. Tente novamente.",
      });
    } finally {
      setIsAnalyzing(false);
    }
  };

  const handleConfirmReview = () => {
    if (!reviewData || !db) return;

    // 1. Process Establishment
    let storeId = "";
    const existingEst = establishments?.find(e => e.name.toLowerCase() === reviewData.establishmentName.toLowerCase());
    
    if (existingEst) {
      storeId = existingEst.id;
    } else {
      storeId = Math.random().toString(36).substr(2, 9);
      const estRef = doc(db, "users", GUEST_USER_ID, "establishments", storeId);
      setDocumentNonBlocking(estRef, {
        id: storeId,
        name: reviewData.establishmentName,
        type: "Estabelecimento",
        createdAt: new Date().toISOString(),
      }, { merge: true });
    }

    // 2. Process Items
    for (const item of reviewData.items) {
      const normalizedName = item.name.trim().toLowerCase();
      const existingProduct = products?.find(p => p.name.toLowerCase() === normalizedName);
      
      let prodId: string;
      if (existingProduct) {
        prodId = existingProduct.id;
      } else {
        prodId = Math.random().toString(36).substr(2, 9);
        const prodRef = doc(db, "users", GUEST_USER_ID, "products", prodId);
        setDocumentNonBlocking(prodRef, {
          id: prodId,
          name: item.name.trim(),
          category: item.category,
        }, { merge: true });
      }

      const entryId = Math.random().toString(36).substr(2, 9);
      const entryRef = doc(db, "users", GUEST_USER_ID, "price_entries", entryId);
      setDocumentNonBlocking(entryRef, {
        id: entryId,
        productId: prodId,
        storeId: storeId,
        storeName: reviewData.establishmentName,
        price: item.price,
        date: new Date().toISOString(),
      }, { merge: true });
    }

    toast({
      title: "Nota Processada",
      description: `${reviewData.items.length} itens adicionados de ${reviewData.establishmentName}.`,
    });
    setIsReviewOpen(false);
    setReviewData(null);
  };

  const updateReviewItem = (index: number, field: string, value: any) => {
    if (!reviewData) return;
    const newItems = [...reviewData.items];
    newItems[index] = { ...newItems[index], [field]: value };
    setReviewData({ ...reviewData, items: newItems });
  };

  const removeReviewItem = (index: number) => {
    if (!reviewData) return;
    const newItems = reviewData.items.filter((_, i) => i !== index);
    setReviewData({ ...reviewData, items: newItems });
  };

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
      <div className="flex flex-col sm:flex-row items-center justify-between gap-4">
        <div className="flex gap-2 p-1 bg-indigo-950/20 border border-white/5 rounded-xl w-full sm:w-fit overflow-x-auto no-scrollbar">
          <button
            onClick={() => setActiveTab('produtos')}
            className={cn(
              "flex-1 sm:flex-none px-6 sm:px-8 py-2.5 rounded-lg text-[10px] sm:text-xs font-black uppercase tracking-[0.2em] transition-all whitespace-nowrap",
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
              "flex-1 sm:flex-none px-6 sm:px-8 py-2.5 rounded-lg text-[10px] sm:text-xs font-black uppercase tracking-[0.2em] transition-all whitespace-nowrap",
              activeTab === 'estabelecimentos' 
                ? "bg-accent text-accent-foreground shadow-[0_0_20px_rgba(255,230,120,0.3)]" 
                : "text-muted-foreground hover:text-foreground"
            )}
          >
            Lojas
          </button>
        </div>

        <Button 
          onClick={() => setIsCameraOpen(true)}
          className="w-full sm:w-auto h-12 px-6 rounded-xl bg-cyan-500 hover:bg-cyan-600 text-white font-black uppercase tracking-widest text-xs flex items-center justify-center gap-2 shadow-lg shadow-cyan-500/20"
        >
          <Camera className="h-4 w-4" />
          Notinha
        </Button>
      </div>

      {isCameraOpen && (
        <div className="fixed inset-0 z-[100] bg-black/95 flex flex-col items-center justify-center p-6 animate-in fade-in zoom-in-95">
          <button 
            onClick={() => setIsCameraOpen(false)}
            className="absolute top-8 right-8 text-white/50 hover:text-white p-2"
          >
            <X className="h-8 w-8" />
          </button>

          <div className="w-full max-w-2xl aspect-[3/4] bg-indigo-950/20 border-2 border-dashed border-white/20 rounded-3xl overflow-hidden relative">
            <video ref={videoRef} className="w-full h-full object-cover" autoPlay playsInline muted />
            <canvas ref={canvasRef} className="hidden" />
            
            {isAnalyzing && (
              <div className="absolute inset-0 bg-black/60 backdrop-blur-sm flex flex-col items-center justify-center gap-4">
                <Loader2 className="h-12 w-12 text-cyan-400 animate-spin" />
                <p className="text-cyan-400 font-black uppercase tracking-[0.3em] text-sm animate-pulse">Lendo Nota...</p>
              </div>
            )}

            {!hasCameraPermission && hasCameraPermission !== null && (
               <div className="absolute inset-0 flex items-center justify-center p-8 text-center">
                  <Alert variant="destructive">
                    <AlertTitle>Acesso Negado</AlertTitle>
                    <AlertDescription>Por favor, habilite a câmera nas configurações do navegador.</AlertDescription>
                  </Alert>
               </div>
            )}
          </div>

          {!isAnalyzing && hasCameraPermission && (
            <div className="mt-8 flex flex-col items-center gap-4">
               <button 
                onClick={captureAndAnalyze}
                className="w-20 h-20 rounded-full border-4 border-white flex items-center justify-center group active:scale-95 transition-all"
              >
                <div className="w-16 h-16 rounded-full bg-white group-hover:bg-cyan-400 transition-colors" />
              </button>
              <p className="text-white/40 font-bold uppercase tracking-widest text-[10px]">Tire uma foto clara da nota</p>
            </div>
          )}
        </div>
      )}

      {/* Review Dialog */}
      <Dialog open={isReviewOpen} onOpenChange={setIsReviewOpen}>
        <DialogContent className="max-w-3xl bg-[#1a1b2e] border-indigo-500/20 text-white rounded-[2rem] p-0 overflow-hidden">
          <DialogHeader className="p-8 pb-4">
            <DialogTitle className="text-2xl font-black uppercase tracking-tight text-accent italic flex items-center gap-3">
              <Edit2 className="h-6 w-6 glow-accent" />
              Revisar Notinha
            </DialogTitle>
          </DialogHeader>
          
          <ScrollArea className="max-h-[60vh] px-8 py-4">
            <div className="space-y-8">
              <div className="space-y-2">
                <label className="text-[10px] font-black uppercase tracking-[0.2em] text-muted-foreground ml-1">Estabelecimento</label>
                <Input 
                  value={reviewData?.establishmentName || ""}
                  onChange={(e) => setReviewData(prev => prev ? { ...prev, establishmentName: e.target.value } : null)}
                  className="bg-white/5 border-indigo-500/20 h-14 rounded-xl focus:border-accent/40 text-lg font-bold"
                />
              </div>

              <div className="space-y-4">
                <div className="flex items-center justify-between">
                  <h4 className="text-sm font-black uppercase tracking-widest text-indigo-300">Itens Extraídos</h4>
                  <span className="text-[10px] font-mono text-muted-foreground uppercase">{reviewData?.items.length || 0} Itens</span>
                </div>
                
                <div className="space-y-4">
                  {reviewData?.items.map((item, index) => (
                    <div key={index} className="bg-white/[0.03] border border-white/5 rounded-2xl p-4 group hover:border-accent/20 transition-all space-y-4">
                      <div className="flex items-start justify-between gap-4">
                        <Input 
                          value={item.name}
                          onChange={(e) => updateReviewItem(index, 'name', e.target.value)}
                          className="bg-transparent border-none p-0 h-auto text-sm font-bold focus-visible:ring-0 focus-visible:ring-offset-0"
                        />
                        <button 
                          onClick={() => removeReviewItem(index)}
                          className="p-2 text-muted-foreground hover:text-expense transition-colors"
                        >
                          <Trash2 className="h-4 w-4" />
                        </button>
                      </div>
                      
                      <div className="grid grid-cols-2 gap-4">
                        <div className="space-y-1">
                          <label className="text-[8px] font-black uppercase tracking-widest text-muted-foreground">Preço (R$)</label>
                          <Input 
                            type="number"
                            step="0.01"
                            value={item.price}
                            onChange={(e) => updateReviewItem(index, 'price', parseFloat(e.target.value))}
                            className="bg-white/5 border-white/5 h-10 rounded-lg text-xs"
                          />
                        </div>
                        <div className="space-y-1">
                          <label className="text-[8px] font-black uppercase tracking-widest text-muted-foreground">Categoria</label>
                          <Select 
                            value={item.category} 
                            onValueChange={(val) => updateReviewItem(index, 'category', val)}
                          >
                            <SelectTrigger className="bg-white/5 border-white/5 h-10 rounded-lg text-[10px]">
                              <SelectValue />
                            </SelectTrigger>
                            <SelectContent className="bg-slate-950 border-white/10">
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
                    </div>
                  ))}
                </div>
              </div>
            </div>
          </ScrollArea>

          <DialogFooter className="p-8 pt-4 border-t border-white/5 bg-white/[0.02]">
            <Button 
              variant="ghost" 
              onClick={() => setIsReviewOpen(false)}
              className="h-14 px-8 rounded-xl text-xs font-black uppercase tracking-widest text-muted-foreground hover:text-white"
            >
              Cancelar
            </Button>
            <Button 
              onClick={handleConfirmReview}
              className="h-14 px-12 rounded-xl bg-accent hover:bg-accent/90 text-accent-foreground font-black uppercase tracking-widest text-xs shadow-lg shadow-accent/20 flex items-center gap-3"
            >
              Confirmar e Adicionar
              <Check className="h-4 w-4" />
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {activeTab === 'produtos' ? (
        <div className="space-y-8">
          <Card className="bg-[#1a1b2e] border-indigo-500/10 rounded-[2rem] sm:rounded-[2.5rem] p-4 sm:p-8 max-w-4xl mx-auto shadow-2xl relative overflow-hidden">
            <div className="absolute top-0 right-0 p-8 opacity-[0.02] hidden sm:block">
              <LayoutPanelLeft className="h-32 w-32 text-accent" />
            </div>
            
            <div className="flex items-center justify-between mb-6 sm:mb-8">
              <h3 className="text-lg sm:text-xl font-headline font-black text-accent italic uppercase tracking-tighter flex items-center gap-3">
                <Plus className="h-5 w-5 glow-accent" />
                Adicionar Produto
              </h3>
            </div>
            
            <form onSubmit={handleSaveProduct} className="space-y-6">
              <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
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

              <div className="flex flex-col sm:flex-row items-stretch sm:items-end justify-between gap-6 pt-2">
                <div className="w-full sm:max-w-[240px] space-y-1.5">
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

                <div className="flex flex-col sm:flex-row gap-3 sm:gap-4">
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
                
                // Logic: Analyze each store's most recent entry and pick the lowest price among them.
                let bestEntryOverall = null;
                
                if (productEntries.length > 0) {
                  const latestByStore = new Map();
                  productEntries.forEach(entry => {
                    if (!latestByStore.has(entry.storeId)) {
                      latestByStore.set(entry.storeId, entry);
                    }
                  });
                  const candidates = Array.from(latestByStore.values()) as any[];
                  bestEntryOverall = candidates.reduce((min, curr) => curr.price < min.price ? curr : min, candidates[0]);
                }

                const allPrices = productEntries.map(e => e.price);
                const minHistory = allPrices.length > 0 ? Math.min(...allPrices) : 0;
                const currentBest = bestEntryOverall?.price || 0;
                const variation = allPrices.length > 1 ? (Math.max(...allPrices) - currentBest) : 0;
                const categoryData = CATEGORIES.find(c => c.name === product.category);

                return (
                  <Card key={product.name} className="bg-indigo-950/10 border-white/5 rounded-[1.5rem] sm:rounded-[2rem] overflow-hidden group hover:border-accent/20 transition-all">
                    <CardContent className="p-4 sm:p-8 space-y-6 sm:space-y-8">
                      <div className="flex flex-col lg:flex-row justify-between items-start gap-6">
                        <div className="space-y-3 w-full lg:flex-1">
                          <span className="inline-block text-[9px] font-black tracking-[0.2em] bg-accent/10 text-accent px-4 py-1.5 rounded-full uppercase">
                            {categoryData?.emoji} {product.category}
                          </span>
                          <div className="flex justify-between items-start gap-4">
                            <h3 className="text-xl sm:text-2xl lg:text-3xl font-bold tracking-tight leading-tight break-words">{product.name}</h3>
                            <button 
                              onClick={() => handleDeleteProductGroup(product.name)}
                              className="text-muted-foreground hover:text-expense transition-colors shrink-0"
                            >
                              <Trash2 className="h-5 w-5" />
                            </button>
                          </div>
                        </div>
                        
                        {bestEntryOverall ? (
                          <div className="w-full lg:w-auto bg-cyan-500/10 border border-cyan-500/20 rounded-2xl px-4 py-4 sm:px-6 sm:py-4 flex flex-col sm:flex-row items-start sm:items-center gap-4 sm:gap-6 shadow-[0_0_20px_rgba(34,211,238,0.05)]">
                            <div className="flex items-center gap-4 flex-1">
                              <div className="p-2 sm:p-2.5 bg-cyan-500/20 rounded-xl shrink-0">
                                <Trophy className="h-4 w-4 sm:h-5 text-cyan-400" />
                              </div>
                              <div className="min-w-0 flex-1">
                                <p className="text-[8px] sm:text-[10px] font-black text-cyan-400 uppercase tracking-[0.2em]">Melhor Loja Recentemente</p>
                                <p className="font-bold text-base sm:text-lg break-words leading-tight">{bestEntryOverall.storeName}</p>
                              </div>
                            </div>
                            <div className="w-full sm:w-auto sm:text-right sm:border-l border-cyan-500/20 sm:pl-6 pt-3 sm:pt-0 border-t sm:border-t-0 border-white/5">
                              <p className="text-xl sm:text-2xl font-black text-cyan-400">R$ {bestEntryOverall.price.toFixed(2)}</p>
                            </div>
                          </div>
                        ) : (
                          <div className="w-full lg:w-auto lg:text-right">
                            <p className="text-[9px] font-black tracking-[0.2em] text-muted-foreground uppercase">Sem Coletas</p>
                            <p className="text-2xl sm:text-3xl font-black text-muted-foreground/20">R$ 0,00</p>
                          </div>
                        )}
                      </div>

                      <div className="grid grid-cols-2 gap-4 sm:gap-8 border-t border-white/5 pt-6 sm:pt-8">
                        <div className="space-y-1 sm:space-y-2">
                          <p className="text-[8px] sm:text-[9px] font-black tracking-[0.2em] text-indigo-400/60 uppercase">Menor Histórico</p>
                          <p className="text-base sm:text-lg font-bold">R$ {minHistory.toFixed(2)}</p>
                        </div>
                        <div className="space-y-1 sm:space-y-2 border-l border-white/5 pl-4 sm:pl-8">
                          <p className="text-[8px] sm:text-[9px] font-black tracking-[0.2em] text-indigo-400/60 uppercase">Variação de Preço</p>
                          <p className="text-base sm:text-lg font-bold">R$ {variation.toFixed(2)}</p>
                        </div>
                      </div>

                      <Collapsible className="space-y-4 pt-4 border-t border-white/5">
                        <CollapsibleTrigger className="flex items-center justify-between w-full group/collapsible">
                          <div className="flex items-center gap-2">
                            <History className="h-4 w-4 text-indigo-400" />
                            <p className="text-[9px] sm:text-[10px] font-black text-indigo-400 uppercase tracking-widest">Histórico de Coletas</p>
                          </div>
                          <ChevronDown className="h-4 w-4 text-indigo-400 transition-transform duration-200 group-data-[state=open]/collapsible:rotate-180" />
                        </CollapsibleTrigger>
                        <CollapsibleContent className="space-y-4">
                          {productEntries.length === 0 ? (
                             <p className="text-[10px] text-muted-foreground italic uppercase tracking-widest text-center py-4">Nenhuma coleta encontrada.</p>
                          ) : (
                            productEntries.map((entry) => (
                              <div key={entry.id} className="flex items-center justify-between text-xs py-3 group/entry border-b border-white/[0.03] last:border-0">
                                <div className="flex flex-col sm:flex-row sm:items-center gap-1 sm:gap-10 min-w-0 flex-1">
                                  <span className="font-bold text-indigo-200 break-words">{entry.storeName}</span>
                                  <span className="text-muted-foreground font-mono text-[9px] sm:text-[10px]">{new Date(entry.date).toLocaleDateString('pt-BR')}</span>
                                </div>
                                <div className="text-right shrink-0">
                                  <p className="font-bold text-income">R$ {entry.price.toFixed(2)}</p>
                                </div>
                              </div>
                            ))
                          )}
                        </CollapsibleContent>
                      </Collapsible>
                    </CardContent>
                  </Card>
                );
              })
            )}
          </div>
        </div>
      ) : (
        <div className="space-y-8 animate-in slide-in-from-bottom-4 duration-500">
          <Card className="nebula-card border-accent/20 rounded-[1.5rem] sm:rounded-[2.5rem] p-6 sm:p-8 relative overflow-hidden">
             <div className="absolute -right-10 -top-10 opacity-[0.03] hidden sm:block">
                <Store className="h-40 w-40 text-accent" />
             </div>
            <h3 className="text-lg sm:text-xl font-black uppercase tracking-[0.2em] text-accent mb-6 sm:mb-8 flex items-center gap-3">
              <Plus className="h-5 w-5 sm:h-6 glow-accent" />
              Cadastrar Loja
            </h3>
            <form onSubmit={handleAddEstablishment} className="flex flex-col sm:flex-row gap-4 relative z-10">
              <Input
                placeholder="Ex: Mercado Central..."
                value={newEstName}
                onChange={(e) => setNewEstName(e.target.value)}
                className="bg-white/5 border-white/5 h-14 sm:h-16 rounded-xl sm:rounded-2xl focus:border-accent/40 transition-all text-sm font-medium flex-1 px-6"
              />
              <Button type="submit" className="h-14 sm:h-16 px-10 bg-accent text-accent-foreground font-black uppercase tracking-[0.3em] rounded-xl sm:rounded-2xl shadow-xl shadow-accent/10 group transition-all">
                Adicionar
                <Plus className="ml-3 h-5 w-5 transition-transform group-hover:rotate-90" />
              </Button>
            </form>
          </Card>

          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
            {(!establishments || establishments.length === 0) ? (
              <div className="md:col-span-2 lg:col-span-3 py-24 text-center border-2 border-dashed border-white/5 rounded-[2rem] sm:rounded-[3rem]">
                <p className="text-[10px] sm:text-[11px] text-muted-foreground uppercase tracking-[0.4em] font-black italic">Nenhuma loja cadastrada.</p>
              </div>
            ) : (
              establishments.map((est) => (
                <Card key={est.id} className="bg-indigo-950/10 border-white/5 rounded-[1.5rem] sm:rounded-[2rem] p-5 sm:p-6 flex items-center justify-between group hover:border-accent/30 transition-all relative overflow-hidden">
                  <div className="flex items-center gap-4 sm:gap-5 relative z-10 flex-1 min-w-0">
                    <div className="p-3 sm:p-4 bg-accent/10 rounded-xl sm:rounded-2xl group-hover:bg-accent/20 transition-colors shrink-0">
                      <Store className="h-6 w-6 sm:h-7 text-accent" />
                    </div>
                    <div className="min-w-0 flex-1">
                      <h4 className="font-bold text-base sm:text-lg tracking-tight break-words">{est.name}</h4>
                      <p className="text-[8px] sm:text-[9px] text-muted-foreground uppercase tracking-[0.2em] mt-1">{est.type || "Loja"}</p>
                    </div>
                  </div>
                  <Zap className="h-4 w-4 sm:h-5 text-accent/10 group-hover:text-accent transition-all relative z-10 shrink-0" />
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