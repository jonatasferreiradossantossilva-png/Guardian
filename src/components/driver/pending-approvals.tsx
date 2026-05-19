'use client';

import { useMemo } from 'react';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { 
  Check, 
  X, 
  UserPlus, 
  MapPin, 
  Clock, 
  AlertCircle,
  Users,
  Search,
  School,
  ArrowRight,
  Loader2
} from 'lucide-react';
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar';
import { Badge } from '@/components/ui/badge';
import { useDataCollection, useData } from '@/hooks/use-data';
import { Student, Route } from '@/types/mock-data';
import { useToast } from '@/hooks/use-toast';
import { SafeRow } from '@/components/shared/safe-table';

interface PendingApprovalsProps {
  route: Route;
}

export function PendingApprovals({ route }: PendingApprovalsProps) {
  const { updateDoc, deleteDoc } = useData() as any;
  const { toast } = useToast();
  const { data: allStudents, isLoading } = useDataCollection('students') as { data: Student[] | undefined, isLoading: boolean };

  // Filtramos os alunos que se cadastraram especificamente para esta rota mas ainda não foram aprovados
  const pendingStudents = useMemo(() => {
    if (!allStudents) return [];
    return allStudents.filter(s => 
        (s as any).pendingRouteId === route.id && 
        s.status === 'aguardando_aprovacao'
    );
  }, [allStudents, route.id]);

  const capacity = (route as any).capacity || 15;
  const activeCount = (route?.studentIds || []).length;
  const availableSlots = Math.max(0, capacity - activeCount);

  // Separar entre quem tem vaga e quem cai na lista de espera
  const waitingList = useMemo(() => {
    // Nesta implementação simples, vamos apenas mostrar quem está pendente.
    // A lógica de "quem tem vaga" vs "quem é espera" pode ser visual ou baseada na ordem de cadastro.
    return pendingStudents.sort((a, b) => new Date((a as any).createdAt || 0).getTime() - new Date((b as any).createdAt || 0).getTime());
  }, [pendingStudents]);

  const handleApprove = (student: Student) => {
    if (availableSlots <= 0) {
      toast({
        title: "Capacidade Máxima",
        description: "Sua van já está na capacidade máxima!",
        variant: "destructive"
      });
      return;
    }

    // 1. Vincular o aluno à rota real
    const currentStudentIds = route?.studentIds || [];
    const newStudentIds = [...currentStudentIds, student.id];
    updateDoc('routes', route.id, { studentIds: newStudentIds });

    // 2. Atualizar o status do aluno para ativo e limpar o pendente
    updateDoc('students', student.id, { 
        status: 'aguardando', // Status inicial padrão na rota
        active: true,
        pendingRouteId: null 
    });
  };

  const handleReject = (student: Student) => {
    const studentName = String(student?.name || 'Aluno');
    if (confirm(`Tem certeza que deseja recusar o cadastro de ${studentName.split(' ')[0]}?`)) {
      deleteDoc('students', student.id);
    }
  };

  if (isLoading) return <div className="p-4 text-center text-xs animate-pulse font-bold">Carregando aprovações...</div>;

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between px-2">
        <h2 className="text-xs font-black uppercase tracking-widest text-primary flex items-center gap-2">
          <UserPlus className="h-4 w-4" /> Gestão de Vagas
        </h2>
        <Badge variant={availableSlots > 0 ? "secondary" : "destructive"} className="font-black">
          {availableSlots} {availableSlots === 1 ? 'Vaga' : 'Vagas'} Disponíveis
        </Badge>
      </div>

      {waitingList.length === 0 ? (
        <Card className="border-dashed border-2 bg-muted/30">
          <CardContent className="flex flex-col items-center justify-center p-8 text-center">
            <div className="w-12 h-12 bg-muted rounded-full flex items-center justify-center mb-3">
              <Search className="h-6 w-6 text-muted-foreground" />
            </div>
            <p className="text-sm font-bold text-muted-foreground">Nenhuma solicitação pendente.</p>
            <p className="text-[10px] text-muted-foreground mt-1 tracking-tight">Use o Hub de Captação para atrair novos pais!</p>
          </CardContent>
        </Card>
      ) : (
        <div className="space-y-4">
          {(waitingList || []).filter(s => !!s && !!s.id).map((student, index) => {
            const isWaitlist = index >= availableSlots;
            
            return (
              <SafeRow key={`pending-student-${student.id}`} name={`PendingStudent-${student.id}`}>
                <Card className={`overflow-hidden transition-all ${isWaitlist ? 'opacity-75 grayscale-[0.5] border-amber-200 bg-amber-50/30' : 'border-primary/20 shadow-md'}`}>
                <div className={`h-1 w-full ${isWaitlist ? 'bg-amber-400' : 'bg-green-500'}`}></div>
                <CardHeader className="p-4 pb-2">
                  <div className="flex items-center justify-between">
                    <div className="flex items-center gap-3">
                      <Avatar className="h-10 w-10 border-2 border-background shadow-sm">
                        <AvatarImage src={student?.photoUrl} />
                        <AvatarFallback>{student?.name ? student.name.substring(0,2).toUpperCase() : '?'}</AvatarFallback>
                      </Avatar>
                      <div>
                        <CardTitle className="text-sm font-black uppercase tracking-tight">{student?.name || 'Aluno Sem Nome'}</CardTitle>
                        <CardDescription className="text-[10px] flex items-center gap-1">
                          <School className="h-3 w-3" /> {(student as any)?.requestedSchool || 'Não informada'}
                        </CardDescription>
                      </div>
                    </div>
                    {isWaitlist ? (
                      <Badge variant="outline" className="text-[8px] uppercase font-black tracking-tighter bg-amber-100 text-amber-700 border-amber-200">Lista de Espera</Badge>
                    ) : (
                      <Badge variant="outline" className="text-[8px] uppercase font-black tracking-tighter bg-green-100 text-green-700 border-green-200">Vaga Garantida</Badge>
                    )}
                  </div>
                </CardHeader>
                <CardContent className="p-4 pt-2 space-y-3">
                  <div className="space-y-1">
                    <div className="flex items-center gap-2 text-[10px] text-muted-foreground font-bold uppercase">
                      <MapPin className="h-3 w-3 text-destructive" /> 
                      Ponto de Embarque:
                    </div>
                    <p className="text-xs font-medium pl-5 leading-tight italic">
                      {(student as any)?.addressDescription || 'Visualizar no mapa nas próximas versões'}
                    </p>
                  </div>
                  
                  <div className="grid grid-cols-2 gap-2 pt-2">
                    <Button 
                      variant="ghost" 
                      onClick={() => handleReject(student)}
                      className="h-10 text-destructive hover:bg-destructive/10 font-bold gap-2 text-xs"
                    >
                      <X className="h-4 w-4" /> Recusar
                    </Button>
                    <Button 
                      disabled={isWaitlist}
                      onClick={() => handleApprove(student)}
                      className={`h-10 font-black text-xs gap-2 uppercase tracking-widest ${isWaitlist ? 'bg-muted text-muted-foreground' : 'bg-green-600 hover:bg-green-700 text-white'}`}
                    >
                      <Check className="h-4 w-4" /> {isWaitlist ? 'Sem Vaga' : 'Aprovar'}
                    </Button>
                  </div>
                </CardContent>
              </Card>
            </SafeRow>
          );
        })}
        </div>
      )}
    </div>
  );
}
