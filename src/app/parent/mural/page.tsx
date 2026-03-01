
'use client';

import { useMockCollection } from '@/hooks/use-mock-data';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { ArrowLeft, Megaphone, Clock, Info, AlertTriangle } from 'lucide-react';
import Link from 'next/link';
import { Badge } from '@/components/ui/badge';
import { format } from 'date-fns';
import { ptBR } from 'date-fns/locale';
import { cn } from '@/lib/utils';

export default function ParentMuralPage() {
  const { data: announcements, isLoading } = useMockCollection('announcements', [{ field: 'target', op: 'in', value: ['all', 'parents'] }]);

  return (
    <div className="min-h-screen bg-secondary/30 p-4">
      <div className="max-w-2xl mx-auto space-y-6">
        <div className="flex items-center gap-4">
          <Button asChild variant="outline" size="icon">
            <Link href="/parent/tracking"><ArrowLeft /></Link>
          </Button>
          <h1 className="text-2xl font-bold tracking-tight">Mural de Avisos</h1>
        </div>

        {isLoading ? (
          <div className="text-center py-20">Carregando avisos...</div>
        ) : announcements && announcements.length > 0 ? (
          <div className="space-y-4">
            {announcements.sort((a,b) => new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime()).map((ann) => (
              <Card key={ann.id} className={cn(
                "border-l-4",
                ann.priority === 'high' ? "border-l-destructive shadow-md" : "border-l-primary"
              )}>
                <CardHeader className="pb-2">
                  <div className="flex justify-between items-start">
                    <CardTitle className="text-lg">{ann.title}</CardTitle>
                    {ann.priority === 'high' && (
                        <Badge variant="destructive" className="animate-pulse">URGENTE</Badge>
                    )}
                  </div>
                  <div className="flex items-center gap-2 text-xs text-muted-foreground mt-1">
                    <Clock className="h-3 w-3" />
                    <span>{format(new Date(ann.createdAt), "dd 'de' MMMM 'às' HH:mm", { locale: ptBR })}</span>
                  </div>
                </CardHeader>
                <CardContent>
                  <p className="text-sm leading-relaxed whitespace-pre-wrap">{ann.content}</p>
                </CardContent>
              </Card>
            ))}
          </div>
        ) : (
          <Card className="text-center py-20">
            <CardContent>
                <Megaphone className="mx-auto h-12 w-12 text-muted-foreground opacity-20 mb-4" />
                <p className="text-muted-foreground">Nenhum aviso importante por enquanto.</p>
            </CardContent>
          </Card>
        )}
      </div>
    </div>
  );
}
