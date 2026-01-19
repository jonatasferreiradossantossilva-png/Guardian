'use client';

import { zodResolver } from '@hookform/resolvers/zod';
import { useForm } from 'react-hook-form';
import * as z from 'zod';
import {
  Form,
  FormControl,
  FormField,
  FormItem,
  FormLabel,
  FormMessage,
} from '@/components/ui/form';
import { Button } from '@/components/ui/button';
import {
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogDescription,
  DialogFooter,
  DialogClose,
} from '@/components/ui/dialog';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import { useToast } from '@/hooks/use-toast';
import { useMockData } from '@/hooks/use-mock-data';

const formSchema = z.object({
  assistantId: z.string().optional(),
});

type FormValues = z.infer<typeof formSchema>;

type Route = { id: string; name: string; assistantId?: string };
type Assistant = { id: string; name: string };

interface AssistantQuickEditFormProps {
  route: Route;
  assistants: Assistant[];
  onFormSubmit: () => void;
}

export function AssistantQuickEditForm({
  route,
  assistants,
  onFormSubmit,
}: AssistantQuickEditFormProps) {
  const { toast } = useToast();
  const { updateDoc } = useMockData();

  const form = useForm<FormValues>({
    resolver: zodResolver(formSchema),
    defaultValues: {
      assistantId: route.assistantId || 'none',
    },
  });

  const onSubmit = (data: FormValues) => {
    const newAssistantId = data.assistantId === 'none' ? '' : data.assistantId;
    
    updateDoc('routes', route.id, { assistantId: newAssistantId });
    
    toast({
      title: 'Auxiliar atualizado!',
      description: `O auxiliar da rota "${route.name}" foi modificado.`,
    });
    
    onFormSubmit();
  };

  return (
    <DialogContent className="sm:max-w-md">
      <DialogHeader>
        <DialogTitle>Trocar Auxiliar da Rota</DialogTitle>
        <DialogDescription>
          Selecione um novo auxiliar para a rota "{route.name}" ou remova o atual.
        </DialogDescription>
      </DialogHeader>
      <Form {...form}>
        <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-4 py-4">
            <FormField
                control={form.control}
                name="assistantId"
                render={({ field }) => (
                    <FormItem>
                        <FormLabel>Auxiliar</FormLabel>
                        <Select onValueChange={field.onChange} value={field.value || 'none'}>
                            <FormControl>
                                <SelectTrigger>
                                    <SelectValue placeholder="Selecione um auxiliar..." />
                                </SelectTrigger>
                            </FormControl>
                            <SelectContent>
                                <SelectItem value="none">Nenhum Auxiliar</SelectItem>
                                {assistants.map(a => (
                                    <SelectItem key={a.id} value={a.id}>{a.name}</SelectItem>
                                ))}
                            </SelectContent>
                        </Select>
                        <FormMessage />
                    </FormItem>
                )}
            />
            <DialogFooter className="pt-4">
                <DialogClose asChild>
                    <Button type="button" variant="outline">
                        Cancelar
                    </Button>
                </DialogClose>
                <Button type="submit">Salvar Alterações</Button>
            </DialogFooter>
        </form>
      </Form>
    </DialogContent>
  );
}
