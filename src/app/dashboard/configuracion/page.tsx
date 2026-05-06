"use client";

import React from 'react';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { Settings, Shield, Bell, Database, Camera } from 'lucide-react';
import { Label } from "@/components/ui/label";
import { Switch } from "@/components/ui/switch";
import { Button } from "@/components/ui/button";

export default function ConfiguracionPage() {
  return (
    <div className="space-y-6 animate-in fade-in duration-500">
      <div>
        <h1 className="text-3xl font-bold tracking-tight text-accent">Configuración</h1>
        <p className="text-muted-foreground font-medium">Ajustes globales del sistema SIBF - CAI.</p>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
        <Card className="rounded-3xl border-border/40 shadow-sm">
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <Shield className="w-5 h-5 text-primary" />
              Seguridad y Acceso
            </CardTitle>
            <CardDescription>Controla las políticas de autenticación.</CardDescription>
          </CardHeader>
          <CardContent className="space-y-6">
            <div className="flex items-center justify-between">
              <div className="space-y-0.5">
                <Label>Doble Factor (2FA)</Label>
                <p className="text-xs text-muted-foreground">Exigir código adicional al iniciar sesión.</p>
              </div>
              <Switch />
            </div>
            <div className="flex items-center justify-between">
              <div className="space-y-0.5">
                <Label>Reconocimiento Facial Obligatorio</Label>
                <p className="text-xs text-muted-foreground">Solo permitir acceso mediante biometría.</p>
              </div>
              <Switch defaultChecked />
            </div>
          </CardContent>
        </Card>

        <Card className="rounded-3xl border-border/40 shadow-sm">
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <Bell className="w-5 h-5 text-primary" />
              Notificaciones
            </CardTitle>
            <CardDescription>Configura las alertas del sistema.</CardDescription>
          </CardHeader>
          <CardContent className="space-y-6">
            <div className="flex items-center justify-between">
              <div className="space-y-0.5">
                <Label>Alertas de Inasistencia</Label>
                <p className="text-xs text-muted-foreground">Notificar a jefes de carrera por faltas.</p>
              </div>
              <Switch defaultChecked />
            </div>
            <div className="flex items-center justify-between">
              <div className="space-y-0.5">
                <Label>Reportes Semanales</Label>
                <p className="text-xs text-muted-foreground">Enviar resumen dominical automático.</p>
              </div>
              <Switch />
            </div>
          </CardContent>
        </Card>

        <Card className="rounded-3xl border border-dashed border-primary/30 bg-primary/[0.02] lg:col-span-2">
          <CardContent className="p-8 text-center">
             <Database className="w-12 h-12 text-primary/40 mx-auto mb-4" />
             <h3 className="font-bold text-xl mb-2">Mantenimiento de Base de Datos</h3>
             <p className="text-sm text-muted-foreground max-w-md mx-auto mb-6">
               Realiza respaldos manuales o limpia registros antiguos para optimizar el rendimiento del servidor.
             </p>
             <div className="flex justify-center gap-4">
               <Button className="bg-primary hover:bg-primary/90 rounded-xl px-8">Respaldar Ahora</Button>
               <Button variant="outline" className="rounded-xl px-8">Ver Logs</Button>
             </div>
          </CardContent>
        </Card>
      </div>
    </div>
  );
}
