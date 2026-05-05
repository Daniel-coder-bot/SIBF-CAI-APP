
"use client";

import React from 'react';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { FileBarChart, PieChart, TrendingDown, Clock, Download } from 'lucide-react';
import { Button } from "@/components/ui/button";

export default function ReportesPage() {
  const reportes = [
    { title: "Asistencia Mensual", icon: FileBarChart, color: "bg-blue-500" },
    { title: "Distribución por Carrera", icon: PieChart, color: "bg-purple-500" },
    { title: "Alumnos con Faltas Críticas", icon: TrendingDown, color: "bg-red-500" },
    { title: "Puntualidad Docente", icon: Clock, color: "bg-amber-500" },
  ];

  return (
    <div className="space-y-6 animate-in fade-in duration-500">
      <div>
        <h1 className="text-3xl font-bold tracking-tight text-accent">Reportes e Indicadores</h1>
        <p className="text-muted-foreground font-medium">Analiza el comportamiento y estadísticas de la institución.</p>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
        {reportes.map((rep, i) => (
          <Card key={i} className="border-border/40 shadow-sm rounded-3xl overflow-hidden hover:border-primary/50 transition-colors">
            <CardContent className="p-6">
              <div className="flex items-center gap-4">
                <div className={`${rep.color} p-4 rounded-2xl text-white`}>
                  <rep.icon className="w-6 h-6" />
                </div>
                <div className="flex-1">
                  <h3 className="font-bold text-lg">{rep.title}</h3>
                  <p className="text-xs text-muted-foreground">Generar informe detallado en PDF o Excel</p>
                </div>
                <Button variant="outline" size="icon" className="rounded-full">
                  <Download className="w-4 h-4" />
                </Button>
              </div>
            </CardContent>
          </Card>
        ))}
      </div>
    </div>
  );
}
