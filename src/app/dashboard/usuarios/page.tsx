
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

  const handleImportExcel = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file || !usersRef) return;

    const reader = new FileReader();
    reader.onload = (evt) => {
      try {
        const bstr = evt.target?.result;
        const workbook = XLSX.read(bstr, { type: 'binary' });
        const ws = workbook.Sheets[workbook.SheetNames[0]];
        const data = XLSX.utils.sheet_to_json(ws) as any[];

        data.forEach((row) => {
          const userData = {
            ...row,
            role: (row.role as UserRole) || 'Docente',
            createdAt: serverTimestamp(),
            updatedAt: serverTimestamp()
          };
          addDocumentNonBlocking(usersRef, userData);
        });

        toast({ title: "Importación masiva", description: `${data.length} registros procesados.` });
        if (fileInputRef.current) fileInputRef.current.value = '';
      } catch (error) {
        toast({ variant: "destructive", title: "Error en importación" });
      }
    };
    reader.readAsBinaryString(file);
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
          <h1 className="text-3xl font-bold tracking-tight text-foreground uppercase">Personal</h1>
          <p className="text-muted-foreground font-medium">Administradores, Jefes y Docentes de SIBF - CAI.</p>
        </div>
        
        <div className="flex flex-wrap items-center gap-2">
          <input type="file" ref={fileInputRef} onChange={handleImportExcel} accept=".xlsx, .xls" className="hidden" />
          <Button variant="outline" className="rounded-xl h-11 px-4 font-semibold" onClick={() => fileInputRef.current?.click()}><Upload className="w-4 h-4 mr-2" /> Importar</Button>
          <Button variant="outline" className="rounded-xl h-11 px-4 font-semibold" onClick={handleExportExcel}><Download className="w-4 h-4 mr-2" /> Exportar</Button>
          <Dialog open={isAddDialogOpen} onOpenChange={setIsAddDialogOpen}>
            <DialogTrigger asChild>
              <Button className="bg-primary hover:bg-accent text-white rounded-xl h-11 px-6 shadow-md shadow-primary/20 font-bold"><Plus className="w-5 h-5 mr-2" /> Nuevo Registro</Button>
            </DialogTrigger>
            <DialogContent className="sm:max-w-[450px] rounded-3xl">
              <DialogHeader>
                <DialogTitle className="text-2xl font-bold text-primary uppercase tracking-tight">Nuevo Personal</DialogTitle>
                <DialogDescription className="font-semibold text-[10px] uppercase tracking-widest text-muted-foreground">Alta de acceso administrativo</DialogDescription>
              </DialogHeader>
              <form onSubmit={handleAddUser} className="space-y-4 py-4">
                <div className="grid grid-cols-2 gap-4">
                  <div className="grid gap-2">
                    <Label className="text-[10px] font-bold uppercase tracking-widest text-muted-foreground">Nombre(s)</Label>
                    <Input value={newUser.firstName} onChange={(e) => setNewUser({...newUser, firstName: e.target.value})} required className="rounded-xl font-medium" />
                  </div>
                  <div className="grid gap-2">
                    <Label className="text-[10px] font-bold uppercase tracking-widest text-muted-foreground">Apellido(s)</Label>
                    <Input value={newUser.lastName} onChange={(e) => setNewUser({...newUser, lastName: e.target.value})} required className="rounded-xl font-medium" />
                  </div>
                </div>
                <div className="grid gap-2">
                  <Label className="text-[10px] font-bold uppercase tracking-widest text-muted-foreground">Correo</Label>
                  <Input type="email" value={newUser.email} onChange={(e) => setNewUser({...newUser, email: e.target.value})} required className="rounded-xl font-medium" />
                </div>
                <div className="grid gap-2">
                  <Label className="text-[10px] font-bold uppercase tracking-widest text-muted-foreground">Contraseña</Label>
                  <Input type="password" value={newUser.password} onChange={(e) => setNewUser({...newUser, password: e.target.value})} required className="rounded-xl font-medium" />
                </div>
                <div className="grid gap-2">
                  <Label className="text-[10px] font-bold uppercase tracking-widest text-muted-foreground">Rol</Label>
                  <Select value={newUser.role} onValueChange={(val: UserRole) => setNewUser({...newUser, role: val})}>
                    <SelectTrigger className="rounded-xl font-semibold"><SelectValue /></SelectTrigger>
                    <SelectContent>
                      <SelectItem value="Administrador" className="font-medium">Administrador</SelectItem>
                      <SelectItem value="Jefe de Carrera" className="font-medium">Jefe de Carrera</SelectItem>
                      <SelectItem value="Docente" className="font-medium">Docente</SelectItem>
                    </SelectContent>
                  </Select>
                </div>
                <DialogFooter className="pt-4">
                  <Button type="submit" className="w-full bg-primary hover:bg-accent text-white rounded-xl py-6 font-bold uppercase tracking-widest text-xs shadow-lg shadow-primary/20">Registrar Personal</Button>
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
              <TableHead className="font-bold py-5 px-6 uppercase text-[10px] tracking-widest">Usuario</TableHead>
              <TableHead className="font-bold uppercase text-[10px] tracking-widest">Rol</TableHead>
              <TableHead className="font-bold text-right pr-6 uppercase text-[10px] tracking-widest">Acciones</TableHead>
            </TableRow>
          </TableHeader>
          <TableBody>
            {isLoading ? (
              <TableRow><TableCell colSpan={3} className="h-48 text-center"><Loader2 className="w-8 h-8 animate-spin text-primary mx-auto" /></TableCell></TableRow>
            ) : filteredUsers.length === 0 ? (
              <TableRow><TableCell colSpan={3} className="h-24 text-center text-muted-foreground font-semibold">Sin registros.</TableCell></TableRow>
            ) : filteredUsers.map((u) => (
              <TableRow key={u.id} className="group hover:bg-slate-50/40">
                <TableCell className="py-4 px-6">
                  <div className="flex items-center gap-3">
                    <div className="w-10 h-10 rounded-full bg-primary/10 flex items-center justify-center text-primary font-bold"><UserIcon className="w-5 h-5" /></div>
                    <div>
                      <div className="font-bold text-sm uppercase tracking-tight">{u.firstName} {u.lastName}</div>
                      <div className="text-xs text-muted-foreground font-medium">{u.email}</div>
                    </div>
                  </div>
                </TableCell>
                <TableCell>
                  <Badge variant="outline" className={cn(
                    "font-bold px-3 py-1 rounded-full text-[10px] uppercase tracking-tight",
                    u.role === 'Administrador' ? "bg-primary text-white border-primary" : "bg-slate-900 text-white border-slate-900"
                  )}>
                    {u.role}
                  </Badge>
                </TableCell>
                <TableCell className="text-right pr-6">
                  <DropdownMenu>
                    <DropdownMenuTrigger asChild><Button variant="ghost" size="icon" className="rounded-full hover:bg-slate-100"><MoreVertical className="h-4 w-4" /></Button></DropdownMenuTrigger>
                    <DropdownMenuContent align="end" className="rounded-xl border-border/40 p-2">
                      <DropdownMenuItem onClick={() => { setEditingUser(u); setIsEditDialogOpen(true); }} className="gap-2 cursor-pointer font-semibold text-xs uppercase"><Edit2 className="w-3.5 h-3.5" /> Editar</DropdownMenuItem>
                      <DropdownMenuItem onClick={() => handleDeleteUser(u.id)} className="gap-2 cursor-pointer text-primary font-semibold text-xs uppercase"><Trash2 className="w-3.5 h-3.5" /> Eliminar</DropdownMenuItem>
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
