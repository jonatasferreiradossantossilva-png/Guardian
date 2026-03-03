
'use client';

import { useState, useMemo, useEffect } from 'react';
import Link from 'next/link';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Loader2, ArrowLeft, User, QrCode } from 'lucide-react';
import { useMockCollection } from '@/hooks/use-mock-data';
import QRCode from 'qrcode';
import Image from 'next/image';

export default function ParentQRCodePage() {
  const [mockUserId, setMockUserId] = useState<string | null>(null);
  const [qrCodeDataUrl, setQrCodeDataUrl] = useState<string | null>(null);
  const [selectedStudentId, setSelectedStudentId] = useState<string | null>(null);

  useEffect(() => {
    const storedUserId = sessionStorage.getItem('mockUserId');
    setMockUserId(storedUserId);
    
    // Phase 2: Read selected student from sessionStorage
    const lastSelectedId = sessionStorage.getItem('selectedStudentId');
    setSelectedStudentId(lastSelectedId);
  }, []);

  const { data: parents } = useMockCollection('parents', mockUserId ? [{ field: 'userId', op: '==', value: mockUserId }] : undefined);
  const parent = useMemo(() => parents?.[0], [parents]);

  const { data: students, isLoading: areStudentsLoading } = useMockCollection('students', parent ? [{ field: 'parentId', op: '==', value: parent.id }] : undefined);
  
  // Phase 2: Pick the selected student, or fallback to the first one
  const student = useMemo(() => {
      if (!students || students.length === 0) return null;
      if (!selectedStudentId) return students[0];
      return students.find(s => s.id === selectedStudentId) || students[0];
  }, [students, selectedStudentId]);

  useEffect(() => {
    if (student) {
      QRCode.toDataURL(student.id, {
        width: 300,
        margin: 2,
        errorCorrectionLevel: 'H'
      })
        .then(url => {
          setQrCodeDataUrl(url);
        })
        .catch(err => {
          console.error(err);
        });
    }
  }, [student]);

  const isLoading = areStudentsLoading || !qrCodeDataUrl;

  return (
    <div className="min-h-screen bg-background text-foreground p-4">
      <div className="max-w-md mx-auto">
        <div className="flex items-center gap-4 mb-6">
          <Button asChild variant="outline" size="icon">
            <Link href="/parent/tracking">
              <ArrowLeft />
            </Link>
          </Button>
        </div>
        <Card className="text-center">
          <CardHeader>
            <CardTitle className="flex items-center justify-center gap-2">
              <QrCode /> QR Code de Embarque
            </CardTitle>
            <CardDescription className="mt-2">
              Apresente este código para o motorista ou monitor no momento do embarque.
            </CardDescription>
          </CardHeader>
          <CardContent className="flex flex-col items-center justify-center gap-4">
            {isLoading ? (
              <div className="h-[300px] w-[300px] flex flex-col items-center justify-center bg-secondary rounded-lg">
                <Loader2 className="animate-spin h-8 w-8 text-primary" />
                <p className="mt-4 text-muted-foreground">Gerando código...</p>
              </div>
            ) : (
              <Image src={qrCodeDataUrl!} alt="QR Code" width={300} height={300} className="rounded-lg border-4 border-foreground" />
            )}
            {student && (
                <div className="mt-4 p-4 rounded-md bg-secondary w-full">
                    <p className="text-sm text-muted-foreground">Aluno(a)</p>
                    <p className="font-bold text-lg">{student.name}</p>
                </div>
            )}
          </CardContent>
        </Card>
      </div>
    </div>
  );
}
