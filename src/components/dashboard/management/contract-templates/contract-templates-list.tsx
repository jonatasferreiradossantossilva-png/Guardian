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
import { MoreHorizontal, PlusCircle, FileText } from "lucide-react";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
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
import { useToast } from "@/hooks/use-toast";
import { useMockCollection, useMockData } from "@/hooks/use-mock-data";
import { ContractTemplateForm } from "./contract-template-form";

type Template = {
  id: string;
  name: string;
  content: string;
  createdAt: string;
};

interface ContractTemplatesListProps {
  initialTemplates: Template[];
}

export function ContractTemplatesList({ initialTemplates }: ContractTemplatesListProps) {
  const { toast } = useToast();
  const { deleteDoc } = useMockData();
  
  const [isFormOpen, setIsFormOpen] = useState(false);
  const [isDeleteDialogOpen, setIsDeleteDialogOpen] = useState(false);
  const [selectedTemplate, setSelectedTemplate] = useState<Template | null>(null);

  const { data: liveTemplates, isLoading } = useMockCollection('contract_templates');
  const templates = liveTemplates ?? initialTemplates;

  const handleEdit = (template: Template) => {
    setSelectedTemplate(template);
    setIsFormOpen(true);
  };

  const handleDelete = (template: Template) => {
    setSelectedTemplate(template);
    setIsDeleteDialogOpen(true);
  };
  
  const confirmDelete = () => {
    if (!selectedTemplate) return;
    deleteDoc('contract_templates', selectedTemplate.id);
    toast({
        title: "Modelo de contrato deletado!",
        description: `O modelo ${selectedTemplate.name} foi removido.`,
        variant: "destructive"
    });
    setIsDeleteDialogOpen(false);
    setSelectedTemplate(null);
  }

  const handleFormSubmit = () => {
    setIsFormOpen(false);
    setSelectedTemplate(null);
  };

  return (
    <div>
      <div className="flex items-center justify-between mb-6">
        <h1 className="text-3xl font-bold tracking-tight">
          Modelos de Contrato
        </h1>
        <Dialog open={isFormOpen} onOpenChange={setIsFormOpen}>
          <DialogTrigger asChild>
            <Button onClick={() => {
              setSelectedTemplate(null);
              setIsFormOpen(true);
            }}>
              <PlusCircle className="mr-2 h-4 w-4" />
              Criar Novo Modelo
            </Button>
          </DialogTrigger>
          <ContractTemplateForm 
            template={selectedTemplate || undefined} 
            onFormSubmit={handleFormSubmit}
          />
        </Dialog>
      </div>
      <Card>
        <CardHeader>
          <CardTitle>Lista de Modelos</CardTitle>
          <CardDescription>Crie e gerencie os modelos de contrato que serão usados para gerar os documentos dos alunos.</CardDescription>
        </CardHeader>
        <CardContent>
          <div className="hidden md:block">
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>Nome do Modelo</TableHead>
                  <TableHead>Trecho do Conteúdo</TableHead>
                  <TableHead className="text-right">Ações</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {isLoading && (
                  <TableRow><TableCell colSpan={3} className="text-center h-24">Carregando...</TableCell></TableRow>
                )}
                {!isLoading && templates && templates.length > 0 ? (
                  templates.map((template) => (
                    <TableRow key={template.id}>
                      <TableCell className="font-medium">{template.name}</TableCell>
                      <TableCell className="text-muted-foreground italic text-xs">"{template.content.substring(0, 80)}..."</TableCell>
                      <TableCell className="text-right">
                       <DropdownMenu>
                        <DropdownMenuTrigger asChild>
                          <Button variant="ghost" className="h-8 w-8 p-0"><MoreHorizontal className="h-4 w-4" /></Button>
                        </DropdownMenuTrigger>
                        <DropdownMenuContent align="end">
                          <DropdownMenuLabel>Ações</DropdownMenuLabel>
                          <DropdownMenuItem onClick={() => handleEdit(template)}>Editar</DropdownMenuItem>
                          <DropdownMenuSeparator />
                          <DropdownMenuItem className="text-red-600" onClick={() => handleDelete(template)}>Deletar</DropdownMenuItem>
                        </DropdownMenuContent>
                      </DropdownMenu>
                    </TableCell>
                  </TableRow>
                ))
              ) : (
                !isLoading && (
                  <TableRow><TableCell colSpan={3} className="text-center h-24">Nenhum modelo de contrato cadastrado.</TableCell></TableRow>
                )
              )}
            </TableBody>
          </Table>
          </div>
          <div className="md:hidden space-y-4">
             {isLoading && <p className="text-center py-10">Carregando...</p>}
             {!isLoading && templates && templates.length > 0 ? (
                templates.map((template) => (
                  <Card key={template.id} className="p-4">
                    <div className="flex items-start justify-between">
                        <p className="font-medium pr-4">{template.name}</p>
                        <DropdownMenu>
                            <DropdownMenuTrigger asChild><Button variant="ghost" className="h-8 w-8 p-0 flex-shrink-0 -mt-1 -mr-2"><MoreHorizontal className="h-4 w-4" /></Button></DropdownMenuTrigger>
                            <DropdownMenuContent align="end">
                                <DropdownMenuLabel>Ações</DropdownMenuLabel>
                                <DropdownMenuItem onClick={() => handleEdit(template)}>Editar</DropdownMenuItem>
                                <DropdownMenuSeparator />
                                <DropdownMenuItem className="text-red-600" onClick={() => handleDelete(template)}>Deletar</DropdownMenuItem>
                            </DropdownMenuContent>
                        </DropdownMenu>
                    </div>
                    <p className="text-xs text-muted-foreground italic mt-2">"{template.content.substring(0, 100)}..."</p>
                  </Card>
                ))
             ) : (
                !isLoading && <p className="text-center text-muted-foreground py-10">Nenhum modelo cadastrado.</p>
             )}
          </div>
        </CardContent>
      </Card>
      <AlertDialog open={isDeleteDialogOpen} onOpenChange={setIsDeleteDialogOpen}>
        <AlertDialogContent>
            <AlertDialogHeader>
                <AlertDialogTitle>Você tem certeza?</AlertDialogTitle>
                <AlertDialogDescription>
                    Esta ação não pode ser desfeita. Isso irá deletar permanentemente o modelo <span className="font-bold">{selectedTemplate?.name}</span>.
                </AlertDialogDescription>
            </AlertDialogHeader>
            <AlertDialogFooter>
                <AlertDialogCancel onClick={() => setSelectedTemplate(null)}>Cancelar</AlertDialogCancel>
                <AlertDialogAction onClick={confirmDelete}>Deletar</AlertDialogAction>
            </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </div>
  );
}
