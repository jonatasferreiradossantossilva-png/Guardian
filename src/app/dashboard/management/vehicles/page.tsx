import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";

export default function VehiclesPage() {
  return (
    <div>
      <h1 className="text-3xl font-bold tracking-tight mb-6">Gerenciamento de Veículos</h1>
      <Card>
        <CardHeader>
          <CardTitle>Frota de Veículos</CardTitle>
        </CardHeader>
        <CardContent>
          <p className="text-muted-foreground">Em breve: aqui você poderá gerenciar os veículos da sua frota, incluindo manutenção e documentação.</p>
        </CardContent>
      </Card>
    </div>
  );
}
