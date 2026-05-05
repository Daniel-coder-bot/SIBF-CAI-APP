
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
  MoreVertical
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

  const { data: sedes } = useCollection(sedesRef);
  const { data: carreras } = useCollection(carrerasRef);
  const { data: materias } = useCollection(materiasRef);
  const { data: grupos } = useCollection(gruposRef);
  const { data: horarios } = useCollection(horariosRef);

  // Estados para diálogos
  const [openDialog, setOpenDialog] = useState<string | null>(null);
  const [copiedId, setCopiedId] = useState<string | null>(null);

  // Estados para nuevos registros
  const [newSede, setNewSede] = useState({ nombre: '', ubicacion: '' });
  const [newCarrera, setNewCarrera] = useState({ nombre: '', sedeId: '' });
  const [newMateria, setNewMateria] = useState({ nombre: '', codigo: '', carreraId: '', cuatrimestre: '' });
  const [newGrupo, setNewGrupo] = useState({ nombre: '', carreraId: '', materiaId: '' });
  const [newHorario, setNewHorario] = useState({ grupoId: '', dia: '', horaInicio: '', horaFin: '', aula: '' });

  // Estados para edición
  const [editingSede, setEditingSede] = useState<any>(null);
  const [editingCarrera, setEditingCarrera] = useState<any>(null);
  const [editingMateria, setEditingMateria] = useState<any>(null);
  const [editingGrupo, setEditingGrupo] = useState<any>(null);
  const [editingHorario, setEditingHorario] = useState<any>(null);

  // Estados para mantenimiento
  const [targetMaintenanceCarreraId, setTargetMaintenanceCarreraId] = useState('');

  // Estados para filtros de Materias
  const [materiaSearch, setMateriaSearch] = useState('');
  const [materiaCarreraFilter, setMateriaCarreraFilter] = useState('all');
  const [materiaCuatriFilter, setMateriaCuatriFilter] = useState('all');

  // Filtrado de materias para grupos (formulario)
  const materiasFiltradasParaGrupo = useMemo(() => {
    const targetCarreraId = editingGrupo ? editingGrupo.carreraId : newGrupo.carreraId;
    if (!targetCarreraId || !materias) return [];
    return materias.filter(m => m.carreraId === targetCarreraId);
  }, [newGrupo.carreraId, editingGrupo, materias]);

  // Identificar materias huérfanas
  const materiasHuerfanas = useMemo(() => {
    if (!materias) return [];
    return materias.filter(m => !m.carreraId || m.carreraId === "" || m.carreraId === "null");
  }, [materias]);

  // Filtrado de materias para la tabla (visualización)
  const materiasFiltradasTabla = useMemo(() => {
    if (!materias) return [];
    return materias.filter(m => {
      const matchSearch = m.nombre.toLowerCase().includes(materiaSearch.toLowerCase()) || 
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
    toast({ title: `${title} guardado`, description: "Los datos se están sincronizando." });
  };

  const handleUpdate = (collectionName: string, id: string, data: any, title: string) => {
    const docRef = doc(db, collectionName, id);
    updateDocumentNonBlocking(docRef, { ...data, updatedAt: serverTimestamp() });
    setOpenDialog(null);
    toast({ title: `${title} actualizado`, description: "Cambios guardados correctamente." });
  };

  const handleDelete = (collectionName: string, id: string) => {
    const docRef = doc(db, collectionName, id);
    deleteDocumentNonBlocking(docRef);
    toast({ variant: "destructive", title: "Eliminado correctamente" });
  };

  const handleBulkAssignCareer = () => {
    if (!targetMaintenanceCarreraId || materiasHuerfanas.length === 0) return;

    materiasHuerfanas.forEach(m => {
      const docRef = doc(db, 'materias', m.id);
      updateDocumentNonBlocking(docRef, { 
        carreraId: targetMaintenanceCarreraId,
        updatedAt: serverTimestamp()
      });
    });

    toast({ 
      title: "Vincualción Masiva", 
      description: `${materiasHuerfanas.length} materias asignadas correctamente.` 
    });
    setOpenDialog(null);
  };

  const copyToClipboard = (text: string) => {
    navigator.clipboard.writeText(text);
    setCopiedId(text);
    setTimeout(() => setCopiedId(null), 2000);
    toast({ title: "ID Copiado", description: "Puedes pegarlo en tu archivo Excel." });
  };

  const handleDownloadTemplate = () => {
    const data = [
      { 
        nombre: 'Matemáticas I', 
        cuatrimestre: '1', 
        carreraId: 'Copia el ID desde la pestaña Carreras' 
      }
    ];
    const worksheet = XLSX.utils.json_to_sheet(data);
    const workbook = XLSX.utils.book_new();
    XLSX.utils.book_append_sheet(workbook, worksheet, "Plantilla Materias");
    XLSX.writeFile(workbook, "Plantilla_Materias_UniAttend.xlsx");
    toast({ title: "Plantilla descargada", description: "Usa los IDs de las carreras para la vinculación." });
  };

  const handleImportMateriasExcel = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file || !materiasRef || !carreras) return;

    const reader = new FileReader();
    reader.onload = (evt) => {
      try {
        const bstr = evt.target?.result;
        const workbook = XLSX.read(bstr, { type: 'binary' });
        const wsname = workbook.SheetNames[0];
        const ws = workbook.Sheets[wsname];
        const data = XLSX.utils.sheet_to_json(ws) as any[];

        let importCount = 0;
        data.forEach((row) => {
          let targetCarreraId = row.carreraId || '';
          
          if (!targetCarreraId || targetCarreraId.length < 5) {
            const carreraNombre = row.carrera || row.carreraNombre || row.nombre_carrera;
            if (carreraNombre) {
              const matched = carreras.find(c => c.nombre.toLowerCase().trim() === String(carreraNombre).toLowerCase().trim());
              if (matched) targetCarreraId = matched.id;
            }
          }

          if (row.nombre && row.cuatrimestre) {
            const namePrefix = String(row.nombre).substring(0, 3).toUpperCase();
            const randomSuffix = Math.floor(100 + Math.random() * 900);
            const autoCodigo = row.codigo || `MAT-${namePrefix}-${row.cuatrimestre}-${randomSuffix}`;

            addDocumentNonBlocking(materiasRef, {
              nombre: String(row.nombre),
              codigo: String(autoCodigo),
              carreraId: String(targetCarreraId),
              cuatrimestre: String(row.cuatrimestre),
              createdAt: serverTimestamp()
            });
            importCount++;
          }
        });

        toast({ title: "Importación completa", description: `${importCount} materias procesadas.` });
        if (materiaFileInputRef.current) materiaFileInputRef.current.value = '';
      } catch (error) {
        toast({ variant: "destructive", title: "Error Excel", description: "Verifica el formato del archivo." });
      }
    };
    reader.readAsBinaryString(file);
  };

  const resetMateriaFilters = () => {
    setMateriaSearch('');
    setMateriaCarreraFilter('all');
    setMateriaCuatriFilter('all');
  };

  return (
    <div className="space-y-6 animate-in fade-in duration-500">
      <div className="flex justify-between items-end pb-4 border-b">
        <div>
          <h1 className="text-3xl font-black tracking-tighter text-foreground uppercase">Catálogos Institucionales</h1>
          <p className="text-muted-foreground font-medium text-sm">Gestión de la estructura académica y operativa.</p>
        </div>
      </div>

      <Tabs defaultValue="sedes" className="w-full">
        <TabsList className="bg-slate-100/80 p-1 rounded-2xl h-14 w-full justify-start overflow-x-auto gap-2 border">
          <TabsTrigger value="sedes" className="rounded-xl data-[state=active]:bg-white data-[state=active]:text-primary data-[state=active]:shadow-sm px-6 font-bold flex gap-2">
            <Building2 className="w-4 h-4" /> Sedes
          </TabsTrigger>
          <TabsTrigger value="carreras" className="rounded-xl data-[state=active]:bg-white data-[state=active]:text-primary data-[state=active]:shadow-sm px-6 font-bold flex gap-2">
            <BookOpen className="w-4 h-4" /> Carreras
          </TabsTrigger>
          <TabsTrigger value="materias" className="rounded-xl data-[state=active]:bg-white data-[state=active]:text-primary data-[state=active]:shadow-sm px-6 font-bold flex gap-2">
            <FolderTree className="w-4 h-4" /> Materias
          </TabsTrigger>
          <TabsTrigger value="grupos" className="rounded-xl data-[state=active]:bg-white data-[state=active]:text-primary data-[state=active]:shadow-sm px-6 font-bold flex gap-2">
            <Users className="w-4 h-4" /> Grupos
          </TabsTrigger>
          <TabsTrigger value="horarios" className="rounded-xl data-[state=active]:bg-white data-[state=active]:text-primary data-[state=active]:shadow-sm px-6 font-bold flex gap-2">
            <Clock className="w-4 h-4" /> Horarios
          </TabsTrigger>
        </TabsList>

        {/* --- SEDES --- */}
        <TabsContent value="sedes" className="mt-6 space-y-4">
          <div className="flex justify-between items-center">
            <h2 className="text-xl font-bold">Sedes de la Institución</h2>
            <Dialog open={openDialog === 'sede'} onOpenChange={(o) => setOpenDialog(o ? 'sede' : null)}>
              <DialogTrigger asChild>
                <Button className="bg-primary rounded-xl font-bold shadow-lg shadow-primary/20"><Plus className="w-4 h-4 mr-2" /> Nueva Sede</Button>
              </DialogTrigger>
              <DialogContent className="rounded-3xl">
                <DialogHeader><DialogTitle>Agregar Nueva Sede</DialogTitle><DialogDescription>Ubicaciones físicas del campus.</DialogDescription></DialogHeader>
                <div className="space-y-4 py-4">
                  <div className="space-y-2"><Label>Nombre</Label><Input value={newSede.nombre} onChange={e => setNewSede({...newSede, nombre: e.target.value})} placeholder="Ej: Campus Central" /></div>
                  <div className="space-y-2"><Label>Ubicación</Label><Input value={newSede.ubicacion} onChange={e => setNewSede({...newSede, ubicacion: e.target.value})} placeholder="Dirección..." /></div>
                </div>
                <DialogFooter><Button onClick={() => handleAdd(sedesRef, newSede, setNewSede, {nombre: '', ubicacion: ''}, "Sede")} className="w-full bg-primary font-bold">Guardar</Button></DialogFooter>
              </DialogContent>
            </Dialog>
          </div>
          <div className="bg-white border rounded-3xl overflow-hidden shadow-sm">
            <Table>
              <TableHeader className="bg-slate-50">
                <TableRow>
                  <TableHead className="font-bold py-4 px-6">ID</TableHead>
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
                        <DropdownMenuTrigger asChild>
                          <Button variant="ghost" size="icon" className="h-8 w-8 rounded-full">
                            <MoreVertical className="w-4 h-4" />
                          </Button>
                        </DropdownMenuTrigger>
                        <DropdownMenuContent align="end" className="rounded-xl">
                          <DropdownMenuItem onClick={() => { setEditingSede(s); setOpenDialog('editSede'); }} className="gap-2 cursor-pointer font-bold">
                            <Edit2 className="w-4 h-4" /> Editar
                          </DropdownMenuItem>
                          <DropdownMenuItem onClick={() => handleDelete('sedes', s.id)} className="gap-2 cursor-pointer text-primary font-bold">
                            <Trash2 className="w-4 h-4" /> Eliminar
                          </DropdownMenuItem>
                        </DropdownMenuContent>
                      </DropdownMenu>
                    </TableCell>
                  </TableRow>
                ))}
              </TableBody>
            </Table>
          </div>
          {/* Edit Sede Dialog */}
          <Dialog open={openDialog === 'editSede'} onOpenChange={(o) => setOpenDialog(o ? 'editSede' : null)}>
            <DialogContent className="rounded-3xl">
              <DialogHeader><DialogTitle>Editar Sede</DialogTitle></DialogHeader>
              {editingSede && (
                <div className="space-y-4 py-4">
                  <div className="space-y-2"><Label>Nombre</Label><Input value={editingSede.nombre} onChange={e => setEditingSede({...editingSede, nombre: e.target.value})} /></div>
                  <div className="space-y-2"><Label>Ubicación</Label><Input value={editingSede.ubicacion} onChange={e => setEditingSede({...editingSede, ubicacion: e.target.value})} /></div>
                </div>
              )}
              <DialogFooter><Button onClick={() => handleUpdate('sedes', editingSede.id, {nombre: editingSede.nombre, ubicacion: editingSede.ubicacion}, "Sede")} className="w-full bg-primary font-bold">Actualizar</Button></DialogFooter>
            </DialogContent>
          </Dialog>
        </TabsContent>

        {/* --- CARRERAS --- */}
        <TabsContent value="carreras" className="mt-6 space-y-4">
          <div className="flex justify-between items-center">
            <h2 className="text-xl font-bold">Oferta Académica</h2>
            <Dialog open={openDialog === 'carrera'} onOpenChange={(o) => setOpenDialog(o ? 'carrera' : null)}>
              <DialogTrigger asChild>
                <Button className="bg-primary rounded-xl font-bold shadow-lg shadow-primary/20"><Plus className="w-4 h-4 mr-2" /> Nueva Carrera</Button>
              </DialogTrigger>
              <DialogContent className="rounded-3xl">
                <DialogHeader><DialogTitle>Registrar Carrera</DialogTitle></DialogHeader>
                <div className="space-y-4 py-4">
                  <div className="space-y-2"><Label>Nombre de la Carrera</Label><Input value={newCarrera.nombre} onChange={e => setNewCarrera({...newCarrera, nombre: e.target.value})} /></div>
                  <div className="space-y-2">
                    <Label>Sede</Label>
                    <Select value={newCarrera.sedeId} onValueChange={v => setNewCarrera({...newCarrera, sedeId: v})}>
                      <SelectTrigger className="rounded-xl"><SelectValue placeholder="Seleccionar Sede" /></SelectTrigger>
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
                  <TableHead className="px-6 font-bold py-4">Carrera</TableHead>
                  <TableHead className="font-bold">ID para Excel</TableHead>
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
                        <code className="bg-slate-100 px-2 py-1 rounded text-[10px] font-mono select-all">{c.id}</code>
                        <Button variant="ghost" size="icon" className="h-6 w-6" onClick={() => copyToClipboard(c.id)}>
                          {copiedId === c.id ? <Check className="w-3 h-3 text-green-600" /> : <Copy className="w-3 h-3" />}
                        </Button>
                      </div>
                    </TableCell>
                    <TableCell>{sedes?.find(s => s.id === c.sedeId)?.nombre || 'Sede N/A'}</TableCell>
                    <TableCell className="text-right pr-6">
                      <DropdownMenu>
                        <DropdownMenuTrigger asChild>
                          <Button variant="ghost" size="icon" className="h-8 w-8 rounded-full">
                            <MoreVertical className="w-4 h-4" />
                          </Button>
                        </DropdownMenuTrigger>
                        <DropdownMenuContent align="end" className="rounded-xl">
                          <DropdownMenuItem onClick={() => { setEditingCarrera(c); setOpenDialog('editCarrera'); }} className="gap-2 cursor-pointer font-bold">
                            <Edit2 className="w-4 h-4" /> Editar
                          </DropdownMenuItem>
                          <DropdownMenuItem onClick={() => handleDelete('carreras', c.id)} className="gap-2 cursor-pointer text-primary font-bold">
                            <Trash2 className="w-4 h-4" /> Eliminar
                          </DropdownMenuItem>
                        </DropdownMenuContent>
                      </DropdownMenu>
                    </TableCell>
                  </TableRow>
                ))}
              </TableBody>
            </Table>
          </div>
          {/* Edit Carrera Dialog */}
          <Dialog open={openDialog === 'editCarrera'} onOpenChange={(o) => setOpenDialog(o ? 'editCarrera' : null)}>
            <DialogContent className="rounded-3xl">
              <DialogHeader><DialogTitle>Editar Carrera</DialogTitle></DialogHeader>
              {editingCarrera && (
                <div className="space-y-4 py-4">
                  <div className="space-y-2"><Label>Nombre</Label><Input value={editingCarrera.nombre} onChange={e => setEditingCarrera({...editingCarrera, nombre: e.target.value})} /></div>
                  <div className="space-y-2">
                    <Label>Sede</Label>
                    <Select value={editingCarrera.sedeId} onValueChange={v => setEditingCarrera({...editingCarrera, sedeId: v})}>
                      <SelectTrigger className="rounded-xl"><SelectValue placeholder="Seleccionar Sede" /></SelectTrigger>
                      <SelectContent>{sedes?.map(s => <SelectItem key={s.id} value={s.id}>{s.nombre}</SelectItem>)}</SelectContent>
                    </Select>
                  </div>
                </div>
              )}
              <DialogFooter><Button onClick={() => handleUpdate('carreras', editingCarrera.id, {nombre: editingCarrera.nombre, sedeId: editingCarrera.sedeId}, "Carrera")} className="w-full bg-primary font-bold">Actualizar</Button></DialogFooter>
            </DialogContent>
          </Dialog>
        </TabsContent>

        {/* --- MATERIAS --- */}
        <TabsContent value="materias" className="mt-6 space-y-4">
          <div className="flex justify-between items-center">
            <div className="flex items-center gap-4">
              <h2 className="text-xl font-bold">Malla Curricular</h2>
              {materiasHuerfanas.length > 0 && (
                <Dialog open={openDialog === 'maintenance'} onOpenChange={(o) => setOpenDialog(o ? 'maintenance' : null)}>
                  <DialogTrigger asChild>
                    <Button variant="outline" className="h-8 rounded-full border-primary text-primary bg-primary/5 px-4 font-bold animate-pulse text-xs">
                      <Wrench className="w-3 h-3 mr-2" /> {materiasHuerfanas.length} Sin Carrera
                    </Button>
                  </DialogTrigger>
                  <DialogContent className="rounded-3xl">
                    <DialogHeader>
                      <DialogTitle className="flex items-center gap-2 text-primary"><AlertTriangle className="w-5 h-5" /> Herramienta de Vinculación</DialogTitle>
                      <DialogDescription>Se han detectado {materiasHuerfanas.length} materias sin carrera asignada. Seleccióna a qué carrera pertenecen.</DialogDescription>
                    </DialogHeader>
                    <div className="py-6 space-y-4">
                      <div className="space-y-2">
                        <Label>Asignar a la Carrera:</Label>
                        <Select value={targetMaintenanceCarreraId} onValueChange={setTargetMaintenanceCarreraId}>
                          <SelectTrigger className="rounded-xl"><SelectValue placeholder="Seleccionar Carrera Destino" /></SelectTrigger>
                          <SelectContent>{carreras?.map(c => <SelectItem key={c.id} value={c.id}>{c.nombre}</SelectItem>)}</SelectContent>
                        </Select>
                      </div>
                    </div>
                    <DialogFooter><Button onClick={handleBulkAssignCareer} disabled={!targetMaintenanceCarreraId} className="w-full bg-primary font-bold">Vincular Todas Ahora</Button></DialogFooter>
                  </DialogContent>
                </Dialog>
              )}
            </div>
            <div className="flex gap-2">
              <input type="file" ref={materiaFileInputRef} onChange={handleImportMateriasExcel} accept=".xlsx, .xls" className="hidden" />
              <Button variant="outline" className="rounded-xl border-slate-300" onClick={handleDownloadTemplate}><Download className="w-4 h-4 mr-2" /> Plantilla</Button>
              <Button variant="outline" className="rounded-xl border-slate-300" onClick={() => materiaFileInputRef.current?.click()}><Upload className="w-4 h-4 mr-2" /> Importar</Button>
              <Dialog open={openDialog === 'materia'} onOpenChange={(o) => setOpenDialog(o ? 'materia' : null)}>
                <DialogTrigger asChild>
                  <Button className="bg-primary rounded-xl font-bold shadow-lg shadow-primary/20"><Plus className="w-4 h-4 mr-2" /> Nueva Materia</Button>
                </DialogTrigger>
                <DialogContent className="rounded-3xl">
                  <DialogHeader><DialogTitle>Nueva Materia</DialogTitle></DialogHeader>
                  <div className="space-y-4 py-4">
                    <div className="space-y-2"><Label>Nombre</Label><Input value={newMateria.nombre} onChange={e => setNewMateria({...newMateria, nombre: e.target.value})} /></div>
                    <div className="grid grid-cols-2 gap-4">
                      <div className="space-y-2"><Label>Código (Opcional)</Label><Input value={newMateria.codigo} onChange={e => setNewMateria({...newMateria, codigo: e.target.value})} placeholder="Auto-generado si vacío" /></div>
                      <div className="space-y-2"><Label>Cuatrimestre</Label><Input value={newMateria.cuatrimestre} onChange={e => setNewMateria({...newMateria, cuatrimestre: e.target.value})} placeholder="1" /></div>
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

          <div className="bg-slate-50 p-4 rounded-3xl border border-slate-100 flex flex-wrap gap-4 items-end shadow-inner">
            <div className="flex-1 min-w-[200px] space-y-1.5">
              <Label className="text-[10px] font-black uppercase text-muted-foreground ml-2">Buscar</Label>
              <div className="relative">
                <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground" />
                <Input value={materiaSearch} onChange={e => setMateriaSearch(e.target.value)} placeholder="Nombre o código..." className="pl-10 rounded-xl bg-white h-10 border-slate-200" />
              </div>
            </div>
            <div className="w-full sm:w-64 space-y-1.5">
              <Label className="text-[10px] font-black uppercase text-muted-foreground ml-2">Carrera</Label>
              <Select value={materiaCarreraFilter} onValueChange={setMateriaCarreraFilter}>
                <SelectTrigger className="rounded-xl bg-white h-10 border-slate-200"><SelectValue placeholder="Todas las carreras" /></SelectTrigger>
                <SelectContent>
                  <SelectItem value="all">Todas las carreras</SelectItem>
                  <SelectItem value="orphans" className="text-primary font-bold">Sin Carrera Asignada</SelectItem>
                  {carreras?.map(c => <SelectItem key={c.id} value={c.id}>{c.nombre}</SelectItem>)}
                </SelectContent>
              </Select>
            </div>
            <div className="w-32 space-y-1.5">
              <Label className="text-[10px] font-black uppercase text-muted-foreground ml-2">Cuatrimestre</Label>
              <Select value={materiaCuatriFilter} onValueChange={setMateriaCuatriFilter}>
                <SelectTrigger className="rounded-xl bg-white h-10 border-slate-200"><SelectValue placeholder="Todos" /></SelectTrigger>
                <SelectContent>
                  <SelectItem value="all">Todos</SelectItem>
                  {Array.from({length: 12}, (_, i) => String(i + 1)).map(n => <SelectItem key={n} value={n}>{n}°</SelectItem>)}
                </SelectContent>
              </Select>
            </div>
            <Button variant="ghost" size="icon" className="rounded-xl h-10 w-10 text-muted-foreground hover:text-primary hover:bg-white border border-transparent hover:border-slate-100" onClick={resetMateriaFilters} title="Limpiar filtros">
              <XCircle className="w-5 h-5" />
            </Button>
          </div>

          <div className="bg-white border rounded-3xl overflow-hidden shadow-sm">
            <Table>
              <TableHeader className="bg-slate-50">
                <TableRow>
                  <TableHead className="px-6 font-bold py-4">Código</TableHead>
                  <TableHead className="font-bold">Nombre</TableHead>
                  <TableHead className="font-bold">Carrera</TableHead>
                  <TableHead className="font-bold">Cuatri.</TableHead>
                  <TableHead className="font-bold text-right pr-6">Acciones</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {materiasFiltradasTabla.length === 0 ? (
                  <TableRow><TableCell colSpan={5} className="h-32 text-center text-muted-foreground">No se encontraron materias.</TableCell></TableRow>
                ) : (
                  materiasFiltradasTabla.map(m => {
                    const carrera = carreras?.find(c => c.id === m.carreraId);
                    return (
                      <TableRow key={m.id} className="hover:bg-slate-50/50 transition-colors">
                        <TableCell className="px-6 font-black text-primary text-xs">{m.codigo}</TableCell>
                        <TableCell className="font-medium">{m.nombre}</TableCell>
                        <TableCell className={cn("text-xs", !carrera ? "text-red-500 font-bold italic" : "text-muted-foreground")}>{carrera?.nombre || '⚠️ Sin Asignar'}</TableCell>
                        <TableCell className="font-bold">{m.cuatrimestre}</TableCell>
                        <TableCell className="text-right pr-6">
                          <DropdownMenu>
                            <DropdownMenuTrigger asChild>
                              <Button variant="ghost" size="icon" className="h-8 w-8 rounded-full">
                                <MoreVertical className="w-4 h-4" />
                              </Button>
                            </DropdownMenuTrigger>
                            <DropdownMenuContent align="end" className="rounded-xl">
                              <DropdownMenuItem onClick={() => { setEditingMateria(m); setOpenDialog('editMateria'); }} className="gap-2 cursor-pointer font-bold">
                                <Edit2 className="w-4 h-4" /> Editar
                              </DropdownMenuItem>
                              <DropdownMenuItem onClick={() => handleDelete('materias', m.id)} className="gap-2 cursor-pointer text-primary font-bold">
                                <Trash2 className="w-4 h-4" /> Eliminar
                              </DropdownMenuItem>
                            </DropdownMenuContent>
                          </DropdownMenu>
                        </TableCell>
                      </TableRow>
                    );
                  })
                )}
              </TableBody>
            </Table>
          </div>

          {/* Edit Materia Dialog */}
          <Dialog open={openDialog === 'editMateria'} onOpenChange={(o) => setOpenDialog(o ? 'editMateria' : null)}>
            <DialogContent className="rounded-3xl">
              <DialogHeader><DialogTitle>Editar Materia</DialogTitle></DialogHeader>
              {editingMateria && (
                <div className="space-y-4 py-4">
                  <div className="space-y-2"><Label>Nombre</Label><Input value={editingMateria.nombre} onChange={e => setEditingMateria({...editingMateria, nombre: e.target.value})} /></div>
                  <div className="grid grid-cols-2 gap-4">
                    <div className="space-y-2"><Label>Código</Label><Input value={editingMateria.codigo} onChange={e => setEditingMateria({...editingMateria, codigo: e.target.value})} /></div>
                    <div className="space-y-2"><Label>Cuatrimestre</Label><Input value={editingMateria.cuatrimestre} onChange={e => setEditingMateria({...editingMateria, cuatrimestre: e.target.value})} /></div>
                  </div>
                  <div className="space-y-2">
                    <Label>Carrera</Label>
                    <Select value={editingMateria.carreraId} onValueChange={v => setEditingMateria({...editingMateria, carreraId: v})}>
                      <SelectTrigger className="rounded-xl"><SelectValue placeholder="Seleccionar Carrera" /></SelectTrigger>
                      <SelectContent>{carreras?.map(c => <SelectItem key={c.id} value={c.id}>{c.nombre}</SelectItem>)}</SelectContent>
                    </Select>
                  </div>
                </div>
              )}
              <DialogFooter><Button onClick={() => handleUpdate('materias', editingMateria.id, {nombre: editingMateria.nombre, codigo: editingMateria.codigo, carreraId: editingMateria.carreraId, cuatrimestre: editingMateria.cuatrimestre}, "Materia")} className="w-full bg-primary font-bold">Actualizar</Button></DialogFooter>
            </DialogContent>
          </Dialog>
        </TabsContent>

        {/* --- GRUPOS --- */}
        <TabsContent value="grupos" className="mt-6 space-y-4">
          <div className="flex justify-between items-center">
            <h2 className="text-xl font-bold">Gestión de Grupos y Secciones</h2>
            <Dialog open={openDialog === 'grupo'} onOpenChange={(o) => setOpenDialog(o ? 'grupo' : null)}>
              <DialogTrigger asChild>
                <Button className="bg-primary rounded-xl font-bold shadow-lg shadow-primary/20"><Plus className="w-4 h-4 mr-2" /> Nuevo Grupo</Button>
              </DialogTrigger>
              <DialogContent className="rounded-3xl">
                <DialogHeader><DialogTitle>Crear Nuevo Grupo</DialogTitle></DialogHeader>
                <div className="space-y-4 py-4">
                  <div className="space-y-2">
                    <Label>Carrera</Label>
                    <Select value={newGrupo.carreraId} onValueChange={v => setNewGrupo({...newGrupo, carreraId: v, materiaId: ''})}>
                      <SelectTrigger className="rounded-xl"><SelectValue placeholder="Elegir Carrera" /></SelectTrigger>
                      <SelectContent>{carreras?.map(c => <SelectItem key={c.id} value={c.id}>{c.nombre}</SelectItem>)}</SelectContent>
                    </Select>
                  </div>
                  <div className="space-y-2">
                    <Label>Materia</Label>
                    <Select disabled={!newGrupo.carreraId} value={newGrupo.materiaId} onValueChange={v => setNewGrupo({...newGrupo, materiaId: v})}>
                      <SelectTrigger className="rounded-xl"><SelectValue placeholder="Elegir Materia" /></SelectTrigger>
                      <SelectContent>{materiasFiltradasParaGrupo.map(m => <SelectItem key={m.id} value={m.id}>{m.nombre} ({m.codigo})</SelectItem>)}</SelectContent>
                    </Select>
                  </div>
                  <div className="space-y-2"><Label>Identificador del Grupo</Label><Input value={newGrupo.nombre} onChange={e => setNewGrupo({...newGrupo, nombre: e.target.value})} placeholder="Ej: G1, Sección A" /></div>
                </div>
                <DialogFooter><Button onClick={() => handleAdd(gruposRef, {nombre: newGrupo.nombre, materiaId: newGrupo.materiaId}, setNewGrupo, {nombre: '', carreraId: '', materiaId: ''}, "Grupo")} className="w-full bg-primary font-bold">Guardar</Button></DialogFooter>
              </DialogContent>
            </Dialog>
          </div>
          <div className="bg-white border rounded-3xl overflow-hidden shadow-sm">
            <Table>
              <TableHeader className="bg-slate-50">
                <TableRow>
                  <TableHead className="px-6 font-bold py-4">Grupo</TableHead>
                  <TableHead className="font-bold">Materia</TableHead>
                  <TableHead className="font-bold">Carrera</TableHead>
                  <TableHead className="font-bold text-right pr-6">Acciones</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {grupos?.map(g => {
                  const materia = materias?.find(m => m.id === g.materiaId);
                  const carrera = carreras?.find(c => c.id === materia?.carreraId);
                  return (
                    <TableRow key={g.id}>
                      <TableCell className="px-6"><span className="bg-slate-900 text-white px-3 py-1 rounded-lg font-black text-xs">{g.nombre}</span></TableCell>
                      <TableCell className="font-medium">{materia?.nombre}</TableCell>
                      <TableCell className="text-xs text-muted-foreground">{carrera?.nombre}</TableCell>
                      <TableCell className="text-right pr-6">
                        <DropdownMenu>
                          <DropdownMenuTrigger asChild>
                            <Button variant="ghost" size="icon" className="h-8 w-8 rounded-full">
                              <MoreVertical className="w-4 h-4" />
                            </Button>
                          </DropdownMenuTrigger>
                          <DropdownMenuContent align="end" className="rounded-xl">
                            <DropdownMenuItem onClick={() => { setEditingGrupo({...g, carreraId: carrera?.id}); setOpenDialog('editGrupo'); }} className="gap-2 cursor-pointer font-bold">
                              <Edit2 className="w-4 h-4" /> Editar
                            </DropdownMenuItem>
                            <DropdownMenuItem onClick={() => handleDelete('grupos', g.id)} className="gap-2 cursor-pointer text-primary font-bold">
                              <Trash2 className="w-4 h-4" /> Eliminar
                            </DropdownMenuItem>
                          </DropdownMenuContent>
                        </DropdownMenu>
                      </TableCell>
                    </TableRow>
                  );
                })}
              </TableBody>
            </Table>
          </div>
          {/* Edit Grupo Dialog */}
          <Dialog open={openDialog === 'editGrupo'} onOpenChange={(o) => setOpenDialog(o ? 'editGrupo' : null)}>
            <DialogContent className="rounded-3xl">
              <DialogHeader><DialogTitle>Editar Grupo</DialogTitle></DialogHeader>
              {editingGrupo && (
                <div className="space-y-4 py-4">
                  <div className="space-y-2">
                    <Label>Carrera</Label>
                    <Select value={editingGrupo.carreraId} onValueChange={v => setEditingGrupo({...editingGrupo, carreraId: v, materiaId: ''})}>
                      <SelectTrigger className="rounded-xl"><SelectValue placeholder="Elegir Carrera" /></SelectTrigger>
                      <SelectContent>{carreras?.map(c => <SelectItem key={c.id} value={c.id}>{c.nombre}</SelectItem>)}</SelectContent>
                    </Select>
                  </div>
                  <div className="space-y-2">
                    <Label>Materia</Label>
                    <Select disabled={!editingGrupo.carreraId} value={editingGrupo.materiaId} onValueChange={v => setEditingGrupo({...editingGrupo, materiaId: v})}>
                      <SelectTrigger className="rounded-xl"><SelectValue placeholder="Elegir Materia" /></SelectTrigger>
                      <SelectContent>{materiasFiltradasParaGrupo.map(m => <SelectItem key={m.id} value={m.id}>{m.nombre} ({m.codigo})</SelectItem>)}</SelectContent>
                    </Select>
                  </div>
                  <div className="space-y-2"><Label>Nombre</Label><Input value={editingGrupo.nombre} onChange={e => setEditingGrupo({...editingGrupo, nombre: e.target.value})} /></div>
                </div>
              )}
              <DialogFooter><Button onClick={() => handleUpdate('grupos', editingGrupo.id, {nombre: editingGrupo.nombre, materiaId: editingGrupo.materiaId}, "Grupo")} className="w-full bg-primary font-bold">Actualizar</Button></DialogFooter>
            </DialogContent>
          </Dialog>
        </TabsContent>

        {/* --- HORARIOS --- */}
        <TabsContent value="horarios" className="mt-6 space-y-4">
          <div className="flex justify-between items-center">
            <h2 className="text-xl font-bold">Planificación de Horarios</h2>
            <Dialog open={openDialog === 'horario'} onOpenChange={(o) => setOpenDialog(o ? 'horario' : null)}>
              <DialogTrigger asChild>
                <Button className="bg-primary rounded-xl font-bold shadow-lg shadow-primary/20"><Plus className="w-4 h-4 mr-2" /> Nuevo Horario</Button>
              </DialogTrigger>
              <DialogContent className="rounded-3xl">
                <DialogHeader><DialogTitle>Asignar Horario</DialogTitle></DialogHeader>
                <div className="space-y-4 py-4">
                  <div className="space-y-2">
                    <Label>Grupo / Materia</Label>
                    <Select value={newHorario.grupoId} onValueChange={v => setNewHorario({...newHorario, grupoId: v})}>
                      <SelectTrigger className="rounded-xl"><SelectValue placeholder="Seleccionar Grupo" /></SelectTrigger>
                      <SelectContent>{grupos?.map(g => { const mat = materias?.find(m => m.id === g.materiaId); return <SelectItem key={g.id} value={g.id}>{g.nombre} - {mat?.nombre}</SelectItem> })}</SelectContent>
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
                  <div className="space-y-2"><Label>Aula / Salón</Label><Input value={newHorario.aula} onChange={e => setNewHorario({...newHorario, aula: e.target.value})} placeholder="Ej: Aula 302" /></div>
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
                  <TableHead className="font-bold">Grupo / Materia</TableHead>
                  <TableHead className="font-bold">Aula</TableHead>
                  <TableHead className="font-bold text-right pr-6">Acciones</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {horarios?.map(h => {
                  const grupo = grupos?.find(g => g.id === h.grupoId);
                  const materia = materias?.find(m => m.id === grupo?.materiaId);
                  return (
                    <TableRow key={h.id}>
                      <TableCell className="px-6 font-bold">{h.dia}</TableCell>
                      <TableCell className="text-xs font-medium">{h.horaInicio} - {h.horaFin}</TableCell>
                      <TableCell><div className="flex flex-col"><span className="font-bold text-sm">{materia?.nombre}</span><span className="text-[10px] text-muted-foreground uppercase">{grupo?.nombre}</span></div></TableCell>
                      <TableCell className="font-bold text-primary">{h.aula}</TableCell>
                      <TableCell className="text-right pr-6">
                        <DropdownMenu>
                          <DropdownMenuTrigger asChild>
                            <Button variant="ghost" size="icon" className="h-8 w-8 rounded-full">
                              <MoreVertical className="w-4 h-4" />
                            </Button>
                          </DropdownMenuTrigger>
                          <DropdownMenuContent align="end" className="rounded-xl">
                            <DropdownMenuItem onClick={() => { setEditingHorario(h); setOpenDialog('editHorario'); }} className="gap-2 cursor-pointer font-bold">
                              <Edit2 className="w-4 h-4" /> Editar
                            </DropdownMenuItem>
                            <DropdownMenuItem onClick={() => handleDelete('horarios', h.id)} className="gap-2 cursor-pointer text-primary font-bold">
                              <Trash2 className="w-4 h-4" /> Eliminar
                            </DropdownMenuItem>
                          </DropdownMenuContent>
                        </DropdownMenu>
                      </TableCell>
                    </TableRow>
                  );
                })}
              </TableBody>
            </Table>
          </div>
          {/* Edit Horario Dialog */}
          <Dialog open={openDialog === 'editHorario'} onOpenChange={(o) => setOpenDialog(o ? 'editHorario' : null)}>
            <DialogContent className="rounded-3xl">
              <DialogHeader><DialogTitle>Editar Horario</DialogTitle></DialogHeader>
              {editingHorario && (
                <div className="space-y-4 py-4">
                  <div className="space-y-2">
                    <Label>Grupo / Materia</Label>
                    <Select value={editingHorario.grupoId} onValueChange={v => setEditingHorario({...editingHorario, grupoId: v})}>
                      <SelectTrigger className="rounded-xl"><SelectValue placeholder="Seleccionar Grupo" /></SelectTrigger>
                      <SelectContent>{grupos?.map(g => { const mat = materias?.find(m => m.id === g.materiaId); return <SelectItem key={g.id} value={g.id}>{g.nombre} - {mat?.nombre}</SelectItem> })}</SelectContent>
                    </Select>
                  </div>
                  <div className="space-y-2">
                    <Label>Día</Label>
                    <Select value={editingHorario.dia} onValueChange={v => setEditingHorario({...editingHorario, dia: v})}>
                      <SelectTrigger className="rounded-xl"><SelectValue placeholder="Elegir Día" /></SelectTrigger>
                      <SelectContent>{["Lunes", "Martes", "Miércoles", "Jueves", "Viernes", "Sábado"].map(d => <SelectItem key={d} value={d}>{d}</SelectItem>)}</SelectContent>
                    </Select>
                  </div>
                  <div className="grid grid-cols-2 gap-4">
                    <div className="space-y-2"><Label>Inicio</Label><Input type="time" value={editingHorario.horaInicio} onChange={e => setEditingHorario({...editingHorario, horaInicio: e.target.value})} /></div>
                    <div className="space-y-2"><Label>Fin</Label><Input type="time" value={editingHorario.horaFin} onChange={e => setEditingHorario({...editingHorario, horaFin: e.target.value})} /></div>
                  </div>
                  <div className="space-y-2"><Label>Aula</Label><Input value={editingHorario.aula} onChange={e => setEditingHorario({...editingHorario, aula: e.target.value})} /></div>
                </div>
              )}
              <DialogFooter><Button onClick={() => handleUpdate('horarios', editingHorario.id, {grupoId: editingHorario.grupoId, dia: editingHorario.dia, horaInicio: editingHorario.horaInicio, horaFin: editingHorario.horaFin, aula: editingHorario.aula}, "Horario")} className="w-full bg-primary font-bold">Actualizar</Button></DialogFooter>
            </DialogContent>
          </Dialog>
        </TabsContent>
      </Tabs>
    </div>
  );
}
