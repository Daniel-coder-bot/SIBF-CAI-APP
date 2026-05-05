
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
  Upload,
  Download,
  FileSpreadsheet
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
  useFirestore, 
  useCollection, 
  useMemoFirebase,
  addDocumentNonBlocking,
  deleteDocumentNonBlocking
} from '@/firebase';
import { collection, doc, serverTimestamp } from 'firebase/firestore';
import { useToast } from "@/hooks/use-toast";
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

  // Estados para formularios
  const [newSede, setNewSede] = useState({ nombre: '', ubicacion: '' });
  const [newCarrera, setNewCarrera] = useState({ nombre: '', sedeId: '' });
  const [newMateria, setNewMateria] = useState({ nombre: '', codigo: '', carreraId: '', cuatrimestre: '' });
  const [newGrupo, setNewGrupo] = useState({ nombre: '', carreraId: '', materiaId: '' });
  const [newHorario, setNewHorario] = useState({ grupoId: '', dia: '', horaInicio: '', horaFin: '', aula: '' });

  // Filtrado de materias para grupos
  const materiasFiltradas = useMemo(() => {
    if (!newGrupo.carreraId || !materias) return [];
    return materias.filter(m => m.carreraId === newGrupo.carreraId);
  }, [newGrupo.carreraId, materias]);

  const handleAdd = (ref: any, data: any, setter: any, emptyData: any, title: string) => {
    addDocumentNonBlocking(ref, { ...data, createdAt: serverTimestamp() });
    setter(emptyData);
    setOpenDialog(null);
    toast({ title: `${title} guardado`, description: "Los datos se están sincronizando." });
  };

  const handleDelete = (collectionName: string, id: string) => {
    const docRef = doc(db, collectionName, id);
    deleteDocumentNonBlocking(docRef);
    toast({ variant: "destructive", title: "Eliminado correctamente" });
  };

  const handleDownloadTemplate = () => {
    const data = [
      { nombre: 'Ejemplo Materia', cuatrimestre: '1', carreraId: 'Pegar_ID_Aqui' }
    ];
    const worksheet = XLSX.utils.json_to_sheet(data);
    const workbook = XLSX.utils.book_new();
    XLSX.utils.book_append_sheet(workbook, worksheet, "Plantilla Materias");
    XLSX.writeFile(workbook, "Plantilla_Materias_UniAttend.xlsx");
    toast({ title: "Plantilla descargada", description: "Completa el ID de carrera para una vinculación correcta." });
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
          let carreraId = row.carreraId;
          
          // Si no hay ID pero hay nombre, intentar buscar la carrera
          if (!carreraId && row.carreraNombre) {
            const matchedCarrera = carreras.find(c => c.nombre.toLowerCase() === String(row.carreraNombre).toLowerCase());
            if (matchedCarrera) carreraId = matchedCarrera.id;
          }

          if (row.nombre && carreraId && row.cuatrimestre) {
            // Generar código automático si no viene en el excel: MAT-NombrePrefix-Cuatri-Random
            const namePrefix = String(row.nombre).substring(0, 3).toUpperCase();
            const randomSuffix = Math.floor(100 + Math.random() * 900);
            const autoCodigo = row.codigo || `MAT-${namePrefix}-${row.cuatrimestre}-${randomSuffix}`;

            addDocumentNonBlocking(materiasRef, {
              nombre: String(row.nombre),
              codigo: String(autoCodigo),
              carreraId: String(carreraId),
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
                  <TableHead className="font-bold py-4 px-6">Nombre</TableHead>
                  <TableHead className="font-bold">Ubicación</TableHead>
                  <TableHead className="font-bold text-right pr-6">Acciones</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {sedes?.map(s => (
                  <TableRow key={s.id}>
                    <TableCell className="px-6 font-medium">{s.nombre}</TableCell>
                    <TableCell className="text-muted-foreground">{s.ubicacion}</TableCell>
                    <TableCell className="text-right pr-6"><Button variant="ghost" size="icon" onClick={() => handleDelete('sedes', s.id)} className="text-primary"><Trash2 className="w-4 h-4" /></Button></TableCell>
                  </TableRow>
                ))}
              </TableBody>
            </Table>
          </div>
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
                  <div className="p-3 bg-slate-50 rounded-xl text-[10px] text-muted-foreground">ID para Excel: <span className="font-bold text-primary select-all">{newCarrera.sedeId || 'Selecciona una sede'}</span></div>
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
                  <TableHead className="font-bold">ID Carrera</TableHead>
                  <TableHead className="font-bold">Sede</TableHead>
                  <TableHead className="font-bold text-right pr-6">Acciones</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {carreras?.map(c => (
                  <TableRow key={c.id}>
                    <TableCell className="px-6 font-bold">{c.nombre}</TableCell>
                    <TableCell className="font-mono text-[10px] text-primary select-all">{c.id}</TableCell>
                    <TableCell>{sedes?.find(s => s.id === c.sedeId)?.nombre || 'Sede N/A'}</TableCell>
                    <TableCell className="text-right pr-6"><Button variant="ghost" size="icon" onClick={() => handleDelete('carreras', c.id)} className="text-primary"><Trash2 className="w-4 h-4" /></Button></TableCell>
                  </TableRow>
                ))}
              </TableBody>
            </Table>
          </div>
        </TabsContent>

        {/* --- MATERIAS --- */}
        <TabsContent value="materias" className="mt-6 space-y-4">
          <div className="flex justify-between items-center">
            <h2 className="text-xl font-bold">Malla Curricular</h2>
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
                {materias?.sort((a,b) => Number(a.cuatrimestre) - Number(b.cuatrimestre)).map(m => (
                  <TableRow key={m.id}>
                    <TableCell className="px-6 font-black text-primary text-xs">{m.codigo}</TableCell>
                    <TableCell className="font-medium">{m.nombre}</TableCell>
                    <TableCell className="text-xs text-muted-foreground">{carreras?.find(c => c.id === m.carreraId)?.nombre}</TableCell>
                    <TableCell className="font-bold">{m.cuatrimestre}</TableCell>
                    <TableCell className="text-right pr-6"><Button variant="ghost" size="icon" onClick={() => handleDelete('materias', m.id)} className="text-primary"><Trash2 className="w-4 h-4" /></Button></TableCell>
                  </TableRow>
                ))}
              </TableBody>
            </Table>
          </div>
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
                      <SelectContent>{materiasFiltradas.map(m => <SelectItem key={m.id} value={m.id}>{m.nombre} ({m.codigo})</SelectItem>)}</SelectContent>
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
                      <TableCell className="text-right pr-6"><Button variant="ghost" size="icon" onClick={() => handleDelete('grupos', g.id)} className="text-primary"><Trash2 className="w-4 h-4" /></Button></TableCell>
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
                      <SelectContent>
                        {grupos?.map(g => {
                          const mat = materias?.find(m => m.id === g.materiaId);
                          return <SelectItem key={g.id} value={g.id}>{g.nombre} - {mat?.nombre}</SelectItem>
                        })}
                      </SelectContent>
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
                      <TableCell>
                        <div className="flex flex-col">
                          <span className="font-bold text-sm">{materia?.nombre}</span>
                          <span className="text-[10px] text-muted-foreground uppercase">{grupo?.nombre}</span>
                        </div>
                      </TableCell>
                      <TableCell className="font-bold text-primary">{h.aula}</TableCell>
                      <TableCell className="text-right pr-6"><Button variant="ghost" size="icon" onClick={() => handleDelete('horarios', h.id)} className="text-primary"><Trash2 className="w-4 h-4" /></Button></TableCell>
                    </TableRow>
                  );
                })}
              </TableBody>
            </Table>
          </div>
        </TabsContent>
      </Tabs>
    </div>
  );
}
