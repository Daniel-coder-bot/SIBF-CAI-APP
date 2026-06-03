
"use client";

import React, { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import Image from 'next/image';
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Card, CardContent, CardHeader, CardTitle, CardDescription, CardFooter } from "@/components/ui/card";
import { Lock, User, Loader2 } from 'lucide-react';
import { useToast } from "@/hooks/use-toast";

import { useAuth, useUser, useFirestore, initiateAnonymousSignIn } from '@/firebase';
import { collection, query, where, getDocs, limit } from 'firebase/firestore';

export default function LoginPage() {
  const [identifier, setIdentifier] = useState('');
  const [password, setPassword] = useState('');
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

    // Accesos directos administrativos para la demo
    if (identifier === 'admin' && password === '1234') {
        if (typeof window !== 'undefined') {
          sessionStorage.setItem('demo_role', 'admin');
        }
        initiateAnonymousSignIn(auth);
        toast({ title: "Bienvenido Admin", description: "Acceso administrativo concedido." });
        return;
    }

    if (identifier === 'docente' && password === '1234') {
        if (typeof window !== 'undefined') {
          sessionStorage.setItem('demo_role', 'docente');
        }
        initiateAnonymousSignIn(auth);
        toast({ title: "Bienvenido Docente", description: "Acceso al panel académico concedido." });
        return;
    }

    try {
      const usersRef = collection(db, 'users');
      
      // Intento de login por matrícula (Alumno)
      const qMatricula = query(usersRef, where("matricula", "==", identifier), limit(1));
      const queryMatricula = await getDocs(qMatricula);

      if (!queryMatricula.empty) {
        const studentData = queryMatricula.docs[0].data();
        if (typeof window !== 'undefined') {
          sessionStorage.setItem('active_matricula', identifier);
        }
        initiateAnonymousSignIn(auth);
        toast({ title: `Hola, ${studentData.firstName}`, description: "Has ingresado como alumno." });
        return;
      }

      // Intento de login por email/password (Personal)
      const qEmail = query(usersRef, where("email", "==", identifier), where("password", "==", password), limit(1));
      const queryEmail = await getDocs(qEmail);

      if (!queryEmail.empty) {
        initiateAnonymousSignIn(auth);
        toast({ title: "Acceso concedido" });
      } else {
        toast({ variant: "destructive", title: "Error", description: "Credenciales no encontradas." });
        setIsVerifying(false);
      }
    } catch (error: any) {
      toast({ variant: "destructive", title: "Error", description: "No se pudo conectar al servidor." });
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
          <div className="w-20 h-20 bg-primary rounded-3xl flex items-center justify-center mb-4 shadow-lg shadow-primary/20">
            <User className="w-10 h-10 text-white" />
          </div>
          <div className="text-center">
            <h1 className="text-3xl font-bold text-foreground tracking-tight uppercase">SIBF - CAI</h1>
            <p className="text-muted-foreground font-semibold uppercase tracking-[0.2em] text-[10px] bg-slate-50 px-3 py-1 rounded-full mt-2">Gestión Universitaria</p>
          </div>
        </div>

        <Card className="w-full border shadow-xl bg-white/80 backdrop-blur-sm rounded-[2rem] overflow-hidden">
          <CardHeader className="space-y-1 pb-6 pt-8 text-center border-b bg-slate-50/30">
            <CardTitle className="text-xl font-bold tracking-tight uppercase">Acceso Estudiantil y Personal</CardTitle>
            <CardDescription className="text-[10px] font-bold uppercase tracking-widest text-muted-foreground">Ingresa tu matrícula o correo institucional</CardDescription>
          </CardHeader>
          <form onSubmit={handleLogin}>
            <CardContent className="space-y-5 pt-8 px-8">
              <div className="space-y-2">
                <Label className="text-[10px] font-bold uppercase text-muted-foreground tracking-widest ml-1">Usuario / Matrícula</Label>
                <div className="relative">
                  <User className="absolute left-4 top-3.5 h-4 w-4 text-muted-foreground" />
                  <Input placeholder="Matrícula o Email" className="pl-12 h-11 rounded-xl font-medium" value={identifier} onChange={(e) => setIdentifier(e.target.value)} required />
                </div>
              </div>
              <div className="space-y-2">
                <Label className="text-[10px] font-bold uppercase text-muted-foreground tracking-widest ml-1">Contraseña (Solo Personal)</Label>
                <div className="relative">
                  <Lock className="absolute left-4 top-3.5 h-4 w-4 text-muted-foreground" />
                  <Input type="password" placeholder="••••••••" className="pl-12 h-11 rounded-xl font-medium" value={password} onChange={(e) => setPassword(e.target.value)} />
                </div>
                <p className="text-[9px] text-muted-foreground px-1 italic">Si eres alumno, deja la contraseña en blanco e ingresa tu matrícula arriba.</p>
              </div>
            </CardContent>
            <CardFooter className="pb-10 pt-4 px-8">
              <Button type="submit" className="w-full bg-primary hover:bg-accent text-white font-bold text-xs uppercase tracking-widest h-12 rounded-xl shadow-lg" disabled={isVerifying}>
                {isVerifying ? <Loader2 className="h-4 w-4 animate-spin" /> : "Ingresar al Portal"}
              </Button>
            </CardFooter>
          </form>
        </Card>
      </div>
    </div>
  );
}
