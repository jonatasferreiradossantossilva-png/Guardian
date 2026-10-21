'use client';

import { useState, useMemo, useEffect, useRef } from 'react';
import { Bell, Check, Trash2, Info, AlertTriangle, CheckCircle2 } from 'lucide-react';
import { useToast } from "@/hooks/use-toast";
import {
  Sheet,
  SheetContent,
  SheetHeader,
  SheetTitle,
  SheetTrigger,
} from '@/components/ui/sheet';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { ScrollArea } from '@/components/ui/scroll-area';
import { useDataCollection, useData } from '@/hooks/use-data';
import { cn } from '@/lib/utils';
import { formatDistanceToNow } from 'date-fns';
import { ptBR } from 'date-fns/locale';
import { safeString, safeArray, getSafeDate } from '@/lib/safe-render';
import { SafeRow } from '@/components/shared/safe-table';
import { Notification as MockNotification } from '@/types/mock-data';


export function NotificationBell() {
  const [isOpen, setIsOpen] = useState(false);
  const { toast } = useToast();
  const lastProcessedId = useRef<string | null>(null);
  const { updateDoc, deleteDoc, addDoc } = useData() as any;
  const mockUserId = typeof window !== 'undefined' ? sessionStorage.getItem('mockUserId') : null;

  const { data: notifications } = useDataCollection('notifications', 
    mockUserId ? [{ field: 'userId', op: '==', value: mockUserId }] : undefined
  );

  const sortedNotifications = useMemo(() => {
    const list = safeArray<MockNotification>(notifications);
    return [...list].sort((a: MockNotification, b: MockNotification) => 
      getSafeDate(b.createdAt).getTime() - getSafeDate(a.createdAt).getTime()
    );
  }, [notifications]);


  const unreadCount = useMemo(() => {
    return safeArray<MockNotification>(notifications).filter((n: MockNotification) => n && !n.read).length;
  }, [notifications]);


  // Efeito para disparar Toasts em tempo real para novas notificações
  useEffect(() => {
    const list = safeArray<MockNotification>(sortedNotifications);
    if (list.length === 0) return;
    
    const latest = list[0];
    if (latest && !latest.read && latest.id !== lastProcessedId.current) {
        // Disparar o toast
        toast({
            title: safeString(latest.title),
            description: safeString(latest.message),
            variant: latest.type === 'emergency' ? 'destructive' : 'default',
        });
        lastProcessedId.current = latest.id;
    }
  }, [sortedNotifications, toast]);


  const handleMarkAsRead = (id: string) => {
    updateDoc('notifications', id, { read: true });
  };

  const handleClearAll = () => {
    safeArray<MockNotification>(notifications).forEach((n: MockNotification) => {
        if (n && n.id) deleteDoc('notifications', n.id);
    });
    setIsOpen(false);
  };


  const getIcon = (type: string) => {
    switch (type) {
      case 'success': return <CheckCircle2 className="h-4 w-4 text-green-500" />;
      case 'alert': return <AlertTriangle className="h-4 w-4 text-amber-500" />;
      default: return <Info className="h-4 w-4 text-blue-500" />;
    }
  };

  return (
    <Sheet open={isOpen} onOpenChange={setIsOpen}>
      <SheetTrigger asChild>
        <Button variant="ghost" size="icon" className="relative hover:bg-primary/10 text-foreground shrink-0 transition-all">
          <Bell className="h-6 w-6" />
          {unreadCount > 0 && (
            <span className="absolute top-1.5 right-1.5 flex h-4 w-4 items-center justify-center rounded-full bg-destructive text-[10px] font-black text-white ring-2 ring-primary">
              {unreadCount}
            </span>
          )}
        </Button>
      </SheetTrigger>
      <SheetContent className="w-full sm:max-w-md p-0 flex flex-col bg-background">
        <SheetHeader className="p-6 border-b bg-muted/30">
          <div className="flex items-center justify-between">
            <SheetTitle className="text-xl font-black uppercase italic italic text-primary">Notificações</SheetTitle>
            {safeArray<MockNotification>(notifications).length > 0 && (
              <Button 
                variant="ghost" 
                size="sm" 
                onClick={handleClearAll}
                className="text-[10px] font-black uppercase text-muted-foreground hover:text-destructive transition-colors"
              >
                <Trash2 className="h-3 w-3 mr-2" /> Limpar Tudo
              </Button>
            )}
          </div>
        </SheetHeader>
        
        <ScrollArea className="flex-1">
          <div className="flex flex-col">
            {safeArray<MockNotification>(sortedNotifications).length > 0 ? (
              safeArray<MockNotification>(sortedNotifications).map((n: MockNotification) => (
                <SafeRow key={n.id} name={`Bell-Notif-${n.id}`}>
                  <div 
                    className={cn(
                      "p-5 border-b transition-colors relative group",
                      !n.read ? "bg-primary/[0.03]" : "opacity-80"
                    )}
                    onClick={() => !n.read && handleMarkAsRead(n.id)}
                  >
                    <div className="flex gap-4">
                      <div className={cn(
                        "mt-1 shrink-0 h-8 w-8 rounded-full flex items-center justify-center",
                        n.type === 'success' ? "bg-green-500/10" : 
                        n.type === 'warning' ? "bg-amber-500/10" : "bg-blue-500/10"
                      )}>
                        {getIcon(n.type)}
                      </div>
                      <div className="flex-1 min-w-0">
                        <div className="flex items-center justify-between mb-1">
                          <h4 className="font-black text-sm uppercase leading-tight truncate pr-4">
                            {safeString(n.title)}
                          </h4>
                          {!n.read && <div className="h-2 w-2 rounded-full bg-primary shrink-0" />}
                        </div>
                        <p className="text-xs text-muted-foreground font-medium leading-relaxed mb-2">
                          {safeString(n.message)}
                        </p>
                        <p className="text-[10px] font-black text-muted-foreground/50 uppercase tracking-widest">
                          {(() => {
                            try {
                              const date = getSafeDate(n.createdAt);
                              if (isNaN(date.getTime())) return 'Recente';
                              return formatDistanceToNow(date, { addSuffix: true, locale: ptBR });
                            } catch (e) {
                              return 'Recente';
                            }
                          })()}
                        </p>
                      </div>
                    </div>
                    {!n.read && (
                      <Button 
                        variant="ghost" 
                        size="icon" 
                        className="absolute top-4 right-2 h-8 w-8 opacity-0 group-hover:opacity-100 transition-opacity"
                        onClick={(e) => {
                          e.stopPropagation();
                          handleMarkAsRead(n.id);
                        }}
                      >
                        <Check className="h-4 w-4 text-primary" />
                      </Button>
                    )}
                  </div>
                </SafeRow>
              ))

            ) : (
              <div className="py-20 flex flex-col items-center justify-center text-center px-10">
                <Bell className="h-12 w-12 text-muted-foreground/20 mb-4" />
                <h3 className="text-sm font-black uppercase text-muted-foreground mb-1">Tudo limpo por aqui</h3>
                <p className="text-xs text-muted-foreground/60 font-medium">Você não tem notificações no momento.</p>
              </div>
            )}
          </div>
        </ScrollArea>
        
        <div className="p-4 border-t bg-muted/10 text-center">
            <p className="text-[9px] font-black text-muted-foreground uppercase tracking-widest">Fim das notificações recentes</p>
        </div>
      </SheetContent>
    </Sheet>
  );
}
