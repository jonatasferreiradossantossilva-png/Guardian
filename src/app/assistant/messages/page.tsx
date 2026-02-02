"use client";
import { useState, useMemo, useEffect } from 'react';
import Link from 'next/link';
import { useMockCollection, useMockData, useMockDoc } from '@/hooks/use-mock-data';
import { Card, CardContent, CardHeader, CardTitle, CardFooter } from '@/components/ui/card';
import { Input } from '@/components/ui/input';
import { Button } from '@/components/ui/button';
import { Send, User, Loader2, ArrowLeft, Building, Users } from 'lucide-react';
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar';
import { ScrollArea } from '@/components/ui/scroll-area';
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";

type ConversationParticipant = {
  id: string; 
  userId: string; 
  name: string;
  avatarSeed: string;
};

export default function AssistantMessagesPage() {
  const { addDoc } = useMockData();
  const [mockUserId, setMockUserId] = useState<string | null>(null);
  const [isClient, setIsClient] = useState(false);

  useEffect(() => {
    const storedUserId = sessionStorage.getItem('mockUserId');
    setMockUserId(storedUserId);
    setIsClient(true);
  }, []);

  const { data: assistantUser, isLoading: areUsersLoading } = useMockDoc('users', mockUserId);
  const assistantUserId = assistantUser?.id;

  const activeRouteFilter = useMemo(() => (mockUserId ? [
      { field: 'assistantId', op: '==', value: mockUserId },
  ] : undefined), [mockUserId]);
  const { data: routes, isLoading: areRoutesLoading } = useMockCollection('routes', activeRouteFilter);
  const activeRoute = useMemo(() => routes?.[0], [routes]);
  
  const { data: allUsers } = useMockCollection('users');
  const { data: allParents, isLoading: areParentsLoading } = useMockCollection('parents');
  const { data: messages, isLoading: areMessagesLoading } = useMockCollection('messages');
  const { data: predefinedMessages } = useMockCollection('predefined_messages');
  const studentsOnRouteFilter = useMemo(() => (activeRoute ? [
      { field: 'id', op: 'in', value: activeRoute.studentIds }
  ] : undefined), [activeRoute]);
  const { data: studentsOnRoute, isLoading: areStudentsLoading } = useMockCollection('students', studentsOnRouteFilter);

  const [selectedConversation, setSelectedConversation] = useState<ConversationParticipant | null>(null);
  const [currentMessage, setCurrentMessage] = useState('');
  
  const relevantParents = useMemo(() => {
    if (!studentsOnRoute || !allParents) return [];
    const parentIdsOnRoute = new Set(studentsOnRoute.map(s => s.parentId));
    const parents = allParents.filter(p => parentIdsOnRoute.has(p.id));
    return parents.map(p => ({ id: p.id, userId: p.userId, name: p.name, avatarSeed: `parent${p.id}`}));
  }, [studentsOnRoute, allParents]);

  const manager = useMemo(() => {
      const adminUser = allUsers?.find(u => u.profile === 'gestor');
      if (!adminUser) return null;
      return { id: adminUser.id, userId: adminUser.id, name: "Gestão/Admin", avatarSeed: 'admin' };
  }, [allUsers]);

  const chatMessages = useMemo(() => {
    if (!selectedConversation || !messages || !assistantUserId) return [];
    return messages
      .filter(m => 
        (m.senderId === selectedConversation.userId && m.recipientId === assistantUserId) || 
        (m.senderId === assistantUserId && m.recipientId === selectedConversation.userId)
      )
      .sort((a, b) => new Date(a.timestamp).valueOf() - new Date(b.timestamp).valueOf());
  }, [messages, selectedConversation, assistantUserId]);
  
  const assistantPredefinedMessages = useMemo(() => {
      return predefinedMessages?.filter(pm => pm.for === 'auxiliar' || pm.for === 'all') || [];
  }, [predefinedMessages]);

  const handleSendMessage = (text: string) => {
    if (!text.trim() || !selectedConversation || !assistantUserId) return;
    
    addDoc('messages', {
        senderId: assistantUserId,
        recipientId: selectedConversation.userId,
        text: text,
        timestamp: new Date().toISOString()
    });

    setCurrentMessage('');
  };
  
  const handleSelectConversation = (participant: ConversationParticipant) => {
    setSelectedConversation(participant);
  };
  
  const isLoading = areRoutesLoading || areStudentsLoading || areParentsLoading || areMessagesLoading || areUsersLoading;

  useEffect(() => {
    if (!selectedConversation && manager) {
        setSelectedConversation(manager)
    }
  }, [manager, selectedConversation]);

  if (isLoading) {
    return (
        <div className="flex items-center justify-center h-screen">
            <Loader2 className="animate-spin h-8 w-8 text-primary" /> <span className="ml-2 text-muted-foreground">Carregando mensagens...</span>
        </div>
    );
  }

  if (!assistantUser) {
      return (
          <div className="flex flex-col items-center justify-center h-screen text-center p-4">
              <User className="h-12 w-12 text-muted-foreground mb-4"/>
              <h2 className="text-xl font-semibold">Perfil de Auxiliar não Encontrado</h2>
              <p className="text-muted-foreground max-w-md">Não foi possível carregar os dados do seu usuário.</p>
              <Button asChild variant="outline" className="mt-4">
                <Link href="/assistant/route-plan">Voltar para o Plano de Rota</Link>
              </Button>
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
        </div>
        <Card className="flex-1 grid grid-cols-[300px_1fr] overflow-hidden">
          <div className="flex flex-col border-r">
            <Tabs defaultValue="parents" className="flex flex-col flex-1 min-h-0">
                 <CardHeader>
                    <CardTitle>Conversas</CardTitle>
                 </CardHeader>
                 <div className="px-4">
                    <TabsList className="grid w-full grid-cols-2">
                        <TabsTrigger value="parents"><Users className="mr-2 h-4 w-4"/>Pais</TabsTrigger>
                        <TabsTrigger value="manager"><Building className="mr-2 h-4 w-4"/>Gestor</TabsTrigger>
                    </TabsList>
                </div>
                <ScrollArea className="flex-1 mt-2">
                     <TabsContent value="parents" className="m-0">
                        <div className="p-2 space-y-1">
                            {relevantParents.map(parent => (
                                <ConversationListItem
                                    key={parent.id}
                                    participant={parent}
                                    isSelected={selectedConversation?.id === parent.id}
                                    onSelect={handleSelectConversation}
                                />
                            ))}
                             {relevantParents.length === 0 && <p className="p-4 text-sm text-muted-foreground text-center">Nenhum pai encontrado na sua rota ativa.</p>}
                        </div>
                    </TabsContent>
                    <TabsContent value="manager" className="m-0">
                        <div className="p-2 space-y-1">
                            {manager && (
                                <ConversationListItem
                                    participant={manager}
                                    isSelected={selectedConversation?.id === manager.id}
                                    onSelect={handleSelectConversation}
                                />
                            )}
                        </div>
                    </TabsContent>
                </ScrollArea>
            </Tabs>
          </div>

          <div className="flex flex-col">
            {selectedConversation ? (
              <>
                <CardHeader className="border-b">
                  <CardTitle className="flex items-center gap-3">
                    <User />
                    {selectedConversation.name}
                  </CardTitle>
                </CardHeader>
                <ScrollArea className="flex-1 p-4 bg-secondary/20">
                  <div className="space-y-4">
                    {chatMessages.map(msg => (
                      <div
                        key={msg.id}
                        className={`flex items-end gap-2 ${msg.senderId === assistantUserId ? 'justify-end' : ''}`}
                      >
                        <div className={`max-w-xs md:max-w-md p-3 rounded-lg ${msg.senderId === assistantUserId ? 'bg-primary text-primary-foreground' : 'bg-background border'}`}>
                          <p className="text-sm">{msg.text}</p>
                           <p className="text-xs text-right mt-1 opacity-70">
                              {isClient ? new Date(msg.timestamp).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }) : '...'}
                          </p>
                        </div>
                      </div>
                    ))}
                  </div>
                </ScrollArea>
                 <div className="p-2 border-t flex flex-wrap gap-2 bg-background">
                    {assistantPredefinedMessages.map(pm => (
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
