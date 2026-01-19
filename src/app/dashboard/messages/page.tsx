"use client";
import { useState, useMemo } from 'react';
import { useMockCollection } from '@/hooks/use-mock-data';
import { Card, CardContent, CardHeader, CardTitle, CardFooter } from '@/components/ui/card';
import { Input } from '@/components/ui/input';
import { Button } from '@/components/ui/button';
import { Send, User, Loader2 } from 'lucide-react';
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar';
import { ScrollArea } from '@/components/ui/scroll-area';

export default function MessagesPage() {
  const { data: parents, isLoading: areParentsLoading } = useMockCollection('parents');
  const { data: messages, isLoading: areMessagesLoading } = useMockCollection('messages');

  const [selectedParentId, setSelectedParentId] = useState(null);
  const [currentMessage, setCurrentMessage] = useState('');

  const parentMessages = useMemo(() => {
    if (!selectedParentId || !messages) return [];
    // For mock purposes, we assume 'admin' is the recipient for all parent messages
    return messages.filter(m => (m.senderId === selectedParentId && m.recipientId === 'admin') || (m.senderId === 'admin' && m.recipientId === selectedParentId))
      .sort((a, b) => new Date(a.timestamp) - new Date(b.timestamp));
  }, [messages, selectedParentId]);

  const handleSendMessage = () => {
    if (!currentMessage.trim() || !selectedParentId) return;
    // Mock sending message - in a real app, this would call an API or Firestore function
    console.log(`Message to ${selectedParentId}: ${currentMessage}`);
    setCurrentMessage('');
    // You would add the new message to the 'messages' collection here
  };
  
  const isLoading = areParentsLoading || areMessagesLoading;

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
                      className={`flex items-end gap-2 ${msg.senderId === 'admin' ? 'justify-end' : ''}`}
                    >
                      <div className={`max-w-xs md:max-w-md p-3 rounded-lg ${msg.senderId === 'admin' ? 'bg-primary text-primary-foreground' : 'bg-background border'}`}>
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
