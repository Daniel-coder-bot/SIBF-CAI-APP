
"use client";

import React, { useState, useEffect, useMemo } from 'react';
import { 
  History, 
  Calendar, 
  CheckCircle2, 
  XCircle, 
  Clock, 
  Loader2
} from 'lucide-react';
import { 
  useFirestore, 
  useCollection, 
  useMemoFirebase 
} from '@/firebase';
import { collection, query, where, limit } from 'firebase/firestore';
import { Card, CardContent } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { 
  Table, 
  TableBody, 
  TableCell, 
  TableHead, 
  TableHeader, 
  TableRow 
} from "@/components/ui/table";
import { cn } from "@/lib/utils";

export default function MiAsistenciaPage() {
  const db = useFirestore();
  const [activeMatricula, setActiveMatricula] = useState<string | null>(null);

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

  const asistenciasRef = useMemoFirebase(() => collection(db, 'asistencias'), [db]);
  // Quitamos orderBy para evitar errores de índice compuesto en la demo
  const myAsistenciasQuery = useMemoFirebase(() => 
    student ? query(asistenciasRef, where("alumnoId", "==", student.id)) : null,
  [asistenciasRef, student]);
  const { data: rawAsistencias, isLoading } = useCollection(myAsistenciasQuery);

  // Ordenamos en el cliente para evitar el error de índice de Firestore
  const asistencias = useMemo(() => {
    if (!rawAsistencias) return [];
    return [...rawAsistencias].sort((a, b) => {
      const dateA = a.createdAt?.toDate?.() || new Date(0);
      const dateB = b.createdAt?.toDate?.() || new Date(0);
      return dateB.getTime() - dateA.getTime();
    });
  }, [rawAsistencias]);

  const materiasRef = useMemoFirebase(() => collection(db, 'materias'), [db]);
  const { data: materias } = useCollection(materiasRef);

  const stats = useMemo(() => {
    if (!asistencias) return { presentes: 0, faltas: 0, retardos: 0 };
    return asistencias.reduce((acc, curr) => {
      if (curr.estado === 'Presente') acc.presentes++;
      else if (curr.estado === 'Falta') acc.faltas++;
      else if (curr.estado === 'Retraso') acc.retardos++;
      return acc;
    }, { presentes: 0, faltas: 0, retardos: 0 });
  }, [asistencias]);

  return (
    <div className="space-y-8 animate-in fade-in duration-500 pb-20">
      <div className="border-b pb-6">
        <h1 className="text-3xl font-bold tracking-tight text-foreground uppercase flex items-center gap-2">
          <History className="w-8 h-8 text-primary" /> Mi Historial Académico
        </h1>
        <p className="text-muted-foreground font-medium text-sm">Resumen de puntualidad y permanencia escolar.</p>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
        <Card className="rounded-[2rem] border-none bg-green-50 shadow-sm">
          <CardContent className="p-8 flex items-center justify-between">
            <div>
              <p className="text-[10px] font-bold text-green-700 uppercase tracking-widest mb-1">Presente</p>
              <h3 className="text-4xl font-bold text-green-900">{stats.presentes}</h3>
            </div>
            <div className="bg-green-600 p-3 rounded-2xl text-white"><CheckCircle2 className="w-6 h-6" /></div>
          </CardContent>
        </Card>
        <Card className="rounded-[2rem] border-none bg-amber-50 shadow-sm">
          <CardContent className="p-8 flex items-center justify-between">
            <div>
              <p className="text-[10px] font-bold text-amber-700 uppercase tracking-widest mb-1">Retardos</p>
              <h3 className="text-4xl font-bold text-amber-900">{stats.retardos}</h3>
            </div>
            <div className="bg-amber-500 p-3 rounded-2xl text-white"><Clock className="w-6 h-6" /></div>
          </CardContent>
        </Card>
        <Card className="rounded-[2rem] border-none bg-red-50 shadow-sm">
          <CardContent className="p-8 flex items-center justify-between">
            <div>
              <p className="text-[10px] font-bold text-red-700 uppercase tracking-widest mb-1">Faltas</p>
              <h3 className="text-4xl font-bold text-red-900">{stats.faltas}</h3>
            </div>
            <div className="bg-red-600 p-3 rounded-2xl text-white"><XCircle className="w-6 h-6" /></div>
          </CardContent>
        </Card>
      </div>

      <div className="bg-white border rounded-[2.5rem] overflow-hidden shadow-sm">
        <div className="p-8 border-b bg-slate-50/30 flex justify-between items-center">
          <div>
            <h3 className="font-bold text-xl">Registros de Asistencia</h3>
            <p className="text-[10px] font-bold text-muted-foreground uppercase tracking-widest">Listado detallado por fecha y materia</p>
          </div>
          <Calendar className="w-6 h-6 text-slate-300" />
        </div>
        <Table>
          <TableHeader className="bg-slate-50/50">
            <TableRow>
              <TableHead className="px-8 font-bold py-5 uppercase text-[10px] tracking-widest">Fecha</TableHead>
              <TableHead className="font-bold uppercase text-[10px] tracking-widest">Materia</TableHead>
              <TableHead className="font-bold text-center uppercase text-[10px] tracking-widest">Estado</TableHead>
            </TableRow>
          </TableHeader>
          <TableBody>
            {isLoading ? (
              <TableRow><TableCell colSpan={3} className="py-10 text-center"><Loader2 className="w-6 h-6 animate-spin text-primary mx-auto" /></TableCell></TableRow>
            ) : asistencias.length === 0 ? (
              <TableRow><TableCell colSpan={3} className="py-20 text-center text-muted-foreground italic font-medium">Aún no tienes registros de asistencia en el sistema.</TableCell></TableRow>
            ) : asistencias.map(asist => (
              <TableRow key={asist.id} className="hover:bg-slate-50/30">
                <TableCell className="px-8 font-medium">{asist.fecha}</TableCell>
                <TableCell className="font-bold text-slate-900">
                  {materias?.find(m => m.id === asist.materiaId)?.nombre || 'Materia'}
                </TableCell>
                <TableCell className="text-center">
                  <Badge 
                    variant="outline" 
                    className={cn(
                      "rounded-full px-4 py-1 font-bold text-[9px] uppercase",
                      asist.estado === 'Presente' ? "border-green-600 text-green-600 bg-green-50" :
                      asist.estado === 'Retraso' ? "border-amber-500 text-amber-500 bg-amber-50" :
                      "border-red-600 text-red-600 bg-red-50"
                    )}
                  >
                    {asist.estado}
                  </Badge>
                </TableCell>
              </TableRow>
            ))}
          </TableBody>
        </Table>
      </div>
    </div>
  );
}
