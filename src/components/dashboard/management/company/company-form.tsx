
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
  FormDescription,
} from '@/components/ui/form';
import { Input } from '@/components/ui/input';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card';
import { useToast } from '@/hooks/use-toast';
import { useMockCollection, useMockData } from '@/hooks/use-mock-data';
import { Building2, Save, MapPin, Phone, Mail, Globe, Loader2 } from 'lucide-react';
import { useState, useEffect } from 'react';

const formSchema = z.object({
  companyName: z.string().min(3, { message: 'Nome da empresa deve ter pelo menos 3 caracteres.' }),
  cnpj: z.string().min(14, { message: 'CNPJ inválido.' }),
  email: z.string().email({ message: 'E-mail inválido.' }),
  phone: z.string().min(10, { message: 'Telefone inválido.' }),
  address: z.string().min(10, { message: 'Endereço completo é necessário.' }),
  website: z.string().url().optional().or(z.literal('')),
});

type FormValues = z.infer<typeof formSchema>;

export function CompanyForm() {
  const { toast } = useToast();
  const { updateDoc, addDoc } = useMockData();
  const [isSaving, setIsSaving] = useState(false);

  const { data: companyData, isLoading } = useMockCollection('company_profile');
  const company = companyData?.[0];

  const form = useForm<FormValues>({
    resolver: zodResolver(formSchema),
    defaultValues: {
      companyName: '',
      cnpj: '',
      email: '',
      phone: '',
      address: '',
      website: '',
    },
  });

  useEffect(() => {
    if (company) {
      form.reset({
        companyName: company.companyName || '',
        cnpj: company.cnpj || '',
        email: company.email || '',
        phone: company.phone || '',
        address: company.address || '',
        website: company.website || '',
      });
    }
  }, [company, form]);

  const onSubmit = (data: FormValues) => {
    setIsSaving(true);
    setTimeout(() => {
        if (company) {
            updateDoc('company_profile', company.id, data);
        } else {
            addDoc('company_profile', data);
        }
        setIsSaving(false);
        toast({
            title: 'Perfil Atualizado!',
            description: 'Os dados da sua transportadora foram salvos com sucesso.',
        });
    }, 800);
  };

  if (isLoading) return <div className="flex justify-center p-20"><Loader2 className="animate-spin" /></div>;

  return (
    <Card className="max-w-2xl mx-auto shadow-lg border-primary/10">
      <CardHeader className="bg-primary/5 border-b pb-6">
        <div className="flex items-center gap-4">
            <div className="p-3 bg-primary/10 rounded-full text-primary">
                <Building2 className="h-8 w-8" />
            </div>
            <div>
                <CardTitle className="text-2xl uppercase italic font-black">Minha Empresa</CardTitle>
                <CardDescription>Dados oficiais da transportadora para contratos e faturas.</CardDescription>
            </div>
        </div>
      </CardHeader>
      <CardContent className="pt-8">
        <Form {...form}>
          <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-6">
            <FormField
              control={form.control}
              name="companyName"
              render={({ field }) => (
                <FormItem>
                  <FormLabel className="font-bold uppercase text-[10px] tracking-widest text-muted-foreground">Nome Fantasia / Razão Social</FormLabel>
                  <FormControl>
                    <Input placeholder="Ex: Rota Segura Transporte Escolar" {...field} />
                  </FormControl>
                  <FormMessage />
                </FormItem>
              )}
            />

            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                <FormField
                control={form.control}
                name="cnpj"
                render={({ field }) => (
                    <FormItem>
                    <FormLabel className="font-bold uppercase text-[10px] tracking-widest text-muted-foreground">CNPJ</FormLabel>
                    <FormControl>
                        <Input placeholder="00.000.000/0001-00" {...field} />
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
                    <FormLabel className="font-bold uppercase text-[10px] tracking-widest text-muted-foreground flex items-center gap-2">
                        <Phone className="h-3 w-3" /> Telefone de Contato
                    </FormLabel>
                    <FormControl>
                        <Input placeholder="(11) 99999-9999" {...field} />
                    </FormControl>
                    <FormMessage />
                    </FormItem>
                )}
                />
            </div>

            <FormField
              control={form.control}
              name="email"
              render={({ field }) => (
                <FormItem>
                  <FormLabel className="font-bold uppercase text-[10px] tracking-widest text-muted-foreground flex items-center gap-2">
                      <Mail className="h-3 w-3" /> E-mail Institucional
                  </FormLabel>
                  <FormControl>
                    <Input placeholder="contato@empresa.com.br" {...field} />
                  </FormControl>
                  <FormMessage />
                </FormItem>
              )}
            />

            <FormField
              control={form.control}
              name="address"
              render={({ field }) => (
                <FormItem>
                  <FormLabel className="font-bold uppercase text-[10px] tracking-widest text-muted-foreground flex items-center gap-2">
                      <MapPin className="h-3 w-3" /> Sede Profissional
                  </FormLabel>
                  <FormControl>
                    <Input placeholder="Rua, Número, Bairro, Cidade - UF" {...field} />
                  </FormControl>
                  <FormDescription className="text-[10px]">Este endereço aparecerá no cabeçalho dos seus contratos.</FormDescription>
                  <FormMessage />
                </FormItem>
              )}
            />

            <FormField
              control={form.control}
              name="website"
              render={({ field }) => (
                <FormItem>
                  <FormLabel className="font-bold uppercase text-[10px] tracking-widest text-muted-foreground flex items-center gap-2">
                      <Globe className="h-3 w-3" /> Site ou Link de Redes Sociais
                  </FormLabel>
                  <FormControl>
                    <Input placeholder="https://www.empresa.com.br" {...field} />
                  </FormControl>
                  <FormMessage />
                </FormItem>
              )}
            />

            <Button type="submit" className="w-full h-12 font-bold" disabled={isSaving}>
              {isSaving ? <Loader2 className="animate-spin mr-2" /> : <Save className="mr-2 h-5 w-5" />}
              SALVAR PERFIL DA EMPRESA
            </Button>
          </form>
        </Form>
      </CardContent>
    </Card>
  );
}
