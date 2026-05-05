
"use client";

import React, { useState, useRef, useMemo } from 'react';
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
  Filter,
  XCircle,
  Wrench,
  AlertTriangle,
  MoreVertical,
  AlertCircle,
  Briefcase,
  GraduationCap,
  Key,
  Camera,
  ScanFace,
  UserCheck
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
import { 
  useFirestore, 
  useCollection, 
  useMemoFirebase,
  addDocumentNonBlocking,
  updateDocumentNonBlocking,
  deleteDocumentNonBlocking
} from '@/firebase';
import { collection, doc, serverTimestamp } from 'firebase/firestore';
import { useToast } from "@/hooks/use-toast";
import { cn } from "@/lib/utils";
import * as XLSX from 'xlsx';
import { FacialRecognitionComponent } from '@/components/FacialRecognitionComponent';

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

  // Filtrado de usuarios por rol
  const docentes = useMemo(() => allUsers?.filter(u => u.role === 'Docente') || [], [allUsers]);
  const alumnos = useMemo(() => allUsers?.filter(u => u.role === 'Alumno') || [], [allUsers]);

  // Estados para diálogos
  const [openDialog, setOpenDialog] = useState<string | null>(null);
  const [copiedId, setCopiedId] = useState<string | null>(null);

  // Estados para nuevos registros
  const [newSede, setNewSede] = useState({ nombre: '', ubicacion: '' });
  const [newCarrera, setNewCarrera] = useState({ nombre: '', sedeId: '' });
  const [newMateria, setNewMateria] = useState({ nombre: '', codigo: '', carreraId: '', cuatrimestre: '' });
  const [newGrupo, setNewGrupo] = useState({ nombre: '', carreraId: '', cuatrimestre: '', docenteId: '' });
  const [newHorario, setNewHorario] = useState({ grupoId: '', dia: '', horaInicio: '', horaFin: '', aula: '' });
  const [newUser, setNewUser] = useState({ 
    firstName: '', 
    lastName: '', 
    email: '', 
    password: '', 
    role: 'Alumno', 
    carreraId: '', 
    sedeId: '',
    matricula: '',
    grupoId: ''
  });

  // Estados para edición
  const [editingSede, setEditingSede] = useState<any>(null);
  const [editingCarrera, setEditingCarrera] = useState<any>(null);
  const [editingMateria, setEditingMateria] = useState<any>(null);
  const [editingGrupo, setEditingGrupo] = useState<any>(null);
  const [editingHorario, setEditingHorario] = useState<any>(null);
  const [editingUser, setEditingUser] = useState<any>(null);

  // Estado para Reconocimiento Facial
  const [faceTargetUser, setFaceTargetUser] = useState<any>(null);

  // Estados para selección masiva de materias
  const [selectedMateriaIds, setSelectedMateriaIds] = useState<string[]>([]);
  const [bulkTargetCareerId, setBulkTargetCareerId] = useState('');
  const [showBulkDeleteAlert, setShowBulkDeleteAlert] = useState(false);

  // Estados para filtros de Materias
  const [materiaSearch, setMateriaSearch] = useState('');
  const [materiaCarreraFilter, setMateriaCarreraFilter] = useState('all');
  const [materiaCuatriFilter, setMateriaCuatriFilter] = useState('all');

  const materiasFiltradasTabla = useMemo(() => {
    if (!materias) return [];
    return materias.filter(m => {
      const matchSearch = (m.nombre || "").toLowerCase().includes(materiaSearch.toLowerCase()) || 
                          (m.codigo?.toLowerCase().includes(materiaSearch.toLowerCase()) || false);
      
      let matchCarrera = true;
      if (materiaCarreraFilter === 'orphans') {
        matchCarrera = !m.carreraId || m.carreraId === "" || m.carreraId === "null";
      } else if (materiaCarreraFilter !== 'all') {
        matchCarrera = m.carreraId === materiaCarreraFilter;
      }

      const matchCuatri = materiaCuatriFilter === 'all' || m.cuatrimestre === materiaCuatriFilter;
      return matchSearch && matchCarrera && matchCuatri;
    }).sort((a,b) => Number(a.cuatrimestre) - Number(b.cuatrimestre));
  }, [materias, materiaSearch, materiaCarreraFilter, materiaCuatriFilter]);

  const handleAdd = (ref: any, data: any, setter: any, emptyData: any, title: string) => {
    addDocumentNonBlocking(ref, { ...data, createdAt: serverTimestamp() });
    setter(emptyData);
    setOpenDialog(null);
    toast({ title: `${title} guardado`, description: "Sincronizando..." });
    setTimeout(() => window.location.reload(), 1000);
  };

  const handleUpdate = (collectionName: string, id: string, data: any, title: string) => {
    const docRef = doc(db, collectionName, id);
    updateDocumentNonBlocking(docRef, { ...data, updatedAt: serverTimestamp() });
    setOpenDialog(null);
    toast({ title: `${title} actualizado`, description: "Sincronizando..." });
    setTimeout(() => window.location.reload(), 1000);
  };

  const handleDelete = (collectionName: string, id: string) => {
    const docRef = doc(db, collectionName, id);
    deleteDocumentNonBlocking(docRef);
    toast({ variant: "destructive", title: "Eliminado", description: "Actualizando..." });
    setTimeout(() => window.location.reload(), 1000);
  };

  const handleSaveFaceDescriptor = (descriptor: number[]) => {
    if (!faceTargetUser) return;
    const docRef = doc(db, 'users', faceTargetUser.id);
    updateDocumentNonBlocking(docRef, { 
      faceDescriptor: descriptor,
      updatedAt: serverTimestamp()
    });
    setOpenDialog(null);
    setFaceTargetUser(null);
    toast({ title: "Biometría Guardada", description: "Rostro enrolado con éxito." });
    setTimeout(() => window.location.reload(), 1500);
  };

  const toggleSelectMateria = (id: string) => {
    setSelectedMateriaIds(prev => 
      prev.includes(id) ? prev.filter(mid => mid !== id) : [...prev, id]
    );
  };

  const toggleSelectAllMaterias = () => {
    if (selectedMateriaIds.length === materiasFiltradasTabla.length) {
      setSelectedMateriaIds([]);
    } else {
      setSelectedMateriaIds(materiasFiltradasTabla.map(m => m.id));
    }
  };

  const handleBulkAssignCareer = () => {
    if (!bulkTargetCareerId || selectedMateriaIds.length === 0) return;

    selectedMateriaIds.forEach(id => {
      const docRef = doc(db, 'materias', id);
      updateDocumentNonBlocking(docRef, { 
        carreraId: bulkTargetCareerId,
        updatedAt: serverTimestamp()
      });
    });

    toast({ 
      title: "Vinculación Exitosa", 
      description: `${selectedMateriaIds.length} materias asignadas correctamente.` 
    });
    setOpenDialog(null);
    setSelectedMateriaIds([]);
    setTimeout(() => window.location.reload(), 1500);
  };

  const handleBulkDelete = () => {
    if (selectedMateriaIds.length === 0) return;

    selectedMateriaIds.forEach(id => {
      const docRef = doc(db, 'materias', id);
      deleteDocumentNonBlocking(docRef);
    });

    toast({ 
      variant: "destructive",
      title: "Eliminación Masiva", 
      description: `${selectedMateriaIds.length} materias eliminadas.` 
    });
    setSelectedMateriaIds([]);
    setShowBulkDeleteAlert(false);
    setTimeout(() => window.location.reload(), 1500);
  };

  const copyToClipboard = (text: string) => {
    navigator.clipboard.writeText(text);
    setCopiedId(text);
    setTimeout(() => setCopiedId(null), 2000);
    toast({ title: "ID Copiado" });
  };

  const handleDownloadTemplate = () => {
    const data = [{ nombre: 'Matemáticas I', cuatrimestre: '1', carreraId: 'Pega el ID aquí' }];
    const worksheet = XLSX.utils.json_to_sheet(data);
    const workbook = XLSX.utils.book_new();
    XLSX.utils.book_append_sheet(workbook, worksheet, "Plantilla");
    XLSX.writeFile(workbook, "Plantilla_Materias.xlsx");
  };

  const handleImportMateriasExcel = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file || !materiasRef) return;

    const reader = new FileReader();
    reader.onload = (evt) => {
      try {
        const bstr = evt.target?.result;
        const workbook = XLSX.read(bstr, { type: 'binary' });
        const wsname = workbook.SheetNames[0];
        const ws = workbook.Sheets[wsname];
        const data = XLSX.utils.sheet_to_json(ws) as any[];

        let count = 0;
        data.forEach((row) => {
          let targetCarreraId = String(row.carreraId || '').trim();
          if ((!targetCarreraId || targetCarreraId.length < 5) && row.carrera && carreras) {
            const matched = carreras.find(c => c.nombre.toLowerCase() === String(row.carrera).toLowerCase().trim());
            if (matched) targetCarreraId = matched.id;
          }

          if (row.nombre && row.cuatrimestre) {
            const code = `MAT-${String(row.nombre).substring(0,3).toUpperCase()}-${row.cuatrimestre}-${Math.floor(Math.random()*1000)}`;
            addDocumentNonBlocking(materiasRef, {
              nombre: String(row.nombre),
              codigo: row.codigo || code,
              carreraId: targetCarreraId,
              cuatrimestre: String(row.cuatrimestre),
              createdAt: serverTimestamp()
            });
            count++;
          }
        });

        toast({ title: "Importación finalizada", description: `${count} materias procesadas.` });
        if (materiaFileInputRef.current) materiaFileInputRef.current.value = '';
        setTimeout(() => window.location.reload(), 2000);
      } catch (error) {
        toast({ variant: "destructive", title: "Error en archivo", description: "Verifique el formato del Excel." });
      }
    };
    reader.readAsBinaryString(file);
  };

  return (
    <div className="space-y-6 animate-in fade-in duration-500 pb-20">
      <div className="flex justify-between items-end pb-4 border-b">
        <div>
          <h1 className="text-3xl font-black tracking-tighter text-foreground uppercase">Catálogos Institucionales</h1>
          <p className="text-muted-foreground font-medium text-sm">Administra la estructura académica y personal de la universidad.</p>
        </div>
      </div>

      <Tabs defaultValue="sedes" className="w-full">
        <TabsList className="bg-slate-100/80 p-1 rounded-2xl h-14 w-full justify-start gap-1 border overflow-x-auto overflow-y-hidden scrollbar-hide">
          <TabsTrigger value="sedes" className="rounded-xl data-[state=active]:bg-white data-[state=active]:text-primary px-4 font-bold flex gap-2">
            <Building2 className="w-4 h-4" /> Sedes
          </TabsTrigger>
          <TabsTrigger value="carreras" className="rounded-xl data-[state=active]:bg-white data-[state=active]:text-primary px-4 font-bold flex gap-2">
            <BookOpen className="w-4 h-4" /> Carreras
          </TabsTrigger>
          <TabsTrigger value="materias" className="rounded-xl data-[state=active]:bg-white data-[state=active]:text-primary px-4 font-bold flex gap-2">
            <FolderTree className="w-4 h-4" /> Materias
          </TabsTrigger>
          <TabsTrigger value="grupos" className="rounded-xl data-[state=active]:bg-white data-[state=active]:text-primary px-4 font-bold flex gap-2">
            <Users className="w-4 h-4" /> Grupos
          </TabsTrigger>
          <TabsTrigger value="horarios" className="rounded-xl data-[state=active]:bg-white data-[state=active]:text-primary px-4 font-bold flex gap-2">
            <Clock className="w-4 h-4" /> Horarios
          </TabsTrigger>
          <TabsTrigger value="docentes" className="rounded-xl data-[state=active]:bg-white data-[state=active]:text-primary px-4 font-bold flex gap-2">
            <Briefcase className="w-4 h-4" /> Docentes
          </TabsTrigger>
          <TabsTrigger value="alumnos" className="rounded-xl data-[state=active]:bg-white data-[state=active]:text-primary px-4 font-bold flex gap-2">
            <GraduationCap className="w-4 h-4" /> Alumnos
          </TabsTrigger>
        </TabsList>

        {/* --- SEDES --- */}
        <TabsContent value="sedes" className="mt-6 space-y-4">
          <div className="flex justify-between items-center">
            <h2 className="text-xl font-bold">Sedes</h2>
            <Dialog open={openDialog === 'sede'} onOpenChange={(o) => setOpenDialog(o ? 'sede' : null)}>
              <DialogTrigger asChild>
                <Button className="bg-primary rounded-xl font-bold"><Plus className="w-4 h-4 mr-2" /> Nueva Sede</Button>
              </DialogTrigger>
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
              <TableHeader className="bg-slate-50">
                <TableRow>
                  <TableHead className="px-6 font-bold py-4">ID</TableHead>
                  <TableHead className="font-bold">Nombre</TableHead>
                  <TableHead className="font-bold">Ubicación</TableHead>
                  <TableHead className="font-bold text-right pr-6">Acciones</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {sedes?.map(s => (
                  <TableRow key={s.id}>
                    <TableCell className="px-6 font-mono text-[10px] text-muted-foreground">{s.id}</TableCell>
                    <TableCell className="font-medium">{s.nombre}</TableCell>
                    <TableCell className="text-muted-foreground">{s.ubicacion}</TableCell>
                    <TableCell className="text-right pr-6">
                      <DropdownMenu>
                        <DropdownMenuTrigger asChild><Button variant="ghost" size="icon" className="h-8 w-8"><MoreVertical className="w-4 h-4" /></Button></DropdownMenuTrigger>
                        <DropdownMenuContent align="end" className="rounded-xl">
                          <DropdownMenuItem onClick={() => { setEditingSede(s); setOpenDialog('editSede'); }} className="gap-2 font-bold"><Edit2 className="w-4 h-4" /> Editar</DropdownMenuItem>
                          <DropdownMenuItem onClick={() => handleDelete('sedes', s.id)} className="gap-2 text-primary font-bold"><Trash2 className="w-4 h-4" /> Eliminar</DropdownMenuItem>
                        </DropdownMenuContent>
                      </DropdownMenu>
                    </TableCell>
                  </TableRow>
                ))}
              </TableBody>
            </Table>
          </div>
        </TabsContent>

        {/* --- CARRERAS --- */}
        <TabsContent value="carreras" className="mt-6 space-y-4">
          <div className="flex justify-between items-center">
            <h2 className="text-xl font-bold">Carreras</h2>
            <Dialog open={openDialog === 'carrera'} onOpenChange={(o) => setOpenDialog(o ? 'carrera' : null)}>
              <DialogTrigger asChild>
                <Button className="bg-primary rounded-xl font-bold"><Plus className="w-4 h-4 mr-2" /> Nueva Carrera</Button>
              </DialogTrigger>
              <DialogContent className="rounded-3xl">
                <DialogHeader><DialogTitle>Nueva Carrera</DialogTitle></DialogHeader>
                <div className="space-y-4 py-4">
                  <div className="space-y-2"><Label>Nombre</Label><Input value={newCarrera.nombre} onChange={e => setNewCarrera({...newCarrera, nombre: e.target.value})} /></div>
                  <div className="space-y-2">
                    <Label>Sede</Label>
                    <Select value={newCarrera.sedeId} onValueChange={v => setNewCarrera({...newCarrera, sedeId: v})}>
                      <SelectTrigger className="rounded-xl"><SelectValue placeholder="Elegir Sede" /></SelectTrigger>
                      <SelectContent>{sedes?.map(s => <SelectItem key={s.id} value={s.id}>{s.nombre}</SelectItem>)}</SelectContent>
                    </Select>
                  </div>
                </div>
                <DialogFooter><Button onClick={() => handleAdd(carrerasRef, newCarrera, setNewCarrera, {nombre: '', sedeId: ''}, "Carrera")} className="w-full bg-primary font-bold">Guardar</Button></DialogFooter>
              </DialogContent>
            </Dialog>
          </div>
          <div className="bg-white border rounded-3xl overflow-hidden shadow-sm">
            <Table>
              <TableHeader className="bg-slate-50">
                <TableRow>
                  <TableHead className="px-6 font-bold py-4">Nombre</TableHead>
                  <TableHead className="font-bold">ID</TableHead>
                  <TableHead className="font-bold">Sede</TableHead>
                  <TableHead className="font-bold text-right pr-6">Acciones</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {carreras?.map(c => (
                  <TableRow key={c.id}>
                    <TableCell className="px-6 font-bold">{c.nombre}</TableCell>
                    <TableCell>
                      <div className="flex items-center gap-2">
                        <code className="bg-slate-100 px-2 py-1 rounded text-[10px] font-mono">{c.id}</code>
                        <Button variant="ghost" size="icon" className="h-6 w-6" onClick={() => copyToClipboard(c.id)}>
                          {copiedId === c.id ? <Check className="w-3 h-3 text-green-600" /> : <Copy className="w-3 h-3" />}
                        </Button>
                      </div>
                    </TableCell>
                    <TableCell>{sedes?.find(s => s.id === c.sedeId)?.nombre || 'Sede N/A'}</TableCell>
                    <TableCell className="text-right pr-6">
                      <DropdownMenu>
                        <DropdownMenuTrigger asChild><Button variant="ghost" size="icon" className="h-8 w-8"><MoreVertical className="w-4 h-4" /></Button></DropdownMenuTrigger>
                        <DropdownMenuContent align="end" className="rounded-xl">
                          <DropdownMenuItem onClick={() => { setEditingCarrera(c); setOpenDialog('editCarrera'); }} className="gap-2 font-bold"><Edit2 className="w-4 h-4" /> Editar</DropdownMenuItem>
                          <DropdownMenuItem onClick={() => handleDelete('carreras', c.id)} className="gap-2 text-primary font-bold"><Trash2 className="w-4 h-4" /> Eliminar</DropdownMenuItem>
                        </DropdownMenuContent>
                      </DropdownMenu>
                    </TableCell>
                  </TableRow>
                ))}
              </TableBody>
            </Table>
          </div>
        </TabsContent>

        {/* --- MATERIAS --- */}
        <TabsContent value="materias" className="mt-6 space-y-4">
          <div className="flex justify-between items-center">
            <div className="flex items-center gap-3">
              <h2 className="text-xl font-bold">Materias</h2>
              {selectedMateriaIds.length > 0 && (
                <div className="flex items-center gap-2 bg-primary/10 px-4 py-1.5 rounded-full border border-primary/20 animate-in slide-in-from-left-4">
                  <span className="text-xs font-black text-primary">{selectedMateriaIds.length} Seleccionadas</span>
                  <Dialog open={openDialog === 'bulkAssign'} onOpenChange={(o) => setOpenDialog(o ? 'bulkAssign' : null)}>
                    <DialogTrigger asChild>
                      <Button size="sm" className="h-7 rounded-full bg-primary font-bold text-[10px] uppercase px-4">
                        <Wrench className="w-3 h-3 mr-2" /> Asignar Carrera
                      </Button>
                    </DialogTrigger>
                    <DialogContent className="rounded-3xl">
                      <DialogHeader>
                        <DialogTitle>Asignación Masiva</DialogTitle>
                        <DialogDescription>Asigna las {selectedMateriaIds.length} materias seleccionadas a una carrera.</DialogDescription>
                      </DialogHeader>
                      <div className="py-6 space-y-2">
                        <Label>Carrera Destino:</Label>
                        <Select value={bulkTargetCareerId} onValueChange={setBulkTargetCareerId}>
                          <SelectTrigger className="rounded-xl"><SelectValue placeholder="Seleccionar Carrera" /></SelectTrigger>
                          <SelectContent>{carreras?.map(c => <SelectItem key={c.id} value={c.id}>{c.nombre}</SelectItem>)}</SelectContent>
                        </Select>
                      </div>
                      <DialogFooter><Button onClick={handleBulkAssignCareer} disabled={!bulkTargetCareerId} className="w-full bg-primary font-bold">Vincular Ahora</Button></DialogFooter>
                    </DialogContent>
                  </Dialog>
                  <Button variant="destructive" size="sm" className="h-7 rounded-full font-bold text-[10px] uppercase px-4" onClick={() => setShowBulkDeleteAlert(true)}><Trash2 className="w-3 h-3 mr-2" /> Eliminar</Button>
                  <Button variant="ghost" size="icon" className="h-6 w-6 rounded-full hover:bg-white" onClick={() => setSelectedMateriaIds([])}><XCircle className="w-4 h-4 text-muted-foreground" /></Button>
                </div>
              )}
            </div>
            <div className="flex gap-2 flex-wrap justify-end">
              <input type="file" ref={materiaFileInputRef} onChange={handleImportMateriasExcel} className="hidden" />
              <Button variant="outline" className="rounded-xl h-10" onClick={handleDownloadTemplate} title="Descargar formato excel"><Download className="w-4 h-4 mr-2" /> Plantilla</Button>
              <Button variant="outline" className="rounded-xl h-10" onClick={() => materiaFileInputRef.current?.click()}><Upload className="w-4 h-4 mr-2" /> Importar Excel</Button>
              <Dialog open={openDialog === 'materia'} onOpenChange={(o) => setOpenDialog(o ? 'materia' : null)}>
                <DialogTrigger asChild>
                  <Button className="bg-primary rounded-xl font-bold h-10"><Plus className="w-4 h-4 mr-2" /> Nueva Materia</Button>
                </DialogTrigger>
                <DialogContent className="rounded-3xl">
                  <DialogHeader><DialogTitle>Nueva Materia</DialogTitle></DialogHeader>
                  <div className="space-y-4 py-4">
                    <div className="space-y-2"><Label>Nombre</Label><Input value={newMateria.nombre} onChange={e => setNewMateria({...newMateria, nombre: e.target.value})} /></div>
                    <div className="grid grid-cols-2 gap-4">
                      <div className="space-y-2"><Label>Código</Label><Input value={newMateria.codigo} onChange={e => setNewMateria({...newMateria, codigo: e.target.value})} placeholder="Ej: MAT-101" /></div>
                      <div className="space-y-2"><Label>Cuatrimestre</Label><Input value={newMateria.cuatrimestre} onChange={e => setNewMateria({...newMateria, cuatrimestre: e.target.value})} /></div>
                    </div>
                    <div className="space-y-2">
                      <Label>Carrera</Label>
                      <Select value={newMateria.carreraId} onValueChange={v => setNewMateria({...newMateria, carreraId: v})}>
                        <SelectTrigger className="rounded-xl"><SelectValue placeholder="Seleccionar Carrera" /></SelectTrigger>
                        <SelectContent>{carreras?.map(c => <SelectItem key={c.id} value={c.id}>{c.nombre}</SelectItem>)}</SelectContent>
                      </Select>
                    </div>
                  </div>
                  <DialogFooter><Button onClick={() => handleAdd(materiasRef, newMateria, setNewMateria, {nombre: '', codigo: '', carreraId: '', cuatrimestre: ''}, "Materia")} className="w-full bg-primary font-bold">Guardar</Button></DialogFooter>
                </DialogContent>
              </Dialog>
            </div>
          </div>

          <div className="bg-slate-50 p-4 rounded-3xl border flex flex-wrap gap-4 items-end">
            <div className="flex-1 min-w-[200px] space-y-1.5">
              <Label className="text-[10px] font-black uppercase text-muted-foreground ml-2">Buscar</Label>
              <div className="relative">
                <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground" />
                <Input value={materiaSearch} onChange={e => setMateriaSearch(e.target.value)} placeholder="Nombre o código..." className="pl-10 rounded-xl bg-white" />
              </div>
            </div>
            <div className="w-full sm:w-64 space-y-1.5">
              <Label className="text-[10px] font-black uppercase text-muted-foreground ml-2">Carrera</Label>
              <Select value={materiaCarreraFilter} onValueChange={setMateriaCarreraFilter}>
                <SelectTrigger className="rounded-xl bg-white"><SelectValue placeholder="Todas" /></SelectTrigger>
                <SelectContent>
                  <SelectItem value="all">Todas</SelectItem>
                  <SelectItem value="orphans" className="text-primary font-bold">⚠️ Sin Carrera</SelectItem>
                  {carreras?.map(c => <SelectItem key={c.id} value={c.id}>{c.nombre}</SelectItem>)}
                </SelectContent>
              </Select>
            </div>
            <div className="w-32 space-y-1.5">
              <Label className="text-[10px] font-black uppercase text-muted-foreground ml-2">Cuatrimestre</Label>
              <Select value={materiaCuatriFilter} onValueChange={setMateriaCuatriFilter}>
                <SelectTrigger className="rounded-xl bg-white"><SelectValue placeholder="Todos" /></SelectTrigger>
                <SelectContent>
                  <SelectItem value="all">Todos</SelectItem>
                  {[1,2,3,4,5,6,7,8,9,10,11,12].map(n => <SelectItem key={n} value={String(n)}>{n}°</SelectItem>)}
                </SelectContent>
              </Select>
            </div>
          </div>

          <div className="bg-white border rounded-3xl overflow-hidden shadow-sm">
            <Table>
              <TableHeader className="bg-slate-50">
                <TableRow>
                  <TableHead className="w-12 px-6">
                    <Checkbox checked={selectedMateriaIds.length === materiasFiltradasTabla.length && materiasFiltradasTabla.length > 0} onCheckedChange={toggleSelectAllMaterias} />
                  </TableHead>
                  <TableHead className="font-bold">Código</TableHead>
                  <TableHead className="font-bold">Nombre</TableHead>
                  <TableHead className="font-bold">Carrera</TableHead>
                  <TableHead className="font-bold">Cuat.</TableHead>
                  <TableHead className="font-bold text-right pr-6">Acciones</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {materiasFiltradasTabla.map(m => {
                  const carrera = carreras?.find(c => c.id === m.carreraId);
                  return (
                    <TableRow key={m.id} className={cn("transition-colors", selectedMateriaIds.includes(m.id) ? "bg-primary/5" : "hover:bg-slate-50/50")}>
                      <TableCell className="px-6">
                        <Checkbox checked={selectedMateriaIds.includes(m.id)} onCheckedChange={() => toggleSelectMateria(m.id)} />
                      </TableCell>
                      <TableCell className="font-black text-primary text-xs uppercase">{m.codigo}</TableCell>
                      <TableCell className="font-medium">{m.nombre}</TableCell>
                      <TableCell className={cn("text-xs", !carrera ? "text-red-600 font-bold flex items-center gap-1" : "text-muted-foreground")}>
                        {!carrera && <AlertTriangle className="w-3 h-3" />} {carrera?.nombre || 'SIN ASIGNAR'}
                      </TableCell>
                      <TableCell className="font-bold">{m.cuatrimestre}°</TableCell>
                      <TableCell className="text-right pr-6">
                        <DropdownMenu>
                          <DropdownMenuTrigger asChild><Button variant="ghost" size="icon" className="h-8 w-8"><MoreVertical className="w-4 h-4" /></Button></DropdownMenuTrigger>
                          <DropdownMenuContent align="end" className="rounded-xl">
                            <DropdownMenuItem onClick={() => { setEditingMateria(m); setOpenDialog('editMateria'); }} className="gap-2 font-bold"><Edit2 className="w-4 h-4" /> Editar</DropdownMenuItem>
                            <DropdownMenuItem onClick={() => handleDelete('materias', m.id)} className="gap-2 text-primary font-bold"><Trash2 className="w-4 h-4" /> Eliminar</DropdownMenuItem>
                          </DropdownMenuContent>
                        </DropdownMenu>
                      </TableCell>
                    </TableRow>
                  );
                })}
              </TableBody>
            </Table>
          </div>
        </TabsContent>

        {/* --- GRUPOS --- */}
        <TabsContent value="grupos" className="mt-6 space-y-4">
          <div className="flex justify-between items-center">
            <h2 className="text-xl font-bold">Grupos</h2>
            <Dialog open={openDialog === 'grupo'} onOpenChange={(o) => setOpenDialog(o ? 'grupo' : null)}>
              <DialogTrigger asChild>
                <Button className="bg-primary rounded-xl font-bold"><Plus className="w-4 h-4 mr-2" /> Nuevo Grupo</Button>
              </DialogTrigger>
              <DialogContent className="rounded-3xl">
                <DialogHeader><DialogTitle>Nuevo Grupo</DialogTitle></DialogHeader>
                <div className="space-y-4 py-4">
                  <div className="space-y-2">
                    <Label>Carrera (Obligatorio)</Label>
                    <Select value={newGrupo.carreraId} onValueChange={v => setNewGrupo({...newGrupo, carreraId: v})}>
                      <SelectTrigger className="rounded-xl"><SelectValue placeholder="Elegir Carrera" /></SelectTrigger>
                      <SelectContent>{carreras?.map(c => <SelectItem key={c.id} value={c.id}>{c.nombre}</SelectItem>)}</SelectContent>
                    </Select>
                  </div>
                  <div className="space-y-2">
                    <Label>Cuatrimestre (Obligatorio)</Label>
                    <Select value={newGrupo.cuatrimestre} onValueChange={v => setNewGrupo({...newGrupo, cuatrimestre: v})}>
                      <SelectTrigger className="rounded-xl"><SelectValue placeholder="Elegir Cuatrimestre" /></SelectTrigger>
                      <SelectContent>{[1,2,3,4,5,6,7,8,9,10,11,12].map(n => <SelectItem key={n} value={String(n)}>{n}° Cuatrimestre</SelectItem>)}</SelectContent>
                    </Select>
                  </div>
                  <div className="space-y-2">
                    <Label>Docente Asignado</Label>
                    <Select value={newGrupo.docenteId} onValueChange={v => setNewGrupo({...newGrupo, docenteId: v})}>
                      <SelectTrigger className="rounded-xl"><SelectValue placeholder="Sin Docente" /></SelectTrigger>
                      <SelectContent>
                        <SelectItem value="null">Ninguno</SelectItem>
                        {docentes.map(d => <SelectItem key={d.id} value={d.id}>{d.firstName} {d.lastName}</SelectItem>)}
                      </SelectContent>
                    </Select>
                  </div>
                  <div className="space-y-2"><Label>Nombre del Grupo</Label><Input value={newGrupo.nombre} onChange={e => setNewGrupo({...newGrupo, nombre: e.target.value})} placeholder="Ej: Sección A, G1, etc." /></div>
                </div>
                <DialogFooter>
                  <Button 
                    disabled={!newGrupo.carreraId || !newGrupo.cuatrimestre || !newGrupo.nombre}
                    onClick={() => handleAdd(gruposRef, {nombre: newGrupo.nombre, carreraId: newGrupo.carreraId, cuatrimestre: newGrupo.cuatrimestre, docenteId: newGrupo.docenteId}, setNewGrupo, {nombre: '', carreraId: '', cuatrimestre: '', docenteId: ''}, "Grupo")} 
                    className="w-full bg-primary font-bold"
                  >
                    Guardar Grupo
                  </Button>
                </DialogFooter>
              </DialogContent>
            </Dialog>
          </div>
          <div className="bg-white border rounded-3xl overflow-hidden shadow-sm">
            <Table>
              <TableHeader className="bg-slate-50">
                <TableRow>
                  <TableHead className="px-6 font-bold py-4">Grupo</TableHead>
                  <TableHead className="font-bold">Carrera</TableHead>
                  <TableHead className="font-bold">Cuatrimestre</TableHead>
                  <TableHead className="font-bold">Docente</TableHead>
                  <TableHead className="font-bold text-right pr-6">Acciones</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {grupos?.map(g => {
                  const carrera = carreras?.find(c => c.id === g.carreraId);
                  const docente = docentes.find(d => d.id === g.docenteId);
                  return (
                    <TableRow key={g.id}>
                      <TableCell className="px-6"><span className="bg-slate-900 text-white px-3 py-1 rounded-lg font-black text-[10px]">{g.nombre}</span></TableCell>
                      <TableCell className="font-medium">{carrera?.nombre || 'N/A'}</TableCell>
                      <TableCell className="text-sm font-bold">{g.cuatrimestre}°</TableCell>
                      <TableCell className="text-xs font-semibold text-accent">
                        {docente ? `${docente.firstName} ${docente.lastName}` : <span className="text-muted-foreground italic font-normal">No asignado</span>}
                      </TableCell>
                      <TableCell className="text-right pr-6">
                        <DropdownMenu>
                          <DropdownMenuTrigger asChild><Button variant="ghost" size="icon" className="h-8 w-8"><MoreVertical className="w-4 h-4" /></Button></DropdownMenuTrigger>
                          <DropdownMenuContent align="end" className="rounded-xl">
                            <DropdownMenuItem onClick={() => { setEditingGrupo(g); setOpenDialog('editGrupo'); }} className="gap-2 font-bold"><Edit2 className="w-4 h-4" /> Editar</DropdownMenuItem>
                            <DropdownMenuItem onClick={() => handleDelete('grupos', g.id)} className="gap-2 text-primary font-bold"><Trash2 className="w-4 h-4" /> Eliminar</DropdownMenuItem>
                          </DropdownMenuContent>
                        </DropdownMenu>
                      </TableCell>
                    </TableRow>
                  );
                })}
              </TableBody>
            </Table>
          </div>
        </TabsContent>

        {/* --- DOCENTES --- */}
        <TabsContent value="docentes" className="mt-6 space-y-4">
          <div className="flex justify-between items-center">
            <h2 className="text-xl font-bold">Docentes</h2>
            <Dialog open={openDialog === 'docente'} onOpenChange={(o) => setOpenDialog(o ? 'docente' : null)}>
              <DialogTrigger asChild>
                <Button className="bg-primary rounded-xl font-bold"><Plus className="w-4 h-4 mr-2" /> Nuevo Docente</Button>
              </DialogTrigger>
              <DialogContent className="rounded-3xl">
                <DialogHeader><DialogTitle>Alta de Docente</DialogTitle></DialogHeader>
                <div className="space-y-4 py-4">
                  <div className="grid grid-cols-2 gap-4">
                    <div className="space-y-2"><Label>Nombre(s)</Label><Input value={newUser.firstName} onChange={e => setNewUser({...newUser, firstName: e.target.value})} /></div>
                    <div className="space-y-2"><Label>Apellido(s)</Label><Input value={newUser.lastName} onChange={e => setNewUser({...newUser, lastName: e.target.value})} /></div>
                  </div>
                  <div className="space-y-2"><Label>Correo Electrónico</Label><Input type="email" value={newUser.email} onChange={e => setNewUser({...newUser, email: e.target.value})} /></div>
                  <div className="space-y-2"><Label>Contraseña</Label><div className="relative"><Key className="absolute left-3 top-3 w-4 h-4 text-muted-foreground" /><Input type="password" value={newUser.password} onChange={e => setNewUser({...newUser, password: e.target.value})} className="pl-10" /></div></div>
                </div>
                <DialogFooter><Button onClick={() => handleAdd(usersRef, {...newUser, role: 'Docente'}, setNewUser, {firstName: '', lastName: '', email: '', password: '', role: 'Alumno', carreraId: '', sedeId: '', matricula: '', grupoId: ''}, "Docente")} className="w-full bg-primary font-bold">Dar de Alta</Button></DialogFooter>
              </DialogContent>
            </Dialog>
          </div>
          <div className="bg-white border rounded-3xl overflow-hidden shadow-sm">
            <Table>
              <TableHeader className="bg-slate-50">
                <TableRow>
                  <TableHead className="px-6 font-bold py-4">Nombre Completo</TableHead>
                  <TableHead className="font-bold">Email</TableHead>
                  <TableHead className="font-bold">Grupos Asignados</TableHead>
                  <TableHead className="font-bold text-right pr-6">Acciones</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {docentes?.map(d => {
                  const gruposDocente = grupos?.filter(g => g.docenteId === d.id) || [];
                  return (
                    <TableRow key={d.id}>
                      <TableCell className="px-6 font-medium">{d.firstName} {d.lastName}</TableCell>
                      <TableCell className="text-muted-foreground">{d.email}</TableCell>
                      <TableCell>
                        <div className="flex flex-wrap gap-1">
                          {gruposDocente.length > 0 ? (
                            gruposDocente.map(g => (
                              <span key={g.id} className="bg-primary/5 border border-primary/20 text-primary text-[10px] px-2 py-0.5 rounded-full font-bold">
                                {g.nombre} ({carreras?.find(c => c.id === g.carreraId)?.nombre || 'S/C'})
                              </span>
                            ))
                          ) : (
                            <span className="text-[10px] text-muted-foreground italic">Sin grupos</span>
                          )}
                        </div>
                      </TableCell>
                      <TableCell className="text-right pr-6">
                        <DropdownMenu>
                          <DropdownMenuTrigger asChild><Button variant="ghost" size="icon" className="h-8 w-8"><MoreVertical className="w-4 h-4" /></Button></DropdownMenuTrigger>
                          <DropdownMenuContent align="end" className="rounded-xl">
                            <DropdownMenuItem onClick={() => { setEditingUser(d); setOpenDialog('editUser'); }} className="gap-2 font-bold"><Edit2 className="w-4 h-4" /> Editar</DropdownMenuItem>
                            <DropdownMenuItem onClick={() => handleDelete('users', d.id)} className="gap-2 text-primary font-bold"><Trash2 className="w-4 h-4" /> Eliminar</DropdownMenuItem>
                          </DropdownMenuContent>
                        </DropdownMenu>
                      </TableCell>
                    </TableRow>
                  );
                })}
              </TableBody>
            </Table>
          </div>
        </TabsContent>

        {/* --- ALUMNOS --- */}
        <TabsContent value="alumnos" className="mt-6 space-y-4">
          <div className="flex justify-between items-center">
            <h2 className="text-xl font-bold">Alumnos</h2>
            <div className="flex gap-2">
              <Button 
                variant="outline" 
                className="rounded-xl font-bold border-primary text-primary"
                onClick={() => setOpenDialog('verifyFace')}
              >
                <ScanFace className="w-4 h-4 mr-2" />
                Verificar Rostro
              </Button>
              <Dialog open={openDialog === 'alumno'} onOpenChange={(o) => setOpenDialog(o ? 'alumno' : null)}>
                <DialogTrigger asChild>
                  <Button className="bg-primary rounded-xl font-bold"><Plus className="w-4 h-4 mr-2" /> Nuevo Alumno</Button>
                </DialogTrigger>
                <DialogContent className="rounded-3xl">
                  <DialogHeader><DialogTitle>Inscripción de Alumno</DialogTitle></DialogHeader>
                  <div className="space-y-4 py-4 max-h-[70vh] overflow-y-auto px-1">
                    <div className="grid grid-cols-2 gap-4">
                      <div className="space-y-2"><Label>Matrícula</Label><Input value={newUser.matricula} onChange={e => setNewUser({...newUser, matricula: e.target.value})} placeholder="Ej: 2024001" /></div>
                    </div>
                    <div className="grid grid-cols-2 gap-4">
                      <div className="space-y-2"><Label>Nombre(s)</Label><Input value={newUser.firstName} onChange={e => setNewUser({...newUser, firstName: e.target.value})} /></div>
                      <div className="space-y-2"><Label>Apellido(s)</Label><Input value={newUser.lastName} onChange={e => setNewUser({...newUser, lastName: e.target.value})} /></div>
                    </div>
                    <div className="space-y-2"><Label>Correo Institucional</Label><Input type="email" value={newUser.email} onChange={e => setNewUser({...newUser, email: e.target.value})} /></div>
                    <div className="grid grid-cols-2 gap-4">
                      <div className="space-y-2">
                        <Label>Carrera</Label>
                        <Select value={newUser.carreraId} onValueChange={v => setNewUser({...newUser, carreraId: v, grupoId: ''})}>
                          <SelectTrigger className="rounded-xl"><SelectValue placeholder="Carrera" /></SelectTrigger>
                          <SelectContent>{carreras?.map(c => <SelectItem key={c.id} value={c.id}>{c.nombre}</SelectItem>)}</SelectContent>
                        </Select>
                      </div>
                      <div className="space-y-2">
                        <Label>Grupo</Label>
                        <Select 
                          disabled={!newUser.carreraId} 
                          value={newUser.grupoId} 
                          onValueChange={v => setNewUser({...newUser, grupoId: v})}
                        >
                          <SelectTrigger className="rounded-xl"><SelectValue placeholder="Grupo" /></SelectTrigger>
                          <SelectContent>
                            {grupos?.filter(g => g.carreraId === newUser.carreraId).map(g => (
                              <SelectItem key={g.id} value={g.id}>{g.nombre} ({g.cuatrimestre}°)</SelectItem>
                            ))}
                          </SelectContent>
                        </Select>
                      </div>
                    </div>
                    <div className="space-y-2"><Label>Contraseña</Label><div className="relative"><Key className="absolute left-3 top-3 w-4 h-4 text-muted-foreground" /><Input type="password" value={newUser.password} onChange={e => setNewUser({...newUser, password: e.target.value})} className="pl-10" /></div></div>
                  </div>
                  <DialogFooter><Button onClick={() => handleAdd(usersRef, {...newUser, role: 'Alumno'}, setNewUser, {firstName: '', lastName: '', email: '', password: '', role: 'Alumno', carreraId: '', sedeId: '', matricula: '', grupoId: ''}, "Alumno")} className="w-full bg-primary font-bold">Inscribir</Button></DialogFooter>
                </DialogContent>
              </Dialog>
            </div>
          </div>
          <div className="bg-white border rounded-3xl overflow-hidden shadow-sm">
            <Table>
              <TableHeader className="bg-slate-50">
                <TableRow>
                  <TableHead className="px-6 font-bold py-4">Matrícula</TableHead>
                  <TableHead className="font-bold">Alumno</TableHead>
                  <TableHead className="font-bold">Biometría</TableHead>
                  <TableHead className="font-bold">Carrera / Grupo</TableHead>
                  <TableHead className="font-bold text-right pr-6">Acciones</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {alumnos?.map(a => {
                  const carrera = carreras?.find(c => c.id === a.carreraId);
                  const grupo = grupos?.find(g => g.id === a.grupoId);
                  const hasFace = !!a.faceDescriptor;
                  return (
                    <TableRow key={a.id}>
                      <TableCell className="px-6 font-mono text-xs font-bold">{a.matricula || '---'}</TableCell>
                      <TableCell className="font-medium">{a.firstName} {a.lastName}</TableCell>
                      <TableCell>
                        {hasFace ? (
                          <span className="flex items-center gap-1 text-green-600 text-xs font-bold">
                            <UserCheck className="w-3 h-3" /> Enrolado
                          </span>
                        ) : (
                          <Button 
                            variant="ghost" 
                            size="sm" 
                            className="h-7 text-[10px] font-bold text-primary hover:bg-primary/10 rounded-full"
                            onClick={() => { setFaceTargetUser(a); setOpenDialog('enrollFace'); }}
                          >
                            <ScanFace className="w-3 h-3 mr-1" /> Enrolar
                          </Button>
                        )}
                      </TableCell>
                      <TableCell>
                        <div className="flex flex-col">
                          <span className="text-xs font-bold text-primary">{carrera?.nombre || 'N/A'}</span>
                          <span className="text-[10px] text-muted-foreground font-medium">{grupo?.nombre ? `Grupo: ${grupo.nombre}` : 'Sin Grupo'}</span>
                        </div>
                      </TableCell>
                      <TableCell className="text-right pr-6">
                        <DropdownMenu>
                          <DropdownMenuTrigger asChild><Button variant="ghost" size="icon" className="h-8 w-8"><MoreVertical className="w-4 h-4" /></Button></DropdownMenuTrigger>
                          <DropdownMenuContent align="end" className="rounded-xl">
                            <DropdownMenuItem onClick={() => { setEditingUser(a); setOpenDialog('editUser'); }} className="gap-2 font-bold"><Edit2 className="w-4 h-4" /> Editar</DropdownMenuItem>
                            <DropdownMenuItem onClick={() => { setFaceTargetUser(a); setOpenDialog('enrollFace'); }} className="gap-2 font-bold"><Camera className="w-4 h-4" /> Recalibrar Rostro</DropdownMenuItem>
                            <DropdownMenuItem onClick={() => handleDelete('users', a.id)} className="gap-2 text-primary font-bold"><Trash2 className="w-4 h-4" /> Eliminar</DropdownMenuItem>
                          </DropdownMenuContent>
                        </DropdownMenu>
                      </TableCell>
                    </TableRow>
                  );
                })}
              </TableBody>
            </Table>
          </div>
        </TabsContent>

        {/* --- HORARIOS --- */}
        <TabsContent value="horarios" className="mt-6 space-y-4">
          <div className="flex justify-between items-center">
            <h2 className="text-xl font-bold">Horarios</h2>
            <Dialog open={openDialog === 'horario'} onOpenChange={(o) => setOpenDialog(o ? 'horario' : null)}>
              <DialogTrigger asChild>
                <Button className="bg-primary rounded-xl font-bold"><Plus className="w-4 h-4 mr-2" /> Nuevo Horario</Button>
              </DialogTrigger>
              <DialogContent className="rounded-3xl">
                <DialogHeader><DialogTitle>Asignar Horario</DialogTitle></DialogHeader>
                <div className="space-y-4 py-4">
                  <div className="space-y-2">
                    <Label>Grupo</Label>
                    <Select value={newHorario.grupoId} onValueChange={v => setNewHorario({...newHorario, grupoId: v})}>
                      <SelectTrigger className="rounded-xl"><SelectValue placeholder="Elegir Grupo" /></SelectTrigger>
                      <SelectContent>{grupos?.map(g => { const car = carreras?.find(c => c.id === g.carreraId); return <SelectItem key={g.id} value={g.id}>{g.nombre} - {car?.nombre} ({g.cuatrimestre}°)</SelectItem> })}</SelectContent>
                    </Select>
                  </div>
                  <div className="space-y-2">
                    <Label>Día</Label>
                    <Select value={newHorario.dia} onValueChange={v => setNewHorario({...newHorario, dia: v})}>
                      <SelectTrigger className="rounded-xl"><SelectValue placeholder="Elegir Día" /></SelectTrigger>
                      <SelectContent>{["Lunes", "Martes", "Miércoles", "Jueves", "Viernes", "Sábado"].map(d => <SelectItem key={d} value={d}>{d}</SelectItem>)}</SelectContent>
                    </Select>
                  </div>
                  <div className="grid grid-cols-2 gap-4">
                    <div className="space-y-2"><Label>Inicio</Label><Input type="time" value={newHorario.horaInicio} onChange={e => setNewHorario({...newHorario, horaInicio: e.target.value})} /></div>
                    <div className="space-y-2"><Label>Fin</Label><Input type="time" value={newHorario.horaFin} onChange={e => setNewHorario({...newHorario, horaFin: e.target.value})} /></div>
                  </div>
                  <div className="space-y-2"><Label>Aula</Label><Input value={newHorario.aula} onChange={e => setNewHorario({...newHorario, aula: e.target.value})} placeholder="Ej: Aula 302" /></div>
                </div>
                <DialogFooter><Button onClick={() => handleAdd(horariosRef, newHorario, setNewHorario, {grupoId: '', dia: '', horaInicio: '', horaFin: '', aula: ''}, "Horario")} className="w-full bg-primary font-bold">Guardar</Button></DialogFooter>
              </DialogContent>
            </Dialog>
          </div>
          <div className="bg-white border rounded-3xl overflow-hidden shadow-sm">
            <Table>
              <TableHeader className="bg-slate-50">
                <TableRow>
                  <TableHead className="px-6 font-bold py-4">Día</TableHead>
                  <TableHead className="font-bold">Horas</TableHead>
                  <TableHead className="font-bold">Grupo / Carrera</TableHead>
                  <TableHead className="font-bold text-right pr-6">Acciones</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {horarios?.map(h => {
                  const grupo = grupos?.find(g => g.id === h.grupoId);
                  const carrera = carreras?.find(c => c.id === grupo?.carreraId);
                  return (
                    <TableRow key={h.id}>
                      <TableCell className="px-6 font-bold">{h.dia}</TableCell>
                      <TableCell className="text-xs">{h.horaInicio} - {h.horaFin}</TableCell>
                      <TableCell>
                        <div className="flex flex-col">
                          <span className="font-bold text-sm">{grupo?.nombre} - {h.aula}</span>
                          <span className="text-[9px] uppercase text-muted-foreground">{carrera?.nombre} ({grupo?.cuatrimestre}° Cuatri)</span>
                        </div>
                      </TableCell>
                      <TableCell className="text-right pr-6">
                        <DropdownMenu>
                          <DropdownMenuTrigger asChild><Button variant="ghost" size="icon" className="h-8 w-8"><MoreVertical className="w-4 h-4" /></Button></DropdownMenuTrigger>
                          <DropdownMenuContent align="end" className="rounded-xl">
                            <DropdownMenuItem onClick={() => { setEditingHorario(h); setOpenDialog('editHorario'); }} className="gap-2 font-bold"><Edit2 className="w-4 h-4" /> Editar</DropdownMenuItem>
                            <DropdownMenuItem onClick={() => handleDelete('horarios', h.id)} className="gap-2 text-primary font-bold"><Trash2 className="w-4 h-4" /> Eliminar</DropdownMenuItem>
                          </DropdownMenuContent>
                        </DropdownMenu>
                      </TableCell>
                    </TableRow>
                  );
                })}
              </TableBody>
            </Table>
          </div>
        </TabsContent>
      </Tabs>
      
      <AlertDialog open={showBulkDeleteAlert} onOpenChange={setShowBulkDeleteAlert}>
        <AlertDialogContent className="rounded-3xl">
          <AlertDialogHeader>
            <AlertDialogTitle className="flex items-center gap-2 text-destructive"><AlertCircle className="w-5 h-5" /> ¿Eliminar Selección?</AlertDialogTitle>
            <AlertDialogDescription>Se eliminarán permanentemente {selectedMateriaIds.length} materias. Esta acción no se puede deshacer.</AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel className="rounded-xl">Cancelar</AlertDialogCancel>
            <AlertDialogAction onClick={handleBulkDelete} className="bg-destructive text-white rounded-xl hover:bg-destructive/90">Eliminar Ahora</AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>

      {/* DIÁLOGO ENROLAMIENTO FACIAL */}
      <Dialog open={openDialog === 'enrollFace'} onOpenChange={(o) => { setOpenDialog(o ? 'enrollFace' : null); if(!o) setFaceTargetUser(null); }}>
        <DialogContent className="max-w-2xl rounded-3xl overflow-hidden p-0">
          <DialogHeader className="p-6 pb-0">
            <DialogTitle>Enrolamiento Biométrico</DialogTitle>
            <DialogDescription>Posiciona el rostro de {faceTargetUser?.firstName} frente a la cámara.</DialogDescription>
          </DialogHeader>
          <div className="p-6">
             <FacialRecognitionComponent 
               mode="enroll" 
               onCapture={handleSaveFaceDescriptor} 
             />
          </div>
        </DialogContent>
      </Dialog>

      {/* DIÁLOGO VERIFICACIÓN FACIAL */}
      <Dialog open={openDialog === 'verifyFace'} onOpenChange={(o) => setOpenDialog(o ? 'verifyFace' : null)}>
        <DialogContent className="max-w-2xl rounded-3xl overflow-hidden p-0">
          <DialogHeader className="p-6 pb-0">
            <DialogTitle>Reconocimiento en Tiempo Real</DialogTitle>
            <DialogDescription>El sistema identificará a los alumnos enrolados automáticamente.</DialogDescription>
          </DialogHeader>
          <div className="p-6">
             <FacialRecognitionComponent 
               mode="recognize" 
               labeledDescriptors={alumnos
                 .filter(a => a.faceDescriptor)
                 .map(a => {
                   const carrera = carreras?.find(c => c.id === a.carreraId)?.nombre || 'S/C';
                   const grupo = grupos?.find(g => g.id === a.grupoId)?.nombre || 'S/G';
                   return {
                     label: `${a.firstName} ${a.lastName} (${a.matricula || 'N/A'}) | ${carrera} - ${grupo}`,
                     descriptor: a.faceDescriptor
                   };
                 })}
             />
          </div>
        </DialogContent>
      </Dialog>

      {/* DIÁLOGO EDICIÓN USUARIO (DOCENTE/ALUMNO) */}
      <Dialog open={openDialog === 'editUser'} onOpenChange={(o) => setOpenDialog(o ? 'editUser' : null)}>
        <DialogContent className="rounded-3xl">
          <DialogHeader><DialogTitle>Editar Perfil</DialogTitle></DialogHeader>
          {editingUser && (
            <div className="space-y-4 py-4 max-h-[70vh] overflow-y-auto px-1">
              <div className="grid grid-cols-2 gap-4">
                <div className="space-y-2"><Label>Nombre(s)</Label><Input value={editingUser.firstName} onChange={e => setEditingUser({...editingUser, firstName: e.target.value})} /></div>
                <div className="space-y-2"><Label>Apellido(s)</Label><Input value={editingUser.lastName} onChange={e => setEditingUser({...editingUser, lastName: e.target.value})} /></div>
              </div>
              <div className="space-y-2"><Label>Email</Label><Input value={editingUser.email} onChange={e => setEditingUser({...editingUser, email: e.target.value})} /></div>
              {editingUser.role === 'Alumno' && (
                <>
                  <div className="space-y-2"><Label>Matrícula</Label><Input value={editingUser.matricula} onChange={e => setEditingUser({...editingUser, matricula: e.target.value})} /></div>
                  <div className="grid grid-cols-2 gap-4">
                    <div className="space-y-2">
                      <Label>Carrera</Label>
                      <Select value={editingUser.carreraId} onValueChange={v => setEditingUser({...editingUser, carreraId: v, grupoId: ''})}>
                        <SelectTrigger className="rounded-xl"><SelectValue placeholder="Carrera" /></SelectTrigger>
                        <SelectContent>{carreras?.map(c => <SelectItem key={c.id} value={c.id}>{c.nombre}</SelectItem>)}</SelectContent>
                      </Select>
                    </div>
                    <div className="space-y-2">
                      <Label>Grupo</Label>
                      <Select 
                        disabled={!editingUser.carreraId} 
                        value={editingUser.grupoId} 
                        onValueChange={v => setEditingUser({...editingUser, grupoId: v})}
                      >
                        <SelectTrigger className="rounded-xl"><SelectValue placeholder="Grupo" /></SelectTrigger>
                        <SelectContent>
                          {grupos?.filter(g => g.carreraId === editingUser.carreraId).map(g => (
                            <SelectItem key={g.id} value={g.id}>{g.nombre} ({g.cuatrimestre}°)</SelectItem>
                          ))}
                        </SelectContent>
                      </Select>
                    </div>
                  </div>
                </>
              )}
            </div>
          )}
          <DialogFooter><Button onClick={() => handleUpdate('users', editingUser.id, editingUser, "Usuario")} className="w-full bg-primary font-bold">Actualizar</Button></DialogFooter>
        </DialogContent>
      </Dialog>

      {/* DIÁLOGO EDICIÓN GRUPO */}
      <Dialog open={openDialog === 'editGrupo'} onOpenChange={(o) => setOpenDialog(o ? 'editGrupo' : null)}>
        <DialogContent className="rounded-3xl">
          <DialogHeader><DialogTitle>Editar Grupo</DialogTitle></DialogHeader>
          {editingGrupo && (
            <div className="space-y-4 py-4">
              <div className="space-y-2">
                <Label>Carrera</Label>
                <Select value={editingGrupo.carreraId} onValueChange={v => setEditingGrupo({...editingGrupo, carreraId: v})}>
                  <SelectTrigger className="rounded-xl"><SelectValue placeholder="Elegir Carrera" /></SelectTrigger>
                  <SelectContent>{carreras?.map(c => <SelectItem key={c.id} value={c.id}>{c.nombre}</SelectItem>)}</SelectContent>
                </Select>
              </div>
              <div className="space-y-2">
                <Label>Cuatrimestre</Label>
                <Select value={editingGrupo.cuatrimestre} onValueChange={v => setEditingGrupo({...editingGrupo, cuatrimestre: v})}>
                  <SelectTrigger className="rounded-xl"><SelectValue placeholder="Elegir Cuatrimestre" /></SelectTrigger>
                  <SelectContent>{[1,2,3,4,5,6,7,8,9,10,11,12].map(n => <SelectItem key={n} value={String(n)}>{n}° Cuatrimestre</SelectItem>)}</SelectContent>
                </Select>
              </div>
              <div className="space-y-2">
                <Label>Docente Asignado</Label>
                <Select value={editingGrupo.docenteId || "null"} onValueChange={v => setEditingGrupo({...editingGrupo, docenteId: v === "null" ? "" : v})}>
                  <SelectTrigger className="rounded-xl"><SelectValue placeholder="Sin Docente" /></SelectTrigger>
                  <SelectContent>
                    <SelectItem value="null">Ninguno</SelectItem>
                    {docentes.map(d => <SelectItem key={d.id} value={d.id}>{d.firstName} {d.lastName}</SelectItem>)}
                  </SelectContent>
                </Select>
              </div>
              <div className="space-y-2"><Label>Nombre del Grupo</Label><Input value={editingGrupo.nombre} onChange={e => setEditingGrupo({...editingGrupo, nombre: e.target.value})} /></div>
            </div>
          )}
          <DialogFooter><Button onClick={() => handleUpdate('grupos', editingGrupo.id, editingGrupo, "Grupo")} className="w-full bg-primary font-bold">Actualizar</Button></DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
}
