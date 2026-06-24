
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
  ZapOff,
  BarChart3,
  PieChart as PieChartIcon
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
  Line,
  Legend
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

  // Generador de datos de simulación mejorado
  const handleToggleSimulation = () => {
    if (isSimulating) {
      setIsSimulating(false);
      setSimulatedData([]);
      toast({ title: "Modo Real", description: "Mostrando datos reales de la base de datos." });
      return;
    }

    // Si no hay datos base, usamos datos ficticios de referencia para la simulación
    const baseSedes = allSedes?.length ? allSedes : [{id: 's1', nombre: 'Sede Norte'}, {id: 's2', nombre: 'Sede Sur'}];
    const baseCarreras = allCarreras?.length ? allCarreras : [{id: 'c1', nombre: 'Ingeniería', sedeId: 's1'}, {id: 'c2', nombre: 'Derecho', sedeId: 's2'}];
    const baseMaterias = allMaterias?.length ? allMaterias : [{id: 'm1', nombre: 'IA', carreraId: 'c1'}, {id: 'm2', nombre: 'Civil', carreraId: 'c2'}];
    const baseGrupos = allGrupos?.length ? allGrupos : [{id: 'g1', nombre: 'A1', carreraId: 'c1'}, {id: 'g2', nombre: 'B1', carreraId: 'c2'}];
    const baseDocentes = docentes.length ? docentes : [{id: 'd1', firstName: 'Dr.', lastName: 'Simulado'}];

    const mockRecords = [];
    const states: ('Presente' | 'Retraso' | 'Falta')[] = ['Presente', 'Presente', 'Presente', 'Retraso', 'Falta'];
    const months = ['2025-01', '2025-02', '2025-03', '2025-04'];
    
    // Generamos 500 registros aleatorios
    for (let i = 0; i < 500; i++) {
      const randomMateria = baseMaterias[Math.floor(Math.random() * baseMaterias.length)];
      const randomGrupo = baseGrupos[Math.floor(Math.random() * baseGrupos.length)];
      const randomDocente = baseDocentes[Math.floor(Math.random() * baseDocentes.length)]?.id || 'd1';
      const randomState = states[Math.floor(Math.random() * states.length)];
      const randomMonth = months[Math.floor(Math.random() * months.length)];
      const randomDay = Math.floor(Math.random() * 28) + 1;
      const dateStr = `${randomMonth}-${randomDay.toString().padStart(2, '0')}`;

      mockRecords.push({
        id: `sim-${i}`,
        materiaId: randomMateria.id,
        grupoId: randomGrupo.id,
        docenteId: randomDocente,
        alumnoId: `alumno-sim-${Math.floor(Math.random() * 100)}`,
        fecha: dateStr,
        estado: randomState,
        createdAt: { toDate: () => new Date(dateStr) }
      });
    }

    setSimulatedData(mockRecords);
    setIsSimulating(true);
    toast({ title: "Modo Simulación Activo", description: "Se han generado 500 registros para pruebas analíticas multidimensionales." });
  };

  // Base de datos de trabajo
  const currentDataPool = isSimulating ? simulatedData : (allAsistencias || []);

  // Aplicación de Filtros
  const filteredAsistencias = useMemo(() => {
    return currentDataPool.filter(a => {
      // Intentar encontrar relaciones (incluso en simulación)
      const materia = allMaterias?.find(m => m.id === a.materiaId);
      const carrera = allCarreras?.find(c => c.id === (materia?.carreraId || a.carreraId));
      
      const matchesSede = filterSede === "all" || (carrera && carrera.sedeId === filterSede);
      const matchesCarrera = filterCarrera === "all" || a.carreraId === filterCarrera || (materia && materia.carreraId === filterCarrera);
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
    const sedesToUse = allSedes?.length ? allSedes : [{id: 's1', nombre: 'Sede Norte'}, {id: 's2', nombre: 'Sede Sur'}];
    return sedesToUse.map(s => {
      const count = filteredAsistencias.filter(a => {
        const materia = allMaterias?.find(m => m.id === a.materiaId);
        const carrera = allCarreras?.find(c => c.id === (materia?.carreraId));
        return carrera?.sedeId === s.id;
      }).length;
      return { name: s.nombre, value: count };
    }).filter(d => d.value > 0);
  }, [allSedes, filteredAsistencias, allMaterias, allCarreras]);

  // Datos para Tendencia Temporal
  const dataTendencia = useMemo(() => {
    const dias = ['Lun', 'Mar', 'Mie', 'Jue', 'Vie'];
    const counts = dias.map(d => ({ day: d, asistencia: 0, faltas: 0 }));
    
    filteredAsistencias.forEach(a => {
      const date = new Date(a.fecha);
      if (!isNaN(date.getTime())) {
        const dayIdx = date.getDay() - 1; // 0 para lunes
        if (dayIdx >= 0 && dayIdx < 5) {
          if (a.estado === 'Presente' || a.estado === 'Retraso') counts[dayIdx].asistencia++;
          else counts[dayIdx].faltas++;
        }
      }
    });

    return counts;
  }, [filteredAsistencias]);

  // Datos para Distribución por Carreras
  const dataCarreras = useMemo(() => {
    const carrerasToUse = allCarreras?.length ? allCarreras : [];
    return carrerasToUse.map(c => {
      const count = filteredAsistencias.filter(a => {
        const materia = allMaterias?.find(m => m.id === a.materiaId);
        return (materia?.carreraId === c.id) || (a.carreraId === c.id);
      }).length;
      return { name: c.nombre, count };
    }).filter(d => d.count > 0).sort((a, b) => b.count - a.count).slice(0, 5);
  }, [allCarreras, filteredAsistencias, allMaterias]);

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
        Alumno: alumno ? `${alumno.firstName} ${alumno.lastName}` : 'Alumno Simulado',
        Matricula: alumno?.matricula || 'N/A',
        Materia: materia?.nombre || 'N/A',
        Grupo: grupo?.nombre || 'N/A',
        Estado: a.estado,
        Tipo: isSimulating ? 'SIMULADO' : 'REAL'
      };
    });

    const worksheet = XLSX.utils.json_to_sheet(exportData);
    const workbook = XLSX.utils.book_new();
    XLSX.utils.book_append_sheet(workbook, worksheet, "Analitica");
    XLSX.writeFile(workbook, `SIBF_CAI_Analitica_${isSimulating ? 'Sim' : 'Real'}_${new Date().toISOString().split('T')[0]}.xlsx`);
    
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
            <h1 className="text-3xl font-bold tracking-tight text-slate-900 uppercase flex items-center gap-2 font-headline">
              Inteligencia de Datos
              {isSimulating && <Badge className="bg-amber-500 animate-pulse text-white border-none ml-2 uppercase font-bold text-[9px] tracking-widest px-3">Modo Prueba</Badge>}
            </h1>
          </div>
          <p className="text-muted-foreground font-medium text-sm">
            Analítica multidimensional y comparativas institucionales <span className="text-primary font-bold">SIBF - CAI</span>
          </p>
        </div>
        <div className="flex flex-wrap gap-2">
          <Button 
            onClick={handleToggleSimulation}
            variant={isSimulating ? "destructive" : "secondary"}
            className="h-12 rounded-xl px-6 text-[10px] font-bold uppercase tracking-widest shadow-lg transition-all"
          >
            {isSimulating ? <ZapOff className="w-5 h-5 mr-2" /> : <Zap className="w-5 h-5 mr-2" />}
            {isSimulating ? "Salir de Simulación" : "Modo Simulación (Prueba)"}
          </Button>
          <Button 
            onClick={handleExportFilteredData}
            variant="outline" 
            className="h-12 rounded-xl px-6 border-slate-200 bg-white text-[10px] font-bold uppercase tracking-widest text-slate-600 hover:bg-slate-50 shadow-sm"
          >
            <Download className="w-4 h-4 mr-2 text-primary" /> Exportar Vista
          </Button>
        </div>
      </div>

      <Card className="rounded-[2rem] border-none shadow-xl bg-white p-8">
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-6 gap-6">
          <div className="space-y-2">
            <Label className="text-[9px] font-bold uppercase text-muted-foreground ml-1 tracking-widest">Sede</Label>
            <Select value={filterSede} onValueChange={setFilterSede}>
              <SelectTrigger className="rounded-xl h-12 border-none bg-slate-50 shadow-inner font-semibold text-xs"><SelectValue placeholder="Todas" /></SelectTrigger>
              <SelectContent>
                <SelectItem value="all">Todas las Sedes</SelectItem>
                {allSedes?.map(s => <SelectItem key={s.id} value={s.id}>{s.nombre}</SelectItem>)}
              </SelectContent>
            </Select>
          </div>

          <div className="space-y-2">
            <Label className="text-[9px] font-bold uppercase text-muted-foreground ml-1 tracking-widest">Carrera</Label>
            <Select value={filterCarrera} onValueChange={setFilterCarrera}>
              <SelectTrigger className="rounded-xl h-12 border-none bg-slate-50 shadow-inner font-semibold text-xs"><SelectValue placeholder="Todas" /></SelectTrigger>
              <SelectContent>
                <SelectItem value="all">Todas las Carreras</SelectItem>
                {allCarreras?.filter(c => filterSede === 'all' || c.sedeId === filterSede).map(c => <SelectItem key={c.id} value={c.id}>{c.nombre}</SelectItem>)}
              </SelectContent>
            </Select>
          </div>

          <div className="space-y-2">
            <Label className="text-[9px] font-bold uppercase text-muted-foreground ml-1 tracking-widest">Docente</Label>
            <Select value={filterDocente} onValueChange={setFilterDocente}>
              <SelectTrigger className="rounded-xl h-12 border-none bg-slate-50 shadow-inner font-semibold text-xs"><SelectValue placeholder="Todos" /></SelectTrigger>
              <SelectContent>
                <SelectItem value="all">Todos los Docentes</SelectItem>
                {docentes.map(d => <SelectItem key={d.id} value={d.id}>{d.firstName} {d.lastName}</SelectItem>)}
              </SelectContent>
            </Select>
          </div>

          <div className="space-y-2">
            <Label className="text-[9px] font-bold uppercase text-muted-foreground ml-1 tracking-widest">Materia</Label>
            <Select value={filterMateria} onValueChange={setFilterMateria}>
              <SelectTrigger className="rounded-xl h-12 border-none bg-slate-50 shadow-inner font-semibold text-xs"><SelectValue placeholder="Todas" /></SelectTrigger>
              <SelectContent>
                <SelectItem value="all">Todas las Materias</SelectItem>
                {allMaterias?.filter(m => filterCarrera === 'all' || m.carreraId === filterCarrera).map(m => <SelectItem key={m.id} value={m.id}>{m.nombre}</SelectItem>)}
              </SelectContent>
            </Select>
          </div>

          <div className="space-y-2">
            <Label className="text-[9px] font-bold uppercase text-muted-foreground ml-1 tracking-widest">Grupo</Label>
            <Select value={filterGrupo} onValueChange={setFilterGrupo}>
              <SelectTrigger className="rounded-xl h-12 border-none bg-slate-50 shadow-inner font-semibold text-xs"><SelectValue placeholder="Todos" /></SelectTrigger>
              <SelectContent>
                <SelectItem value="all">Todos los Grupos</SelectItem>
                {allGrupos?.filter(g => filterCarrera === 'all' || g.carreraId === filterCarrera).map(g => <SelectItem key={g.id} value={g.id}>{g.nombre}</SelectItem>)}
              </SelectContent>
            </Select>
          </div>

          <div className="space-y-2">
            <Label className="text-[9px] font-bold uppercase text-muted-foreground ml-1 tracking-widest">Mes</Label>
            <Select value={filterMes} onValueChange={setFilterMes}>
              <SelectTrigger className="rounded-xl h-12 border-none bg-slate-50 shadow-inner font-semibold text-xs"><SelectValue placeholder="Cualquier" /></SelectTrigger>
              <SelectContent>
                <SelectItem value="all">Histórico Completo</SelectItem>
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
        <Card className="rounded-3xl border-none bg-slate-900 text-white shadow-xl group hover:scale-105 transition-transform cursor-default">
          <CardContent className="p-8">
            <div className="flex items-center justify-between mb-4">
              <div className="bg-primary/20 p-3 rounded-2xl"><CalendarCheck className="w-6 h-6 text-primary" /></div>
              <span className="text-[9px] font-bold uppercase tracking-widest text-white/40">Presentes</span>
            </div>
            <h3 className="text-4xl font-bold font-headline">{stats.presentes}</h3>
            <p className="text-[10px] font-bold text-green-400 mt-2 uppercase tracking-tight flex items-center gap-1">
              <TrendingUp className="w-3 h-3" /> Puntualidad: {stats.indicePuntualidad}%
            </p>
          </CardContent>
        </Card>
        <Card className="rounded-3xl border-none bg-white shadow-sm hover:shadow-md transition-shadow">
          <CardContent className="p-8">
            <div className="flex items-center justify-between mb-4">
              <div className="bg-amber-100 p-3 rounded-2xl"><AlertCircle className="w-6 h-6 text-amber-600" /></div>
              <span className="text-[9px] font-bold uppercase tracking-widest text-slate-400">Retardos</span>
            </div>
            <h3 className="text-4xl font-bold text-slate-900 font-headline">{stats.retardos}</h3>
            <p className="text-[10px] font-bold text-slate-400 mt-2 uppercase">Incidencias de tiempo</p>
          </CardContent>
        </Card>
        <Card className="rounded-3xl border-none bg-white shadow-sm hover:shadow-md transition-shadow">
          <CardContent className="p-8">
            <div className="flex items-center justify-between mb-4">
              <div className="bg-red-50 p-3 rounded-2xl"><AlertCircle className="w-6 h-6 text-red-600" /></div>
              <span className="text-[9px] font-bold uppercase tracking-widest text-slate-400">Faltas</span>
            </div>
            <h3 className="text-4xl font-bold text-slate-900 font-headline">{stats.faltas}</h3>
            <p className="text-[10px] font-bold text-red-600 mt-2 uppercase tracking-tight">Ausentismo acumulado</p>
          </CardContent>
        </Card>
        <Card className="rounded-3xl border-none bg-white shadow-sm hover:shadow-md transition-shadow">
          <CardContent className="p-8">
            <div className="flex items-center justify-between mb-4">
              <div className="bg-slate-100 p-3 rounded-2xl"><Briefcase className="w-6 h-6 text-slate-600" /></div>
              <span className="text-[9px] font-bold uppercase tracking-widest text-slate-400">Personal</span>
            </div>
            <h3 className="text-4xl font-bold text-slate-900 font-headline">{docentes.length}</h3>
            <p className="text-[10px] font-bold text-slate-400 mt-2 uppercase">Docentes activos</p>
          </CardContent>
        </Card>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
        {/* Gráfico 1: Sedes */}
        <Card className="rounded-[2.5rem] border-slate-100 shadow-xl overflow-hidden bg-white group">
          <CardHeader className="p-8 border-b border-slate-50 flex flex-row items-center justify-between">
            <div>
              <CardTitle className="text-xl font-bold flex items-center gap-2 font-headline">
                <Building2 className="w-5 h-5 text-primary" /> Comparativa por Sede
              </CardTitle>
              <CardDescription className="text-xs font-medium">Volumen de actividad académica por campus.</CardDescription>
            </div>
            <BarChart3 className="w-6 h-6 text-slate-200 group-hover:text-primary transition-colors" />
          </CardHeader>
          <CardContent className="p-8 h-[380px]">
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
                    contentStyle={{borderRadius: '16px', border: 'none', boxShadow: '0 20px 25px -5px rgba(0,0,0,0.1)'}}
                  />
                  <Bar dataKey="value" radius={[12, 12, 0, 0]} barSize={50}>
                    {dataSedes.map((entry, index) => (
                      <Cell key={`cell-${index}`} fill={COLORS[index % COLORS.length]} />
                    ))}
                  </Bar>
                </BarChart>
              </ResponsiveContainer>
            ) : (
              <div className="h-full flex flex-col items-center justify-center opacity-30">
                <Search className="w-12 h-12 mb-2" />
                <p className="font-bold uppercase text-[10px] tracking-widest">Sin datos para la selección</p>
              </div>
            )}
          </CardContent>
        </Card>

        {/* Gráfico 2: Tendencia */}
        <Card className="rounded-[2.5rem] border-slate-100 shadow-xl overflow-hidden bg-white group">
          <CardHeader className="p-8 border-b border-slate-50 flex flex-row items-center justify-between">
            <div>
              <CardTitle className="text-xl font-bold flex items-center gap-2 font-headline">
                <TrendingUp className="w-5 h-5 text-primary" /> Tendencia de la Semana
              </CardTitle>
              <CardDescription className="text-xs font-medium">Flujo de asistencia y ausentismo semanal.</CardDescription>
            </div>
            <TrendingUp className="w-6 h-6 text-slate-200 group-hover:text-primary transition-colors" />
          </CardHeader>
          <CardContent className="p-8 h-[380px]">
            {filteredAsistencias.length > 0 ? (
              <ResponsiveContainer width="100%" height="100%">
                <LineChart data={dataTendencia}>
                  <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="#f1f5f9" />
                  <XAxis 
                    dataKey="day" 
                    axisLine={false} 
                    tickLine={false} 
                    tick={{fill: '#64748b', fontSize: 10, fontWeight: 700}} 
                  />
                  <YAxis axisLine={false} tickLine={false} tick={{fill: '#64748b', fontSize: 10}} />
                  <Tooltip 
                    contentStyle={{borderRadius: '20px', border: 'none', boxShadow: '0 25px 30px -10px rgba(0,0,0,0.15)'}}
                  />
                  <Legend verticalAlign="top" align="right" iconType="circle" wrapperStyle={{fontSize: '10px', fontWeight: 'bold', paddingBottom: '20px'}} />
                  <Line 
                    name="Asistencia"
                    type="monotone" 
                    dataKey="asistencia" 
                    stroke="#FF4C5E" 
                    strokeWidth={5} 
                    dot={{ r: 6, fill: '#FF4C5E', strokeWidth: 0 }} 
                    activeDot={{ r: 8, strokeWidth: 0 }}
                  />
                  <Line 
                    name="Faltas"
                    type="monotone" 
                    dataKey="faltas" 
                    stroke="#1E293B" 
                    strokeWidth={3} 
                    strokeDasharray="5 5"
                    dot={{ r: 4, fill: '#1E293B', strokeWidth: 0 }} 
                  />
                </LineChart>
              </ResponsiveContainer>
            ) : (
              <div className="h-full flex flex-col items-center justify-center opacity-30">
                <TrendingUp className="w-12 h-12 mb-2" />
                <p className="font-bold uppercase text-[10px] tracking-widest">Esperando registros</p>
              </div>
            )}
          </CardContent>
        </Card>

        {/* Gráfico 3: Top Carreras */}
        <Card className="rounded-[2.5rem] border-slate-100 shadow-xl overflow-hidden bg-white lg:col-span-2 group">
          <CardHeader className="p-8 border-b border-slate-50 flex flex-row items-center justify-between">
            <div>
              <CardTitle className="text-xl font-bold flex items-center gap-2 font-headline">
                <GraduationCap className="w-5 h-5 text-primary" /> Actividad por Carrera (Top 5)
              </CardTitle>
              <CardDescription className="text-xs font-medium">Comparativa de carga académica y registros totales.</CardDescription>
            </div>
            <PieChartIcon className="w-6 h-6 text-slate-200 group-hover:text-primary transition-colors" />
          </CardHeader>
          <CardContent className="p-8 h-[350px] flex flex-col md:flex-row items-center justify-around">
            {dataCarreras.length > 0 ? (
              <>
                <div className="w-full md:w-1/2 h-full">
                  <ResponsiveContainer width="100%" height="100%">
                    <BarChart data={dataCarreras} layout="vertical">
                      <CartesianGrid strokeDasharray="3 3" horizontal={false} stroke="#f1f5f9" />
                      <XAxis type="number" hide />
                      <YAxis 
                        dataKey="name" 
                        type="category" 
                        width={120}
                        axisLine={false} 
                        tickLine={false} 
                        tick={{fill: '#1e293b', fontSize: 10, fontWeight: 700}} 
                      />
                      <Tooltip cursor={{fill: 'transparent'}} />
                      <Bar dataKey="count" radius={[0, 10, 10, 0]} barSize={25}>
                        {dataCarreras.map((entry, index) => (
                          <Cell key={`cell-${index}`} fill={COLORS[index % COLORS.length]} />
                        ))}
                      </Bar>
                    </BarChart>
                  </ResponsiveContainer>
                </div>
                <div className="w-full md:w-1/3 space-y-4 mt-6 md:mt-0">
                  <h4 className="text-[10px] font-bold uppercase text-muted-foreground tracking-[0.2em] mb-4">Métricas de Rendimiento</h4>
                  {dataCarreras.map((c, i) => (
                    <div key={i} className="flex items-center justify-between border-b pb-2">
                       <div className="flex items-center gap-2">
                         <div className="w-2 h-2 rounded-full" style={{backgroundColor: COLORS[i % COLORS.length]}} />
                         <span className="text-xs font-bold text-slate-700">{c.name}</span>
                       </div>
                       <Badge variant="outline" className="text-[10px] font-bold">{c.count} reg.</Badge>
                    </div>
                  ))}
                </div>
              </>
            ) : (
              <p className="text-slate-400 font-bold uppercase text-[10px]">Sin pases de lista registrados</p>
            )}
          </CardContent>
        </Card>
      </div>

      {/* Alerta de Modo Simulación */}
      {isSimulating && (
        <Card className="rounded-[2.5rem] border-amber-200 bg-amber-50 border-2 shadow-inner">
          <CardContent className="p-10 text-center">
             <div className="max-w-2xl mx-auto space-y-4">
                <div className="w-16 h-16 bg-white rounded-3xl flex items-center justify-center mx-auto shadow-md">
                  <Zap className="w-8 h-8 text-amber-500" />
                </div>
                <h3 className="text-2xl font-bold text-amber-900 uppercase tracking-tight font-headline">Datos en Memoria Volátil</h3>
                <p className="text-sm text-amber-800 font-medium leading-relaxed">
                  Estás operando con <span className="font-bold">500 registros simulados</span>. Estos datos permiten validar la reactividad de los gráficos y la precisión de los filtros multidimensionales sin afectar la base de datos real. 
                  <span className="block mt-2 font-bold italic">La exportación a Excel en este modo generará un reporte de la simulación.</span>
                </p>
                <Button onClick={handleToggleSimulation} className="bg-amber-600 hover:bg-amber-700 text-white rounded-xl h-12 px-10 font-bold uppercase tracking-widest text-[10px]">
                  Desactivar Simulación
                </Button>
             </div>
          </CardContent>
        </Card>
      )}
    </div>
  );
}
