import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";

export default function SchoolsPage() {
  return (
    <div>
      <h1 className="text-3xl font-bold tracking-tight mb-6">Gerenciamento de Escolas</h1>
      <Card>
        <CardHeader>
          <CardTitle>Escolas Atendidas</CardTitle>
        </CardHeader>
        <CardContent>
          <p className="text-muted-foreground">Em breve: aqui você poderá cadastrar e gerenciar as escolas parceiras.</p>
        </CardContent>
      </Card>
    </div>
  );
}
