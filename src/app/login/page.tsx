"use client";

import React, { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Card, CardContent, CardHeader, CardTitle, CardDescription, CardFooter } from "@/components/ui/card";
import { Eye, EyeOff, Lock, User, GraduationCap, Loader2 } from 'lucide-react';
import { useToast } from "@/hooks/use-toast";

// Firebase Imports
import { useAuth, useUser, initiateAnonymousSignIn } from '@/firebase';

export default function LoginPage() {
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [showPassword, setShowPassword] = useState(false);
  const [isVerifying, setIsVerifying] = useState(false);
  
  const router = useRouter();
  const { toast } = useToast();
  const auth = useAuth();
  const { user, isUserLoading } = useUser();

  // Redirigir si ya está logueado
  useEffect(() => {
    if (user && !isVerifying) {
      router.push('/dashboard');
    }
  }, [user, router, isVerifying]);

  const handleLogin = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsVerifying(true);

    // Simulación de validación de credenciales administrativas
    if (email === "admin" && password === "1234") {
      try {
        // Iniciamos sesión real en Firebase (Anónima para este MVP)
        // Esto otorgará un UID y permitirá que las reglas de Firestore pasen el check isSignedIn()
        initiateAnonymousSignIn(auth);
        
        toast({
          title: "Acceso concedido",
          description: "Sincronizando con el servidor de seguridad...",
        });
        
        // Damos un pequeño margen para que el estado de auth se propague
        setTimeout(() => {
          router.push('/dashboard');
        }, 800);
      } catch (error) {
        toast({
          variant: "destructive",
          title: "Error de conexión",
          description: "No se pudo establecer comunicación con Firebase.",
        });
        setIsVerifying(false);
      }
    } else {
      toast({
        variant: "destructive",
        title: "Error de acceso",
        description: "Credenciales incorrectas. Intente con admin / 1234",
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
      {/* Fondo Decorativo Sutil */}
      <div className="absolute top-0 right-0 w-1/2 h-full bg-primary/5 hidden lg:block -skew-x-12 transform translate-x-24" />
      
      <div className="w-full max-w-md z-10">
        <div className="flex flex-col items-center mb-8">
          <div className="bg-primary p-3 rounded-2xl shadow-lg shadow-primary/20 mb-4">
            <GraduationCap className="w-12 h-12 text-white" />
          </div>
          <h1 className="text-4xl font-bold text-primary mb-1 tracking-tight">UniAttend</h1>
          <p className="text-muted-foreground font-medium uppercase tracking-widest text-[10px]">Portal Administrativo</p>
        </div>

        <Card className="border border-border/50 shadow-2xl bg-white/80 backdrop-blur-sm rounded-3xl overflow-hidden">
          <CardHeader className="space-y-1 pb-4 border-b border-border/50 bg-slate-50/50">
            <CardTitle className="text-xl text-center font-bold">Iniciar Sesión</CardTitle>
            <CardDescription className="text-center text-xs">
              Ingrese sus credenciales de administrador
            </CardDescription>
          </CardHeader>
          <form onSubmit={handleLogin}>
            <CardContent className="space-y-4 pt-6">
              <div className="space-y-2">
                <Label htmlFor="email" className="text-xs font-bold uppercase text-muted-foreground">Usuario</Label>
                <div className="relative">
                  <User className="absolute left-3 top-3 h-4 w-4 text-muted-foreground" />
                  <Input 
                    id="email" 
                    placeholder="admin" 
                    className="pl-10 h-11 rounded-xl" 
                    value={email}
                    onChange={(e) => setEmail(e.target.value)}
                    required
                    autoComplete="username"
                  />
                </div>
              </div>
              <div className="space-y-2">
                <Label htmlFor="password" title="Pista: 1234" className="text-xs font-bold uppercase text-muted-foreground">Contraseña</Label>
                <div className="relative">
                  <Lock className="absolute left-3 top-3 h-4 w-4 text-muted-foreground" />
                  <Input 
                    id="password" 
                    type={showPassword ? "text" : "password"} 
                    className="pl-10 pr-10 h-11 rounded-xl"
                    placeholder="••••"
                    value={password}
                    onChange={(e) => setPassword(e.target.value)}
                    required
                    autoComplete="current-password"
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
                className="w-full bg-primary hover:bg-primary/90 text-white font-bold h-12 rounded-xl transition-all shadow-lg shadow-primary/25" 
                disabled={isVerifying}
              >
                {isVerifying ? (
                  <>
                    <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                    Autenticando...
                  </>
                ) : "Acceder al Sistema"}
              </Button>
            </CardFooter>
          </form>
        </Card>
        
        <p className="mt-8 text-center text-[10px] text-muted-foreground font-medium uppercase tracking-tighter">
          &copy; {new Date().getFullYear()} UniAttend Network. Control de Acceso Universitario.
        </p>
      </div>
    </div>
  );
}