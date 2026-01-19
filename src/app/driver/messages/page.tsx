// This is a new file
"use client";
import { useState, useMemo, useEffect } from 'react';
import Link from 'next/link';
import { useUser } from '@/firebase';
import { useMockCollection, useMockData } from '@/hooks/use-mock-data';
import { Card, CardContent, CardHeader, CardTitle, CardFooter } from '@/components/ui/card';
import { Input } from '@/components/ui/input';
import { Button } from '@/components/ui/button';
import { Send, User, Loader2, ArrowLeft } from 'lucide-react';
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar';
import { ScrollArea } from '@/components/ui/scroll-area';

export default function DriverMessagesPage() {
  const { user } = useUser();
  const { data: drivers } = useMockCollection('drivers', user ? [{ field: 'userId', op: '==', value: user.uid }] : []);
  const driver = useMemo(() => drivers?.[0], [drivers]);
  
  const { data: parents, isLoading: areParentsLoading } = useMockCollection('parents');
  const { data: messages, isLoading: areMessagesLoading } = useMockCollection('messages');
  const { data: predefinedMessages } = useMockCollection('predefined_messages');

  const [selectedParentId, setSelectedParentId] = useState(null);
  const [currentMessage, setCurrentMessage] = useState('');

  const relevantParents = useMemo(() => {
    if (!messages || !parents || !driver) return [];
    const parentIds = new Set(
        messages.filter(m => m.recipientId === driver.id || m.senderId === driver.id)
                .map(m => m.senderId === driver.id ? m.recipientId : m.senderId)
    );
    return parents.filter(p => parentIds.has(p.id));
  }, [messages, parents, driver]);
  

  const chatMessages = useMemo(() => {
    if (!selectedParentId || !messages || !driver) return [];
    return messages.filter(m => (m.senderId === selectedParentId && m.recipientId === driver.id) || (m.senderId === driver.id && m.recipientId === selectedParentId))
      .sort((a, b) => new Date(a.timestamp) - new Date(b.timestamp));
  }, [messages, selectedParentId, driver]);
  
  const driverPredefinedMessages = useMemo(() => {
      return predefinedMessages?.filter(pm => pm.for === 'driver' || pm.for === 'all') || [];
  }, [predefinedMessages]);

  const handleSendMessage = (text) => {
    if (!text.trim() || !selectedParentId) return;
    console.log(`Message to ${selectedParentId}: ${text}`);
    setCurrentMessage('');
    // Mock: Add message to db state
  };
  
  const isLoading = areParentsLoading || areMessagesLoading;

  if (!driver) {
      return (
          <div className="flex items-center justify-center h-screen">
              <Loader2 className="animate-spin" /> <span className="ml-2">Carregando dados do motorista...</span>
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
              <CardTitle>Conversas com Pais</CardTitle>
            </CardHeader>
            <ScrollArea className="flex-1">
              <CardContent className="p-2">
                {isLoading && <Loader2 className="animate-spin mx-auto mt-10" />}
                {!isLoading && relevantParents?.map(parent => (
                  <button
                    key={parent.id}
                    onClick={() => setSelectedParentId(parent.id)}
                    className={`w-full text-left p-3 rounded-lg flex items-center gap-3 transition-colors ${selectedParentId === parent.id ? 'bg-secondary' : 'hover:bg-secondary/50'}`}
                  >
                    <Avatar>
                      <AvatarImage src={`https://picsum.photos/seed/parent${parent.id}/100/100`} alt={parent.name} />
                      <AvatarFallback>{parent.name.charAt(0)}</AvatarFallback>
                    </Avatar>
                    <span className="font-medium">{parent.name}</span>
                  </button>
                ))}
                 {!isLoading && relevantParents.length === 0 && <p className="p-4 text-sm text-muted-foreground text-center">Nenhuma conversa encontrada.</p>}
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
                    {parents?.find(p => p.id === selectedParentId)?.name || 'Selecione uma conversa'}
                  </CardTitle>
                </CardHeader>
                <ScrollArea className="flex-1 p-4 bg-secondary/20">
                  <div className="space-y-4">
                    {chatMessages.map(msg => (
                      <div
                        key={msg.id}
                        className={`flex items-end gap-2 ${msg.senderId === driver.id ? 'justify-end' : ''}`}
                      >
                        <div className={`max-w-xs md:max-w-md p-3 rounded-lg ${msg.senderId === driver.id ? 'bg-primary text-primary-foreground' : 'bg-background border'}`}>
                          <p className="text-sm">{msg.text}</p>
                           <p className="text-xs text-right mt-1 opacity-70">
                              {new Date(msg.timestamp).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
                          </p>
                        </div>
                      </div>
                    ))}
                  </div>
                </ScrollArea>
                 <div className="p-2 border-t flex flex-wrap gap-2">
                    {driverPredefinedMessages.map(pm => (
                        <Button key={pm.id} variant="outline" size="sm" onClick={() => handleSendMessage(pm.text)}>
                            {pm.text}
                        </Button>
                    ))}
                </div>
                <CardFooter className="p-4 border-t">
                  <div className="relative w-full">
                    <Input
                      placeholder="Digite sua mensagem..."
                      value={currentMessage}
                      onChange={e => setCurrentMessage(e.target.value)}
                      onKeyPress={e => e.key === 'Enter' && handleSendMessage(currentMessage)}
                    />
                    <Button
                      size="icon"
                      className="absolute right-1 top-1/2 -translate-y-1/2 h-8 w-8"
                      onClick={() => handleSendMessage(currentMessage)}
                      disabled={!currentMessage.trim()}
                    >
                      <Send />
                    </Button>
                  </div>
                </CardFooter>
              </>
            ) : (
              <div className="flex items-center justify-center h-full text-muted-foreground">
                <p>Selecione uma conversa para começar.</p>
              </div>
            )}
          </div>
        </Card>
      </div>
    </div>
  );
}
