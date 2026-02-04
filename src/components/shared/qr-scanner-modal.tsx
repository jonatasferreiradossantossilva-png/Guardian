'use client';

import { useEffect, useState } from 'react';
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogDescription,
  DialogFooter,
} from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { Html5QrcodeScanner } from 'html5-qrcode';
import { AlertTriangle, VideoOff } from 'lucide-react';

interface QrScannerModalProps {
  isOpen: boolean;
  onClose: () => void;
  onScanSuccess: (decodedText: string, decodedResult: any) => void;
}

const scannerContainerId = "qr-scanner-container";

export function QrScannerModal({ isOpen, onClose, onScanSuccess }: QrScannerModalProps) {
    const [scanError, setScanError] = useState<string | null>(null);

    useEffect(() => {
        if (isOpen) {
            setScanError(null);
            const scanner = new Html5QrcodeScanner(
                scannerContainerId,
                { 
                    fps: 10, 
                    qrbox: { width: 250, height: 250 },
                    // Important: We don't want to scan QR codes from images.
                    // This improves the UX for mobile users.
                    supportedScanTypes: [0], // 0 is Camera
                },
                /* verbose= */ false
            );

            const handleSuccess = (decodedText: string, decodedResult: any) => {
                onScanSuccess(decodedText, decodedResult);
            };

            const handleError = (errorMessage: string) => {
                // Ignore the common "QR code not found" error, as it fires constantly.
                if (!errorMessage.toLowerCase().includes('qr code not found')) {
                     console.error(`QR Scanner Error: ${errorMessage}`);
                }
            };
            
            scanner.render(handleSuccess, handleError);
            
            Html5QrcodeScanner.getCameras().catch(err => {
                setScanError("Não foi possível acessar a câmera. Verifique as permissões do navegador e tente novamente.");
            });

            return () => {
                scanner.clear().catch(error => {
                    console.error("Failed to clear html5-qrcode-scanner.", error);
                });
            };
        }
    }, [isOpen, onScanSuccess]);

  return (
    <Dialog open={isOpen} onOpenChange={onClose}>
      <DialogContent className="sm:max-w-md">
        <DialogHeader>
          <DialogTitle>Escanear QR Code do Aluno</DialogTitle>
          <DialogDescription>
            Posicione o QR code do aluno no centro da câmera.
          </DialogDescription>
        </DialogHeader>
        <div className="my-4 aspect-square w-full rounded-md bg-secondary flex items-center justify-center overflow-hidden">
            {scanError ? (
                 <div className="text-center text-destructive p-4">
                    <VideoOff className="h-10 w-10 mx-auto mb-2"/>
                    <p className="font-semibold">Erro de Câmera</p>
                    <p className="text-sm">{scanError}</p>
                </div>
            ) : (
                <div id={scannerContainerId} className="w-full" />
            )}
        </div>
        <DialogFooter>
          <Button onClick={onClose} variant="outline">
            Fechar
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}
