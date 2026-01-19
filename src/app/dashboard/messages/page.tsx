"use client";
import { useState, useMemo, useEffect } from 'react';
import { useMockCollection, useMockData } from '@/hooks/use-mock-data';
import { Card, CardContent, CardHeader, CardTitle, CardFooter } from '@/components/ui/card';
import { Input } from '@/components/ui/input';
import { Button } from '@/components/ui/button';
import { Send, User, Loader2 } from 'lucide-react';
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar';
import { ScrollArea } from '@/components/ui/scroll-area';

export default function MessagesPage() {
  const { data: parents, isLoading: areParentsLoading } = useMockCollection('parents');
  const { data: messages, isLoading: areMessagesLoading } = useMockCollection('messages');
  const { addDoc } = useMockData();

  const [selectedParentId, setSelectedParentId] = useState<string | null>(null);
  const [currentMessage, setCurrentMessage] = useState('');
  const [mockUserId, setMockUserId] = useState<string | null>(null);

  useEffect(() => {
    const storedUserId = sessionStorage.getItem('mockUserId');
    setMockUserId(storedUserId);
  }, []);
  
  const selectedParent = useMemo(() => {
    if (!selectedParentId || !parents) return null;
    return parents.find(p => p.id === selectedParentId);
  }, [parents, selectedParentId]);


  const parentMessages = useMemo(() => {
    if (!selectedParent || !messages || !mockUserId) return [];
    
    const parentUserId = selectedParent.userId;

    return messages.filter(m => {
      const isUserSender = m.senderId === mockUserId;
      const isUserRecipient = m.recipientId === mockUserId;
      const isParentSender = m.senderId === parentUserId;
      const isParentRecipient = m.recipientId === parentUserId;

      return (isUserSender && isParentRecipient) || (isParentSender && isUserRecipient);
    }).sort((a, b) => new Date(a.timestamp).valueOf() - new Date(b.timestamp).valueOf());
  }, [messages, selectedParent, mockUserId]);

  const handleSendMessage = () => {
    if (!currentMessage.trim() || !selectedParent || !mockUserId) return;
    
    addDoc('messages', {
        senderId: mockUserId,
        recipientId: selectedParent.userId,
        text: currentMessage,
        timestamp: new Date().toISOString()
    });

    setCurrentMessage('');
  };
  
  const isLoading = areParentsLoading || areMessagesLoading;
  
  const isAdminMessage = (senderId: string) => {
    return senderId === mockUserId;
  };

  return (
    <div>
      <h1 className="text-3xl font-bold tracking-tight mb-6">Central de Mensagens</h1>
      <Card className="grid grid-cols-[300px_1fr] h-[calc(100vh-12rem)]">
        {/* Parent List */}
        <div className="flex flex-col border-r">
          <CardHeader>
            <CardTitle>Conversas</CardTitle>
          </CardHeader>
          <ScrollArea className="flex-1">
            <CardContent className="p-2">
              {isLoading && <Loader2 className="animate-spin mx-auto mt-10" />}
              {!isLoading && parents?.map(parent => (
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
                  {parentMessages.map(msg => (
                    <div
                      key={msg.id}
                      className={`flex items-end gap-2 ${isAdminMessage(msg.senderId) ? 'justify-end' : ''}`}
                    >
                      <div className={`max-w-xs md:max-w-md p-3 rounded-lg ${isAdminMessage(msg.senderId) ? 'bg-primary text-primary-foreground' : 'bg-background border'}`}>
                        <p className="text-sm">{msg.text}</p>
                        <p className="text-xs text-right mt-1 opacity-70">
                            {new Date(msg.timestamp).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
                        </p>
                      </div>
                    </div>
                  ))}
                </div>
              </ScrollArea>
              <CardFooter className="p-4 border-t">
                <div className="relative w-full">
                  <Input
                    placeholder="Digite sua mensagem..."
                    value={currentMessage}
                    onChange={e => setCurrentMessage(e.target.value)}
                    onKeyPress={e => e.key === 'Enter' && handleSendMessage()}
                  />
                  <Button
                    size="icon"
                    className="absolute right-1 top-1/2 -translate-y-1/2 h-8 w-8"
                    onClick={handleSendMessage}
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
  );
}
