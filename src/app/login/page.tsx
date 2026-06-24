
"use client";

import React, { useState, useEffect, useMemo } from 'react';
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
  Camera,
  UserPlus,
  BookOpen,
  GraduationCap,
  Building2
} from 'lucide-react';
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { 
  Dialog, 
  DialogContent, 
  DialogHeader, 
  DialogTitle, 
  DialogTrigger,
  DialogFooter,
  DialogDescription
} from "@/components/ui/dialog";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { useToast } from "@/hooks/use-toast";
import { cn } from "@/lib/utils";
import { FacialRecognitionComponent } from '@/components/FacialRecognitionComponent';

import { useAuth, useUser, useFirestore, useCollection, useMemoFirebase, initiateAnonymousSignIn, addDocumentNonBlocking } from '@/firebase';
import { collection, query, where, getDocs, limit, serverTimestamp } from 'firebase/firestore';

export default function LoginPage() {
  const [identifier, setIdentifier] = useState('');
  const [password, setPassword] = useState('');
  const [showPassword, setShowPassword] = useState(false);
  const [isVerifying, setIsVerifying] = useState(false);
  
  // Registration States
  const [isRegDialogOpen, setIsRegDialogOpen] = useState(false);
  const [regStep, setRegStep] = useState(1);
  const [newStudent, setNewStudent] = useState({
    firstName: '',
    lastName: '',
    email: '',
    password: '',
    matricula: '',
    carreraId: '',
    grupoId: '',
    faceDescriptor: null as number[] | null
  });

  const router = useRouter();
  const { toast } = useToast();
  const auth = useAuth();
  const db = useFirestore();
  const { user, isUserLoading } = useUser();

  const carrerasRef = useMemoFirebase(() => collection(db, 'carreras'), [db]);
  const gruposRef = useMemoFirebase(() => collection(db, 'grupos'), [db]);
  
  const { data: carreras } = useCollection(carrerasRef);
  const { data: grupos } = useCollection(gruposRef);

  // Filtrar grupos por carrera seleccionada
  const filteredGrupos = useMemo(() => {
    if (!newStudent.carreraId || !grupos) return [];
    return grupos.filter(g => g.carreraId === newStudent.carreraId);
  }, [newStudent.carreraId, grupos]);

  useEffect(() => {
    if (user && !isVerifying && !isRegDialogOpen) {
      router.push('/dashboard');
    }
  }, [user, router, isVerifying, isRegDialogOpen]);

  const handleLogin = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsVerifying(true);

    // Accesos rápidos de desarrollo
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
      
      // 1. Intentar buscar por Matrícula + Password (Alumnos)
      const qMatricula = query(usersRef, where("matricula", "==", identifier), where("password", "==", password), limit(1));
      const queryMatricula = await getDocs(qMatricula);

      if (!queryMatricula.empty) {
        const studentData = queryMatricula.docs[0].data();
        if (typeof window !== 'undefined') {
          sessionStorage.setItem('active_matricula', identifier);
        }
        initiateAnonymousSignIn(auth);
        toast({ title: `Hola, ${studentData.firstName}`, description: "Has ingresado correctamente." });
        return;
      }

      // 2. Intentar buscar por Email + Password (Docentes / Admins / Alumnos con email)
      const qEmail = query(usersRef, where("email", "==", identifier), where("password", "==", password), limit(1));
      const queryEmail = await getDocs(qEmail);

      if (!queryEmail.empty) {
        const userData = queryEmail.docs[0].data();
        
        // Si es un alumno que entró por email, también activar su matrícula en sesión
        if (userData.role === 'Alumno' && userData.matricula) {
            if (typeof window !== 'undefined') {
                sessionStorage.setItem('active_matricula', userData.matricula);
            }
        }
        
        initiateAnonymousSignIn(auth);
        toast({ title: "Acceso concedido" });
      } else {
        toast({ variant: "destructive", title: "Error", description: "Credenciales incorrectas. Verifique matrícula/correo y contraseña." });
        setIsVerifying(false);
      }
    } catch (error: any) {
      toast({ variant: "destructive", title: "Error", description: "No se pudo conectar al servidor." });
      setIsVerifying(false);
    }
  };

  const handleRegister = async () => {
    if (!newStudent.faceDescriptor) {
      toast({ variant: "destructive", title: "Falta Biometría", description: "Debes capturar tu rostro antes de finalizar." });
      return;
    }

    try {
      const usersRef = collection(db, 'users');
      const selectedCarrera = carreras?.find(c => c.id === newStudent.carreraId);
      
      await addDocumentNonBlocking(usersRef, {
        ...newStudent,
        role: 'Alumno',
        sedeId: selectedCarrera?.sedeId || '',
        createdAt: serverTimestamp(),
        updatedAt: serverTimestamp()
      });

      if (typeof window !== 'undefined') {
        sessionStorage.setItem('active_matricula', newStudent.matricula);
      }
      initiateAnonymousSignIn(auth);
      
      setIsRegDialogOpen(false);
      toast({ title: "Registro Exitoso", description: "Cuenta creada. Ahora puedes acceder con tu matrícula y contraseña." });
    } catch (error) {
      toast({ variant: "destructive", title: "Error", description: "No se pudo completar el registro." });
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
            <h1 className="text-4xl lg:text-6xl font-black text-white tracking-tighter mb-4 uppercase font-headline">SIBF-CAI</h1>
            <p className="text-lg lg:text-xl font-bold text-white/90 leading-tight mb-6">Sistema de Identificación Biométrica Facial Aplicado al Control de Asistencia Institucional.</p>
            <div className="grid grid-cols-1 gap-6">
              <div className="flex items-center gap-4 group">
                <div className="bg-white/10 p-3 rounded-2xl group-hover:bg-primary/30 transition-colors"><Scan className="w-6 h-6 text-white" /></div>
                <div><p className="text-white font-bold text-sm">Reconocimiento en tiempo real</p></div>
              </div>
              <div className="flex items-center gap-4 group">
                <div className="bg-white/10 p-3 rounded-2xl group-hover:bg-primary/30 transition-colors"><ShieldCheck className="w-6 h-6 text-white" /></div>
                <div><p className="text-white font-bold text-sm">Alta precisión biométrica</p></div>
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* Sección Derecha - Formulario */}
      <div className="w-full md:w-1/2 flex flex-col justify-between p-8 md:p-16 lg:p-24 bg-white relative">
        <div className="w-full max-w-md mx-auto flex-1 flex flex-col justify-center">
          <div className="mb-10 text-center md:text-left animate-in fade-in slide-in-from-right duration-700">
            <div className="flex flex-col items-center md:items-start gap-6 mb-8">
              <Image src="/logo.png" alt="SIBF-CAI Logo" width={350} height={350} className="object-contain drop-shadow-2xl" />
              <span className="text-4xl font-black text-slate-900 tracking-tighter font-headline uppercase">SIBF-CAI</span>
            </div>
            <h2 className="text-3xl font-bold text-slate-900 tracking-tight">Acceso al Sistema</h2>
            <p className="text-muted-foreground font-medium mt-2">Use su matrícula/correo y contraseña.</p>
          </div>

          <form onSubmit={handleLogin} className="space-y-6">
            <div className="space-y-2">
              <Label className="text-xs font-bold uppercase tracking-widest text-slate-500 ml-1">Matrícula o Correo</Label>
              <div className="relative">
                <User className="absolute left-4 top-3.5 h-4 w-4 text-slate-400" />
                <Input placeholder="Ej. 20261234" className="pl-12 h-12 rounded-xl bg-slate-50 border-slate-200" value={identifier} onChange={(e) => setIdentifier(e.target.value)} required />
              </div>
            </div>

            <div className="space-y-2">
              <Label className="text-xs font-bold uppercase tracking-widest text-slate-500 ml-1">Contraseña</Label>
              <div className="relative">
                <Lock className="absolute left-4 top-3.5 h-4 w-4 text-slate-400" />
                <Input type={showPassword ? "text" : "password"} placeholder="••••••••" className="pl-12 pr-12 h-12 rounded-xl bg-slate-50 border-slate-200" value={password} onChange={(e) => setPassword(e.target.value)} required />
                <button type="button" onClick={() => setShowPassword(!showPassword)} className="absolute right-4 top-3.5 text-slate-400 hover:text-slate-600">
                  {showPassword ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
                </button>
              </div>
            </div>

            <div className="space-y-4 pt-4">
              <Button type="submit" className="w-full bg-primary hover:bg-accent text-white font-bold h-14 rounded-2xl shadow-lg" disabled={isVerifying}>
                {isVerifying ? <Loader2 className="h-5 w-5 animate-spin" /> : "Ingresar"}
              </Button>

              <div className="relative py-2">
                <div className="absolute inset-0 flex items-center"><span className="w-full border-t border-slate-200" /></div>
                <div className="relative flex justify-center text-[10px] uppercase font-bold tracking-widest text-slate-400">
                  <span className="bg-white px-4">O</span>
                </div>
              </div>

              <Dialog open={isRegDialogOpen} onOpenChange={(o) => { setIsRegDialogOpen(o); if(!o) setRegStep(1); }}>
                <DialogTrigger asChild>
                  <Button variant="outline" className="w-full h-14 rounded-2xl border-2 hover:border-primary hover:text-primary font-bold uppercase text-[10px]">
                    <UserPlus className="w-4 h-4 mr-2" /> Darme de Alta
                  </Button>
                </DialogTrigger>
                <DialogContent className="max-w-2xl rounded-[2.5rem] p-8">
                  <DialogHeader className="mb-6">
                    <DialogTitle className="text-2xl font-bold uppercase flex items-center gap-3">
                      {regStep === 1 ? <UserPlus className="w-6 h-6 text-primary" /> : <Camera className="w-6 h-6 text-primary" />}
                      {regStep === 1 ? 'Registro de Alumno' : 'Biometría Facial'}
                    </DialogTitle>
                  </DialogHeader>

                  {regStep === 1 ? (
                    <div className="grid grid-cols-2 gap-4 py-4">
                      <div className="space-y-2"><Label className="text-[10px] font-bold uppercase">Nombre(s)</Label><Input value={newStudent.firstName} onChange={e => setNewStudent({...newStudent, firstName: e.target.value})} className="rounded-xl" /></div>
                      <div className="space-y-2"><Label className="text-[10px] font-bold uppercase">Apellido(s)</Label><Input value={newStudent.lastName} onChange={e => setNewStudent({...newStudent, lastName: e.target.value})} className="rounded-xl" /></div>
                      <div className="space-y-2"><Label className="text-[10px] font-bold uppercase">Matrícula</Label><Input value={newStudent.matricula} onChange={e => setNewStudent({...newStudent, matricula: e.target.value})} className="rounded-xl" /></div>
                      <div className="space-y-2">
                        <Label className="text-[10px] font-bold uppercase">Carrera</Label>
                        <Select value={newStudent.carreraId} onValueChange={v => setNewStudent({...newStudent, carreraId: v, grupoId: ''})}>
                          <SelectTrigger className="rounded-xl"><SelectValue placeholder="Elegir..." /></SelectTrigger>
                          <SelectContent>{carreras?.map(c => <SelectItem key={c.id} value={c.id}>{c.nombre}</SelectItem>)}</SelectContent>
                        </Select>
                      </div>
                      <div className="space-y-2">
                        <Label className="text-[10px] font-bold uppercase">Grupo</Label>
                        <Select value={newStudent.grupoId} onValueChange={v => setNewStudent({...newStudent, grupoId: v})} disabled={!newStudent.carreraId}>
                          <SelectTrigger className="rounded-xl"><SelectValue placeholder="Elegir..." /></SelectTrigger>
                          <SelectContent>{filteredGrupos.map(g => <SelectItem key={g.id} value={g.id}>{g.nombre}</SelectItem>)}</SelectContent>
                        </Select>
                      </div>
                      <div className="space-y-2 col-span-2"><Label className="text-[10px] font-bold uppercase">Contraseña para acceso</Label><Input type="password" value={newStudent.password} onChange={e => setNewStudent({...newStudent, password: e.target.value})} className="rounded-xl" /></div>
                    </div>
                  ) : (
                    <div className="py-4"><FacialRecognitionComponent mode="enroll" onCapture={(desc) => setNewStudent({...newStudent, faceDescriptor: desc})} /></div>
                  )}

                  <DialogFooter className="mt-6 gap-2">
                    {regStep === 1 ? (
                      <Button onClick={() => setRegStep(2)} className="w-full bg-primary h-12 rounded-xl font-bold uppercase text-[10px]" disabled={!newStudent.firstName || !newStudent.matricula || !newStudent.password || !newStudent.grupoId}>Continuar a Captura Facial</Button>
                    ) : (
                      <>
                        <Button variant="outline" onClick={() => setRegStep(1)} className="flex-1">Atrás</Button>
                        <Button onClick={handleRegister} className="flex-1 bg-green-600" disabled={!newStudent.faceDescriptor}>Finalizar</Button>
                      </>
                    )}
                  </DialogFooter>
                </DialogContent>
              </Dialog>
            </div>
          </form>
        </div>
      </div>
    </div>
  );
}
