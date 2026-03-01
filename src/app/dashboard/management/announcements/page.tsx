
'use client';

import { useState } from 'react';
import { Card, CardContent, CardHeader, CardTitle, CardDescription, CardFooter } from '@/components/ui/card';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { useMockCollection, useMockData } from '@/hooks/use-mock-data';
import { PlusCircle, Trash2, Megaphone, Clock, AlertTriangle, Users, Car } from 'lucide-react';
import { useToast } from '@/hooks/use-toast';
import { Dialog, DialogTrigger, DialogContent, DialogHeader, DialogTitle, DialogDescription, DialogFooter, DialogClose } from '@/components/ui/dialog';
import { Input } from '@/components/ui/input';
import { Textarea } from '@/components/ui/textarea';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Label } from '@/components/ui/label';
import { format } from 'date-fns';
import { ptBR } from 'date-fns/locale';

export default function AnnouncementsManagementPage() {
  const { data: announcements, isLoading } = useMockCollection('announcements');
  const { addDoc, deleteDoc } = useMockData();
  const { toast } = useToast();

  const [isFormOpen, setIsFormOpen] = useState(false);
  const [newAnnouncement, setNewAnnouncement] = useState({
    title: '',
    content: '',
    priority: 'medium',
    target: 'all'
  });

  const handleCreate = () => {
    if (!newAnnouncement.title || !newAnnouncement.content) {
        toast({ title: "Preencha todos os campos", variant: "destructive" });
        return;
    }

    addDoc('announcements', {
        ...newAnnouncement,
        createdAt: new Date().toISOString()
    });

    toast({ title: "Aviso Publicado!", description: "O comunicado já está visível para pais e motoristas." });
    setIsFormOpen(false);
    setNewAnnouncement({ title: '', content: '', priority: 'medium', target: 'all' });
  };

  const handleDelete = (id: string) => {
    deleteDoc('announcements', id);
    toast({ title: "Aviso Removido", variant: "destructive" });
  };

  return (
    <div className="space-y-6 pb-20">
      <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4">
        <div>
          <h1 className="text-3xl font-bold tracking-tight">Mural de Avisos</h1>
          <p className="text-muted-foreground">Envie comunicados gerais para a sua frota.</p>
        </div>
        <Dialog open={isFormOpen} onOpenChange={setIsFormOpen}>
            <DialogTrigger asChild>
                <Button className="w-full sm:w-auto"><PlusCircle className="mr-2 h-4 w-4" /> Novo Aviso</Button>
            </DialogTrigger>
            <DialogContent className="sm:max-w-md">
                <DialogHeader>
                    <DialogTitle>Publicar Comunicado</DialogTitle>
                    <DialogDescription>Este aviso aparecerá no topo do aplicativo dos pais e motoristas.</DialogDescription>
                </DialogHeader>
                <div className="space-y-4 py-4">
                    <div className="space-y-2">
                        <Label>Título</Label>
                        <Input 
                            placeholder="Ex: Manutenção da Van 02" 
                            value={newAnnouncement.title}
                            onChange={e => setNewAnnouncement({...newAnnouncement, title: e.target.value})}
                        />
                    </div>
                    <div className="space-y-2">
                        <Label>Mensagem</Label>
                        <Textarea 
                            placeholder="Descreva o comunicado em detalhes..." 
                            value={newAnnouncement.content}
                            onChange={e => setNewAnnouncement({...newAnnouncement, content: e.target.value})}
                        />
                    </div>
                    <div className="grid grid-cols-2 gap-4">
                        <div className="space-y-2">
                            <Label>Prioridade</Label>
                            <Select 
                                value={newAnnouncement.priority} 
                                onValueChange={v => setNewAnnouncement({...newAnnouncement, priority: v})}
                            >
                                <SelectTrigger><SelectValue /></SelectTrigger>
                                <SelectContent>
                                    <SelectItem value="low">Baixa</SelectItem>
                                    <SelectItem value="medium">Média</SelectItem>
                                    <SelectItem value="high">Alta (Destaque)</SelectItem>
                                </SelectContent>
                            </Select>
                        </div>
                        <div className="space-y-2">
                            <Label>Destinatários</Label>
                            <Select 
                                value={newAnnouncement.target} 
                                onValueChange={v => setNewAnnouncement({...newAnnouncement, target: v})}
                            >
                                <SelectTrigger><SelectValue /></SelectTrigger>
                                <SelectContent>
                                    <SelectItem value="all">Todos</SelectItem>
                                    <SelectItem value="parents">Apenas Pais</SelectItem>
                                    <SelectItem value="drivers">Apenas Motoristas</SelectItem>
                                </SelectContent>
                            </Select>
                        </div>
                    </div>
                </div>
                <DialogFooter className="gap-2">
                    <DialogClose asChild><Button variant="outline" className="flex-1">Cancelar</Button></DialogClose>
                    <Button onClick={handleCreate} className="flex-1">Publicar Agora</Button>
                </DialogFooter>
            </DialogContent>
        </Dialog>
      </div>

      <Card>
        <CardContent className="p-0 sm:pt-6">
          {isLoading ? (
            <div className="flex justify-center py-10">Carregando...</div>
          ) : announcements && announcements.length > 0 ? (
            <>
              {/* Desktop Table View */}
              <div className="hidden md:block px-6">
                <div className="rounded-md border">
                  <Table>
                    <TableHeader>
                      <TableRow>
                        <TableHead>Comunicado</TableHead>
                        <TableHead>Prioridade</TableHead>
                        <TableHead>Público</TableHead>
                        <TableHead>Data</TableHead>
                        <TableHead className="text-right">Ações</TableHead>
                      </TableRow>
                    </TableHeader>
                    <TableBody>
                      {announcements.sort((a,b) => new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime()).map((ann) => (
                        <TableRow key={ann.id}>
                          <TableCell className="max-w-[300px]">
                            <p className="font-medium truncate">{ann.title}</p>
                            <p className="text-xs text-muted-foreground truncate">{ann.content}</p>
                          </TableCell>
                          <TableCell>
                            <Badge variant={ann.priority === 'high' ? 'destructive' : 'secondary'}>
                                {ann.priority === 'high' ? 'Alta' : ann.priority === 'medium' ? 'Média' : 'Baixa'}
                            </Badge>
                          </TableCell>
                          <TableCell className="text-xs">
                            {ann.target === 'all' ? 'Todos' : ann.target === 'parents' ? 'Pais' : 'Motoristas'}
                          </TableCell>
                          <TableCell className="text-xs text-muted-foreground">
                            {format(new Date(ann.createdAt), "dd/MM/yy HH:mm")}
                          </TableCell>
                          <TableCell className="text-right">
                            <Button variant="ghost" size="icon" className="text-destructive" onClick={() => handleDelete(ann.id)}>
                              <Trash2 className="h-4 w-4" />
                            </Button>
                          </TableCell>
                        </TableRow>
                      ))}
                    </TableBody>
                  </Table>
                </div>
              </div>

              {/* Mobile Card View */}
              <div className="md:hidden divide-y">
                {announcements.sort((a,b) => new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime()).map((ann) => (
                  <div key={ann.id} className="p-4 space-y-3">
                    <div className="flex justify-between items-start gap-2">
                      <div className="min-w-0">
                        <h3 className="font-bold text-base truncate">{ann.title}</h3>
                        <div className="flex items-center gap-2 mt-1">
                          <Badge variant={ann.priority === 'high' ? 'destructive' : 'secondary'} className="text-[10px] h-4">
                            {ann.priority === 'high' ? 'ALTA' : ann.priority === 'medium' ? 'MÉDIA' : 'BAIXA'}
                          </Badge>
                          <span className="text-[10px] text-muted-foreground uppercase flex items-center gap-1">
                            {ann.target === 'all' ? <><Users className="h-2.5 w-2.5"/> Todos</> : ann.target === 'parents' ? <><Users className="h-2.5 w-2.5"/> Pais</> : <><Car className="h-2.5 w-2.5"/> Motoristas</>}
                          </span>
                        </div>
                      </div>
                      <Button variant="ghost" size="icon" className="h-8 w-8 text-destructive flex-shrink-0" onClick={() => handleDelete(ann.id)}>
                        <Trash2 className="h-4 w-4" />
                      </Button>
                    </div>
                    <p className="text-sm text-muted-foreground leading-snug line-clamp-3">{ann.content}</p>
                    <div className="flex items-center gap-1.5 text-[10px] text-muted-foreground pt-1">
                      <Clock className="h-3 w-3" />
                      {format(new Date(ann.createdAt), "dd 'de' MMM 'às' HH:mm", { locale: ptBR })}
                    </div>
                  </div>
                ))}
              </div>
            </>
          ) : (
            <div className="text-center py-20">
                <Megaphone className="mx-auto h-12 w-12 text-muted-foreground opacity-20 mb-4" />
                <p className="text-muted-foreground">Nenhum aviso publicado recentemente.</p>
            </div>
          )}
        </CardContent>
      </Card>
    </div>
  );
}
