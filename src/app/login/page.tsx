
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

    if (email === 'admin' && password === '1234') {
        initiateAnonymousSignIn(auth);
        toast({ title: `Bienvenido`, description: "Acceso administrativo." });
        setTimeout(() => { router.push('/dashboard'); }, 800);
        return;
    }

    try {
      const usersRef = collection(db, 'users');
      const q = query(usersRef, where("email", "==", email), where("password", "==", password), limit(1));
      const querySnapshot = await getDocs(q);

      if (!querySnapshot.empty) {
        initiateAnonymousSignIn(auth);
        toast({ title: "Acceso concedido" });
        setTimeout(() => { router.push('/dashboard'); }, 800);
      } else {
        toast({ variant: "destructive", title: "Error", description: "Credenciales inválidas." });
        setIsVerifying(false);
      }
    } catch (error: any) {
      toast({ variant: "destructive", title: "Error", description: "No se pudo conectar." });
      setIsVerifying(false);
    }
  };

  if (isUserLoading) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-white">
        <Loader2 className="w-10 h-10 animate-spin text-primary" />
      </div>
    );
  }

  return (
    <div className="min-h-screen flex items-center justify-center p-4 bg-white relative overflow-hidden">
      <div className="absolute top-0 right-0 w-1/2 h-full bg-primary/[0.02] hidden lg:block -skew-x-12 transform translate-x-24" />
      
      <div className="w-full max-w-md z-10 flex flex-col items-center">
        <div className="flex flex-col items-center mb-8">
          <Image src="/logo.png" alt="SIBF - CAI Logo" width={280} height={280} className="object-contain mb-4" priority />
          <div className="text-center">
            <h1 className="text-3xl font-bold text-foreground tracking-tight uppercase">SIBF - CAI</h1>
            <p className="text-muted-foreground font-semibold uppercase tracking-[0.2em] text-[10px] bg-slate-50 px-3 py-1 rounded-full mt-2">Gestión Universitaria</p>
          </div>
        </div>

        <Card className="w-full border shadow-xl bg-white/80 backdrop-blur-sm rounded-[2rem] overflow-hidden">
          <CardHeader className="space-y-1 pb-6 pt-8 text-center border-b bg-slate-50/30">
            <CardTitle className="text-xl font-bold tracking-tight uppercase">Iniciar Sesión</CardTitle>
            <CardDescription className="text-[10px] font-bold uppercase tracking-widest text-muted-foreground">Credenciales de acceso</CardDescription>
          </CardHeader>
          <form onSubmit={handleLogin}>
            <CardContent className="space-y-5 pt-8 px-8">
              <div className="space-y-2">
                <Label className="text-[10px] font-bold uppercase text-muted-foreground tracking-widest ml-1">Usuario</Label>
                <div className="relative">
                  <User className="absolute left-4 top-3.5 h-4 w-4 text-muted-foreground" />
                  <Input placeholder="admin" className="pl-12 h-11 rounded-xl font-medium" value={email} onChange={(e) => setEmail(e.target.value)} required />
                </div>
              </div>
              <div className="space-y-2">
                <Label className="text-[10px] font-bold uppercase text-muted-foreground tracking-widest ml-1">Contraseña</Label>
                <div className="relative">
                  <Lock className="absolute left-4 top-3.5 h-4 w-4 text-muted-foreground" />
                  <Input type={showPassword ? "text" : "password"} placeholder="••••••••" className="pl-12 pr-12 h-11 rounded-xl font-medium" value={password} onChange={(e) => setPassword(e.target.value)} required />
                </div>
              </div>
            </CardContent>
            <CardFooter className="pb-10 pt-4 px-8">
              <Button type="submit" className="w-full bg-primary hover:bg-accent text-white font-bold text-xs uppercase tracking-widest h-12 rounded-xl shadow-lg" disabled={isVerifying}>
                {isVerifying ? <Loader2 className="h-4 w-4 animate-spin" /> : "Acceder"}
              </Button>
            </CardFooter>
          </form>
        </Card>
      </div>
    </div>
  );
}
