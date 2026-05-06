
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
  const { data: asistencias } = useCollection(asistenciasRef);

  // States
  const [selectedGrupoId, setSelectedGrupoId] = useState<string>("");
  const [selectedMateriaId, setSelectedMateriaId] = useState<string>("");
  const [attendanceDate, setAttendanceDate] = useState(new Date().toISOString().split('T')[0]);
  const [attendanceMap, setAttendanceMap] = useState<Record<string, 'Presente' | 'Retraso' | 'Falta'>>({});
  const [searchQuery, setSearchQuery] = useState("");

  // Memoized Data
  const myGrupos = useMemo(() => {
    if (!user || !grupos) return [];
    // En un sistema real, filtraríamos por los grupoIds del usuario logueado
    // Para este MVP, mostramos todos si es admin o si el docente tiene grupos asignados
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
      toast({ variant: "destructive", title: "Faltan datos", description: "Selecciona grupo y materia." });
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

    toast({ title: "Asistencia Guardada", description: "Se han registrado los estados correctamente." });
    setAttendanceMap({});
  };

  const handleFaceRecognized = (descriptor: number[]) => {
    // La lógica de reconocimiento ya está en el componente FacialRecognitionComponent
    // Aquí solo cerramos el diálogo si fuera necesario o actualizamos estados globales
  };

  return (
    <div className="space-y-6 animate-in fade-in duration-500">
      <div className="border-b pb-6">
        <h1 className="text-3xl font-bold tracking-tight text-foreground uppercase">Panel Docente</h1>
        <p className="text-muted-foreground font-medium text-sm">Control de grupos y seguimiento de alumnos.</p>
      </div>

      <Tabs defaultValue="asistencia" className="w-full">
        <TabsList className="bg-slate-100 p-1 rounded-2xl h-14 w-full md:w-auto justify-start gap-1 border">
          <TabsTrigger value="asistencia" className="rounded-xl data-[state=active]:bg-white px-6 font-semibold flex gap-2"><CalendarCheck className="w-4 h-4" /> Pase de Lista</TabsTrigger>
          <TabsTrigger value="grupos" className="rounded-xl data-[state=active]:bg-white px-6 font-semibold flex gap-2"><Users className="w-4 h-4" /> Mis Grupos</TabsTrigger>
          <TabsTrigger value="reportes" className="rounded-xl data-[state=active]:bg-white px-6 font-semibold flex gap-2"><FileBarChart className="w-4 h-4" /> Reportes</TabsTrigger>
        </TabsList>

        <TabsContent value="grupos" className="mt-6">
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
            {myGrupos.map(g => (
              <div key={g.id} className="bg-white border rounded-3xl p-6 shadow-sm hover:shadow-md transition-all group border-border/60">
                <div className="flex justify-between items-start mb-4">
                  <div className="p-3 bg-primary/5 rounded-2xl text-primary group-hover:scale-110 transition-transform">
                    <Users className="w-6 h-6" />
                  </div>
                  <Badge variant="outline" className="rounded-full font-bold uppercase text-[10px]">
                    {g.cuatrimestre} Cuatrimestre
                  </Badge>
                </div>
                <h3 className="text-xl font-bold mb-1">{g.nombre}</h3>
                <p className="text-xs text-muted-foreground font-medium mb-4">{materias?.find(m => m.carreraId === g.carreraId)?.nombre || 'Carrera Asignada'}</p>
                <Button variant="ghost" className="w-full justify-between rounded-xl font-bold text-xs uppercase p-0 hover:bg-transparent" onClick={() => { setSelectedGrupoId(g.id); }}>
                  Ver Alumnos <ChevronRight className="w-4 h-4" />
                </Button>
              </div>
            ))}
          </div>
        </TabsContent>

        <TabsContent value="asistencia" className="mt-6 space-y-6">
          <div className="bg-white border rounded-3xl p-6 shadow-sm space-y-4">
            <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
              <div className="space-y-2">
                <label className="text-[10px] font-bold uppercase text-muted-foreground ml-1">Grupo</label>
                <Select value={selectedGrupoId} onValueChange={setSelectedGrupoId}>
                  <SelectTrigger className="rounded-xl h-11 font-medium"><SelectValue placeholder="Elegir Grupo..." /></SelectTrigger>
                  <SelectContent>
                    {myGrupos.map(g => <SelectItem key={g.id} value={g.id}>{g.nombre}</SelectItem>)}
                  </SelectContent>
                </Select>
              </div>
              <div className="space-y-2">
                <label className="text-[10px] font-bold uppercase text-muted-foreground ml-1">Materia</label>
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
                <label className="text-[10px] font-bold uppercase text-muted-foreground ml-1">Fecha</label>
                <Input type="date" value={attendanceDate} onChange={(e) => setAttendanceDate(e.target.value)} className="rounded-xl h-11 font-medium" />
              </div>
            </div>

            {selectedGrupoId && (
              <div className="flex flex-col md:flex-row gap-4 pt-4">
                <div className="relative flex-1">
                  <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
                  <Input 
                    placeholder="Buscar alumno..." 
                    className="pl-10 h-11 rounded-xl bg-slate-50 font-medium" 
                    value={searchQuery}
                    onChange={(e) => setSearchQuery(e.target.value)}
                  />
                </div>
                <Dialog>
                  <DialogTrigger asChild>
                    <Button variant="secondary" className="rounded-xl h-11 font-bold uppercase text-xs">
                      <Camera className="w-4 h-4 mr-2" /> Identificar Rostros
                    </Button>
                  </DialogTrigger>
                  <DialogContent className="max-w-3xl rounded-[2rem]">
                    <DialogHeader>
                      <DialogTitle className="font-bold text-xl uppercase">Validación Biométrica</DialogTitle>
                    </DialogHeader>
                    <FacialRecognitionComponent 
                      mode="recognize" 
                      labeledDescriptors={labeledDescriptors}
                      onCapture={handleFaceRecognized}
                    />
                  </DialogContent>
                </Dialog>
              </div>
            )}
          </div>

          {!selectedGrupoId ? (
            <div className="bg-slate-50 border border-dashed rounded-[2rem] py-20 text-center">
              <CalendarCheck className="w-12 h-12 text-slate-300 mx-auto mb-4" />
              <p className="text-slate-500 font-medium uppercase text-xs tracking-widest">Selecciona un grupo para iniciar el pase de lista</p>
            </div>
          ) : (
            <div className="bg-white border rounded-[2rem] overflow-hidden shadow-sm">
              <Table>
                <TableHeader className="bg-slate-50">
                  <TableRow>
                    <TableHead className="px-8 font-bold py-5 uppercase text-[10px] tracking-widest">Matrícula</TableHead>
                    <TableHead className="font-bold uppercase text-[10px] tracking-widest">Alumno</TableHead>
                    <TableHead className="font-bold text-center uppercase text-[10px] tracking-widest">Asistencia</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {filteredStudents.map(student => (
                    <TableRow key={student.id} className="hover:bg-slate-50/50">
                      <TableCell className="px-8 font-bold text-primary">{student.matricula}</TableCell>
                      <TableCell className="font-medium">{student.firstName} {student.lastName}</TableCell>
                      <TableCell className="p-4">
                        <div className="flex justify-center gap-2">
                          <Button 
                            variant={attendanceMap[student.id] === 'Presente' ? 'default' : 'outline'} 
                            size="sm" 
                            onClick={() => handleMarkAttendance(student.id, 'Presente')}
                            className={cn("rounded-full h-8 px-4 text-[10px] font-bold uppercase", attendanceMap[student.id] === 'Presente' && "bg-green-600 hover:bg-green-700 border-none")}
                          >
                            <CheckCircle2 className="w-3 h-3 mr-1" /> Presente
                          </Button>
                          <Button 
                            variant={attendanceMap[student.id] === 'Retraso' ? 'secondary' : 'outline'} 
                            size="sm" 
                            onClick={() => handleMarkAttendance(student.id, 'Retraso')}
                            className="rounded-full h-8 px-4 text-[10px] font-bold uppercase"
                          >
                            <Clock className="w-3 h-3 mr-1" /> Retraso
                          </Button>
                          <Button 
                            variant={attendanceMap[student.id] === 'Falta' ? 'destructive' : 'outline'} 
                            size="sm" 
                            onClick={() => handleMarkAttendance(student.id, 'Falta')}
                            className="rounded-full h-8 px-4 text-[10px] font-bold uppercase"
                          >
                            <XCircle className="w-3 h-3 mr-1" /> Falta
                          </Button>
                        </div>
                      </TableCell>
                    </TableRow>
                  ))}
                </TableBody>
              </Table>
              <div className="p-6 bg-slate-50 border-t flex justify-center">
                <Button onClick={handleSaveAttendance} className="bg-primary hover:bg-accent text-white px-12 h-12 rounded-xl font-bold uppercase tracking-tight shadow-lg shadow-primary/20">
                  <Save className="w-5 h-5 mr-2" /> Guardar Registro de Hoy
                </Button>
              </div>
            </div>
          )}
        </TabsContent>

        <TabsContent value="reportes" className="mt-6">
          <div className="bg-white border rounded-3xl p-8 text-center border-dashed">
            <FileBarChart className="w-16 h-16 text-slate-300 mx-auto mb-4" />
            <h2 className="text-xl font-bold mb-2">Estadísticas de Asistencia</h2>
            <p className="text-muted-foreground text-sm max-w-md mx-auto mb-8 font-medium">
              Próximamente podrás visualizar el porcentaje de asistencia, faltas acumuladas y retardos por alumno de tus grupos.
            </p>
            <div className="grid grid-cols-1 md:grid-cols-3 gap-6 max-w-4xl mx-auto">
              <div className="p-6 rounded-2xl bg-green-50 border border-green-100">
                <p className="text-[10px] font-bold text-green-700 uppercase mb-1">Promedio Asistencia</p>
                <h4 className="text-3xl font-bold text-green-900">--%</h4>
              </div>
              <div className="p-6 rounded-2xl bg-amber-50 border border-amber-100">
                <p className="text-[10px] font-bold text-amber-700 uppercase mb-1">Total Retrasos</p>
                <h4 className="text-3xl font-bold text-amber-900">--</h4>
              </div>
              <div className="p-6 rounded-2xl bg-red-50 border border-red-100">
                <p className="text-[10px] font-bold text-red-700 uppercase mb-1">Faltas Críticas</p>
                <h4 className="text-3xl font-bold text-red-900">--</h4>
              </div>
            </div>
          </div>
        </TabsContent>
      </Tabs>
    </div>
  );
}
