import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { MessageSquare } from "lucide-react";

export default function MessagesPage() {
  return (
    <div>
      <h1 className="text-3xl font-bold tracking-tight mb-6">Central de Mensagens</h1>
      <Card className="flex flex-col items-center justify-center text-center p-12 min-h-[400px]">
        <MessageSquare className="h-16 w-16 text-muted-foreground mb-4" />
        <CardHeader>
          <CardTitle>Comunicação Direta</CardTitle>
        </CardHeader>
        <CardContent>
          <p className="text-muted-foreground">Em breve: uma interface de chat para se comunicar diretamente com os pais e responsáveis.</p>
        </CardContent>
      </Card>
    </div>
  );
}
