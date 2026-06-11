
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
  GraduationCap
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

export default function DashboardPage() {
  const { user, isUserLoading } = useUser();
  const router = useRouter();
  const db = useFirestore();

  const [activeMatricula, setActiveMatricula] = useState<string | null>(null);
  const [demoRole, setDemoRole] = useState<string | null>(null);

  useEffect(() => {
    if (typeof window !== 'undefined') {
      setActiveMatricula(sessionStorage.getItem('active_matricula'));
      setDemoRole(sessionStorage.getItem('demo_role'));
    }
  }, []);

  const usersRef = useMemoFirebase(() => collection(db, 'users'), [db]);
  const sedesRef = useMemoFirebase(() => collection(db, 'sedes'), [db]);
  const asistenciasRef = useMemoFirebase(() => collection(db, 'asistencias'), [db]);
  const carrerasRef = useMemoFirebase(() => collection(db, 'carreras'), [db]);

  const { data: allUsers } = useCollection(usersRef);
  const { data: allSedes } = useCollection(sedesRef);
  const { data: allAsistencias } = useCollection(asistenciasRef);
  const { data: allCarreras } = useCollection(carrerasRef);

  // Estadísticas Rápidas
  const stats = useMemo(() => {
    const totalAlumnos = allUsers?.filter(u => u.role === 'Alumno').length || 0;
    const totalDocentes = allUsers?.filter(u => u.role === 'Docente').length || 0;
    const asistenciasHoy = allAsistencias?.filter(a => a.fecha === new Date().toISOString().split('T')[0]).length || 0;
    const sedesActivas = allSedes?.length || 0;

    return { totalAlumnos, totalDocentes, asistenciasHoy, sedesActivas };
  }, [allUsers, allAsistencias, allSedes]);

  // Datos para Gráfico de Sedes
  const dataSedes = useMemo(() => {
    if (!allSedes || !allAsistencias) return [];
    return allSedes.map(s => {
      // Nota: En un sistema real, los usuarios tendrían sedeId. 
      // Aquí simplificamos contando asistencias que ocurrieron en esa sede (asumiendo lógica de grupo->carrera->sede)
      const count = allAsistencias.length; // Placeholder real: filtrar asistencias por sede
      return { name: s.nombre, value: Math.floor(Math.random() * 100) + 20 }; // Data aleatoria para demo visual
    });
  }, [allSedes, allAsistencias]);

  // Datos para Gráfico de Asistencia Semanal
  const dataSemana = [
    { day: 'Lun', asistencia: 85 },
    { day: 'Mar', asistencia: 92 },
    { day: 'Mie', asistencia: 78 },
    { day: 'Jue', asistencia: 95 },
    { day: 'Vie', asistencia: 88 },
  ];

  const COLORS = ['#FF4C5E', '#1E293B', '#334155', '#475569', '#64748B'];

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
            <h1 className="text-3xl font-bold tracking-tight text-slate-900 uppercase">Inteligencia Administrativa</h1>
          </div>
          <p className="text-muted-foreground font-medium text-base">
            Monitoreo en tiempo real de la institución <span className="text-primary font-bold">SIBF - CAI</span>
          </p>
        </div>
      </div>

      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-6">
        <Card className="rounded-3xl border-none bg-slate-900 text-white shadow-lg shadow-slate-200">
          <CardContent className="p-6">
            <div className="flex items-center justify-between mb-4">
              <div className="bg-primary/20 p-2 rounded-xl"><GraduationCap className="w-6 h-6 text-primary" /></div>
              <span className="text-[10px] font-bold uppercase tracking-widest text-white/40">Total Alumnos</span>
            </div>
            <h3 className="text-4xl font-bold">{stats.totalAlumnos}</h3>
            <p className="text-[10px] font-bold text-green-400 mt-2 uppercase flex items-center gap-1">
              <TrendingUp className="w-3 h-3" /> +12% vs mes anterior
            </p>
          </CardContent>
        </Card>
        <Card className="rounded-3xl border-none bg-white shadow-sm border border-slate-100">
          <CardContent className="p-6">
            <div className="flex items-center justify-between mb-4">
              <div className="bg-slate-100 p-2 rounded-xl"><Users className="w-6 h-6 text-slate-600" /></div>
              <span className="text-[10px] font-bold uppercase tracking-widest text-slate-400">Docentes</span>
            </div>
            <h3 className="text-4xl font-bold text-slate-900">{stats.totalDocentes}</h3>
            <p className="text-[10px] font-bold text-slate-400 mt-2 uppercase">Activos en plataforma</p>
          </CardContent>
        </Card>
        <Card className="rounded-3xl border-none bg-white shadow-sm border border-slate-100">
          <CardContent className="p-6">
            <div className="flex items-center justify-between mb-4">
              <div className="bg-primary/10 p-2 rounded-xl"><CalendarCheck className="w-6 h-6 text-primary" /></div>
              <span className="text-[10px] font-bold uppercase tracking-widest text-slate-400">Asistencia Hoy</span>
            </div>
            <h3 className="text-4xl font-bold text-slate-900">{stats.asistenciasHoy}</h3>
            <p className="text-[10px] font-bold text-slate-400 mt-2 uppercase">Registros capturados</p>
          </CardContent>
        </Card>
        <Card className="rounded-3xl border-none bg-white shadow-sm border border-slate-100">
          <CardContent className="p-6">
            <div className="flex items-center justify-between mb-4">
              <div className="bg-slate-100 p-2 rounded-xl"><Building2 className="w-6 h-6 text-slate-600" /></div>
              <span className="text-[10px] font-bold uppercase tracking-widest text-slate-400">Sedes</span>
            </div>
            <h3 className="text-4xl font-bold text-slate-900">{stats.sedesActivas}</h3>
            <p className="text-[10px] font-bold text-slate-400 mt-2 uppercase">Campus vinculados</p>
          </CardContent>
        </Card>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
        <Card className="rounded-[2.5rem] border-slate-100 shadow-sm overflow-hidden bg-white">
          <CardHeader className="p-8 border-b border-slate-50 flex flex-row items-center justify-between">
            <div>
              <CardTitle className="text-xl font-bold flex items-center gap-2">
                <FileBarChart className="w-5 h-5 text-primary" /> Asistencia por Sede
              </CardTitle>
              <CardDescription className="text-xs font-medium">Distribución porcentual de participación estudiantil.</CardDescription>
            </div>
          </CardHeader>
          <CardContent className="p-8 h-[300px]">
            <ResponsiveContainer width="100%" height="100%">
              <BarChart data={dataSedes}>
                <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="#f1f5f9" />
                <XAxis 
                  dataKey="name" 
                  axisLine={false} 
                  tickLine={false} 
                  tick={{fill: '#64748b', fontSize: 10, fontWeight: 700}} 
                />
                <YAxis hide />
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
          </CardContent>
        </Card>

        <Card className="rounded-[2.5rem] border-slate-100 shadow-sm overflow-hidden bg-white">
          <CardHeader className="p-8 border-b border-slate-50">
            <CardTitle className="text-xl font-bold flex items-center gap-2">
              <TrendingUp className="w-5 h-5 text-primary" /> Tendencia Semanal
            </CardTitle>
            <CardDescription className="text-xs font-medium">Porcentaje de asistencia grupal últimos 5 días.</CardDescription>
          </CardHeader>
          <CardContent className="p-8 h-[300px]">
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
          </CardContent>
        </Card>
      </div>

      <Card className="rounded-[2.5rem] border-slate-100 shadow-sm bg-slate-50 border-dashed border-2">
        <CardContent className="p-12 text-center">
          <div className="max-w-md mx-auto space-y-4">
            <div className="w-16 h-16 bg-white rounded-3xl flex items-center justify-center mx-auto shadow-sm">
              <TrendingUp className="w-8 h-8 text-primary" />
            </div>
            <h3 className="text-xl font-bold text-slate-900 uppercase">Análisis Predictivo</h3>
            <p className="text-sm text-muted-foreground font-medium">
              Próximamente: El sistema identificará automáticamente a los alumnos con riesgo de deserción basado en su patrón de inasistencias y retardos históricos.
            </p>
          </div>
        </CardContent>
      </Card>
    </div>
  );
}

