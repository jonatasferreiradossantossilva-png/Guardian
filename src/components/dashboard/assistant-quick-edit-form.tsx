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
  monitorId: z.string().optional(),
});

type FormValues = z.infer<typeof formSchema>;

type Route = { id: string; name: string; monitorId?: string };
type Monitor = { id: string; name: string };

interface MonitorQuickEditFormProps {
  route: Route;
  monitors: Monitor[];
  onFormSubmit: () => void;
}

export function MonitorQuickEditForm({
  route,
  monitors,
  onFormSubmit,
}: MonitorQuickEditFormProps) {
  const { toast } = useToast();
  const { updateDoc } = useMockData();

  const form = useForm<FormValues>({
    resolver: zodResolver(formSchema),
    defaultValues: {
      monitorId: route.monitorId || 'none',
    },
  });

  const onSubmit = (data: FormValues) => {
    const newMonitorId = data.monitorId === 'none' ? '' : data.monitorId;
    
    updateDoc('routes', route.id, { monitorId: newMonitorId });
    
    toast({
      title: 'Monitor atualizado!',
      description: `O monitor da rota "${route.name}" foi modificado.`,
    });
    
    onFormSubmit();
  };

  return (
    <DialogContent className="sm:max-w-md">
      <DialogHeader>
        <DialogTitle>Trocar Monitor da Rota</DialogTitle>
        <DialogDescription>
          Selecione um novo monitor para a rota "{route.name}" ou remova o atual.
        </DialogDescription>
      </DialogHeader>
      <Form {...form}>
        <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-4 py-4">
            <FormField
                control={form.control}
                name="monitorId"
                render={({ field }) => (
                    <FormItem>
                        <FormLabel>Monitor</FormLabel>
                        <Select onValueChange={field.onChange} value={field.value || 'none'}>
                            <FormControl>
                                <SelectTrigger>
                                    <SelectValue placeholder="Selecione um monitor..." />
                                </SelectTrigger>
                            </FormControl>
                            <SelectContent>
                                <SelectItem value="none">Nenhum Monitor</SelectItem>
                                {monitors.map(a => (
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

    