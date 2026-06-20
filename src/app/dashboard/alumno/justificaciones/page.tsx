
"use client";

import React, { useState, useEffect, useMemo } from 'react';
import { 
  FileText, 
  Plus, 
  Send, 
  Clock, 
  CheckCircle2, 
  XCircle, 
  Loader2,
  Paperclip,
  Upload
} from 'lucide-react';
import { 
  useFirestore, 
  useCollection, 
  useMemoFirebase,
  addDocumentNonBlocking
} from '@/firebase';
import { collection, query, where, serverTimestamp, limit } from 'firebase/firestore';
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { 
  Dialog, 
  DialogContent, 
  DialogHeader, 
  DialogTitle, 
  DialogTrigger,
  DialogFooter,
  DialogDescription
} from "@/components/ui/dialog";
import { Badge } from "@/components/ui/badge";
import { useToast } from "@/hooks/use-toast";
import { cn } from "@/lib/utils";

export default function MisJustificacionesPage() {
  const db = useFirestore();
  const { toast } = useToast();
  const [activeMatricula, setActiveMatricula] = useState<string | null>(null);
  const [isDialogOpen, setIsDialogOpen] = useState(false);
  const [isUploading, setIsUploading] = useState(false);

  useEffect(() => {
    if (typeof window !== 'undefined') {
      setActiveMatricula(sessionStorage.getItem('active_matricula'));
    }
  }, []);

  const usersRef = useMemoFirebase(() => collection(db, 'users'), [db]);
  const studentQuery = useMemoFirebase(() => 
    activeMatricula ? query(usersRef, where("matricula", "==", activeMatricula), limit(1)) : null,
  [usersRef, activeMatricula]);
  const { data: studentData } = useCollection(studentQuery);
  const student = studentData?.[0];

  const justificacionesRef = useMemoFirebase(() => collection(db, 'justificaciones'), [db]);
  const myJustificacionesQuery = useMemoFirebase(() => 
    student ? query(justificacionesRef, where("alumnoId", "==", student.id)) : null,
  [justificacionesRef, student]);
  const { data: rawJustificaciones, isLoading } = useCollection(myJustificacionesQuery);

  const justificaciones = useMemo(() => {
    if (!rawJustificaciones) return [];
    return [...rawJustificaciones].sort((a, b) => {
      const dateA = a.createdAt?.toDate?.() || new Date(0);
      const dateB = b.createdAt?.toDate?.() || new Date(0);
      return dateB.getTime() - dateA.getTime();
    });
  }, [rawJustificaciones]);

  const [newJustificacion, setNewJustificacion] = useState({
    fecha: new Date().toISOString().split('T')[0],
    motivo: '',
    evidenciaUrl: '',
  });

  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    if (file.size > 2 * 1024 * 1024) { // Límite de 2MB para Base64 en Firestore
      toast({ variant: "destructive", title: "Archivo demasiado grande", description: "El límite es de 2MB." });
      return;
    }

    setIsUploading(true);
    const reader = new FileReader();
    reader.onload = (event) => {
      setNewJustificacion(prev => ({ ...prev, evidenciaUrl: event.target?.result as string }));
      setIsUploading(false);
      toast({ title: "Archivo cargado", description: "La evidencia se ha adjuntado correctamente." });
    };
    reader.onerror = () => {
      setIsUploading(false);
      toast({ variant: "destructive", title: "Error", description: "No se pudo leer el archivo." });
    };
    reader.readAsDataURL(file);
  };

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!student) return;

    addDocumentNonBlocking(justificacionesRef, {
      ...newJustificacion,
      alumnoId: student.id,
      estado: 'Pendiente',
      createdAt: serverTimestamp(),
      updatedAt: serverTimestamp()
    });

    setIsDialogOpen(false);
    setNewJustificacion({ fecha: new Date().toISOString().split('T')[0], motivo: '', evidenciaUrl: '' });
    toast({ title: "Solicitud enviada", description: "Tu justificante está siendo revisado." });
  };

  return (
    <div className="space-y-8 animate-in fade-in duration-500 pb-20">
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 border-b pb-6">
        <div>
          <h1 className="text-3xl font-bold tracking-tight text-foreground uppercase flex items-center gap-2">
            <FileText className="w-8 h-8 text-primary" /> Mis Justificantes
          </h1>
          <p className="text-muted-foreground font-medium text-sm">Gestiona tus ausencias por motivos médicos o personales.</p>
        </div>
        
        <Dialog open={isDialogOpen} onOpenChange={setIsDialogOpen}>
          <DialogTrigger asChild>
            <Button className="bg-primary hover:bg-accent text-white rounded-xl h-12 px-8 font-bold shadow-lg shadow-primary/10">
              <Plus className="w-4 h-4 mr-2" /> Nueva Solicitud
            </Button>
          </DialogTrigger>
          <DialogContent className="rounded-[2rem] p-8 max-w-lg border-none">
            <DialogHeader className="mb-4">
              <DialogTitle className="text-2xl font-bold uppercase tracking-tight">Solicitar Justificante</DialogTitle>
              <DialogDescription className="text-[10px] font-bold uppercase tracking-widest text-muted-foreground">Proporciona los detalles y evidencia de tu inasistencia.</DialogDescription>
            </DialogHeader>
            <form onSubmit={handleSubmit} className="space-y-5">
              <div className="space-y-2">
                <Label className="text-[10px] font-bold uppercase tracking-widest ml-1">Fecha de Inasistencia</Label>
                <Input 
                  type="date" 
                  value={newJustificacion.fecha} 
                  onChange={e => setNewJustificacion({...newJustificacion, fecha: e.target.value})} 
                  required 
                  className="rounded-xl h-12 font-medium"
                />
              </div>
              <div className="space-y-2">
                <Label className="text-[10px] font-bold uppercase tracking-widest ml-1">Motivo / Descripción</Label>
                <Textarea 
                  placeholder="Explica brevemente el motivo..." 
                  value={newJustificacion.motivo}
                  onChange={e => setNewJustificacion({...newJustificacion, motivo: e.target.value})}
                  required
                  className="rounded-2xl min-h-[100px] font-medium pt-3"
                />
              </div>
              <div className="space-y-2">
                <Label className="text-[10px] font-bold uppercase tracking-widest ml-1">Adjuntar Evidencia (PDF/Imagen)</Label>
                <div className="relative">
                  <Input 
                    type="file" 
                    onChange={handleFileChange}
                    className="hidden" 
                    id="file-upload"
                    accept="application/pdf,image/*"
                  />
                  <label 
                    htmlFor="file-upload"
                    className={cn(
                      "flex items-center justify-center gap-2 w-full h-12 border-2 border-dashed rounded-xl cursor-pointer hover:bg-slate-50 transition-colors font-bold text-xs uppercase tracking-tight",
                      newJustificacion.evidenciaUrl ? "border-green-500 text-green-600 bg-green-50" : "border-slate-300 text-slate-500"
                    )}
                  >
                    {isUploading ? <Loader2 className="w-4 h-4 animate-spin" /> : 
                     newJustificacion.evidenciaUrl ? <CheckCircle2 className="w-4 h-4" /> : <Upload className="w-4 h-4" />}
                    {newJustificacion.evidenciaUrl ? "Evidencia lista" : "Elegir archivo"}
                  </label>
                </div>
                <p className="text-[9px] text-muted-foreground italic ml-1">Asegúrate de que el archivo sea legible y menor a 2MB.</p>
              </div>
              <DialogFooter className="pt-4">
                <Button type="submit" disabled={isUploading} className="w-full bg-primary hover:bg-accent text-white rounded-xl h-12 font-bold uppercase tracking-widest text-[10px]">
                  <Send className="w-4 h-4 mr-2" /> Enviar Revisión
                </Button>
              </DialogFooter>
            </form>
          </DialogContent>
        </Dialog>
      </div>

      <div className="grid grid-cols-1 gap-4">
        {isLoading ? (
          <div className="py-20 text-center"><Loader2 className="w-8 h-8 animate-spin text-primary mx-auto" /></div>
        ) : justificaciones.length === 0 ? (
          <div className="bg-slate-50 border-2 border-dashed rounded-[2.5rem] py-24 text-center">
            <FileText className="w-16 h-16 text-slate-200 mx-auto mb-4" />
            <p className="text-slate-400 font-bold uppercase text-[10px] tracking-[0.2em]">No tienes solicitudes registradas</p>
          </div>
        ) : justificaciones.map(j => (
          <div key={j.id} className="bg-white border p-6 rounded-[2rem] shadow-sm hover:shadow-md transition-all flex flex-col md:flex-row md:items-center justify-between gap-6 group">
            <div className="flex items-start gap-4">
              <div className={cn(
                "p-4 rounded-2xl flex-shrink-0 transition-transform group-hover:scale-105",
                j.estado === 'Aprobada' ? "bg-green-50 text-green-600" :
                j.estado === 'Rechazada' ? "bg-red-50 text-red-600" : "bg-slate-50 text-slate-400"
              )}>
                {j.estado === 'Aprobada' ? <CheckCircle2 className="w-6 h-6" /> :
                 j.estado === 'Rechazada' ? <XCircle className="w-6 h-6" /> : <Clock className="w-6 h-6" />}
              </div>
              <div>
                <div className="flex items-center gap-2 mb-1">
                  <h4 className="font-bold text-slate-900">Ausencia del {j.fecha}</h4>
                  <Badge variant="outline" className={cn(
                    "rounded-full text-[9px] font-bold uppercase px-3",
                    j.estado === 'Aprobada' ? "border-green-600 text-green-600 bg-green-50" :
                    j.estado === 'Rechazada' ? "border-red-600 text-red-600 bg-red-50" :
                    "border-slate-300 text-slate-500 bg-slate-50"
                  )}>
                    {j.estado}
                  </Badge>
                  {j.evidenciaUrl && (
                    <Badge className="bg-primary/10 text-primary border-none text-[9px] uppercase font-bold flex items-center gap-1">
                      <Paperclip className="w-2.5 h-2.5" /> Con Evidencia
                    </Badge>
                  )}
                </div>
                <p className="text-sm text-muted-foreground font-medium line-clamp-2">{j.motivo}</p>
              </div>
            </div>
            <div className="text-right flex-shrink-0">
               <p className="text-[9px] font-bold text-muted-foreground uppercase tracking-widest mb-1">Enviado el</p>
               <p className="text-xs font-bold text-slate-600">
                {j.createdAt?.toDate ? j.createdAt.toDate().toLocaleDateString() : 'Pendiente...'}
               </p>
            </div>
          </div>
        ))}
      </div>
    </div>
  );
}
