import { Card, CardContent, CardHeader, CardTitle, CardFooter } from "@/components/ui/card";
import { MapPin, Bus, User, MessageCircle } from "lucide-react";
import { Button } from "@/components/ui/button";

export default function ParentTrackingPage() {
  return (
    <div className="min-h-screen bg-background text-foreground p-4">
      <div className="max-w-4xl mx-auto">
        <div className="flex justify-between items-center mb-6">
             <h1 className="text-3xl font-bold tracking-tight">Acompanhamento</h1>
            <Button variant="outline">Voltar ao Login</Button>
        </div>
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <User />
              Status de "Nome do Aluno"
            </CardTitle>
          </CardHeader>
          <CardContent className="space-y-6">
            <div>
              <h3 className="font-semibold flex items-center gap-2 mb-2"><Bus /> Status da Van</h3>
              <p className="p-4 bg-secondary rounded-md text-green-400 font-medium">A caminho da escola. Próxima parada em 5 minutos.</p>
            </div>
            <div>
              <h3 className="font-semibold flex items-center gap-2 mb-2"><MapPin /> Localização em Tempo Real</h3>
              <div className="aspect-video bg-secondary rounded-lg flex items-center justify-center">
                <p className="text-muted-foreground">(Mapa em tempo real indisponível na pré-visualização)</p>
              </div>
            </div>
          </CardContent>
          <CardFooter className="flex-col sm:flex-row gap-2">
              <Button className="w-full sm:w-auto"><MessageCircle className="mr-2 h-4 w-4" /> Enviar Mensagem</Button>
              <Button variant="destructive" className="w-full sm:w-auto">Comunicar Ausência</Button>
          </CardFooter>
        </Card>
      </div>
    </div>
  );
}
