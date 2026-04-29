
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
import { useToast } from '@/hooks/use-toast';
import { useEffect, useRef, useState } from 'react';
import { useMockData } from '@/hooks/use-mock-data';
import { Camera, Loader2, User } from 'lucide-react';
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar';
import { ErrorBoundary } from '@/components/shared/error-boundary';

const formSchema = z.object({
  name: z.string().min(1, { message: 'O nome é obrigatório.' }),
  cpf: z.string().min(11, { message: 'O CPF é obrigatório.' }),
  phone: z.string().optional(),
  relationship: z.string().min(1, { message: 'A relação é obrigatória.' }),
  photoUrl: z.string().optional(),
});

type FormValues = z.infer<typeof formSchema>;

interface AuthorizedPersonFormProps {
  person?: { id: string } & Partial<FormValues>;
  studentId: string;
  parentUserId: string;
  onFormSubmit: () => void;
}

export function AuthorizedPersonForm({ person, studentId, parentUserId, onFormSubmit }: AuthorizedPersonFormProps) {
  const { toast } = useToast();
  const { addDoc, updateDoc } = useMockData();
  const fileInputRef = useRef<HTMLInputElement>(null);
  const [isUploading, setIsUploading] = useState(false);

  const form = useForm<FormValues>({
    resolver: zodResolver(formSchema),
    defaultValues: {
      name: '',
      cpf: '',
      phone: '',
      relationship: '',
      photoUrl: '',
    },
  });

  useEffect(() => {
    if (person) {
      form.reset({
        name: person.name || '',
        cpf: person.cpf || '',
        phone: person.phone || '',
        relationship: (person as any).relationship || '',
        photoUrl: person.photoUrl || '',
      });
    } else {
      form.reset();
    }
  }, [person, form]);

  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    // [VALIDATION] Limite de 2MB para evitar lentidão no MockDB (Base64)
    if (file.size > 2 * 1024 * 1024) {
        toast({ title: "Arquivo muito grande", description: "O limite é 2MB para o protótipo.", variant: "destructive" });
        return;
    }

    setIsUploading(true);
    const reader = new FileReader();
    reader.onloadend = () => {
        form.setValue('photoUrl', reader.result as string);
        setIsUploading(false);
        toast({ title: "Foto capturada!", description: "A identificação visual foi salva." });
    };
    reader.readAsDataURL(file);
  };

  const onSubmit = (data: FormValues) => {
    if (person) {
      updateDoc('authorized_pickups', person.id, data);
      toast({
        title: 'Contato atualizado!',
        description: `Os dados de ${data.name} foram atualizados.`,
      });
    } else {
      addDoc('authorized_pickups', { ...data, studentId, parentUserId });
      toast({
        title: 'Contato adicionado!',
        description: `${data.name} agora pode retirar o aluno.`,
      });
    }
    onFormSubmit();
  };

  const currentPhoto = form.watch('photoUrl');

  return (
    <DialogContent className="sm:max-w-md">
      <DialogHeader>
        <DialogTitle>{person ? 'Editar Pessoa Autorizada' : 'Adicionar Pessoa Autorizada'}</DialogTitle>
        <DialogDescription>
          Para maior segurança, inclua uma foto da pessoa que irá retirar o aluno.
        </DialogDescription>
      </DialogHeader>
      <Form {...form}>
        <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-4 py-4">
          
          <div className="flex flex-col items-center gap-4 py-2">
            <ErrorBoundary name="PhotoPreview">
              <div className="relative group">
                  <Avatar className="h-24 w-24 border-2 border-primary/20">
                      <AvatarImage src={currentPhoto} style={{ objectFit: 'cover' }} />
                      <AvatarFallback className="bg-secondary text-primary"><User className="h-10 w-10" /></AvatarFallback>
                  </Avatar>
                  <button 
                      type="button"
                      onClick={() => fileInputRef.current?.click()}
                      className="absolute inset-0 flex items-center justify-center bg-black/40 rounded-full opacity-0 group-hover:opacity-100 transition-opacity"
                  >
                      <Camera className="text-white h-6 w-6" />
                  </button>
              </div>
            </ErrorBoundary>
            <Button type="button" variant="outline" size="sm" onClick={() => fileInputRef.current?.click()} disabled={isUploading}>
                {isUploading ? <Loader2 className="animate-spin mr-2 h-4 w-4"/> : <Camera className="mr-2 h-4 w-4" />}
                {currentPhoto ? 'Trocar Foto de Identificação' : 'Tirar Foto do Autorizado'}
            </Button>
            <input type="file" accept="image/*" capture="environment" ref={fileInputRef} className="hidden" onChange={handleFileChange} />
          </div>

          <FormField
            control={form.control}
            name="name"
            render={({ field }) => (
              <FormItem>
                <FormLabel>Nome Completo</FormLabel>
                <FormControl>
                  <Input placeholder="Ex: Maria da Silva" {...field} />
                </FormControl>
                <FormMessage />
              </FormItem>
            )}
          />
           <FormField
            control={form.control}
            name="cpf"
            render={({ field }) => (
              <FormItem>
                <FormLabel>CPF</FormLabel>
                <FormControl>
                  <Input placeholder="000.000.000-00" {...field} />
                </FormControl>
                <FormMessage />
              </FormItem>
            )}
          />
           <FormField
            control={form.control}
            name="phone"
            render={({ field }) => (
              <FormItem>
                <FormLabel>Telefone (Opcional)</FormLabel>
                <FormControl>
                  <Input placeholder="(11) 98765-4321" {...field} />
                </FormControl>
                <FormMessage />
              </FormItem>
            )}
          />

           <FormField
            control={form.control}
            name="relationship"
            render={({ field }) => (
              <FormItem>
                <FormLabel>Relação / Parentesco</FormLabel>
                <FormControl>
                  <Input placeholder="Ex: Avô, Tia, Madrasta..." {...field} />
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
            <Button type="submit">Salvar</Button>
          </DialogFooter>
        </form>
      </Form>
    </DialogContent>
  );
}
