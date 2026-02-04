"use client";
import { useState, useMemo, useEffect } from 'react';
import { useMockCollection, useMockData } from '@/hooks/use-mock-data';
import { Card, CardContent, CardHeader, CardTitle, CardFooter } from '@/components/ui/card';
import { Input } from '@/components/ui/input';
import { Button } from '@/components/ui/button';
import { Send, User, Loader2, Car, ClipboardCheck, ArrowLeft } from 'lucide-react';
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar';
import { ScrollArea } from '@/components/ui/scroll-area';
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { cn } from '@/lib/utils';

type ConversationParticipant = {
  id: string; // The database ID (e.g., parent-1, driver-2)
  userId: string; // The auth user ID
  name: string;
  avatarSeed: string;
};

export default function MessagesPage() {
  const { data: parents, isLoading: areParentsLoading } = useMockCollection('parents');
  const { data: drivers, isLoading: areDriversLoading } = useMockCollection('drivers');
  const { data: users, isLoading: areUsersLoading } = useMockCollection('users');
  const { data: messages, isLoading: areMessagesLoading } = useMockCollection('messages');
  const { data: predefinedMessages } = useMockCollection('predefined_messages');
  const { addDoc } = useMockData();

  const [selectedConversation, setSelectedConversation] = useState<ConversationParticipant | null>(null);
  const [currentMessage, setCurrentMessage] = useState('');
  const [mockUserId, setMockUserId] = useState<string | null>(null);

  useEffect(() => {
    const storedUserId = sessionStorage.getItem('mockUserId');
    setMockUserId(storedUserId);
  }, []);

  const monitors = useMemo(() => (users || []).filter(u => u.profile === 'monitor'), [users]);

  const chatMessages = useMemo(() => {
    if (!selectedConversation || !messages || !mockUserId) return [];
    
    return messages.filter(m => {
      const isUserSender = m.senderId === mockUserId;
      const isUserRecipient = m.recipientId === selectedConversation.userId;
      const isParticipantSender = m.senderId === selectedConversation.userId;
      const isParticipantRecipient = m.recipientId === mockUserId;

      return (isUserSender && isParticipantRecipient) || (isParticipantSender && isUserRecipient);
    }).sort((a, b) => new Date(a.timestamp).valueOf() - new Date(b.timestamp).valueOf());
  }, [messages, selectedConversation, mockUserId]);
  
  const managerPredefinedMessages = useMemo(() => {
      return predefinedMessages?.filter(pm => pm.for === 'gestor' || pm.for === 'all') || [];
  }, [predefinedMessages]);

  const handleSendMessage = (text: string) => {
    if (!text.trim() || !selectedConversation || !mockUserId) return;
    
    addDoc('messages', {
        senderId: mockUserId,
        recipientId: selectedConversation.userId,
        text: text,
        timestamp: new Date().toISOString()
    });

    setCurrentMessage('');
  };
  
  const isLoading = areParentsLoading || areMessagesLoading || areDriversLoading || areUsersLoading;

  const handleSelectConversation = (participant: ConversationParticipant) => {
    setSelectedConversation(participant);
  };
  
  const isAdminMessage = (senderId: string) => senderId === mockUserId;

  return (
    <div className="flex flex-col h-full">
      <h1 className="text-3xl font-bold tracking-tight mb-6 shrink-0">Central de Mensagens</h1>
        <Card className="flex-1 flex overflow-hidden">
          {/* Conversation List Panel */}
          <div className={cn(
              "w-full flex-col border-r md:w-[300px] md:flex-shrink-0",
              selectedConversation ? "hidden md:flex" : "flex"
            )}>
            <CardHeader>
              <CardTitle>Conversas</CardTitle>
            </CardHeader>
            <Tabs defaultValue="parents" className="flex flex-col flex-1 min-h-0">
             <div className="px-4">
                <TabsList className="grid w-full grid-cols-3">
                    <TabsTrigger value="parents"><User className="mr-2 h-4 w-4"/>Pais</TabsTrigger>
                    <TabsTrigger value="drivers"><Car className="mr-2 h-4 w-4"/>Motoristas</TabsTrigger>
                    <TabsTrigger value="monitors"><ClipboardCheck className="mr-2 h-4 w-4"/>Monitores</TabsTrigger>
                </TabsList>
             </div>
            <ScrollArea className="flex-1 mt-2">
                {isLoading && <Loader2 className="animate-spin mx-auto mt-10" />}
                
                <TabsContent value="parents" className="m-0">
                    <div className="p-2 space-y-1">
                        {parents?.map(parent => (
                            <ConversationListItem
                                key={parent.id}
                                participant={{ id: parent.id, userId: parent.userId, name: parent.name, avatarSeed: `parent${parent.id}`}}
                                isSelected={selectedConversation?.id === parent.id}
                                onSelect={handleSelectConversation}
                            />
                        ))}
                    </div>
                </TabsContent>
                <TabsContent value="drivers" className="m-0">
                     <div className="p-2 space-y-1">
                        {drivers?.map(driver => (
                            <ConversationListItem
                                key={driver.id}
                                participant={{ id: driver.id, userId: driver.userId, name: driver.name, avatarSeed: `driver${driver.id}`}}
                                isSelected={selectedConversation?.id === driver.id}
                                onSelect={handleSelectConversation}
                            />
                        ))}
                    </div>
                </TabsContent>
                <TabsContent value="monitors" className="m-0">
                     <div className="p-2 space-y-1">
                        {monitors?.map(monitor => (
                           <ConversationListItem
                                key={monitor.id}
                                participant={{ id: monitor.id, userId: monitor.id, name: monitor.name, avatarSeed: `user${monitor.id}`}}
                                isSelected={selectedConversation?.id === monitor.id}
                                onSelect={handleSelectConversation}
                            />
                        ))}
                    </div>
                </TabsContent>
            </ScrollArea>
          </Tabs>
          </div>

          {/* Chat Window */}
          <div className={cn(
              "flex-1 flex-col",
              selectedConversation ? "flex" : "hidden md:flex"
            )}>
            {selectedConversation ? (
              <>
                <CardHeader className="border-b">
                  <CardTitle className="flex items-center gap-2">
                     <Button variant="ghost" size="icon" className="md:hidden -ml-2" onClick={() => setSelectedConversation(null)}>
                        <ArrowLeft />
                    </Button>
                    <User />
                    {selectedConversation.name}
                  </CardTitle>
                </CardHeader>
                <ScrollArea className="flex-1 p-4 bg-secondary/20">
                  <div className="space-y-4">
                    {chatMessages.map(msg => (
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
                <div className="p-2 border-t flex flex-wrap gap-2 bg-background">
                    {managerPredefinedMessages.map(pm => (
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
  );
}


function ConversationListItem({ participant, isSelected, onSelect }: { participant: ConversationParticipant, isSelected: boolean, onSelect: (p: ConversationParticipant) => void }) {
    return (
        <button
            onClick={() => onSelect(participant)}
            className={`w-full text-left p-3 rounded-lg flex items-center gap-3 transition-colors ${isSelected ? 'bg-secondary' : 'hover:bg-secondary/50'}`}
        >
            <Avatar>
            <AvatarImage src={`https://picsum.photos/seed/${participant.avatarSeed}/100/100`} alt={participant.name} />
            <AvatarFallback>{participant.name.charAt(0)}</AvatarFallback>
            </Avatar>
            <span className="font-medium text-sm">{participant.name}</span>
        </button>
    );
}

    