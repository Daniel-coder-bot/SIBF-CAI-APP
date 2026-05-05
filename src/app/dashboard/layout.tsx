
"use client";

import React from 'react';
import Link from 'next/link';
import { usePathname } from 'next/navigation';
import { 
  Users, 
  GraduationCap, 
  Briefcase, 
  CalendarCheck, 
  LayoutDashboard, 
  LogOut, 
  Menu,
  ChevronRight
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

const navItems = [
  { name: 'Dashboard', href: '/dashboard', icon: LayoutDashboard },
  { name: 'Usuarios', href: '/dashboard/usuarios', icon: Users },
  { name: 'Alumnos', href: '/dashboard/alumnos', icon: GraduationCap },
  { name: 'Docentes', href: '/dashboard/docentes', icon: Briefcase },
  { name: 'Asistencias', href: '/dashboard/asistencias', icon: CalendarCheck },
];

export default function DashboardLayout({ children }: { children: React.ReactNode }) {
  const pathname = usePathname();

  return (
    <SidebarProvider defaultOpen={true}>
      <div className="flex h-screen w-full bg-background overflow-hidden">
        {/* Sidebar MVC: Vista de Navegación */}
        <Sidebar className="border-r border-border/50">
          <SidebarHeader className="p-6 flex items-center gap-3">
            <div className="bg-primary p-2 rounded-lg">
              <GraduationCap className="w-6 h-6 text-white" />
            </div>
            <span className="text-xl font-bold text-primary">UniAttend</span>
          </SidebarHeader>
          <SidebarContent className="px-3">
            <SidebarMenu>
              {navItems.map((item) => {
                const isActive = pathname === item.href;
                return (
                  <SidebarMenuItem key={item.name}>
                    <SidebarMenuButton 
                      asChild 
                      isActive={isActive}
                      className={cn(
                        "group transition-all duration-200 py-6 px-4 rounded-xl",
                        isActive ? "bg-primary text-white hover:bg-primary/90 shadow-md shadow-primary/10" : "hover:bg-primary/5 hover:text-primary"
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
          <SidebarFooter className="p-4 mt-auto">
            <Button variant="ghost" className="w-full justify-start text-muted-foreground hover:text-destructive hover:bg-destructive/10 rounded-xl py-6" asChild>
              <Link href="/login">
                <LogOut className="mr-2 h-5 w-5" />
                <span className="font-medium text-base">Cerrar Sesión</span>
              </Link>
            </Button>
          </SidebarFooter>
        </Sidebar>

        {/* Contenido Principal */}
        <main className="flex-1 overflow-y-auto p-4 md:p-8">
          <header className="flex items-center justify-between mb-8 md:hidden">
             <SidebarTrigger>
               <Menu className="w-6 h-6" />
             </SidebarTrigger>
             <h1 className="text-xl font-bold text-primary">UniAttend</h1>
             <div className="w-6 h-6" /> {/* Espaciador */}
          </header>
          <div className="max-w-7xl mx-auto">
            {children}
          </div>
        </main>
      </div>
    </SidebarProvider>
  );
}
