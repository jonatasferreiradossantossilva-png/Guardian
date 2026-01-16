'use client';

import { useMemo } from 'react';
import { useCollection, useFirestore, useMemoFirebase, useUser } from '@/firebase';
import { collection, query } from 'firebase/firestore';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { MapPin, MessageSquareWarning, Loader2 } from 'lucide-react';
import Link from 'next/link';

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
  const { user, isUserLoading } = useUser();
  const firestore = useFirestore();

  const driversQuery = useMemoFirebase(
    () => (user && firestore ? query(collection(firestore, 'drivers')) : null),
    [user, firestore]
  );
  const vehiclesQuery = useMemoFirebase(
    () => (user && firestore ? query(collection(firestore, 'vehicles')) : null),
    [user, firestore]
  );

  const { data: drivers, isLoading: areDriversLoading } = useCollection<Driver>(driversQuery);
  const { data: vehicles, isLoading: areVehiclesLoading } = useCollection<Vehicle>(vehiclesQuery);

  const isLoading = isUserLoading || areDriversLoading || areVehiclesLoading;

  const vehiclesMap = useMemo(() => {
    if (!vehicles) return new Map();
    return new Map(vehicles.map((v) => [v.id, `${v.model} (${v.licensePlate})`]));
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
        {!isLoading && drivers && (
          <div className="space-y-4">
            {drivers.map((driver, index) => (
              <div key={driver.id} className="flex items-center gap-4">
                <Avatar>
                  <AvatarImage src={`https://picsum.photos/seed/driver${index + 1}/100/100`} alt={driver.name} />
                  <AvatarFallback>{driver.name.charAt(0)}</AvatarFallback>
                </Avatar>
                <div className="flex-1">
                  <p className="font-semibold">{driver.name}</p>
                  <p className="text-sm text-muted-foreground">
                    {vehiclesMap.get(driver.vehicleId || '') || 'Sem veículo'}
                  </p>
                </div>
                <Badge variant={statusVariantMap[driver.status]}>
                  {statusLabelMap[driver.status]}
                </Badge>
                <div className="flex gap-1">
                   <Button variant="ghost" size="icon" className="h-8 w-8" disabled>
                     <MapPin className="h-4 w-4" />
                   </Button>
                   <Link href="/dashboard/messages" passHref>
                    <Button asChild variant="ghost" size="icon" className="h-8 w-8">
                        <a><MessageSquareWarning className="h-4 w-4" /></a>
                    </Button>
                   </Link>
                </div>
              </div>
            ))}
             {drivers.length === 0 && (
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
