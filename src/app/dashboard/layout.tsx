
"use client";

import React, { useEffect, useMemo } from 'react';
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
  ClipboardCheck
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
import { useUser, useAuth, useDoc, useMemoFirebase, useFirestore } from '@/firebase';
import { signOut } from 'firebase/auth';
import { doc, collection } from 'firebase/firestore';

const adminItems = [
  { name: 'Inicio', href: '/dashboard', icon: LayoutDashboard },
  { name: 'Personal', href: '/dashboard/usuarios', icon: Users },
  { name: 'Catálogos', href: '/dashboard/catalogos', icon: FolderTree },
  { name: 'Asistencia Gral', href: '/dashboard/asistencia', icon: CalendarCheck },
  { name: 'Reportes', href: '/dashboard/reportes', icon: FileBarChart },
  { name: 'Configuración', href: '/dashboard/configuracion', icon: Settings },
];

const docenteItems = [
  { name: 'Inicio', href: '/dashboard', icon: LayoutDashboard },
  { name: 'Pase de Lista', href: '/dashboard/docente/asistencia', icon: ClipboardCheck },
  { name: 'Justificaciones', href: '/dashboard/docente/justificaciones', icon: ShieldAlert },
  { name: 'Reportes Académicos', href: '/dashboard/docente/reportes', icon: FileBarChart },
  { name: 'Configuración', href: '/dashboard/configuracion', icon: Settings },
];

export default function DashboardLayout({ children }: { children: React.ReactNode }) {
  const pathname = usePathname();
  const router = useRouter();
  const db = useFirestore();
  const { user, isUserLoading } = useUser();
  const auth = useAuth();
  
  const userDocRef = useMemoFirebase(() => user ? doc(collection(db, 'users'), user.uid) : null, [user, db]);
  const { data: userProfile, isLoading: isProfileLoading } = useDoc(userDocRef);
  
  const navItems = useMemo(() => {
    // Si el usuario es docente (o se logueó con el shortcut docente)
    // En una app real, esto vendría del campo 'role' en el documento del usuario
    if (userProfile?.role === 'Docente' || user?.isAnonymous) {
      // Nota: Aquí se podría mejorar la detección del rol si se persiste en una cookie o sesión local
      return docenteItems;
    }
    return adminItems; 
  }, [userProfile, user]);

  useEffect(() => {
    if (!isUserLoading && !user) {
      router.push('/login');
    }
  }, [user, isUserLoading, router]);

  const handleLogout = async () => {
    try {
      await signOut(auth);
      router.push('/login');
    } catch (error) {
      console.error("Error signing out:", error);
    }
  };

  if (isUserLoading || (user && isProfileLoading)) {
    return (
      <div className="h-screen w-full flex items-center justify-center bg-white">
        <Loader2 className="w-10 h-10 animate-spin text-primary" />
      </div>
    );
  }

  if (!user) return null;

  return (
    <SidebarProvider defaultOpen={true}>
      <div className="flex h-screen w-full bg-background overflow-hidden">
        <Sidebar className="border-r border-border/50 bg-white">
          <SidebarHeader className="p-8 flex flex-col items-center gap-6 border-b bg-slate-50/50">
            <div className="w-full flex justify-center py-2">
              <Image 
                src="/logo.png" 
                alt="SIBF - CAI Logo" 
                width={180} 
                height={180} 
                className="object-contain hover:scale-105 transition-transform duration-500"
                priority
              />
            </div>
            <div className="text-center space-y-1">
              <span className="block text-xl font-bold text-primary tracking-tight uppercase leading-none">SIBF - CAI</span>
              <span className="block text-[9px] font-semibold text-muted-foreground uppercase tracking-[0.2em] opacity-80">Gestión Universitaria</span>
            </div>
          </SidebarHeader>
          <SidebarContent className="px-4 mt-6">
            <SidebarMenu>
              {navItems.map((item) => {
                const isActive = pathname === item.href;
                return (
                  <SidebarMenuItem key={item.name}>
                    <SidebarMenuButton 
                      asChild 
                      isActive={isActive}
                      className={cn(
                        "group transition-all duration-300 py-6 px-5 rounded-2xl mb-2 h-auto",
                        isActive ? "bg-primary text-white hover:bg-primary/90 shadow-md shadow-primary/20" : "hover:bg-primary/5 hover:text-primary"
                      )}
                    >
                      <Link href={item.href}>
                        <item.icon className={cn("w-5 h-5", isActive ? "text-white" : "text-muted-foreground group-hover:text-primary")} />
                        <span className="font-medium text-base ml-3 tracking-tight">{item.name}</span>
                        {isActive && <ChevronRight className="ml-auto w-4 h-4 opacity-80" />}
                      </Link>
                    </SidebarMenuButton>
                  </SidebarMenuItem>
                );
              })}
            </SidebarMenu>
          </SidebarContent>
          <SidebarFooter className="p-6 mt-auto border-t bg-slate-50/50">
            <div className="px-4 py-3 mb-4 bg-white rounded-xl border border-border shadow-sm">
              <p className="text-[9px] font-bold text-muted-foreground uppercase tracking-widest mb-1 text-center">Usuario Activo</p>
              <p className="text-xs font-semibold text-slate-900 truncate text-center">{userProfile?.firstName || 'Usuario'} {userProfile?.lastName || 'Docente'}</p>
              <p className="text-[9px] font-bold text-primary uppercase text-center">{userProfile?.role || 'Personal Académico'}</p>
            </div>
            <Button 
              variant="ghost" 
              className="w-full justify-start text-muted-foreground hover:text-destructive hover:bg-destructive/5 rounded-2xl py-6 font-medium transition-all" 
              onClick={handleLogout}
            >
              <LogOut className="mr-3 h-5 w-5" />
              <span className="text-base tracking-tight">Cerrar Sesión</span>
            </Button>
          </SidebarFooter>
        </Sidebar>

        <main className="flex-1 overflow-y-auto p-4 md:p-8 bg-white">
          <header className="flex items-center justify-between mb-8 md:hidden">
             <SidebarTrigger className="text-slate-600">
               <Menu className="w-6 h-6" />
             </SidebarTrigger>
             <div className="flex items-center gap-2">
               <Image src="/logo.png" alt="Logo" width={40} height={40} />
               <h1 className="text-xl font-bold text-primary uppercase tracking-tighter">SIBF - CAI</h1>
             </div>
             <div className="w-6 h-6" />
          </header>
          <div className="max-w-7xl mx-auto">
            {children}
          </div>
        </main>
      </div>
    </SidebarProvider>
  );
}
