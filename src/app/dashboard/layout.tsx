
"use client";

import React, { useEffect, useMemo, useState } from 'react';
import Link from 'next/link';
import Image from 'next/image';
import { usePathname, useRouter } from 'next/navigation';
import { 
  Users, 
  LayoutDashboard, 
  LogOut, 
  Menu,
  ChevronRight,
  FolderTree,
  FileBarChart,
  Settings,
  Loader2,
  CalendarCheck,
  ShieldAlert,
  ClipboardCheck,
  History,
  FileText,
  User
} from 'lucide-react';
import { cn } from "@/lib/utils";
import { Button } from "@/components/ui/button";
import { 
  Sidebar, 
  SidebarContent, 
  SidebarHeader, 
  SidebarMenu, 
  SidebarMenuItem, 
  SidebarMenuButton, 
  SidebarProvider, 
  SidebarTrigger,
  SidebarFooter
} from "@/components/ui/sidebar";
import { useUser, useAuth, useCollection, useMemoFirebase, useFirestore } from '@/firebase';
import { signOut } from 'firebase/auth';
import { collection, query, where, limit } from 'firebase/firestore';

const adminItems = [
  { name: 'Inicio', href: '/dashboard', icon: LayoutDashboard },
  { name: 'Personal', href: '/dashboard/usuarios', icon: Users },
  { name: 'Catálogos', href: '/dashboard/catalogos', icon: FolderTree },
  { name: 'Justificaciones', href: '/dashboard/justificaciones', icon: ShieldAlert },
  { name: 'Asistencia Gral', href: '/dashboard/asistencia', icon: CalendarCheck },
  { name: 'Reportes', href: '/dashboard/reportes', icon: FileBarChart },
  { name: 'Configuración', href: '/dashboard/configuracion', icon: Settings },
];

const docenteItems = [
  { name: 'Pase de Lista', href: '/dashboard/docente/asistencia', icon: ClipboardCheck },
  { name: 'Justificaciones', href: '/dashboard/docente/justificaciones', icon: ShieldAlert },
  { name: 'Reportes Académicos', href: '/dashboard/docente/reportes', icon: FileBarChart },
  { name: 'Configuración', href: '/dashboard/configuracion', icon: Settings },
];

const alumnoItems = [
  { name: 'Mi Asistencia', href: '/dashboard/alumno', icon: History },
  { name: 'Mis Justificantes', href: '/dashboard/alumno/justificaciones', icon: FileText },
  { name: 'Configuración', href: '/dashboard/configuracion', icon: Settings },
];

export default function DashboardLayout({ children }: { children: React.ReactNode }) {
  const pathname = usePathname();
  const router = useRouter();
  const db = useFirestore();
  const { user, isUserLoading } = useUser();
  const auth = useAuth();
  
  const [activeMatricula, setActiveMatricula] = useState<string | null>(null);
  const [demoRole, setDemoRole] = useState<string | null>(null);

  useEffect(() => {
    if (typeof window !== 'undefined') {
      setActiveMatricula(sessionStorage.getItem('active_matricula'));
      setDemoRole(sessionStorage.getItem('demo_role'));
    }
  }, []);

  const usersRef = useMemoFirebase(() => collection(db, 'users'), [db]);
  const studentQuery = useMemoFirebase(() => 
    activeMatricula ? query(usersRef, where("matricula", "==", activeMatricula), limit(1)) : null,
  [usersRef, activeMatricula]);
  
  const { data: studentProfiles, isLoading: isStudentLoading } = useCollection(studentQuery);
  const studentProfile = studentProfiles?.[0];

  // Obtener perfil de usuario si no es alumno
  const userProfileQuery = useMemoFirebase(() => 
    user && !user.isAnonymous ? query(usersRef, where("email", "==", user.email || ""), limit(1)) : null,
  [usersRef, user]);
  const { data: userProfiles } = useCollection(userProfileQuery);
  const userProfile = userProfiles?.[0];

  const isStudent = !!(activeMatricula || studentProfile);
  const isDocente = (user?.isAnonymous && demoRole === 'docente') || userProfile?.role === 'Docente';
  const isAdmin = (user?.isAnonymous && demoRole === 'admin') || userProfile?.role === 'Administrador' || userProfile?.role === 'Jefe de Carrera';

  const navItems = useMemo(() => {
    if (isStudent) return alumnoItems;
    if (isDocente) return docenteItems;
    if (isAdmin) return adminItems;
    return [];
  }, [isStudent, isDocente, isAdmin]);

  useEffect(() => {
    if (isUserLoading || (activeMatricula && isStudentLoading)) return;

    if (!user) {
      router.push('/login');
      return;
    }

    if (pathname === '/dashboard') {
      if (isStudent) router.push('/dashboard/alumno');
      else if (isDocente) router.push('/dashboard/docente/asistencia');
    }
  }, [pathname, isStudent, isDocente, user, router, isUserLoading, activeMatricula, isStudentLoading]);

  const handleLogout = async () => {
    try {
      if (typeof window !== 'undefined') {
        sessionStorage.removeItem('active_matricula');
        sessionStorage.removeItem('demo_role');
      }
      await signOut(auth);
      router.push('/login');
    } catch (error) {
      console.error("Error signing out:", error);
    }
  };

  if (isUserLoading || (activeMatricula && isStudentLoading)) {
    return (
      <div className="h-screen w-full flex items-center justify-center bg-white">
        <Loader2 className="w-10 h-10 animate-spin text-primary" />
      </div>
    );
  }

  if (!user) return null;

  const displayName = studentProfile 
    ? `${studentProfile.firstName} ${studentProfile.lastName}`
    : userProfile
      ? `${userProfile.firstName} ${userProfile.lastName}`
      : isAdmin 
        ? 'Administrador SIBF'
        : isDocente
          ? 'Docente Académico' 
          : 'Usuario';

  const displayRole = studentProfile 
    ? 'Alumno' 
    : userProfile
      ? userProfile.role
      : isAdmin 
        ? 'Administrador'
        : isDocente
          ? 'Personal Docente' 
          : 'Personal';

  return (
    <SidebarProvider defaultOpen={true}>
      <div className="flex h-screen w-full bg-background overflow-hidden">
        <Sidebar className="border-r border-border/50 bg-white shadow-none w-[320px]">
          <SidebarHeader className="p-10 flex flex-col items-center gap-4 border-b bg-white">
            <div className="w-full flex justify-center py-6">
              <Image 
                src="/logo.png" 
                alt="SIBF-CAI Logo" 
                width={250} 
                height={250} 
                className="object-contain hover:scale-105 transition-transform drop-shadow-lg"
              />
            </div>
            <div className="text-center">
              <span className="block text-2xl font-black text-slate-900 tracking-tighter uppercase leading-none">SIBF - CAI</span>
              <span className="block text-[10px] font-bold text-primary uppercase tracking-[0.2em] mt-2">Portal Universitario</span>
            </div>
          </SidebarHeader>
          <SidebarContent className="px-6 mt-8 bg-white">
            <SidebarMenu>
              {navItems.map((item) => {
                const isActive = pathname === item.href;
                return (
                  <SidebarMenuItem key={item.name}>
                    <SidebarMenuButton 
                      asChild 
                      isActive={isActive}
                      className={cn(
                        "group transition-all duration-200 py-6 px-6 rounded-2xl mb-2 h-auto",
                        isActive 
                          ? "bg-slate-900 text-white hover:bg-slate-800 shadow-xl" 
                          : "hover:bg-slate-50 text-slate-600 hover:text-slate-900"
                      )}
                    >
                      <Link href={item.href}>
                        <item.icon className={cn("w-6 h-6", isActive ? "text-primary" : "text-slate-400 group-hover:text-slate-600")} />
                        <span className="font-bold text-base ml-4 tracking-tight">{item.name}</span>
                        {isActive && <ChevronRight className="ml-auto w-5 h-5 opacity-50" />}
                      </Link>
                    </SidebarMenuButton>
                  </SidebarMenuItem>
                );
              })}
            </SidebarMenu>
          </SidebarContent>
          <SidebarFooter className="p-8 mt-auto border-t bg-white">
            <div className="px-5 py-4 mb-4 bg-slate-50 rounded-2xl border border-slate-100">
              <p className="text-[10px] font-bold text-muted-foreground uppercase tracking-widest mb-1">Usuario Activo</p>
              <p className="text-sm font-black text-slate-900 truncate">{displayName}</p>
              <p className="text-[10px] font-bold text-primary uppercase mt-0.5">{displayRole}</p>
            </div>
            <Button 
              variant="ghost" 
              className="w-full justify-start text-slate-500 hover:text-primary hover:bg-primary/5 rounded-2xl py-6 font-bold transition-all" 
              onClick={handleLogout}
            >
              <LogOut className="mr-4 h-5 w-5" />
              <span className="text-base tracking-tight font-bold">Cerrar Sesión</span>
            </Button>
          </SidebarFooter>
        </Sidebar>

        <main className="flex-1 overflow-y-auto p-4 md:p-10 bg-white">
          <header className="flex items-center justify-between mb-8 md:hidden">
             <SidebarTrigger className="text-slate-600">
               <Menu className="w-8 h-8" />
             </SidebarTrigger>
             <div className="flex items-center gap-3">
               <Image 
                src="/logo.png" 
                alt="Logo" 
                width={150} 
                height={150} 
                className="object-contain"
               />
               <h1 className="text-xl font-black text-slate-900 uppercase tracking-tighter">SIBF - CAI</h1>
             </div>
             <div className="w-8 h-8" />
          </header>
          <div className="max-w-6xl mx-auto">
            {children}
          </div>
        </main>
      </div>
    </SidebarProvider>
  );
}
