
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
import { PlusCircle, Edit, Copy, Trash2 } from "lucide-react";
import { Card, CardContent, CardHeader, CardTitle, CardDescription, CardFooter } from "@/components/ui/card";
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
import { useDataCollection, useData } from '@/hooks/use-data';
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
  const { deleteDoc } = useData();
  
  const [isFormOpen, setIsFormOpen] = useState(false);
  const [isDeleteDialogOpen, setIsDeleteDialogOpen] = useState(false);
  const [selectedTemplate, setSelectedTemplate] = useState<Partial<Template> | null>(null);

  const { data: liveTemplates, isLoading } = useDataCollection('contract_templates');
  const templates = liveTemplates ?? initialTemplates;

  const handleEdit = (template: Template) => {
    setSelectedTemplate(template);
    setIsFormOpen(true);
  };

  const handleDuplicate = (template: Template) => {
    const { id, createdAt, ...templateData } = template;
    setSelectedTemplate({
      ...templateData,
      name: `${template.name} (Cópia)`,
    });
    setIsFormOpen(true);
  };

  const handleDelete = (template: Template) => {
    setSelectedTemplate(template);
    setIsDeleteDialogOpen(true);
  };
  
  const confirmDelete = () => {
    if (!selectedTemplate || !selectedTemplate.id) return;
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
            templates={templates || []}
            onFormSubmit={handleFormSubmit}
          />
        </Dialog>
      </div>
      <Card>
        <CardHeader>
          <CardTitle>Lista de Modelos</CardTitle>
          <CardDescription>Gerencie os modelos que serão usados para gerar contratos automáticos.</CardDescription>
        </CardHeader>
        <CardContent>
          <div className="hidden md:block">
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>Nome do Modelo</TableHead>
                  <TableHead>Trecho do Conteúdo</TableHead>
                  <TableHead className="text-right w-[340px]">Ações</TableHead>
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
                      <TableCell className="text-muted-foreground italic text-xs">"{(template.content || '').substring(0, 80)}..."</TableCell>
                      <TableCell className="text-right">
                        <div className="flex items-center justify-end gap-2">
                           <Button variant="outline" size="sm" onClick={() => handleEdit(template)}>
                               <Edit className="mr-2 h-4 w-4" /> Editar
                           </Button>
                           <Button variant="outline" size="sm" onClick={() => handleDuplicate(template)}>
                               <Copy className="mr-2 h-4 w-4" /> Duplicar
                           </Button>
                           <Button variant="destructive" size="sm" onClick={() => handleDelete(template)}>
                               <Trash2 className="mr-2 h-4 w-4" /> Deletar
                           </Button>
                       </div>
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
                  <Card key={template.id} className="overflow-hidden">
                    <div className="p-4">
                      <p className="font-medium pr-4">{template.name}</p>
                      <p className="text-xs text-muted-foreground italic mt-2">"{(template.content || '').substring(0, 100)}..."</p>
                    </div>
                    <CardFooter className="p-2 border-t bg-secondary/50 flex flex-wrap gap-2">
                       <Button variant="outline" size="sm" className="flex-1" onClick={() => handleEdit(template)}>
                         <Edit className="mr-2 h-4 w-4" /> Editar
                       </Button>
                       <Button variant="outline" size="sm" className="flex-1" onClick={() => handleDuplicate(template)}>
                         <Copy className="mr-2 h-4 w-4" /> Duplicar
                       </Button>
                       <Button variant="destructive" size="sm" className="w-full" onClick={() => handleDelete(template)}>
                         <Trash2 className="mr-2 h-4 w-4" /> Deletar
                       </Button>
                    </CardFooter>
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
