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
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
} from "@/components/ui/alert-dialog";
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
  const materiaFileInputRef = useRef<HTMLInputElement>(null);

  // Queries para datos
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

  // Estados para diálogos y navegación
  const [openDialog, setOpenDialog] = useState<string | null>(null);
  const [copiedId, setCopiedId] = useState<string | null>(null);

  // Estados para nuevos registros
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

  // Horarios Masivos
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

    // Eliminar horarios anteriores de este grupo para reemplazarlos
    const currentHorarios = horarios?.filter(h => h.grupoId === selectedGrupoScheduleId) || [];
    currentHorarios.forEach(h => deleteDocumentNonBlocking(doc(db, 'horarios', h.id)));

    // Guardar los 20 bloques (si tienen materia asignada)
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
    setTimeout(() => window.location.reload(), 1500);
  };

  const handleAdd = (ref: any, data: any, setter: any, emptyData: any, title: string) => {
    addDocumentNonBlocking(ref, { ...data, createdAt: serverTimestamp() });
    setter(emptyData);
    setOpenDialog(null);
    toast({ title: `${title} guardado`, description: "Sincronizando..." });
    setTimeout(() => window.location.reload(), 1000);
  };

  const handleDelete = (collectionName: string, id: string) => {
    const docRef = doc(db, collectionName, id);
    deleteDocumentNonBlocking(docRef);
    toast({ variant: "destructive", title: "Eliminado" });
    setTimeout(() => window.location.reload(), 1000);
  };

  const copyToClipboard = (text: string) => {
    navigator.clipboard.writeText(text);
    setCopiedId(text);
    setTimeout(() => setCopiedId(null), 2000);
    toast({ title: "ID Copiado" });
  };

  // Reconocimiento Facial
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
    setTimeout(() => window.location.reload(), 1500);
  };

  const [selectedMateriaIds, setSelectedMateriaIds] = useState<string[]>([]);
  const toggleSelectMateria = (id: string) => setSelectedMateriaIds(prev => prev.includes(id) ? prev.filter(mid => mid !== id) : [...prev, id]);

  return (
    <div className="space-y-6 animate-in fade-in duration-500 pb-20">
      <div className="flex justify-between items-end pb-4 border-b">
        <div>
          <h1 className="text-3xl font-black tracking-tighter text-foreground uppercase">Catálogos Institucionales</h1>
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
              <p className="text-xs text-muted-foreground">Selecciona un grupo para gestionar sus 20 bloques de clase (7:00 AM - 11:00 AM).</p>
            </div>
            <div className="flex gap-2 w-full md:w-auto">
              <Select value={selectedGrupoScheduleId} onValueChange={setSelectedGrupoScheduleId}>
                <SelectTrigger className="w-full md:w-[300px] h-11 rounded-xl font-bold"><SelectValue placeholder="Seleccionar Grupo..." /></SelectTrigger>
                <SelectContent>
                  {grupos?.map(g => <SelectItem key={g.id} value={g.id}>{g.nombre} - {carreras?.find(c => c.id === g.carreraId)?.nombre} ({g.cuatrimestre}°)</SelectItem>)}
                </SelectContent>
              </Select>
              {selectedGrupoScheduleId && (
                <Button 
                  onClick={() => setIsEditingSchedule(!isEditingSchedule)} 
                  variant={isEditingSchedule ? "destructive" : "outline"}
                  className="rounded-xl h-11 font-bold"
                >
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
               <div className="bg-white border p-8 rounded-t-3xl border-b-0 space-y-2 text-center relative overflow-hidden">
                  <div className="absolute top-0 left-0 w-full h-1 bg-primary" />
                  <p className="text-xs font-bold uppercase tracking-widest text-muted-foreground">2026-2 Escolar Cuatrimestral 7:00 a 11:00</p>
                  <h1 className="text-5xl font-black tracking-tighter uppercase text-slate-900">{selectedGrupoForSchedule?.nombre}</h1>
                  <p className="text-xs font-medium text-slate-500 uppercase">{carreras?.find(c => c.id === selectedGrupoForSchedule?.carreraId)?.nombre}</p>
               </div>

               <div className="bg-white border border-slate-900 overflow-hidden shadow-2xl">
                 <div className="grid grid-cols-[80px_repeat(4,1fr)] border-b border-slate-900 bg-slate-100/50">
                    <div className="border-r border-slate-900 flex items-center justify-center"></div>
                    {SLOTS.map(s => (
                      <div key={s.id} className="border-r border-slate-900 last:border-r-0 p-2 text-center flex flex-col items-center justify-center">
                        <span className="text-[10px] font-black">{s.id}.</span>
                        <span className="text-[9px] font-bold text-muted-foreground">{s.range}</span>
                      </div>
                    ))}
                 </div>

                 {DAYS.map(day => (
                    <div key={day} className="grid grid-cols-[80px_repeat(4,1fr)] border-b border-slate-900 last:border-b-0 min-h-[140px]">
                      <div className="border-r border-slate-900 flex items-center justify-center bg-slate-50">
                        <span className="text-3xl font-black uppercase text-slate-900">{day.substring(0, 2)}</span>
                      </div>
                      
                      {SLOTS.map(slot => {
                        const cellKey = `${day}-${slot.id}`;
                        const cellData = tempGrid[cellKey];
                        const materia = materias?.find(m => m.id === cellData?.materiaId);
                        const docente = docentes.find(d => d.id === cellData?.docenteId);

                        return (
                          <div key={cellKey} className="border-r border-slate-900 last:border-r-0 p-3 flex flex-col relative group">
                            {isEditingSchedule ? (
                              <div className="space-y-2 py-1">
                                <Select 
                                  value={cellData?.materiaId || "none"} 
                                  onValueChange={(v) => setTempGrid({...tempGrid, [cellKey]: { ...cellData, materiaId: v === "none" ? "" : v }})}
                                >
                                  <SelectTrigger className="h-7 text-[9px] font-bold border-slate-200"><SelectValue placeholder="Materia" /></SelectTrigger>
                                  <SelectContent>
                                    <SelectItem value="none">-- Vacío --</SelectItem>
                                    {filteredMateriasForSelectedGrupo.map(m => <SelectItem key={m.id} value={m.id}>{m.nombre}</SelectItem>)}
                                  </SelectContent>
                                </Select>
                                <Select 
                                  value={cellData?.docenteId || "none"} 
                                  onValueChange={(v) => setTempGrid({...tempGrid, [cellKey]: { ...cellData, docenteId: v === "none" ? "" : v }})}
                                >
                                  <SelectTrigger className="h-7 text-[9px] font-bold border-slate-200"><SelectValue placeholder="Docente" /></SelectTrigger>
                                  <SelectContent>
                                    <SelectItem value="none">-- Vacío --</SelectItem>
                                    {filteredDocentesForSelectedGrupo.map(d => <SelectItem key={d.id} value={d.id}>{d.firstName} {d.lastName}</SelectItem>)}
                                  </SelectContent>
                                </Select>
                                <Input 
                                  placeholder="Aula" 
                                  className="h-7 text-[9px] font-bold" 
                                  value={cellData?.aula || ''} 
                                  onChange={(e) => setTempGrid({...tempGrid, [cellKey]: { ...cellData, aula: e.target.value }})}
                                />
                              </div>
                            ) : (
                              <>
                                {materia ? (
                                  <>
                                    <span className="text-[10px] font-black uppercase leading-tight h-10 overflow-hidden line-clamp-3">{materia.nombre}</span>
                                    <div className="mt-auto pt-4 flex flex-col">
                                      <span className="text-[9px] font-medium text-slate-600 line-clamp-1 italic">{docente ? `${docente.firstName} ${docente.lastName}` : "Sin docente"}</span>
                                      {cellData?.aula && <span className="text-[8px] font-bold text-primary mt-1 uppercase">Aula: {cellData.aula}</span>}
                                    </div>
                                  </>
                                ) : (
                                  <div className="m-auto opacity-10">
                                    <XCircle className="w-8 h-8" />
                                  </div>
                                )}
                              </>
                            )}
                          </div>
                        );
                      })}
                    </div>
                 ))}
               </div>

               {isEditingSchedule && (
                 <div className="flex justify-center pt-6">
                    <Button onClick={handleSaveBulkSchedule} className="bg-primary hover:bg-accent text-white px-12 py-7 rounded-2xl font-black text-xl shadow-2xl shadow-primary/30 uppercase tracking-tighter">
                      <Save className="w-6 h-6 mr-2" /> Guardar Horario Completo
                    </Button>
                 </div>
               )}

               <div className="flex justify-between items-center bg-slate-900 text-white p-4 rounded-b-3xl mt-[-1px]">
                  <span className="text-[9px] font-bold opacity-60">Horario generado: {new Date().toLocaleDateString()}</span>
                  <span className="text-[9px] font-black uppercase tracking-widest">aSc Horarios en línea | SIBF - CAI System</span>
               </div>
            </div>
          )}
        </TabsContent>

        {/* --- SEDES --- */}
        <TabsContent value="sedes" className="mt-6 space-y-4">
          <div className="flex justify-between items-center">
            <h2 className="text-xl font-bold">Sedes</h2>
            <Dialog open={openDialog === 'sede'} onOpenChange={(o) => setOpenDialog(o ? 'sede' : null)}>
              <DialogTrigger asChild><Button className="bg-primary rounded-xl font-bold"><Plus className="w-4 h-4 mr-2" /> Nueva Sede</Button></DialogTrigger>
              <DialogContent className="rounded-3xl">
                <DialogHeader><DialogTitle>Agregar Sede</DialogTitle></DialogHeader>
                <div className="space-y-4 py-4">
                  <div className="space-y-2"><Label>Nombre</Label><Input value={newSede.nombre} onChange={e => setNewSede({...newSede, nombre: e.target.value})} /></div>
                  <div className="space-y-2"><Label>Ubicación</Label><Input value={newSede.ubicacion} onChange={e => setNewSede({...newSede, ubicacion: e.target.value})} /></div>
                </div>
                <DialogFooter><Button onClick={() => handleAdd(sedesRef, newSede, setNewSede, {nombre: '', ubicacion: ''}, "Sede")} className="w-full bg-primary font-bold">Guardar</Button></DialogFooter>
              </DialogContent>
            </Dialog>
          </div>
          <div className="bg-white border rounded-3xl overflow-hidden shadow-sm">
            <Table>
              <TableHeader className="bg-slate-50"><TableRow><TableHead className="px-6 font-bold py-4">Nombre</TableHead><TableHead className="font-bold">Ubicación</TableHead><TableHead className="font-bold text-right pr-6">Acciones</TableHead></TableRow></TableHeader>
              <TableBody>
                {sedes?.map(s => (
                  <TableRow key={s.id}>
                    <TableCell className="px-6 font-medium">{s.nombre}</TableCell><TableCell className="text-muted-foreground">{s.ubicacion}</TableCell>
                    <TableCell className="text-right pr-6">
                      <Button variant="ghost" size="icon" onClick={() => handleDelete('sedes', s.id)}><Trash2 className="w-4 h-4 text-primary" /></Button>
                    </TableCell>
                  </TableRow>
                ))}
              </TableBody>
            </Table>
          </div>
        </TabsContent>

        {/* ... Rest of the tabs content ... */}
      </Tabs>
    </div>
  );
}
