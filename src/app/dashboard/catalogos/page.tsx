
"use client";

import React from 'react';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { FolderTree, BookOpen, GraduationCap, Building2, UserCircle } from 'lucide-react';
import { Button } from "@/components/ui/button";

export default function CatalogosPage() {
  const catalogos = [
    { title: "Carreras", desc: "Gestión de programas académicos", icon: BookOpen, count: 12 },
    { title: "Facultades", desc: "Sedes y divisiones universitarias", icon: Building2, count: 5 },
    { title: "Grados", desc: "Niveles de estudio y semestres", icon: GraduationCap, count: 10 },
    { title: "Materias", desc: "Listado maestro de asignaturas", icon: FolderTree, count: 145 },
  ];

  return (
    <div className="space-y-6 animate-in fade-in duration-500">
      <div>
        <h1 className="text-3xl font-bold tracking-tight text-accent">Catálogos</h1>
        <p className="text-muted-foreground font-medium">Configuración de datos maestros del sistema.</p>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
        {catalogos.map((cat, i) => (
          <Card key={i} className="border-border/40 shadow-sm hover:shadow-lg transition-all rounded-3xl group cursor-pointer">
            <CardHeader>
              <div className="bg-primary/5 w-12 h-12 rounded-2xl flex items-center justify-center mb-2 group-hover:bg-primary transition-colors">
                <cat.icon className="w-6 h-6 text-primary group-hover:text-white" />
              </div>
              <CardTitle className="text-lg">{cat.title}</CardTitle>
              <CardDescription className="text-xs">{cat.desc}</CardDescription>
            </CardHeader>
            <CardContent>
              <div className="flex items-center justify-between">
                <span className="text-2xl font-black">{cat.count}</span>
                <Button variant="ghost" size="sm" className="text-xs font-bold text-primary">Gestionar</Button>
              </div>
            </CardContent>
          </Card>
        ))}
      </div>
    </div>
  );
}
