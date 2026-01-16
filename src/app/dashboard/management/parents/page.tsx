import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";

export default function ParentsPage() {
  return (
    <div>
      <h1 className="text-3xl font-bold tracking-tight mb-6">Gerenciamento de Pais e Alunos</h1>
      <Card>
        <CardHeader>
          <CardTitle>Cadastros</CardTitle>
        </CardHeader>
        <CardContent>
          <p className="text-muted-foreground">Em breve: aqui você poderá gerenciar as informações dos pais, responsáveis e alunos.</p>
        </CardContent>
      </Card>
    </div>
  );
}
