'use client';

import { useMemo } from 'react';
import { Bar, BarChart, CartesianGrid, XAxis, YAxis } from 'recharts';
import {
  Card,
  CardContent,
  CardHeader,
  CardTitle,
  CardDescription,
} from '@/components/ui/card';
import {
  ChartContainer,
  ChartTooltip,
  ChartTooltipContent,
} from '@/components/ui/chart';
import { useMockCollection } from '@/hooks/use-mock-data';
import { Loader2 } from 'lucide-react';

export function StudentsBySchoolChart() {
  const { data: students, isLoading: areStudentsLoading } = useMockCollection('students');
  const { data: schools, isLoading: areSchoolsLoading } = useMockCollection('schools');

  const chartData = useMemo(() => {
    if (!students || !schools) return [];

    const schoolNameMap = new Map(schools.map(s => [s.id, s.name]));
    const studentCountBySchool = students.reduce((acc, student) => {
      if (student.schoolId) {
        acc[student.schoolId] = (acc[student.schoolId] || 0) + 1;
      }
      return acc;
    }, {});

    return Object.entries(studentCountBySchool)
      .map(([schoolId, count]) => ({
        school: schoolNameMap.get(schoolId)?.replace('Escola ', '').replace('Colégio ', '') || schoolId,
        Alunos: count,
      }))
      .sort((a, b) => b.Alunos - a.Alunos);

  }, [students, schools]);

  const isLoading = areStudentsLoading || areSchoolsLoading;

  const chartConfig = {
    Alunos: {
      label: 'Alunos',
      color: 'hsl(var(--chart-1))',
    },
  };

  return (
    <Card>
      <CardHeader>
        <CardTitle>Alunos por Escola</CardTitle>
        <CardDescription>
          Distribuição de alunos por instituição.
        </CardDescription>
      </CardHeader>
      <CardContent>
        {isLoading ? (
            <div className="flex items-center justify-center h-[250px]">
                <Loader2 className="h-8 w-8 animate-spin text-primary" />
            </div>
        ) : (
            <ChartContainer config={chartConfig} className="h-[250px] w-full">
              <BarChart
                accessibilityLayer
                data={chartData}
                layout="vertical"
                margin={{
                  left: 0,
                  right: 10,
                }}
              >
                <CartesianGrid horizontal={false} />
                <YAxis
                  dataKey="school"
                  type="category"
                  tickLine={false}
                  tickMargin={10}
                  axisLine={false}
                  tickFormatter={(value) => value.slice(0, 10)}
                  width={80}
                />
                <XAxis dataKey="Alunos" type="number" hide />
                <ChartTooltip
                  cursor={false}
                  content={<ChartTooltipContent indicator="dot" />}
                />
                <Bar dataKey="Alunos" fill="var(--color-Alunos)" radius={4} />
              </BarChart>
            </ChartContainer>
        )}
      </CardContent>
    </Card>
  );
}
