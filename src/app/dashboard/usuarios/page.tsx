"use client";

import React, { useState } from 'react';
import { 
  Plus, 
  Search, 
  MoreVertical, 
  Edit2, 
  Trash2, 
  UserPlus, 
  Shield, 
  Camera,
  Filter
} from 'lucide-react';
import { cn } from "@/lib/utils";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { 
  Table, 
  TableBody, 
  TableCell, 
  TableHead, 
  TableHeader, 
  TableRow 
} from "@/components/ui/table";
import { 
  Dialog, 
  DialogContent, 
  DialogHeader, 
  DialogTitle, 
  DialogTrigger,
  DialogFooter,
  DialogDescription
} from "@/components/ui/dialog";
import { 
  Select, 
  SelectContent, 
  SelectItem, 
  SelectTrigger, 
  SelectValue 
} from "@/components/ui/select";
import { Label } from "@/components/ui/label";
import { Badge } from "@/components/ui/badge";
import { 
  DropdownMenu, 
  DropdownMenuContent, 
  DropdownMenuItem, 
  DropdownMenuTrigger 
} from "@/components/ui/dropdown-menu";
import { useToast } from "@/hooks/use-toast";

type UserRole = 'Administrador' | 'Jefe de Carrera' | 'Docente' | 'Alumno';

interface User {
  id: string;
  name: string;
  email: string;
  role: UserRole;
  status: 'Activo' | 'Inactivo';
}

const mockUsers: User[] = [
  { id: '1', name: 'Ana Martínez', email: 'ana.martinez@uni.edu', role: 'Administrador', status: 'Activo' },
  { id: '2', name: 'Roberto Gómez', email: 'roberto.g@uni.edu', role: 'Docente', status: 'Activo' },
  { id: '3', name: 'Karla Sierra', email: 'k.sierra@uni.edu', role: 'Jefe de Carrera', status: 'Activo' },
  { id: '4', name: 'Juan Pérez', email: 'juan.p@uni.edu', role: 'Alumno', status: 'Inactivo' },
];

export default function UsuariosPage() {
  const [users, setUsers] = useState<User[]>(mockUsers);
  const [searchTerm, setSearchTerm] = useState('');
  const [isAddDialogOpen, setIsAddDialogOpen] = useState(false);
  const { toast } = useToast();

  const [newUser, setNewUser] = useState<Partial<User>>({
    name: '',
    email: '',
    role: 'Alumno' as UserRole,
    status: 'Activo'
  });

  const handleAddUser = (e: React.FormEvent) => {
    e.preventDefault();
    const id = (users.length + 1).toString();
    const userToAdd = { ...newUser, id } as User;
    setUsers([userToAdd, ...users]);
    setIsAddDialogOpen(false);
    setNewUser({ name: '', email: '', role: 'Alumno', status: 'Activo' });
    toast({
      title: "Usuario creado",
      description: `El usuario ${userToAdd.name} ha sido registrado exitosamente.`,
    });
  };

  const handleDeleteUser = (id: string) => {
    setUsers(users.filter(u => u.id !== id));
    toast({
      variant: "destructive",
      title: "Usuario eliminado",
      description: "Los datos han sido removidos del sistema.",
    });
  };

  const filteredUsers = users.filter(user => 
    user.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
    user.email.toLowerCase().includes(searchTerm.toLowerCase())
  );

  return (
    <div className="space-y-6 animate-in fade-in slide-in-from-bottom-4 duration-500">
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
        <div>
          <h1 className="text-3xl font-bold tracking-tight">Gestión de Usuarios</h1>
          <p className="text-muted-foreground font-medium">Crea, edita y administra los roles de acceso.</p>
        </div>
        
        <Dialog open={isAddDialogOpen} onOpenChange={setIsAddDialogOpen}>
          <DialogTrigger asChild>
            <Button className="bg-primary hover:bg-primary/90 text-white rounded-xl h-11 px-6 shadow-md shadow-primary/20">
              <Plus className="w-5 h-5 mr-2" />
              Nuevo Usuario
            </Button>
          </DialogTrigger>
          <DialogContent className="sm:max-w-[425px] rounded-3xl">
            <DialogHeader>
              <DialogTitle className="text-2xl font-bold">Agregar Usuario</DialogTitle>
              <DialogDescription>
                Ingresa los datos básicos para el nuevo integrante de la universidad.
              </DialogDescription>
            </DialogHeader>
            <form onSubmit={handleAddUser} className="space-y-4 py-4">
              <div className="grid gap-2">
                <Label htmlFor="name">Nombre Completo</Label>
                <Input 
                  id="name" 
                  placeholder="Ej. Maria Lopez" 
                  value={newUser.name}
                  onChange={(e) => setNewUser({...newUser, name: e.target.value})}
                  required
                />
              </div>
              <div className="grid gap-2">
                <Label htmlFor="email">Correo Institucional</Label>
                <Input 
                  id="email" 
                  type="email" 
                  placeholder="ejemplo@uniattend.edu" 
                  value={newUser.email}
                  onChange={(e) => setNewUser({...newUser, email: e.target.value})}
                  required
                />
              </div>
              <div className="grid gap-2">
                <Label htmlFor="role">Rol en el Sistema</Label>
                <Select 
                  value={newUser.role} 
                  onValueChange={(val: UserRole) => setNewUser({...newUser, role: val})}
                >
                  <SelectTrigger>
                    <SelectValue placeholder="Selecciona un rol" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="Administrador">Administrador</SelectItem>
                    <SelectItem value="Jefe de Carrera">Jefe de Carrera</SelectItem>
                    <SelectItem value="Docente">Docente</SelectItem>
                    <SelectItem value="Alumno">Alumno</SelectItem>
                  </SelectContent>
                </Select>
              </div>

              <div className="bg-accent/5 p-4 rounded-2xl border border-accent/20 border-dashed">
                <div className="flex items-center gap-2 text-accent mb-2">
                  <Camera className="w-4 h-4" />
                  <span className="text-sm font-bold">Biometría Facial</span>
                </div>
                <p className="text-xs text-muted-foreground mb-3">
                  Próximamente: Registra el rostro del usuario para el control de asistencia.
                </p>
                <Button type="button" variant="outline" className="w-full text-xs h-8 border-accent/30 text-accent hover:bg-accent/10" disabled>
                  Preparar Captura
                </Button>
              </div>

              <DialogFooter>
                <Button type="submit" className="w-full bg-primary hover:bg-primary/90 rounded-xl py-6">Guardar Usuario</Button>
              </DialogFooter>
            </form>
          </DialogContent>
        </Dialog>
      </div>

      <div className="flex flex-col sm:flex-row gap-4">
        <div className="relative flex-1">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
          <Input 
            placeholder="Buscar por nombre o correo..." 
            className="pl-10 h-11 bg-white border-border/60 rounded-xl"
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
          />
        </div>
        <Button variant="outline" className="h-11 rounded-xl bg-white">
          <Filter className="w-4 h-4 mr-2" />
          Filtros
        </Button>
      </div>

      <div className="bg-white rounded-3xl shadow-xl shadow-black/[0.02] border border-border/40 overflow-hidden">
        <Table>
          <TableHeader className="bg-slate-50/50">
            <TableRow className="border-b border-border/40">
              <TableHead className="font-bold py-5 px-6">Usuario</TableHead>
              <TableHead className="font-bold">Rol</TableHead>
              <TableHead className="font-bold">Estado</TableHead>
              <TableHead className="font-bold text-right pr-6">Acciones</TableHead>
            </TableRow>
          </TableHeader>
          <TableBody>
            {filteredUsers.length > 0 ? (
              filteredUsers.map((user) => (
                <TableRow key={user.id} className="group border-b border-border/40 last:border-0 hover:bg-slate-50/40 transition-colors">
                  <TableCell className="py-4 px-6">
                    <div className="flex items-center gap-3">
                      <div className="w-10 h-10 rounded-full bg-primary/10 flex items-center justify-center text-primary font-bold">
                        {user.name.charAt(0)}
                      </div>
                      <div>
                        <div className="font-semibold text-sm">{user.name}</div>
                        <div className="text-xs text-muted-foreground">{user.email}</div>
                      </div>
                    </div>
                  </TableCell>
                  <TableCell>
                    <Badge variant="secondary" className={cn(
                      "font-medium",
                      user.role === 'Administrador' ? "bg-red-50 text-red-600 border-red-100" : 
                      user.role === 'Docente' ? "bg-blue-50 text-blue-600 border-blue-100" :
                      user.role === 'Jefe de Carrera' ? "bg-purple-50 text-purple-600 border-purple-100" :
                      "bg-slate-50 text-slate-600 border-slate-100"
                    )}>
                      {user.role}
                    </Badge>
                  </TableCell>
                  <TableCell>
                    <div className="flex items-center gap-2">
                      <div className={cn("w-2 h-2 rounded-full", user.status === 'Activo' ? "bg-green-500" : "bg-slate-300")} />
                      <span className="text-xs font-medium">{user.status}</span>
                    </div>
                  </TableCell>
                  <TableCell className="text-right pr-6">
                    <DropdownMenu>
                      <DropdownMenuTrigger asChild>
                        <Button variant="ghost" size="icon" className="h-8 w-8 rounded-full">
                          <MoreVertical className="h-4 w-4" />
                        </Button>
                      </DropdownMenuTrigger>
                      <DropdownMenuContent align="end" className="rounded-xl p-1">
                        <DropdownMenuItem className="rounded-lg gap-2 cursor-pointer">
                          <Edit2 className="w-4 h-4" />
                          <span>Editar</span>
                        </DropdownMenuItem>
                        <DropdownMenuItem 
                          className="rounded-lg gap-2 cursor-pointer text-destructive focus:text-destructive focus:bg-destructive/10"
                          onClick={() => handleDeleteUser(user.id)}
                        >
                          <Trash2 className="w-4 h-4" />
                          <span>Eliminar</span>
                        </DropdownMenuItem>
                      </DropdownMenuContent>
                    </DropdownMenu>
                  </TableCell>
                </TableRow>
              ))
            ) : (
              <TableRow>
                <TableCell colSpan={4} className="h-32 text-center text-muted-foreground">
                  No se encontraron usuarios que coincidan con la búsqueda.
                </TableCell>
              </TableRow>
            )}
          </TableBody>
        </Table>
      </div>
    </div>
  );
}