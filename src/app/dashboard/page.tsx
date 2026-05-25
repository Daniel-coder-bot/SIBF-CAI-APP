
"use client";

import React, { useEffect, useState } from 'react';
import { useRouter } from 'next/navigation';
import { 
  Users, 
  GraduationCap, 
  Briefcase, 
  Clock, 
  AlertCircle,
  FileText,
  UserCheck,
  Database,
  Loader2,
  CheckCircle
} from 'lucide-react';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { cn } from "@/lib/utils";
import { useUser, useFirestore, useMemoFirebase, useCollection } from '@/firebase';
import { collection, query, where, limit, addDoc, serverTimestamp } from 'firebase/firestore';
import { useToast } from "@/hooks/use-toast";

export default function DashboardPage() {
  const { user, isUserLoading } = useUser();
  const router = useRouter();
  const db = useFirestore();
  const { toast } = useToast();
  const [isSeeding, setIsSeeding] = useState(false);

  const activeMatricula = typeof window !== 'undefined' ? sessionStorage.getItem('active_matricula') : null;

  useEffect(() => {
    if (isUserLoading) return;
    
    // Redirección inmediata si no es administrador
    if (activeMatricula) {
      router.push('/dashboard/alumno');
    } else if (user?.isAnonymous) {
      router.push('/dashboard/docente/asistencia');
    }
  }, [user, isUserLoading, router, activeMatricula]);

  const handleSeedData = async () => {
    setIsSeeding(true);
    try {
      // 1. Crear Sede
      const sedeRef = await addDoc(collection(db, 'sedes'), { nombre: 'Campus Central', ubicacion: 'Av. Universidad 123' });
      
      // 2. Crear Carrera
      const carreraRef = await addDoc(collection(db, 'carreras'), { nombre: 'Ingeniería en Sistemas', sedeId: sedeRef.id });
      
      // 3. Crear Materia
      const materiaRef = await addDoc(collection(db, 'materias'), { 
        nombre: 'Programación Avanzada', 
        codigo: 'PROG-101', 
        carreraId: carreraRef.id, 
        cuatrimestre: '1' 
      });

      // 4. Crear Grupo
      const grupoRef = await addDoc(collection(db, 'grupos'), { 
        nombre: 'G-101', 
        carreraId: carreraRef.id, 
        cuatrimestre: '1' 
      });

      // 5. Crear Alumno Demo (para que se pueda loguear con 2024001)
      const alumnoRef = await addDoc(collection(db, 'users'), {
        firstName: 'Carlos',
        lastName: 'Demo',
        email: 'carlos@demo.edu',
        role: 'Alumno',
        matricula: '2024001',
        carreraId: carreraRef.id,
        grupoId: grupoRef.id,
        createdAt: serverTimestamp()
      });

      // 6. Crear Asistencia (Falta) para el alumno demo
      await addDoc(collection(db, 'asistencias'), {
        alumnoId: alumnoRef.id,
        docenteId: 'docente-demo',
        grupoId: grupoRef.id,
        materiaId: materiaRef.id,
        fecha: new Date().toISOString().split('T')[0],
        estado: 'Falta',
        createdAt: serverTimestamp()
      });

      toast({ title: "Base de Datos Poblada", description: "Se han creado registros de prueba exitosamente." });
    } catch (error) {
      console.error(error);
      toast({ variant: "destructive", title: "Error al poblar", description: "No se pudieron crear los datos." });
    } finally {
      setIsSeeding(false);
    }
  };

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
        
        <Button 
          onClick={handleSeedData} 
          disabled={isSeeding}
          className="bg-slate-900 hover:bg-slate-800 text-white rounded-2xl h-12 px-6 font-bold uppercase text-[10px] tracking-widest shadow-xl transition-all"
        >
          {isSeeding ? <Loader2 className="w-4 h-4 animate-spin mr-2" /> : <Database className="w-4 h-4 mr-2" />}
          Poblar Base de Datos Demo
        </Button>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
        <Card className="border border-slate-100 shadow-sm rounded-[2.5rem] overflow-hidden bg-white">
          <CardHeader className="p-8 pb-4">
            <CardTitle className="text-xl font-bold">Bienvenida al Administrador</CardTitle>
            <CardDescription className="text-sm font-medium">Gestiona la infraestructura educativa desde este portal.</CardDescription>
          </CardHeader>
          <CardContent className="p-8 pt-0 space-y-4">
            <p className="text-sm text-muted-foreground leading-relaxed">
              Utiliza el botón superior para cargar datos iniciales si la base de datos está vacía. Esto creará una carrera, un grupo, un alumno demo y registros de asistencia para que puedas probar todas las vistas del sistema.
            </p>
            <div className="bg-primary/5 p-6 rounded-3xl border border-primary/10 flex items-start gap-4">
              <CheckCircle className="w-6 h-6 text-primary flex-shrink-0 mt-1" />
              <div>
                <h4 className="font-bold text-slate-900 text-sm">Instrucciones de Demo</h4>
                <p className="text-xs text-slate-600 font-medium mt-1">
                  1. Carga los datos demo.<br/>
                  2. Cierra sesión.<br/>
                  3. Entra con matrícula <span className="font-bold text-primary">2024001</span> (sin contraseña) para ver el portal del alumno.<br/>
                  4. Entra como <span className="font-bold text-primary">docente</span> con clave <span className="font-bold text-primary">1234</span> para pasar lista.
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
