
"use client";

import React, { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import Image from 'next/image';
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Card, CardContent, CardHeader, CardTitle, CardDescription, CardFooter } from "@/components/ui/card";
import { Eye, EyeOff, Lock, User, Loader2 } from 'lucide-react';
import { useToast } from "@/hooks/use-toast";

import { useAuth, useUser, useFirestore, initiateAnonymousSignIn } from '@/firebase';
import { collection, query, where, getDocs, limit } from 'firebase/firestore';

export default function LoginPage() {
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [showPassword, setShowPassword] = useState(false);
  const [isVerifying, setIsVerifying] = useState(false);
  
  const router = useRouter();
  const { toast } = useToast();
  const auth = useAuth();
  const db = useFirestore();
  const { user, isUserLoading } = useUser();

  useEffect(() => {
    if (user && !isVerifying) {
      router.push('/dashboard');
    }
  }, [user, router, isVerifying]);

  const handleLogin = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsVerifying(true);

    // Bypass para acceso de administrador (demo)
    if (email === 'admin' && password === '1234') {
        initiateAnonymousSignIn(auth);
        toast({
          title: `Bienvenido, Administrador`,
          description: "Acceso maestro concedido.",
        });
        setTimeout(() => { router.push('/dashboard'); }, 800);
        return;
    }

    try {
      const usersRef = collection(db, 'users');
      const q = query(
        usersRef, 
        where("email", "==", email), 
        where("password", "==", password), 
        limit(1)
      );
      
      const querySnapshot = await getDocs(q);

      if (!querySnapshot.empty) {
        const userData = querySnapshot.docs[0].data();
        initiateAnonymousSignIn(auth);
        toast({
          title: `Bienvenido, ${userData.firstName}`,
          description: "Acceso concedido.",
        });
        setTimeout(() => { router.push('/dashboard'); }, 800);
      } else {
        toast({
          variant: "destructive",
          title: "Error de acceso",
          description: "Credenciales incorrectas.",
        });
        setIsVerifying(false);
      }
    } catch (error: any) {
      console.error("Login Error:", error);
      toast({
        variant: "destructive",
        title: "Error de conexión",
        description: "No se pudo validar el acceso.",
      });
      setIsVerifying(false);
    }
  };

  if (isUserLoading) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-white">
        <Loader2 className="w-12 h-12 animate-spin text-primary" />
      </div>
    );
  }

  return (
    <div className="min-h-screen flex items-center justify-center p-4 relative overflow-hidden bg-white">
      {/* Elemento decorativo de fondo */}
      <div className="absolute top-0 right-0 w-1/2 h-full bg-primary/5 hidden lg:block -skew-x-12 transform translate-x-24" />
      
      <div className="w-full max-w-md z-10 flex flex-col items-center">
        <div className="flex flex-col items-center mb-10 w-full">
          <div className="mb-6 transform hover:scale-105 transition-transform duration-500">
            <Image 
              src="/logo.png" 
              alt="SIBF - CAI Logo" 
              width={380} 
              height={380} 
              className="object-contain drop-shadow-xl"
              priority
            />
          </div>
          <div className="text-center">
            <h1 className="text-4xl font-black text-foreground mb-1 tracking-tighter uppercase">SIBF - CAI</h1>
            <p className="text-muted-foreground font-black uppercase tracking-[0.3em] text-[10px] bg-slate-100 px-3 py-1 rounded-full">Gestión Universitaria</p>
          </div>
        </div>

        <Card className="w-full border border-border/50 shadow-2xl bg-white/90 backdrop-blur-md rounded-[2.5rem] overflow-hidden">
          <CardHeader className="space-y-1 pb-6 pt-8 border-b border-border/50 bg-slate-50/50">
            <CardTitle className="text-2xl text-center font-black tracking-tight text-slate-900 uppercase">Iniciar Sesión</CardTitle>
            <CardDescription className="text-center text-[11px] font-bold uppercase tracking-widest text-muted-foreground">
              Credenciales de acceso
            </CardDescription>
          </CardHeader>
          <form onSubmit={handleLogin}>
            <CardContent className="space-y-6 pt-8 px-8">
              <div className="space-y-2">
                <Label htmlFor="email" className="text-[10px] font-black uppercase text-muted-foreground tracking-widest ml-1">Usuario / Correo</Label>
                <div className="relative group">
                  <User className="absolute left-4 top-3.5 h-5 w-5 text-muted-foreground group-focus-within:text-primary transition-colors" />
                  <Input 
                    id="email" 
                    placeholder="admin" 
                    className="pl-12 h-12 rounded-2xl border-slate-200 bg-slate-50/50 focus:bg-white transition-all text-sm font-medium" 
                    value={email}
                    onChange={(e) => setEmail(e.target.value)}
                    required
                  />
                </div>
              </div>
              <div className="space-y-2">
                <Label htmlFor="password" title="Pista: 1234 para admin" className="text-[10px] font-black uppercase text-muted-foreground tracking-widest ml-1">Contraseña</Label>
                <div className="relative group">
                  <Lock className="absolute left-4 top-3.5 h-5 w-5 text-muted-foreground group-focus-within:text-primary transition-colors" />
                  <Input 
                    id="password" 
                    type={showPassword ? "text" : "password"} 
                    className="pl-12 pr-12 h-12 rounded-2xl border-slate-200 bg-slate-50/50 focus:bg-white transition-all text-sm font-medium"
                    placeholder="••••••••"
                    value={password}
                    onChange={(e) => setPassword(e.target.value)}
                    required
                  />
                  <button
                    type="button"
                    onClick={() => setShowPassword(!showPassword)}
                    className="absolute right-4 top-3.5 text-muted-foreground hover:text-primary transition-colors"
                  >
                    {showPassword ? <EyeOff size={20} /> : <Eye size={20} />}
                  </button>
                </div>
              </div>
            </CardContent>
            <CardFooter className="pb-10 pt-4 px-8">
              <Button 
                type="submit"
                className="w-full bg-primary hover:bg-accent text-white font-black text-xs uppercase tracking-widest h-14 rounded-2xl transition-all shadow-xl shadow-primary/25 active:scale-[0.98]" 
                disabled={isVerifying}
              >
                {isVerifying ? (
                  <>
                    <Loader2 className="mr-2 h-5 w-5 animate-spin" />
                    Validando...
                  </>
                ) : "Acceder al Sistema"}
              </Button>
            </CardFooter>
          </form>
        </Card>
        
        <p className="mt-10 text-center text-[10px] text-muted-foreground font-black uppercase tracking-[0.2em] opacity-60">
          &copy; {new Date().getFullYear()} SIBF - CAI Network
        </p>
      </div>
    </div>
  );
}
