
"use client";

import React, { useState, useMemo, useEffect } from 'react';
import { 
  ClipboardCheck, 
  Search, 
  CheckCircle2, 
  XCircle, 
  Clock, 
  Camera,
  Save,
  AlertCircle,
  CalendarDays,
  ScanFace,
  ShieldCheck
} from 'lucide-react';
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { 
  Table, 
  TableBody, 
  TableCell, 
  TableHead, 
  TableHeader, 
  TableRow 
} from "@/components/ui/table";
import { 
  Select, 
  SelectContent, 
  SelectItem, 
  SelectTrigger, 
  SelectValue 
} from "@/components/ui/select";
import { 
  useFirestore, 
  useCollection, 
  useMemoFirebase,
  useUser,
  addDocumentNonBlocking
} from '@/firebase';
import { collection, serverTimestamp, query, where } from 'firebase/firestore';
import { useToast } from "@/hooks/use-toast";
import { cn } from "@/lib/utils";
import { FacialRecognitionComponent } from '@/components/FacialRecognitionComponent';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription } from "@/components/ui/dialog";
import { Badge } from "@/components/ui/badge";

const DAYS_MAP: Record<number, string> = {
  1: "Lunes",
  2: "Martes",
  3: "Miércoles",
  4: "Jueves",
  5: "Viernes",
  6: "Sábado",
  0: "Domingo"
};

export default function TomaAsistenciaPage() {
  const db = useFirestore();
  const { user } = useUser();
  const { toast } = useToast();

  const [selectedGrupoId, setSelectedGrupoId] = useState<string>("");
  const [attendanceMap, setAttendanceMap] = useState<Record<string, 'Presente' | 'Retraso' | 'Falta' | 'Justificada'>>({});
  const [searchQuery, setSearchQuery] = useState("");
  const [currentTime, setCurrentTime] = useState(new Date());
  const [isCameraOpen, setIsCameraOpen] = useState(false);

  useEffect(() => {
    const timer = setInterval(() => setCurrentTime(new Date()), 60000);
    return () => clearInterval(timer);
  }, []);

  const gruposRef = useMemoFirebase(() => collection(db, 'grupos'), [db]);
  const materiasRef = useMemoFirebase(() => collection(db, 'materias'), [db]);
  const usersRef = useMemoFirebase(() => collection(db, 'users'), [db]);
  const horariosRef = useMemoFirebase(() => collection(db, 'horarios'), [db]);
  const asistenciasRef = useMemoFirebase(() => collection(db, 'asistencias'), [db]);

  const { data: grupos } = useCollection(gruposRef);
  const { data: materias } = useCollection(materiasRef);
  const { data: allUsers } = useCollection(usersRef);
  const { data: horarios } = useCollection(horariosRef);

  const currentSchedule = useMemo(() => {
    if (!selectedGrupoId || !horarios) return null;
    const currentDayStr = DAYS_MAP[currentTime.getDay()];
    const currentHourStr = currentTime.toLocaleTimeString('es-MX', { hour: '2-digit', minute: '2-digit', hour12: false });
    
    return horarios.find(h => 
      h.grupoId === selectedGrupoId && 
      h.dia === currentDayStr &&
      currentHourStr >= h.horaInicio &&
      currentHourStr <= h.horaFin
    );
  }, [selectedGrupoId, horarios, currentTime]);

  const currentMateria = useMemo(() => {
    if (!currentSchedule || !materias) return null;
    return materias.find(m => m.id === currentSchedule.materiaId);
  }, [currentSchedule, materias]);

  const studentsInGrupo = useMemo(() => {
    if (!selectedGrupoId || !allUsers) return [];
    return allUsers.filter(u => u.role === 'Alumno' && u.grupoId === selectedGrupoId);
  }, [selectedGrupoId, allUsers]);

  const filteredStudents = useMemo(() => {
    return studentsInGrupo.filter(s => 
      `${s.firstName} ${s.lastName}`.toLowerCase().includes(searchQuery.toLowerCase()) ||
      s.matricula?.toLowerCase().includes(searchQuery.toLowerCase())
    );
  }, [studentsInGrupo, searchQuery]);

  const labeledDescriptors = useMemo(() => {
    return studentsInGrupo
      .filter(s => s.faceDescriptor && Array.isArray(s.faceDescriptor))
      .map(s => ({
        label: `${s.firstName} ${s.lastName}`,
        descriptor: s.faceDescriptor
      }));
  }, [studentsInGrupo]);

  const handleMarkAttendance = (alumnoId: string, statusOverride?: 'Presente' | 'Retraso' | 'Falta' | 'Justificada') => {
    if (statusOverride) {
      setAttendanceMap(prev => ({ ...prev, [alumnoId]: statusOverride }));
      return;
    }

    let autoStatus: 'Presente' | 'Retraso' | 'Falta' = 'Presente';

    if (currentSchedule) {
      const [startHour, startMin] = currentSchedule.horaInicio.split(':').map(Number);
      const startTime = new Date(currentTime);
      startTime.setHours(startHour, startMin, 0, 0);
      
      const diffInMinutes = (currentTime.getTime() - startTime.getTime()) / 60000;
      autoStatus = diffInMinutes <= 15 ? 'Presente' : 'Retraso';
    }

    setAttendanceMap(prev => ({ ...prev, [alumnoId]: autoStatus }));
    
    toast({ 
      title: autoStatus === 'Presente' ? "Asistencia Marcada" : "Retardo Marcado", 
      description: currentSchedule ? "Basado en horario oficial." : "Marcado en modo de prueba."
    });
  };

  const handleRecognized = (label: string) => {
    const student = studentsInGrupo.find(s => `${s.firstName} ${s.lastName}` === label);
    if (student) {
      handleMarkAttendance(student.id);
      toast({
        title: "¡Alumno Identificado!",
        description: `${label} ha sido marcado automáticamente.`,
      });
    }
  };

  const handleMarkAllAbsences = () => {
    const updatedMap = { ...attendanceMap };
    studentsInGrupo.forEach(s => {
      if (!updatedMap[s.id]) updatedMap[s.id] = 'Falta';
    });
    setAttendanceMap(updatedMap);
    toast({ title: "Faltas asignadas", description: "Se marcó falta a los alumnos sin registro." });
  };

  const handleSaveAttendance = () => {
    if (!selectedGrupoId) {
      toast({ variant: "destructive", title: "Error", description: "Debes seleccionar un grupo." });
      return;
    }

    const records = Object.entries(attendanceMap);
    if (records.length === 0) {
      toast({ variant: "destructive", title: "Sin datos", description: "No hay asistencias marcadas." });
      return;
    }

    const grupoActual = grupos?.find(g => g.id === selectedGrupoId);
    const materiaIdFallback = materias?.find(m => m.carreraId === grupoActual?.carreraId)?.id;
    const finalMateriaId = currentSchedule?.materiaId || materiaIdFallback;

    if (!finalMateriaId) {
      toast({ variant: "destructive", title: "Error", description: "No se encontró una materia asociada al grupo." });
      return;
    }

    records.forEach(([alumnoId, estado]) => {
      addDocumentNonBlocking(asistenciasRef, {
        alumnoId,
        docenteId: user?.uid || 'docente-demo',
        grupoId: selectedGrupoId,
        materiaId: finalMateriaId,
        fecha: currentTime.toISOString().split('T')[0],
        estado,
        createdAt: serverTimestamp()
      });
    });

    toast({ title: "Éxito", description: "Registros guardados en el historial." });
    setAttendanceMap({});
  };

  return (
    <div className="space-y-8 animate-in fade-in duration-500 pb-20">
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 border-b pb-6">
        <div>
          <h1 className="text-3xl font-bold tracking-tight text-foreground uppercase flex items-center gap-3">
            <ClipboardCheck className="w-9 h-9 text-primary" /> Pase de Lista
          </h1>
          <p className="text-muted-foreground font-medium text-sm">Control inteligente de puntualidad con reconocimiento facial.</p>
        </div>
        <div className="bg-slate-50 px-6 py-3 rounded-2xl border flex items-center gap-4">
          <Clock className="w-5 h-5 text-primary animate-pulse" />
          <div className="text-right">
            <p className="text-[10px] font-bold text-muted-foreground uppercase tracking-widest leading-none mb-1">Hora Actual</p>
            <p className="text-lg font-bold text-slate-900 leading-none">{currentTime.toLocaleTimeString('es-MX', { hour: '2-digit', minute: '2-digit' })}</p>
          </div>
        </div>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-4 gap-8">
        <div className="lg:col-span-1 space-y-6">
          <div className="bg-white border rounded-[2rem] p-6 shadow-sm space-y-5">
            <div className="space-y-2">
              <label className="text-[10px] font-bold uppercase text-muted-foreground ml-1 tracking-widest">Seleccionar Grupo</label>
              <Select value={selectedGrupoId} onValueChange={setSelectedGrupoId}>
                <SelectTrigger className="rounded-xl h-12 font-bold"><SelectValue placeholder="Elegir Grupo..." /></SelectTrigger>
                <SelectContent>
                  {grupos?.map(g => <SelectItem key={g.id} value={g.id}>{g.nombre}</SelectItem>)}
                </SelectContent>
              </Select>
            </div>

            {currentSchedule ? (
              <div className="p-4 bg-primary/5 border border-primary/10 rounded-2xl space-y-3">
                <div className="flex items-center gap-2">
                  <CalendarDays className="w-4 h-4 text-primary" />
                  <span className="text-[10px] font-bold uppercase text-primary">Clase en Curso</span>
                </div>
                <div>
                  <h3 className="font-bold text-slate-900 leading-tight">{currentMateria?.nombre}</h3>
                  <p className="text-xs font-medium text-slate-500">{currentSchedule.horaInicio} - {currentSchedule.horaFin} | Aula: {currentSchedule.aula || 'N/A'}</p>
                </div>
              </div>
            ) : selectedGrupoId && (
              <div className="p-4 bg-amber-50 border border-amber-100 rounded-2xl flex items-start gap-3">
                <AlertCircle className="w-5 h-5 text-amber-600 flex-shrink-0 mt-0.5" />
                <p className="text-xs font-bold text-amber-800 uppercase leading-relaxed">Sin clases en este momento. El pase de lista se guardará como modo de prueba.</p>
              </div>
            )}
          </div>

          <div className="space-y-3">
            <Button 
              onClick={() => setIsCameraOpen(true)}
              disabled={!selectedGrupoId}
              className="w-full h-14 bg-slate-900 hover:bg-slate-800 text-white rounded-2xl font-bold uppercase tracking-widest text-[11px] shadow-lg"
            >
              <ScanFace className="w-5 h-5 mr-2" /> Iniciar Reconocimiento (Prueba)
            </Button>
            <Button 
              onClick={handleMarkAllAbsences} 
              disabled={!selectedGrupoId}
              variant="outline" 
              className="w-full h-12 rounded-xl border-2 font-bold text-[10px] uppercase tracking-widest"
            >
              <XCircle className="w-4 h-4 mr-2" /> Marcar Faltas Restantes
            </Button>
            <Button 
              onClick={handleSaveAttendance} 
              disabled={Object.keys(attendanceMap).length === 0}
              className="w-full h-14 bg-primary hover:bg-accent text-white rounded-2xl font-bold uppercase tracking-widest text-[11px] shadow-lg shadow-primary/20"
            >
              <Save className="w-5 h-5 mr-2" /> Guardar Pase de Lista
            </Button>
          </div>
        </div>

        <div className="lg:col-span-3 space-y-6">
          <div className="flex gap-4">
            <div className="relative flex-1">
              <Search className="absolute left-4 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
              <Input 
                placeholder="Buscar alumno por nombre o matrícula..." 
                className="pl-12 h-12 rounded-2xl bg-white shadow-sm border-none font-medium" 
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
              />
            </div>
          </div>

          <div className="bg-white border rounded-[2.5rem] overflow-hidden shadow-sm">
            <Table>
              <TableHeader className="bg-slate-50/50">
                <TableRow>
                  <TableHead className="px-8 font-bold py-5 uppercase text-[10px] tracking-widest">Alumno</TableHead>
                  <TableHead className="font-bold text-center uppercase text-[10px] tracking-widest">Estado</TableHead>
                  <TableHead className="font-bold text-right pr-8 uppercase text-[10px] tracking-widest">Acción Rápida</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {filteredStudents.length === 0 ? (
                  <TableRow>
                    <TableCell colSpan={3} className="py-24 text-center">
                      <div className="flex flex-col items-center opacity-30">
                        <ClipboardCheck className="w-16 h-16 mb-4" />
                        <p className="font-bold uppercase tracking-widest text-[10px]">Sin alumnos para mostrar</p>
                      </div>
                    </TableCell>
                  </TableRow>
                ) : filteredStudents.map(student => (
                  <TableRow key={student.id} className="hover:bg-slate-50/40 transition-colors">
                    <TableCell className="px-8 py-5">
                      <div className="flex items-center gap-4">
                        <div className="w-10 h-10 rounded-full bg-slate-100 flex items-center justify-center font-bold text-slate-500">
                          {student.firstName[0]}{student.lastName[0]}
                        </div>
                        <div>
                          <p className="font-bold text-slate-900">{student.firstName} {student.lastName}</p>
                          <p className="text-[10px] font-bold text-primary uppercase tracking-tight">{student.matricula}</p>
                        </div>
                      </div>
                    </TableCell>
                    <TableCell className="text-center">
                      {attendanceMap[student.id] ? (
                        <Badge 
                          className={cn(
                            "rounded-full px-4 py-1 font-bold text-[9px] uppercase",
                            attendanceMap[student.id] === 'Presente' ? "bg-green-100 text-green-700 hover:bg-green-100 border-none" :
                            attendanceMap[student.id] === 'Retraso' ? "bg-amber-100 text-amber-700 hover:bg-amber-100 border-none" :
                            attendanceMap[student.id] === 'Justificada' ? "bg-blue-100 text-blue-700 hover:bg-blue-100 border-none" :
                            "bg-red-100 text-red-700 hover:bg-red-100 border-none"
                          )}
                        >
                          {attendanceMap[student.id]}
                        </Badge>
                      ) : (
                        <span className="text-[9px] font-bold text-slate-300 uppercase tracking-widest">Pendiente</span>
                      )}
                    </TableCell>
                    <TableCell className="pr-8 py-5 text-right">
                      <div className="flex justify-end gap-2">
                        <Button 
                          size="sm" 
                          variant="outline" 
                          onClick={() => handleMarkAttendance(student.id, 'Presente')}
                          className={cn(
                            "rounded-full h-9 px-4 font-bold text-[9px] uppercase border-2",
                            attendanceMap[student.id] === 'Presente' && "border-green-600 bg-green-50 text-green-600"
                          )}
                        >
                          Presente
                        </Button>
                        <Button 
                          size="sm" 
                          variant="outline" 
                          onClick={() => handleMarkAttendance(student.id, 'Retraso')}
                          className={cn(
                            "rounded-full h-9 px-4 font-bold text-[9px] uppercase border-2",
                            attendanceMap[student.id] === 'Retraso' && "border-amber-500 bg-amber-50 text-amber-500"
                          )}
                        >
                          Retraso
                        </Button>
                        <Button 
                          size="sm" 
                          variant="outline" 
                          onClick={() => handleMarkAttendance(student.id, 'Justificada')}
                          className={cn(
                            "rounded-full h-9 px-4 font-bold text-[9px] uppercase border-2",
                            attendanceMap[student.id] === 'Justificada' && "border-blue-600 bg-blue-50 text-blue-600"
                          )}
                        >
                          Justificada
                        </Button>
                        <Button 
                          size="sm" 
                          variant="outline" 
                          onClick={() => handleMarkAttendance(student.id, 'Falta')}
                          className={cn(
                            "rounded-full h-9 px-4 font-bold text-[9px] uppercase border-2",
                            attendanceMap[student.id] === 'Falta' && "border-red-600 bg-red-50 text-red-600"
                          )}
                        >
                          Falta
                        </Button>
                      </div>
                    </TableCell>
                  </TableRow>
                ))}
              </TableBody>
            </Table>
          </div>
        </div>
      </div>

      <Dialog open={isCameraOpen} onOpenChange={setIsCameraOpen}>
        <DialogContent className="max-w-3xl rounded-[2rem] p-8 border-none shadow-2xl">
          <DialogHeader className="mb-6">
            <DialogTitle className="text-2xl font-bold uppercase tracking-tight flex items-center gap-3">
              <Camera className="w-6 h-6 text-primary" /> Identificación Biométrica
            </DialogTitle>
            <DialogDescription className="text-[10px] font-bold text-muted-foreground uppercase tracking-widest">
              Modo de prueba: Posiciona a los alumnos frente a la cámara para el pase de lista automático.
            </DialogDescription>
          </DialogHeader>
          <FacialRecognitionComponent 
            mode="recognize" 
            labeledDescriptors={labeledDescriptors}
            onRecognized={handleRecognized}
          />
          <div className="mt-8 flex justify-end">
            <Button variant="outline" className="rounded-xl px-8 h-12 font-bold uppercase tracking-widest text-[10px]" onClick={() => setIsCameraOpen(false)}>Finalizar Prueba</Button>
          </div>
        </DialogContent>
      </Dialog>
    </div>
  );
}
