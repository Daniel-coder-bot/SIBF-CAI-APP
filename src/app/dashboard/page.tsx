
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
      <div className="flex flex-col md:flex-row md:items-end justify-between gap-4 border-b border-border/50 pb-6">
        <div>
          <div className="flex items-center gap-2 mb-2">
            <div className="w-2 h-8 bg-primary rounded-full" />
            <h1 className="text-3xl font-black tracking-tight text-foreground uppercase">Panel de Control</h1>
          </div>
          <p className="text-muted-foreground font-medium">
            Sistema de Gestión SIBF - CAI | <span className="text-primary font-bold">Administrador</span>
          </p>
        </div>
        <div className="flex items-center gap-3 bg-white p-3 rounded-2xl shadow-sm border border-border/60 px-5">
          <Clock className="w-5 h-5 text-primary" />
          <span className="text-sm font-bold uppercase tracking-tighter">
            {new Date().toLocaleDateString('es-ES', { weekday: 'long', day: 'numeric', month: 'long' })}
          </span>
        </div>
      </div>

      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-6">
        {stats.map((stat, i) => (
          <Card key={i} className="border border-border/40 shadow-sm overflow-hidden group hover:shadow-xl transition-all duration-300 rounded-3xl">
            <CardContent className="p-6">
              <div className="flex items-start justify-between">
                <div className="space-y-1">
                  <p className="text-[10px] font-black text-muted-foreground uppercase tracking-widest">{stat.title}</p>
                  <h3 className="text-3xl font-black tracking-tighter">{stat.value}</h3>
                  <div className="flex items-center pt-2">
                    <span className="text-[10px] font-bold text-primary bg-primary/5 px-2 py-0.5 rounded-full border border-primary/10 flex items-center">
                      <TrendingUp className="w-3 h-3 mr-1" />
                      {stat.trend}
                    </span>
                  </div>
                </div>
                <div className={cn("p-4 rounded-2xl text-white shadow-xl transform group-hover:scale-110 transition-transform duration-300", stat.color)}>
                  <stat.icon className="w-6 h-6" />
                </div>
              </div>
            </CardContent>
          </Card>
        ))}
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
        <Card className="lg:col-span-2 border border-border/40 shadow-sm rounded-3xl overflow-hidden">
          <CardHeader className="bg-slate-50/50 border-b border-border/40">
            <CardTitle className="text-lg font-bold">Reporte de Asistencia Semanal</CardTitle>
            <CardDescription className="text-xs uppercase font-medium tracking-tight">Consolidado general de presencia en campus</CardDescription>
          </CardHeader>
          <CardContent className="h-[350px] pt-8">
            <ResponsiveContainer width="100%" height="100%">
              <BarChart data={attendanceData}>
                <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="#f0f0f0" />
                <XAxis 
                  dataKey="day" 
                  axisLine={false} 
                  tickLine={false} 
                  tick={{fill: '#8A8A8A', fontSize: 11, fontWeight: 700}}
                />
                <YAxis 
                  axisLine={false} 
                  tickLine={false} 
                  tick={{fill: '#8A8A8A', fontSize: 11, fontWeight: 700}}
                  domain={[0, 100]}
                />
                <Tooltip 
                  cursor={{fill: 'rgba(0,0,0,0.02)', radius: 8}}
                  contentStyle={{borderRadius: '16px', border: '1px solid #e2e8f0', boxShadow: '0 20px 25px -5px rgba(0,0,0,0.1)', fontWeight: 'bold'}}
                />
                <Bar dataKey="value" radius={[10, 10, 0, 0]} barSize={45}>
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

        <Card className="border border-border/40 shadow-sm rounded-3xl flex flex-col">
          <CardHeader className="bg-foreground text-white rounded-t-3xl">
            <CardTitle className="text-lg font-bold flex items-center gap-2">
              <AlertCircle className="w-5 h-5 text-primary" />
              Notificaciones
            </CardTitle>
          </CardHeader>
          <CardContent className="space-y-6 pt-6 flex-1">
            {[
              { title: "Baja Asistencia", desc: "Ingeniería de Minas bajó un 15% hoy.", time: "Hace 5 min", urgent: true },
              { title: "Nuevo Docente", desc: "Registro completado: Dr. Alan Turing.", time: "Hace 1h", urgent: false },
              { title: "Error Biométrico", desc: "Cámara pasillo B requiere calibración.", time: "Hace 3h", urgent: true },
              { title: "Backup Completo", desc: "Respaldo semanal realizado con éxito.", time: "Hoy 04:00 AM", urgent: false },
            ].map((item, i) => (
              <div key={i} className="flex items-start gap-4 p-3 rounded-2xl hover:bg-slate-50 transition-colors border border-transparent hover:border-border/50">
                <div className={cn("w-2 h-2 mt-2 rounded-full", item.urgent ? "bg-primary animate-pulse" : "bg-secondary")} />
                <div className="flex-1 space-y-1">
                  <p className="text-sm font-bold tracking-tight">{item.title}</p>
                  <p className="text-xs text-muted-foreground leading-snug">{item.desc}</p>
                  <p className="text-[9px] text-muted-foreground font-black uppercase tracking-widest pt-1">{item.time}</p>
                </div>
              </div>
            ))}
          </CardContent>
        </Card>
      </div>
    </div>
  );
}
