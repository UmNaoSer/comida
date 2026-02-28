'use client';
import { useState } from 'react';
import { useAuth } from '@/firebase';
import { initiateEmailSignIn, initiateEmailSignUp, initiateAnonymousSignIn } from '@/firebase/non-blocking-login';
import { Card, CardHeader, CardTitle, CardContent, CardFooter } from '@/components/ui/card';
import { Input } from '@/components/ui/input';
import { Button } from '@/components/ui/button';
import { Label } from '@/components/ui/label';
import { Sparkles, ShieldCheck } from 'lucide-react';

export function AuthView() {
  const auth = useAuth();
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [isSignUp, setIsSignUp] = useState(false);

  return (
    <div className="min-h-screen flex items-center justify-center p-4 bg-background relative overflow-hidden">
      {/* Background Orbs */}
      <div className="absolute top-[-10%] left-[-10%] w-[40%] h-[40%] bg-primary/20 rounded-full blur-[120px] pointer-events-none" />
      <div className="absolute bottom-[-10%] right-[-10%] w-[40%] h-[40%] bg-accent/10 rounded-full blur-[120px] pointer-events-none" />

      <Card className="w-full max-w-md nebula-card border-accent/20 relative z-10">
        <CardHeader className="text-center">
          <div className="w-16 h-16 rounded-2xl bg-accent flex items-center justify-center mx-auto mb-6 glow-accent">
            <Sparkles className="h-8 w-8 text-accent-foreground" />
          </div>
          <CardTitle className="text-4xl font-headline font-bold tracking-tight mb-2">Nebula Finanx</CardTitle>
          <p className="text-muted-foreground text-sm uppercase tracking-widest">Initialization Protocol Required</p>
        </CardHeader>
        <CardContent className="space-y-6">
          <div className="space-y-4">
            <div className="space-y-2">
              <Label htmlFor="email">Neural Interface ID (Email)</Label>
              <Input 
                id="email" 
                type="email" 
                placeholder="identity@nebula.io" 
                value={email} 
                onChange={(e) => setEmail(e.target.value)}
                className="bg-background/50 border-white/10 h-12"
              />
            </div>
            <div className="space-y-2">
              <Label htmlFor="password">Security Vector (Password)</Label>
              <Input 
                id="password" 
                type="password" 
                placeholder="••••••••" 
                value={password} 
                onChange={(e) => setPassword(e.target.value)}
                className="bg-background/50 border-white/10 h-12"
              />
            </div>
          </div>
          
          <Button 
            className="w-full h-12 bg-accent hover:bg-accent/90 text-accent-foreground font-bold text-lg shadow-xl shadow-accent/20"
            onClick={() => isSignUp ? initiateEmailSignUp(auth, email, password) : initiateEmailSignIn(auth, email, password)}
          >
            {isSignUp ? 'ESTABLISH LINK' : 'AUTHENTICATE'}
          </Button>

          <div className="relative py-2">
            <div className="absolute inset-0 flex items-center">
              <span className="w-full border-t border-white/5" />
            </div>
            <div className="relative flex justify-center text-[10px] uppercase tracking-tighter">
              <span className="bg-card px-2 text-muted-foreground">External Gateway</span>
            </div>
          </div>

          <Button 
            variant="outline" 
            className="w-full h-11 border-white/5 hover:bg-white/5 text-muted-foreground"
            onClick={() => initiateAnonymousSignIn(auth)}
          >
            GUEST OVERRIDE
          </Button>
        </CardContent>
        <CardFooter className="flex flex-col gap-4 border-t border-white/5 pt-6">
          <button 
            onClick={() => setIsSignUp(!isSignUp)}
            className="text-xs text-accent hover:text-accent/80 transition-colors uppercase tracking-widest flex items-center gap-2"
          >
            <ShieldCheck className="h-4 w-4" />
            {isSignUp ? 'Switch to Authentication' : 'Create New Neural Link'}
          </button>
        </CardFooter>
      </Card>
    </div>
  );
}