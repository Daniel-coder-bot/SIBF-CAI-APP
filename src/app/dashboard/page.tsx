
"use client";

import React from 'react';
import { 
  Users, 
  GraduationCap, 
  Briefcase, 
  CheckCircle2, 
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

const stats = [
  { title: "Total Alumnos", value: "1,248", icon: GraduationCap, color: "bg-primary", trend: "+12%" },
  { title: "Docentes Activos", value: "84", icon: Briefcase, color: "bg-accent", trend: "+2%" },
  { title: "Asistencia Hoy", value: "92%", icon: UserCheck, color: "bg-slate-900", trend: "+5%" },
  { title: "Reportes Pendientes", value: "12", icon: FileText, color: "bg-secondary", trend: "Reciente" },
];

const attendanceData = [
  { day: 'Lun', value: 85 },
  { day: 'Mar', value: 92 },
  { day: 'Mie', value: 88 },
  { day: 'Jue', value: 95 },
  { day: 'Vie', value: 90 },
];

export default function DashboardPage() {
  return (
    <div className="space-y-8 animate-in fade-in duration-700">
      <div className="flex flex-col md:flex-row md:items-end justify-between gap-4 border-b border-border/50 pb-8">
        <div>
          <div className="flex items-center gap-3 mb-2">
            <div className="w-2 h-10 bg-primary rounded-full shadow-lg shadow-primary/20" />
            <h1 className="text-4xl font-bold tracking-tight text-foreground uppercase">Panel de Control</h1>
          </div>
          <p className="text-muted-foreground font-medium text-lg">
            Sistema Institucional <span className="text-primary font-bold">SIBF - CAI</span> | Centro de Estudios Avanzados
          </p>
        </div>
        <div className="flex items-center gap-4 bg-white p-4 rounded-[2rem] shadow-xl shadow-slate-200/50 border border-border/60 px-8">
          <Clock className="w-6 h-6 text-primary" />
          <span className="text-sm font-bold uppercase tracking-widest text-slate-800">
            {new Date().toLocaleDateString('es-ES', { weekday: 'long', day: 'numeric', month: 'long' })}
          </span>
        </div>
      </div>

      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-8">
        {stats.map((stat, i) => (
          <Card key={i} className="border border-border/40 shadow-sm overflow-hidden group hover:shadow-2xl transition-all duration-500 rounded-[2.5rem] bg-white">
            <CardContent className="p-8">
              <div className="flex items-start justify-between">
                <div className="space-y-2">
                  <p className="text-[10px] font-bold text-muted-foreground uppercase tracking-[0.2em]">{stat.title}</p>
                  <h3 className="text-4xl font-bold tracking-tighter text-slate-900">{stat.value}</h3>
                  <div className="flex items-center pt-2">
                    <span className="text-[10px] font-bold text-primary bg-primary/5 px-3 py-1 rounded-full border border-primary/10 flex items-center tracking-widest uppercase">
                      <TrendingUp className="w-3.5 h-3.5 mr-1.5" />
                      {stat.trend}
                    </span>
                  </div>
                </div>
                <div className={cn("p-5 rounded-2xl text-white shadow-2xl transform group-hover:scale-110 group-hover:rotate-3 transition-all duration-500", stat.color)}>
                  <stat.icon className="w-8 h-8" />
                </div>
              </div>
            </CardContent>
          </Card>
        ))}
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-10">
        <Card className="lg:col-span-2 border border-border/40 shadow-sm rounded-[3rem] overflow-hidden bg-white">
          <CardHeader className="bg-slate-50/50 border-b border-border/40 p-8">
            <CardTitle className="text-xl font-bold text-slate-900">Monitor de Asistencia Semanal</CardTitle>
            <CardDescription className="text-[10px] uppercase font-bold tracking-[0.2em] text-muted-foreground">Consolidado general de presencia en campus institucional</CardDescription>
          </CardHeader>
          <CardContent className="h-[400px] pt-10 px-8">
            <ResponsiveContainer width="100%" height="100%">
              <BarChart data={attendanceData}>
                <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="#f1f5f9" />
                <XAxis 
                  dataKey="day" 
                  axisLine={false} 
                  tickLine={false} 
                  tick={{fill: '#64748b', fontSize: 12, fontWeight: 700}}
                />
                <YAxis 
                  axisLine={false} 
                  tickLine={false} 
                  tick={{fill: '#64748b', fontSize: 12, fontWeight: 700}}
                  domain={[0, 100]}
                />
                <Tooltip 
                  cursor={{fill: 'rgba(255, 31, 45, 0.05)', radius: 12}}
                  contentStyle={{borderRadius: '24px', border: 'none', boxShadow: '0 25px 50px -12px rgba(0,0,0,0.15)', fontWeight: '700', padding: '16px'}}
                />
                <Bar dataKey="value" radius={[14, 14, 0, 0]} barSize={50}>
                  {attendanceData.map((entry, index) => (
                    <Cell 
                      key={`cell-${index}`} 
                      fill={entry.value > 90 ? 'hsl(var(--primary))' : 'hsl(var(--accent))'} 
                      className="hover:opacity-80 transition-opacity"
                    />
                  ))}
                </Bar>
              </BarChart>
            </ResponsiveContainer>
          </CardContent>
        </Card>

        <Card className="border border-border/40 shadow-sm rounded-[3rem] flex flex-col bg-white overflow-hidden">
          <CardHeader className="bg-slate-900 text-white p-8">
            <CardTitle className="text-xl font-bold flex items-center gap-3">
              <AlertCircle className="w-6 h-6 text-primary" />
              Notificaciones
            </CardTitle>
          </CardHeader>
          <CardContent className="space-y-8 pt-8 flex-1 px-8">
            {[
              { title: "Baja Asistencia", desc: "Ingeniería de Minas bajó un 15% hoy.", time: "Hace 5 min", urgent: true },
              { title: "Nuevo Docente", desc: "Registro completado: Dr. Alan Turing.", time: "Hace 1h", urgent: false },
              { title: "Error Biométrico", desc: "Cámara pasillo B requiere calibración.", time: "Hace 3h", urgent: true },
              { title: "Respaldo de Datos", desc: "Backup semanal realizado con éxito.", time: "Hoy 04:00 AM", urgent: false },
            ].map((item, i) => (
              <div key={i} className="flex items-start gap-5 p-4 rounded-3xl hover:bg-slate-50 transition-all border border-transparent hover:border-slate-100 group">
                <div className={cn("w-2.5 h-2.5 mt-2 rounded-full flex-shrink-0 transition-transform group-hover:scale-125", item.urgent ? "bg-primary shadow-lg shadow-primary/50" : "bg-slate-300")} />
                <div className="flex-1 space-y-1.5">
                  <p className="text-base font-bold tracking-tight text-slate-900">{item.title}</p>
                  <p className="text-xs text-muted-foreground font-medium leading-relaxed">{item.desc}</p>
                  <p className="text-[9px] text-primary font-bold uppercase tracking-[0.2em] pt-2">{item.time}</p>
                </div>
              </div>
            ))}
          </CardContent>
        </Card>
      </div>
    </div>
  );
}
