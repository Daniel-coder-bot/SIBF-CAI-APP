
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
  BookUser
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
  { name: 'Dashboard', href: '/dashboard', icon: LayoutDashboard },
  { name: 'Personal', href: '/dashboard/usuarios', icon: Users },
  { name: 'Catálogos', href: '/dashboard/catalogos', icon: FolderTree },
  { name: 'Asistencia Gral', href: '/dashboard/asistencia', icon: CalendarCheck },
  { name: 'Reportes', href: '/dashboard/reportes', icon: FileBarChart },
  { name: 'Configuración', href: '/dashboard/configuracion', icon: Settings },
];

const docenteItems = [
  { name: 'Inicio', href: '/dashboard', icon: LayoutDashboard },
  { name: 'Panel Docente', href: '/dashboard/docente', icon: BookUser },
  { name: 'Mis Reportes', href: '/dashboard/reportes', icon: FileBarChart },
  { name: 'Configuración', href: '/dashboard/configuracion', icon: Settings },
];

export default function DashboardLayout({ children }: { children: React.ReactNode }) {
  const pathname = usePathname();
  const router = useRouter();
  const db = useFirestore();
  const { user, isUserLoading } = useUser();
  const auth = useAuth();
  
  // Obtenemos el perfil del usuario para conocer su rol real en Firestore
  const userDocRef = useMemoFirebase(() => user ? doc(collection(db, 'users'), user.uid) : null, [user, db]);
  const { data: userProfile, isLoading: isProfileLoading } = useDoc(userDocRef);
  
  const navItems = useMemo(() => {
    if (userProfile?.role === 'Docente') {
      return docenteItems;
    }
    // Por defecto mostramos el de admin para administradores o si no se ha cargado el perfil aún
    return adminItems; 
  }, [userProfile]);

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
        <Sidebar className="border-r border-border/50">
          <SidebarHeader className="p-8 flex flex-col items-center gap-6 border-b bg-slate-50/30">
            <div className="w-full flex justify-center py-2">
              <Image 
                src="/logo.png" 
                alt="SIBF - CAI Logo" 
                width={160} 
                height={160} 
                className="object-contain hover:scale-105 transition-transform duration-500"
                priority
              />
            </div>
            <div className="text-center space-y-2">
              <span className="block text-2xl font-bold text-primary tracking-tight uppercase leading-none">SIBF - CAI</span>
              <span className="block text-[10px] font-bold text-muted-foreground uppercase tracking-[0.2em] opacity-80">Gestión Universitaria</span>
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
                        "group transition-all duration-300 py-7 px-5 rounded-2xl mb-2",
                        isActive ? "bg-primary text-white hover:bg-primary/90 shadow-lg shadow-primary/20" : "hover:bg-primary/5 hover:text-primary"
                      )}
                    >
                      <Link href={item.href}>
                        <item.icon className={cn("w-6 h-6", isActive ? "text-white" : "text-muted-foreground group-hover:text-primary")} />
                        <span className="font-semibold text-lg ml-3 tracking-tight">{item.name}</span>
                        {isActive && <ChevronRight className="ml-auto w-5 h-5 opacity-80 animate-in slide-in-from-left-2" />}
                      </Link>
                    </SidebarMenuButton>
                  </SidebarMenuItem>
                );
              })}
            </SidebarMenu>
          </SidebarContent>
          <SidebarFooter className="p-6 mt-auto border-t bg-slate-50/30">
            <div className="px-4 py-2 mb-4 bg-white rounded-xl border border-border shadow-sm">
              <p className="text-[10px] font-bold text-muted-foreground uppercase tracking-widest mb-1">Usuario Activo</p>
              <p className="text-xs font-bold text-slate-900 truncate">{userProfile?.firstName} {userProfile?.lastName}</p>
              <p className="text-[9px] font-medium text-primary uppercase">{userProfile?.role}</p>
            </div>
            <Button 
              variant="ghost" 
              className="w-full justify-start text-muted-foreground hover:text-destructive hover:bg-destructive/5 rounded-2xl py-7 font-bold transition-all" 
              onClick={handleLogout}
            >
              <LogOut className="mr-3 h-6 w-6" />
              <span className="text-lg tracking-tight">Cerrar Sesión</span>
            </Button>
          </SidebarFooter>
        </Sidebar>

        <main className="flex-1 overflow-y-auto p-4 md:p-10 bg-white">
          <header className="flex items-center justify-between mb-10 md:hidden">
             <SidebarTrigger>
               <Menu className="w-7 h-7" />
             </SidebarTrigger>
             <div className="flex items-center gap-2">
               <Image src="/logo.png" alt="Logo" width={45} height={45} />
               <h1 className="text-2xl font-bold text-primary uppercase tracking-tighter">SIBF - CAI</h1>
             </div>
             <div className="w-7 h-7" />
          </header>
          <div className="max-w-7xl mx-auto">
            {children}
          </div>
        </main>
      </div>
    </SidebarProvider>
  );
}
