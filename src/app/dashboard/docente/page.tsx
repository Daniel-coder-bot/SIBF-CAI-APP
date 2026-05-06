
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
  GraduationCap,
  LayoutDashboard
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

export default function DocentePage() {
  const db = useFirestore();
  const { user } = useUser();
  const { toast } = useToast();

  // Queries
  const gruposRef = useMemoFirebase(() => collection(db, 'grupos'), [db]);
  const materiasRef = useMemoFirebase(() => collection(db, 'materias'), [db]);
  const usersRef = useMemoFirebase(() => collection(db, 'users'), [db]);
  const asistenciasRef = useMemoFirebase(() => collection(db, 'asistencias'), [db]);

  const { data: grupos } = useCollection(gruposRef);
  const { data: materias } = useCollection(materiasRef);
  const { data: allUsers } = useCollection(usersRef);

  // States
  const [selectedGrupoId, setSelectedGrupoId] = useState<string>("");
  const [selectedMateriaId, setSelectedMateriaId] = useState<string>("");
  const [attendanceDate, setAttendanceDate] = useState(new Date().toISOString().split('T')[0]);
  const [attendanceMap, setAttendanceMap] = useState<Record<string, 'Presente' | 'Retraso' | 'Falta'>>({});
  const [searchQuery, setSearchQuery] = useState("");

  // Memoized Data
  const myGrupos = useMemo(() => {
    if (!user || !grupos) return [];
    // En el MVP mostramos los grupos. En un sistema real se filtraría por el ID del docente logueado.
    return grupos; 
  }, [user, grupos]);

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
        docenteId: user?.uid,
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
            <h1 className="text-3xl font-bold tracking-tight text-foreground uppercase">Panel Docente</h1>
          </div>
          <p className="text-muted-foreground font-medium text-sm">Gestión académica y control de asistencia institucional.</p>
        </div>
        <div className="bg-slate-50 px-4 py-2 rounded-xl border border-border/50">
          <span className="text-xs font-bold text-primary uppercase">Módulo Docente v1.0</span>
        </div>
      </div>

      <Tabs defaultValue="asistencia" className="w-full">
        <TabsList className="bg-slate-100 p-1 rounded-2xl h-14 w-full md:w-auto justify-start gap-1 border">
          <TabsTrigger value="asistencia" className="rounded-xl data-[state=active]:bg-white px-6 font-semibold flex gap-2"><CalendarCheck className="w-4 h-4" /> Asistencia</TabsTrigger>
          <TabsTrigger value="grupos" className="rounded-xl data-[state=active]:bg-white px-6 font-semibold flex gap-2"><Users className="w-4 h-4" /> Mis Grupos</TabsTrigger>
          <TabsTrigger value="reportes" className="rounded-xl data-[state=active]:bg-white px-6 font-semibold flex gap-2"><FileBarChart className="w-4 h-4" /> Reportes</TabsTrigger>
        </TabsList>

        <TabsContent value="asistencia" className="mt-6 space-y-6">
          <div className="bg-white border rounded-3xl p-6 shadow-sm space-y-4">
            <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
              <div className="space-y-2">
                <label className="text-[10px] font-bold uppercase text-muted-foreground ml-1">Seleccionar Grupo</label>
                <Select value={selectedGrupoId} onValueChange={setSelectedGrupoId}>
                  <SelectTrigger className="rounded-xl h-11 font-medium"><SelectValue placeholder="Elegir Grupo..." /></SelectTrigger>
                  <SelectContent>
                    {myGrupos.map(g => <SelectItem key={g.id} value={g.id}>{g.nombre}</SelectItem>)}
                  </SelectContent>
                </Select>
              </div>
              <div className="space-y-2">
                <label className="text-[10px] font-bold uppercase text-muted-foreground ml-1">Seleccionar Materia</label>
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
                <label className="text-[10px] font-bold uppercase text-muted-foreground ml-1">Fecha de Registro</label>
                <Input type="date" value={attendanceDate} onChange={(e) => setAttendanceDate(e.target.value)} className="rounded-xl h-11 font-medium" />
              </div>
            </div>

            {selectedGrupoId && (
              <div className="flex flex-col md:flex-row gap-4 pt-4 border-t border-dashed">
                <div className="relative flex-1">
                  <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
                  <Input 
                    placeholder="Buscar alumno por nombre o matrícula..." 
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
              <p className="text-slate-400 font-bold uppercase text-[10px] tracking-[0.2em]">Configura el grupo y materia para iniciar</p>
            </div>
          ) : (
            <div className="bg-white border rounded-[2.5rem] overflow-hidden shadow-xl shadow-slate-200/50">
              <Table>
                <TableHeader className="bg-slate-50/50">
                  <TableRow>
                    <TableHead className="px-8 font-bold py-5 uppercase text-[10px] tracking-widest text-slate-500">Matrícula</TableHead>
                    <TableHead className="font-bold uppercase text-[10px] tracking-widest text-slate-500">Alumno</TableHead>
                    <TableHead className="font-bold text-center uppercase text-[10px] tracking-widest text-slate-500">Estado de Asistencia</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {filteredStudents.length === 0 ? (
                    <TableRow><TableCell colSpan={3} className="py-10 text-center text-muted-foreground font-medium italic">No se encontraron alumnos en este grupo.</TableCell></TableRow>
                  ) : filteredStudents.map(student => (
                    <TableRow key={student.id} className="hover:bg-slate-50/40 transition-colors">
                      <TableCell className="px-8 font-bold text-primary">{student.matricula}</TableCell>
                      <TableCell className="font-medium text-slate-900">{student.firstName} {student.lastName}</TableCell>
                      <TableCell className="p-4">
                        <div className="flex justify-center gap-2">
                          <Button 
                            variant={attendanceMap[student.id] === 'Presente' ? 'default' : 'outline'} 
                            size="sm" 
                            onClick={() => handleMarkAttendance(student.id, 'Presente')}
                            className={cn(
                              "rounded-full h-9 px-5 text-[9px] font-bold uppercase tracking-wider transition-all",
                              attendanceMap[student.id] === 'Presente' ? "bg-green-600 hover:bg-green-700 border-none shadow-md shadow-green-200" : "hover:border-green-600 hover:text-green-600"
                            )}
                          >
                            <CheckCircle2 className="w-3.5 h-3.5 mr-1.5" /> Presente
                          </Button>
                          <Button 
                            variant={attendanceMap[student.id] === 'Retraso' ? 'secondary' : 'outline'} 
                            size="sm" 
                            onClick={() => handleMarkAttendance(student.id, 'Retraso')}
                            className={cn(
                              "rounded-full h-9 px-5 text-[9px] font-bold uppercase tracking-wider transition-all",
                              attendanceMap[student.id] === 'Retraso' ? "bg-amber-500 text-white hover:bg-amber-600 border-none shadow-md shadow-amber-200" : "hover:border-amber-500 hover:text-amber-500"
                            )}
                          >
                            <Clock className="w-3.5 h-3.5 mr-1.5" /> Retraso
                          </Button>
                          <Button 
                            variant={attendanceMap[student.id] === 'Falta' ? 'destructive' : 'outline'} 
                            size="sm" 
                            onClick={() => handleMarkAttendance(student.id, 'Falta')}
                            className={cn(
                              "rounded-full h-9 px-5 text-[9px] font-bold uppercase tracking-wider transition-all",
                              attendanceMap[student.id] === 'Falta' ? "shadow-md shadow-red-200" : "hover:border-red-600 hover:text-red-600"
                            )}
                          >
                            <XCircle className="w-3.5 h-3.5 mr-1.5" /> Falta
                          </Button>
                        </div>
                      </TableCell>
                    </TableRow>
                  ))}
                </TableBody>
              </Table>
              <div className="p-8 bg-slate-50/50 border-t flex justify-center">
                <Button onClick={handleSaveAttendance} className="bg-primary hover:bg-accent text-white px-16 h-14 rounded-2xl font-bold uppercase tracking-widest text-xs shadow-xl shadow-primary/20 transform active:scale-95 transition-all">
                  <Save className="w-5 h-5 mr-3" /> Confirmar y Guardar Pase de Lista
                </Button>
              </div>
            </div>
          )}
        </TabsContent>

        <TabsContent value="grupos" className="mt-6">
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
            {myGrupos.map(g => (
              <div key={g.id} className="bg-white border rounded-[2rem] p-8 shadow-sm hover:shadow-xl transition-all group border-border/60 relative overflow-hidden">
                <div className="absolute top-0 right-0 w-32 h-32 bg-primary/5 rounded-full -mr-16 -mt-16 transition-transform group-hover:scale-125" />
                <div className="flex justify-between items-start mb-6 relative z-10">
                  <div className="p-4 bg-primary/10 rounded-2xl text-primary">
                    <Users className="w-7 h-7" />
                  </div>
                  <Badge variant="outline" className="rounded-full font-bold uppercase text-[9px] tracking-widest border-primary/20 text-primary px-3">
                    {g.cuatrimestre}º CUATRIMESTRE
                  </Badge>
                </div>
                <h3 className="text-2xl font-bold mb-2 text-slate-900">{g.nombre}</h3>
                <p className="text-xs text-muted-foreground font-medium mb-6 uppercase tracking-tight">Facultad de Ingeniería y Ciencias Aplicadas</p>
                <Button 
                  variant="ghost" 
                  className="w-full justify-between rounded-xl font-bold text-[10px] uppercase tracking-widest p-0 h-10 hover:bg-transparent hover:text-primary transition-colors" 
                  onClick={() => { setSelectedGrupoId(g.id); }}
                >
                  Gestionar Alumnos <ChevronRight className="w-4 h-4" />
                </Button>
              </div>
            ))}
          </div>
        </TabsContent>

        <TabsContent value="reportes" className="mt-6">
          <div className="bg-white border rounded-[3rem] p-12 text-center border-dashed">
            <div className="w-24 h-24 bg-slate-100 rounded-full flex items-center justify-center mx-auto mb-6">
              <FileBarChart className="w-12 h-12 text-slate-300" />
            </div>
            <h2 className="text-2xl font-bold mb-3 text-slate-900">Módulo de Analítica Docente</h2>
            <p className="text-muted-foreground text-sm max-w-lg mx-auto mb-10 font-medium leading-relaxed">
              Próximamente podrás visualizar el rendimiento académico, alertas de deserción por inasistencia y el historial completo de tus grupos.
            </p>
            <div className="grid grid-cols-1 md:grid-cols-3 gap-8 max-w-5xl mx-auto">
              <div className="p-8 rounded-[2rem] bg-green-50/50 border border-green-100">
                <p className="text-[10px] font-bold text-green-700 uppercase tracking-widest mb-2">Asistencia Promedio</p>
                <h4 className="text-4xl font-bold text-green-900 tracking-tighter">-- %</h4>
              </div>
              <div className="p-8 rounded-[2rem] bg-amber-50/50 border border-amber-100">
                <p className="text-[10px] font-bold text-amber-700 uppercase tracking-widest mb-2">Retrasos Totales</p>
                <h4 className="text-4xl font-bold text-amber-900 tracking-tighter">--</h4>
              </div>
              <div className="p-8 rounded-[2rem] bg-red-50/50 border border-red-100">
                <p className="text-[10px] font-bold text-red-700 uppercase tracking-widest mb-2">Faltas por Justificar</p>
                <h4 className="text-4xl font-bold text-red-900 tracking-tighter">--</h4>
              </div>
            </div>
          </div>
        </TabsContent>
      </Tabs>
    </div>
  );
}
