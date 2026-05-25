
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

  useEffect(() => {
    if (typeof window !== 'undefined') {
      setActiveMatricula(sessionStorage.getItem('active_matricula'));
    }
  }, []);

  const usersRef = useMemoFirebase(() => collection(db, 'users'), [db]);
  const studentQuery = useMemoFirebase(() => 
    activeMatricula ? query(usersRef, where("matricula", "==", activeMatricula), limit(1)) : null,
  [usersRef, activeMatricula]);
  
  const { data: studentProfiles, isLoading: isStudentLoading } = useCollection(studentQuery);
  const studentProfile = studentProfiles?.[0];

  const isStudent = !!(activeMatricula || studentProfile);

  const navItems = useMemo(() => {
    if (isStudent) return alumnoItems;
    if (user?.isAnonymous) return docenteItems;
    if (user && !user.isAnonymous) return adminItems;
    return [];
  }, [isStudent, user]);

  useEffect(() => {
    if (isUserLoading) return;

    if (!user) {
      router.push('/login');
      return;
    }

    // Blindaje de navegación: Redirigir si un alumno o docente está en una zona administrativa
    if (pathname === '/dashboard' || pathname.startsWith('/dashboard/usuarios') || pathname.startsWith('/dashboard/catalogos')) {
      if (isStudent) {
        router.push('/dashboard/alumno');
      } else if (user?.isAnonymous) {
        router.push('/dashboard/docente/asistencia');
      }
    }
  }, [pathname, isStudent, user, router, isUserLoading]);

  const handleLogout = async () => {
    try {
      if (typeof window !== 'undefined') {
        sessionStorage.removeItem('active_matricula');
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
    : user.isAnonymous 
      ? 'Docente Académico' 
      : 'Administrador SIBF';

  const displayRole = studentProfile 
    ? 'Alumno' 
    : user.isAnonymous 
      ? 'Personal Docente' 
      : 'Administrador';

  return (
    <SidebarProvider defaultOpen={true}>
      <div className="flex h-screen w-full bg-background overflow-hidden">
        <Sidebar className="border-r border-border/50 bg-white shadow-none">
          <SidebarHeader className="p-8 flex flex-col items-center gap-4 border-b bg-white">
            <div className="w-full flex justify-center py-2">
              {isStudent ? (
                <div className="w-20 h-20 bg-primary/10 rounded-3xl flex items-center justify-center transition-transform hover:scale-105">
                  <User className="w-10 h-10 text-primary" />
                </div>
              ) : user?.isAnonymous ? (
                <div className="w-20 h-20 bg-slate-900 rounded-3xl flex items-center justify-center transition-transform hover:scale-105">
                  <User className="w-10 h-10 text-white" />
                </div>
              ) : (
                <div className="w-20 h-20 bg-slate-50 rounded-3xl flex items-center justify-center p-2 border border-slate-100">
                  <Image 
                    src="https://picsum.photos/seed/sibf/200/200" 
                    alt="SIBF - CAI Logo" 
                    width={80} 
                    height={80} 
                    className="object-contain rounded-2xl"
                    priority
                    data-ai-hint="university logo"
                  />
                </div>
              )}
            </div>
            <div className="text-center">
              <span className="block text-lg font-bold text-slate-900 tracking-tight uppercase leading-none">SIBF - CAI</span>
              <span className="block text-[8px] font-bold text-primary uppercase tracking-widest mt-1">Portal Universitario</span>
            </div>
          </SidebarHeader>
          <SidebarContent className="px-4 mt-6 bg-white">
            <SidebarMenu>
              {navItems.map((item) => {
                const isActive = pathname === item.href;
                return (
                  <SidebarMenuItem key={item.name}>
                    <SidebarMenuButton 
                      asChild 
                      isActive={isActive}
                      className={cn(
                        "group transition-all duration-200 py-5 px-5 rounded-xl mb-1 h-auto",
                        isActive 
                          ? "bg-slate-900 text-white hover:bg-slate-800 shadow-md" 
                          : "hover:bg-slate-50 text-slate-600 hover:text-slate-900"
                      )}
                    >
                      <Link href={item.href}>
                        <item.icon className={cn("w-5 h-5", isActive ? "text-primary" : "text-slate-400 group-hover:text-slate-600")} />
                        <span className="font-semibold text-sm ml-3 tracking-tight">{item.name}</span>
                        {isActive && <ChevronRight className="ml-auto w-4 h-4 opacity-50" />}
                      </Link>
                    </SidebarMenuButton>
                  </SidebarMenuItem>
                );
              })}
            </SidebarMenu>
          </SidebarContent>
          <SidebarFooter className="p-6 mt-auto border-t bg-white">
            <div className="px-4 py-3 mb-4 bg-slate-50 rounded-xl border border-slate-100">
              <p className="text-[9px] font-bold text-muted-foreground uppercase tracking-widest mb-1">Usuario Activo</p>
              <p className="text-xs font-bold text-slate-900 truncate">{displayName}</p>
              <p className="text-[9px] font-bold text-primary uppercase mt-0.5">{displayRole}</p>
            </div>
            <Button 
              variant="ghost" 
              className="w-full justify-start text-slate-500 hover:text-primary hover:bg-primary/5 rounded-xl py-5 font-bold transition-all" 
              onClick={handleLogout}
            >
              <LogOut className="mr-3 h-4 w-4" />
              <span className="text-sm tracking-tight">Cerrar Sesión</span>
            </Button>
          </SidebarFooter>
        </Sidebar>

        <main className="flex-1 overflow-y-auto p-4 md:p-10 bg-white">
          <header className="flex items-center justify-between mb-8 md:hidden">
             <SidebarTrigger className="text-slate-600">
               <Menu className="w-6 h-6" />
             </SidebarTrigger>
             <div className="flex items-center gap-2">
               <div className="w-8 h-8 bg-primary rounded-lg flex items-center justify-center">
                 <User className="w-4 h-4 text-white" />
               </div>
               <h1 className="text-lg font-bold text-slate-900 uppercase tracking-tighter">SIBF - CAI</h1>
             </div>
             <div className="w-6 h-6" />
          </header>
          <div className="max-w-6xl mx-auto">
            {children}
          </div>
        </main>
      </div>
    </SidebarProvider>
  );
}
