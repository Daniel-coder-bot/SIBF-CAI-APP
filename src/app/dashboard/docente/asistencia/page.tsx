
"use client";

import React, { useState, useMemo } from 'react';
import { 
  CalendarCheck, 
  Search, 
  CheckCircle2, 
  XCircle, 
  Clock, 
  Camera,
  Save,
  ClipboardCheck
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
import { collection, serverTimestamp } from 'firebase/firestore';
import { useToast } from "@/hooks/use-toast";
import { cn } from "@/lib/utils";
import { FacialRecognitionComponent } from '@/components/FacialRecognitionComponent';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from "@/components/ui/dialog";

export default function TomaAsistenciaPage() {
  const db = useFirestore();
  const { user } = useUser();
  const { toast } = useToast();

  const gruposRef = useMemoFirebase(() => collection(db, 'grupos'), [db]);
  const materiasRef = useMemoFirebase(() => collection(db, 'materias'), [db]);
  const usersRef = useMemoFirebase(() => collection(db, 'users'), [db]);
  const asistenciasRef = useMemoFirebase(() => collection(db, 'asistencias'), [db]);

  const { data: grupos } = useCollection(gruposRef);
  const { data: materias } = useCollection(materiasRef);
  const { data: allUsers } = useCollection(usersRef);

  const [selectedGrupoId, setSelectedGrupoId] = useState<string>("");
  const [selectedMateriaId, setSelectedMateriaId] = useState<string>("");
  const [attendanceDate, setAttendanceDate] = useState(new Date().toISOString().split('T')[0]);
  const [attendanceMap, setAttendanceMap] = useState<Record<string, 'Presente' | 'Retraso' | 'Falta'>>({});
  const [searchQuery, setSearchQuery] = useState("");

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
      <div className="border-b pb-6">
        <h1 className="text-3xl font-bold tracking-tight text-foreground uppercase flex items-center gap-2">
          <ClipboardCheck className="w-8 h-8 text-primary" /> Pase de Lista
        </h1>
        <p className="text-muted-foreground font-medium text-sm">Registro de asistencia diaria con validación biométrica.</p>
      </div>

      <div className="bg-white border rounded-3xl p-6 shadow-sm space-y-4">
        <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
          <div className="space-y-2">
            <label className="text-[10px] font-bold uppercase text-muted-foreground ml-1 tracking-widest">Grupo</label>
            <Select value={selectedGrupoId} onValueChange={setSelectedGrupoId}>
              <SelectTrigger className="rounded-xl h-11 font-medium"><SelectValue placeholder="Elegir Grupo..." /></SelectTrigger>
              <SelectContent>
                {grupos?.map(g => <SelectItem key={g.id} value={g.id}>{g.nombre}</SelectItem>)}
              </SelectContent>
            </Select>
          </div>
          <div className="space-y-2">
            <label className="text-[10px] font-bold uppercase text-muted-foreground ml-1 tracking-widest">Materia</label>
            <Select value={selectedMateriaId} onValueChange={setSelectedMateriaId}>
              <SelectTrigger className="rounded-xl h-11 font-medium"><SelectValue placeholder="Elegir Materia..." /></SelectTrigger>
              <SelectContent>
                {materias?.filter(m => m.carreraId === grupos?.find(g => g.id === selectedGrupoId)?.carreraId).map(m => (
                  <SelectItem key={m.id} value={m.id}>{m.nombre}</SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>
          <div className="space-y-2">
            <label className="text-[10px] font-bold uppercase text-muted-foreground ml-1 tracking-widest">Fecha</label>
            <Input type="date" value={attendanceDate} onChange={(e) => setAttendanceDate(e.target.value)} className="rounded-xl h-11 font-medium" />
          </div>
        </div>

        {selectedGrupoId && (
          <div className="flex flex-col md:flex-row gap-4 pt-4 border-t border-dashed">
            <div className="relative flex-1">
              <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
              <Input 
                placeholder="Buscar por nombre o matrícula..." 
                className="pl-10 h-11 rounded-xl bg-slate-50 border-none font-medium" 
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
              />
            </div>
            <Dialog>
              <DialogTrigger asChild>
                <Button variant="secondary" className="rounded-xl h-11 font-bold uppercase text-[10px] tracking-widest bg-slate-900 text-white hover:bg-slate-800">
                  <Camera className="w-4 h-4 mr-2" /> Validación Biométrica AI
                </Button>
              </DialogTrigger>
              <DialogContent className="max-w-3xl rounded-[2rem] p-8">
                <DialogHeader>
                  <DialogTitle className="text-2xl font-bold uppercase tracking-tight flex items-center gap-2">
                    <Camera className="w-6 h-6 text-primary" /> Identificación Biométrica
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
        <div className="bg-white border rounded-[2.5rem] overflow-hidden shadow-sm">
          <Table>
            <TableHeader className="bg-slate-50/50">
              <TableRow>
                <TableHead className="px-8 font-bold py-5 uppercase text-[10px] tracking-widest">Matrícula</TableHead>
                <TableHead className="font-bold uppercase text-[10px] tracking-widest">Alumno</TableHead>
                <TableHead className="font-bold text-center uppercase text-[10px] tracking-widest">Estado de Asistencia</TableHead>
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
              <Save className="w-4 h-4 mr-2" /> Guardar Registros de Hoy
            </Button>
          </div>
        </div>
      )}
    </div>
  );
}
