
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

    // Exportar solo los que se ven en esta ventana (no alumnos)
    const exportData = filteredUsers.map(({ id, createdAt, updatedAt, ...rest }) => ({
      ...rest
    }));

    const worksheet = XLSX.utils.json_to_sheet(exportData);
    const workbook = XLSX.utils.book_new();
    XLSX.utils.book_append_sheet(workbook, worksheet, "Usuarios");
    XLSX.writeFile(workbook, "Listado_Personal_SIBF_CAI.xlsx");
    
    toast({ title: "Exportación completa", description: "Archivo Excel generado con éxito." });
  };

  const handleImportExcel = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file || !usersRef) return;

    const reader = new FileReader();
    reader.onload = (evt) => {
      try {
        const bstr = evt.target?.result;
        const workbook = XLSX.read(bstr, { type: 'binary' });
        const wsname = workbook.SheetNames[0];
        const ws = workbook.Sheets[wsname];
        const data = XLSX.utils.sheet_to_json(ws) as any[];

        data.forEach((row) => {
          // Solo importar si no es alumno o si el usuario quiere cargar personal aquí
          const userData = {
            firstName: row.firstName || '',
            lastName: row.lastName || '',
            email: row.email || '',
            password: row.password ? String(row.password) : '123456',
            role: (row.role as UserRole) || 'Docente',
            createdAt: serverTimestamp(),
            updatedAt: serverTimestamp()
          };
          addDocumentNonBlocking(usersRef, userData);
        });

        toast({ title: "Importación masiva", description: `${data.length} usuarios procesados.` });
        if (fileInputRef.current) fileInputRef.current.value = '';
      } catch (error) {
        toast({ variant: "destructive", title: "Error", description: "No se pudo procesar el archivo Excel." });
      }
    };
    reader.readAsBinaryString(file);
  };

  // FILTRO CRÍTICO: Excluir alumnos de esta vista administrativa
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
          <h1 className="text-3xl font-black tracking-tighter text-foreground uppercase">Personal Institucional</h1>
          <p className="text-muted-foreground font-medium">Control de acceso para Administradores, Jefes y Docentes.</p>
        </div>
        
        <div className="flex flex-wrap items-center gap-2">
          <input 
            type="file" 
            ref={fileInputRef} 
            onChange={handleImportExcel} 
            accept=".xlsx, .xls" 
            className="hidden" 
          />
          <Button 
            variant="outline" 
            className="rounded-xl h-11 px-4 border-primary text-primary hover:bg-primary/5 font-bold"
            onClick={() => fileInputRef.current?.click()}
          >
            <Upload className="w-4 h-4 mr-2" />
            Importar Personal
          </Button>
          
          <Button 
            variant="outline" 
            className="rounded-xl h-11 px-4 border-slate-300 text-slate-600 hover:bg-slate-50 font-bold"
            onClick={handleExportExcel}
          >
            <Download className="w-4 h-4 mr-2" />
            Exportar Lista
          </Button>

          <Dialog open={isAddDialogOpen} onOpenChange={setIsAddDialogOpen}>
            <DialogTrigger asChild>
              <Button className="bg-primary hover:bg-accent text-white rounded-xl h-11 px-6 shadow-md shadow-primary/20 font-bold">
                <Plus className="w-5 h-5 mr-2" />
                Nuevo Registro
              </Button>
            </DialogTrigger>
            <DialogContent className="sm:max-w-[450px] rounded-3xl">
              <DialogHeader>
                <DialogTitle className="text-2xl font-black text-primary uppercase tracking-tighter">Registrar Personal</DialogTitle>
                <DialogDescription className="font-bold text-xs uppercase tracking-widest text-muted-foreground">Alta de acceso administrativo/académico</DialogDescription>
              </DialogHeader>
              <form onSubmit={handleAddUser} className="space-y-4 py-4">
                <div className="grid grid-cols-2 gap-4">
                  <div className="grid gap-2">
                    <Label className="text-[10px] font-black uppercase tracking-widest text-muted-foreground">Nombre(s)</Label>
                    <Input value={newUser.firstName} onChange={(e) => setNewUser({...newUser, firstName: e.target.value})} required className="rounded-xl font-medium" />
                  </div>
                  <div className="grid gap-2">
                    <Label className="text-[10px] font-black uppercase tracking-widest text-muted-foreground">Apellido(s)</Label>
                    <Input value={newUser.lastName} onChange={(e) => setNewUser({...newUser, lastName: e.target.value})} required className="rounded-xl font-medium" />
                  </div>
                </div>
                <div className="grid gap-2">
                  <Label className="text-[10px] font-black uppercase tracking-widest text-muted-foreground">Correo Institucional</Label>
                  <Input type="email" value={newUser.email} onChange={(e) => setNewUser({...newUser, email: e.target.value})} required className="rounded-xl font-medium" />
                </div>
                <div className="grid gap-2">
                  <Label className="text-[10px] font-black uppercase tracking-widest text-muted-foreground">Contraseña</Label>
                  <div className="relative">
                    <Key className="absolute left-3 top-3 w-4 h-4 text-muted-foreground" />
                    <Input type="password" value={newUser.password} onChange={(e) => setNewUser({...newUser, password: e.target.value})} required className="rounded-xl pl-10 font-medium" />
                  </div>
                </div>
                <div className="grid gap-2">
                  <Label className="text-[10px] font-black uppercase tracking-widest text-muted-foreground">Rol de Usuario</Label>
                  <Select value={newUser.role} onValueChange={(val: UserRole) => setNewUser({...newUser, role: val})}>
                    <SelectTrigger className="rounded-xl font-bold"><SelectValue /></SelectTrigger>
                    <SelectContent>
                      <SelectItem value="Administrador" className="font-bold">Administrador</SelectItem>
                      <SelectItem value="Jefe de Carrera" className="font-bold">Jefe de Carrera</SelectItem>
                      <SelectItem value="Docente" className="font-bold">Docente</SelectItem>
                    </SelectContent>
                  </Select>
                </div>
                <DialogFooter className="pt-4">
                  <Button type="submit" className="w-full bg-primary hover:bg-accent text-white rounded-xl py-6 font-black uppercase tracking-widest text-xs shadow-lg shadow-primary/20">
                    Guardar en SIBF - CAI
                  </Button>
                </DialogFooter>
              </form>
            </DialogContent>
          </Dialog>
        </div>
      </div>

      <div className="flex flex-col sm:flex-row gap-4">
        <div className="relative flex-1">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
          <Input 
            placeholder="Buscar por nombre o correo..." 
            className="pl-10 h-11 bg-white border-border/60 rounded-xl font-medium"
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
          />
        </div>
      </div>

      <div className="bg-white rounded-3xl shadow-sm border border-border/40 overflow-hidden">
        <Table>
          <TableHeader className="bg-slate-50/50">
            <TableRow>
              <TableHead className="font-black py-5 px-6 uppercase text-[10px] tracking-widest">Usuario</TableHead>
              <TableHead className="font-black uppercase text-[10px] tracking-widest">Rol Institucional</TableHead>
              <TableHead className="font-black text-right pr-6 uppercase text-[10px] tracking-widest">Acciones</TableHead>
            </TableRow>
          </TableHeader>
          <TableBody>
            {isLoading ? (
              <TableRow><TableCell colSpan={3} className="h-48 text-center"><Loader2 className="w-8 h-8 animate-spin text-primary mx-auto" /></TableCell></TableRow>
            ) : filteredUsers.length === 0 ? (
              <TableRow><TableCell colSpan={3} className="h-24 text-center text-muted-foreground font-bold">No se encontró personal registrado.</TableCell></TableRow>
            ) : filteredUsers.map((u) => (
              <TableRow key={u.id} className="group hover:bg-slate-50/40">
                <TableCell className="py-4 px-6">
                  <div className="flex items-center gap-3">
                    <div className="w-10 h-10 rounded-full bg-primary/10 flex items-center justify-center text-primary font-bold"><UserIcon className="w-5 h-5" /></div>
                    <div>
                      <div className="font-black text-sm uppercase tracking-tight">{u.firstName} {u.lastName}</div>
                      <div className="text-xs text-muted-foreground font-medium">{u.email}</div>
                    </div>
                  </div>
                </TableCell>
                <TableCell>
                  <Badge variant="outline" className={cn(
                    "font-black px-3 py-1 rounded-full text-[10px] uppercase tracking-tighter",
                    u.role === 'Administrador' ? "bg-primary text-white border-primary" : "bg-slate-900 text-white border-slate-900"
                  )}>
                    {u.role}
                  </Badge>
                </TableCell>
                <TableCell className="text-right pr-6">
                  <DropdownMenu>
                    <DropdownMenuTrigger asChild><Button variant="ghost" size="icon" className="rounded-full hover:bg-slate-100"><MoreVertical className="h-4 w-4" /></Button></DropdownMenuTrigger>
                    <DropdownMenuContent align="end" className="rounded-xl border-border/40 p-2">
                      <DropdownMenuItem onClick={() => { setEditingUser(u); setIsEditDialogOpen(true); }} className="gap-2 cursor-pointer font-bold text-xs uppercase"><Edit2 className="w-3.5 h-3.5" /> Editar Perfil</DropdownMenuItem>
                      <DropdownMenuItem onClick={() => handleDeleteUser(u.id)} className="gap-2 cursor-pointer text-primary font-bold text-xs uppercase"><Trash2 className="w-3.5 h-3.5" /> Revocar Acceso</DropdownMenuItem>
                    </DropdownMenuContent>
                  </DropdownMenu>
                </TableCell>
              </TableRow>
            ))}
          </TableBody>
        </Table>
      </div>

      {/* Dialogo de Edición */}
      <Dialog open={isEditDialogOpen} onOpenChange={setIsEditDialogOpen}>
        <DialogContent className="sm:max-w-[450px] rounded-3xl">
          <DialogHeader>
            <DialogTitle className="text-2xl font-black text-primary uppercase tracking-tighter">Editar Perfil</DialogTitle>
            <DialogDescription className="font-bold text-xs uppercase tracking-widest text-muted-foreground">Actualización de credenciales</DialogDescription>
          </DialogHeader>
          {editingUser && (
            <form onSubmit={handleEditUser} className="space-y-4 py-4">
              <div className="grid grid-cols-2 gap-4">
                <div className="grid gap-2">
                  <Label className="text-[10px] font-black uppercase tracking-widest text-muted-foreground">Nombre(s)</Label>
                  <Input value={editingUser.firstName} onChange={(e) => setEditingUser({...editingUser, firstName: e.target.value})} required className="rounded-xl font-medium" />
                </div>
                <div className="grid gap-2">
                  <Label className="text-[10px] font-black uppercase tracking-widest text-muted-foreground">Apellido(s)</Label>
                  <Input value={editingUser.lastName} onChange={(e) => setEditingUser({...editingUser, lastName: e.target.value})} required className="rounded-xl font-medium" />
                </div>
              </div>
              <div className="grid gap-2">
                <Label className="text-[10px] font-black uppercase tracking-widest text-muted-foreground">Correo</Label>
                <Input type="email" value={editingUser.email} onChange={(e) => setEditingUser({...editingUser, email: e.target.value})} required className="rounded-xl font-medium" />
              </div>
              <div className="grid gap-2">
                <Label className="text-[10px] font-black uppercase tracking-widest text-muted-foreground">Nueva Contraseña</Label>
                <div className="relative">
                  <Key className="absolute left-3 top-3 w-4 h-4 text-muted-foreground" />
                  <Input type="password" value={editingUser.password || ''} onChange={(e) => setEditingUser({...editingUser, password: e.target.value})} className="rounded-xl pl-10 font-medium" placeholder="Dejar en blanco para no cambiar" />
                </div>
              </div>
              <div className="grid gap-2">
                <Label className="text-[10px] font-black uppercase tracking-widest text-muted-foreground">Rol</Label>
                <Select value={editingUser.role} onValueChange={(val: UserRole) => setEditingUser({...editingUser, role: val})}>
                  <SelectTrigger className="rounded-xl font-bold"><SelectValue /></SelectTrigger>
                  <SelectContent>
                    <SelectItem value="Administrador" className="font-bold">Administrador</SelectItem>
                    <SelectItem value="Jefe de Carrera" className="font-bold">Jefe de Carrera</SelectItem>
                    <SelectItem value="Docente" className="font-bold">Docente</SelectItem>
                  </SelectContent>
                </Select>
              </div>
              <DialogFooter className="pt-4">
                <Button type="submit" className="w-full bg-primary hover:bg-accent text-white rounded-xl py-6 font-black uppercase tracking-widest text-xs shadow-lg shadow-primary/20">
                  Actualizar Cambios
                </Button>
              </DialogFooter>
            </form>
          )}
        </DialogContent>
      </Dialog>
    </div>
  );
}
