
"use client";

import React, { useState, useRef } from 'react';
import { 
  Plus, 
  Search, 
  MoreVertical, 
  Edit2, 
  Trash2, 
  User as UserIcon,
  Loader2,
  Key,
  Download,
  Upload
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
import * as XLSX from 'xlsx';

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
  const fileInputRef = useRef<HTMLInputElement>(null);
  
  const [searchTerm, setSearchTerm] = useState('');
  const [isAddDialogOpen, setIsAddDialogOpen] = useState(false);
  const [isEditDialogOpen, setIsEditDialogOpen] = useState(false);
  const [newUser, setNewUser] = useState({
    firstName: '',
    lastName: '',
    email: '',
    password: '',
    role: 'Docente' as UserRole
  });
  const [editingUser, setEditingUser] = useState<UserEntity | null>(null);

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
    setNewUser({ firstName: '', lastName: '', email: '', password: '', role: 'Docente' });
    
    toast({ title: "Usuario registrado", description: "El proceso de guardado ha comenzado." });
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
    
    toast({ title: "Perfil actualizado", description: "Cambios guardados correctamente." });
  };

  const handleDeleteUser = (userId: string) => {
    const userDocRef = doc(db, 'users', userId);
    deleteDocumentNonBlocking(userDocRef);
    toast({ variant: "destructive", title: "Acceso eliminado" });
  };

  const handleExportExcel = () => {
    if (!users || users.length === 0) {
      toast({ variant: "destructive", title: "Sin datos", description: "No hay usuarios para exportar." });
      return;
    }

    const exportData = filteredUsers.map(({ id, createdAt, updatedAt, ...rest }) => ({
      ...rest
    }));

    const worksheet = XLSX.utils.json_to_sheet(exportData);
    const workbook = XLSX.utils.book_new();
    XLSX.utils.book_append_sheet(workbook, worksheet, "Usuarios");
    XLSX.writeFile(workbook, "Listado_Personal_SIBF_CAI.xlsx");
    
    toast({ title: "Exportación completa" });
  };

  const filteredUsers = (users || []).filter(u => 
    u.role !== 'Alumno' && (
      `${u.firstName} ${u.lastName}`.toLowerCase().includes(searchTerm.toLowerCase()) ||
      u.email.toLowerCase().includes(searchTerm.toLowerCase())
    )
  );

  return (
    <div className="space-y-6 animate-in fade-in slide-in-from-bottom-4 duration-500">
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
        <div>
          <h1 className="text-2xl font-bold tracking-tight text-foreground uppercase">Personal Administrativo</h1>
          <p className="text-muted-foreground font-medium text-sm">Gestión de Administradores, Jefes y Docentes.</p>
        </div>
        
        <div className="flex flex-wrap items-center gap-2">
          <Button variant="outline" className="rounded-xl h-10 px-4 font-semibold" onClick={handleExportExcel}><Download className="w-4 h-4 mr-2" /> Exportar</Button>
          <Dialog open={isAddDialogOpen} onOpenChange={setIsAddDialogOpen}>
            <DialogTrigger asChild>
              <Button className="bg-primary hover:bg-accent text-white rounded-xl h-10 px-6 shadow-sm font-bold"><Plus className="w-4 h-4 mr-2" /> Nuevo Registro</Button>
            </DialogTrigger>
            <DialogContent className="sm:max-w-[450px] rounded-3xl">
              <DialogHeader>
                <DialogTitle className="text-xl font-bold text-primary uppercase">Alta de Personal</DialogTitle>
                <DialogDescription className="font-semibold text-[9px] uppercase tracking-widest text-muted-foreground">Creación de cuenta institucional</DialogDescription>
              </DialogHeader>
              <form onSubmit={handleAddUser} className="space-y-4 py-4">
                <div className="grid grid-cols-2 gap-4">
                  <div className="grid gap-2">
                    <Label className="text-[10px] font-bold uppercase tracking-widest text-muted-foreground">Nombre(s)</Label>
                    <Input value={newUser.firstName} onChange={(e) => setNewUser({...newUser, firstName: e.target.value})} required className="rounded-xl" />
                  </div>
                  <div className="grid gap-2">
                    <Label className="text-[10px] font-bold uppercase tracking-widest text-muted-foreground">Apellido(s)</Label>
                    <Input value={newUser.lastName} onChange={(e) => setNewUser({...newUser, lastName: e.target.value})} required className="rounded-xl" />
                  </div>
                </div>
                <div className="grid gap-2">
                  <Label className="text-[10px] font-bold uppercase tracking-widest text-muted-foreground">Correo</Label>
                  <Input type="email" value={newUser.email} onChange={(e) => setNewUser({...newUser, email: e.target.value})} required className="rounded-xl" />
                </div>
                <div className="grid gap-2">
                  <Label className="text-[10px] font-bold uppercase tracking-widest text-muted-foreground">Contraseña</Label>
                  <Input type="password" value={newUser.password} onChange={(e) => setNewUser({...newUser, password: e.target.value})} required className="rounded-xl" />
                </div>
                <div className="grid gap-2">
                  <Label className="text-[10px] font-bold uppercase tracking-widest text-muted-foreground">Rol Asignado</Label>
                  <Select value={newUser.role} onValueChange={(val: UserRole) => setNewUser({...newUser, role: val})}>
                    <SelectTrigger className="rounded-xl font-medium"><SelectValue /></SelectTrigger>
                    <SelectContent>
                      <SelectItem value="Administrador">Administrador</SelectItem>
                      <SelectItem value="Jefe de Carrera">Jefe de Carrera</SelectItem>
                      <SelectItem value="Docente">Docente</SelectItem>
                    </SelectContent>
                  </Select>
                </div>
                <DialogFooter className="pt-4">
                  <Button type="submit" className="w-full bg-primary hover:bg-accent text-white rounded-xl h-11 font-bold uppercase tracking-widest text-[10px]">Guardar Personal</Button>
                </DialogFooter>
              </form>
            </DialogContent>
          </Dialog>
        </div>
      </div>

      <div className="relative max-w-md">
        <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
        <Input 
          placeholder="Buscar personal..." 
          className="pl-10 h-10 bg-white border-border/60 rounded-xl"
          value={searchTerm}
          onChange={(e) => setSearchTerm(e.target.value)}
        />
      </div>

      <div className="bg-white rounded-2xl shadow-sm border border-border/40 overflow-hidden">
        <Table>
          <TableHeader className="bg-slate-50/50">
            <TableRow>
              <TableHead className="font-bold py-4 px-6 uppercase text-[10px] tracking-widest">Identidad</TableHead>
              <TableHead className="font-bold uppercase text-[10px] tracking-widest">Rol</TableHead>
              <TableHead className="font-bold text-right pr-6 uppercase text-[10px] tracking-widest">Gestión</TableHead>
            </TableRow>
          </TableHeader>
          <TableBody>
            {isLoading ? (
              <TableRow><TableCell colSpan={3} className="h-48 text-center"><Loader2 className="w-6 h-6 animate-spin text-primary mx-auto" /></TableCell></TableRow>
            ) : filteredUsers.length === 0 ? (
              <TableRow><TableCell colSpan={3} className="h-24 text-center text-muted-foreground">No se encontraron registros de personal.</TableCell></TableRow>
            ) : filteredUsers.map((u) => (
              <TableRow key={u.id} className="hover:bg-slate-50/30">
                <TableCell className="py-4 px-6">
                  <div className="flex items-center gap-3">
                    <div className="w-9 h-9 rounded-full bg-primary/5 flex items-center justify-center text-primary"><UserIcon className="w-4 h-4" /></div>
                    <div>
                      <div className="font-semibold text-sm">{u.firstName} {u.lastName}</div>
                      <div className="text-[11px] text-muted-foreground">{u.email}</div>
                    </div>
                  </div>
                </TableCell>
                <TableCell>
                  <Badge variant="outline" className={cn(
                    "font-bold px-3 py-1 rounded-full text-[9px] uppercase",
                    u.role === 'Administrador' ? "bg-slate-900 text-white" : "border-primary text-primary"
                  )}>
                    {u.role}
                  </Badge>
                </TableCell>
                <TableCell className="text-right pr-6">
                  <DropdownMenu>
                    <DropdownMenuTrigger asChild><Button variant="ghost" size="icon" className="rounded-full h-8 w-8"><MoreVertical className="h-4 w-4" /></Button></DropdownMenuTrigger>
                    <DropdownMenuContent align="end" className="rounded-xl border-border/40">
                      <DropdownMenuItem onClick={() => { setEditingUser(u); setIsEditDialogOpen(true); }} className="gap-2 font-medium text-xs"><Edit2 className="w-3 h-3" /> Editar</DropdownMenuItem>
                      <DropdownMenuItem onClick={() => handleDeleteUser(u.id)} className="gap-2 text-primary font-medium text-xs"><Trash2 className="w-3 h-3" /> Eliminar</DropdownMenuItem>
                    </DropdownMenuContent>
                  </DropdownMenu>
                </TableCell>
              </TableRow>
            ))}
          </TableBody>
        </Table>
      </div>
    </div>
  );
}
