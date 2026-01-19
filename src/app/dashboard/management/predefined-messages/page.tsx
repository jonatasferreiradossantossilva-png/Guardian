// This is a new file
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { MessageCircle } from "lucide-react";

export default function PredefinedMessagesPage() {
  return (
    <div>
      <h1 className="text-3xl font-bold tracking-tight mb-6">Gerenciar Mensagens Rápidas</h1>
      <Card className="flex flex-col items-center justify-center text-center p-12 min-h-[400px]">
        <MessageCircle className="h-16 w-16 text-muted-foreground mb-4" />
        <CardHeader>
          <CardTitle>Agilize a Comunicação</CardTitle>
        </CardHeader>
        <CardContent>
          <p className="max-w-md mx-auto text-muted-foreground">Em breve: aqui você poderá criar, editar e remover as mensagens predefinidas que pais e motoristas podem usar para se comunicar rapidamente.</p>
        </CardContent>
      </Card>
    </div>
  );
}
