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
import { Building2, Save, MapPin, Phone, Mail, Loader2, User, QrCode, CreditCard } from 'lucide-react';
import { useState, useEffect } from 'react';

const formSchema = z.object({
  companyName: z.string().min(3, { message: 'Nome da empresa deve ter pelo menos 3 caracteres.' }),
  cnpj: z.string().min(11, { message: 'Documento inválido (CPF ou CNPJ).' }),
  email: z.string().email({ message: 'E-mail inválido.' }),
  phone: z.string().min(10, { message: 'Telefone inválido.' }),
  address: z.string().min(10, { message: 'Endereço completo é necessário.' }),
  website: z.string().url().optional().or(z.literal('')),
  bankName: z.string().optional(),
  bankAgency: z.string().optional(),
  bankAccount: z.string().optional(),
  pixKey: z.string().optional(),
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
      bankName: '',
      bankAgency: '',
      bankAccount: '',
      pixKey: '',
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
        bankName: company.bankName || '',
        bankAgency: company.bankAgency || '',
        bankAccount: company.bankAccount || '',
        pixKey: company.pixKey || '',
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
            description: 'Os dados da sua transportadora e de pagamento foram salvos com sucesso.',
        });
    }, 800);
  };

  if (isLoading) return <div className="flex justify-center p-20"><Loader2 className="animate-spin text-primary" /></div>;

  return (
    <Card className="shadow-2xl border-primary/10 overflow-hidden max-w-2xl mx-auto">
      <CardHeader className="bg-primary/5 border-b pb-6 text-center">
        <div className="mx-auto p-3 bg-primary/10 rounded-full text-primary w-fit mb-4">
            <Building2 className="h-8 w-8" />
        </div>
        <CardTitle className="text-xl uppercase italic font-black text-primary">Perfil da Empresa</CardTitle>
        <CardDescription>Dados oficiais para cabeçalho de contratos e recebimento de mensalidades.</CardDescription>
      </CardHeader>
      <CardContent className="pt-8">
        <Form {...form}>
          <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-8">
            <div className="space-y-6">
                <p className="text-[10px] font-black uppercase text-primary tracking-[0.2em] border-b pb-2">Identificação</p>
                <FormField
                control={form.control}
                name="companyName"
                render={({ field }) => (
                    <FormItem>
                    <FormLabel className="font-bold uppercase text-[10px] tracking-widest text-muted-foreground">Razão Social / Nome Fantasia</FormLabel>
                    <FormControl>
                        <Input placeholder="Ex: Rota Segura Transporte Escolar" {...field} />
                    </FormControl>
                    </FormItem>
                )}
                />

                <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                    <FormField
                    control={form.control}
                    name="cnpj"
                    render={({ field }) => (
                        <FormItem>
                        <FormLabel className="font-bold uppercase text-[10px] tracking-widest text-muted-foreground flex items-center gap-2">
                            <User className="h-3 w-3" /> Documento (CNPJ ou CPF)
                        </FormLabel>
                        <FormControl>
                            <Input placeholder="00.000.000/0001-00 ou 000.000.000-00" {...field} />
                        </FormControl>
                        <FormDescription className="text-[9px]">Documento que aparecerá como contratado.</FormDescription>
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
                            <Phone className="h-3 w-3" /> WhatsApp Comercial
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
                        <Mail className="h-3 w-3" /> E-mail de Contato
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
                        <MapPin className="h-3 w-3" /> Endereço da Sede
                    </FormLabel>
                    <FormControl>
                        <Input placeholder="Rua, Número, Bairro, Cidade - UF" {...field} />
                    </FormControl>
                    <FormMessage />
                    </FormItem>
                )}
                />
            </div>

            <div className="space-y-6 bg-muted/20 p-6 rounded-xl border border-dashed border-primary/20">
                <p className="text-[10px] font-black uppercase text-primary tracking-[0.2em] flex items-center gap-2">
                    <CreditCard className="h-4 w-4" /> Dados Bancários (Para o Contrato)
                </p>
                <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                    <FormField
                        control={form.control}
                        name="bankName"
                        render={({ field }) => (
                            <FormItem>
                                <FormLabel className="text-xs font-bold">Banco</FormLabel>
                                <FormControl><Input placeholder="Ex: NuBank" {...field} className="bg-background" /></FormControl>
                            </FormItem>
                        )}
                    />
                    <div className="grid grid-cols-2 gap-2">
                        <FormField
                            control={form.control}
                            name="bankAgency"
                            render={({ field }) => (
                                <FormItem>
                                    <FormLabel className="text-xs font-bold">Agência</FormLabel>
                                    <FormControl><Input placeholder="0001" {...field} className="bg-background" /></FormControl>
                                </FormItem>
                            )}
                        />
                        <FormField
                            control={form.control}
                            name="bankAccount"
                            render={({ field }) => (
                                <FormItem>
                                    <FormLabel className="text-xs font-bold">Conta</FormLabel>
                                    <FormControl><Input placeholder="12345-6" {...field} className="bg-background" /></FormControl>
                                </FormItem>
                            )}
                        />
                    </div>
                </div>
                <FormField
                    control={form.control}
                    name="pixKey"
                    render={({ field }) => (
                        <FormItem>
                            <FormLabel className="text-xs font-bold text-primary flex items-center gap-1">
                                <QrCode className="h-3 w-3" /> Chave Pix Principal
                            </FormLabel>
                            <FormControl>
                                <Input placeholder="E-mail, CPF ou Chave Aleatória" {...field} className="bg-primary/5 border-primary/20 font-bold" />
                            </FormControl>
                            <FormDescription className="text-[10px]">Dica: O contrato será preenchido automaticamente com esses dados.</FormDescription>
                        </FormItem>
                    )}
                />
            </div>

            <Button type="submit" className="w-full h-14 text-lg font-black shadow-xl" disabled={isSaving}>
              {isSaving ? <Loader2 className="animate-spin mr-2" /> : <Save className="mr-2 h-6 w-6" />}
              SALVAR PERFIL DA EMPRESA
            </Button>
          </form>
        </Form>
      </CardContent>
    </Card>
  );
}
