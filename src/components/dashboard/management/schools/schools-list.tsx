
"use client";

import { useState, useEffect } from "react";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import { Button } from "@/components/ui/button";
import { MoreHorizontal, PlusCircle, Edit, Trash2, Loader2 } from "lucide-react";
import { Card, CardContent, CardHeader, CardTitle, CardFooter } from "@/components/ui/card";
import { SafeTableRow, SafeRow } from "@/components/shared/safe-table";
import { safeString, safeArray } from "@/lib/safe-render";
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
import { SchoolForm } from "@/components/dashboard/management/schools/school-form";
import { useToast } from "@/hooks/use-toast";
import { useMockCollection, useMockData } from "@/hooks/use-mock-data";
import { Badge } from "@/components/ui/badge";


type School = {
  id: string;
  name: string;
  cnpj?: string;
  latitude?: number;
  longitude?: number;
  street?: string;
  number?: string;
  neighborhood?: string;
  city?: string;
  state?: string;
  active?: boolean;
};

interface SchoolsListProps {
  initialSchools: School[];
}

export function SchoolsList({ initialSchools }: SchoolsListProps) {
  const { toast } = useToast();
  const { deleteDoc } = useMockData();
  
  const [mounted, setMounted] = useState(false);
  const [isFormOpen, setIsFormOpen] = useState(false);
  const [isDeleteDialogOpen, setIsDeleteDialogOpen] = useState(false);
  const [selectedSchool, setSelectedSchool] = useState<School | null>(null);
  
  useEffect(() => {
    setMounted(true);
  }, []);

  const { data: liveSchools, isLoading } = useMockCollection('schools');
  const schools = liveSchools ?? initialSchools;

  const handleEdit = (school: School) => {
    setSelectedSchool(school);
    setIsFormOpen(true);
  };

  const handleDelete = (school: School) => {
    setSelectedSchool(school);
    setIsDeleteDialogOpen(true);
  };
  
  const confirmDelete = () => {
    if (!selectedSchool) return;
    deleteDoc('schools', selectedSchool.id);
    toast({
        title: "Escola deletada!",
        description: `A escola ${selectedSchool.name} foi removida do sistema.`,
        variant: "destructive"
    });
    setIsDeleteDialogOpen(false);
    setSelectedSchool(null);
  }

  const handleFormSubmit = () => {
    setIsFormOpen(false);
    setSelectedSchool(null);
  };
  
  const formatAddress = (school: School) => {
    if (!school.street) return 'N/A';
    return `${safeString(school.street)}, ${safeString(school.number, 's/n')} - ${safeString(school.city)}, ${safeString(school.state)}`;
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
      <div className="flex items-center justify-between mb-6">
        <h1 className="text-3xl font-bold tracking-tight">
          Escolas
        </h1>
        <Dialog open={isFormOpen} onOpenChange={setIsFormOpen}>
          <DialogTrigger asChild>
            <Button onClick={() => {
              setSelectedSchool(null);
              setIsFormOpen(true);
            }}>
              <PlusCircle className="mr-2 h-4 w-4" />
              Adicionar Escola
            </Button>
          </DialogTrigger>
          <SchoolForm school={selectedSchool || undefined} onFormSubmit={handleFormSubmit} />
        </Dialog>
      </div>
      <Card>
        <CardHeader>
          <CardTitle>Lista de Escolas</CardTitle>
        </CardHeader>
        <CardContent>
          {/* Desktop View */}
          <div className="hidden md:block">
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>Nome</TableHead>
                  <TableHead>Endereço</TableHead>
                  <TableHead>CNPJ</TableHead>
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
                {!isLoading && safeArray<School>(schools).length > 0 ? (
                  safeArray<School>(schools).map((school: School) => (
                    <SafeTableRow key={school.id} name={`SchoolRow-${school.id}`}>
                      <TableCell className="font-medium">{safeString(school.name, 'Escola')}</TableCell>
                      <TableCell>{formatAddress(school)}</TableCell>
                      <TableCell>{safeString(school.cnpj, 'N/A')}</TableCell>
                      <TableCell>
                        <Badge variant={school.active !== false ? 'default' : 'secondary'} className={school.active !== false ? 'bg-green-600' : ''}>
                          {school.active !== false ? 'Ativa' : 'Inativa'}
                        </Badge>
                      </TableCell>
                      <TableCell className="text-right">
                        <div className="flex items-center justify-end gap-2">
                           <Button variant="outline" size="sm" onClick={() => handleEdit(school)}>
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
                                   <DropdownMenuItem className="text-red-600" onClick={() => handleDelete(school)}>
                                       <Trash2 className="mr-2 h-4 w-4" /> Deletar
                                   </DropdownMenuItem>
                               </DropdownMenuContent>
                           </DropdownMenu>
                        </div>
                      </TableCell>
                    </SafeTableRow>
                  ))

                ) : (
                  !isLoading && (
                    <TableRow>
                      <TableCell colSpan={5} className="text-center h-24">
                        Nenhuma escola cadastrada.
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
            {!isLoading && safeArray<School>(schools).length > 0 ? (
              <div className="space-y-4">
                {safeArray<School>(schools).map((school: School) => (
                  <SafeRow key={school.id} name={`SchoolCard-${school.id}`}>
                    <Card className="overflow-hidden">
                      <div className="p-4">
                          <div className="flex items-start justify-between">
                          <div>
                              <p className="font-medium">{safeString(school.name, 'Escola')}</p>
                              <p className="text-xs text-muted-foreground">CNPJ: {safeString(school.cnpj, 'N/A')}</p>
                          </div>
                          </div>
                          <div className="mt-4 grid grid-cols-2 gap-4 text-sm">
                              <div>
                                  <p className="text-muted-foreground text-xs">Endereço</p>
                                  <p className="font-medium">{formatAddress(school)}</p>
                              </div>
                              <div>
                                  <p className="text-muted-foreground text-xs">Status</p>
                                  <Badge variant={school.active !== false ? 'default' : 'secondary'} className={school.active !== false ? 'mt-1 bg-green-600' : 'mt-1'}>
                                      {school.active !== false ? 'Ativa' : 'Inativa'}
                                  </Badge>
                              </div>
                          </div>
                      </div>
                       <CardFooter className="p-2 bg-secondary/50 border-t flex gap-2">
                          <Button variant="outline" size="sm" className="w-full" onClick={() => handleEdit(school)}>
                              <Edit className="mr-2 h-4 w-4" /> Editar
                          </Button>
                          <Button variant="destructive" size="sm" className="w-full" onClick={() => handleDelete(school)}>
                              <Trash2 className="mr-2 h-4 w-4" /> Deletar
                          </Button>
                      </CardFooter>
                    </Card>
                  </SafeRow>
                ))}
              </div>

            ) : (
              !isLoading && <p className="text-center text-muted-foreground py-10">Nenhuma escola cadastrada.</p>
            )}
          </div>
        </CardContent>
      </Card>
      <AlertDialog open={isDeleteDialogOpen} onOpenChange={setIsDeleteDialogOpen}>
        <AlertDialogContent>
            <AlertDialogHeader>
                <AlertDialogTitle>Você tem certeza?</AlertDialogTitle>
                <AlertDialogDescription>
                    Esta ação não pode ser desfeita. Isso irá deletar permanentemente a escola <span className="font-bold">{selectedSchool?.name}</span>.
                </AlertDialogDescription>
            </AlertDialogHeader>
            <AlertDialogFooter>
                <AlertDialogCancel onClick={() => setSelectedSchool(null)}>Cancelar</AlertDialogCancel>
                <AlertDialogAction onClick={confirmDelete}>Deletar</AlertDialogAction>
            </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </div>
  );
}
