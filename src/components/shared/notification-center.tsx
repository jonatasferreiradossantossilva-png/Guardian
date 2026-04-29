
'use client';

import { useState, useMemo } from 'react';
import { Bell, BellDot, Check, Trash2, Info, AlertTriangle, ShieldAlert, CheckCircle2, Clock } from 'lucide-react';
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuLabel,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from '@/components/ui/dropdown-menu';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { ScrollArea } from '@/components/ui/scroll-area';
import { useMockCollection, useMockData } from '@/hooks/use-mock-data';
import { Notification as MockNotification } from '@/types/mock-data';

import { cn } from '@/lib/utils';
import { formatDistanceToNow } from 'date-fns';
import { ptBR } from 'date-fns/locale';
import { safeString, safeArray } from '@/lib/safe-render';
import { SafeRow } from './safe-table';


export function NotificationCenter({ userId }: { userId: string }) {
  const { updateDoc, deleteDoc } = useMockData();
  const { data: allNotifications } = useMockCollection('notifications');
  
  const notifications = useMemo(() => {
    const list = safeArray<MockNotification>(allNotifications);
    return list
      .filter((n: MockNotification) => n && (n.userId === userId || n.userId === 'all'))
      .sort((a, b) => {
        const dateA = new Date(a.createdAt || (a as any).timestamp || 0).getTime();
        const dateB = new Date(b.createdAt || (b as any).timestamp || 0).getTime();
        return dateB - dateA;
      });
  }, [allNotifications, userId]);



  const unreadCount = useMemo(() => safeArray<MockNotification>(notifications).filter((n: MockNotification) => n && !n.read).length, [notifications]);



  const handleMarkAsRead = (id: string) => {
    updateDoc('notifications', id, { read: true });
  };

  const handleMarkAllAsRead = () => {
    safeArray<MockNotification>(notifications).forEach((n: MockNotification) => {
      if (n && !n.read) handleMarkAsRead(n.id);
    });
  };



  const handleDelete = (id: string) => {
    deleteDoc('notifications', id);
  };
  
  const getIcon = (type: MockNotification['type']) => {

    switch (type) {
      case 'emergency': return <ShieldAlert className="h-4 w-4 text-destructive" />;
      case 'warning': return <AlertTriangle className="h-4 w-4 text-amber-500" />;
      case 'success': return <CheckCircle2 className="h-4 w-4 text-green-500" />;
      default: return <Info className="h-4 w-4 text-blue-500" />;
    }
  };

  return (
    <DropdownMenu>
      <DropdownMenuTrigger asChild>
        <Button variant="ghost" size="icon" className="relative group">
          {unreadCount > 0 ? (
            <>
              <BellDot className="h-5 w-5 text-primary group-hover:scale-110 transition-transform" />
              <Badge className="absolute -top-1 -right-1 h-4 w-4 p-0 flex items-center justify-center bg-destructive text-[10px] animate-in zoom-in duration-300">
                {unreadCount}
              </Badge>
            </>
          ) : (
            <Bell className="h-5 w-5 text-muted-foreground group-hover:scale-110 transition-transform" />
          )}
        </Button>
      </DropdownMenuTrigger>
      <DropdownMenuContent align="end" className="w-[380px] p-0 shadow-2xl border-primary/20 bg-background/95 backdrop-blur-md">
        <DropdownMenuLabel className="p-4 flex items-center justify-between bg-secondary/20">
          <div className="flex items-center gap-2">
            <Bell className="h-4 w-4 text-primary" />
            <span className="font-black uppercase tracking-widest text-xs">Notificações</span>
          </div>
          {unreadCount > 0 && (
            <Button variant="ghost" size="sm" onClick={handleMarkAllAsRead} className="h-7 text-[10px] uppercase font-bold hover:text-primary">
              <Check className="h-3 w-3 mr-1" /> Marcar lidas
            </Button>
          )}
        </DropdownMenuLabel>
        <DropdownMenuSeparator className="m-0" />
        <ScrollArea className="h-[450px]">
          {safeArray(notifications).length > 0 ? (
            <div className="divide-y divide-border">
              {safeArray<MockNotification>(notifications).map((notification: MockNotification) => (
                <SafeRow key={notification.id} name={`Notif-${notification.id}`}>
                  <div
                    className={cn(
                      "p-4 flex gap-3 hover:bg-muted/50 transition-colors group relative",
                      !notification.read && "bg-primary/5 before:absolute before:left-0 before:top-0 before:bottom-0 before:w-1 before:bg-primary"
                    )}
                    onClick={() => !notification.read && handleMarkAsRead(notification.id)}
                  >
                    <div className="shrink-0 mt-1">
                      {getIcon(notification.type)}
                    </div>
                    <div className="flex-1 space-y-1">
                      <div className="flex items-start justify-between">
                        <p className={cn("text-xs font-black uppercase leading-tight", !notification.read ? "text-primary" : "text-foreground")}>
                          {safeString(notification.title)}
                        </p>
                        <button 
                          onClick={(e) => { e.stopPropagation(); handleDelete(notification.id); }}
                          className="opacity-0 group-hover:opacity-100 p-1 hover:bg-destructive/10 rounded transition-all text-destructive"
                        >
                          <Trash2 className="h-3.5 w-3.5" />
                        </button>
                      </div>
                      <p className="text-xs text-muted-foreground leading-snug">
                        {safeString(notification.message)}
                      </p>
                      <div className="flex items-center gap-1.5 pt-1">
                        <Clock className="h-3 w-3 text-muted-foreground" />
                        <span className="text-[10px] text-muted-foreground font-medium italic">
                          {(() => {
                            try {
                              const date = new Date(notification.createdAt || (notification as any).timestamp || '');
                              if (isNaN(date.getTime())) return 'Recente';
                              return formatDistanceToNow(date, { addSuffix: true, locale: ptBR });
                            } catch (e) {
                              return 'Recente';
                            }
                          })()}
                        </span>
                      </div>
                    </div>
                  </div>
                </SafeRow>
              ))}
            </div>


          ) : (
            <div className="h-full flex flex-col items-center justify-center p-10 text-center opacity-40">
              <Bell className="h-10 w-10 mb-2" />
              <p className="text-sm font-bold uppercase tracking-widest">Tudo limpo por aqui</p>
              <p className="text-[10px] mt-1">Você não tem novas notificações.</p>
            </div>
          )}
        </ScrollArea>
        <DropdownMenuSeparator className="m-0" />
        <div className="p-2 bg-secondary/10">
          <Button variant="ghost" className="w-full h-8 text-[10px] uppercase font-black tracking-widest text-muted-foreground">
             Ver Histórico Completo
          </Button>
        </div>
      </DropdownMenuContent>
    </DropdownMenu>
  );
}
