
"use client";

import React, { useState, useMemo } from 'react';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { CalendarCheck, Search, Filter, Download, Loader2, User } from 'lucide-react';
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { 
  Table, 
  TableBody, 
  TableCell, 
  TableHead, 
  TableHeader, 
  TableRow 
} from "@/components/ui/table";
import { Badge } from "@/components/ui/badge";
import { 
  useFirestore, 
  useCollection, 
  useMemoFirebase 
} from '@/firebase';
import { collection, query, where, orderBy } from 'firebase/firestore';
import { cn } from "@/lib/utils";
import * as XLSX from 'xlsx';
import { useToast } from "@/hooks/use-toast";

export default function AsistenciaPage() {
  const db = useFirestore();
  const { toast } = useToast();
  const [searchTerm, setSearchTerm] = useState("");

  // Obtener fecha de hoy en formato YYYY-MM-DD
  const todayStr = useMemo(() => new Date().toISOString().split('T')[0], []);

  // Consultas
  const asistenciasRef = useMemoFirebase(() => collection(db, 'asistencias'), [db]);
  const todayAsistQuery = useMemoFirebase(() => 
    query(asistenciasRef, where("fecha", "==", todayStr)), 
  [asistenciasRef, todayStr]);
  
  const usersRef = useMemoFirebase(() => collection(db, 'users'), [db]);
  const carrerasRef = useMemoFirebase(() => collection(db, 'carreras'), [db]);

  const { data: rawAsistencias, isLoading } = useCollection(todayAsistQuery);
  const { data: users } = useCollection(usersRef);
  const { data: carreras } = useCollection(carrerasRef);

  // Mapeo y filtrado de datos
  const asistenciasHoy = useMemo(() => {
    if (!rawAsistencias || !users) return [];

    return rawAsistencias.map(asist => {
      const student = users.find(u => u.id === asist.alumnoId);
      const carrera = student ? carreras?.find(c => c.id === student.carreraId) : null;
      
      return {
        ...asist,
        alumnoNombre: student ? `${student.firstName} ${student.lastName}` : "Alumno Desconocido",
        carreraNombre: carrera ? carrera.nombre : "N/A",
        matricula: student?.matricula || "N/A"
      };
    }).filter(a => 
      a.alumnoNombre.toLowerCase().includes(searchTerm.toLowerCase()) ||
      a.matricula.toLowerCase().includes(searchTerm.toLowerCase())
    ).sort((a, b) => {
      const timeA = a.createdAt?.toDate?.()?.getTime() || 0;
      const timeB = b.createdAt?.toDate?.()?.getTime() || 0;
      return timeB - timeA;
    });
  }, [rawAsistencias, users, carreras, searchTerm]);

  const handleExportToday = () => {
    if (asistenciasHoy.length === 0) {
      toast({ 
        variant: "destructive", 
        title: "Sin registros", 
        description: "No hay asistencias registradas el día de hoy para exportar." 
      });
      return;
    }

    const exportData = asistenciasHoy.map(a => ({
      Fecha: a.fecha,
      Matricula: a.matricula,
      Alumno: a.alumnoNombre,
      Carrera: a.carreraNombre,
      Estado: a.estado,
      Hora_Registro: a.createdAt?.toDate?.()?.toLocaleTimeString() || "N/A"
    }));

    const worksheet = XLSX.utils.json_to_sheet(exportData);
    const workbook = XLSX.utils.book_new();
    XLSX.utils.book_append_sheet(workbook, worksheet, "Asistencia_Hoy");
    XLSX.writeFile(workbook, `Asistencia_General_${todayStr}.xlsx`);
    
    toast({ title: "Reporte Exportado", description: "El archivo Excel se ha descargado correctamente." });
  };

  return (
    <div className="space-y-6 animate-in fade-in duration-500 pb-20">
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 border-b pb-6">
        <div>
          <h1 className="text-3xl font-bold tracking-tight text-slate-900 uppercase flex items-center gap-3">
            <CalendarCheck className="w-9 h-9 text-primary" /> Monitoreo General
          </h1>
          <p className="text-muted-foreground font-medium text-sm">Registro centralizado de entradas y faltas del día: <span className="text-primary font-bold">{todayStr}</span></p>
        </div>
        <Button 
          onClick={handleExportToday}
          className="bg-primary hover:bg-accent text-white rounded-2xl h-12 px-8 font-bold shadow-lg shadow-primary/10 uppercase tracking-widest text-[10px]"
        >
          <Download className="w-4 h-4 mr-2" />
          Exportar Excel
        </Button>
      </div>

      <div className="flex flex-col sm:flex-row gap-4">
        <div className="relative flex-1">
          <Search className="absolute left-4 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
          <Input 
            placeholder="Buscar por nombre o matrícula..." 
            className="pl-12 h-12 bg-white rounded-2xl border-none shadow-sm font-medium" 
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
          />
        </div>
      </div>

      <div className="bg-white rounded-[2.5rem] border overflow-hidden shadow-sm">
        <Table>
          <TableHeader className="bg-slate-50/50">
            <TableRow>
              <TableHead className="px-8 font-bold py-5 uppercase text-[10px] tracking-widest text-slate-500">Alumno / Matrícula</TableHead>
              <TableHead className="font-bold uppercase text-[10px] tracking-widest text-slate-500">Carrera</TableHead>
              <TableHead className="font-bold text-center uppercase text-[10px] tracking-widest text-slate-500">Hora</TableHead>
              <TableHead className="font-bold text-center uppercase text-[10px] tracking-widest text-slate-500">Estado</TableHead>
            </TableRow>
          </TableHeader>
          <TableBody>
            {isLoading ? (
              <TableRow>
                <TableCell colSpan={4} className="py-20 text-center">
                  <Loader2 className="w-8 h-8 animate-spin text-primary mx-auto" />
                </TableCell>
              </TableRow>
            ) : asistenciasHoy.length === 0 ? (
              <TableRow>
                <TableCell colSpan={4} className="py-32 text-center">
                  <div className="flex flex-col items-center opacity-20">
                    <User className="w-16 h-16 mb-4" />
                    <p className="font-bold uppercase tracking-[0.2em] text-[10px]">Sin registros para el día de hoy</p>
                  </div>
                </TableCell>
              </TableRow>
            ) : asistenciasHoy.map((reg) => (
              <TableRow key={reg.id} className="hover:bg-slate-50/30 transition-colors">
                <TableCell className="py-5 px-8">
                  <div>
                    <p className="font-bold text-slate-900">{reg.alumnoNombre}</p>
                    <p className="text-[10px] font-bold text-primary uppercase">{reg.matricula}</p>
                  </div>
                </TableCell>
                <TableCell className="text-xs font-semibold text-slate-600 uppercase">
                  {reg.carreraNombre}
                </TableCell>
                <TableCell className="text-center text-xs font-bold text-slate-500">
                  {reg.createdAt?.toDate?.()?.toLocaleTimeString('es-MX', { hour: '2-digit', minute: '2-digit' }) || "-"}
                </TableCell>
                <TableCell className="text-center">
                  <Badge 
                    variant="outline"
                    className={cn(
                      "rounded-full px-4 py-1 font-bold text-[9px] uppercase",
                      reg.estado === 'Presente' ? "border-green-600 text-green-600 bg-green-50" :
                      reg.estado === 'Retraso' ? "border-amber-500 text-amber-500 bg-amber-50" :
                      reg.estado === 'Justificada' ? "border-blue-600 text-blue-600 bg-blue-50" :
                      "border-red-600 text-red-600 bg-red-50"
                    )}
                  >
                    {reg.estado}
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
