
"use client";

import React, { useState, useMemo } from 'react';
import { 
  Tabs, 
  TabsContent, 
  TabsList, 
  TabsTrigger 
} from "@/components/ui/tabs";
import { 
  Users, 
  CalendarCheck, 
  FileBarChart, 
  Search, 
  CheckCircle2, 
  XCircle, 
  Clock, 
  Camera,
  Save,
  ChevronRight,
  ShieldAlert,
  GraduationCap
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
import { Badge } from "@/components/ui/badge";
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
import { collection, serverTimestamp } from 'firebase/firestore';
import { useToast } from "@/hooks/use-toast";
import { cn } from "@/lib/utils";
import { FacialRecognitionComponent } from '@/components/FacialRecognitionComponent';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from "@/components/ui/dialog";
import { Textarea } from "@/components/ui/textarea";

export default function DocentePage() {
  const db = useFirestore();
  const { user } = useUser();
  const { toast } = useToast();

  // Queries
  const gruposRef = useMemoFirebase(() => collection(db, 'grupos'), [db]);
  const materiasRef = useMemoFirebase(() => collection(db, 'materias'), [db]);
  const usersRef = useMemoFirebase(() => collection(db, 'users'), [db]);
  const asistenciasRef = useMemoFirebase(() => collection(db, 'asistencias'), [db]);
  const justificacionesRef = useMemoFirebase(() => collection(db, 'justificaciones'), [db]);

  const { data: grupos } = useCollection(gruposRef);
  const { data: materias } = useCollection(materiasRef);
  const { data: allUsers } = useCollection(usersRef);
  const { data: justificaciones } = useCollection(justificacionesRef);

  // States
  const [selectedGrupoId, setSelectedGrupoId] = useState<string>("");
  const [selectedMateriaId, setSelectedMateriaId] = useState<string>("");
  const [attendanceDate, setAttendanceDate] = useState(new Date().toISOString().split('T')[0]);
  const [attendanceMap, setAttendanceMap] = useState<Record<string, 'Presente' | 'Retraso' | 'Falta'>>({});
  const [searchQuery, setSearchQuery] = useState("");

  // Memoized Data
  const myGrupos = useMemo(() => grupos || [], [grupos]);

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

  // Handlers
  const handleMarkAttendance = (alumnoId: string, estado: 'Presente' | 'Retraso' | 'Falta') => {
    setAttendanceMap(prev => ({ ...prev, [alumnoId]: estado }));
  };

  const handleSaveAttendance = () => {
    if (!selectedGrupoId || !selectedMateriaId) {
      toast({ variant: "destructive", title: "Datos incompletos", description: "Selecciona grupo y materia." });
      return;
    }

    const records = Object.entries(attendanceMap);
    if (records.length === 0) {
      toast({ variant: "destructive", title: "Sin cambios", description: "No has marcado ninguna asistencia." });
      return;
    }

    records.forEach(([alumnoId, estado]) => {
      addDocumentNonBlocking(asistenciasRef, {
        alumnoId,
        docenteId: user?.uid || 'docente-demo',
        grupoId: selectedGrupoId,
        materiaId: selectedMateriaId,
        fecha: attendanceDate,
        estado,
        createdAt: serverTimestamp()
      });
    });

    toast({ title: "Asistencia Guardada", description: `Se han registrado ${records.length} estados correctamente.` });
    setAttendanceMap({});
  };

  return (
    <div className="space-y-6 animate-in fade-in duration-500 pb-20">
      <div className="flex flex-col md:flex-row md:items-end justify-between gap-4 border-b pb-6">
        <div>
          <div className="flex items-center gap-2 mb-1">
            <div className="w-2 h-6 bg-primary rounded-full" />
            <h1 className="text-3xl font-bold tracking-tight text-foreground uppercase">Panel del Docente</h1>
          </div>
          <p className="text-muted-foreground font-medium text-sm">Control institucional de asistencia y desempeño académico.</p>
        </div>
      </div>

      <Tabs defaultValue="asistencia" className="w-full">
        <TabsList className="bg-slate-100 p-1 rounded-2xl h-14 w-full md:w-auto justify-start gap-1 border">
          <TabsTrigger value="asistencia" className="rounded-xl data-[state=active]:bg-white px-6 font-bold flex gap-2"><CalendarCheck className="w-4 h-4" /> Toma de Asistencia</TabsTrigger>
          <TabsTrigger value="justificaciones" className="rounded-xl data-[state=active]:bg-white px-6 font-bold flex gap-2"><ShieldAlert className="w-4 h-4" /> Justificaciones</TabsTrigger>
          <TabsTrigger value="reportes" className="rounded-xl data-[state=active]:bg-white px-6 font-bold flex gap-2"><FileBarChart className="w-4 h-4" /> Reportes</TabsTrigger>
        </TabsList>

        <TabsContent value="asistencia" className="mt-6 space-y-6">
          <div className="bg-white border rounded-3xl p-6 shadow-sm space-y-4">
            <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
              <div className="space-y-2">
                <label className="text-[10px] font-bold uppercase text-muted-foreground ml-1 tracking-widest">Seleccionar Grupo</label>
                <Select value={selectedGrupoId} onValueChange={setSelectedGrupoId}>
                  <SelectTrigger className="rounded-xl h-11 font-medium"><SelectValue placeholder="Elegir Grupo..." /></SelectTrigger>
                  <SelectContent>
                    {myGrupos.map(g => <SelectItem key={g.id} value={g.id}>{g.nombre}</SelectItem>)}
                  </SelectContent>
                </Select>
              </div>
              <div className="space-y-2">
                <label className="text-[10px] font-bold uppercase text-muted-foreground ml-1 tracking-widest">Seleccionar Materia</label>
                <Select value={selectedMateriaId} onValueChange={setSelectedMateriaId}>
                  <SelectTrigger className="rounded-xl h-11 font-medium"><SelectValue placeholder="Elegir Materia..." /></SelectTrigger>
                  <SelectContent>
                    {materias?.filter(m => m.carreraId === myGrupos.find(g => g.id === selectedGrupoId)?.carreraId).map(m => (
                      <SelectItem key={m.id} value={m.id}>{m.nombre}</SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>
              <div className="space-y-2">
                <label className="text-[10px] font-bold uppercase text-muted-foreground ml-1 tracking-widest">Fecha de Registro</label>
                <Input type="date" value={attendanceDate} onChange={(e) => setAttendanceDate(e.target.value)} className="rounded-xl h-11 font-medium" />
              </div>
            </div>

            {selectedGrupoId && (
              <div className="flex flex-col md:flex-row gap-4 pt-4 border-t border-dashed">
                <div className="relative flex-1">
                  <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
                  <Input 
                    placeholder="Buscar alumno..." 
                    className="pl-10 h-11 rounded-xl bg-slate-50 border-none font-medium" 
                    value={searchQuery}
                    onChange={(e) => setSearchQuery(e.target.value)}
                  />
                </div>
                <Dialog>
                  <DialogTrigger asChild>
                    <Button variant="secondary" className="rounded-xl h-11 font-bold uppercase text-[10px] tracking-widest bg-slate-900 text-white hover:bg-slate-800">
                      <Camera className="w-4 h-4 mr-2" /> Validación Biométrica
                    </Button>
                  </DialogTrigger>
                  <DialogContent className="max-w-3xl rounded-[2rem] p-8">
                    <DialogHeader>
                      <DialogTitle className="text-2xl font-bold uppercase tracking-tight flex items-center gap-2">
                        <Camera className="w-6 h-6 text-primary" /> Identificación en Tiempo Real
                      </DialogTitle>
                    </DialogHeader>
                    <FacialRecognitionComponent 
                      mode="recognize" 
                      labeledDescriptors={labeledDescriptors}
                    />
                  </DialogContent>
                </Dialog>
              </div>
            )}
          </div>

          {!selectedGrupoId ? (
            <div className="bg-slate-50 border-2 border-dashed rounded-[2.5rem] py-24 text-center">
              <CalendarCheck className="w-16 h-16 text-slate-200 mx-auto mb-4" />
              <p className="text-slate-400 font-bold uppercase text-[10px] tracking-[0.2em]">Configura el grupo para iniciar el pase de lista</p>
            </div>
          ) : (
            <div className="bg-white border rounded-[2.5rem] overflow-hidden shadow-sm">
              <Table>
                <TableHeader className="bg-slate-50/50">
                  <TableRow>
                    <TableHead className="px-8 font-bold py-5 uppercase text-[10px] tracking-widest">Matrícula</TableHead>
                    <TableHead className="font-bold uppercase text-[10px] tracking-widest">Alumno</TableHead>
                    <TableHead className="font-bold text-center uppercase text-[10px] tracking-widest">Estado</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {filteredStudents.length === 0 ? (
                    <TableRow><TableCell colSpan={3} className="py-10 text-center text-muted-foreground font-medium italic">No hay alumnos registrados en este grupo.</TableCell></TableRow>
                  ) : filteredStudents.map(student => (
                    <TableRow key={student.id} className="hover:bg-slate-50/40">
                      <TableCell className="px-8 font-bold text-primary">{student.matricula}</TableCell>
                      <TableCell className="font-medium">{student.firstName} {student.lastName}</TableCell>
                      <TableCell className="p-4">
                        <div className="flex justify-center gap-2">
                          <Button 
                            variant={attendanceMap[student.id] === 'Presente' ? 'default' : 'outline'} 
                            size="sm" 
                            onClick={() => handleMarkAttendance(student.id, 'Presente')}
                            className={cn(
                              "rounded-full h-8 px-4 text-[9px] font-bold uppercase transition-all",
                              attendanceMap[student.id] === 'Presente' ? "bg-green-600 hover:bg-green-700" : "hover:text-green-600"
                            )}
                          >
                            <CheckCircle2 className="w-3 h-3 mr-1" /> Presente
                          </Button>
                          <Button 
                            variant={attendanceMap[student.id] === 'Retraso' ? 'secondary' : 'outline'} 
                            size="sm" 
                            onClick={() => handleMarkAttendance(student.id, 'Retraso')}
                            className={cn(
                              "rounded-full h-8 px-4 text-[9px] font-bold uppercase transition-all",
                              attendanceMap[student.id] === 'Retraso' ? "bg-amber-500 text-white" : "hover:text-amber-500"
                            )}
                          >
                            <Clock className="w-3 h-3 mr-1" /> Retraso
                          </Button>
                          <Button 
                            variant={attendanceMap[student.id] === 'Falta' ? 'destructive' : 'outline'} 
                            size="sm" 
                            onClick={() => handleMarkAttendance(student.id, 'Falta')}
                            className={cn(
                              "rounded-full h-8 px-4 text-[9px] font-bold uppercase transition-all",
                              attendanceMap[student.id] === 'Falta' ? "bg-red-600" : "hover:text-red-600"
                            )}
                          >
                            <XCircle className="w-3 h-3 mr-1" /> Falta
                          </Button>
                        </div>
                      </TableCell>
                    </TableRow>
                  ))}
                </TableBody>
              </Table>
              <div className="p-8 bg-slate-50/50 border-t flex justify-center">
                <Button onClick={handleSaveAttendance} className="bg-primary hover:bg-accent text-white px-12 h-12 rounded-xl font-bold uppercase tracking-widest text-[10px] shadow-lg">
                  <Save className="w-4 h-4 mr-2" /> Guardar Pase de Lista
                </Button>
              </div>
            </div>
          )}
        </TabsContent>

        <TabsContent value="justificaciones" className="mt-6 space-y-6">
          <div className="bg-white border rounded-[2.5rem] p-8 shadow-sm">
            <h2 className="text-xl font-bold mb-6 flex items-center gap-2">
              <ShieldAlert className="w-5 h-5 text-primary" /> Justificantes Pendientes
            </h2>
            <div className="grid grid-cols-1 gap-4">
              {justificaciones && justificaciones.length > 0 ? justificaciones.map(j => (
                <div key={j.id} className="flex flex-col md:flex-row items-start md:items-center justify-between p-6 border rounded-3xl bg-slate-50/30 hover:bg-white transition-colors group">
                  <div className="flex gap-4 items-center mb-4 md:mb-0">
                    <div className="bg-primary/10 p-3 rounded-2xl"><GraduationCap className="w-6 h-6 text-primary" /></div>
                    <div>
                      <h4 className="font-bold text-slate-900">{allUsers?.find(u => u.id === j.alumnoId)?.firstName} {allUsers?.find(u => u.id === j.alumnoId)?.lastName}</h4>
                      <p className="text-xs font-medium text-muted-foreground uppercase tracking-tight">Fecha: {j.fecha} | Motivo: {j.motivo}</p>
                    </div>
                  </div>
                  <div className="flex gap-2 w-full md:w-auto">
                    <Button size="sm" variant="outline" className="flex-1 md:flex-none rounded-xl text-green-600 hover:bg-green-50">Aprobar</Button>
                    <Button size="sm" variant="outline" className="flex-1 md:flex-none rounded-xl text-red-600 hover:bg-red-50">Rechazar</Button>
                  </div>
                </div>
              )) : (
                <div className="py-12 text-center text-muted-foreground italic border-2 border-dashed rounded-[2rem]">
                  No hay solicitudes de justificación pendientes por revisar.
                </div>
              )}
            </div>
          </div>
        </TabsContent>

        <TabsContent value="reportes" className="mt-6">
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
            <div className="bg-white border rounded-[2rem] p-8 shadow-sm text-center">
               <FileBarChart className="w-12 h-12 text-primary/20 mx-auto mb-4" />
               <h3 className="font-bold text-lg mb-2">Asistencia Mensual</h3>
               <p className="text-xs text-muted-foreground mb-6">Gráficas de puntualidad y permanencia del grupo seleccionado.</p>
               <Button variant="outline" className="rounded-xl w-full font-bold text-[10px] uppercase">Ver Análisis</Button>
            </div>
            <div className="bg-white border rounded-[2rem] p-8 shadow-sm text-center">
               <Users className="w-12 h-12 text-primary/20 mx-auto mb-4" />
               <h3 className="font-bold text-lg mb-2">Desempeño Grupal</h3>
               <p className="text-xs text-muted-foreground mb-6">Identifica alumnos con alto riesgo de deserción por faltas.</p>
               <Button variant="outline" className="rounded-xl w-full font-bold text-[10px] uppercase">Ver Análisis</Button>
            </div>
            <div className="bg-white border rounded-[2rem] p-8 shadow-sm text-center border-dashed border-primary/40 bg-primary/[0.02]">
               <ShieldAlert className="w-12 h-12 text-primary/40 mx-auto mb-4" />
               <h3 className="font-bold text-lg mb-2">Alertas de Alumnos</h3>
               <p className="text-xs text-muted-foreground mb-6">Resumen de justificantes y retardos críticos semanales.</p>
               <Button className="bg-primary rounded-xl w-full font-bold text-[10px] uppercase">Configurar Alertas</Button>
            </div>
          </div>
        </TabsContent>
      </Tabs>
    </div>
  );
}
