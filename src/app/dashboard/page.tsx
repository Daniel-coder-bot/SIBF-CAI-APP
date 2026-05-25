
"use client";

import React, { useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { 
  Users, 
  GraduationCap, 
  Briefcase, 
  Clock, 
  TrendingUp,
  AlertCircle,
  FileText,
  UserCheck
} from 'lucide-react';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { 
  Bar, 
  BarChart, 
  ResponsiveContainer, 
  XAxis, 
  YAxis, 
  CartesianGrid, 
  Tooltip,
  Cell
} from 'recharts';
import { cn } from "@/lib/utils";
import { useUser } from '@/firebase';

const stats = [
  { title: "Total Alumnos", value: "1,248", icon: GraduationCap, color: "bg-primary", trend: "+12%" },
  { title: "Docentes Activos", value: "84", icon: Briefcase, color: "bg-slate-900", trend: "+2%" },
  { title: "Asistencia Hoy", value: "92%", icon: UserCheck, color: "bg-primary/80", trend: "+5%" },
  { title: "Reportes Pendientes", value: "12", icon: FileText, color: "bg-slate-800", trend: "Reciente" },
];

const attendanceData = [
  { day: 'Lun', value: 85 },
  { day: 'Mar', value: 92 },
  { day: 'Mie', value: 88 },
  { day: 'Jue', value: 95 },
  { day: 'Vie', value: 90 },
];

export default function DashboardPage() {
  const { user, isUserLoading } = useUser();
  const router = useRouter();

  useEffect(() => {
    // Si no es un administrador real, redirigir a sus paneles correspondientes
    if (!isUserLoading && user?.isAnonymous) {
      router.push('/dashboard/docente/asistencia');
    }
  }, [user, isUserLoading, router]);

  if (isUserLoading || user?.isAnonymous) {
    return null;
  }

  return (
    <div className="space-y-8 animate-in fade-in duration-700">
      <div className="flex flex-col md:flex-row md:items-end justify-between gap-4 border-b border-slate-100 pb-8">
        <div>
          <div className="flex items-center gap-3 mb-2">
            <div className="w-1.5 h-8 bg-primary rounded-full" />
            <h1 className="text-3xl font-bold tracking-tight text-slate-900 uppercase">Panel Institucional</h1>
          </div>
          <p className="text-muted-foreground font-medium text-base">
            Control Global <span className="text-primary font-bold">SIBF - CAI</span> | Gestión Administrativa
          </p>
        </div>
        <div className="flex items-center gap-3 bg-slate-50 p-4 rounded-2xl border border-slate-100 px-6">
          <Clock className="w-5 h-5 text-primary" />
          <span className="text-xs font-bold uppercase tracking-widest text-slate-700">
            {new Date().toLocaleDateString('es-ES', { weekday: 'long', day: 'numeric', month: 'long' })}
          </span>
        </div>
      </div>

      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-6">
        {stats.map((stat, i) => (
          <Card key={i} className="border border-slate-100 shadow-sm overflow-hidden group hover:shadow-md transition-all duration-300 rounded-3xl bg-white">
            <CardContent className="p-6">
              <div className="flex items-start justify-between">
                <div className="space-y-1">
                  <p className="text-[9px] font-bold text-muted-foreground uppercase tracking-widest">{stat.title}</p>
                  <h3 className="text-3xl font-bold tracking-tighter text-slate-900">{stat.value}</h3>
                  <div className="flex items-center pt-2">
                    <span className="text-[9px] font-bold text-primary bg-primary/5 px-2 py-0.5 rounded-full flex items-center tracking-widest uppercase">
                      {stat.trend}
                    </span>
                  </div>
                </div>
                <div className={cn("p-4 rounded-xl text-white shadow-lg transition-all duration-300", stat.color)}>
                  <stat.icon className="w-6 h-6" />
                </div>
              </div>
            </CardContent>
          </Card>
        ))}
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
        <Card className="lg:col-span-2 border border-slate-100 shadow-sm rounded-3xl overflow-hidden bg-white">
          <CardHeader className="bg-slate-50/30 border-b border-slate-100 p-6">
            <CardTitle className="text-lg font-bold text-slate-900">Estadísticas de Asistencia</CardTitle>
            <CardDescription className="text-[9px] uppercase font-bold tracking-widest text-muted-foreground">Promedio semanal de presencia en el campus</CardDescription>
          </CardHeader>
          <CardContent className="h-[350px] pt-8 px-6">
            <ResponsiveContainer width="100%" height="100%">
              <BarChart data={attendanceData}>
                <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="#f1f5f9" />
                <XAxis 
                  dataKey="day" 
                  axisLine={false} 
                  tickLine={false} 
                  tick={{fill: '#94a3b8', fontSize: 11, fontWeight: 600}}
                />
                <YAxis 
                  axisLine={false} 
                  tickLine={false} 
                  tick={{fill: '#94a3b8', fontSize: 11, fontWeight: 600}}
                  domain={[0, 100]}
                />
                <Tooltip 
                  cursor={{fill: 'rgba(0, 0, 0, 0.02)', radius: 8}}
                  contentStyle={{borderRadius: '16px', border: 'none', boxShadow: '0 10px 15px -3px rgba(0,0,0,0.1)', fontWeight: '600'}}
                />
                <Bar dataKey="value" radius={[8, 8, 0, 0]} barSize={40}>
                  {attendanceData.map((entry, index) => (
                    <Cell 
                      key={`cell-${index}`} 
                      fill={entry.value > 90 ? 'hsl(var(--primary))' : 'hsl(var(--slate-900))'} 
                    />
                  ))}
                </Bar>
              </BarChart>
            </ResponsiveContainer>
          </CardContent>
        </Card>

        <Card className="border border-slate-100 shadow-sm rounded-3xl flex flex-col bg-white overflow-hidden">
          <CardHeader className="bg-slate-900 text-white p-6">
            <CardTitle className="text-lg font-bold flex items-center gap-2">
              <AlertCircle className="w-5 h-5 text-primary" />
              Alertas Recientes
            </CardTitle>
          </CardHeader>
          <CardContent className="space-y-6 pt-6 flex-1 px-6">
            {[
              { title: "Baja Asistencia", desc: "Ing. de Minas bajó un 15% hoy.", time: "Hace 5 min", urgent: true },
              { title: "Nuevo Docente", desc: "Dr. Alan Turing registrado.", time: "Hace 1h", urgent: false },
              { title: "Mantenimiento", desc: "Cámaras pasillo B en calibración.", time: "Hace 3h", urgent: true },
              { title: "Backup", desc: "Respaldo semanal exitoso.", time: "Hoy 04:00 AM", urgent: false },
            ].map((item, i) => (
              <div key={i} className="flex items-start gap-4 p-3 rounded-2xl hover:bg-slate-50 transition-all group">
                <div className={cn("w-2 h-2 mt-2 rounded-full flex-shrink-0", item.urgent ? "bg-primary" : "bg-slate-200")} />
                <div className="flex-1 space-y-0.5">
                  <p className="text-sm font-bold text-slate-900">{item.title}</p>
                  <p className="text-[11px] text-muted-foreground font-medium leading-tight">{item.desc}</p>
                  <p className="text-[8px] text-primary font-bold uppercase tracking-widest pt-1">{item.time}</p>
                </div>
              </div>
            ))}
          </CardContent>
        </Card>
      </div>
    </div>
  );
}
