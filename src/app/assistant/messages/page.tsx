"use client";
import { useState, useMemo, useEffect } from 'react';
import Link from 'next/link';
import { useDataCollection, useData } from '@/hooks/use-data';
import { Card, CardContent, CardHeader, CardTitle, CardFooter } from '@/components/ui/card';
import { Input } from '@/components/ui/input';
import { Button } from '@/components/ui/button';
import { Send, User, Loader2, ArrowLeft, Building, Users, Car, ClipboardCheck } from 'lucide-react';
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar';
import { ScrollArea } from '@/components/ui/scroll-area';
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { cn } from '@/lib/utils';

type ConversationParticipant = {
  id: string; 
  userId: string; 
  name: string;
  avatarSeed: string;
};

export default function AssistantMessagesPage() {
  const { addDoc } = useData();
  const [mockUserId, setMockUserId] = useState<string | null>(null);
  const [isClient, setIsClient] = useState(false);

  useEffect(() => {
    const storedUserId = sessionStorage.getItem('mockUserId');
    setMockUserId(storedUserId);
    setIsClient(true);
  }, []);

  const { data: allParents, isLoading: areParentsLoading } = useDataCollection('parents');
  const { data: allDrivers, isLoading: areDriversLoading } = useDataCollection('drivers');
  const { data: allUsers, isLoading: areUsersLoading } = useDataCollection('users');
  const { data: routes, isLoading: areRoutesLoading } = useDataCollection('routes');
  const { data: allStudents, isLoading: areStudentsLoading } = useDataCollection('students');
  const { data: messages, isLoading: areMessagesLoading } = useDataCollection('messages');
  const { data: predefinedMessages } = useDataCollection('predefined_messages');

  const [selectedConversation, setSelectedConversation] = useState<ConversationParticipant | null>(null);
  const [currentMessage, setCurrentMessage] = useState('');
  
  const activeRoute = useMemo(() => {
    if (!routes || !mockUserId) return null;
    return routes.find(r => r.monitorId === mockUserId);
  }, [routes, mockUserId]);

  const parentIdsOnRoute = useMemo(() => {
    if (!activeRoute || !allStudents) return [];
    const studentIdsOnRoute = new Set(activeRoute.studentIds);
    const parentIds = allStudents
      .filter(s => studentIdsOnRoute.has(s.id))
      .map(s => s.parentId);
    return [...new Set(parentIds)];
  }, [activeRoute, allStudents]);

  // Memoize conversation participants
  const parents = useMemo(() => {
    if (!allParents || !parentIdsOnRoute) return [];
    const parentIdSet = new Set(parentIdsOnRoute);
    return allParents
        .filter(p => parentIdSet.has(p.id))
        .map(p => ({ id: p.id, userId: p.userId, name: p.name, avatarSeed: `parent${p.id}`}));
  }, [allParents, parentIdsOnRoute]);

  const drivers = useMemo(() => 
    (allDrivers || []).map(d => ({ id: d.id, userId: d.userId, name: d.name, avatarSeed: `driver${d.id}`}))
  , [allDrivers]);
  
  const monitors = useMemo(() => 
    (allUsers || []).filter(u => u.profile === 'monitor' && u.id !== mockUserId).map(m => ({ id: m.id, userId: m.id, name: m.name, avatarSeed: `user${m.id}`}))
  , [allUsers, mockUserId]);


  const chatMessages = useMemo(() => {
    if (!selectedConversation || !messages || !mockUserId) return [];
    return messages
      .filter(m => 
        (m.senderId === selectedConversation.userId && m.recipientId === mockUserId) || 
        (m.senderId === mockUserId && m.recipientId === selectedConversation.userId)
      )
      .sort((a, b) => new Date(a.timestamp).valueOf() - new Date(b.timestamp).valueOf());
  }, [messages, selectedConversation, mockUserId]);
  
  const monitorPredefinedMessages = useMemo(() => {
      return predefinedMessages?.filter(pm => pm.for === 'monitor' || pm.for === 'all') || [];
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
  
  const handleSelectConversation = (participant: ConversationParticipant) => {
    setSelectedConversation(participant);
  };
  
  const isLoading = areParentsLoading || areDriversLoading || areUsersLoading || areMessagesLoading || areStudentsLoading || areRoutesLoading;
  
  const isMyMessage = (senderId: string) => senderId === mockUserId;

  if (isLoading) {
    return (
        <div className="flex items-center justify-center h-screen">
            <Loader2 className="animate-spin h-8 w-8 text-primary" /> <span className="ml-2 text-muted-foreground">Carregando mensagens...</span>
        </div>
    );
  }

  return (
    <div className="flex flex-col h-screen bg-background text-foreground p-4">
      <div className="max-w-4xl mx-auto w-full flex flex-col flex-1">
        <div className="flex items-center gap-4 mb-6 shrink-0">
            <Button asChild variant="outline" size="icon">
                <Link href="/assistant/route-plan"><ArrowLeft /></Link>
            </Button>
            <h1 className="text-2xl font-bold tracking-tight">Central de Mensagens</h1>
        </div>
        <Card className="flex-1 flex overflow-hidden">
          <div className={cn(
              "w-full flex-col border-r md:w-[300px] md:flex-shrink-0",
              selectedConversation ? "hidden md:flex" : "flex"
            )}>
            <Tabs defaultValue="parents" className="flex flex-col flex-1 min-h-0">
                 <CardHeader>
                    <CardTitle>Conversas</CardTitle>
                 </CardHeader>
                 <div className="px-4">
                    <TabsList className="grid w-full grid-cols-3">
                        <TabsTrigger value="parents"><Users className="mr-2 h-4 w-4"/>Pais</TabsTrigger>
                        <TabsTrigger value="drivers"><Car className="mr-2 h-4 w-4"/>Motoristas</TabsTrigger>
                        <TabsTrigger value="monitors"><ClipboardCheck className="mr-2 h-4 w-4"/>Monitores</TabsTrigger>
                    </TabsList>
                </div>
                <ScrollArea className="flex-1 mt-2">
                     <TabsContent value="parents" className="m-0">
                        <div className="p-2 space-y-1">
                            {parents.map(parent => (
                                <ConversationListItem
                                    key={parent.id}
                                    participant={parent}
                                    isSelected={selectedConversation?.id === parent.id}
                                    onSelect={handleSelectConversation}
                                />
                            ))}
                        </div>
                    </TabsContent>
                    <TabsContent value="drivers" className="m-0">
                        <div className="p-2 space-y-1">
                            {drivers.map(driver => (
                                <ConversationListItem
                                    key={driver.id}
                                    participant={driver}
                                    isSelected={selectedConversation?.id === driver.id}
                                    onSelect={handleSelectConversation}
                                />
                            ))}
                        </div>
                    </TabsContent>
                    <TabsContent value="monitors" className="m-0">
                        <div className="p-2 space-y-1">
                            {monitors.map(monitor => (
                               <ConversationListItem
                                    key={monitor.id}
                                    participant={monitor}
                                    isSelected={selectedConversation?.id === monitor.id}
                                    onSelect={handleSelectConversation}
                                />
                            ))}
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
                    <User />
                    {selectedConversation.name}
                  </CardTitle>
                </CardHeader>
                <ScrollArea className="flex-1 p-4 bg-secondary/20">
                  <div className="space-y-4">
                    {chatMessages.map(msg => (
                      <div
                        key={msg.id}
                        className={`flex items-end gap-2 ${isMyMessage(msg.senderId) ? 'justify-end' : ''}`}
                      >
                        <div className={`max-w-xs md:max-w-md p-3 rounded-lg ${isMyMessage(msg.senderId) ? 'bg-primary text-primary-foreground' : 'bg-background border'}`}>
                          <p className="text-sm">{msg.text}</p>
                           <p className="text-xs text-right mt-1 opacity-70">
                              {isClient && msg.timestamp ? new Date(msg.timestamp).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }) : '...'}
                          </p>
                        </div>
                      </div>
                    ))}
                  </div>
                </ScrollArea>
                 <div className="p-2 border-t flex flex-wrap gap-2 bg-background">
                    {monitorPredefinedMessages.map(pm => (
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
                      disabled={!selectedConversation}
                    />
                    <Button
                      size="icon"
                      className="absolute right-1 top-1/2 -translate-y-1/2 h-8 w-8"
                      onClick={() => handleSendMessage(currentMessage)}
                      disabled={!currentMessage.trim() || !selectedConversation}
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
