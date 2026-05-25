
"use client";

import React, { useEffect } from 'react';
import { useRouter } from 'next/navigation';

export default function DocenteMainPage() {
  const router = useRouter();

  useEffect(() => {
    // Redirigir a la ventana de asistencia por defecto para el docente
    router.push('/dashboard/docente/asistencia');
  }, [router]);

  return null;
}
