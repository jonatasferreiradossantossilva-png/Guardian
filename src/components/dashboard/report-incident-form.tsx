
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
import { Textarea } from '@/components/ui/textarea';
import { Button } from '@/components/ui/button';
import { useToast } from '@/hooks/use-toast';
import { useMockData } from '@/hooks/use-mock-data';
import { useEffect, useState } from 'react';

const formSchema = z.object({
  category: z.enum(['Trânsito', 'Acidente', 'Perigo', 'Outro'], { required_error: 'Selecione uma categoria.' }),
  severity: z.enum(['Baixa', 'Média', 'Alta', 'Crítica'], { required_error: 'Selecione a gravidade.' }),
  description: z.string().min(10, { message: 'A descrição deve ter pelo menos 10 caracteres.' }),
});

type FormValues = z.infer<typeof formSchema>;

interface ReportIncidentFormProps {
  onFormSubmit: () => void;
}

export function ReportIncidentForm({ onFormSubmit }: ReportIncidentFormProps) {
  const { toast } = useToast();
  const { addDoc } = useMockData();
  const [mockUserId, setMockUserId] = useState<string | null>(null);

  useEffect(() => {
    setMockUserId(sessionStorage.getItem('mockUserId'));
  }, []);

  const form = useForm<FormValues>({
    resolver: zodResolver(formSchema),
    defaultValues: {
      category: 'Trânsito',
      severity: 'Média',
      description: '',
    },
  });

  const onSubmit = (data: FormValues) => {
    const newIncident = {
      ...data,
      timestamp: new Date().toISOString(),
      location: { lat: -23.555, lng: -46.645 }, // Localização padrão de exemplo
      reporter: mockUserId || 'Usuário do Sistema',
    };
    addDoc('incidents', newIncident);
    toast({
      title: 'Incidente Registrado!',
      description: 'O novo incidente foi adicionado ao dashboard.',
    });
    onFormSubmit();
  };

  return (
    <DialogContent className="sm:max-w-md">
      <DialogHeader>
        <DialogTitle>Relatar Novo Incidente</DialogTitle>
        <DialogDescription>
          Descreva o incidente para que os motoristas e pais sejam alertados.
        </DialogDescription>
      </DialogHeader>
      <Form {...form}>
        <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-4 py-4">
          <FormField
            control={form.control}
            name="category"
            render={({ field }) => (
              <FormItem>
                <FormLabel>Categoria</FormLabel>
                <Select onValueChange={field.onChange} value={field.value}>
                  <FormControl>
                    <SelectTrigger><SelectValue /></SelectTrigger>
                  </FormControl>
                  <SelectContent>
                    <SelectItem value="Trânsito">Trânsito</SelectItem>
                    <SelectItem value="Acidente">Acidente</SelectItem>
                    <SelectItem value="Perigo">Perigo na Via</SelectItem>
                    <SelectItem value="Outro">Outro</SelectItem>
                  </SelectContent>
                </Select>
                <FormMessage />
              </FormItem>
            )}
          />
          <FormField
            control={form.control}
            name="severity"
            render={({ field }) => (
              <FormItem>
                <FormLabel>Gravidade</FormLabel>
                <Select onValueChange={field.onChange} value={field.value}>
                  <FormControl>
                    <SelectTrigger><SelectValue /></SelectTrigger>
                  </FormControl>
                  <SelectContent>
                    <SelectItem value="Baixa">Baixa</SelectItem>
                    <SelectItem value="Média">Média</SelectItem>
                    <SelectItem value="Alta">Alta</SelectItem>
                    <SelectItem value="Crítica">Crítica</SelectItem>
                  </SelectContent>
                </Select>
                <FormMessage />
              </FormItem>
            )}
          />
          <FormField
            control={form.control}
            name="description"
            render={({ field }) => (
              <FormItem>
                <FormLabel>Descrição</FormLabel>
                <FormControl>
                  <Textarea
                    placeholder="Ex: Congestionamento na Av. Paulista, próximo ao MASP."
                    {...field}
                  />
                </FormControl>
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
            <Button type="submit">Registrar Incidente</Button>
          </DialogFooter>
        </form>
      </Form>
    </DialogContent>
  );
}
