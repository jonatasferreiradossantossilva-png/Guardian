'use client';

import React, { Component, ErrorInfo, ReactNode } from 'react';
import { AlertCircle, RefreshCw } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card';

interface Props {
  children: ReactNode;
  fallback?: ReactNode;
  name?: string;
}

interface State {
  hasError: boolean;
  error: Error | null;
}

export class ErrorBoundary extends Component<Props, State> {
  public state: State = {
    hasError: false,
    error: null
  };

  public static getDerivedStateFromError(error: Error): State {
    return { hasError: true, error };
  }

  public componentDidCatch(error: Error, errorInfo: ErrorInfo) {
    console.error(`[ErrorBoundary:${this.props.name || 'Global'}]`, error, errorInfo);
    
    // [SAFETY LOGGING] Grava o erro em uma chave dedicada para evitar sobrescrita pelo MockDataProvider
    if (typeof window !== 'undefined') {
        try {
            const crashLogsStr = localStorage.getItem('guardian_crash_stash');
            const crashLogs = crashLogsStr ? JSON.parse(crashLogsStr) : [];
            
            crashLogs.push({
                id: `crash-${Date.now()}`,
                category: "Interface Crash",
                description: `Erro detectado em [${this.props.name || 'Global'}]: ${error.message}`,
                stack: error.stack,
                severity: "Alta",
                reporter: "ErrorBoundary",
                timestamp: new Date().toISOString()
            });
            
            localStorage.setItem('guardian_crash_stash', JSON.stringify(crashLogs));
        } catch (e) {
            // Falha silenciosa
        }
    }
  }

  private handleReset = () => {
    this.setState({ hasError: false, error: null });
    window.location.reload();
  };

  public render() {
    if (this.state.hasError) {
      if (this.props.fallback) {
        return this.props.fallback;
      }

      return (
        <div className="flex min-h-[400px] w-full items-center justify-center p-6 bg-background">
          <Card className="max-w-md border-destructive/20 shadow-2xl">
            <CardHeader className="text-center">
              <div className="mx-auto mb-4 flex h-16 w-16 items-center justify-center rounded-full bg-destructive/10 text-destructive">
                <AlertCircle className="h-10 w-10" />
              </div>
              <CardTitle className="text-xl font-bold">Ops! Algo deu errado</CardTitle>
              <CardDescription>
                Houve um problema ao carregar este módulo do Guardian.
              </CardDescription>
            </CardHeader>
            <CardContent className="space-y-6">
              <div className="rounded-lg bg-muted p-4 text-xs font-mono text-muted-foreground overflow-auto max-h-32">
                {this.state.error?.message || 'Erro desconhecido'}
              </div>
              <Button onClick={this.handleReset} className="w-full h-12 font-bold shadow-lg transition-all active:scale-95">
                <RefreshCw className="mr-2 h-5 w-5" /> Tentar Novamente
              </Button>
            </CardContent>
          </Card>
        </div>
      );
    }

    return this.props.children;
  }
}
