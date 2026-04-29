'use client';

import { useMemo } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { MessageSquareWarning, Loader2 } from 'lucide-react';
import Link from 'next/link';
import { useMockCollection } from '@/hooks/use-mock-data';
import { safeString, safeArray, safeInitials } from '@/lib/safe-render';
import { SafeRow } from '@/components/shared/safe-table';



type Driver = {
  id: string;
  name: string;
  status: 'inativo' | 'em_rota' | 'pausa';
  vehicleId?: string;
  userId: string;
};

type Vehicle = { id: string; model: string; licensePlate: string };

const statusVariantMap: Record<Driver['status'], 'secondary' | 'default' | 'outline'> = {
  'inativo': 'secondary',
  'em_rota': 'default',
  'pausa': 'outline'
};

const statusLabelMap: Record<Driver['status'], string> = {
  'inativo': 'Inativo',
  'em_rota': 'Em Rota',
  'pausa': 'Em Pausa'
};

export function DriverStatusList() {
  const { data: drivers, isLoading: areDriversLoading } = useMockCollection<Driver>('drivers');
  const { data: vehicles, isLoading: areVehiclesLoading } = useMockCollection<Vehicle>('vehicles');

  const isLoading = areDriversLoading || areVehiclesLoading;

  const vehiclesMap = useMemo(() => {
    const list = safeArray<Vehicle>(vehicles);
    if (list.length === 0) return new Map();
    return new Map(list.map((v: Vehicle) => [v.id, `${v.model} (${v.licensePlate})`]));
  }, [vehicles]);


  return (
    <Card>
      <CardHeader>
        <CardTitle>Status dos Motoristas</CardTitle>
      </CardHeader>
      <CardContent>
        {isLoading && (
          <div className="flex items-center justify-center p-8">
            <Loader2 className="h-6 w-6 animate-spin text-primary" />
          </div>
        )}
        {!isLoading && (
          <div className="space-y-4">
            {safeArray<Driver>(drivers).length > 0 ? (
                safeArray<Driver>(drivers).map((driver: Driver, index: number) => (
                    <SafeRow key={driver.id} name={`DriverStatus-${driver.id}`}>
                        <div className="flex items-center gap-4">
                            <Avatar>
                                <AvatarImage src={safeString(driver.userId) ? `https://picsum.photos/seed/driver${index + 1}/100/100` : ''} alt={safeString(driver.name)} />
                                <AvatarFallback>{safeInitials(driver.name)}</AvatarFallback>
                            </Avatar>
                            <div className="flex-1">
                                <p className="font-semibold">{safeString(driver.name)}</p>
                                <p className="text-sm text-muted-foreground">
                                    {vehiclesMap.get(driver.vehicleId || '') || 'Sem veículo'}
                                </p>
                            </div>
                            <Badge variant={statusVariantMap[driver.status] || 'secondary'}>
                                {statusLabelMap[driver.status] || 'Desconhecido'}
                            </Badge>
                            <div className="flex gap-1">
                                <Button asChild variant="ghost" size="icon" className="h-8 w-8">
                                    <Link href="/dashboard/messages">
                                        <MessageSquareWarning className="h-4 w-4" />
                                    </Link>
                                </Button>
                            </div>
                        </div>
                    </SafeRow>
                ))
            ) : (
                <p className="text-center text-muted-foreground p-8">
                    Nenhum motorista cadastrado.
                </p>
            )}
          </div>
        )}

      </CardContent>
    </Card>
  );
}
