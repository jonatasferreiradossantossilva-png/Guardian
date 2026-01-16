import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { MessageSquare } from "lucide-react";

export default function MessagesPage() {
  return (
    <div>
      <h1 className="text-3xl font-bold tracking-tight mb-6">Central de Mensagens</h1>
      <Card className="flex flex-col items-center justify-center text-center p-12 min-h-[400px]">
        <MessageSquare className="h-16 w-16 text-muted-foreground mb-4" />
        <CardHeader>
          <CardTitle>Comunicação Direta com os Pais</CardTitle>
        </CardHeader>
        <CardContent>
          <p className="max-w-md mx-auto text-muted-foreground">Em breve: uma interface de chat completa, com a lista de pais à esquerda e a conversa com o pai selecionado à direita, tudo em tempo real.</p>
        </CardContent>
      </Card>
    </div>
  );
}
