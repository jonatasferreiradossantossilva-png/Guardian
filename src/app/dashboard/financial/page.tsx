import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { DollarSign } from "lucide-react";

export default function FinancialPage() {
  return (
    <div>
      <h1 className="text-3xl font-bold tracking-tight mb-6">Gestão Financeira</h1>
      <Card className="flex flex-col items-center justify-center text-center p-12 min-h-[400px]">
        <DollarSign className="h-16 w-16 text-muted-foreground mb-4" />
        <CardHeader>
          <CardTitle>Controle Financeiro</CardTitle>
        </CardHeader>
        <CardContent>
          <p className="text-muted-foreground">Em breve: aqui você poderá gerenciar faturamentos, cobranças e pagamentos.</p>
        </CardContent>
      </Card>
    </div>
  );
}
