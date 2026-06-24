
"use client";

import React, { useMemo } from 'react';
import { 
  ShieldAlert, 
  GraduationCap,
  Clock,
  CheckCircle2,
  XCircle,
  FileText,
  Loader2,
  Calendar,
  ExternalLink,
  Paperclip,
  AlertTriangle
} from 'lucide-react';
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { 
  useFirestore, 
  useCollection, 
  useMemoFirebase,
  updateDocumentNonBlocking
} from '@/firebase';
import { collection, doc, serverTimestamp, query, orderBy, getDocs, where } from 'firebase/firestore';
import { useToast } from "@/hooks/use-toast";
import { cn } from "@/lib/utils";

export default function JustificacionesDocentePage() {
  const db = useFirestore();
  const { toast } = useToast();

  const usersRef = useMemoFirebase(() => collection(db, 'users'), [db]);
  const justificacionesRef = useMemoFirebase(() => collection(db, 'justificaciones'), [db]);
  
  // Consulta ordenada por fecha de creación (los más recientes primero)
  const q = useMemoFirebase(() => query(justificacionesRef, orderBy('createdAt', 'desc')), [justificacionesRef]);

  const { data: allUsers } = useCollection(usersRef);
  const { data: justificaciones, isLoading } = useCollection(q);

  const handleUpdateStatus = async (id: string, newStatus: 'Aprobada' | 'Rechazada', justificacion: any) => {
    const docRef = doc(db, 'justificaciones', id);
    
    // 1. Actualizar el estado del justificante
    updateDocumentNonBlocking(docRef, {
      estado: newStatus,
      updatedAt: serverTimestamp()
    });
    
    // 2. Si es aprobada, buscar faltas para ese día y cambiarlas a "Justificada"
    if (newStatus === 'Aprobada') {
      try {
        const asistenciasRef = collection(db, 'asistencias');
        const qAsist = query(
          asistenciasRef, 
          where("alumnoId", "==", justificacion.alumnoId),
          where("fecha", "==", justificacion.fecha),
          where("estado", "==", "Falta")
        );
        
        const querySnapshot = await getDocs(qAsist);
        
        if (querySnapshot.empty) {
          toast({
            variant: "destructive",
            title: "Aviso de Sistema",
            description: `El justificante fue aprobado, pero no se encontró ninguna inasistencia registrada para el día ${justificacion.fecha}.`
          });
        } else {
          querySnapshot.forEach((asistDoc) => {
            updateDocumentNonBlocking(asistDoc.ref, {
              estado: 'Justificada',
              updatedAt: serverTimestamp()
            });
          });
          
          toast({
            title: "Justificación Aplicada",
            description: `Se han justificado ${querySnapshot.size} registro(s) de inasistencia para el alumno.`
          });
        }
      } catch (error) {
        console.error("Error al procesar la justificación automática:", error);
      }
    } else {
      toast({
        title: "Solicitud Rechazada",
        description: "El estado del justificante ha sido actualizado a Rechazada."
      });
    }
  };

  const openEvidencia = (url: string) => {
    const newWindow = window.open();
    if (newWindow) {
      newWindow.document.write(`<iframe src="${url}" frameborder="0" style="border:0; top:0px; left:0px; bottom:0px; right:0px; width:100%; height:100%;" allowfullscreen></iframe>`);
    }
  };

  return (
    <div className="space-y-8 animate-in fade-in duration-500 pb-20">
      <div className="border-b pb-6">
        <h1 className="text-3xl font-bold tracking-tight text-foreground uppercase flex items-center gap-3">
          <ShieldAlert className="w-9 h-9 text-primary" /> Justificaciones
        </h1>
        <p className="text-muted-foreground font-medium text-sm">Validación de ausencias estudiantiles por motivos de fuerza mayor.</p>
      </div>

      {isLoading ? (
        <div className="py-20 text-center"><Loader2 className="w-10 h-10 animate-spin text-primary mx-auto" /></div>
      ) : !justificaciones || justificaciones.length === 0 ? (
        <div className="py-24 text-center bg-slate-50 border-2 border-dashed rounded-[2.5rem] flex flex-col items-center">
          <FileText className="w-16 h-16 text-slate-200 mb-4" />
          <p className="text-slate-400 font-bold uppercase text-[10px] tracking-[0.2em]">No hay solicitudes pendientes</p>
        </div>
      ) : (
        <div className="grid grid-cols-1 gap-6">
          {justificaciones.map(j => {
            const alumno = allUsers?.find(u => u.id === j.alumnoId);
            return (
              <div key={j.id} className="bg-white border p-6 rounded-[2rem] shadow-sm hover:shadow-md transition-all flex flex-col md:flex-row items-start md:items-center justify-between gap-6 group">
                <div className="flex items-start gap-4">
                  <div className={cn(
                    "p-4 rounded-2xl flex-shrink-0 transition-transform group-hover:scale-105",
                    j.estado === 'Aprobada' ? "bg-green-50 text-green-600" :
                    j.estado === 'Rechazada' ? "bg-red-50 text-red-600" : "bg-primary/5 text-primary"
                  )}>
                    <GraduationCap className="w-6 h-6" />
                  </div>
                  <div className="space-y-1">
                    <div className="flex items-center gap-3">
                      <h4 className="font-bold text-slate-900 text-lg">{alumno ? `${alumno.firstName} ${alumno.lastName}` : 'Alumno desconocido'}</h4>
                      <Badge variant="outline" className={cn(
                        "rounded-full text-[9px] font-bold uppercase px-3",
                        j.estado === 'Aprobada' ? "border-green-600 text-green-600 bg-green-50" :
                        j.estado === 'Rechazada' ? "border-red-600 text-red-600 bg-red-50" :
                        "border-slate-300 text-slate-500 bg-slate-50"
                      )}>
                        {j.estado}
                      </Badge>
                    </div>
                    <div className="flex flex-wrap items-center gap-x-4 gap-y-1 text-xs font-medium text-slate-500">
                      <span className="flex items-center gap-1.5"><Calendar className="w-3.5 h-3.5" /> Inasistencia: {j.fecha}</span>
                      <span className="flex items-center gap-1.5"><Clock className="w-3.5 h-3.5" /> Enviado: {j.createdAt?.toDate ? j.createdAt.toDate().toLocaleDateString() : 'Hoy'}</span>
                    </div>
                    <p className="text-sm text-slate-600 font-medium bg-slate-50 p-3 rounded-xl mt-3 italic border-l-4 border-primary/20">"{j.motivo}"</p>
                    
                    {j.evidenciaUrl && (
                      <div className="pt-2">
                        <Button 
                          variant="outline" 
                          size="sm" 
                          onClick={() => openEvidencia(j.evidenciaUrl)}
                          className="h-8 rounded-lg border-primary/20 text-primary hover:bg-primary/5 font-bold text-[10px] uppercase tracking-widest"
                        >
                          <ExternalLink className="w-3 h-3 mr-2" /> Ver Documento Adjunto
                        </Button>
                      </div>
                    )}
                  </div>
                </div>
                
                {j.estado === 'Pendiente' && (
                  <div className="flex gap-2 w-full md:w-auto flex-shrink-0">
                    <Button 
                      onClick={() => handleUpdateStatus(j.id, 'Aprobada', j)}
                      className="flex-1 md:flex-none bg-green-600 hover:bg-green-700 text-white rounded-xl h-11 px-6 font-bold uppercase text-[10px] tracking-widest"
                    >
                      <CheckCircle2 className="w-4 h-4 mr-2" /> Aprobar
                    </Button>
                    <Button 
                      onClick={() => handleUpdateStatus(j.id, 'Rechazada', j)}
                      variant="outline"
                      className="flex-1 md:flex-none border-red-200 text-red-600 hover:bg-red-50 rounded-xl h-11 px-6 font-bold uppercase text-[10px] tracking-widest"
                    >
                      <XCircle className="w-4 h-4 mr-2" /> Rechazar
                    </Button>
                  </div>
                )}
              </div>
            );
          })}
        </div>
      )}
    </div>
  );
}
