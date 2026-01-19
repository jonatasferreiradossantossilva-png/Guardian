"use client";
import { useState, useMemo, useEffect } from 'react';
import Link from 'next/link';
import { useMockCollection, useMockData } from '@/hooks/use-mock-data';
import { Card, CardContent, CardHeader, CardTitle, CardFooter } from '@/components/ui/card';
import { Input } from '@/components/ui/input';
import { Button } from '@/components/ui/button';
import { Send, User, Loader2, ArrowLeft } from 'lucide-react';
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar';
import { ScrollArea } from '@/components/ui/scroll-area';

export default function DriverMessagesPage() {
  const { addDoc } = useMockData();
  const [mockUserId, setMockUserId] = useState<string | null>(null);

  useEffect(() => {
    const storedUserId = sessionStorage.getItem('mockUserId');
    setMockUserId(storedUserId);
  }, []);

  const driverFilter = useMemo(() => (mockUserId ? [{ field: 'userId', op: '==', value: mockUserId }] : undefined), [mockUserId]);
  const { data: drivers, isLoading: areDriversLoading } = useMockCollection('drivers', driverFilter);
  const driver = useMemo(() => drivers?.[0], [drivers]);
  const driverUserId = driver?.userId;

  const activeRouteFilter = useMemo(() => (driver ? [
      { field: 'driverId', op: '==', value: driver.id },
      { field: 'active', op: '==', value: true }
  ] : undefined), [driver]);
  const { data: routes, isLoading: areRoutesLoading } = useMockCollection('routes', activeRouteFilter);
  const activeRoute = useMemo(() => routes?.[0], [routes]);

  const studentsOnRouteFilter = useMemo(() => (activeRoute ? [
      { field: 'id', op: 'in', value: activeRoute.studentIds }
  ] : undefined), [activeRoute]);
  const { data: studentsOnRoute, isLoading: areStudentsLoading } = useMockCollection('students', studentsOnRouteFilter);
  
  const { data: allParents, isLoading: areParentsLoading } = useMockCollection('parents');
  const { data: messages, isLoading: areMessagesLoading } = useMockCollection('messages');
  const { data: predefinedMessages } = useMockCollection('predefined_messages');

  const [selectedParentId, setSelectedParentId] = useState<string | null>(null);
  const [currentMessage, setCurrentMessage] = useState('');

  const relevantParents = useMemo(() => {
    if (!studentsOnRoute || !allParents) return [];
    const parentIdsOnRoute = new Set(studentsOnRoute.map(s => s.parentId));
    return allParents.filter(p => parentIdsOnRoute.has(p.id));
  }, [studentsOnRoute, allParents]);

  const selectedParent = useMemo(() => allParents?.find(p => p.id === selectedParentId), [allParents, selectedParentId]);
  const selectedParentUserId = selectedParent?.userId;
  
  const chatMessages = useMemo(() => {
    if (!selectedParentUserId || !messages || !driverUserId) return [];
    return messages
      .filter(m => (m.senderId === selectedParentUserId && m.recipientId === driverUserId) || (m.senderId === driverUserId && m.recipientId === selectedParentUserId))
      .sort((a, b) => new Date(a.timestamp).valueOf() - new Date(b.timestamp).valueOf());
  }, [messages, selectedParentUserId, driverUserId]);
  
  const driverPredefinedMessages = useMemo(() => {
      return predefinedMessages?.filter(pm => pm.for === 'driver' || pm.for === 'all') || [];
  }, [predefinedMessages]);

  const handleSendMessage = (text: string) => {
    if (!text.trim() || !selectedParentUserId || !driverUserId) return;
    
    addDoc('messages', {
        senderId: driverUserId,
        recipientId: selectedParentUserId,
        text: text,
        timestamp: new Date().toISOString()
    });

    setCurrentMessage('');
  };
  
  const isLoading = areDriversLoading || areRoutesLoading || areStudentsLoading || areParentsLoading || areMessagesLoading;

  useEffect(() => {
    if (!selectedParentId && relevantParents.length > 0) {
      setSelectedParentId(relevantParents[0].id);
    }
  }, [relevantParents, selectedParentId]);

  if (isLoading) {
    return (
        <div className="flex items-center justify-center h-screen">
            <Loader2 className="animate-spin h-8 w-8 text-primary" /> <span className="ml-2 text-muted-foreground">Carregando mensagens...</span>
        </div>
    );
  }

  if (!driver) {
      return (
          <div className="flex flex-col items-center justify-center h-screen text-center p-4">
              <User className="h-12 w-12 text-muted-foreground mb-4"/>
              <h2 className="text-xl font-semibold">Perfil de Motorista não Encontrado</h2>
              <p className="text-muted-foreground max-w-md">Não foi possível carregar os dados. Verifique se seu usuário está associado a um perfil de motorista ativo.</p>
              <Button asChild variant="outline" className="mt-4">
                <Link href="/driver/route-plan">Voltar para o Plano de Rota</Link>
              </Button>
          </div>
      );
  }

  return (
    <div className="min-h-screen bg-background text-foreground p-4">
      <div className="max-w-4xl mx-auto">
        <div className="flex items-center gap-4 mb-6">
            <Button asChild variant="outline" size="icon">
                <Link href="/driver/route-plan"><ArrowLeft /></Link>
            </Button>
            <h1 className="text-3xl font-bold tracking-tight">Minhas Mensagens</h1>
        </div>
        <Card className="grid grid-cols-[300px_1fr] h-[calc(100vh-12rem)]">
          {/* Parent List */}
          <div className="flex flex-col border-r">
            <CardHeader>
              <CardTitle className="text-base">Pais na sua rota ativa</CardTitle>
            </CardHeader>
            <ScrollArea className="flex-1">
              <CardContent className="p-2">
                {relevantParents.map(parent => (
                  <button
                    key={parent.id}
                    onClick={() => setSelectedParentId(parent.id)}
                    className={`w-full text-left p-3 rounded-lg flex items-center gap-3 transition-colors ${selectedParentId === parent.id ? 'bg-secondary' : 'hover:bg-secondary/50'}`}
                  >
                    <Avatar>
                      <AvatarImage src={`https://picsum.photos/seed/parent${parent.id}/100/100`} alt={parent.name} />
                      <AvatarFallback>{parent.name.charAt(0)}</AvatarFallback>
                    </Avatar>
                    <span className="font-medium text-sm">{parent.name}</span>
                  </button>
                ))}
                 {relevantParents.length === 0 && <p className="p-4 text-sm text-muted-foreground text-center">Nenhum pai encontrado na sua rota ativa.</p>}
              </CardContent>
            </ScrollArea>
          </div>

          {/* Chat Window */}
          <div className="flex flex-col">
            {selectedParentId ? (
              <>
                <CardHeader className="border-b">
                  <CardTitle className="flex items-center gap-3">
                    <User />
                    {allParents?.find(p => p.id === selectedParentId)?.name || 'Selecione uma conversa'}
                  </CardTitle>
                </CardHeader>
                <ScrollArea className="flex-1 p-4 bg-secondary/20">
                  <div className="space-y-4">
                    {chatMessages.map(msg => (
                      <div
                        key={msg.id}
                        className={`flex items-end gap-2 ${msg.senderId === driverUserId ? 'justify-end' : ''}`}
                      >
                        <div className={`max-w-xs md:max-w-md p-3 rounded-lg ${msg.senderId === driverUserId ? 'bg-primary text-primary-foreground' : 'bg-background border'}`}>
                          <p className="text-sm">{msg.text}</p>
                           <p className="text-xs text-right mt-1 opacity-70">
                              {new Date(msg.timestamp).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
                          </p>
                        </div>
                      </div>
                    ))}
                  </div>
                </ScrollArea>
                 <div className="p-2 border-t flex flex-wrap gap-2 bg-background">
                    {driverPredefinedMessages.map(pm => (
                        <Button key={pm.id} variant="outline" size="sm" onClick={() => handleSendMessage(pm.text)}>
                            {pm.text}
                        </Button>
                    ))}
                </div>
                <CardFooter className="p-4 border-t bg-background">
                  <div className="relative w-full">
                    <Input
                      placeholder="Digite sua mensagem..."
                      value={currentMessage}
                      onChange={e => setCurrentMessage(e.target.value)}
                      onKeyPress={e => e.key === 'Enter' && handleSendMessage(currentMessage)}
                      disabled={!selectedParentId}
                    />
                    <Button
                      size="icon"
                      className="absolute right-1 top-1/2 -translate-y-1/2 h-8 w-8"
                      onClick={() => handleSendMessage(currentMessage)}
                      disabled={!currentMessage.trim() || !selectedParentId}
                    >
                      <Send />
                    </Button>
                  </div>
                </CardFooter>
              </>
            ) : (
              <div className="flex items-center justify-center h-full text-muted-foreground">
                <p>Nenhuma conversa para exibir.</p>
              </div>
            )}
          </div>
        </Card>
      </div>
    </div>
  );
}
