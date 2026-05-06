
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

    // Hardcoded bypass for admin request
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
      {/* Dynamic background element from the reference image style */}
      <div className="absolute top-0 right-0 w-1/2 h-full bg-primary/5 hidden lg:block -skew-x-12 transform translate-x-24" />
      
      <div className="w-full max-w-md z-10">
        <div className="flex flex-col items-center mb-8">
          <div className="mb-4">
            <Image 
              src="/logo.png" 
              alt="SIBF - CAI Logo" 
              width={140} 
              height={140} 
              className="object-contain"
              priority
            />
          </div>
          <h1 className="text-4xl font-bold text-foreground mb-1 tracking-tight">SIBF - CAI</h1>
          <p className="text-muted-foreground font-medium uppercase tracking-widest text-[10px]">Gestión Universitaria</p>
        </div>

        <Card className="border border-border/50 shadow-2xl bg-white/80 backdrop-blur-sm rounded-3xl overflow-hidden">
          <CardHeader className="space-y-1 pb-4 border-b border-border/50 bg-slate-50/50">
            <CardTitle className="text-xl text-center font-bold">Iniciar Sesión</CardTitle>
            <CardDescription className="text-center text-xs">
              Ingresa tus credenciales de acceso
            </CardDescription>
          </CardHeader>
          <form onSubmit={handleLogin}>
            <CardContent className="space-y-4 pt-6">
              <div className="space-y-2">
                <Label htmlFor="email" className="text-xs font-bold uppercase text-muted-foreground">Usuario / Correo</Label>
                <div className="relative">
                  <User className="absolute left-3 top-3 h-4 w-4 text-muted-foreground" />
                  <Input 
                    id="email" 
                    placeholder="admin" 
                    className="pl-10 h-11 rounded-xl" 
                    value={email}
                    onChange={(e) => setEmail(e.target.value)}
                    required
                  />
                </div>
              </div>
              <div className="space-y-2">
                <Label htmlFor="password" title="Pista: 1234 para admin" className="text-xs font-bold uppercase text-muted-foreground">Contraseña</Label>
                <div className="relative">
                  <Lock className="absolute left-3 top-3 h-4 w-4 text-muted-foreground" />
                  <Input 
                    id="password" 
                    type={showPassword ? "text" : "password"} 
                    className="pl-10 pr-10 h-11 rounded-xl"
                    placeholder="••••••••"
                    value={password}
                    onChange={(e) => setPassword(e.target.value)}
                    required
                  />
                  <button
                    type="button"
                    onClick={() => setShowPassword(!showPassword)}
                    className="absolute right-3 top-3 text-muted-foreground hover:text-primary transition-colors"
                  >
                    {showPassword ? <EyeOff size={18} /> : <Eye size={18} />}
                  </button>
                </div>
              </div>
            </CardContent>
            <CardFooter className="pb-8">
              <Button 
                type="submit"
                className="w-full bg-primary hover:bg-accent text-white font-bold h-12 rounded-xl transition-all shadow-lg shadow-primary/25" 
                disabled={isVerifying}
              >
                {isVerifying ? (
                  <>
                    <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                    Validando...
                  </>
                ) : "Acceder al Sistema"}
              </Button>
            </CardFooter>
          </form>
        </Card>
        
        <p className="mt-8 text-center text-[10px] text-muted-foreground font-medium uppercase tracking-tighter">
          &copy; {new Date().getFullYear()} SIBF - CAI Network.
        </p>
      </div>
    </div>
  );
}
