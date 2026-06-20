
"use client";

import React from 'react';
import JustificacionesDocentePage from '../docente/justificaciones/page';

export default function JustificacionesAdminPage() {
  // Reutilizamos el componente de gestión de justificaciones ya que la lógica es compartida
  // para Admin, Jefe de Carrera y Docente según requerimiento del usuario.
  return <JustificacionesDocentePage />;
}
