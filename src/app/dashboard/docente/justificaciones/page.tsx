
"use client";

import React from 'react';
import { 
  ShieldAlert, 
  GraduationCap,
  Clock,
  CheckCircle2,
  XCircle
} from 'lucide-react';
import { Button } from "@/components/ui/button";
import { 
  useFirestore, 
  useCollection, 
  useMemoFirebase
} from '@/firebase';
import { collection } from 'firebase/firestore';

export default function JustificacionesPage() {
  const db = useFirestore();

  const usersRef = useMemoFirebase(() => collection(db, 'users'), [db]);
  const justificacionesRef = useMemoFirebase(() => collection(db, 'justificaciones'), [db]);

  const { data: allUsers } = useCollection(usersRef);
  const { data: justificaciones } = useCollection(justificacionesRef);

  return (
    <div className="space-y-6 animate-in fade-in duration-500 pb-20">
      <div className="border-b pb-6">
        <h1 className="text-3xl font-bold tracking-tight text-foreground uppercase flex items-center gap-2">
          <ShieldAlert className="w-8 h-8 text-primary" /> Justificaciones
        </h1>
        <p className="text-muted-foreground font-medium text-sm">Validación de justificantes médicos y motivos personales.</p>
      </div>

      <div className="bg-white border rounded-[2.5rem] p-8 shadow-sm">
        <div className="grid grid-cols-1 gap-4">
          {justificaciones && justificaciones.length > 0 ? justificaciones.map(j => {
            const alumno = allUsers?.find(u => u.id === j.alumnoId);
            return (
              <div key={j.id} className="flex flex-col md:flex-row items-start md:items-center justify-between p-6 border rounded-3xl bg-slate-50/30 hover:bg-white transition-colors group">
                <div className="flex gap-4 items-center mb-4 md:mb-0">
                  <div className="bg-primary/10 p-3 rounded-2xl"><GraduationCap className="w-6 h-6 text-primary" /></div>
                  <div>
                    <h4 className="font-bold text-slate-900">{alumno?.firstName} {alumno?.lastName}</h4>
                    <p className="text-xs font-medium text-muted-foreground uppercase tracking-tight flex items-center gap-2">
                      <Clock className="w-3 h-3" /> Fecha: {j.fecha} | Motivo: {j.motivo}
                    </p>
                  </div>
                </div>
                <div className="flex gap-2 w-full md:w-auto">
                  <Button size="sm" variant="outline" className="flex-1 md:flex-none rounded-xl text-green-600 border-green-200 hover:bg-green-50 font-bold uppercase text-[9px]">
                    <CheckCircle2 className="w-3 h-3 mr-1" /> Aprobar
                  </Button>
                  <Button size="sm" variant="outline" className="flex-1 md:flex-none rounded-xl text-red-600 border-red-200 hover:bg-red-50 font-bold uppercase text-[9px]">
                    <XCircle className="w-3 h-3 mr-1" /> Rechazar
                  </Button>
                </div>
              </div>
            );
          }) : (
            <div className="py-24 text-center text-muted-foreground italic border-2 border-dashed rounded-[2rem]">
              <ShieldAlert className="w-12 h-12 text-slate-200 mx-auto mb-4" />
              No hay solicitudes de justificación pendientes por revisar.
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
