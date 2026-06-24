
"use client";

import React from 'react';
import { 
  FileBarChart, 
  PieChart, 
  TrendingDown, 
  Clock, 
  Download,
  Database,
  Loader2,
  FileSpreadsheet
} from 'lucide-react';
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { useFirestore, useCollection, useMemoFirebase } from '@/firebase';
import { collection } from 'firebase/firestore';
import * as XLSX from 'xlsx';
import { useToast } from "@/hooks/use-toast";

export default function ReportesPage() {
  const db = useFirestore();
  const { toast } = useToast();

  // Consultas de todas las colecciones para el bundle de Power BI
  const usersRef = useMemoFirebase(() => collection(db, 'users'), [db]);
  const asistenciasRef = useMemoFirebase(() => collection(db, 'asistencias'), [db]);
  const justificacionesRef = useMemoFirebase(() => collection(db, 'justificaciones'), [db]);
  const sedesRef = useMemoFirebase(() => collection(db, 'sedes'), [db]);
  const carrerasRef = useMemoFirebase(() => collection(db, 'carreras'), [db]);
  const materiasRef = useMemoFirebase(() => collection(db, 'materias'), [db]);
  const gruposRef = useMemoFirebase(() => collection(db, 'grupos'), [db]);

  const { data: users, isLoading: loadingUsers } = useCollection(usersRef);
  const { data: asistencias, isLoading: loadingAsist } = useCollection(asistenciasRef);
  const { data: justificaciones, isLoading: loadingJust } = useCollection(justificacionesRef);
  const { data: sedes } = useCollection(sedesRef);
  const { data: carreras } = useCollection(carrerasRef);
  const { data: materias } = useCollection(materiasRef);
  const { data: grupos } = useCollection(gruposRef);

  const isLoading = loadingUsers || loadingAsist || loadingJust;

  const exportToExcel = (data: any[], fileName: string) => {
    if (!data || data.length === 0) {
      toast({ variant: "destructive", title: "Sin datos", description: "No hay registros para exportar." });
      return;
    }

    // Limpiar datos de Firebase (Timestamps y IDs internos)
    const cleanData = data.map(({ createdAt, updatedAt, faceDescriptor, ...rest }) => ({
      ...rest,
      fecha_registro: createdAt?.toDate ? createdAt.toDate().toLocaleString() : 'N/A'
    }));

    const worksheet = XLSX.utils.json_to_sheet(cleanData);
    const workbook = XLSX.utils.book_new();
    XLSX.utils.book_append_sheet(workbook, worksheet, "Reporte");
    XLSX.writeFile(workbook, `${fileName}_${new Date().toISOString().split('T')[0]}.xlsx`);
    
    toast({ title: "Reporte Generado", description: `Se ha descargado el archivo ${fileName}.` });
  };

  const exportPowerBIBundle = () => {
    if (isLoading) return;

    const workbook = XLSX.utils.book_new();

    const sheets = [
      { name: "Usuarios", data: users },
      { name: "Asistencias", data: asistencias },
      { name: "Justificaciones", data: justificaciones },
      { name: "Sedes", data: sedes },
      { name: "Carreras", data: carreras },
      { name: "Materias", data: materias },
      { name: "Grupos", data: grupos }
    ];

    sheets.forEach(sheet => {
      if (sheet.data && sheet.data.length > 0) {
        const cleanData = sheet.data.map(({ createdAt, updatedAt, faceDescriptor, ...rest }: any) => ({
          ...rest,
          fecha_creacion: createdAt?.toDate ? createdAt.toDate().toISOString() : null
        }));
        const ws = XLSX.utils.json_to_sheet(cleanData);
        XLSX.utils.book_append_sheet(workbook, ws, sheet.name);
      }
    });

    XLSX.writeFile(workbook, `SIBF_CAI_PowerBI_Bundle_${new Date().toISOString().split('T')[0]}.xlsx`);
    
    toast({ 
      title: "Paquete Power BI Listo", 
      description: "Archivo consolidado descargado. Importalo directamente en Power BI Desktop." 
    });
  };

  const reportCards = [
    { 
      title: "Asistencia Histórica", 
      description: "Listado completo de entradas, salidas y estados de puntualidad.",
      icon: FileSpreadsheet, 
      color: "bg-primary",
      action: () => exportToExcel(asistencias || [], "Reporte_Asistencia")
    },
    { 
      title: "Justificantes Médicos", 
      description: "Reporte de inasistencias justificadas y estados de validación.",
      icon: Clock, 
      color: "bg-slate-800",
      action: () => exportToExcel(justificaciones || [], "Reporte_Justificantes")
    },
    { 
      title: "Matrícula Institucional", 
      description: "Listado de alumnos y personal docente activo en el sistema.",
      icon: PieChart, 
      color: "bg-slate-700",
      action: () => exportToExcel(users || [], "Listado_Usuarios")
    },
    { 
      title: "Faltas Críticas", 
      description: "Análisis de alumnos con riesgo académico por ausentismo.",
      icon: TrendingDown, 
      color: "bg-red-600",
      action: () => exportToExcel(asistencias?.filter(a => a.estado === 'Falta') || [], "Alumnos_Riesgo_Faltas")
    },
  ];

  return (
    <div className="space-y-8 animate-in fade-in duration-500 pb-20">
      <div className="flex flex-col md:flex-row md:items-end justify-between gap-4 border-b pb-8">
        <div>
          <h1 className="text-3xl font-bold tracking-tight text-slate-900 uppercase flex items-center gap-3">
            <FileBarChart className="w-9 h-9 text-primary" /> Reportes e Indicadores
          </h1>
          <p className="text-muted-foreground font-medium text-sm">Exportación de datos institucionales para análisis avanzado.</p>
        </div>
        
        <Button 
          onClick={exportPowerBIBundle}
          disabled={isLoading}
          className="bg-slate-900 hover:bg-slate-800 text-white rounded-2xl h-14 px-8 font-bold shadow-xl shadow-slate-200 uppercase tracking-widest text-[11px]"
        >
          {isLoading ? <Loader2 className="w-5 h-5 animate-spin mr-2" /> : <Database className="w-5 h-5 mr-2 text-primary" />}
          Generar Paquete Power BI
        </Button>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
        {reportCards.map((rep, i) => (
          <Card key={i} className="border-none shadow-sm rounded-[2.5rem] overflow-hidden group hover:shadow-md transition-all bg-white border border-slate-100">
            <CardContent className="p-8">
              <div className="flex items-start gap-6">
                <div className={`${rep.color} p-5 rounded-[1.5rem] text-white shadow-lg group-hover:scale-110 transition-transform`}>
                  <rep.icon className="w-8 h-8" />
                </div>
                <div className="flex-1 space-y-1">
                  <h3 className="font-bold text-xl text-slate-900">{rep.title}</h3>
                  <p className="text-sm text-muted-foreground font-medium leading-relaxed">{rep.description}</p>
                  <div className="pt-4">
                    <Button 
                      onClick={rep.action}
                      variant="outline" 
                      className="rounded-xl border-slate-200 font-bold text-[10px] uppercase tracking-widest px-6 h-10 hover:bg-primary hover:text-white hover:border-primary transition-all"
                    >
                      <Download className="w-3.5 h-3.5 mr-2" /> Descargar Excel
                    </Button>
                  </div>
                </div>
              </div>
            </CardContent>
          </Card>
        ))}
      </div>

      <Card className="rounded-[3rem] border-dashed border-2 border-slate-200 bg-slate-50/50 mt-12">
        <CardContent className="p-12 text-center">
           <div className="max-w-2xl mx-auto space-y-6">
              <div className="w-20 h-20 bg-white rounded-3xl flex items-center justify-center mx-auto shadow-sm border border-slate-100">
                <Database className="w-10 h-10 text-primary" />
              </div>
              <div className="space-y-2">
                <h3 className="text-2xl font-bold text-slate-900 uppercase tracking-tight">Conectividad Power BI</h3>
                <p className="text-muted-foreground font-medium leading-relaxed text-sm">
                  El "Paquete Power BI" genera un archivo Excel con todas las tablas relacionadas de la base de datos SIBF-CAI. 
                  Este archivo está optimizado para que Power BI reconozca automáticamente las relaciones entre Sedes, Carreras, Alumnos y Asistencias.
                </p>
              </div>
              <div className="flex flex-wrap justify-center gap-3">
                <Badge className="bg-white text-slate-600 border-slate-200 px-4 py-1.5 rounded-full font-bold text-[9px] uppercase tracking-widest">Multi-hoja (.xlsx)</Badge>
                <Badge className="bg-white text-slate-600 border-slate-200 px-4 py-1.5 rounded-full font-bold text-[9px] uppercase tracking-widest">Timestamps ISO-8601</Badge>
                <Badge className="bg-white text-slate-600 border-slate-200 px-4 py-1.5 rounded-full font-bold text-[9px] uppercase tracking-widest">Relaciones Indexadas</Badge>
              </div>
           </div>
        </CardContent>
      </Card>
    </div>
  );
}
