
"use client";

import React, { useEffect, useState, useMemo } from 'react';
import { useRouter } from 'next/navigation';
import { 
  AlertCircle,
  Loader2,
  CheckCircle,
  Users,
  Building2,
  CalendarCheck,
  TrendingUp,
  FileBarChart,
  GraduationCap,
  Filter,
  Calendar,
  Search,
  BookOpen,
  Briefcase,
  Download,
  Zap,
  ZapOff
} from 'lucide-react';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { 
  useUser, 
  useFirestore, 
  useMemoFirebase, 
  useCollection 
} from '@/firebase';
import { collection, query, where, limit } from 'firebase/firestore';
import { 
  BarChart, 
  Bar, 
  XAxis, 
  YAxis, 
  CartesianGrid, 
  Tooltip, 
  ResponsiveContainer, 
  Cell,
  PieChart,
  Pie,
  LineChart,
  Line
} from 'recharts';
import { 
  Select, 
  SelectContent, 
  SelectItem, 
  SelectTrigger, 
  SelectValue 
} from "@/components/ui/select";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Label } from "@/components/ui/label";
import { useToast } from "@/hooks/use-toast";
import * as XLSX from 'xlsx';
import { cn } from "@/lib/utils";

const COLORS = ['#FF4C5E', '#1E293B', '#334155', '#475569', '#64748B', '#0F172A'];

export default function DashboardPage() {
  const { user, isUserLoading } = useUser();
  const router = useRouter();
  const db = useFirestore();
  const { toast } = useToast();

  const [activeMatricula, setActiveMatricula] = useState<string | null>(null);
  const [demoRole, setDemoRole] = useState<string | null>(null);

  // Estados de simulación
  const [isSimulating, setIsSimulating] = useState(false);
  const [simulatedData, setSimulatedData] = useState<any[]>([]);

  // Filtros de estado
  const [filterSede, setFilterSede] = useState<string>("all");
  const [filterCarrera, setFilterCarrera] = useState<string>("all");
  const [filterMateria, setFilterMateria] = useState<string>("all");
  const [filterGrupo, setFilterGrupo] = useState<string>("all");
  const [filterDocente, setFilterDocente] = useState<string>("all");
  const [filterMes, setFilterMes] = useState<string>("all");

  useEffect(() => {
    if (typeof window !== 'undefined') {
      setActiveMatricula(sessionStorage.getItem('active_matricula'));
      setDemoRole(sessionStorage.getItem('demo_role'));
    }
  }, []);

  // Colecciones reales
  const usersRef = useMemoFirebase(() => collection(db, 'users'), [db]);
  const sedesRef = useMemoFirebase(() => collection(db, 'sedes'), [db]);
  const asistenciasRef = useMemoFirebase(() => collection(db, 'asistencias'), [db]);
  const carrerasRef = useMemoFirebase(() => collection(db, 'carreras'), [db]);
  const materiasRef = useMemoFirebase(() => collection(db, 'materias'), [db]);
  const gruposRef = useMemoFirebase(() => collection(db, 'grupos'), [db]);

  const { data: allUsers } = useCollection(usersRef);
  const { data: allSedes } = useCollection(sedesRef);
  const { data: allAsistencias } = useCollection(asistenciasRef);
  const { data: allCarreras } = useCollection(carrerasRef);
  const { data: allMaterias } = useCollection(materiasRef);
  const { data: allGrupos } = useCollection(gruposRef);

  const docentes = useMemo(() => allUsers?.filter(u => u.role === 'Docente') || [], [allUsers]);

  // Generador de datos de simulación
  const handleToggleSimulation = () => {
    if (isSimulating) {
      setIsSimulating(false);
      setSimulatedData([]);
      toast({ title: "Modo Real", description: "Mostrando datos reales de la base de datos." });
      return;
    }

    if (!allSedes?.length || !allCarreras?.length || !allMaterias?.length || !allGrupos?.length) {
      toast({ variant: "destructive", title: "Error", description: "Debes tener sedes, carreras y grupos creados para simular datos." });
      return;
    }

    const mockRecords = [];
    const states: ('Presente' | 'Retraso' | 'Falta')[] = ['Presente', 'Presente', 'Presente', 'Retraso', 'Falta'];
    const months = ['2025-01', '2025-02', '2025-03', '2025-04'];
    
    // Generamos 400 registros aleatorios
    for (let i = 0; i < 400; i++) {
      const randomMateria = allMaterias[Math.floor(Math.random() * allMaterias.length)];
      const randomGrupo = allGrupos[Math.floor(Math.random() * allGrupos.length)];
      const randomDocente = docentes[Math.floor(Math.random() * docentes.length)]?.id || 'docente-sim';
      const randomState = states[Math.floor(Math.random() * states.length)];
      const randomMonth = months[Math.floor(Math.random() * months.length)];
      const randomDay = Math.floor(Math.random() * 28) + 1;
      const dateStr = `${randomMonth}-${randomDay.toString().padStart(2, '0')}`;

      mockRecords.push({
        id: `sim-${i}`,
        materiaId: randomMateria.id,
        grupoId: randomGrupo.id,
        docenteId: randomDocente,
        alumnoId: `alumno-sim-${Math.floor(Math.random() * 50)}`,
        fecha: dateStr,
        estado: randomState,
        createdAt: { toDate: () => new Date(dateStr) }
      });
    }

    setSimulatedData(mockRecords);
    setIsSimulating(true);
    toast({ title: "Modo Simulación Activo", description: "Se han generado 400 registros para pruebas de analítica." });
  };

  // Base de datos de trabajo (Simulada o Real)
  const currentDataPool = isSimulating ? simulatedData : (allAsistencias || []);

  // Aplicación de Filtros a los Datos
  const filteredAsistencias = useMemo(() => {
    return currentDataPool.filter(a => {
      const materia = allMaterias?.find(m => m.id === a.materiaId);
      const carrera = allCarreras?.find(c => c.id === materia?.carreraId);
      
      const matchesSede = filterSede === "all" || carrera?.sedeId === filterSede;
      const matchesCarrera = filterCarrera === "all" || materia?.carreraId === filterCarrera;
      const matchesMateria = filterMateria === "all" || a.materiaId === filterMateria;
      const matchesGrupo = filterGrupo === "all" || a.grupoId === filterGrupo;
      const matchesDocente = filterDocente === "all" || a.docenteId === filterDocente;
      const matchesMes = filterMes === "all" || a.fecha.startsWith(filterMes);
      
      return matchesSede && matchesCarrera && matchesMateria && matchesGrupo && matchesDocente && matchesMes;
    });
  }, [currentDataPool, filterSede, filterCarrera, filterMateria, filterGrupo, filterDocente, filterMes, allCarreras, allMaterias]);

  // Estadísticas Calculadas
  const stats = useMemo(() => {
    const presentes = filteredAsistencias.filter(a => a.estado === 'Presente').length;
    const retardos = filteredAsistencias.filter(a => a.estado === 'Retraso').length;
    const faltas = filteredAsistencias.filter(a => a.estado === 'Falta').length;
    const total = filteredAsistencias.length || 1;

    return {
      presentes,
      retardos,
      faltas,
      indicePuntualidad: ((presentes / total) * 100).toFixed(1)
    };
  }, [filteredAsistencias]);

  // Datos para Gráfico de Sedes
  const dataSedes = useMemo(() => {
    if (!allSedes || !filteredAsistencias) return [];
    return allSedes.map(s => {
      const count = filteredAsistencias.filter(a => {
        const materia = allMaterias?.find(m => m.id === a.materiaId);
        const carrera = allCarreras?.find(c => c.id === materia?.carreraId);
        return carrera?.sedeId === s.id;
      }).length;
      return { name: s.nombre, value: count };
    }).filter(d => d.value > 0);
  }, [allSedes, filteredAsistencias, allMaterias, allCarreras]);

  // Datos para Tendencia
  const dataSemana = useMemo(() => {
    const dias = ['Dom', 'Lun', 'Mar', 'Mie', 'Jue', 'Vie', 'Sab'];
    const counts = dias.map(d => ({ day: d, asistencia: 0 }));
    
    filteredAsistencias.forEach(a => {
      const date = new Date(a.fecha);
      if (!isNaN(date.getTime())) {
        counts[date.getDay()].asistencia++;
      }
    });

    return counts.filter(c => c.day !== 'Dom' && c.day !== 'Sab');
  }, [filteredAsistencias]);

  const handleExportFilteredData = () => {
    if (filteredAsistencias.length === 0) {
      toast({ variant: "destructive", title: "Sin datos", description: "No hay registros filtrados para exportar." });
      return;
    }

    const exportData = filteredAsistencias.map(a => {
      const alumno = allUsers?.find(u => u.id === a.alumnoId);
      const materia = allMaterias?.find(m => m.id === a.materiaId);
      const grupo = allGrupos?.find(g => g.id === a.grupoId);
      
      return {
        Fecha: a.fecha,
        Alumno: alumno ? `${alumno.firstName} ${alumno.lastName}` : (isSimulating ? 'Alumno Simulado' : 'Desconocido'),
        Matricula: alumno?.matricula || (isSimulating ? 'SIM-000' : 'N/A'),
        Materia: materia?.nombre || 'N/A',
        Grupo: grupo?.nombre || 'N/A',
        Estado: a.estado,
        Tipo: isSimulating ? 'SIMULADO' : 'REAL'
      };
    });

    const worksheet = XLSX.utils.json_to_sheet(exportData);
    const workbook = XLSX.utils.book_new();
    XLSX.utils.book_append_sheet(workbook, worksheet, "Analitica");
    XLSX.writeFile(workbook, `SIBF_CAI_${isSimulating ? 'Simulation' : 'Real'}_${new Date().toISOString().split('T')[0]}.xlsx`);
    
    toast({ title: "Excel Generado", description: "Exportación completa realizada con éxito." });
  };

  useEffect(() => {
    if (isUserLoading) return;
    if (activeMatricula) {
      router.push('/dashboard/alumno');
    } else if (user?.isAnonymous && demoRole === 'docente') {
      router.push('/dashboard/docente/asistencia');
    }
  }, [user, isUserLoading, router, activeMatricula, demoRole]);

  if (isUserLoading || activeMatricula || (user?.isAnonymous && demoRole === 'docente')) {
    return (
      <div className="h-[60vh] flex items-center justify-center">
        <Loader2 className="w-8 h-8 animate-spin text-primary" />
      </div>
    );
  }

  return (
    <div className="space-y-8 animate-in fade-in duration-700 pb-20">
      <div className="flex flex-col md:flex-row md:items-end justify-between gap-4 border-b border-slate-100 pb-8">
        <div>
          <div className="flex items-center gap-3 mb-2">
            <div className="w-1.5 h-8 bg-primary rounded-full" />
            <h1 className="text-3xl font-bold tracking-tight text-slate-900 uppercase flex items-center gap-2">
              Inteligencia de Datos
              {isSimulating && <Badge className="bg-amber-500 animate-pulse text-white border-none ml-2">Simulación Activa</Badge>}
            </h1>
          </div>
          <p className="text-muted-foreground font-medium text-sm">
            Análisis transversal de asistencia <span className="text-primary font-bold">SIBF - CAI</span>
          </p>
        </div>
        <div className="flex flex-wrap gap-2">
          <Button 
            onClick={handleToggleSimulation}
            variant={isSimulating ? "destructive" : "secondary"}
            className="h-10 rounded-xl px-6 text-[10px] font-bold uppercase tracking-widest shadow-sm"
          >
            {isSimulating ? <ZapOff className="w-4 h-4 mr-2" /> : <Zap className="w-4 h-4 mr-2" />}
            {isSimulating ? "Detener Simulación" : "Modo Simulación (Prueba)"}
          </Button>
          <Button 
            onClick={handleExportFilteredData}
            variant="outline" 
            className="h-10 rounded-xl px-6 border-slate-200 bg-white text-[10px] font-bold uppercase tracking-widest text-slate-600 hover:bg-slate-50"
          >
            <Download className="w-4 h-4 mr-2 text-primary" /> Exportar Vista
          </Button>
          <Badge variant="outline" className="h-10 flex items-center rounded-xl px-4 border-slate-300 bg-slate-50 text-[10px] font-bold uppercase tracking-widest text-slate-600">
            {filteredAsistencias.length} Registros
          </Badge>
        </div>
      </div>

      <Card className="rounded-[2rem] border-none shadow-sm bg-slate-50/50 p-6">
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-6 gap-4">
          <div className="space-y-1.5">
            <Label className="text-[9px] font-bold uppercase text-muted-foreground ml-1">Sede</Label>
            <Select value={filterSede} onValueChange={setFilterSede}>
              <SelectTrigger className="rounded-xl h-10 border-none bg-white shadow-sm font-semibold text-xs"><SelectValue placeholder="Todas" /></SelectTrigger>
              <SelectContent>
                <SelectItem value="all">Todas las Sedes</SelectItem>
                {allSedes?.map(s => <SelectItem key={s.id} value={s.id}>{s.nombre}</SelectItem>)}
              </SelectContent>
            </Select>
          </div>

          <div className="space-y-1.5">
            <Label className="text-[9px] font-bold uppercase text-muted-foreground ml-1">Carrera</Label>
            <Select value={filterCarrera} onValueChange={setFilterCarrera}>
              <SelectTrigger className="rounded-xl h-10 border-none bg-white shadow-sm font-semibold text-xs"><SelectValue placeholder="Todas" /></SelectTrigger>
              <SelectContent>
                <SelectItem value="all">Todas las Carreras</SelectItem>
                {allCarreras?.filter(c => filterSede === 'all' || c.sedeId === filterSede).map(c => <SelectItem key={c.id} value={c.id}>{c.nombre}</SelectItem>)}
              </SelectContent>
            </Select>
          </div>

          <div className="space-y-1.5">
            <Label className="text-[9px] font-bold uppercase text-muted-foreground ml-1">Docente</Label>
            <Select value={filterDocente} onValueChange={setFilterDocente}>
              <SelectTrigger className="rounded-xl h-10 border-none bg-white shadow-sm font-semibold text-xs"><SelectValue placeholder="Todos" /></SelectTrigger>
              <SelectContent>
                <SelectItem value="all">Todos los Docentes</SelectItem>
                {docentes.map(d => <SelectItem key={d.id} value={d.id}>{d.firstName} {d.lastName}</SelectItem>)}
              </SelectContent>
            </Select>
          </div>

          <div className="space-y-1.5">
            <Label className="text-[9px] font-bold uppercase text-muted-foreground ml-1">Materia</Label>
            <Select value={filterMateria} onValueChange={setFilterMateria}>
              <SelectTrigger className="rounded-xl h-10 border-none bg-white shadow-sm font-semibold text-xs"><SelectValue placeholder="Todas" /></SelectTrigger>
              <SelectContent>
                <SelectItem value="all">Todas las Materias</SelectItem>
                {allMaterias?.filter(m => filterCarrera === 'all' || m.carreraId === filterCarrera).map(m => <SelectItem key={m.id} value={m.id}>{m.nombre}</SelectItem>)}
              </SelectContent>
            </Select>
          </div>

          <div className="space-y-1.5">
            <Label className="text-[9px] font-bold uppercase text-muted-foreground ml-1">Grupo</Label>
            <Select value={filterGrupo} onValueChange={setFilterGrupo}>
              <SelectTrigger className="rounded-xl h-10 border-none bg-white shadow-sm font-semibold text-xs"><SelectValue placeholder="Todos" /></SelectTrigger>
              <SelectContent>
                <SelectItem value="all">Todos los Grupos</SelectItem>
                {allGrupos?.filter(g => filterCarrera === 'all' || g.carreraId === filterCarrera).map(g => <SelectItem key={g.id} value={g.id}>{g.nombre}</SelectItem>)}
              </SelectContent>
            </Select>
          </div>

          <div className="space-y-1.5">
            <Label className="text-[9px] font-bold uppercase text-muted-foreground ml-1">Periodo (Mes)</Label>
            <Select value={filterMes} onValueChange={setFilterMes}>
              <SelectTrigger className="rounded-xl h-10 border-none bg-white shadow-sm font-semibold text-xs"><SelectValue placeholder="Cualquier" /></SelectTrigger>
              <SelectContent>
                <SelectItem value="all">Todo el Historial</SelectItem>
                <SelectItem value="2025-01">Enero 2025</SelectItem>
                <SelectItem value="2025-02">Febrero 2025</SelectItem>
                <SelectItem value="2025-03">Marzo 2025</SelectItem>
                <SelectItem value="2025-04">Abril 2025</SelectItem>
              </SelectContent>
            </Select>
          </div>
        </div>
      </Card>

      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-6">
        <Card className="rounded-3xl border-none bg-slate-900 text-white shadow-lg">
          <CardContent className="p-6">
            <div className="flex items-center justify-between mb-4">
              <div className="bg-primary/20 p-2 rounded-xl"><CalendarCheck className="w-6 h-6 text-primary" /></div>
              <span className="text-[9px] font-bold uppercase tracking-widest text-white/40">Presentes</span>
            </div>
            <h3 className="text-4xl font-bold">{stats.presentes}</h3>
            <p className="text-[9px] font-bold text-green-400 mt-2 uppercase tracking-tight">Puntualidad: {stats.indicePuntualidad}%</p>
          </CardContent>
        </Card>
        <Card className="rounded-3xl border-none bg-white shadow-sm border border-slate-100">
          <CardContent className="p-6">
            <div className="flex items-center justify-between mb-4">
              <div className="bg-amber-100 p-2 rounded-xl"><AlertCircle className="w-6 h-6 text-amber-600" /></div>
              <span className="text-[9px] font-bold uppercase tracking-widest text-slate-400">Retardos</span>
            </div>
            <h3 className="text-4xl font-bold text-slate-900">{stats.retardos}</h3>
            <p className="text-[9px] font-bold text-slate-400 mt-2 uppercase">Incidencias detectadas</p>
          </CardContent>
        </Card>
        <Card className="rounded-3xl border-none bg-white shadow-sm border border-slate-100">
          <CardContent className="p-6">
            <div className="flex items-center justify-between mb-4">
              <div className="bg-red-50 p-2 rounded-xl"><AlertCircle className="w-6 h-6 text-red-600" /></div>
              <span className="text-[9px] font-bold uppercase tracking-widest text-slate-400">Faltas</span>
            </div>
            <h3 className="text-4xl font-bold text-slate-900">{stats.faltas}</h3>
            <p className="text-[9px] font-bold text-red-600 mt-2 uppercase">Ausentismo crítico</p>
          </CardContent>
        </Card>
        <Card className="rounded-3xl border-none bg-white shadow-sm border border-slate-100">
          <CardContent className="p-6">
            <div className="flex items-center justify-between mb-4">
              <div className="bg-slate-100 p-2 rounded-xl"><Briefcase className="w-6 h-6 text-slate-600" /></div>
              <span className="text-[9px] font-bold uppercase tracking-widest text-slate-400">Docentes</span>
            </div>
            <h3 className="text-4xl font-bold text-slate-900">{docentes.length}</h3>
            <p className="text-[9px] font-bold text-slate-400 mt-2 uppercase">Personal Académico</p>
          </CardContent>
        </Card>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
        <Card className="rounded-[2.5rem] border-slate-100 shadow-sm overflow-hidden bg-white">
          <CardHeader className="p-8 border-b border-slate-50 flex flex-row items-center justify-between">
            <div>
              <CardTitle className="text-xl font-bold flex items-center gap-2">
                <FileBarChart className="w-5 h-5 text-primary" /> Distribución por Sede
              </CardTitle>
              <CardDescription className="text-xs font-medium">Volumen de asistencias según filtros aplicados.</CardDescription>
            </div>
          </CardHeader>
          <CardContent className="p-8 h-[350px]">
            {dataSedes.length > 0 ? (
              <ResponsiveContainer width="100%" height="100%">
                <BarChart data={dataSedes}>
                  <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="#f1f5f9" />
                  <XAxis 
                    dataKey="name" 
                    axisLine={false} 
                    tickLine={false} 
                    tick={{fill: '#64748b', fontSize: 10, fontWeight: 700}} 
                  />
                  <YAxis axisLine={false} tickLine={false} tick={{fill: '#64748b', fontSize: 10}} />
                  <Tooltip 
                    cursor={{fill: '#f8fafc'}}
                    contentStyle={{borderRadius: '16px', border: 'none', boxShadow: '0 10px 15px -3px rgba(0,0,0,0.1)'}}
                  />
                  <Bar dataKey="value" radius={[10, 10, 0, 0]} barSize={40}>
                    {dataSedes.map((entry, index) => (
                      <Cell key={`cell-${index}`} fill={COLORS[index % COLORS.length]} />
                    ))}
                  </Bar>
                </BarChart>
              </ResponsiveContainer>
            ) : (
              <div className="h-full flex flex-col items-center justify-center opacity-30">
                <Search className="w-12 h-12 mb-2" />
                <p className="font-bold uppercase text-[10px]">Sin datos para esta selección</p>
              </div>
            )}
          </CardContent>
        </Card>

        <Card className="rounded-[2.5rem] border-slate-100 shadow-sm overflow-hidden bg-white">
          <CardHeader className="p-8 border-b border-slate-50">
            <CardTitle className="text-xl font-bold flex items-center gap-2">
              <TrendingUp className="w-5 h-5 text-primary" /> Tendencia Temporal
            </CardTitle>
            <CardDescription className="text-xs font-medium">Análisis de actividad laboral por día de la semana.</CardDescription>
          </CardHeader>
          <CardContent className="p-8 h-[350px]">
            {filteredAsistencias.length > 0 ? (
              <ResponsiveContainer width="100%" height="100%">
                <LineChart data={dataSemana}>
                  <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="#f1f5f9" />
                  <XAxis 
                    dataKey="day" 
                    axisLine={false} 
                    tickLine={false} 
                    tick={{fill: '#64748b', fontSize: 10, fontWeight: 700}} 
                  />
                  <YAxis axisLine={false} tickLine={false} tick={{fill: '#64748b', fontSize: 10}} />
                  <Tooltip 
                    contentStyle={{borderRadius: '16px', border: 'none', boxShadow: '0 10px 15px -3px rgba(0,0,0,0.1)'}}
                  />
                  <Line 
                    type="monotone" 
                    dataKey="asistencia" 
                    stroke="#FF4C5E" 
                    strokeWidth={4} 
                    dot={{ r: 6, fill: '#FF4C5E', strokeWidth: 0 }} 
                    activeDot={{ r: 8, strokeWidth: 0 }}
                  />
                </LineChart>
              </ResponsiveContainer>
            ) : (
              <div className="h-full flex flex-col items-center justify-center opacity-30">
                <TrendingUp className="w-12 h-12 mb-2" />
                <p className="font-bold uppercase text-[10px]">Sin registros en el historial</p>
              </div>
            )}
          </CardContent>
        </Card>
      </div>

      <Card className="rounded-[2.5rem] border-slate-100 shadow-sm bg-slate-50 border-dashed border-2">
        <CardContent className="p-12 text-center">
          <div className="max-w-md mx-auto space-y-4">
            <div className="w-16 h-16 bg-white rounded-3xl flex items-center justify-center mx-auto shadow-sm">
              <TrendingUp className="w-8 h-8 text-primary" />
            </div>
            <h3 className="text-xl font-bold text-slate-900 uppercase">Alertas Tempranas</h3>
            <p className="text-sm text-muted-foreground font-medium">
              El análisis dinámico permite identificar patrones de inasistencia críticos por materia o docente. Utiliza los filtros para refinar tu búsqueda y exportar reportes focalizados.
              {isSimulating && <span className="block mt-2 text-amber-600 font-bold">Estás viendo una vista previa simulada. Estos registros no existen en la base de datos real.</span>}
            </p>
          </div>
        </CardContent>
      </Card>
    </div>
  );
}
