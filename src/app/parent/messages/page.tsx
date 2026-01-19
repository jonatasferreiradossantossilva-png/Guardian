"use client";
import { useState, useMemo, useEffect } from 'react';
import Link from 'next/link';
import { useMockCollection, useMockData, useMockDoc } from '@/hooks/use-mock-data';
import { Card, CardContent, CardHeader, CardTitle, CardFooter } from '@/components/ui/card';
import { Input } from '@/components/ui/input';
import { Button } from '@/components/ui/button';
import { Send, Loader2, ArrowLeft } from 'lucide-react';
import { ScrollArea } from '@/components/ui/scroll-area';

export default function ParentMessagesPage() {
  const { addDoc } = useMockData();
  const [mockUserId, setMockUserId] = useState<string | null>(null);

  useEffect(() => {
    const storedUserId = sessionStorage.getItem('mockUserId');
    setMockUserId(storedUserId);
  }, []);

  const { data: parents } = useMockCollection('parents', mockUserId ? [{ field: 'userId', op: '==', value: mockUserId }] : []);
  const parent = useMemo(() => parents?.[0], [parents]);
  
  const { data: students } = useMockCollection('students', parent ? [{ field: 'parentId', op: '==', value: parent.id }] : []);
  const student = useMemo(() => students?.[0], [students]);
  const { data: route } = useMockDoc('routes', student?.routeId);
  const driverId = useMemo(() => route?.driverId, [route]);

  const { data: messages, isLoading: areMessagesLoading } = useMockCollection('messages');
  const { data: predefinedMessages } = useMockCollection('predefined_messages');
  
  const [currentMessage, setCurrentMessage] = useState('');

  const chatMessages = useMemo(() => {
    if (!parent || !messages || !driverId) return [];
    return messages.filter(m => (m.senderId === parent.id && m.recipientId === driverId) || (m.senderId === driverId && m.recipientId === parent.id))
      .sort((a, b) => new Date(a.timestamp) - new Date(b.timestamp));
  }, [messages, parent, driverId]);
  
  const parentPredefinedMessages = useMemo(() => {
      return predefinedMessages?.filter(pm => pm.for === 'parent' || pm.for === 'all') || [];
  }, [predefinedMessages]);

  const handleSendMessage = (text: string) => {
    if (!text.trim() || !parent || !driverId) return;
    
    addDoc('messages', {
        senderId: parent.id,
        recipientId: driverId,
        text: text,
        timestamp: new Date().toISOString()
    });

    setCurrentMessage('');
  };

  if (!parent) {
      return (
          <div className="flex items-center justify-center h-screen">
              <Loader2 className="animate-spin" /> <span className="ml-2">Carregando dados...</span>
          </div>
      );
  }

  return (
    <div className="min-h-screen bg-background text-foreground p-4">
      <div className="max-w-4xl mx-auto">
        <div className="flex items-center gap-4 mb-6">
            <Button asChild variant="outline" size="icon">
                <Link href="/parent/tracking"><ArrowLeft /></Link>
            </Button>
            <h1 className="text-3xl font-bold tracking-tight">Mensagens para o Motorista</h1>
        </div>
        <Card className="flex flex-col h-[calc(100vh-10rem)]">
          <CardHeader className="border-b">
            <CardTitle>Conversa</CardTitle>
          </CardHeader>
          <ScrollArea className="flex-1 p-4 bg-secondary/20">
            <div className="space-y-4">
              {chatMessages.map(msg => (
                <div
                  key={msg.id}
                  className={`flex items-end gap-2 ${msg.senderId === parent.id ? 'justify-end' : ''}`}
                >
                  <div className={`max-w-xs md:max-w-md p-3 rounded-lg ${msg.senderId === parent.id ? 'bg-primary text-primary-foreground' : 'bg-background border'}`}>
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
                {parentPredefinedMessages.map(pm => (
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
        </Card>
      </div>
    </div>
  );
}
