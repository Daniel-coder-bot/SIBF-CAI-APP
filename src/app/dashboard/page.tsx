
"use client";

import React, { useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { 
  AlertCircle,
  Loader2,
  CheckCircle
} from 'lucide-react';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { useUser } from '@/firebase';

export default function DashboardPage() {
  const { user, isUserLoading } = useUser();
  const router = useRouter();

  const activeMatricula = typeof window !== 'undefined' ? sessionStorage.getItem('active_matricula') : null;

  useEffect(() => {
    if (isUserLoading) return;
    
    // Redirección inmediata según el rol
    if (activeMatricula) {
      router.push('/dashboard/alumno');
    } else if (user?.isAnonymous) {
      router.push('/dashboard/docente/asistencia');
    }
  }, [user, isUserLoading, router, activeMatricula]);

  if (isUserLoading || user?.isAnonymous || activeMatricula) {
    return (
      <div className="h-[60vh] flex items-center justify-center">
        <Loader2 className="w-8 h-8 animate-spin text-primary" />
      </div>
    );
  }

  return (
    <div className="space-y-8 animate-in fade-in duration-700">
      <div className="flex flex-col md:flex-row md:items-end justify-between gap-4 border-b border-slate-100 pb-8">
        <div>
          <div className="flex items-center gap-3 mb-2">
            <div className="w-1.5 h-8 bg-primary rounded-full" />
            <h1 className="text-3xl font-bold tracking-tight text-slate-900 uppercase">Panel Administrativo</h1>
          </div>
          <p className="text-muted-foreground font-medium text-base">
            Control Global <span className="text-primary font-bold">SIBF - CAI</span> | Gestión Central
          </p>
        </div>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
        <Card className="border border-slate-100 shadow-sm rounded-[2.5rem] overflow-hidden bg-white">
          <CardHeader className="p-8 pb-4">
            <CardTitle className="text-xl font-bold">Bienvenida al Administrador</CardTitle>
            <CardDescription className="text-sm font-medium">Gestiona la infraestructura educativa desde este portal.</CardDescription>
          </CardHeader>
          <CardContent className="p-8 pt-0 space-y-4">
            <p className="text-sm text-muted-foreground leading-relaxed">
              El sistema está listo para operar. Utiliza el menú lateral para gestionar los catálogos de la institución, el personal docente y los registros de asistencia global.
            </p>
            <div className="bg-primary/5 p-6 rounded-3xl border border-primary/10 flex items-start gap-4">
              <CheckCircle className="w-6 h-6 text-primary flex-shrink-0 mt-1" />
              <div>
                <h4 className="font-bold text-slate-900 text-sm">Estado del Sistema</h4>
                <p className="text-xs text-slate-600 font-medium mt-1">
                  Todos los módulos están operativos. La validación biométrica y el portal del alumno están sincronizados en tiempo real.
                </p>
              </div>
            </div>
          </CardContent>
        </Card>

        <Card className="border border-slate-100 shadow-sm rounded-[2.5rem] bg-slate-900 text-white overflow-hidden">
          <CardHeader className="p-8">
            <CardTitle className="text-xl font-bold flex items-center gap-2">
              <AlertCircle className="w-5 h-5 text-primary" />
              Estado del Sistema
            </CardTitle>
          </CardHeader>
          <CardContent className="p-8 pt-0 space-y-6">
            <div className="flex items-center justify-between border-b border-white/10 pb-4">
              <span className="text-xs font-bold uppercase tracking-widest text-white/60">Base de Datos</span>
              <span className="text-xs font-bold text-green-400 uppercase">Conectada</span>
            </div>
            <div className="flex items-center justify-between border-b border-white/10 pb-4">
              <span className="text-xs font-bold uppercase tracking-widest text-white/60">Autenticación</span>
              <span className="text-xs font-bold text-green-400 uppercase">Activa</span>
            </div>
            <div className="flex items-center justify-between">
              <span className="text-xs font-bold uppercase tracking-widest text-white/60">Biometría AI</span>
              <span className="text-xs font-bold text-green-400 uppercase">Lista</span>
            </div>
          </CardContent>
        </Card>
      </div>
    </div>
  );
}
