
"use client";

import React from 'react';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { CalendarCheck, Search, Filter, Download } from 'lucide-react';
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { 
  Table, 
  TableBody, 
  TableCell, 
  TableHead, 
  TableHeader, 
  TableRow 
} from "@/components/ui/table";
import { Badge } from "@/components/ui/badge";

export default function AsistenciaPage() {
  const registros = [
    { id: 1, alumno: "Carlos Ruiz", carrera: "Ing. Sistemas", hora: "08:05 AM", estado: "Presente" },
    { id: 2, alumno: "Lucia Mendez", carrera: "Arquitectura", hora: "08:12 AM", estado: "Retraso" },
    { id: 3, alumno: "Diego Salas", carrera: "Ing. Civil", hora: "-", estado: "Falta" },
    { id: 4, alumno: "Maria Cano", carrera: "Derecho", hora: "08:01 AM", estado: "Presente" },
  ];

  return (
    <div className="space-y-6 animate-in fade-in duration-500">
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
        <div>
          <h1 className="text-3xl font-bold tracking-tight text-accent">Control de Asistencia</h1>
          <p className="text-muted-foreground font-medium">Monitoreo en tiempo real de entradas y salidas.</p>
        </div>
        <Button className="bg-primary hover:bg-primary/90 text-white rounded-xl h-11 px-6 shadow-md shadow-primary/20">
          <Download className="w-4 h-4 mr-2" />
          Exportar Hoy
        </Button>
      </div>

      <div className="flex flex-col sm:flex-row gap-4">
        <div className="relative flex-1">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
          <Input placeholder="Buscar alumno..." className="pl-10 h-11 bg-white rounded-xl" />
        </div>
        <Button variant="outline" className="h-11 rounded-xl bg-white">
          <Filter className="w-4 h-4 mr-2" />
          Filtros
        </Button>
      </div>

      <div className="bg-white rounded-3xl border border-border/40 overflow-hidden">
        <Table>
          <TableHeader className="bg-slate-50/50">
            <TableRow>
              <TableHead className="font-bold py-5 px-6">Alumno</TableHead>
              <TableHead className="font-bold">Carrera</TableHead>
              <TableHead className="font-bold">Hora Ingreso</TableHead>
              <TableHead className="font-bold">Estado</TableHead>
            </TableRow>
          </TableHeader>
          <TableBody>
            {registros.map((reg) => (
              <TableRow key={reg.id} className="hover:bg-slate-50/40">
                <TableCell className="py-4 px-6 font-medium">{reg.alumno}</TableCell>
                <TableCell className="text-xs text-muted-foreground">{reg.carrera}</TableCell>
                <TableCell className="text-sm font-bold">{reg.hora}</TableCell>
                <TableCell>
                  <Badge variant={reg.estado === 'Presente' ? 'default' : reg.estado === 'Retraso' ? 'secondary' : 'destructive'} className="rounded-full px-3">
                    {reg.estado}
                  </Badge>
                </TableCell>
              </TableRow>
            ))}
          </TableBody>
        </Table>
      </div>
    </div>
  );
}
