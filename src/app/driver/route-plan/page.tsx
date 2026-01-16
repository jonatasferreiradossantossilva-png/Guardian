"use client";

import { useState, useMemo } from "react";
import {
  useUser,
  useFirestore,
  useCollection,
  useMemoFirebase,
  updateDocumentNonBlocking,
} from "@/firebase";
import {
  collection,
  query,
  where,
  limit,
  doc,
  documentId,
} from "firebase/firestore";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import {
  List,
  CheckCircle,
  XCircle,
  Bus,
  User,
  Loader2,
  AlertTriangle,
} from "lucide-react";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { cn } from "@/lib/utils";
import Link from "next/link";

type Shift = "Manhã" | "Tarde";
type StudentStatus = "aguardando" | "a_bordo" | "desembarcado" | "ausente";
interface Student {
  id: string;
  name: string;
  status: StudentStatus;
  shift: Shift;
}

const statusText: Record<StudentStatus, string> = {
  aguardando: "Aguardando",
  a_bordo: "A Bordo",
  desembarcado: "Desembarcado",
  ausente: "Ausente",
};

const statusBadgeVariant: Record<
  StudentStatus,
  "default" | "secondary" | "outline" | "destructive"
> = {
  a_bordo: "default",
  aguardando: "secondary",
  desembarcado: "outline",
  ausente: "destructive",
};

export default function RoutePlanPage() {
  const { user, isUserLoading } = useUser();
  const firestore = useFirestore();
  const [shift, setShift] = useState<Shift>("Manhã");

  const routeQuery = useMemoFirebase(
    () =>
      user && firestore
        ? query(
            collection(firestore, "routes"),
            where("driverId", "==", user.uid),
            where("active", "==", true),
            limit(1)
          )
        : null,
    [user, firestore]
  );
  const { data: routes, isLoading: isRouteLoading } = useCollection(routeQuery);
  const route = useMemo(() => (routes && routes.length > 0 ? routes[0] : null), [routes]);

  const studentsQuery = useMemoFirebase(
    () =>
      route && route.studentIds && route.studentIds.length > 0
        ? query(
            collection(firestore, "students"),
            where(documentId(), "in", route.studentIds)
          )
        : null,
    [route]
  );

  const { data: students, isLoading: areStudentsLoading } = useCollection<Student>(studentsQuery);

  const orderedStudents = useMemo(() => {
    if (!route?.studentIds || !students) return [];
    const studentMap = new Map(students.map((s) => [s.id, s]));
    return route.studentIds
      .map((id) => studentMap.get(id))
      .filter((s): s is Student => !!s);
  }, [route?.studentIds, students]);

  const handleStatusChange = (studentId: string, newStatus: StudentStatus) => {
    if (!firestore) return;
    const studentRef = doc(firestore, "students", studentId);
    updateDocumentNonBlocking(studentRef, { status: newStatus });
  };
  
  const isLoading = isUserLoading || isRouteLoading || areStudentsLoading;

  return (
    <div className="min-h-screen bg-background text-foreground p-4">
      <div className="max-w-4xl mx-auto">
        <div className="flex justify-between items-center mb-6">
          <h1 className="text-3xl font-bold tracking-tight">Plano de Rota</h1>
          <Link href="/" passHref>
             <Button variant="outline">Voltar ao Login</Button>
          </Link>
        </div>
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <List />
              Controle de Embarque/Desembarque
            </CardTitle>
            <p className="text-muted-foreground text-sm pt-2">
              {route ? route.name : "Carregando rota..."}
            </p>
          </CardHeader>
          <CardContent>
            <div className="flex items-center gap-2 mb-6">
                <Button onClick={() => setShift("Manhã")} variant={shift === 'Manhã' ? 'default' : 'outline'}>Manhã</Button>
                <Button onClick={() => setShift("Tarde")} variant={shift === 'Tarde' ? 'default' : 'outline'}>Tarde</Button>
            </div>
            
            {isLoading && (
                 <div className="flex items-center justify-center h-40">
                    <Loader2 className="h-8 w-8 animate-spin text-primary" />
                 </div>
            )}

            {!isLoading && !route && (
                 <div className="flex flex-col items-center justify-center h-40 text-center">
                    <AlertTriangle className="h-8 w-8 text-destructive mb-2" />
                    <p className="font-semibold">Nenhuma rota ativa encontrada.</p>
                    <p className="text-muted-foreground text-sm">Verifique com o administrador se uma rota foi atribuída a você.</p>
                 </div>
            )}

            {!isLoading && route && (
              <div className="space-y-4">
                {orderedStudents
                  .filter((student) => student.shift === shift)
                  .map((student) => (
                    <div
                      key={student.id}
                      className="flex flex-col sm:flex-row items-start sm:items-center justify-between p-4 rounded-lg bg-secondary"
                    >
                      <div className="flex items-center gap-3 mb-3 sm:mb-0">
                        <User className="h-5 w-5 text-muted-foreground" />
                        <span className="font-medium">{student.name}</span>
                      </div>
                      <div className="flex items-center gap-2 w-full sm:w-auto">
                        {student.status === "aguardando" && (
                          <>
                            <Button
                              size="sm"
                              className="bg-green-600 hover:bg-green-700 flex-1"
                              onClick={() => handleStatusChange(student.id, "a_bordo")}
                            >
                              <CheckCircle className="mr-2 h-4 w-4" />
                              Embarcar
                            </Button>
                            <Button
                              size="sm"
                              variant="destructive"
                              className="flex-1"
                              onClick={() => handleStatusChange(student.id, "ausente")}
                            >
                              <XCircle className="mr-2 h-4 w-4" />
                              Ausente
                            </Button>
                          </>
                        )}
                        {student.status === "a_bordo" && (
                          <Button
                            size="sm"
                            className="w-full"
                             onClick={() => handleStatusChange(student.id, "desembarcado")}
                          >
                            <Bus className="mr-2 h-4 w-4" />
                            Desembarcar
                          </Button>
                        )}
                        {(student.status === "desembarcado" ||
                          student.status === "ausente") && (
                          <Badge
                            variant={statusBadgeVariant[student.status]}
                            className="w-full justify-center py-1 text-xs"
                          >
                            {statusText[student.status]}
                          </Badge>
                        )}
                      </div>
                    </div>
                  ))}
                   {orderedStudents.filter((student) => student.shift === shift).length === 0 && (
                     <div className="text-center text-muted-foreground py-10">
                        <p>Nenhum aluno para o turno da {shift.toLowerCase()}.</p>
                    </div>
                   )}
              </div>
            )}
          </CardContent>
        </Card>
      </div>
    </div>
  );
}

    