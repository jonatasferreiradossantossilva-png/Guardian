
'use client';

import { useMockCollection, useMockData } from '@/hooks/use-mock-data';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import { Badge } from '@/components/ui/badge';
import { ShieldAlert, Activity, MapPin, Clock, Trash2, Eye, Zap, RefreshCw } from 'lucide-react';
import { useRouter } from 'next/navigation';
import { format } from 'date-fns';
import { ptBR } from 'date-fns/locale';
import { Button } from '@/components/ui/button';
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from "@/components/ui/dialog";
import { useState } from 'react';

export default function IncidentsLogsPage() {
  const { data: incidents, isLoading } = useMockCollection('incidents');
  const { clearCollection } = useMockData();
  const [selectedIncident, setSelectedIncident] = useState<any>(null);
  const [isResetting, setIsResetting] = useState(false);
  const router = useRouter();

  const handleDeepReset = async () => {
    if (!confirm("AVISO CRÍTICO: Isso irá deslogar você, limpar todo o cache do PWA e resetar os dados locais para corrigir erros de 'child' ou travamentos. Deseja continuar?")) {
        return;
    }

    setIsResetting(true);

    try {
        // 1. Limpar Service Workers
        if ('serviceWorker' in navigator) {
            const registrations = await navigator.serviceWorker.getRegistrations();
            for (const registration of registrations) {
                await registration.unregister();
            }
        }

        // 2. Limpar Cache Storage
        if ('caches' in window) {
            const cacheNames = await caches.keys();
            for (const name of cacheNames) {
                await caches.delete(name);
            }
        }

        // 3. Limpar Storages
        localStorage.clear();
        sessionStorage.clear();

        // 4. Force Reload total
        window.location.href = '/';
    } catch (error) {
        console.error("Erro no Reset Profundo:", error);
        alert("Falha ao resetar completamente. Limpando dados básicos...");
        localStorage.clear();
        window.location.reload();
    }
  };

  const handleClearLogs = () => {
    if (confirm("Deseja realmente limpar todo o histórico de telemetria?")) {
        clearCollection('incidents');
    }
  };

  return (
    <div className="space-y-6 pb-20">
      <div className="flex justify-between items-start">
        <div>
          <h1 className="text-3xl font-bold tracking-tight">Telemetria e Incidentes</h1>
          <p className="text-muted-foreground">Monitoramento em tempo real de eventos da frota e do sistema.</p>
        </div>
        <Button variant="outline" size="sm" onClick={handleClearLogs} className="text-red-500 border-red-200 hover:bg-red-50">
            <Trash2 className="h-4 w-4 mr-2" />
            Limpar Histórico
        </Button>
      </div>

      <Card className="bg-red-500/10 border-red-500/30 overflow-hidden relative">
          <div className="absolute top-0 right-0 p-4 opacity-10">
              <Zap className="h-24 w-24 text-red-600" />
          </div>
          <CardHeader className="relative z-10">
              <CardTitle className="text-red-600 flex items-center gap-2 italic">
                  <Zap className="h-5 w-5 fill-current" /> ÁREA DE EMERGÊNCIA (RESET DE CACHE)
              </CardTitle>
              <CardDescription className="text-red-700/80">
                  Use esta ferramenta se o app estiver travando no celular ou apresentando erros de "child". 
                  Ela força a limpeza completa de registros antigos no seu navegador.
              </CardDescription>
          </CardHeader>
          <CardContent className="relative z-10 flex flex-col sm:flex-row gap-4">
              <Button 
                variant="destructive" 
                className="h-14 px-8 font-black uppercase tracking-widest animate-pulse"
                onClick={handleDeepReset}
                disabled={isResetting}
              >
                {isResetting ? (
                    <RefreshCw className="mr-2 h-5 w-5 animate-spin" />
                ) : (
                    <Zap className="mr-2 h-5 w-5 fill-current" />
                )}
                EXECUTAR RESET PROFUNDO (FIX PWA)
              </Button>
              <div className="flex-1 text-xs text-red-600/70 italic flex items-center">
                  * Você será deslogado e o PWA será reinstalado no próximo acesso.
              </div>
          </CardContent>
      </Card>

      <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
        <Card className="bg-primary/5 border-primary/20">
            <CardHeader className="pb-2">
                <CardTitle className="text-sm font-medium flex items-center gap-2">
                    <Activity className="h-4 w-4 text-primary" /> Eventos Totais
                </CardTitle>
            </CardHeader>
            <CardContent>
                <div className="text-2xl font-bold">{incidents?.length || 0}</div>
                <p className="text-xs text-muted-foreground mt-1">Registrados nesta sessão.</p>
            </CardContent>
        </Card>
        <Card className="bg-amber-500/5 border-amber-500/20">
            <CardHeader className="pb-2">
                <CardTitle className="text-sm font-medium flex items-center gap-2">
                    <ShieldAlert className="h-4 w-4 text-amber-500" /> Alertas Críticos
                </CardTitle>
            </CardHeader>
            <CardContent>
                <div className="text-2xl font-bold text-amber-600">
                    {incidents?.filter((i: any) => i.severity === 'Alta').length || 0}
                </div>
                <p className="text-xs text-muted-foreground mt-1">Requerem atenção imediata.</p>
            </CardContent>
        </Card>
      </div>

      <Card>
        <CardHeader>
          <CardTitle>Log de Eventos</CardTitle>
          <CardDescription>Histórico de telemetria capturado pelo simulador Guardian.</CardDescription>
        </CardHeader>
        <CardContent>
          <div className="rounded-md border overflow-hidden">
            <Table>
              <TableHeader>
                <TableRow className="bg-muted/50">
                  <TableHead>Horário</TableHead>
                  <TableHead>Categoria</TableHead>
                  <TableHead>Descrição</TableHead>
                  <TableHead>Gravidade</TableHead>
                  <TableHead>Ações</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {isLoading ? (
                  <TableRow><TableCell colSpan={5} className="text-center">Carregando...</TableCell></TableRow>
                ) : incidents && incidents.length > 0 ? (
                  [...incidents].sort((a, b) => new Date(b.timestamp).getTime() - new Date(a.timestamp).getTime()).map((item: any, idx: number) => (
                    <TableRow key={item.id || idx}>
                      <TableCell className="text-xs whitespace-nowrap">
                        <div className="flex items-center gap-2">
                            <Clock className="h-3 w-3 text-muted-foreground" />
                            {format(new Date(item.timestamp), "HH:mm:ss", { locale: ptBR })}
                        </div>
                      </TableCell>
                      <TableCell>
                        <Badge variant="outline" className="text-[10px] font-bold uppercase whitespace-nowrap">{item.category}</Badge>
                      </TableCell>
                      <TableCell className="max-w-[300px] truncate text-sm">
                        {item.description}
                      </TableCell>
                      <TableCell>
                        <Badge variant={item.severity === 'Alta' ? 'destructive' : item.severity === 'Média' ? 'default' : 'secondary'}>
                          {item.severity}
                        </Badge>
                      </TableCell>
                      <TableCell>
                        <Dialog>
                            <DialogTrigger asChild>
                                <Button variant="ghost" size="sm" onClick={() => setSelectedIncident(item)}>
                                    <Eye className="h-4 w-4" />
                                </Button>
                            </DialogTrigger>
                            <DialogContent className="max-w-2xl">
                                <DialogHeader>
                                    <DialogTitle className="flex items-center gap-2">
                                        <Badge variant={item.severity === 'Alta' ? 'destructive' : 'default'}>{item.severity}</Badge>
                                        {item.category}
                                    </DialogTitle>
                                    <DialogDescription>
                                        Detalhes técnicos do evento capturado em {format(new Date(item.timestamp), "pp 'em' dd/MM/yyyy", { locale: ptBR })}
                                    </DialogDescription>
                                </DialogHeader>
                                <div className="space-y-4 py-4">
                                    <div className="p-4 bg-muted rounded-lg border">
                                        <h4 className="font-bold mb-1 text-sm">Descrição</h4>
                                        <p className="text-sm">{item.description}</p>
                                    </div>
                                    
                                    {item.metadata?.stack && (
                                        <div className="space-y-2">
                                            <h4 className="font-bold text-sm text-red-600 flex items-center gap-2">
                                                <Activity className="h-4 w-4" /> Erro Técnico (Stack Trace)
                                            </h4>
                                            <pre className="p-4 bg-slate-950 text-slate-300 text-[9px] overflow-auto max-h-[150px] rounded border border-slate-800 font-mono">
                                                {item.metadata.stack}
                                            </pre>
                                        </div>
                                    )}

                                    {item.metadata?.componentStack && (
                                        <div className="space-y-2">
                                            <h4 className="font-bold text-sm text-amber-600 flex items-center gap-2">
                                                <ShieldAlert className="h-4 w-4" /> Árvore do Componente (React)
                                            </h4>
                                            <pre className="p-4 bg-amber-50 text-[9px] text-amber-700 overflow-auto max-h-[150px] rounded border border-amber-100 font-mono">
                                                {item.metadata.componentStack}
                                            </pre>
                                        </div>
                                    )}

                                    {item.location && (
                                        <div className="flex items-center gap-2 text-xs text-muted-foreground">
                                            <MapPin className="h-3 w-3" /> 
                                            Coordenadas: {item.location.lat}, {item.location.lng}
                                        </div>
                                    )}
                                </div>
                            </DialogContent>
                        </Dialog>
                      </TableCell>
                    </TableRow>
                  ))
                ) : (
                  <TableRow>
                    <TableCell colSpan={5} className="text-center py-10 text-muted-foreground">
                      Nenhum evento registrado no momento.
                    </TableCell>
                  </TableRow>
                )}
              </TableBody>
            </Table>
          </div>
        </CardContent>
      </Card>
    </div>
  );
}
