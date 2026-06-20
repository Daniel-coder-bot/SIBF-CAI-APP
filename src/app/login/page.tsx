"use client";

import React, { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import Image from 'next/image';
import { 
  Lock, 
  User, 
  Loader2, 
  Eye, 
  EyeOff, 
  Scan, 
  ShieldCheck, 
  Cpu, 
  Camera
} from 'lucide-react';
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { useToast } from "@/hooks/use-toast";
import { cn } from "@/lib/utils";

import { useAuth, useUser, useFirestore, initiateAnonymousSignIn } from '@/firebase';
import { collection, query, where, getDocs, limit } from 'firebase/firestore';

export default function LoginPage() {
  const [identifier, setIdentifier] = useState('');
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
    <div className="min-h-screen flex flex-col md:flex-row bg-white overflow-hidden font-body">
      {/* Sección Izquierda - Contenido Visual */}
      <div className="hidden md:flex md:w-1/2 relative bg-slate-900 overflow-hidden">
        <Image 
          src="https://picsum.photos/seed/tech_security/1200/1600" 
          alt="Tecnología de Seguridad"
          fill
          className="object-cover opacity-60 mix-blend-overlay"
          data-ai-hint="facial recognition biometric security technology"
        />
        
        <div className="absolute inset-0 bg-gradient-to-br from-primary/40 to-black/60" />

        <div className="relative z-10 flex flex-col justify-center px-12 lg:px-20 h-full w-full">
          <div className="backdrop-blur-xl bg-white/10 border border-white/20 p-8 lg:p-12 rounded-[2.5rem] shadow-2xl animate-in fade-in slide-in-from-left duration-1000">
            <h1 className="text-4xl lg:text-6xl font-black text-white tracking-tighter mb-4 uppercase font-headline">
              SIBF-CAI
            </h1>
            <p className="text-lg lg:text-xl font-bold text-white/90 leading-tight mb-6">
              Sistema de Identificación Biométrica Facial Aplicado al Control de Asistencia Institucional.
            </p>
            <p className="text-sm lg:text-base text-white/70 font-medium leading-relaxed mb-10 max-w-md">
              Optimiza el control de asistencia mediante tecnologías biométricas de reconocimiento facial, garantizando precisión, seguridad y eficiencia en la gestión institucional.
            </p>

            <div className="grid grid-cols-1 gap-6">
              <div className="flex items-center gap-4 group">
                <div className="bg-white/10 p-3 rounded-2xl group-hover:bg-primary/30 transition-colors">
                  <Scan className="w-6 h-6 text-white" />
                </div>
                <div>
                  <p className="text-white font-bold text-sm">Reconocimiento en tiempo real</p>
                  <p className="text-white/50 text-[10px] uppercase font-bold tracking-widest">Validación Instantánea</p>
                </div>
              </div>
              <div className="flex items-center gap-4 group">
                <div className="bg-white/10 p-3 rounded-2xl group-hover:bg-primary/30 transition-colors">
                  <ShieldCheck className="w-6 h-6 text-white" />
                </div>
                <div>
                  <p className="text-white font-bold text-sm">Alta precisión biométrica</p>
                  <p className="text-white/50 text-[10px] uppercase font-bold tracking-widest">Descriptor de 128 puntos</p>
                </div>
              </div>
              <div className="flex items-center gap-4 group">
                <div className="bg-white/10 p-3 rounded-2xl group-hover:bg-primary/30 transition-colors">
                  <Cpu className="w-6 h-6 text-white" />
                </div>
                <div>
                  <p className="text-white font-bold text-sm">Control automatizado</p>
                  <p className="text-white/50 text-[10px] uppercase font-bold tracking-widest">Gestión Inteligente</p>
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* Sección Derecha - Formulario */}
      <div className="w-full md:w-1/2 flex flex-col justify-between p-8 md:p-16 lg:p-24 bg-white relative">
        <div className="w-full max-w-md mx-auto flex-1 flex flex-col justify-center">
          <div className="mb-10 text-center md:text-left animate-in fade-in slide-in-from-right duration-700">
            <div className="flex items-center justify-center md:justify-start gap-4 mb-6">
              <Image 
                src="/logo.png" 
                alt="SIBF-CAI Logo" 
                width={70} 
                height={70} 
                className="object-contain"
              />
              <span className="text-3xl font-black text-slate-900 tracking-tighter font-headline">SIBF-CAI</span>
            </div>
            <h2 className="text-3xl font-bold text-slate-900 tracking-tight">Bienvenido de vuelta</h2>
            <p className="text-muted-foreground font-medium mt-2">Ingrese sus credenciales para acceder al sistema.</p>
          </div>

          <form onSubmit={handleLogin} className="space-y-6 animate-in fade-in slide-in-from-bottom duration-1000 delay-200">
            <div className="space-y-2">
              <Label className="text-xs font-bold uppercase tracking-widest text-slate-500 ml-1">Usuario</Label>
              <div className="relative">
                <User className="absolute left-4 top-3.5 h-4 w-4 text-slate-400" />
                <Input 
                  placeholder="Ingrese su usuario institucional" 
                  className="pl-12 h-12 rounded-xl bg-slate-50 border-slate-200 focus:bg-white transition-all font-medium" 
                  value={identifier} 
                  onChange={(e) => setIdentifier(e.target.value)} 
                  required 
                />
              </div>
            </div>

            <div className="space-y-2">
              <div className="flex justify-between items-center px-1">
                <Label className="text-xs font-bold uppercase tracking-widest text-slate-500">Contraseña</Label>
                <button type="button" className="text-[10px] font-bold text-primary uppercase hover:underline">¿Olvidó su contraseña?</button>
              </div>
              <div className="relative">
                <Lock className="absolute left-4 top-3.5 h-4 w-4 text-slate-400" />
                <Input 
                  type={showPassword ? "text" : "password"} 
                  placeholder="Ingrese su contraseña" 
                  className="pl-12 pr-12 h-12 rounded-xl bg-slate-50 border-slate-200 focus:bg-white transition-all font-medium" 
                  value={password} 
                  onChange={(e) => setPassword(e.target.value)} 
                />
                <button 
                  type="button"
                  onClick={() => setShowPassword(!showPassword)}
                  className="absolute right-4 top-3.5 text-slate-400 hover:text-slate-600 transition-colors"
                >
                  {showPassword ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
                </button>
              </div>
            </div>

            <div className="space-y-3 pt-4">
              <Button 
                type="submit" 
                className="w-full bg-primary hover:bg-accent text-white font-bold text-sm uppercase tracking-widest h-14 rounded-2xl shadow-lg shadow-primary/10 transition-all hover:scale-[1.02] active:scale-[0.98]" 
                disabled={isVerifying}
              >
                {isVerifying ? <Loader2 className="h-5 w-5 animate-spin" /> : "Ingresar al Sistema"}
              </Button>
              
              <div className="relative flex items-center py-4">
                <div className="flex-grow border-t border-slate-100"></div>
                <span className="flex-shrink mx-4 text-[10px] font-bold text-slate-400 uppercase tracking-widest">O accede mediante</span>
                <div className="flex-grow border-t border-slate-100"></div>
              </div>

              <Button 
                type="button"
                variant="outline"
                className="w-full border-emerald-100 bg-emerald-50/50 hover:bg-emerald-50 text-emerald-700 font-bold text-sm uppercase tracking-widest h-14 rounded-2xl transition-all flex items-center justify-center gap-3"
              >
                <Camera className="w-5 h-5" />
                Iniciar con Reconocimiento Facial
              </Button>
            </div>
          </form>
        </div>

        <div className="mt-10 text-center border-t pt-8 animate-in fade-in duration-1000 delay-500">
          <p className="text-xs font-bold text-slate-900 uppercase tracking-tighter">SIBF-CAI © 2026</p>
          <p className="text-[9px] font-bold text-slate-400 uppercase tracking-widest mt-1">
            Sistema de Identificación Biométrica Facial Aplicado al Control de Asistencia Institucional
          </p>
        </div>
      </div>
    </div>
  );
}
