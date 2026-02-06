
"use client";

import { useState } from "react";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import { Button } from "@/components/ui/button";
import { MoreHorizontal, PlusCircle, Edit, Trash2 } from "lucide-react";
import { Card, CardContent, CardHeader, CardTitle, CardFooter } from "@/components/ui/card";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuLabel,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import { Dialog, DialogTrigger } from "@/components/ui/dialog";
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
} from "@/components/ui/alert-dialog";
import { ParentForm } from "@/components/dashboard/management/parents/parent-form";
import { useToast } from "@/hooks/use-toast";
import { useMockCollection, useMockData } from "@/hooks/use-mock-data";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { Badge } from "@/components/ui/badge";


type Parent = {
  id: string;
  name: string;
  email: string;
  phone: string;
  userId?: string;
  cpf?: string;
  rg?: string;
  street?: string;
  number?: string;
  neighborhood?: string;
  city?: string;
  state?: string;
  active?: boolean;
};

interface ParentsListProps {
  initialParents: Parent[];
}

export function ParentsList({ initialParents }: ParentsListProps) {
  const { toast } = useToast();
  const { deleteDoc } = useMockData();

  const [isFormOpen, setIsFormOpen] = useState(false);
  const [isDeleteDialogOpen, setIsDeleteDialogOpen] = useState(false);
  const [selectedParent, setSelectedParent] = useState<Parent | null>(null);
  
  const { data: liveParents, isLoading } = useMockCollection('parents');
  const parents = liveParents ?? initialParents;

  const handleEdit = (parent: Parent) => {
    setSelectedParent(parent);
    setIsFormOpen(true);
  };

  const handleDelete = (parent: Parent) => {
    setSelectedParent(parent);
    setIsDeleteDialogOpen(true);
  };
  
  const confirmDelete = () => {
    if (!selectedParent) return;
    deleteDoc('parents', selectedParent.id);
    toast({
        title: "Responsável deletado!",
        description: `${selectedParent.name} foi removido do sistema.`,
        variant: "destructive"
    });
    setIsDeleteDialogOpen(false);
    setSelectedParent(null);
  }

  const handleFormSubmit = () => {
    setIsFormOpen(false);
    setSelectedParent(null);
  };
  
  const formatAddress = (parent: Parent) => {
    if (!parent.street) return 'N/A';
    return `${parent.street}, ${parent.number} - ${parent.city}, ${parent.state}`;
  }


  return (
    <div>
      <div className="flex items-center justify-between mb-6">
        <h1 className="text-3xl font-bold tracking-tight">
          Gerenciamento de Pais e Responsáveis
        </h1>
        <Dialog open={isFormOpen} onOpenChange={setIsFormOpen}>
          <DialogTrigger asChild>
            <Button onClick={() => {
              setSelectedParent(null);
              setIsFormOpen(true);
            }}>
              <PlusCircle className="mr-2 h-4 w-4" />
              Adicionar Responsável
            </Button>
          </DialogTrigger>
          <ParentForm parent={selectedParent || undefined} onFormSubmit={handleFormSubmit} />
        </Dialog>
      </div>
      <Card>
        <CardHeader>
          <CardTitle>Lista de Responsáveis</CardTitle>
        </CardHeader>
        <CardContent>
          {/* Desktop View */}
          <div className="hidden md:block">
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>Responsável</TableHead>
                  <TableHead>Telefone</TableHead>
                  <TableHead>Endereço</TableHead>
                  <TableHead>Status</TableHead>
                  <TableHead className="text-right">Ações</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {isLoading && (
                  <TableRow>
                    <TableCell colSpan={5} className="text-center h-24">
                      Carregando...
                    </TableCell>
                  </TableRow>
                )}
                {!isLoading && parents && parents.length > 0 ? (
                  parents.map((parent) => (
                    <TableRow key={parent.id}>
                      <TableCell>
                        <div className="flex items-center gap-3">
                          <Avatar>
                            <AvatarImage src={`https://picsum.photos/seed/parent-${parent.id}/100/100`} alt={parent.name} />
                            <AvatarFallback>{parent.name.split(' ').map(n => n[0]).join('')}</AvatarFallback>
                          </Avatar>
                          <div>
                            <p className="font-medium">{parent.name}</p>
                            <p className="text-xs text-muted-foreground">{parent.email}</p>
                          </div>
                        </div>
                      </TableCell>
                      <TableCell>{parent.phone}</TableCell>
                      <TableCell>{formatAddress(parent)}</TableCell>
                      <TableCell>
                        <Badge variant={parent.active !== false ? 'default' : 'secondary'} className={parent.active !== false ? 'bg-green-600' : ''}>
                          {parent.active !== false ? 'Ativo' : 'Inativo'}
                        </Badge>
                      </TableCell>
                      <TableCell className="text-right">
                        <div className="flex items-center justify-end gap-2">
                            <Button variant="outline" size="sm" onClick={() => handleEdit(parent)}>
                                <Edit className="mr-2 h-4 w-4" /> Editar
                            </Button>
                            <DropdownMenu>
                                <DropdownMenuTrigger asChild>
                                    <Button variant="ghost" className="h-8 w-8 p-0">
                                        <span className="sr-only">Mais Ações</span>
                                        <MoreHorizontal className="h-4 w-4" />
                                    </Button>
                                </DropdownMenuTrigger>
                                <DropdownMenuContent align="end">
                                    <DropdownMenuLabel>Mais Ações</DropdownMenuLabel>
                                    <DropdownMenuItem className="text-red-600" onClick={() => handleDelete(parent)}>
                                        <Trash2 className="mr-2 h-4 w-4" /> Deletar
                                    </DropdownMenuItem>
                                </DropdownMenuContent>
                            </DropdownMenu>
                        </div>
                      </TableCell>
                    </TableRow>
                  ))
                ) : (
                  !isLoading && (
                    <TableRow>
                      <TableCell colSpan={5} className="text-center h-24">
                        Nenhum responsável cadastrado.
                      </TableCell>
                    </TableRow>
                  )
                )}
              </TableBody>
            </Table>
          </div>
          {/* Mobile View */}
          <div className="md:hidden">
            {isLoading && <p className="text-center py-10">Carregando...</p>}
            {!isLoading && parents && parents.length > 0 ? (
              <div className="space-y-4">
                {parents.map((parent) => (
                  <Card key={parent.id} className="overflow-hidden">
                    <div className="p-4">
                        <div className="flex items-center justify-between">
                        <div className="flex items-center gap-3">
                            <Avatar>
                            <AvatarImage src={`https://picsum.photos/seed/parent-${parent.id}/100/100`} alt={parent.name} />
                            <AvatarFallback>{parent.name.split(' ').map(n => n[0]).join('')}</AvatarFallback>
                            </Avatar>
                            <div>
                            <p className="font-medium">{parent.name}</p>
                            <p className="text-xs text-muted-foreground">{parent.email}</p>
                            </div>
                        </div>
                        </div>
                        <div className="mt-4 grid grid-cols-2 gap-4 text-sm">
                        <div>
                            <p className="text-muted-foreground text-xs">Telefone</p>
                            <p className="font-medium">{parent.phone}</p>
                        </div>
                        <div>
                            <p className="text-muted-foreground text-xs">Status</p>
                            <Badge variant={parent.active !== false ? 'default' : 'secondary'} className={parent.active !== false ? 'mt-1 bg-green-600' : 'mt-1'}>
                            {parent.active !== false ? 'Ativo' : 'Inativo'}
                            </Badge>
                        </div>
                        <div className="col-span-2">
                            <p className="text-muted-foreground text-xs">Endereço</p>
                            <p className="font-medium">{formatAddress(parent)}</p>
                        </div>
                        </div>
                    </div>
                     <CardFooter className="p-2 bg-secondary/50 border-t flex gap-2">
                        <Button variant="outline" size="sm" className="w-full" onClick={() => handleEdit(parent)}>
                            <Edit className="mr-2 h-4 w-4" /> Editar
                        </Button>
                        <Button variant="destructive" size="sm" className="w-full" onClick={() => handleDelete(parent)}>
                            <Trash2 className="mr-2 h-4 w-4" /> Deletar
                        </Button>
                    </CardFooter>
                  </Card>
                ))}
              </div>
            ) : (
              !isLoading && <p className="text-center text-muted-foreground py-10">Nenhum responsável cadastrado.</p>
            )}
          </div>
        </CardContent>
      </Card>
      <AlertDialog open={isDeleteDialogOpen} onOpenChange={setIsDeleteDialogOpen}>
        <AlertDialogContent>
            <AlertDialogHeader>
                <AlertDialogTitle>Você tem certeza?</AlertDialogTitle>
                <AlertDialogDescription>
                    Esta ação não pode ser desfeita. Isso irá deletar permanentemente o responsável <span className="font-bold">{selectedParent?.name}</span>.
                </AlertDialogDescription>
            </AlertDialogHeader>
            <AlertDialogFooter>
                <AlertDialogCancel onClick={() => setSelectedParent(null)}>Cancelar</AlertDialogCancel>
                <AlertDialogAction onClick={confirmDelete}>Deletar</AlertDialogAction>
            </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </div>
  );
}
