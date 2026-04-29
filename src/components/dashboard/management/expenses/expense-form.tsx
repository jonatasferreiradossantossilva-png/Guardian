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
import { Input } from '@/components/ui/input';
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
import { Textarea } from '@/components/ui/textarea';
import { Popover, PopoverContent, PopoverTrigger } from '@/components/ui/popover';
import { CalendarIcon } from 'lucide-react';
import { Calendar } from '@/components/ui/calendar';
import { cn } from '@/lib/utils';
import { format } from 'date-fns';
import { ptBR } from 'date-fns/locale';
import { useToast } from '@/hooks/use-toast';
import { useEffect } from 'react';
import { useMockData } from '@/hooks/use-mock-data';

const formSchema = z.object({
  description: z.string().min(3, { message: 'A descrição deve ter pelo menos 3 caracteres.' }),
  amount: z.coerce.number().min(0.01, { message: 'O valor deve ser maior que zero.' }),
  date: z.date({ required_error: 'A data é obrigatória.' }),
  category: z.enum(['Combustível', 'Manutenção', 'Salários', 'Impostos', 'Outros'], { required_error: 'A categoria é obrigatória.' }),
});

type ExpenseFormValues = z.infer<typeof formSchema>;

interface ExpenseFormProps {
  expense?: { id: string } & Partial<ExpenseFormValues>;
  onFormSubmit: () => void;
}

export function ExpenseForm({ expense, onFormSubmit }: ExpenseFormProps) {
  const { toast } = useToast();
  const { addDoc, updateDoc } = useMockData();

  const form = useForm<ExpenseFormValues>({
    resolver: zodResolver(formSchema),
    defaultValues: {
      description: '',
      amount: undefined,
      date: new Date(),
      category: 'Combustível',
    },
  });

  useEffect(() => {
    if (expense) {
      form.reset({
        ...expense,
        date: expense.date ? new Date(expense.date) : new Date(),
      });
    } else {
      form.reset();
    }
  }, [expense, form]);

  const onSubmit = (data: ExpenseFormValues) => {
    const expenseData = {
        ...data,
        date: format(data.date, 'yyyy-MM-dd'),
    };
    if (expense) {
      updateDoc('expenses', expense.id, expenseData);
      toast({
        title: 'Despesa atualizada!',
        description: 'A despesa foi atualizada com sucesso.',
      });
    } else {
      addDoc('expenses', expenseData);
      toast({
        title: 'Despesa Lançada!',
        description: 'A nova despesa foi adicionada ao sistema.',
      });
    }
    onFormSubmit();
  };

  const categories = ['Combustível', 'Manutenção', 'Salários', 'Impostos', 'Outros'];

  return (
    <DialogContent className="sm:max-w-md">
      <DialogHeader>
        <DialogTitle>{expense ? 'Editar Despesa' : 'Lançar Nova Despesa'}</DialogTitle>
        <DialogDescription>
          Preencha os detalhes do custo que você deseja registrar.
        </DialogDescription>
      </DialogHeader>
      <Form {...form}>
        <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-4 py-4">
          <FormField
            control={form.control}
            name="description"
            render={({ field }) => (
              <FormItem>
                <FormLabel>Descrição</FormLabel>
                <FormControl>
                  <Textarea placeholder="Ex: Abastecimento da van Sprinter" {...field} />
                </FormControl>
                <FormMessage />
              </FormItem>
            )}
          />

          <div className="grid grid-cols-2 gap-4">
             <FormField
                control={form.control}
                name="amount"
                render={({ field }) => (
                <FormItem>
                    <FormLabel>Valor (R$)</FormLabel>
                    <FormControl>
                        <Input type="number" step="0.01" placeholder="Ex: 350.50" {...field} value={field.value ?? ''} />
                    </FormControl>
                    <FormMessage />
                </FormItem>
                )}
            />
            <FormField
                control={form.control}
                name="category"
                render={({ field }) => (
                <FormItem>
                    <FormLabel>Categoria</FormLabel>
                    <Select onValueChange={field.onChange} value={field.value}>
                        <FormControl>
                            <SelectTrigger><SelectValue/></SelectTrigger>
                        </FormControl>
                        <SelectContent>
                            {categories.map(cat => <SelectItem key={cat} value={cat}>{cat}</SelectItem>)}
                        </SelectContent>
                    </Select>
                    <FormMessage />
                </FormItem>
                )}
            />
          </div>

          <FormField
            control={form.control}
            name="date"
            render={({ field }) => (
              <FormItem className="flex flex-col">
                <FormLabel>Data da Despesa</FormLabel>
                <Popover>
                  <PopoverTrigger asChild>
                    <FormControl>
                      <Button
                        variant={"outline"}
                        className={cn("pl-3 text-left font-normal", !field.value && "text-muted-foreground")}
                      >
                        {field.value ? format(field.value, "PPP", { locale: ptBR }) : <span>Escolha uma data</span>}
                        <CalendarIcon className="ml-auto h-4 w-4 opacity-50" />
                      </Button>
                    </FormControl>
                  </PopoverTrigger>
                  <PopoverContent className="w-auto p-0" align="start">
                    <Calendar mode="single" selected={field.value} onSelect={field.onChange} autoFocus />
                  </PopoverContent>
                </Popover>
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
            <Button type="submit">Salvar Despesa</Button>
          </DialogFooter>
        </form>
      </Form>
    </DialogContent>
  );
}

    