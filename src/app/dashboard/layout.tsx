
"use client";

import React, { useEffect } from 'react';
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
  CalendarCheck
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
import { useUser, useAuth } from '@/firebase';
import { signOut } from 'firebase/auth';

const navItems = [
  { name: 'Dashboard', href: '/dashboard', icon: LayoutDashboard },
  { name: 'Usuarios', href: '/dashboard/usuarios', icon: Users },
  { name: 'Catálogos', href: '/dashboard/catalogos', icon: FolderTree },
  { name: 'Asistencia', href: '/dashboard/asistencia', icon: CalendarCheck },
  { name: 'Reportes', href: '/dashboard/reportes', icon: FileBarChart },
  { name: 'Configuración', href: '/dashboard/configuracion', icon: Settings },
];

export default function DashboardLayout({ children }: { children: React.ReactNode }) {
  const pathname = usePathname();
  const router = useRouter();
  const { user, isUserLoading } = useUser();
  const auth = useAuth();

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

  if (isUserLoading) {
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
          <SidebarHeader className="p-6 flex flex-col items-center gap-4 border-b bg-slate-50/30">
            <div className="w-full flex justify-center py-4">
              <Image 
                src="/logo.png" 
                alt="SIBF - CAI Logo" 
                width={120} 
                height={120} 
                className="object-contain hover:scale-105 transition-transform duration-300"
                priority
              />
            </div>
            <div className="text-center space-y-1">
              <span className="block text-xl font-bold text-primary tracking-tight uppercase leading-none">SIBF - CAI</span>
              <span className="block text-[9px] font-semibold text-muted-foreground uppercase tracking-widest opacity-70">Gestión Universitaria</span>
            </div>
          </SidebarHeader>
          <SidebarContent className="px-3 mt-4">
            <SidebarMenu>
              {navItems.map((item) => {
                const isActive = pathname === item.href;
                return (
                  <SidebarMenuItem key={item.name}>
                    <SidebarMenuButton 
                      asChild 
                      isActive={isActive}
                      className={cn(
                        "group transition-all duration-200 py-6 px-4 rounded-xl mb-1",
                        isActive ? "bg-primary text-white hover:bg-primary/90 shadow-sm" : "hover:bg-primary/5 hover:text-primary"
                      )}
                    >
                      <Link href={item.href}>
                        <item.icon className={cn("w-5 h-5", isActive ? "text-white" : "text-muted-foreground group-hover:text-primary")} />
                        <span className="font-medium text-base ml-2">{item.name}</span>
                        {isActive && <ChevronRight className="ml-auto w-4 h-4 opacity-70" />}
                      </Link>
                    </SidebarMenuButton>
                  </SidebarMenuItem>
                );
              })}
            </SidebarMenu>
          </SidebarContent>
          <SidebarFooter className="p-4 mt-auto border-t bg-slate-50/30">
            <Button 
              variant="ghost" 
              className="w-full justify-start text-muted-foreground hover:text-destructive hover:bg-destructive/10 rounded-xl py-6 font-medium" 
              onClick={handleLogout}
            >
              <LogOut className="mr-2 h-5 w-5" />
              <span className="text-base">Cerrar Sesión</span>
            </Button>
          </SidebarFooter>
        </Sidebar>

        <main className="flex-1 overflow-y-auto p-4 md:p-8 bg-white">
          <header className="flex items-center justify-between mb-8 md:hidden">
             <SidebarTrigger>
               <Menu className="w-6 h-6" />
             </SidebarTrigger>
             <div className="flex items-center gap-2">
               <Image src="/logo.png" alt="Logo" width={40} height={40} />
               <h1 className="text-xl font-bold text-primary uppercase">SIBF - CAI</h1>
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
