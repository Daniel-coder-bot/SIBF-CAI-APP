
"use client";

import React from 'react';
import { 
  FileBarChart, 
  Users, 
  ShieldAlert,
  TrendingUp,
  Download
} from 'lucide-react';
import { Button } from "@/components/ui/button";

export default function ReportesDocentePage() {
  return (
    <div className="space-y-6 animate-in fade-in duration-500 pb-20">
      <div className="border-b pb-6">
        <h1 className="text-3xl font-bold tracking-tight text-foreground uppercase flex items-center gap-2">
          <FileBarChart className="w-8 h-8 text-primary" /> Reportes Académicos
        </h1>
        <p className="text-muted-foreground font-medium text-sm">Estadísticas de asistencia y rendimiento de tus grupos.</p>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
        <div className="bg-white border rounded-[2rem] p-8 shadow-sm text-center group hover:border-primary/40 transition-all">
           <FileBarChart className="w-12 h-12 text-primary/20 mx-auto mb-4 group-hover:scale-110 transition-transform" />
           <h3 className="font-bold text-lg mb-2">Asistencia Mensual</h3>
           <p className="text-xs text-muted-foreground mb-6">Gráficas de puntualidad y permanencia de tus grupos asignados.</p>
           <Button variant="outline" className="rounded-xl w-full font-bold text-[10px] uppercase tracking-widest">
             <Download className="w-3 h-3 mr-2" /> Descargar PDF
           </Button>
        </div>
        <div className="bg-white border rounded-[2rem] p-8 shadow-sm text-center group hover:border-primary/40 transition-all">
           <Users className="w-12 h-12 text-primary/20 mx-auto mb-4 group-hover:scale-110 transition-transform" />
           <h3 className="font-bold text-lg mb-2">Desempeño Grupal</h3>
           <p className="text-xs text-muted-foreground mb-6">Identifica alumnos con alto riesgo de deserción por inasistencias.</p>
           <Button variant="outline" className="rounded-xl w-full font-bold text-[10px] uppercase tracking-widest">
             <TrendingUp className="w-3 h-3 mr-2" /> Ver Análisis
           </Button>
        </div>
        <div className="bg-white border rounded-[2rem] p-8 shadow-sm text-center border-dashed border-primary/40 bg-primary/[0.01] group">
           <ShieldAlert className="w-12 h-12 text-primary/40 mx-auto mb-4 group-hover:scale-110 transition-transform" />
           <h3 className="font-bold text-lg mb-2">Alertas de Alumnos</h3>
           <p className="text-xs text-muted-foreground mb-6">Resumen de justificantes y retardos críticos de la semana.</p>
           <Button className="bg-primary rounded-xl w-full font-bold text-[10px] uppercase tracking-widest text-white">
             Configurar Alertas
           </Button>
        </div>
      </div>
    </div>
  );
}
