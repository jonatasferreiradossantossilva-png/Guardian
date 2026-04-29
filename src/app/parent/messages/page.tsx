
"use client";
import { useState, useMemo, useEffect } from 'react';
import Link from 'next/link';
import { useMockCollection, useMockData, useMockDoc } from '@/hooks/use-mock-data';
import { Card, CardContent, CardHeader, CardTitle, CardFooter } from '@/components/ui/card';
import { Input } from '@/components/ui/input';
import { Button } from '@/components/ui/button';
import { Send, Loader2, ArrowLeft, Building, Car, ClipboardCheck } from 'lucide-react';
import { ScrollArea } from '@/components/ui/scroll-area';
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar';
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { cn } from '@/lib/utils';

type ConversationParticipant = {
  id: string; 
  userId: string; 
  name: string;
  avatarSeed: string;
};

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


export default function ParentMessagesPage() {
  const { addDoc } = useMockData();
  const [mockUserId, setMockUserId] = useState<string | null>(null);
  const [isClient, setIsClient] = useState(false);

  const [selectedConversation, setSelectedConversation] = useState<ConversationParticipant | null>(null);
  const [currentMessage, setCurrentMessage] = useState('');

  useEffect(() => {
    const storedUserId = sessionStorage.getItem('mockUserId');
    setMockUserId(storedUserId);
    setIsClient(true);
  }, []);

  const { data: parents } = useMockCollection('parents', mockUserId ? [{ field: 'userId', op: '==', value: mockUserId }] : undefined);
  const parent = useMemo(() => parents?.[0], [parents]);
  const parentUserId = parent?.userId;
  
  const { data: students } = useMockCollection('students', parent ? [{ field: 'parentId', op: '==', value: parent.id }] : undefined);
  const firstStudent = useMemo(() => students?.[0], [students]);
  
  // FIXED: Logic to find the route based on studentIds array inside the route object
  const { data: allRoutes } = useMockCollection('routes');
  const route = useMemo(() => {
    if (!firstStudent || !allRoutes) return null;
    return allRoutes.find(r => r.studentIds.includes(firstStudent.id));
  }, [firstStudent, allRoutes]);

  const { data: driverDoc } = useMockDoc('drivers', route?.driverId);
  
  // Find monitor user
  const { data: allUsers } = useMockCollection('users');
  const monitorDoc = useMemo(() => {
      if (!route?.monitorId || !allUsers) return null;
      return allUsers.find(u => u.id === route.monitorId);
  }, [route?.monitorId, allUsers]);
  
  const { data: messages, isLoading: areMessagesLoading } = useMockCollection('messages');
  const { data: predefinedMessages } = useMockCollection('predefined_messages');

  const gestores = useMemo(() => {
    return (allUsers || [])
        .filter(u => u.profile === 'gestor')
        .map(u => ({ id: u.id, userId: u.id, name: u.name, avatarSeed: `user${u.id}` }));
  }, [allUsers]);

  const driver = useMemo(() => {
    if (!driverDoc) return [];
    return [{ id: driverDoc.id, userId: driverDoc.userId, name: driverDoc.name, avatarSeed: `driver${driverDoc.id}` }];
  }, [driverDoc]);

  const monitor = useMemo(() => {
    if (!monitorDoc) return [];
    return [{ id: monitorDoc.id, userId: monitorDoc.id, name: monitorDoc.name, avatarSeed: `user${monitorDoc.id}` }];
  }, [monitorDoc]);

  const chatMessages = useMemo(() => {
    if (!selectedConversation || !parentUserId || !messages) return [];
    
    return messages
      .filter(m => (m.senderId === parentUserId && m.recipientId === selectedConversation.userId) || (m.senderId === selectedConversation.userId && m.recipientId === parentUserId))
      .sort((a, b) => new Date(a.timestamp).valueOf() - new Date(b.timestamp).valueOf());
  }, [messages, parentUserId, selectedConversation]);
  
  const parentPredefinedMessages = useMemo(() => {
      return predefinedMessages?.filter(pm => pm.for === 'parent' || pm.for === 'all') || [];
  }, [predefinedMessages]);

  const handleSendMessage = (text: string) => {
    if (!text.trim() || !parentUserId || !selectedConversation) return;
    
    addDoc('messages', {
        senderId: parentUserId,
        recipientId: selectedConversation.userId,
        text: text,
        timestamp: new Date().toISOString()
    });

    setCurrentMessage('');
  };
  
  const handleSelectConversation = (participant: ConversationParticipant) => {
    setSelectedConversation(participant);
  };
  
  const isMyMessage = (senderId: string) => senderId === parentUserId;

  if (areMessagesLoading || !isClient) {
      return (
          <div className="flex items-center justify-center h-screen">
              <Loader2 className="animate-spin h-8 w-8 text-primary" /> <span className="ml-2">Carregando dados...</span>
          </div>
      );
  }

  return (
    <div className="flex flex-col h-screen bg-background text-foreground p-4">
      <div className="max-w-4xl mx-auto w-full flex flex-col flex-1">
        <div className="flex items-center gap-4 mb-6 shrink-0">
            <Button asChild variant="outline" size="icon">
                <Link href="/parent/tracking"><ArrowLeft /></Link>
            </Button>
            <h1 className="text-2xl font-bold tracking-tight">Central de Mensagens</h1>
        </div>
        <Card className="flex-1 flex overflow-hidden">
          <div className={cn(
              "w-full flex-col border-r md:w-[300px] md:flex-shrink-0",
              selectedConversation ? "hidden md:flex" : "flex"
            )}>
             <Tabs defaultValue="gestor" className="flex flex-col flex-1 min-h-0">
                 <CardHeader>
                    <CardTitle>Conversas</CardTitle>
                 </CardHeader>
                 <div className="px-4">
                    <TabsList className="grid w-full grid-cols-3">
                        <TabsTrigger value="gestor" className="text-xs sm:text-sm"><Building className="mr-1 sm:mr-2 h-3 w-3 sm:h-4 sm:w-4"/>Gestor</TabsTrigger>
                        <TabsTrigger value="motorista" className="text-xs sm:text-sm"><Car className="mr-1 sm:mr-2 h-3 w-3 sm:h-4 sm:w-4"/>Motorista</TabsTrigger>
                        <TabsTrigger value="monitor" className="text-xs sm:text-sm"><ClipboardCheck className="mr-1 sm:mr-2 h-3 w-3 sm:h-4 sm:w-4"/>Monitor</TabsTrigger>
                    </TabsList>
                </div>
                <ScrollArea className="flex-1 mt-2">
                     <TabsContent value="gestor" className="m-0">
                        <div className="p-2 space-y-1">
                            {gestores.map(g => (
                                <ConversationListItem
                                    key={g.id}
                                    participant={g}
                                    isSelected={selectedConversation?.id === g.id}
                                    onSelect={handleSelectConversation}
                                />
                            ))}
                        </div>
                    </TabsContent>
                    <TabsContent value="motorista" className="m-0">
                        <div className="p-2 space-y-1">
                            {driver.map(d => (
                                <ConversationListItem
                                    key={d.id}
                                    participant={d}
                                    isSelected={selectedConversation?.id === d.id}
                                    onSelect={handleSelectConversation}
                                />
                            ))}
                            {driver.length === 0 && (
                                <div className="p-8 text-center space-y-2 opacity-40">
                                    <Car className="h-8 w-8 mx-auto" />
                                    <p className="text-xs font-bold uppercase tracking-widest">Nenhuma van atribuída</p>
                                </div>
                            )}
                        </div>
                    </TabsContent>
                    <TabsContent value="monitor" className="m-0">
                        <div className="p-2 space-y-1">
                            {monitor.map(m => (
                               <ConversationListItem
                                    key={m.id}
                                    participant={m}
                                    isSelected={selectedConversation?.id === m.id}
                                    onSelect={handleSelectConversation}
                                />
                            ))}
                             {monitor.length === 0 && (
                                <div className="p-8 text-center space-y-2 opacity-40">
                                    <ClipboardCheck className="h-8 w-8 mx-auto" />
                                    <p className="text-xs font-bold uppercase tracking-widest">Sem monitor na rota</p>
                                </div>
                             )}
                        </div>
                    </TabsContent>
                </ScrollArea>
            </Tabs>
          </div>

          <div className={cn(
              "flex-1 flex-col",
              selectedConversation ? "flex" : "hidden md:flex"
            )}>
            {selectedConversation ? (
              <>
                <CardHeader className="border-b">
                  <CardTitle className="flex items-center gap-3">
                    <Button variant="ghost" size="icon" className="md:hidden -ml-2" onClick={() => setSelectedConversation(null)}>
                        <ArrowLeft />
                    </Button>
                    <Avatar className="h-8 w-8">
                        <AvatarImage src={`https://picsum.photos/seed/${selectedConversation.avatarSeed}/100/100`} alt={selectedConversation.name} />
                        <AvatarFallback>{selectedConversation.name.charAt(0)}</AvatarFallback>
                    </Avatar>
                    <span className="truncate">{selectedConversation.name}</span>
                  </CardTitle>
                </CardHeader>
                <ScrollArea className="flex-1 p-4 bg-secondary/20">
                  <div className="space-y-4">
                    {chatMessages.map(msg => (
                      <div
                        key={msg.id}
                        className={`flex items-end gap-2 ${isMyMessage(msg.senderId) ? 'justify-end' : ''}`}
                      >
                        <div className={`max-w-[80%] p-3 rounded-lg ${isMyMessage(msg.senderId) ? 'bg-primary text-primary-foreground' : 'bg-background border'}`}>
                          <p className="text-sm leading-relaxed">{msg.text}</p>
                           <p className={cn("text-[10px] text-right mt-1 opacity-70 font-bold uppercase", isMyMessage(msg.senderId) ? "text-primary-foreground" : "text-muted-foreground")}>
                              {isClient && msg.timestamp ? new Date(msg.timestamp).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }) : '...'}
                          </p>
                        </div>
                      </div>
                    ))}
                  </div>
                </ScrollArea>
                 <div className="p-2 border-t flex flex-wrap gap-2 bg-background">
                    {parentPredefinedMessages.map(pm => (
                        <Button key={pm.id} variant="outline" size="sm" className="text-[10px] h-7" onClick={() => handleSendMessage(pm.text)}>
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
                      disabled={!selectedConversation}
                      className="h-12 pr-12"
                    />
                    <Button
                      size="icon"
                      className="absolute right-1 top-1/2 -translate-y-1/2 h-10 w-10"
                      onClick={() => handleSendMessage(currentMessage)}
                      disabled={!currentMessage.trim() || !selectedConversation}
                    >
                      <Send className="h-5 w-5" />
                    </Button>
                  </div>
                </CardFooter>
              </>
            ) : (
              <div className="flex flex-col items-center justify-center h-full text-muted-foreground p-8 text-center space-y-4">
                <div className="p-6 bg-secondary/50 rounded-full">
                    <MessageCircle className="h-12 w-12 text-primary opacity-20" />
                </div>
                <div>
                    <p className="font-bold uppercase tracking-widest text-xs">Sua Central de Mensagens</p>
                    <p className="text-sm">Selecione uma conversa ao lado para falar com o Gestor ou com a equipe da van.</p>
                </div>
              </div>
            )}
          </div>
        </Card>
      </div>
    </div>
  );
}

function MessageCircle({ className }: { className?: string }) {
    return (
        <svg xmlns="http://www.w3.org/2000/svg" width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" className={className}><path d="M7.9 20A9 9 0 1 0 4 16.1L2 22Z"/></svg>
    );
}
