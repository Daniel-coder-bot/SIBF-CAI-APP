
"use client";

import React, { useState, useRef, useMemo, useEffect } from 'react';
import { 
  Tabs, 
  TabsContent, 
  TabsList, 
  TabsTrigger 
} from "@/components/ui/tabs";
import { 
  Building2, 
  BookOpen, 
  FolderTree, 
  Users, 
  Clock, 
  Plus, 
  Trash2, 
  Edit2,
  Upload,
  Download,
  Copy,
  Check,
  Search,
  XCircle,
  Wrench,
  AlertCircle,
  MoreVertical,
  Briefcase,
  GraduationCap,
  Camera,
  ScanFace,
  Save,
  Grid
} from 'lucide-react';
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { 
  Select, 
  SelectContent, 
  SelectItem, 
  SelectTrigger, 
  SelectValue 
} from "@/components/ui/select";
import { 
  Dialog, 
  DialogContent, 
  DialogHeader, 
  DialogTitle, 
  DialogTrigger,
  DialogFooter,
  DialogDescription
} from "@/components/ui/dialog";
import { 
  Table, 
  TableBody, 
  TableCell, 
  TableHead, 
  TableHeader, 
  TableRow 
} from "@/components/ui/table";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import { Checkbox } from "@/components/ui/checkbox";
import { ScrollArea } from "@/components/ui/scroll-area";
import { 
  useFirestore, 
  useCollection, 
  useMemoFirebase,
  addDocumentNonBlocking,
  updateDocumentNonBlocking,
  deleteDocumentNonBlocking
} from '@/firebase';
import { collection, doc, serverTimestamp, setDoc } from 'firebase/firestore';
import { useToast } from "@/hooks/use-toast";
import { cn } from "@/lib/utils";
import * as XLSX from 'xlsx';
import { FacialRecognitionComponent } from '@/components/FacialRecognitionComponent';

const DAYS = ["Lunes", "Martes", "Miércoles", "Jueves", "Viernes"];
const SLOTS = [
  { id: "1", range: "7:00 - 8:00", start: "07:00", end: "08:00" },
  { id: "2", range: "8:00 - 9:00", start: "08:00", end: "09:00" },
  { id: "3", range: "9:00 - 10:00", start: "09:00", end: "10:00" },
  { id: "4", range: "10:00 - 11:00", start: "10:00", end: "11:00" },
];

export default function CatalogosPage() {
  const db = useFirestore();
  const { toast } = useToast();
  const fileInputRef = useRef<HTMLInputElement>(null);

  // Queries
  const sedesRef = useMemoFirebase(() => collection(db, 'sedes'), [db]);
  const carrerasRef = useMemoFirebase(() => collection(db, 'carreras'), [db]);
  const materiasRef = useMemoFirebase(() => collection(db, 'materias'), [db]);
  const gruposRef = useMemoFirebase(() => collection(db, 'grupos'), [db]);
  const horariosRef = useMemoFirebase(() => collection(db, 'horarios'), [db]);
  const usersRef = useMemoFirebase(() => collection(db, 'users'), [db]);

  const { data: sedes } = useCollection(sedesRef);
  const { data: carreras } = useCollection(carrerasRef);
  const { data: materias } = useCollection(materiasRef);
  const { data: grupos } = useCollection(gruposRef);
  const { data: horarios } = useCollection(horariosRef);
  const { data: allUsers } = useCollection(usersRef);

  const docentes = useMemo(() => allUsers?.filter(u => u.role === 'Docente') || [], [allUsers]);
  const alumnos = useMemo(() => allUsers?.filter(u => u.role === 'Alumno') || [], [allUsers]);

  // States
  const [openDialog, setOpenDialog] = useState<string | null>(null);
  const [newSede, setNewSede] = useState({ nombre: '', ubicacion: '' });
  const [newCarrera, setNewCarrera] = useState({ nombre: '', sedeId: '' });
  const [newMateria, setNewMateria] = useState({ nombre: '', codigo: '', carreraId: '', cuatrimestre: '' });
  const [newGrupo, setNewGrupo] = useState({ nombre: '', carreraId: '', cuatrimestre: '' });
  const [newUser, setNewUser] = useState({ 
    firstName: '', 
    lastName: '', 
    email: '', 
    password: '', 
    role: 'Alumno', 
    carreraId: '', 
    sedeId: '',
    matricula: '',
    grupoId: '',
    grupoIds: [] as string[]
  });

  // Schedule States
  const [selectedGrupoScheduleId, setSelectedGrupoScheduleId] = useState<string>("");
  const [isEditingSchedule, setIsEditingSchedule] = useState(false);
  const [tempGrid, setTempGrid] = useState<Record<string, { materiaId: string, docenteId: string, aula: string }>>({});

  const selectedGrupoForSchedule = useMemo(() => grupos?.find(g => g.id === selectedGrupoScheduleId), [grupos, selectedGrupoScheduleId]);
  const filteredMateriasForSelectedGrupo = useMemo(() => materias?.filter(m => m.carreraId === selectedGrupoForSchedule?.carreraId) || [], [materias, selectedGrupoForSchedule]);
  const filteredDocentesForSelectedGrupo = useMemo(() => docentes.filter(d => d.grupoIds?.includes(selectedGrupoScheduleId)), [docentes, selectedGrupoScheduleId]);

  useEffect(() => {
    if (selectedGrupoScheduleId && horarios) {
      const grid: Record<string, any> = {};
      horarios.filter(h => h.grupoId === selectedGrupoScheduleId).forEach(h => {
        const slotIdx = SLOTS.findIndex(s => s.start === h.horaInicio);
        if (slotIdx !== -1) {
          grid[`${h.dia}-${slotIdx + 1}`] = { 
            materiaId: h.materiaId, 
            docenteId: h.docenteId, 
            aula: h.aula || '' 
          };
        }
      });
      setTempGrid(grid);
    }
  }, [selectedGrupoScheduleId, horarios]);

  const handleSaveBulkSchedule = () => {
    if (!selectedGrupoScheduleId) return;
    const currentHorarios = horarios?.filter(h => h.grupoId === selectedGrupoScheduleId) || [];
    currentHorarios.forEach(h => deleteDocumentNonBlocking(doc(db, 'horarios', h.id)));
    Object.entries(tempGrid).forEach(([key, val]) => {
      if (val.materiaId) {
        const [dia, slotId] = key.split('-');
        const slot = SLOTS.find(s => s.id === slotId);
        if (slot) {
          const newDocRef = doc(collection(db, 'horarios'));
          setDoc(newDocRef, {
            ...val,
            grupoId: selectedGrupoScheduleId,
            dia,
            horaInicio: slot.start,
            horaFin: slot.end,
            createdAt: serverTimestamp()
          });
        }
      }
    });
    setIsEditingSchedule(false);
    toast({ title: "Horario Actualizado", description: "Se han guardado todos los cambios del grupo." });
  };

  const handleAdd = (ref: any, data: any, setter: any, emptyData: any, title: string) => {
    addDocumentNonBlocking(ref, { ...data, createdAt: serverTimestamp() });
    setter(emptyData);
    setOpenDialog(null);
    toast({ title: `${title} guardado` });
  };

  const handleDelete = (collectionName: string, id: string) => {
    deleteDocumentNonBlocking(doc(db, collectionName, id));
    toast({ variant: "destructive", title: "Eliminado" });
  };

  // Facial Recognition
  const [faceTargetUser, setFaceTargetUser] = useState<any>(null);
  const handleSaveFaceDescriptor = (descriptor: number[]) => {
    if (!faceTargetUser) return;
    updateDocumentNonBlocking(doc(db, 'users', faceTargetUser.id), { 
      faceDescriptor: descriptor,
      updatedAt: serverTimestamp()
    });
    setOpenDialog(null);
    setFaceTargetUser(null);
    toast({ title: "Biometría Guardada" });
  };

  return (
    <div className="space-y-6 animate-in fade-in duration-500 pb-20">
      <div className="flex justify-between items-end pb-4 border-b">
        <div>
          <h1 className="text-3xl font-black tracking-tighter text-foreground uppercase">Catálogos SIBF - CAI</h1>
          <p className="text-muted-foreground font-medium text-sm">Administración centralizada de la estructura académica.</p>
        </div>
      </div>

      <Tabs defaultValue="horarios" className="w-full">
        <TabsList className="bg-slate-100/80 p-1 rounded-2xl h-14 w-full justify-start gap-1 border overflow-x-auto scrollbar-hide">
          <TabsTrigger value="horarios" className="rounded-xl data-[state=active]:bg-white px-4 font-bold flex gap-2"><Clock className="w-4 h-4" /> Planeación Horarios</TabsTrigger>
          <TabsTrigger value="sedes" className="rounded-xl data-[state=active]:bg-white px-4 font-bold flex gap-2"><Building2 className="w-4 h-4" /> Sedes</TabsTrigger>
          <TabsTrigger value="carreras" className="rounded-xl data-[state=active]:bg-white px-4 font-bold flex gap-2"><BookOpen className="w-4 h-4" /> Carreras</TabsTrigger>
          <TabsTrigger value="materias" className="rounded-xl data-[state=active]:bg-white px-4 font-bold flex gap-2"><FolderTree className="w-4 h-4" /> Materias</TabsTrigger>
          <TabsTrigger value="grupos" className="rounded-xl data-[state=active]:bg-white px-4 font-bold flex gap-2"><Users className="w-4 h-4" /> Grupos</TabsTrigger>
          <TabsTrigger value="docentes" className="rounded-xl data-[state=active]:bg-white px-4 font-bold flex gap-2"><Briefcase className="w-4 h-4" /> Docentes</TabsTrigger>
          <TabsTrigger value="alumnos" className="rounded-xl data-[state=active]:bg-white px-4 font-bold flex gap-2"><GraduationCap className="w-4 h-4" /> Alumnos</TabsTrigger>
        </TabsList>

        {/* --- HORARIOS --- */}
        <TabsContent value="horarios" className="mt-6 space-y-6">
          <div className="flex flex-col md:flex-row justify-between items-start md:items-center gap-4 bg-white p-6 rounded-3xl border shadow-sm">
            <div className="space-y-1">
              <h2 className="text-xl font-bold flex items-center gap-2"><Grid className="w-5 h-5 text-primary" /> Generador de Horarios por Grupo</h2>
              <p className="text-xs text-muted-foreground">Selecciona un grupo para gestionar sus bloques de clase (7:00 AM - 11:00 AM).</p>
            </div>
            <div className="flex gap-2 w-full md:w-auto">
              <Select value={selectedGrupoScheduleId} onValueChange={setSelectedGrupoScheduleId}>
                <SelectTrigger className="w-full md:w-[300px] h-11 rounded-xl font-bold"><SelectValue placeholder="Seleccionar Grupo..." /></SelectTrigger>
                <SelectContent>
                  {grupos?.map(g => <SelectItem key={g.id} value={g.id}>{g.nombre} - {carreras?.find(c => c.id === g.carreraId)?.nombre}</SelectItem>)}
                </SelectContent>
              </Select>
              {selectedGrupoScheduleId && (
                <Button onClick={() => setIsEditingSchedule(!isEditingSchedule)} variant={isEditingSchedule ? "destructive" : "outline"} className="rounded-xl h-11 font-bold">
                  {isEditingSchedule ? "Cancelar Edición" : "Editar Horario"}
                </Button>
              )}
            </div>
          </div>

          {!selectedGrupoScheduleId ? (
            <div className="flex flex-col items-center justify-center py-20 bg-slate-50 border border-dashed rounded-3xl">
              <Clock className="w-12 h-12 text-slate-300 mb-4" />
              <p className="text-slate-500 font-medium">Elige un grupo arriba para ver su programación.</p>
            </div>
          ) : (
            <div className="space-y-4 animate-in fade-in duration-500">
               <div className="bg-white border p-8 rounded-t-3xl border-b-0 text-center relative overflow-hidden">
                  <div className="absolute top-0 left-0 w-full h-1 bg-primary" />
                  <p className="text-xs font-bold uppercase tracking-widest text-muted-foreground">Horario Escolar 7:00 a 11:00</p>
                  <h1 className="text-5xl font-black tracking-tighter uppercase text-slate-900">{selectedGrupoForSchedule?.nombre}</h1>
                  <p className="text-xs font-medium text-slate-500 uppercase">{carreras?.find(c => c.id === selectedGrupoForSchedule?.carreraId)?.nombre}</p>
               </div>
               <div className="bg-white border border-slate-900 overflow-hidden shadow-2xl">
                 <div className="grid grid-cols-[80px_repeat(4,1fr)] border-b border-slate-900 bg-slate-100/50 font-bold text-[10px] uppercase">
                    <div className="border-r border-slate-900 flex items-center justify-center">Día / Hora</div>
                    {SLOTS.map(s => <div key={s.id} className="border-r border-slate-900 p-2 text-center flex flex-col items-center justify-center"><span>Bloque {s.id}</span><span className="text-[8px] opacity-60">{s.range}</span></div>)}
                 </div>
                 {DAYS.map(day => (
                    <div key={day} className="grid grid-cols-[80px_repeat(4,1fr)] border-b border-slate-900 last:border-b-0 min-h-[140px]">
                      <div className="border-r border-slate-900 flex items-center justify-center bg-slate-50 font-black text-2xl uppercase">{day.substring(0, 2)}</div>
                      {SLOTS.map(slot => {
                        const key = `${day}-${slot.id}`;
                        const cell = tempGrid[key];
                        return (
                          <div key={key} className="border-r border-slate-900 p-3 flex flex-col justify-center gap-2">
                            {isEditingSchedule ? (
                              <>
                                <Select value={cell?.materiaId || "none"} onValueChange={(v) => setTempGrid({...tempGrid, [key]: { ...cell, materiaId: v === "none" ? "" : v }})}>
                                  <SelectTrigger className="h-7 text-[9px] font-bold"><SelectValue placeholder="Materia" /></SelectTrigger>
                                  <SelectContent>
                                    <SelectItem value="none">-- Vacío --</SelectItem>
                                    {filteredMateriasForSelectedGrupo.map(m => <SelectItem key={m.id} value={m.id}>{m.nombre}</SelectItem>)}
                                  </SelectContent>
                                </Select>
                                <Select value={cell?.docenteId || "none"} onValueChange={(v) => setTempGrid({...tempGrid, [key]: { ...cell, docenteId: v === "none" ? "" : v }})}>
                                  <SelectTrigger className="h-7 text-[9px] font-bold"><SelectValue placeholder="Docente" /></SelectTrigger>
                                  <SelectContent>
                                    <SelectItem value="none">-- Vacío --</SelectItem>
                                    {filteredDocentesForSelectedGrupo.map(d => <SelectItem key={d.id} value={d.id}>{d.firstName} {d.lastName}</SelectItem>)}
                                  </SelectContent>
                                </Select>
                                <Input placeholder="Aula (Opcional)" className="h-7 text-[9px] font-bold" value={cell?.aula || ''} onChange={(e) => setTempGrid({...tempGrid, [key]: { ...cell, aula: e.target.value }})} />
                              </>
                            ) : (
                              cell?.materiaId ? (
                                <>
                                  <span className="text-[10px] font-black uppercase">{materias?.find(m => m.id === cell.materiaId)?.nombre}</span>
                                  <span className="text-[8px] italic text-muted-foreground">{docentes.find(d => d.id === cell.docenteId)?.firstName} {docentes.find(d => d.id === cell.docenteId)?.lastName}</span>
                                  {cell.aula && <span className="text-[8px] font-bold text-primary">AULA: {cell.aula}</span>}
                                </>
                              ) : <span className="m-auto opacity-10 font-bold text-xs">Libre</span>
                            )}
                          </div>
                        );
                      })}
                    </div>
                 ))}
               </div>
               {isEditingSchedule && (
                 <div className="flex justify-center pt-6"><Button onClick={handleSaveBulkSchedule} className="bg-primary px-12 py-7 rounded-2xl font-black text-xl shadow-xl uppercase"><Save className="w-6 h-6 mr-2" /> Guardar Todo</Button></div>
               )}
            </div>
          )}
        </TabsContent>

        {/* --- SEDES --- */}
        <TabsContent value="sedes" className="mt-6 space-y-4">
          <div className="flex justify-between items-center"><h2 className="text-xl font-bold">Gestión de Sedes</h2><Button onClick={() => setOpenDialog('sede')} className="bg-primary rounded-xl font-bold"><Plus className="w-4 h-4 mr-2" /> Nueva Sede</Button></div>
          <div className="bg-white border rounded-3xl overflow-hidden shadow-sm">
            <Table><TableHeader className="bg-slate-50"><TableRow><TableHead className="px-6 font-bold py-4">Nombre</TableHead><TableHead className="font-bold">Ubicación</TableHead><TableHead className="text-right pr-6 font-bold">Acciones</TableHead></TableRow></TableHeader>
              <TableBody>{sedes?.map(s => (<TableRow key={s.id}><TableCell className="px-6 font-medium">{s.nombre}</TableCell><TableCell>{s.ubicacion}</TableCell><TableCell className="text-right pr-6"><Button variant="ghost" size="icon" onClick={() => handleDelete('sedes', s.id)}><Trash2 className="w-4 h-4 text-primary" /></Button></TableCell></TableRow>))}</TableBody>
            </Table>
          </div>
          <Dialog open={openDialog === 'sede'} onOpenChange={(o) => setOpenDialog(o ? 'sede' : null)}>
            <DialogContent className="rounded-3xl">
              <DialogHeader><DialogTitle>Agregar Sede</DialogTitle></DialogHeader>
              <div className="space-y-4 py-4">
                <div className="space-y-2"><Label>Nombre</Label><Input value={newSede.nombre} onChange={e => setNewSede({...newSede, nombre: e.target.value})} /></div>
                <div className="space-y-2"><Label>Ubicación</Label><Input value={newSede.ubicacion} onChange={e => setNewSede({...newSede, ubicacion: e.target.value})} /></div>
              </div>
              <DialogFooter><Button onClick={() => handleAdd(sedesRef, newSede, setNewSede, {nombre: '', ubicacion: ''}, "Sede")} className="w-full bg-primary font-bold">Guardar Sede</Button></DialogFooter>
            </DialogContent>
          </Dialog>
        </TabsContent>

        {/* --- CARRERAS --- */}
        <TabsContent value="carreras" className="mt-6 space-y-4">
          <div className="flex justify-between items-center"><h2 className="text-xl font-bold">Programas Académicos</h2><Button onClick={() => setOpenDialog('carrera')} className="bg-primary rounded-xl font-bold"><Plus className="w-4 h-4 mr-2" /> Nueva Carrera</Button></div>
          <div className="bg-white border rounded-3xl overflow-hidden shadow-sm">
            <Table><TableHeader className="bg-slate-50"><TableRow><TableHead className="px-6 font-bold py-4">Carrera</TableHead><TableHead className="font-bold">Sede</TableHead><TableHead className="text-right pr-6 font-bold">Acciones</TableHead></TableRow></TableHeader>
              <TableBody>{carreras?.map(c => (<TableRow key={c.id}><TableCell className="px-6 font-medium">{c.nombre}</TableCell><TableCell>{sedes?.find(s => s.id === c.sedeId)?.nombre}</TableCell><TableCell className="text-right pr-6"><Button variant="ghost" size="icon" onClick={() => handleDelete('carreras', c.id)}><Trash2 className="w-4 h-4 text-primary" /></Button></TableCell></TableRow>))}</TableBody>
            </Table>
          </div>
          <Dialog open={openDialog === 'carrera'} onOpenChange={(o) => setOpenDialog(o ? 'carrera' : null)}>
            <DialogContent className="rounded-3xl">
              <DialogHeader><DialogTitle>Agregar Carrera</DialogTitle></DialogHeader>
              <div className="space-y-4 py-4">
                <div className="space-y-2"><Label>Nombre</Label><Input value={newCarrera.nombre} onChange={e => setNewCarrera({...newCarrera, nombre: e.target.value})} /></div>
                <div className="space-y-2"><Label>Sede</Label>
                  <Select value={newCarrera.sedeId} onValueChange={v => setNewCarrera({...newCarrera, sedeId: v})}>
                    <SelectTrigger className="rounded-xl"><SelectValue placeholder="Seleccionar Sede" /></SelectTrigger>
                    <SelectContent>{sedes?.map(s => <SelectItem key={s.id} value={s.id}>{s.nombre}</SelectItem>)}</SelectContent>
                  </Select>
                </div>
              </div>
              <DialogFooter><Button onClick={() => handleAdd(carrerasRef, newCarrera, setNewCarrera, {nombre: '', sedeId: ''}, "Carrera")} className="w-full bg-primary font-bold">Guardar Carrera</Button></DialogFooter>
            </DialogContent>
          </Dialog>
        </TabsContent>

        {/* --- MATERIAS --- */}
        <TabsContent value="materias" className="mt-6 space-y-4">
          <div className="flex justify-between items-center"><h2 className="text-xl font-bold">Plan de Estudios</h2><Button onClick={() => setOpenDialog('materia')} className="bg-primary rounded-xl font-bold"><Plus className="w-4 h-4 mr-2" /> Nueva Materia</Button></div>
          <div className="bg-white border rounded-3xl overflow-hidden shadow-sm">
            <Table><TableHeader className="bg-slate-50"><TableRow><TableHead className="px-6 font-bold py-4">Materia</TableHead><TableHead className="font-bold">Carrera</TableHead><TableHead className="font-bold">Cuatrimestre</TableHead><TableHead className="text-right pr-6 font-bold">Acciones</TableHead></TableRow></TableHeader>
              <TableBody>{materias?.map(m => (<TableRow key={m.id}><TableCell className="px-6 font-medium">{m.nombre}</TableCell><TableCell>{carreras?.find(c => c.id === m.carreraId)?.nombre}</TableCell><TableCell>{m.cuatrimestre}°</TableCell><TableCell className="text-right pr-6"><Button variant="ghost" size="icon" onClick={() => handleDelete('materias', m.id)}><Trash2 className="w-4 h-4 text-primary" /></Button></TableCell></TableRow>))}</TableBody>
            </Table>
          </div>
          <Dialog open={openDialog === 'materia'} onOpenChange={(o) => setOpenDialog(o ? 'materia' : null)}>
            <DialogContent className="rounded-3xl">
              <DialogHeader><DialogTitle>Agregar Materia</DialogTitle></DialogHeader>
              <div className="space-y-4 py-4">
                <div className="space-y-2"><Label>Nombre</Label><Input value={newMateria.nombre} onChange={e => setNewMateria({...newMateria, nombre: e.target.value})} /></div>
                <div className="space-y-2"><Label>Carrera</Label>
                  <Select value={newMateria.carreraId} onValueChange={v => setNewMateria({...newMateria, carreraId: v})}>
                    <SelectTrigger className="rounded-xl"><SelectValue placeholder="Seleccionar Carrera" /></SelectTrigger>
                    <SelectContent>{carreras?.map(c => <SelectItem key={c.id} value={c.id}>{c.nombre}</SelectItem>)}</SelectContent>
                  </Select>
                </div>
                <div className="space-y-2"><Label>Cuatrimestre</Label><Input type="number" value={newMateria.cuatrimestre} onChange={e => setNewMateria({...newMateria, cuatrimestre: e.target.value})} /></div>
              </div>
              <DialogFooter><Button onClick={() => handleAdd(materiasRef, newMateria, setNewMateria, {nombre: '', codigo: '', carreraId: '', cuatrimestre: ''}, "Materia")} className="w-full bg-primary font-bold">Guardar Materia</Button></DialogFooter>
            </DialogContent>
          </Dialog>
        </TabsContent>

        {/* --- GRUPOS --- */}
        <TabsContent value="grupos" className="mt-6 space-y-4">
          <div className="flex justify-between items-center"><h2 className="text-xl font-bold">Grupos Escolares</h2><Button onClick={() => setOpenDialog('grupo')} className="bg-primary rounded-xl font-bold"><Plus className="w-4 h-4 mr-2" /> Nuevo Grupo</Button></div>
          <div className="bg-white border rounded-3xl overflow-hidden shadow-sm">
            <Table><TableHeader className="bg-slate-50"><TableRow><TableHead className="px-6 font-bold py-4">Grupo</TableHead><TableHead className="font-bold">Carrera</TableHead><TableHead className="font-bold">Cuatrimestre</TableHead><TableHead className="text-right pr-6 font-bold">Acciones</TableHead></TableRow></TableHeader>
              <TableBody>{grupos?.map(g => (<TableRow key={g.id}><TableCell className="px-6 font-medium">{g.nombre}</TableCell><TableCell>{carreras?.find(c => c.id === g.carreraId)?.nombre}</TableCell><TableCell>{g.cuatrimestre}°</TableCell><TableCell className="text-right pr-6"><Button variant="ghost" size="icon" onClick={() => handleDelete('grupos', g.id)}><Trash2 className="w-4 h-4 text-primary" /></Button></TableCell></TableRow>))}</TableBody>
            </Table>
          </div>
          <Dialog open={openDialog === 'grupo'} onOpenChange={(o) => setOpenDialog(o ? 'grupo' : null)}>
            <DialogContent className="rounded-3xl">
              <DialogHeader><DialogTitle>Agregar Grupo</DialogTitle></DialogHeader>
              <div className="space-y-4 py-4">
                <div className="space-y-2"><Label>Nombre</Label><Input value={newGrupo.nombre} onChange={e => setNewGrupo({...newGrupo, nombre: e.target.value})} /></div>
                <div className="space-y-2"><Label>Carrera</Label>
                  <Select value={newGrupo.carreraId} onValueChange={v => setNewGrupo({...newGrupo, carreraId: v})}>
                    <SelectTrigger className="rounded-xl"><SelectValue placeholder="Seleccionar Carrera" /></SelectTrigger>
                    <SelectContent>{carreras?.map(c => <SelectItem key={c.id} value={c.id}>{c.nombre}</SelectItem>)}</SelectContent>
                  </Select>
                </div>
                <div className="space-y-2"><Label>Cuatrimestre</Label><Input type="number" value={newGrupo.cuatrimestre} onChange={e => setNewGrupo({...newGrupo, cuatrimestre: e.target.value})} /></div>
              </div>
              <DialogFooter><Button onClick={() => handleAdd(gruposRef, newGrupo, setNewGrupo, {nombre: '', carreraId: '', cuatrimestre: ''}, "Grupo")} className="w-full bg-primary font-bold">Guardar Grupo</Button></DialogFooter>
            </DialogContent>
          </Dialog>
        </TabsContent>

        {/* --- DOCENTES --- */}
        <TabsContent value="docentes" className="mt-6 space-y-4">
          <div className="flex justify-between items-center"><h2 className="text-xl font-bold">Cuerpo Docente</h2><Button onClick={() => setOpenDialog('docente')} className="bg-primary rounded-xl font-bold"><Plus className="w-4 h-4 mr-2" /> Nuevo Docente</Button></div>
          <div className="bg-white border rounded-3xl overflow-hidden shadow-sm">
            <Table><TableHeader className="bg-slate-50"><TableRow><TableHead className="px-6 font-bold py-4">Nombre</TableHead><TableHead className="font-bold">Correo</TableHead><TableHead className="font-bold">Grupos Asignados</TableHead><TableHead className="text-right pr-6 font-bold">Acciones</TableHead></TableRow></TableHeader>
              <TableBody>{docentes.map(d => (<TableRow key={d.id}><TableCell className="px-6 font-medium">{d.firstName} {d.lastName}</TableCell><TableCell>{d.email}</TableCell><TableCell className="flex gap-1 flex-wrap">{d.grupoIds?.map(gid => <span key={gid} className="bg-slate-100 text-[10px] px-2 py-0.5 rounded-full font-bold">{grupos?.find(g => g.id === gid)?.nombre}</span>)}</TableCell><TableCell className="text-right pr-6"><Button variant="ghost" size="icon" onClick={() => handleDelete('users', d.id)}><Trash2 className="w-4 h-4 text-primary" /></Button></TableCell></TableRow>))}</TableBody>
            </Table>
          </div>
          <Dialog open={openDialog === 'docente'} onOpenChange={(o) => setOpenDialog(o ? 'docente' : null)}>
            <DialogContent className="rounded-3xl max-w-2xl">
              <DialogHeader><DialogTitle>Registro de Docente</DialogTitle></DialogHeader>
              <div className="grid grid-cols-2 gap-4 py-4">
                <div className="space-y-2"><Label>Nombre(s)</Label><Input value={newUser.firstName} onChange={e => setNewUser({...newUser, firstName: e.target.value})} /></div>
                <div className="space-y-2"><Label>Apellido(s)</Label><Input value={newUser.lastName} onChange={e => setNewUser({...newUser, lastName: e.target.value})} /></div>
                <div className="space-y-2"><Label>Correo</Label><Input value={newUser.email} onChange={e => setNewUser({...newUser, email: e.target.value})} /></div>
                <div className="space-y-2"><Label>Contraseña</Label><Input type="password" value={newUser.password} onChange={e => setNewUser({...newUser, password: e.target.value})} /></div>
                <div className="col-span-2 space-y-2"><Label>Grupos Responsables</Label>
                  <ScrollArea className="h-32 border rounded-xl p-3">
                    <div className="grid grid-cols-2 gap-2">
                      {grupos?.map(g => (
                        <div key={g.id} className="flex items-center space-x-2">
                          <Checkbox checked={newUser.grupoIds.includes(g.id)} onCheckedChange={(c) => setNewUser({...newUser, grupoIds: c ? [...newUser.grupoIds, g.id] : newUser.grupoIds.filter(id => id !== g.id)})} />
                          <label className="text-xs font-bold leading-none">{g.nombre} - {carreras?.find(c => c.id === g.carreraId)?.nombre}</label>
                        </div>
                      ))}
                    </div>
                  </ScrollArea>
                </div>
              </div>
              <DialogFooter><Button onClick={() => handleAdd(usersRef, {...newUser, role: 'Docente'}, setNewUser, {firstName: '', lastName: '', email: '', password: '', role: 'Alumno', carreraId: '', sedeId: '', matricula: '', grupoId: '', grupoIds: []}, "Docente")} className="w-full bg-primary font-bold">Registrar Docente</Button></DialogFooter>
            </DialogContent>
          </Dialog>
        </TabsContent>

        {/* --- ALUMNOS --- */}
        <TabsContent value="alumnos" className="mt-6 space-y-4">
          <div className="flex justify-between items-center"><h2 className="text-xl font-bold">Matrícula Estudiantil</h2><Button onClick={() => setOpenDialog('alumno')} className="bg-primary rounded-xl font-bold"><Plus className="w-4 h-4 mr-2" /> Nuevo Alumno</Button></div>
          <div className="bg-white border rounded-3xl overflow-hidden shadow-sm">
            <Table><TableHeader className="bg-slate-50"><TableRow><TableHead className="px-6 font-bold py-4">Matrícula</TableHead><TableHead className="font-bold">Nombre</TableHead><TableHead className="font-bold">Carrera</TableHead><TableHead className="font-bold">Grupo</TableHead><TableHead className="text-right pr-6 font-bold">Acciones</TableHead></TableRow></TableHeader>
              <TableBody>{alumnos.map(a => (<TableRow key={a.id}><TableCell className="px-6 font-black text-primary">{a.matricula}</TableCell><TableCell className="font-medium">{a.firstName} {a.lastName}</TableCell><TableCell>{carreras?.find(c => c.id === a.carreraId)?.nombre}</TableCell><TableCell>{grupos?.find(g => g.id === a.grupoId)?.nombre}</TableCell><TableCell className="text-right pr-6 flex justify-end gap-1">
                <Button variant="outline" size="icon" onClick={() => {setFaceTargetUser(a); setOpenDialog('face');}}><ScanFace className="w-4 h-4 text-primary" /></Button>
                <Button variant="ghost" size="icon" onClick={() => handleDelete('users', a.id)}><Trash2 className="w-4 h-4 text-primary" /></Button>
              </TableCell></TableRow>))}</TableBody>
            </Table>
          </div>
          <Dialog open={openDialog === 'alumno'} onOpenChange={(o) => setOpenDialog(o ? 'alumno' : null)}>
            <DialogContent className="rounded-3xl max-w-xl">
              <DialogHeader><DialogTitle>Inscripción de Alumno</DialogTitle></DialogHeader>
              <div className="grid grid-cols-2 gap-4 py-4">
                <div className="space-y-2"><Label>Matrícula</Label><Input value={newUser.matricula} onChange={e => setNewUser({...newUser, matricula: e.target.value})} /></div>
                <div className="space-y-2"><Label>Carrera</Label>
                   <Select value={newUser.carreraId} onValueChange={v => setNewUser({...newUser, carreraId: v})}>
                    <SelectTrigger className="rounded-xl"><SelectValue placeholder="Carrera" /></SelectTrigger>
                    <SelectContent>{carreras?.map(c => <SelectItem key={c.id} value={c.id}>{c.nombre}</SelectItem>)}</SelectContent>
                  </Select>
                </div>
                <div className="space-y-2"><Label>Nombre(s)</Label><Input value={newUser.firstName} onChange={e => setNewUser({...newUser, firstName: e.target.value})} /></div>
                <div className="space-y-2"><Label>Apellido(s)</Label><Input value={newUser.lastName} onChange={e => setNewUser({...newUser, lastName: e.target.value})} /></div>
                <div className="space-y-2"><Label>Correo Institucional</Label><Input value={newUser.email} onChange={e => setNewUser({...newUser, email: e.target.value})} /></div>
                <div className="space-y-2"><Label>Grupo</Label>
                   <Select value={newUser.grupoId} onValueChange={v => setNewUser({...newUser, grupoId: v})}>
                    <SelectTrigger className="rounded-xl"><SelectValue placeholder="Grupo" /></SelectTrigger>
                    <SelectContent>{grupos?.filter(g => g.carreraId === newUser.carreraId).map(g => <SelectItem key={g.id} value={g.id}>{g.nombre}</SelectItem>)}</SelectContent>
                  </Select>
                </div>
              </div>
              <DialogFooter><Button onClick={() => handleAdd(usersRef, {...newUser, role: 'Alumno', password: '123'}, setNewUser, {firstName: '', lastName: '', email: '', password: '', role: 'Alumno', carreraId: '', sedeId: '', matricula: '', grupoId: '', grupoIds: []}, "Alumno")} className="w-full bg-primary font-bold">Inscribir Alumno</Button></DialogFooter>
            </DialogContent>
          </Dialog>
        </TabsContent>
      </Tabs>

      {/* DIALOG RECONOCIMIENTO FACIAL */}
      <Dialog open={openDialog === 'face'} onOpenChange={(o) => setOpenDialog(o ? 'face' : null)}>
        <DialogContent className="max-w-3xl rounded-[2.5rem] p-8 border-none shadow-2xl overflow-hidden">
          <div className="absolute top-0 left-0 w-full h-2 bg-primary" />
          <DialogHeader className="mb-6">
             <div className="flex items-center gap-3 mb-2">
                <div className="bg-primary/10 p-2 rounded-2xl"><Camera className="w-6 h-6 text-primary" /></div>
                <DialogTitle className="text-3xl font-black uppercase tracking-tighter">Enrolamiento Facial</DialogTitle>
             </div>
             <DialogDescription className="text-sm font-bold text-muted-foreground uppercase tracking-widest">
               Registrando biometría para: <span className="text-primary">{faceTargetUser?.firstName} {faceTargetUser?.lastName}</span>
             </DialogDescription>
          </DialogHeader>
          <FacialRecognitionComponent mode="enroll" onCapture={handleSaveFaceDescriptor} />
          <div className="mt-8 flex justify-end">
            <Button variant="outline" className="rounded-xl px-8 h-12 font-bold uppercase tracking-widest text-xs" onClick={() => setOpenDialog(null)}>Cancelar Proceso</Button>
          </div>
        </DialogContent>
      </Dialog>
    </div>
  );
}
