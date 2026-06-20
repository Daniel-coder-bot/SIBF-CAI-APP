
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
  Grid,
  UserCheck,
  Filter
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
  const docentFileInputRef = useRef<HTMLInputElement>(null);

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
  const [editingGrupo, setEditingGrupo] = useState<any>(null);
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

  // Search States
  const [searchSede, setSearchSede] = useState('');
  const [searchCarrera, setSearchCarrera] = useState('');
  const [searchMateria, setSearchMateria] = useState('');
  const [searchGrupo, setSearchGrupo] = useState('');
  const [searchDocente, setSearchDocente] = useState('');
  const [searchAlumno, setSearchAlumno] = useState('');

  // Advanced Filters
  const [filterMateriaCarrera, setFilterMateriaCarrera] = useState<string>('all');
  const [filterMateriaCuatrimestre, setFilterMateriaCuatrimestre] = useState<string>('all');
  const [filterGrupoCarrera, setFilterGrupoCarrera] = useState<string>('all');

  // Filtered Data
  const filteredSedes = useMemo(() => {
    return sedes?.filter(s => 
      s.nombre.toLowerCase().includes(searchSede.toLowerCase()) || 
      s.ubicacion.toLowerCase().includes(searchSede.toLowerCase())
    ) || [];
  }, [sedes, searchSede]);

  const filteredCarreras = useMemo(() => {
    return carreras?.filter(c => 
      c.nombre.toLowerCase().includes(searchCarrera.toLowerCase())
    ) || [];
  }, [carreras, searchCarrera]);

  const filteredMaterias = useMemo(() => {
    return materias?.filter(m => {
      const matchesSearch = m.nombre.toLowerCase().includes(searchMateria.toLowerCase()) ||
                            m.codigo?.toLowerCase().includes(searchMateria.toLowerCase());
      const matchesCarrera = filterMateriaCarrera === 'all' || m.carreraId === filterMateriaCarrera;
      const matchesCuatrimestre = filterMateriaCuatrimestre === 'all' || m.cuatrimestre === filterMateriaCuatrimestre;
      
      return matchesSearch && matchesCarrera && matchesCuatrimestre;
    }) || [];
  }, [materias, searchMateria, filterMateriaCarrera, filterMateriaCuatrimestre]);

  const filteredGrupos = useMemo(() => {
    return grupos?.filter(g => {
      const matchesSearch = g.nombre.toLowerCase().includes(searchGrupo.toLowerCase());
      const matchesCarrera = filterGrupoCarrera === 'all' || g.carreraId === filterGrupoCarrera;
      return matchesSearch && matchesCarrera;
    }) || [];
  }, [grupos, searchGrupo, filterGrupoCarrera]);

  const filteredDocentes = useMemo(() => {
    return docentes.filter(d => 
      `${d.firstName} ${d.lastName}`.toLowerCase().includes(searchDocente.toLowerCase()) ||
      d.email.toLowerCase().includes(searchDocente.toLowerCase())
    );
  }, [docentes, searchDocente]);

  const filteredAlumnos = useMemo(() => {
    return alumnos.filter(a => 
      `${a.firstName} ${a.lastName}`.toLowerCase().includes(searchAlumno.toLowerCase()) ||
      a.email.toLowerCase().includes(searchAlumno.toLowerCase()) ||
      a.matricula?.toLowerCase().includes(searchAlumno.toLowerCase())
    );
  }, [alumnos, searchAlumno]);

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

  const handleUpdateGroup = () => {
    if (!editingGrupo) return;
    const groupDocRef = doc(db, 'grupos', editingGrupo.id);
    updateDocumentNonBlocking(groupDocRef, {
      nombre: editingGrupo.nombre,
      carreraId: editingGrupo.carreraId,
      cuatrimestre: editingGrupo.cuatrimestre,
      updatedAt: serverTimestamp()
    });
    setOpenDialog(null);
    setEditingGrupo(null);
    toast({ title: "Grupo actualizado" });
  };

  const handleDelete = (collectionName: string, id: string) => {
    deleteDocumentNonBlocking(doc(db, collectionName, id));
    toast({ variant: "destructive", title: "Eliminado" });
  };

  // Excel Integration
  const handleExportExcel = (data: any[], fileName: string) => {
    if (!data || data.length === 0) {
      toast({ variant: "destructive", title: "Sin datos", description: "No hay información para exportar." });
      return;
    }
    const worksheet = XLSX.utils.json_to_sheet(data.map(({ id, createdAt, updatedAt, faceDescriptor, ...rest }) => rest));
    const workbook = XLSX.utils.book_new();
    XLSX.utils.book_append_sheet(workbook, worksheet, "Datos");
    XLSX.writeFile(workbook, `${fileName}.xlsx`);
    toast({ title: "Exportación completa" });
  };

  const handleImportExcel = (e: React.ChangeEvent<HTMLInputElement>, role: string) => {
    const file = e.target.files?.[0];
    if (!file) return;

    const reader = new FileReader();
    reader.onload = (evt) => {
      try {
        const bstr = evt.target?.result;
        const workbook = XLSX.read(bstr, { type: 'binary' });
        const ws = workbook.Sheets[workbook.SheetNames[0]];
        const data = XLSX.utils.sheet_to_json(ws) as any[];

        data.forEach((row) => {
          const userData = {
            ...row,
            role,
            createdAt: serverTimestamp(),
            updatedAt: serverTimestamp()
          };
          addDocumentNonBlocking(usersRef, userData);
        });

        toast({ title: "Importación masiva", description: `${data.length} registros procesados.` });
        if (fileInputRef.current) fileInputRef.current.value = '';
        if (docentFileInputRef.current) docentFileInputRef.current.value = '';
      } catch (error) {
        toast({ variant: "destructive", title: "Error en importación" });
      }
    };
    reader.readAsBinaryString(file);
  };

  // Facial Recognition
  const [faceTargetUser, setFaceTargetUser] = useState<any>(null);
  const [faceMode, setFaceMode] = useState<'enroll' | 'recognize'>('enroll');
  
  const labeledDescriptors = useMemo(() => {
    return alumnos
      .filter(a => a.faceDescriptor && Array.isArray(a.faceDescriptor))
      .map(a => ({
        label: `${a.firstName} ${a.lastName}`,
        descriptor: a.faceDescriptor
      }));
  }, [alumnos]);

  const handleSaveFaceDescriptor = (descriptor: number[]) => {
    if (faceMode === 'recognize') return;
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
          <h1 className="text-3xl font-bold tracking-tight text-foreground uppercase">Catálogos SIBF - CAI</h1>
          <p className="text-muted-foreground font-medium text-sm">Administración centralizada de la estructura académica.</p>
        </div>
      </div>

      <Tabs defaultValue="horarios" className="w-full">
        <TabsList className="bg-slate-100/80 p-1 rounded-2xl h-14 w-full justify-start gap-1 border overflow-x-auto scrollbar-hide">
          <TabsTrigger value="horarios" className="rounded-xl data-[state=active]:bg-white px-4 font-semibold flex gap-2"><Clock className="w-4 h-4" /> Horarios</TabsTrigger>
          <TabsTrigger value="sedes" className="rounded-xl data-[state=active]:bg-white px-4 font-semibold flex gap-2"><Building2 className="w-4 h-4" /> Sedes</TabsTrigger>
          <TabsTrigger value="carreras" className="rounded-xl data-[state=active]:bg-white px-4 font-semibold flex gap-2"><BookOpen className="w-4 h-4" /> Carreras</TabsTrigger>
          <TabsTrigger value="materias" className="rounded-xl data-[state=active]:bg-white px-4 font-semibold flex gap-2"><FolderTree className="w-4 h-4" /> Materias</TabsTrigger>
          <TabsTrigger value="grupos" className="rounded-xl data-[state=active]:bg-white px-4 font-semibold flex gap-2"><Users className="w-4 h-4" /> Grupos</TabsTrigger>
          <TabsTrigger value="docentes" className="rounded-xl data-[state=active]:bg-white px-4 font-semibold flex gap-2"><Briefcase className="w-4 h-4" /> Docentes</TabsTrigger>
          <TabsTrigger value="alumnos" className="rounded-xl data-[state=active]:bg-white px-4 font-semibold flex gap-2"><GraduationCap className="w-4 h-4" /> Alumnos</TabsTrigger>
        </TabsList>

        <TabsContent value="horarios" className="mt-6 space-y-6">
          <div className="flex flex-col md:flex-row justify-between items-start md:items-center gap-4 bg-white p-6 rounded-3xl border shadow-sm">
            <div className="space-y-1">
              <h2 className="text-xl font-bold flex items-center gap-2"><Grid className="w-5 h-5 text-primary" /> Generador de Horarios</h2>
              <p className="text-xs text-muted-foreground">Bloques de 7:00 AM a 11:00 AM.</p>
            </div>
            <div className="flex gap-2 w-full md:w-auto">
              <Select value={selectedGrupoScheduleId} onValueChange={setSelectedGrupoScheduleId}>
                <SelectTrigger className="w-full md:w-[300px] h-11 rounded-xl font-medium"><SelectValue placeholder="Seleccionar Grupo..." /></SelectTrigger>
                <SelectContent>
                  {grupos?.map(g => <SelectItem key={g.id} value={g.id}>{g.nombre} - {carreras?.find(c => c.id === g.carreraId)?.nombre}</SelectItem>)}
                </SelectContent>
              </Select>
              {selectedGrupoScheduleId && (
                <Button onClick={() => setIsEditingSchedule(!isEditingSchedule)} variant={isEditingSchedule ? "destructive" : "outline"} className="rounded-xl h-11 font-medium">
                  {isEditingSchedule ? "Cancelar" : "Editar"}
                </Button>
              )}
            </div>
          </div>

          {!selectedGrupoScheduleId ? (
            <div className="flex flex-col items-center justify-center py-20 bg-slate-50 border border-dashed rounded-3xl">
              <Clock className="w-12 h-12 text-slate-300 mb-4" />
              <p className="text-slate-500 font-medium">Elige un grupo para ver su horario.</p>
            </div>
          ) : (
            <div className="space-y-4 animate-in fade-in duration-500">
               <div className="bg-white border p-6 rounded-t-3xl border-b-0 text-center relative overflow-hidden">
                  <div className="absolute top-0 left-0 w-full h-1 bg-primary" />
                  <p className="text-[10px] font-bold uppercase tracking-widest text-muted-foreground mb-1">Horario Escolar</p>
                  <h1 className="text-3xl font-bold tracking-tight uppercase text-slate-900">{selectedGrupoForSchedule?.nombre}</h1>
                  <p className="text-xs font-medium text-slate-500 uppercase">{carreras?.find(c => c.id === selectedGrupoForSchedule?.carreraId)?.nombre}</p>
               </div>
               <div className="bg-white border border-slate-300 overflow-hidden shadow-sm">
                 <div className="grid grid-cols-[80px_repeat(4,1fr)] border-b border-slate-200 bg-slate-50/80 font-semibold text-[10px] uppercase">
                    <div className="border-r border-slate-200 flex items-center justify-center">Día / Hora</div>
                    {SLOTS.map(s => <div key={s.id} className="border-r border-slate-200 p-2 text-center flex flex-col items-center justify-center"><span>Bloque {s.id}</span><span className="text-[8px] opacity-60 font-medium">{s.range}</span></div>)}
                 </div>
                 {DAYS.map(day => (
                    <div key={day} className="grid grid-cols-[80px_repeat(4,1fr)] border-b border-slate-200 last:border-b-0 min-h-[120px]">
                      <div className="border-r border-slate-200 flex items-center justify-center bg-slate-50 font-bold text-lg uppercase">{day.substring(0, 3)}</div>
                      {SLOTS.map(slot => {
                        const key = `${day}-${slot.id}`;
                        const cell = tempGrid[key];
                        return (
                          <div key={key} className="border-r border-slate-200 p-3 flex flex-col justify-center gap-2">
                            {isEditingSchedule ? (
                              <>
                                <Select value={cell?.materiaId || "none"} onValueChange={(v) => setTempGrid({...tempGrid, [key]: { ...cell, materiaId: v === "none" ? "" : v }})}>
                                  <SelectTrigger className="h-7 text-[9px] font-medium"><SelectValue placeholder="Materia" /></SelectTrigger>
                                  <SelectContent>
                                    <SelectItem value="none">-- Vacío --</SelectItem>
                                    {filteredMateriasForSelectedGrupo.map(m => <SelectItem key={m.id} value={m.id}>{m.nombre}</SelectItem>)}
                                  </SelectContent>
                                </Select>
                                <Select value={cell?.docenteId || "none"} onValueChange={(v) => setTempGrid({...tempGrid, [key]: { ...cell, docenteId: v === "none" ? "" : v }})}>
                                  <SelectTrigger className="h-7 text-[9px] font-medium"><SelectValue placeholder="Docente" /></SelectTrigger>
                                  <SelectContent>
                                    <SelectItem value="none">-- Vacío --</SelectItem>
                                    {filteredDocentesForSelectedGrupo.map(d => <SelectItem key={d.id} value={d.id}>{d.firstName} {d.lastName}</SelectItem>)}
                                  </SelectContent>
                                </Select>
                                <Input placeholder="Aula (Opcional)" className="h-7 text-[9px] font-medium" value={cell?.aula || ''} onChange={(e) => setTempGrid({...tempGrid, [key]: { ...cell, aula: e.target.value }})} />
                              </>
                            ) : (
                              cell?.materiaId ? (
                                <>
                                  <span className="text-[10px] font-bold uppercase">{materias?.find(m => m.id === cell.materiaId)?.nombre}</span>
                                  <span className="text-[8px] font-medium text-muted-foreground">{docentes.find(d => d.id === cell.docenteId)?.firstName} {docentes.find(d => d.id === cell.docenteId)?.lastName}</span>
                                  {cell.aula && <span className="text-[8px] font-bold text-primary">AULA: {cell.aula}</span>}
                                </>
                              ) : <span className="m-auto opacity-20 font-medium text-[10px]">LIBRE</span>
                            )}
                          </div>
                        );
                      })}
                    </div>
                 ))}
               </div>
               {isEditingSchedule && (
                 <div className="flex justify-center pt-6">
                   <Button onClick={handleSaveBulkSchedule} className="bg-primary px-12 py-6 rounded-2xl font-bold text-lg shadow-lg uppercase tracking-tight">
                     <Save className="w-5 h-5 mr-2" /> Guardar Horario
                   </Button>
                 </div>
               )}
            </div>
          )}
        </TabsContent>

        <TabsContent value="alumnos" className="mt-6 space-y-4">
          <div className="flex flex-col md:flex-row justify-between items-center gap-4">
            <div className="flex items-center gap-4 flex-1">
              <h2 className="text-xl font-bold whitespace-nowrap">Matrícula</h2>
              <div className="relative flex-1 max-w-sm">
                <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
                <Input 
                  placeholder="Buscar alumno..." 
                  className="pl-10 h-10 rounded-xl bg-white font-medium" 
                  value={searchAlumno}
                  onChange={(e) => setSearchAlumno(e.target.value)}
                />
              </div>
            </div>
            <div className="flex gap-2">
              <input type="file" ref={fileInputRef} className="hidden" onChange={(e) => handleImportExcel(e, 'Alumno')} accept=".xlsx, .xls" />
              <Button variant="outline" onClick={() => fileInputRef.current?.click()} className="rounded-xl font-medium"><Upload className="w-4 h-4 mr-2" /> Importar</Button>
              <Button variant="secondary" onClick={() => { setFaceMode('recognize'); setOpenDialog('face'); }} className="rounded-xl font-medium"><UserCheck className="w-4 h-4 mr-2" /> Verificar</Button>
              <Button onClick={() => setOpenDialog('alumno')} className="bg-primary rounded-xl font-medium"><Plus className="w-4 h-4 mr-2" /> Nuevo Alumno</Button>
            </div>
          </div>
          <div className="bg-white border rounded-3xl overflow-hidden shadow-sm">
            <Table><TableHeader className="bg-slate-50"><TableRow><TableHead className="px-6 font-bold py-4">Matrícula</TableHead><TableHead className="font-bold">Nombre</TableHead><TableHead className="font-bold">Carrera</TableHead><TableHead className="font-bold">Grupo</TableHead><TableHead className="text-right pr-6 font-bold">Acciones</TableHead></TableRow></TableHeader>
              <TableBody>{filteredAlumnos.map(a => (<TableRow key={a.id} className="hover:bg-slate-50/50"><TableCell className="px-6 font-bold text-primary">{a.matricula}</TableCell><TableCell className="font-medium">{a.firstName} {a.lastName}</TableCell><TableCell className="font-medium text-muted-foreground">{carreras?.find(c => c.id === a.carreraId)?.nombre}</TableCell><TableCell className="font-medium">{grupos?.find(g => g.id === a.grupoId)?.nombre}</TableCell><TableCell className="text-right pr-6 flex justify-end gap-1">
                <Button variant="outline" size="icon" className="rounded-full" title="Registro Facial" onClick={() => {setFaceTargetUser(a); setFaceMode('enroll'); setOpenDialog('face');}}>
                  <ScanFace className={cn("w-4 h-4", a.faceDescriptor && Array.isArray(a.faceDescriptor) ? "text-green-600" : "text-primary")} />
                </Button>
                <Button variant="ghost" size="icon" className="rounded-full" onClick={() => handleDelete('users', a.id)}><Trash2 className="w-4 h-4 text-primary" /></Button>
              </TableCell></TableRow>))}</TableBody>
            </Table>
          </div>
          <Dialog open={openDialog === 'alumno'} onOpenChange={(o) => setOpenDialog(o ? 'alumno' : null)}>
            <DialogContent className="rounded-3xl max-w-xl">
              <DialogHeader><DialogTitle className="font-bold text-xl">Inscripción</DialogTitle></DialogHeader>
              <div className="grid grid-cols-2 gap-4 py-4">
                <div className="space-y-2"><Label className="font-bold text-xs uppercase text-muted-foreground">Matrícula</Label><Input value={newUser.matricula} onChange={e => setNewUser({...newUser, matricula: e.target.value})} className="rounded-xl font-medium" /></div>
                <div className="space-y-2"><Label className="font-bold text-xs uppercase text-muted-foreground">Carrera</Label>
                   <Select value={newUser.carreraId} onValueChange={v => setNewUser({...newUser, carreraId: v})}>
                    <SelectTrigger className="rounded-xl font-medium"><SelectValue placeholder="Elegir..." /></SelectTrigger>
                    <SelectContent>{carreras?.map(c => <SelectItem key={c.id} value={c.id}>{c.nombre}</SelectItem>)}</SelectContent>
                  </Select>
                </div>
                <div className="space-y-2"><Label className="font-bold text-xs uppercase text-muted-foreground">Nombre(s)</Label><Input value={newUser.firstName} onChange={e => setNewUser({...newUser, firstName: e.target.value})} className="rounded-xl font-medium" /></div>
                <div className="space-y-2"><Label className="font-bold text-xs uppercase text-muted-foreground">Apellido(s)</Label><Input value={newUser.lastName} onChange={e => setNewUser({...newUser, lastName: e.target.value})} className="rounded-xl font-medium" /></div>
                <div className="space-y-2"><Label className="font-bold text-xs uppercase text-muted-foreground">Correo</Label><Input value={newUser.email} onChange={e => setNewUser({...newUser, email: e.target.value})} className="rounded-xl font-medium" /></div>
                <div className="space-y-2"><Label className="font-bold text-xs uppercase text-muted-foreground">Grupo</Label>
                   <Select value={newUser.grupoId} onValueChange={v => setNewUser({...newUser, grupoId: v})}>
                    <SelectTrigger className="rounded-xl font-medium"><SelectValue placeholder="Elegir..." /></SelectTrigger>
                    <SelectContent>{grupos?.filter(g => g.carreraId === newUser.carreraId).map(g => <SelectItem key={g.id} value={g.id}>{g.nombre}</SelectItem>)}</SelectContent>
                  </Select>
                </div>
              </div>
              <DialogFooter><Button onClick={() => handleAdd(usersRef, {...newUser, role: 'Alumno', password: '123'}, setNewUser, {firstName: '', lastName: '', email: '', password: '', role: 'Alumno', carreraId: '', sedeId: '', matricula: '', grupoId: '', grupoIds: []}, "Alumno")} className="w-full bg-primary font-bold rounded-xl h-12">Confirmar Inscripción</Button></DialogFooter>
            </DialogContent>
          </Dialog>
        </TabsContent>

        <TabsContent value="docentes" className="mt-6 space-y-4">
          <div className="flex flex-col md:flex-row justify-between items-center gap-4">
            <div className="flex items-center gap-4 flex-1">
              <h2 className="text-xl font-bold whitespace-nowrap">Docentes</h2>
              <div className="relative flex-1 max-w-sm">
                <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
                <Input 
                  placeholder="Buscar docente..." 
                  className="pl-10 h-10 rounded-xl bg-white font-medium" 
                  value={searchDocente}
                  onChange={(e) => setSearchDocente(e.target.value)}
                />
              </div>
            </div>
            <div className="flex gap-2">
              <input type="file" ref={docentFileInputRef} className="hidden" onChange={(e) => handleImportExcel(e, 'Docente')} accept=".xlsx, .xls" />
              <Button variant="outline" onClick={() => docentFileInputRef.current?.click()} className="rounded-xl font-medium"><Upload className="w-4 h-4 mr-2" /> Importar</Button>
              <Button onClick={() => setOpenDialog('docente')} className="bg-primary rounded-xl font-medium"><Plus className="w-4 h-4 mr-2" /> Nuevo Docente</Button>
            </div>
          </div>
          <div className="bg-white border rounded-3xl overflow-hidden shadow-sm">
            <Table><TableHeader className="bg-slate-50"><TableRow><TableHead className="px-6 font-bold py-4">Nombre</TableHead><TableHead className="font-bold">Correo</TableHead><TableHead className="font-bold">Grupos</TableHead><TableHead className="text-right pr-6 font-bold">Acciones</TableHead></TableRow></TableHeader>
              <TableBody>{filteredDocentes.map(d => (<TableRow key={d.id} className="hover:bg-slate-50/50"><TableCell className="px-6 font-medium">{d.firstName} {d.lastName}</TableCell><TableCell className="font-medium text-muted-foreground">{d.email}</TableCell><TableCell className="flex gap-1 flex-wrap">{d.grupoIds?.map(gid => <span key={gid} className="bg-slate-100 text-[10px] px-2 py-0.5 rounded-full font-semibold">{grupos?.find(g => g.id === gid)?.nombre}</span>)}</TableCell><TableCell className="text-right pr-6"><Button variant="ghost" size="icon" className="rounded-full" onClick={() => handleDelete('users', d.id)}><Trash2 className="w-4 h-4 text-primary" /></Button></TableCell></TableRow>))}</TableBody>
            </Table>
          </div>
          <Dialog open={openDialog === 'docente'} onOpenChange={(o) => setOpenDialog(o ? 'docente' : null)}>
            <DialogContent className="rounded-3xl max-w-2xl">
              <DialogHeader><DialogTitle className="font-bold text-xl">Nuevo Docente</DialogTitle></DialogHeader>
              <div className="grid grid-cols-2 gap-4 py-4">
                <div className="space-y-2"><Label className="font-bold text-xs uppercase text-muted-foreground">Nombre(s)</Label><Input value={newUser.firstName} onChange={e => setNewUser({...newUser, firstName: e.target.value})} className="rounded-xl font-medium" /></div>
                <div className="space-y-2"><Label className="font-bold text-xs uppercase text-muted-foreground">Apellido(s)</Label><Input value={newUser.lastName} onChange={e => setNewUser({...newUser, lastName: e.target.value})} className="rounded-xl font-medium" /></div>
                <div className="space-y-2"><Label className="font-bold text-xs uppercase text-muted-foreground">Correo</Label><Input value={newUser.email} onChange={e => setNewUser({...newUser, email: e.target.value})} className="rounded-xl font-medium" /></div>
                <div className="space-y-2"><Label className="font-bold text-xs uppercase text-muted-foreground">Contraseña</Label><Input type="password" value={newUser.password} onChange={e => setNewUser({...newUser, password: e.target.value})} className="rounded-xl font-medium" /></div>
                <div className="col-span-2 space-y-2"><Label className="font-bold text-xs uppercase text-muted-foreground">Asignación de Grupos</Label>
                  <ScrollArea className="h-32 border rounded-xl p-3">
                    <div className="grid grid-cols-2 gap-2">
                      {grupos?.map(g => (
                        <div key={g.id} className="flex items-center space-x-2">
                          <Checkbox checked={newUser.grupoIds.includes(g.id)} onCheckedChange={(c) => setNewUser({...newUser, grupoIds: c ? [...newUser.grupoIds, g.id] : newUser.grupoIds.filter(id => id !== g.id)})} />
                          <label className="text-xs font-medium leading-none">{g.nombre} - {carreras?.find(c => c.id === g.carreraId)?.nombre}</label>
                        </div>
                      ))}
                    </div>
                  </ScrollArea>
                </div>
              </div>
              <DialogFooter><Button onClick={() => handleAdd(usersRef, {...newUser, role: 'Docente'}, setNewUser, {firstName: '', lastName: '', email: '', password: '', role: 'Alumno', carreraId: '', sedeId: '', matricula: '', grupoId: '', grupoIds: []}, "Docente")} className="w-full bg-primary font-bold rounded-xl h-12">Guardar Docente</Button></DialogFooter>
            </DialogContent>
          </Dialog>
        </TabsContent>

        <TabsContent value="materias" className="mt-6 space-y-4">
          <div className="flex flex-col md:flex-row justify-between items-center gap-4">
             <div className="flex flex-wrap items-center gap-4 flex-1">
                <div className="relative w-full max-w-xs">
                  <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
                  <Input placeholder="Buscar materia..." className="pl-10 rounded-xl" value={searchMateria} onChange={e => setSearchMateria(e.target.value)} />
                </div>
                <Select value={filterMateriaCarrera} onValueChange={setFilterMateriaCarrera}>
                  <SelectTrigger className="w-[200px] rounded-xl"><SelectValue placeholder="Por Carrera" /></SelectTrigger>
                  <SelectContent>
                    <SelectItem value="all">Todas las Carreras</SelectItem>
                    {carreras?.map(c => <SelectItem key={c.id} value={c.id}>{c.nombre}</SelectItem>)}
                  </SelectContent>
                </Select>
                <Select value={filterMateriaCuatrimestre} onValueChange={setFilterMateriaCuatrimestre}>
                  <SelectTrigger className="w-[150px] rounded-xl"><SelectValue placeholder="Por Cuatrimestre" /></SelectTrigger>
                  <SelectContent>
                    <SelectItem value="all">Todos</SelectItem>
                    {["1", "2", "3", "4", "5", "6", "7", "8", "9", "10"].map(n => <SelectItem key={n} value={n}>{n}º Cuatrimestre</SelectItem>)}
                  </SelectContent>
                </Select>
             </div>
             <Button onClick={() => setOpenDialog('materia')} className="bg-primary rounded-xl font-medium"><Plus className="w-4 h-4 mr-2" /> Nueva Materia</Button>
          </div>
          <div className="bg-white border rounded-3xl overflow-hidden shadow-sm">
            <Table><TableHeader className="bg-slate-50"><TableRow><TableHead className="px-6 font-bold">Código</TableHead><TableHead className="font-bold">Materia</TableHead><TableHead className="font-bold">Carrera</TableHead><TableHead className="font-bold">Cuatrimestre</TableHead><TableHead className="text-right pr-6 font-bold">Acciones</TableHead></TableRow></TableHeader>
              <TableBody>{filteredMaterias.map(m => (<TableRow key={m.id} className="hover:bg-slate-50/50"><TableCell className="px-6 font-bold text-primary">{m.codigo}</TableCell><TableCell className="font-medium">{m.nombre}</TableCell><TableCell className="text-xs">{carreras?.find(c => c.id === m.carreraId)?.nombre}</TableCell><TableCell className="font-medium">{m.cuatrimestre}º</TableCell><TableCell className="text-right pr-6"><Button variant="ghost" size="icon" className="rounded-full" onClick={() => handleDelete('materias', m.id)}><Trash2 className="w-4 h-4 text-primary" /></Button></TableCell></TableRow>))}</TableBody>
            </Table>
          </div>
          <Dialog open={openDialog === 'materia'} onOpenChange={(o) => setOpenDialog(o ? 'materia' : null)}>
            <DialogContent className="rounded-3xl">
              <DialogHeader><DialogTitle className="font-bold">Agregar Materia</DialogTitle></DialogHeader>
              <div className="space-y-4 py-4">
                <div className="space-y-2"><Label className="font-bold text-xs uppercase text-muted-foreground">Nombre</Label><Input value={newMateria.nombre} onChange={e => setNewMateria({...newMateria, nombre: e.target.value})} className="rounded-xl" /></div>
                <div className="space-y-2"><Label className="font-bold text-xs uppercase text-muted-foreground">Código</Label><Input value={newMateria.codigo} onChange={e => setNewMateria({...newMateria, codigo: e.target.value})} className="rounded-xl" /></div>
                <div className="space-y-2"><Label className="font-bold text-xs uppercase text-muted-foreground">Carrera</Label>
                  <Select value={newMateria.carreraId} onValueChange={v => setNewMateria({...newMateria, carreraId: v})}>
                    <SelectTrigger className="rounded-xl"><SelectValue placeholder="Elegir..." /></SelectTrigger>
                    <SelectContent>{carreras?.map(c => <SelectItem key={c.id} value={c.id}>{c.nombre}</SelectItem>)}</SelectContent>
                  </Select>
                </div>
                <div className="space-y-2"><Label className="font-bold text-xs uppercase text-muted-foreground">Cuatrimestre</Label><Input value={newMateria.cuatrimestre} onChange={e => setNewMateria({...newMateria, cuatrimestre: e.target.value})} className="rounded-xl" /></div>
              </div>
              <DialogFooter><Button onClick={() => handleAdd(materiasRef, newMateria, setNewMateria, {nombre: '', codigo: '', carreraId: '', cuatrimestre: ''}, "Materia")} className="w-full bg-primary font-bold rounded-xl h-12">Guardar</Button></DialogFooter>
            </DialogContent>
          </Dialog>
        </TabsContent>

        <TabsContent value="sedes" className="mt-6 space-y-4">
          <div className="flex justify-between items-center gap-4">
            <div className="relative flex-1 max-w-xs">
              <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
              <Input placeholder="Buscar sede..." className="pl-10 rounded-xl" value={searchSede} onChange={e => setSearchSede(e.target.value)} />
            </div>
            <Button onClick={() => setOpenDialog('sede')} className="bg-primary rounded-xl font-medium"><Plus className="w-4 h-4 mr-2" /> Nueva Sede</Button>
          </div>
          <div className="bg-white border rounded-3xl overflow-hidden shadow-sm">
            <Table><TableHeader className="bg-slate-50"><TableRow><TableHead className="px-6 font-bold py-4">Nombre</TableHead><TableHead className="font-bold">Ubicación</TableHead><TableHead className="text-right pr-6 font-bold">Acciones</TableHead></TableRow></TableHeader>
              <TableBody>{filteredSedes?.map(s => (<TableRow key={s.id} className="hover:bg-slate-50/50"><TableCell className="px-6 font-medium">{s.nombre}</TableCell><TableCell className="font-medium text-muted-foreground">{s.ubicacion}</TableCell><TableCell className="text-right pr-6"><Button variant="ghost" size="icon" className="rounded-full" onClick={() => handleDelete('sedes', s.id)}><Trash2 className="w-4 h-4 text-primary" /></Button></TableCell></TableRow>))}</TableBody>
            </Table>
          </div>
        </TabsContent>

        <TabsContent value="carreras" className="mt-6 space-y-4">
          <div className="flex justify-between items-center gap-4">
            <div className="relative flex-1 max-w-xs">
              <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
              <Input placeholder="Buscar carrera..." className="pl-10 rounded-xl" value={searchCarrera} onChange={e => setSearchCarrera(e.target.value)} />
            </div>
            <Button onClick={() => setOpenDialog('carrera')} className="bg-primary rounded-xl font-medium"><Plus className="w-4 h-4 mr-2" /> Nueva Carrera</Button>
          </div>
          <div className="bg-white border rounded-3xl overflow-hidden shadow-sm">
            <Table><TableHeader className="bg-slate-50"><TableRow><TableHead className="px-6 font-bold py-4">Carrera</TableHead><TableHead className="font-bold">Sede</TableHead><TableHead className="text-right pr-6 font-bold">Acciones</TableHead></TableRow></TableHeader>
              <TableBody>{filteredCarreras?.map(c => (<TableRow key={c.id} className="hover:bg-slate-50/50"><TableCell className="px-6 font-medium">{c.nombre}</TableCell><TableCell className="font-medium text-muted-foreground">{sedes?.find(s => s.id === c.sedeId)?.nombre}</TableCell><TableCell className="text-right pr-6"><Button variant="ghost" size="icon" className="rounded-full" onClick={() => handleDelete('carreras', c.id)}><Trash2 className="w-4 h-4 text-primary" /></Button></TableCell></TableRow>))}</TableBody>
            </Table>
          </div>
        </TabsContent>

        <TabsContent value="grupos" className="mt-6 space-y-4">
          <div className="flex justify-between items-center gap-4">
            <div className="flex items-center gap-4 flex-1">
              <div className="relative flex-1 max-w-xs">
                <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
                <Input placeholder="Buscar grupo..." className="pl-10 rounded-xl" value={searchGrupo} onChange={e => setSearchGrupo(e.target.value)} />
              </div>
              <Select value={filterGrupoCarrera} onValueChange={setFilterGrupoCarrera}>
                <SelectTrigger className="w-[200px] rounded-xl"><SelectValue placeholder="Filtrar Carrera" /></SelectTrigger>
                <SelectContent>
                  <SelectItem value="all">Todas las Carreras</SelectItem>
                  {carreras?.map(c => <SelectItem key={c.id} value={c.id}>{c.nombre}</SelectItem>)}
                </SelectContent>
              </Select>
            </div>
            <Button onClick={() => setOpenDialog('grupo')} className="bg-primary rounded-xl font-medium"><Plus className="w-4 h-4 mr-2" /> Nuevo Grupo</Button>
          </div>
          <div className="bg-white border rounded-3xl overflow-hidden shadow-sm">
            <Table><TableHeader className="bg-slate-50"><TableRow><TableHead className="px-6 font-bold">Nombre</TableHead><TableHead className="font-bold">Carrera</TableHead><TableHead className="font-bold">Cuatrimestre</TableHead><TableHead className="text-right pr-6 font-bold">Acciones</TableHead></TableRow></TableHeader>
              <TableBody>{filteredGrupos.map(g => (
                <TableRow key={g.id} className="hover:bg-slate-50/50">
                  <TableCell className="px-6 font-bold text-primary">{g.nombre}</TableCell>
                  <TableCell className="font-medium">{carreras?.find(c => c.id === g.carreraId)?.nombre}</TableCell>
                  <TableCell className="font-medium">{g.cuatrimestre}º</TableCell>
                  <TableCell className="text-right pr-6 flex justify-end gap-1">
                    <Button variant="ghost" size="icon" className="rounded-full" onClick={() => { setEditingGrupo(g); setOpenDialog('edit_grupo'); }}>
                      <Edit2 className="w-4 h-4 text-primary" />
                    </Button>
                    <Button variant="ghost" size="icon" className="rounded-full" onClick={() => handleDelete('grupos', g.id)}>
                      <Trash2 className="w-4 h-4 text-primary" />
                    </Button>
                  </TableCell>
                </TableRow>
              ))}</TableBody>
            </Table>
          </div>

          <Dialog open={openDialog === 'grupo'} onOpenChange={(o) => setOpenDialog(o ? 'grupo' : null)}>
            <DialogContent className="rounded-3xl">
              <DialogHeader><DialogTitle className="font-bold">Nuevo Grupo</DialogTitle></DialogHeader>
              <div className="space-y-4 py-4">
                <div className="space-y-2"><Label className="font-bold text-xs uppercase text-muted-foreground">Nombre</Label><Input value={newGrupo.nombre} onChange={e => setNewGrupo({...newGrupo, nombre: e.target.value})} className="rounded-xl" /></div>
                <div className="space-y-2"><Label className="font-bold text-xs uppercase text-muted-foreground">Carrera</Label>
                  <Select value={newGrupo.carreraId} onValueChange={v => setNewGrupo({...newGrupo, carreraId: v})}>
                    <SelectTrigger className="rounded-xl"><SelectValue placeholder="Elegir..." /></SelectTrigger>
                    <SelectContent>{carreras?.map(c => <SelectItem key={c.id} value={c.id}>{c.nombre}</SelectItem>)}</SelectContent>
                  </Select>
                </div>
                <div className="space-y-2"><Label className="font-bold text-xs uppercase text-muted-foreground">Cuatrimestre</Label><Input value={newGrupo.cuatrimestre} onChange={e => setNewGrupo({...newGrupo, cuatrimestre: e.target.value})} className="rounded-xl" /></div>
              </div>
              <DialogFooter><Button onClick={() => handleAdd(gruposRef, newGrupo, setNewGrupo, {nombre: '', carreraId: '', cuatrimestre: ''}, "Grupo")} className="w-full bg-primary font-bold rounded-xl h-12">Guardar Grupo</Button></DialogFooter>
            </DialogContent>
          </Dialog>

          <Dialog open={openDialog === 'edit_grupo'} onOpenChange={(o) => setOpenDialog(o ? 'edit_grupo' : null)}>
            <DialogContent className="rounded-3xl">
              <DialogHeader><DialogTitle className="font-bold">Editar Grupo</DialogTitle></DialogHeader>
              {editingGrupo && (
                <div className="space-y-4 py-4">
                  <div className="space-y-2"><Label className="font-bold text-xs uppercase text-muted-foreground">Nombre</Label><Input value={editingGrupo.nombre} onChange={e => setEditingGrupo({...editingGrupo, nombre: e.target.value})} className="rounded-xl" /></div>
                  <div className="space-y-2"><Label className="font-bold text-xs uppercase text-muted-foreground">Carrera</Label>
                    <Select value={editingGrupo.carreraId} onValueChange={v => setEditingGrupo({...editingGrupo, carreraId: v})}>
                      <SelectTrigger className="rounded-xl"><SelectValue placeholder="Elegir..." /></SelectTrigger>
                      <SelectContent>{carreras?.map(c => <SelectItem key={c.id} value={c.id}>{c.nombre}</SelectItem>)}</SelectContent>
                    </Select>
                  </div>
                  <div className="space-y-2"><Label className="font-bold text-xs uppercase text-muted-foreground">Cuatrimestre</Label><Input value={editingGrupo.cuatrimestre} onChange={e => setEditingGrupo({...editingGrupo, cuatrimestre: e.target.value})} className="rounded-xl" /></div>
                </div>
              )}
              <DialogFooter><Button onClick={handleUpdateGroup} className="w-full bg-primary font-bold rounded-xl h-12">Actualizar Grupo</Button></DialogFooter>
            </DialogContent>
          </Dialog>
        </TabsContent>
      </Tabs>

      <Dialog open={openDialog === 'face'} onOpenChange={(o) => setOpenDialog(o ? 'face' : null)}>
        <DialogContent className="max-w-3xl rounded-[2rem] p-8 border-none shadow-2xl overflow-hidden">
          <div className="absolute top-0 left-0 w-full h-1.5 bg-primary" />
          <DialogHeader className="mb-6 text-left">
             <div className="flex items-center gap-3 mb-2">
                <div className="bg-primary/10 p-2 rounded-2xl"><Camera className="w-5 h-5 text-primary" /></div>
                <DialogTitle className="text-2xl font-bold uppercase tracking-tight">
                  {faceMode === 'enroll' ? 'Registro Facial' : 'Identificación'}
                </DialogTitle>
             </div>
             <DialogDescription className="text-[10px] font-bold text-muted-foreground uppercase tracking-widest">
               {faceMode === 'enroll' 
                 ? `Capturando para: ${faceTargetUser?.firstName} ${faceTargetUser?.lastName}`
                 : 'Sistema de validación en tiempo real.'}
             </DialogDescription>
          </DialogHeader>
          <FacialRecognitionComponent 
            mode={faceMode} 
            onCapture={handleSaveFaceDescriptor} 
            labeledDescriptors={labeledDescriptors}
          />
          <div className="mt-8 flex justify-end">
            <Button variant="outline" className="rounded-xl px-8 h-12 font-bold uppercase tracking-widest text-[10px]" onClick={() => setOpenDialog(null)}>Cerrar</Button>
          </div>
        </DialogContent>
      </Dialog>
    </div>
  );
}
