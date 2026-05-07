"use client";

import { useState, useMemo, useEffect } from "react";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import { Button } from "@/components/ui/button";
import { MoreHorizontal, PlusCircle, Edit, Trash2, Share2, Search, ExternalLink, Loader2, GraduationCap } from "lucide-react";
import { Card, CardContent, CardHeader, CardTitle, CardFooter } from "@/components/ui/card";
import { SafeTableRow, SafeRow } from "@/components/shared/safe-table";
import { safeString, safeArray, safeInitials } from "@/lib/safe-render";
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
import { useDataCollection, useData } from '@/hooks/use-data';
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { Badge } from "@/components/ui/badge";
import { Input } from "@/components/ui/input";
import { PaginationControls } from "@/components/ui/pagination-controls";
import { InviteDialog } from "@/components/dashboard/invite-dialog";
import Link from 'next/link';

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

const ITEMS_PER_PAGE = 10;

export function ParentsList({ initialParents }: ParentsListProps) {
  const { toast } = useToast();
  const { deleteDoc } = useData();

  const [mounted, setMounted] = useState(false);
  const [isFormOpen, setIsFormOpen] = useState(false);
  const [isDeleteDialogOpen, setIsDeleteDialogOpen] = useState(false);
  const [selectedParent, setSelectedParent] = useState<Parent | null>(null);
  const [isInviteDialogOpen, setIsInviteDialogOpen] = useState(false);
  
  // Search and Pagination
  const [searchQuery, setSearchQuery] = useState("");
  const [currentPage, setCurrentPage] = useState(1);

  useEffect(() => {
    setMounted(true);
  }, []);

  const { data: liveParents, isLoading: areParentsLoading } = useDataCollection<Parent>('parents');
  const { data: allStudents, isLoading: areStudentsLoading } = useDataCollection<any>('students');

  const parents = liveParents ?? initialParents;
  const isLoading = areParentsLoading || areStudentsLoading;

  const parentChildrenMap = useMemo(() => {
      const map = new Map<string, string[]>();
      if (!allStudents) return map;
      
      allStudents.forEach(s => {
          if (!map.has(s.parentId)) map.set(s.parentId, []);
          map.get(s.parentId)?.push(s.name);
      });
      return map;
  }, [allStudents]);

  useEffect(() => {
    setCurrentPage(1);
  }, [searchQuery]);

  const filteredParentsList = useMemo(() => {
    if (!parents) return [];
    return parents.filter(p => 
        p.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
        p.email.toLowerCase().includes(searchQuery.toLowerCase()) ||
        p.phone.includes(searchQuery)
    );
  }, [parents, searchQuery]);

  const paginatedParents = useMemo(() => {
    const startIndex = (currentPage - 1) * ITEMS_PER_PAGE;
    return filteredParentsList.slice(startIndex, startIndex + ITEMS_PER_PAGE);
  }, [filteredParentsList, currentPage]);

  const totalPages = Math.ceil(filteredParentsList.length / ITEMS_PER_PAGE);

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
    return `${safeString(parent.street)}, ${safeString(parent.number, 's/n')} - ${safeString(parent.city)}, ${safeString(parent.state)}`;
  }


  if (!mounted) {
    return (
      <div className="flex h-96 items-center justify-center">
        <Loader2 className="h-8 w-8 animate-spin text-primary" />
      </div>
    );
  }

  return (
    <div>
      <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4 mb-6">
        <h1 className="text-3xl font-bold tracking-tight">
          Pais e Responsáveis
        </h1>
        <div className="flex gap-2 w-full sm:w-auto">
            <Button variant="outline" size="sm" asChild className="hidden md:flex">
                <Link href="/register">
                    <ExternalLink className="mr-2 h-4 w-4" /> Testar Cadastro
                </Link>
            </Button>
            <Button variant="outline" onClick={() => setIsInviteDialogOpen(true)} className="flex-1 sm:flex-none">
                <Share2 className="mr-2 h-4 w-4" /> Convidar Pais
            </Button>
            <Dialog open={isFormOpen} onOpenChange={setIsFormOpen}>
                <DialogTrigger asChild>
                    <Button className="flex-1 sm:flex-none" onClick={() => {
                        setSelectedParent(null);
                        setIsFormOpen(true);
                    }}>
                    <PlusCircle className="mr-2 h-4 w-4" />
                    Novo Responsável
                    </Button>
                </DialogTrigger>
                <ParentForm parent={selectedParent || undefined} onFormSubmit={handleFormSubmit} />
            </Dialog>
        </div>
      </div>

      <div className="relative mb-6">
        <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
        <Input 
            placeholder="Buscar por nome, e-mail ou telefone..." 
            className="pl-10"
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
        />
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
                  <TableHead>Filhos Cadastrados</TableHead>
                  <TableHead>Telefone</TableHead>
                  <TableHead>Endereço</TableHead>
                  <TableHead>Status</TableHead>
                  <TableHead className="text-right">Ações</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {isLoading && (
                  <TableRow>
                    <TableCell colSpan={6} className="text-center h-24">
                      Carregando...
                    </TableCell>
                  </TableRow>
                )}
                {!isLoading && safeArray<Parent>(paginatedParents).length > 0 ? (
                  safeArray<Parent>(paginatedParents).map((parent: Parent) => {
                    const children = safeArray<string>(parentChildrenMap.get(parent.id) || []);
                    return (
                    <SafeTableRow key={parent.id} name={`ParentRow-${parent.id}`}>
                      <TableCell>
                        <div className="flex items-center gap-3">
                          <Avatar>
                            <AvatarImage src={`https://picsum.photos/seed/parent-${parent.id}/100/100`} alt={parent.name} />
                            <AvatarFallback>{safeInitials(parent.name)}</AvatarFallback>
                          </Avatar>
                          <div>
                            <p className="font-medium">{safeString(parent.name, 'Responsável')}</p>
                            <p className="text-xs text-muted-foreground">{safeString(parent.email, '---')}</p>
                          </div>
                        </div>
                      </TableCell>
                      <TableCell>
                          <div className="flex flex-wrap gap-1">
                              {children.length > 0 ? (
                                  children.map((name: string, i: number) => (
                                      <Badge key={i} variant="outline" className="text-[10px] font-normal">
                                          <GraduationCap className="mr-1 h-2 w-2" /> {safeString(name)}
                                      </Badge>
                                  ))
                              ) : (
                                  <span className="text-xs text-muted-foreground italic">Sem filhos</span>
                              )}
                          </div>
                      </TableCell>
                      <TableCell>{safeString(parent.phone, '---')}</TableCell>
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
                    </SafeTableRow>
                  )})

                ) : (
                  !isLoading && (
                    <TableRow>
                      <TableCell colSpan={6} className="text-center h-24">
                        {searchQuery ? "Nenhum responsável encontrado." : "Nenhum responsável cadastrado."}
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
            {!isLoading && safeArray<Parent>(paginatedParents).length > 0 ? (
              <div className="space-y-4">
                {safeArray<Parent>(paginatedParents).map((parent: Parent) => {
                  const children = safeArray<string>(parentChildrenMap.get(parent.id) || []);
                  return (
                  <SafeRow key={parent.id} name={`ParentCard-${parent.id}`}>
                    <Card key={parent.id} className="overflow-hidden">
                      <div className="p-4">
                          <div className="flex items-center justify-between">
                          <div className="flex items-center gap-3">
                              <Avatar>
                              <AvatarImage src={`https://picsum.photos/seed/parent-${parent.id}/100/100`} alt={parent.name} />
                              <AvatarFallback>{safeInitials(parent.name)}</AvatarFallback>
                              </Avatar>
                              <div>
                              <p className="font-medium">{safeString(parent.name, 'Responsável')}</p>
                              <p className="text-xs text-muted-foreground">{safeString(parent.email, '---')}</p>
                              </div>
                          </div>
                          </div>
                          <div className="mt-4 grid grid-cols-2 gap-4 text-sm">
                          <div>
                              <p className="text-muted-foreground text-xs">Telefone</p>
                              <p className="font-medium">{safeString(parent.phone, '---')}</p>
                          </div>
                          <div>
                              <p className="text-muted-foreground text-xs">Status</p>
                              <Badge variant={parent.active !== false ? 'default' : 'secondary'} className={parent.active !== false ? 'mt-1 bg-green-600' : 'mt-1'}>
                              {parent.active !== false ? 'Ativo' : 'Inativo'}
                              </ Badge>
                          </div>
                          <div className="col-span-2">
                              <p className="text-muted-foreground text-xs">Filhos</p>
                              <div className="flex flex-wrap gap-1 mt-1">
                                  {children.length > 0 ? children.map((n: string, i: number) => <Badge key={i} variant="outline" className="text-[9px]">{safeString(n)}</Badge>) : "-"}
                              </div>
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
                  </SafeRow>
                )})}
              </div>

            ) : (
              !isLoading && <p className="text-center text-muted-foreground py-10">Nenhum responsável encontrado.</p>
            )}
          </div>

          <PaginationControls
            currentPage={currentPage}
            totalPages={totalPages}
            onPageChange={setCurrentPage}
            totalItems={filteredParentsList.length}
            itemsPerPage={ITEMS_PER_PAGE}
          />
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

      <InviteDialog isOpen={isInviteDialogOpen} onOpenChange={setIsInviteDialogOpen} />
    </div>
  );
}
