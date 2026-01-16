import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";

export default function DriversPage() {
  return (
    <div>
      <h1 className="text-3xl font-bold tracking-tight mb-6">Gerenciamento de Motoristas</h1>
      <Card>
        <CardHeader>
          <CardTitle>Lista de Motoristas</CardTitle>
        </CardHeader>
        <CardContent>
          <p className="text-muted-foreground">Em breve: aqui você poderá adicionar, editar e visualizar os motoristas cadastrados.</p>
        </CardContent>
      </Card>
    </div>
  );
}
