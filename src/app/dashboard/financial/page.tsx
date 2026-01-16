import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { DollarSign, Settings, FilePlus } from "lucide-react";
import { Button } from "@/components/ui/button";

export default function FinancialPage() {
  return (
    <div>
      <div className="flex items-center justify-between mb-6">
        <h1 className="text-3xl font-bold tracking-tight">Gestão Financeira</h1>
        <div className="flex gap-2">
            <Button variant="outline">
                <Settings className="mr-2" />
                Configurar Faturamento
            </Button>
             <Button>
                <FilePlus className="mr-2" />
                Gerar Faturas do Mês
            </Button>
        </div>
      </div>
      <Card className="flex flex-col items-center justify-center text-center p-12 min-h-[400px]">
        <DollarSign className="h-16 w-16 text-muted-foreground mb-4" />
        <CardHeader>
          <CardTitle>Controle Financeiro Centralizado</CardTitle>
        </CardHeader>
        <CardContent>
          <p className="max-w-md mx-auto text-muted-foreground">Em breve: aqui você poderá gerenciar faturamentos mensais, cobranças avulsas, controlar pagamentos e enviar lembretes aos pais.</p>
        </CardContent>
      </Card>
    </div>
  );
}
