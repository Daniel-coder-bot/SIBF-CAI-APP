
"use client";

import React from 'react';
import { 
  Users, 
  GraduationCap, 
  Briefcase, 
  CheckCircle2, 
  Clock, 
  TrendingUp,
  AlertCircle
} from 'lucide-react';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { 
  ChartContainer, 
  ChartTooltip, 
  ChartTooltipContent 
} from "@/components/ui/chart";
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

// Datos falsos para el panel
const stats = [
  { title: "Total Alumnos", value: "1,248", icon: GraduationCap, color: "bg-blue-500", trend: "+12%" },
  { title: "Total Docentes", value: "84", icon: Briefcase, color: "bg-primary", trend: "+2%" },
  { title: "Asistencia Hoy", value: "92%", icon: CheckCircle2, color: "bg-green-500", trend: "+5%" },
  { title: "Alertas Activas", value: "3", icon: AlertCircle, color: "bg-accent", trend: "0" },
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
    <div className="space-y-8 animate-in fade-in duration-500">
      <div className="flex flex-col md:flex-row md:items-end justify-between gap-4">
        <div>
          <h1 className="text-3xl font-bold tracking-tight mb-2">Resumen General</h1>
          <p className="text-muted-foreground font-medium">
            Bienvenido, Administrador. Aquí tienes el estado actual del sistema.
          </p>
        </div>
        <div className="flex items-center gap-2 bg-white p-2 rounded-xl shadow-sm border border-border/40 px-4">
          <Clock className="w-4 h-4 text-primary" />
          <span className="text-sm font-semibold">{new Date().toLocaleDateString('es-ES', { weekday: 'long', day: 'numeric', month: 'long' })}</span>
        </div>
      </div>

      {/* Tarjetas de Estadísticas */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-6">
        {stats.map((stat, i) => (
          <Card key={i} className="border-none shadow-lg shadow-black/[0.03] overflow-hidden group hover:scale-[1.02] transition-transform">
            <CardContent className="p-6 relative">
              <div className="flex items-start justify-between">
                <div>
                  <p className="text-sm font-medium text-muted-foreground mb-1">{stat.title}</p>
                  <h3 className="text-3xl font-bold">{stat.value}</h3>
                  <div className="flex items-center mt-2 text-xs font-bold text-green-500 bg-green-50 w-fit px-2 py-1 rounded-full">
                    <TrendingUp className="w-3 h-3 mr-1" />
                    {stat.trend}
                  </div>
                </div>
                <div className={cn("p-3 rounded-2xl text-white shadow-lg", stat.color)}>
                  <stat.icon className="w-6 h-6" />
                </div>
              </div>
            </CardContent>
          </Card>
        ))}
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
        {/* Gráfico de Asistencia */}
        <Card className="lg:col-span-2 border-none shadow-lg shadow-black/[0.03]">
          <CardHeader>
            <CardTitle>Rendimiento de Asistencia Semanal</CardTitle>
            <CardDescription>Porcentaje de alumnos presentes en el campus.</CardDescription>
          </CardHeader>
          <CardContent className="h-[350px] pt-4">
            <ResponsiveContainer width="100%" height="100%">
              <BarChart data={attendanceData}>
                <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="#f1f1f1" />
                <XAxis 
                  dataKey="day" 
                  axisLine={false} 
                  tickLine={false} 
                  tick={{fill: '#888888', fontSize: 12}}
                />
                <YAxis 
                  axisLine={false} 
                  tickLine={false} 
                  tick={{fill: '#888888', fontSize: 12}}
                  domain={[0, 100]}
                />
                <Tooltip 
                  cursor={{fill: '#f9f9f9', radius: 8}}
                  contentStyle={{borderRadius: '12px', border: 'none', boxShadow: '0 10px 15px -3px rgba(0,0,0,0.1)'}}
                />
                <Bar dataKey="value" radius={[6, 6, 0, 0]} barSize={40}>
                  {attendanceData.map((entry, index) => (
                    <Cell key={`cell-${index}`} fill={entry.value > 90 ? '#FF1E2D' : '#991F60'} />
                  ))}
                </Bar>
              </BarChart>
            </ResponsiveContainer>
          </CardContent>
        </Card>

        {/* Lista de Alertas o Actividad Reciente */}
        <Card className="border-none shadow-lg shadow-black/[0.03]">
          <CardHeader>
            <CardTitle>Actividad Reciente</CardTitle>
            <CardDescription>Últimos registros en el sistema.</CardDescription>
          </CardHeader>
          <CardContent className="space-y-6">
            {[1, 2, 3, 4].map((item) => (
              <div key={item} className="flex items-start gap-4">
                <div className="w-2 h-2 mt-2 rounded-full bg-primary" />
                <div className="flex-1 space-y-1">
                  <p className="text-sm font-semibold">Nuevo Alumno Registrado</p>
                  <p className="text-xs text-muted-foreground">Carlos Ruiz ha sido añadido a Ing. Software.</p>
                  <p className="text-[10px] text-muted-foreground font-medium uppercase tracking-wider">Hace 15 minutos</p>
                </div>
              </div>
            ))}
          </CardContent>
        </Card>
      </div>
    </div>
  );
}
