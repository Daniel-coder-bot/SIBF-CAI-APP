
"use client";

import React, { useState, useRef } from 'react';
import { 
  Tabs, 
  TabsContent, 
  TabsList, 
  TabsTrigger 
} from "@/components/ui/tabs";
import { 
  Card, 
  CardContent, 
  CardHeader, 
  CardTitle, 
  CardDescription 
} from "@/components/ui/card";
import { 
  Building2, 
  BookOpen, 
  FolderTree, 
  Users, 
  Clock, 
  Plus, 
  Trash2, 
  Loader2,
  Upload,
  Download
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
  useFirestore, 
  useCollection, 
  useMemoFirebase,
  addDocumentNonBlocking,
  deleteDocumentNonBlocking,
  useUser
} from '@/firebase';
import { collection, doc, serverTimestamp } from 'firebase/firestore';
import { useToast } from "@/hooks/use-toast";
import * as XLSX from 'xlsx';

export default function CatalogosPage() {
  const db = useFirestore();
  const { toast } = useToast();
  const { user } = useUser();
  const materiaFileInputRef = useRef<HTMLInputElement>(null);

  // Queries para datos relacionados
  const sedesRef = useMemoFirebase(() => collection(db, 'sedes'), [db]);
  const carrerasRef = useMemoFirebase(() => collection(db, 'carreras'), [db]);
  const materiasRef = useMemoFirebase(() => collection(db, 'materias'), [db]);
  const gruposRef = useMemoFirebase(() => collection(db, 'grupos'), [db]);
  const horariosRef = useMemoFirebase(() => collection(db, 'horarios'), [db]);

  const { data: sedes, isLoading: loadingSedes } = useCollection(sedesRef);
  const { data: carreras } = useCollection(carrerasRef);
  const { data: materias } = useCollection(materiasRef);
  const { data: grupos } = useCollection(gruposRef);
  const { data: horarios } = useCollection(horariosRef);

  // Estados para formularios rápidos
  const [newSede, setNewSede] = useState({ nombre: '', ubicacion: '' });
  const [newCarrera, setNewCarrera] = useState({ nombre: '', sedeId: '' });
  const [newMateria, setNewMateria] = useState({ nombre: '', codigo: '', carreraId: '', cuatrimestre: '' });
  const [newGrupo, setNewGrupo] = useState({ nombre: '', materiaId: '' });
  const [newHorario, setNewHorario] = useState({ grupoId: '', dia: '', horaInicio: '', horaFin: '', aula: '' });

  const handleAdd = (ref: any, data: any, setter: any, emptyData: any, title: string) => {
    addDocumentNonBlocking(ref, { ...data, createdAt: serverTimestamp() });
    setter(emptyData);
    toast({ title: `${title} agregado`, description: "Los cambios se están sincronizando." });
  };

  const handleDelete = (collectionName: string, id: string) => {
    const docRef = doc(db, collectionName, id);
    deleteDocumentNonBlocking(docRef);
    toast({ variant: "destructive", title: "Eliminado correctamente" });
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

        data.forEach((row) => {
          // Intentar buscar la carrera por nombre si no viene el ID directo
          let carreraId = row.carreraId;
          if (!carreraId && row.carreraNombre) {
            const matchedCarrera = carreras.find(c => c.nombre.toLowerCase() === String(row.carreraNombre).toLowerCase());
            if (matchedCarrera) carreraId = matchedCarrera.id;
          }

          if (row.nombre && row.codigo && carreraId && row.cuatrimestre) {
            const materiaData = {
              nombre: String(row.nombre),
              codigo: String(row.codigo),
              carreraId: String(carreraId),
              cuatrimestre: String(row.cuatrimestre),
              createdAt: serverTimestamp()
            };
            addDocumentNonBlocking(materiasRef, materiaData);
          }
        });

        toast({ title: "Importación de Materias", description: `${data.length} registros procesados.` });
        if (materiaFileInputRef.current) materiaFileInputRef.current.value = '';
      } catch (error) {
        toast({ variant: "destructive", title: "Error", description: "No se pudo procesar el archivo Excel." });
      }
    };
    reader.readAsBinaryString(file);
  };

  return (
    <div className="space-y-6 animate-in fade-in duration-500">
      <div className="flex justify-between items-end">
        <div>
          <h1 className="text-3xl font-bold tracking-tight text-foreground">Catálogos Académicos</h1>
          <p className="text-muted-foreground font-medium text-sm">Gestiona la estructura base de la universidad.</p>
        </div>
      </div>

      <Tabs defaultValue="sedes" className="w-full">
        <TabsList className="bg-slate-100 p-1 rounded-2xl h-14 w-full justify-start overflow-x-auto gap-2">
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

        {/* --- CONTENIDO SEDES --- */}
        <TabsContent value="sedes" className="mt-6 space-y-6">
          <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
            <Card className="rounded-3xl border-border/40">
              <CardHeader>
                <CardTitle className="text-lg">Nueva Sede</CardTitle>
                <CardDescription>Añadir ubicación física.</CardDescription>
              </CardHeader>
              <CardContent className="space-y-4">
                <div className="space-y-2">
                  <Label>Nombre</Label>
                  <Input value={newSede.nombre} onChange={e => setNewSede({...newSede, nombre: e.target.value})} placeholder="Sede Central" />
                </div>
                <div className="space-y-2">
                  <Label>Ubicación</Label>
                  <Input value={newSede.ubicacion} onChange={e => setNewSede({...newSede, ubicacion: e.target.value})} placeholder="Dirección..." />
                </div>
                <Button onClick={() => handleAdd(sedesRef, newSede, setNewSede, {nombre: '', ubicacion: ''}, "Sede")} className="w-full bg-primary font-bold rounded-xl">Guardar</Button>
              </CardContent>
            </Card>
            <div className="lg:col-span-2 grid grid-cols-1 md:grid-cols-2 gap-4">
              {sedes?.map(s => (
                <Card key={s.id} className="rounded-3xl border-border/40 group relative overflow-hidden">
                  <CardHeader className="pb-2">
                    <CardTitle className="text-md flex justify-between items-center">
                      {s.nombre}
                      <Button variant="ghost" size="icon" onClick={() => handleDelete('sedes', s.id)} className="text-muted-foreground hover:text-primary"><Trash2 className="w-4 h-4" /></Button>
                    </CardTitle>
                    <CardDescription className="text-xs">{s.ubicacion}</CardDescription>
                  </CardHeader>
                </Card>
              ))}
            </div>
          </div>
        </TabsContent>

        {/* --- CONTENIDO CARRERAS --- */}
        <TabsContent value="carreras" className="mt-6 space-y-6">
          <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
            <Card className="rounded-3xl border-border/40">
              <CardHeader><CardTitle className="text-lg">Nueva Carrera</CardTitle></CardHeader>
              <CardContent className="space-y-4">
                <div className="space-y-2">
                  <Label>Nombre</Label>
                  <Input value={newCarrera.nombre} onChange={e => setNewCarrera({...newCarrera, nombre: e.target.value})} />
                </div>
                <div className="space-y-2">
                  <Label>Sede</Label>
                  <Select value={newCarrera.sedeId} onValueChange={v => setNewCarrera({...newCarrera, sedeId: v})}>
                    <SelectTrigger className="rounded-xl"><SelectValue placeholder="Seleccionar Sede" /></SelectTrigger>
                    <SelectContent>
                      {sedes?.map(s => <SelectItem key={s.id} value={s.id}>{s.nombre}</SelectItem>)}
                    </SelectContent>
                  </Select>
                </div>
                <Button onClick={() => handleAdd(carrerasRef, newCarrera, setNewCarrera, {nombre: '', sedeId: ''}, "Carrera")} className="w-full bg-primary font-bold rounded-xl">Guardar</Button>
              </CardContent>
            </Card>
            <div className="lg:col-span-2 space-y-3">
              {carreras?.map(c => (
                <div key={c.id} className="p-4 bg-white border border-border/40 rounded-2xl flex justify-between items-center">
                  <div>
                    <p className="font-bold">{c.nombre}</p>
                    <p className="text-xs text-muted-foreground">{sedes?.find(s => s.id === c.sedeId)?.nombre || 'Sede no encontrada'}</p>
                  </div>
                  <Button variant="ghost" size="icon" onClick={() => handleDelete('carreras', c.id)}><Trash2 className="w-4 h-4" /></Button>
                </div>
              ))}
            </div>
          </div>
        </TabsContent>

        {/* --- CONTENIDO MATERIAS --- */}
        <TabsContent value="materias" className="mt-6 space-y-6">
          <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
            <Card className="rounded-3xl border-border/40">
              <CardHeader className="flex flex-row items-center justify-between space-y-0">
                <CardTitle className="text-lg">Nueva Materia</CardTitle>
                <div>
                   <input 
                    type="file" 
                    ref={materiaFileInputRef} 
                    onChange={handleImportMateriasExcel} 
                    accept=".xlsx, .xls" 
                    className="hidden" 
                  />
                  <Button 
                    variant="outline" 
                    size="sm" 
                    className="h-8 rounded-lg"
                    onClick={() => materiaFileInputRef.current?.click()}
                  >
                    <Upload className="w-3 h-3 mr-2" />
                    Excel
                  </Button>
                </div>
              </CardHeader>
              <CardContent className="space-y-4">
                <div className="space-y-2"><Label>Nombre</Label><Input value={newMateria.nombre} onChange={e => setNewMateria({...newMateria, nombre: e.target.value})} /></div>
                <div className="grid grid-cols-2 gap-4">
                   <div className="space-y-2"><Label>Código</Label><Input value={newMateria.codigo} onChange={e => setNewMateria({...newMateria, codigo: e.target.value})} /></div>
                   <div className="space-y-2"><Label>Cuatri.</Label><Input value={newMateria.cuatrimestre} onChange={e => setNewMateria({...newMateria, cuatrimestre: e.target.value})} placeholder="Ej: 1" /></div>
                </div>
                <div className="space-y-2">
                  <Label>Carrera</Label>
                  <Select value={newMateria.carreraId} onValueChange={v => setNewMateria({...newMateria, carreraId: v})}>
                    <SelectTrigger className="rounded-xl"><SelectValue placeholder="Seleccionar Carrera" /></SelectTrigger>
                    <SelectContent>
                      {carreras?.map(c => <SelectItem key={c.id} value={c.id}>{c.nombre}</SelectItem>)}
                    </SelectContent>
                  </Select>
                </div>
                <Button onClick={() => handleAdd(materiasRef, newMateria, setNewMateria, {nombre: '', codigo: '', carreraId: '', cuatrimestre: ''}, "Materia")} className="w-full bg-primary font-bold rounded-xl">Guardar</Button>
              </CardContent>
            </Card>
            <div className="lg:col-span-2 grid grid-cols-1 md:grid-cols-2 gap-4">
              {materias?.sort((a,b) => Number(a.cuatrimestre) - Number(b.cuatrimestre)).map(m => (
                <div key={m.id} className="p-4 bg-white border border-border/40 rounded-2xl group">
                  <div className="flex justify-between items-start mb-2">
                    <div className="flex gap-2">
                       <span className="text-[10px] font-black uppercase text-primary px-2 py-0.5 bg-primary/5 rounded-full">{m.codigo}</span>
                       <span className="text-[10px] font-bold text-slate-500 px-2 py-0.5 bg-slate-100 rounded-full">Cuatri {m.cuatrimestre}</span>
                    </div>
                    <Button variant="ghost" size="icon" className="h-6 w-6 opacity-0 group-hover:opacity-100 transition-opacity" onClick={() => handleDelete('materias', m.id)}><Trash2 className="w-4 h-4" /></Button>
                  </div>
                  <p className="font-bold text-sm leading-tight">{m.nombre}</p>
                  <p className="text-[10px] text-muted-foreground mt-1 truncate">{carreras?.find(c => c.id === m.carreraId)?.nombre}</p>
                </div>
              ))}
            </div>
          </div>
        </TabsContent>

        {/* --- CONTENIDO GRUPOS --- */}
        <TabsContent value="grupos" className="mt-6 space-y-6">
          <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
            <Card className="rounded-3xl border-border/40">
              <CardHeader><CardTitle className="text-lg">Nuevo Grupo</CardTitle></CardHeader>
              <CardContent className="space-y-4">
                <div className="space-y-2"><Label>Nombre de Grupo</Label><Input value={newGrupo.nombre} onChange={e => setNewGrupo({...newGrupo, nombre: e.target.value})} placeholder="Ej: G1, Sección A" /></div>
                <div className="space-y-2">
                  <Label>Materia</Label>
                  <Select value={newGrupo.materiaId} onValueChange={v => setNewGrupo({...newGrupo, materiaId: v})}>
                    <SelectTrigger className="rounded-xl"><SelectValue placeholder="Seleccionar Materia" /></SelectTrigger>
                    <SelectContent>
                      {materias?.map(m => <SelectItem key={m.id} value={m.id}>{m.nombre}</SelectItem>)}
                    </SelectContent>
                  </Select>
                </div>
                <Button onClick={() => handleAdd(gruposRef, newGrupo, setNewGrupo, {nombre: '', materiaId: ''}, "Grupo")} className="w-full bg-primary font-bold rounded-xl">Guardar</Button>
              </CardContent>
            </Card>
            <div className="lg:col-span-2 space-y-3">
              {grupos?.map(g => (
                <div key={g.id} className="p-4 bg-white border border-border/40 rounded-2xl flex justify-between items-center hover:border-primary/50 transition-colors">
                  <div className="flex items-center gap-4">
                    <div className="bg-slate-900 text-white w-10 h-10 rounded-xl flex items-center justify-center font-black">{g.nombre}</div>
                    <div>
                       <p className="font-bold">{materias?.find(m => m.id === g.materiaId)?.nombre}</p>
                       <p className="text-xs text-muted-foreground">Código Materia: {materias?.find(m => m.id === g.materiaId)?.codigo}</p>
                    </div>
                  </div>
                  <Button variant="ghost" size="icon" onClick={() => handleDelete('grupos', g.id)}><Trash2 className="w-4 h-4" /></Button>
                </div>
              ))}
            </div>
          </div>
        </TabsContent>

        {/* --- CONTENIDO HORARIOS --- */}
        <TabsContent value="horarios" className="mt-6 space-y-6">
          <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
            <Card className="rounded-3xl border-border/40">
              <CardHeader><CardTitle className="text-lg">Nuevo Horario</CardTitle></CardHeader>
              <CardContent className="space-y-4">
                <div className="space-y-2">
                  <Label>Grupo</Label>
                  <Select value={newHorario.grupoId} onValueChange={v => setNewHorario({...newHorario, grupoId: v})}>
                    <SelectTrigger className="rounded-xl"><SelectValue placeholder="Seleccionar Grupo" /></SelectTrigger>
                    <SelectContent>
                      {grupos?.map(g => <SelectItem key={g.id} value={g.id}>{g.nombre} - {materias?.find(m => m.id === g.materiaId)?.nombre}</SelectItem>)}
                    </SelectContent>
                  </Select>
                </div>
                <div className="space-y-2">
                  <Label>Día</Label>
                  <Select value={newHorario.dia} onValueChange={v => setNewHorario({...newHorario, dia: v})}>
                    <SelectTrigger className="rounded-xl"><SelectValue /></SelectTrigger>
                    <SelectContent>
                      {["Lunes", "Martes", "Miércoles", "Jueves", "Viernes", "Sábado"].map(d => <SelectItem key={d} value={d}>{d}</SelectItem>)}
                    </SelectContent>
                  </Select>
                </div>
                <div className="grid grid-cols-2 gap-4">
                   <div className="space-y-2"><Label>Inicio</Label><Input type="time" value={newHorario.horaInicio} onChange={e => setNewHorario({...newHorario, horaInicio: e.target.value})} /></div>
                   <div className="space-y-2"><Label>Fin</Label><Input type="time" value={newHorario.horaFin} onChange={e => setNewHorario({...newHorario, horaFin: e.target.value})} /></div>
                </div>
                <div className="space-y-2"><Label>Aula</Label><Input value={newHorario.aula} onChange={e => setNewHorario({...newHorario, aula: e.target.value})} placeholder="Ej: Aula 302" /></div>
                <Button onClick={() => handleAdd(horariosRef, newHorario, setNewHorario, {grupoId: '', dia: '', horaInicio: '', horaFin: '', aula: ''}, "Horario")} className="w-full bg-primary font-bold rounded-xl">Guardar</Button>
              </CardContent>
            </Card>
            <div className="lg:col-span-2 space-y-3">
              {horarios?.map(h => {
                const grupo = grupos?.find(g => g.id === h.grupoId);
                const materia = materias?.find(m => m.id === grupo?.materiaId);
                return (
                  <div key={h.id} className="p-4 bg-white border border-border/40 rounded-2xl flex justify-between items-center">
                    <div className="flex gap-4 items-center">
                      <div className="bg-primary/5 text-primary p-3 rounded-xl"><Clock className="w-5 h-5" /></div>
                      <div>
                        <p className="font-bold">{h.dia} | {h.horaInicio} - {h.horaFin}</p>
                        <p className="text-xs text-muted-foreground">{materia?.nombre} ({grupo?.nombre}) - {h.aula}</p>
                      </div>
                    </div>
                    <Button variant="ghost" size="icon" onClick={() => handleDelete('horarios', h.id)}><Trash2 className="w-4 h-4" /></Button>
                  </div>
                );
              })}
            </div>
          </div>
        </TabsContent>
      </Tabs>
    </div>
  );
}
