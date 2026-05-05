
"use client";

import React, { useState } from 'react';
import { 
  Plus, 
  Search, 
  MoreVertical, 
  Edit2, 
  Trash2, 
  Camera,
  Filter,
  User as UserIcon,
  Loader2,
  Key
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

// Firebase Imports
import { 
  useFirestore, 
  useCollection, 
  useMemoFirebase,
  addDocumentNonBlocking,
  updateDocumentNonBlocking,
  deleteDocumentNonBlocking,
  useUser
} from '@/firebase';
import { collection, doc, serverTimestamp } from 'firebase/firestore';

type UserRole = 'Administrador' | 'Jefe de Carrera' | 'Docente' | 'Alumno';

interface UserEntity {
  id: string;
  firstName: string;
  lastName: string;
  email: string;
  password?: string;
  role: UserRole;
  createdAt: any;
  updatedAt: any;
}

export default function UsuariosPage() {
  const db = useFirestore();
  const { toast } = useToast();
  const { user } = useUser();
  
  // States
  const [searchTerm, setSearchTerm] = useState('');
  const [isAddDialogOpen, setIsAddDialogOpen] = useState(false);
  const [isEditDialogOpen, setIsEditDialogOpen] = useState(false);
  const [newUser, setNewUser] = useState({
    firstName: '',
    lastName: '',
    email: '',
    password: '',
    role: 'Alumno' as UserRole
  });
  const [editingUser, setEditingUser] = useState<UserEntity | null>(null);

  // Firestore Real-time Collection
  const usersRef = useMemoFirebase(() => user ? collection(db, 'users') : null, [db, user]);
  const { data: users, isLoading } = useCollection<UserEntity>(usersRef);

  const handleAddUser = (e: React.FormEvent) => {
    e.preventDefault();
    if (!usersRef) return;
    
    const userData = {
      ...newUser,
      createdAt: serverTimestamp(),
      updatedAt: serverTimestamp()
    };

    addDocumentNonBlocking(usersRef, userData);
    
    setIsAddDialogOpen(false);
    setNewUser({ firstName: '', lastName: '', email: '', password: '', role: 'Alumno' });
    
    toast({
      title: "Usuario registrado",
      description: `El perfil de ${userData.firstName} ha sido creado con éxito.`,
    });
  };

  const handleEditUser = (e: React.FormEvent) => {
    e.preventDefault();
    if (!editingUser) return;
    
    const userDocRef = doc(db, 'users', editingUser.id);
    const updateData = {
      firstName: editingUser.firstName,
      lastName: editingUser.lastName,
      email: editingUser.email,
      role: editingUser.role,
      password: editingUser.password || '',
      updatedAt: serverTimestamp()
    };

    updateDocumentNonBlocking(userDocRef, updateData);
    
    setIsEditDialogOpen(false);
    setEditingUser(null);
    
    toast({
      title: "Perfil actualizado",
      description: "Los cambios han sido guardados en Firestore.",
    });
  };

  const handleDeleteUser = (userId: string) => {
    const userDocRef = doc(db, 'users', userId);
    deleteDocumentNonBlocking(userDocRef);
    
    toast({
      variant: "destructive",
      title: "Usuario eliminado",
      description: "Los datos han sido removidos del sistema.",
    });
  };

  const filteredUsers = (users || []).filter(u => 
    `${u.firstName} ${u.lastName}`.toLowerCase().includes(searchTerm.toLowerCase()) ||
    u.email.toLowerCase().includes(searchTerm.toLowerCase())
  );

  return (
    <div className="space-y-6 animate-in fade-in slide-in-from-bottom-4 duration-500">
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
        <div>
          <h1 className="text-3xl font-bold tracking-tight text-accent">Gestión de Usuarios</h1>
          <p className="text-muted-foreground font-medium">Administra los accesos y roles del personal universitario.</p>
        </div>
        
        {/* Diálogo para Agregar */}
        <Dialog open={isAddDialogOpen} onOpenChange={setIsAddDialogOpen}>
          <DialogTrigger asChild>
            <Button className="bg-primary hover:bg-primary/90 text-white rounded-xl h-11 px-6 shadow-md shadow-primary/20">
              <Plus className="w-5 h-5 mr-2" />
              Nuevo Usuario
            </Button>
          </DialogTrigger>
          <DialogContent className="sm:max-w-[450px] rounded-3xl">
            <DialogHeader>
              <DialogTitle className="text-2xl font-bold text-primary">Agregar Nuevo Usuario</DialogTitle>
              <DialogDescription>
                Define los datos básicos y la contraseña de acceso.
              </DialogDescription>
            </DialogHeader>
            <form onSubmit={handleAddUser} className="space-y-4 py-4">
              <div className="grid grid-cols-2 gap-4">
                <div className="grid gap-2">
                  <Label htmlFor="firstName">Nombre(s)</Label>
                  <Input 
                    id="firstName" 
                    placeholder="Juan" 
                    value={newUser.firstName}
                    onChange={(e) => setNewUser({...newUser, firstName: e.target.value})}
                    required
                    className="rounded-xl"
                  />
                </div>
                <div className="grid gap-2">
                  <Label htmlFor="lastName">Apellido(s)</Label>
                  <Input 
                    id="lastName" 
                    placeholder="Pérez" 
                    value={newUser.lastName}
                    onChange={(e) => setNewUser({...newUser, lastName: e.target.value})}
                    required
                    className="rounded-xl"
                  />
                </div>
              </div>
              <div className="grid gap-2">
                <Label htmlFor="email">Correo Institucional</Label>
                <Input 
                  id="email" 
                  type="email" 
                  placeholder="usuario@uniattend.edu" 
                  value={newUser.email}
                  onChange={(e) => setNewUser({...newUser, email: e.target.value})}
                  required
                  className="rounded-xl"
                />
              </div>
              <div className="grid gap-2">
                <Label htmlFor="pass">Contraseña de Acceso</Label>
                <div className="relative">
                   <Key className="absolute left-3 top-3 w-4 h-4 text-muted-foreground" />
                   <Input 
                    id="pass" 
                    type="password"
                    placeholder="Mínimo 4 caracteres" 
                    value={newUser.password}
                    onChange={(e) => setNewUser({...newUser, password: e.target.value})}
                    required
                    className="rounded-xl pl-10"
                  />
                </div>
              </div>
              <div className="grid gap-2">
                <Label htmlFor="role">Rol en el Sistema</Label>
                <Select 
                  value={newUser.role} 
                  onValueChange={(val: UserRole) => setNewUser({...newUser, role: val})}
                >
                  <SelectTrigger className="rounded-xl">
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
              <DialogFooter className="pt-4">
                <Button type="submit" className="w-full bg-primary hover:bg-primary/90 text-white rounded-xl py-6 font-bold shadow-lg shadow-primary/20">
                  Registrar en Firestore
                </Button>
              </DialogFooter>
            </form>
          </DialogContent>
        </Dialog>

        {/* Diálogo para Editar */}
        <Dialog open={isEditDialogOpen} onOpenChange={setIsEditDialogOpen}>
          <DialogContent className="sm:max-w-[450px] rounded-3xl">
            <DialogHeader>
              <DialogTitle className="text-2xl font-bold text-primary">Editar Perfil</DialogTitle>
              <DialogDescription>
                Modifica los datos del usuario o actualiza su contraseña.
              </DialogDescription>
            </DialogHeader>
            {editingUser && (
              <form onSubmit={handleEditUser} className="space-y-4 py-4">
                <div className="grid grid-cols-2 gap-4">
                  <div className="grid gap-2">
                    <Label htmlFor="editFirstName">Nombre(s)</Label>
                    <Input 
                      id="editFirstName" 
                      value={editingUser.firstName}
                      onChange={(e) => setEditingUser({...editingUser, firstName: e.target.value})}
                      required
                      className="rounded-xl"
                    />
                  </div>
                  <div className="grid gap-2">
                    <Label htmlFor="editLastName">Apellido(s)</Label>
                    <Input 
                      id="editLastName" 
                      value={editingUser.lastName}
                      onChange={(e) => setEditingUser({...editingUser, lastName: e.target.value})}
                      required
                      className="rounded-xl"
                    />
                  </div>
                </div>
                <div className="grid gap-2">
                  <Label htmlFor="editEmail">Correo Institucional</Label>
                  <Input 
                    id="editEmail" 
                    type="email" 
                    value={editingUser.email}
                    onChange={(e) => setEditingUser({...editingUser, email: e.target.value})}
                    required
                    className="rounded-xl"
                  />
                </div>
                <div className="grid gap-2">
                  <Label htmlFor="editPass">Contraseña Nueva (Opcional)</Label>
                  <div className="relative">
                    <Key className="absolute left-3 top-3 w-4 h-4 text-muted-foreground" />
                    <Input 
                      id="editPass" 
                      type="password"
                      placeholder="Dejar vacío para no cambiar" 
                      value={editingUser.password || ''}
                      onChange={(e) => setEditingUser({...editingUser, password: e.target.value})}
                      className="rounded-xl pl-10"
                    />
                  </div>
                </div>
                <div className="grid gap-2">
                  <Label htmlFor="editRole">Rol en el Sistema</Label>
                  <Select 
                    value={editingUser.role} 
                    onValueChange={(val: UserRole) => setEditingUser({...editingUser, role: val})}
                  >
                    <SelectTrigger className="rounded-xl">
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
                <DialogFooter className="pt-4">
                  <Button type="submit" className="w-full bg-primary hover:bg-primary/90 text-white rounded-xl py-6 font-bold shadow-lg shadow-primary/20">
                    Guardar Cambios
                  </Button>
                </DialogFooter>
              </form>
            )}
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
        <Button variant="outline" className="h-11 rounded-xl bg-white border-border/60">
          <Filter className="w-4 h-4 mr-2" />
          Filtros
        </Button>
      </div>

      <div className="bg-white rounded-3xl shadow-xl shadow-black/[0.01] border border-border/40 overflow-hidden">
        <Table>
          <TableHeader className="bg-slate-50/50">
            <TableRow className="border-b border-border/40">
              <TableHead className="font-bold py-5 px-6">Usuario</TableHead>
              <TableHead className="font-bold">Rol de Acceso</TableHead>
              <TableHead className="font-bold">ID Firestore</TableHead>
              <TableHead className="font-bold text-right pr-6">Acciones</TableHead>
            </TableRow>
          </TableHeader>
          <TableBody>
            {isLoading ? (
              <TableRow>
                <TableCell colSpan={4} className="h-48 text-center">
                  <div className="flex flex-col items-center justify-center gap-2 text-muted-foreground">
                    <Loader2 className="w-8 h-8 animate-spin text-primary" />
                    <p className="text-sm font-medium">Sincronizando con base de datos...</p>
                  </div>
                </TableCell>
              </TableRow>
            ) : filteredUsers.length > 0 ? (
              filteredUsers.map((u) => (
                <TableRow key={u.id} className="group border-b border-border/40 last:border-0 hover:bg-slate-50/40 transition-colors">
                  <TableCell className="py-4 px-6">
                    <div className="flex items-center gap-3">
                      <div className="w-10 h-10 rounded-full bg-primary/10 flex items-center justify-center text-primary font-bold">
                        <UserIcon className="w-5 h-5" />
                      </div>
                      <div>
                        <div className="font-semibold text-sm">{u.firstName} {u.lastName}</div>
                        <div className="text-xs text-muted-foreground">{u.email}</div>
                      </div>
                    </div>
                  </TableCell>
                  <TableCell>
                    <Badge variant="outline" className={cn(
                      "font-bold px-3 py-1 rounded-full",
                      u.role === 'Administrador' ? "bg-red-50 text-red-600 border-red-200" : 
                      u.role === 'Docente' ? "bg-slate-50 text-slate-700 border-slate-200" :
                      u.role === 'Jefe de Carrera' ? "bg-slate-50 text-slate-700 border-slate-200" :
                      "bg-slate-50 text-slate-500 border-slate-100"
                    )}>
                      {u.role}
                    </Badge>
                  </TableCell>
                  <TableCell>
                    <code className="text-[10px] bg-slate-100 p-1 px-2 rounded-md font-mono text-muted-foreground">
                      {u.id.substring(0, 12)}...
                    </code>
                  </TableCell>
                  <TableCell className="text-right pr-6">
                    <DropdownMenu>
                      <DropdownMenuTrigger asChild>
                        <Button variant="ghost" size="icon" className="h-8 w-8 rounded-full">
                          <MoreVertical className="h-4 w-4" />
                        </Button>
                      </DropdownMenuTrigger>
                      <DropdownMenuContent align="end" className="rounded-xl p-1 border-border/40">
                        <DropdownMenuItem 
                          className="rounded-lg gap-2 cursor-pointer font-medium"
                          onClick={() => {
                            setEditingUser(u);
                            setIsEditDialogOpen(true);
                          }}
                        >
                          <Edit2 className="w-4 h-4" />
                          <span>Editar Perfil</span>
                        </DropdownMenuItem>
                        <DropdownMenuItem 
                          className="rounded-lg gap-2 cursor-pointer text-destructive focus:text-destructive focus:bg-destructive/10 font-medium"
                          onClick={() => handleDeleteUser(u.id)}
                        >
                          <Trash2 className="w-4 h-4" />
                          <span>Eliminar Acceso</span>
                        </DropdownMenuItem>
                      </DropdownMenuContent>
                    </DropdownMenu>
                  </TableCell>
                </TableRow>
              ))
            ) : (
              <TableRow>
                <TableCell colSpan={4} className="h-32 text-center text-muted-foreground">
                  No hay usuarios registrados que coincidan con la búsqueda.
                </TableCell>
              </TableRow>
            )}
          </TableBody>
        </Table>
      </div>
    </div>
  );
}
