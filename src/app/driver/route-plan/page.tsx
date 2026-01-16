import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { List, CheckCircle, XCircle } from "lucide-react";
import { Button } from "@/components/ui/button";

const students = [
  { id: 1, name: "Ana Clara", status: "Pendente" },
  { id: 2, name: "Bruno Gomes", status: "Embarcado" },
  { id: 3, name: "Carlos Eduardo", status: "Pendente" },
  { id: 4, name: "Daniela Faria", status: "Ausente" },
]

export default function RoutePlanPage() {
  return (
    <div className="min-h-screen bg-background text-foreground p-4">
      <div className="max-w-4xl mx-auto">
        <div className="flex justify-between items-center mb-6">
            <h1 className="text-3xl font-bold tracking-tight">Plano de Rota</h1>
            <Button variant="outline">Voltar ao Dashboard</Button>
        </div>
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
                <List />
                Controle de Embarque/Desembarque
            </CardTitle>
          </CardHeader>
          <CardContent>
            <p className="text-muted-foreground mb-4">Marque o status de cada aluno na sua rota.</p>
            <div className="space-y-4">
                {students.map(student => (
                    <div key={student.id} className="flex items-center justify-between p-4 rounded-lg bg-secondary">
                        <span className="font-medium">{student.name}</span>
                        <div className="flex items-center gap-2">
                           {student.status === "Pendente" &&
                                <>
                                    <Button size="sm" className="bg-green-600 hover:bg-green-700"><CheckCircle className="mr-2 h-4 w-4" />Embarcou</Button>
                                    <Button size="sm" variant="destructive"><XCircle className="mr-2 h-4 w-4" />Ausente</Button>
                                </>
                           }
                           {student.status === "Embarcado" && <span className="text-sm font-semibold text-green-400">Embarcado</span>}
                           {student.status === "Ausente" && <span className="text-sm font-semibold text-red-400">Ausente</span>}
                        </div>
                    </div>
                ))}
            </div>
          </CardContent>
        </Card>
      </div>
    </div>
  );
}
