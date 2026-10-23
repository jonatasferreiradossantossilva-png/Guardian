'use client';

import React, { Component, ErrorInfo, ReactNode } from 'react';
import { AlertCircle, RefreshCw } from 'lucide-react';
import { Button } from '@/components/ui/button';

interface Props {
  children: ReactNode;
  fallback?: ReactNode;
  name?: string;
}

interface State {
  hasError: boolean;
  error: Error | null;
}

/**
 * SafeComponent: Um ErrorBoundary granular para isolar falhas de componentes específicos.
 * Se um gráfico ou um item de lista falhar, o restante da página continua funcional.
 */
export class SafeComponent extends Component<Props, State> {
  public state: State = {
    hasError: false,
    error: null
  };

  public static getDerivedStateFromError(error: Error): State {
    return { hasError: true, error };
  }

  public componentDidCatch(error: Error, errorInfo: ErrorInfo) {
    console.error(`[SafeComponent:${this.props.name || 'Anonymous'}]`, error, errorInfo);
    
    // Registrar na "Caixa Preta" de auditoria se disponível
    if (typeof window !== 'undefined' && (window as any).__guardian_log_error) {
        (window as any).__guardian_log_error({
            description: `Falha no componente [${this.props.name || 'Anonymous'}]: ${error.message}`,
            metadata: { stack: error.stack, componentStack: errorInfo.componentStack }
        });
    }
  }

  private handleRetry = () => {
    this.setState({ hasError: false, error: null });
  };

  public render() {
    if (this.state.hasError) {
      if (this.props.fallback) {
        return this.props.fallback;
      }

      return (
        <div className="flex flex-col items-center justify-center p-6 border-2 border-dashed border-destructive/20 rounded-xl bg-destructive/5 text-center space-y-3 min-h-[150px]">
          <div className="p-2 bg-destructive/10 rounded-full text-destructive">
            <AlertCircle className="h-6 w-6" />
          </div>
          <div className="space-y-1">
            <p className="text-xs font-black uppercase tracking-tighter text-destructive">Erro no Módulo</p>
            <p className="text-[10px] text-muted-foreground max-w-[200px] mx-auto line-clamp-2 italic">
              {this.state.error?.message || 'Falha de renderização local.'}
            </p>
          </div>
          <Button 
            variant="outline" 
            size="sm" 
            onClick={this.handleRetry}
            className="h-8 text-[10px] font-bold border-destructive/20 hover:bg-destructive/10"
          >
            <RefreshCw className="mr-2 h-3 w-3" /> REPETIR
          </Button>
        </div>
      );
    }

    return (
      <div className="contents" data-safe-component={this.props.name || 'Anonymous'}>
        {this.props.children}
      </div>
    );
  }
}

// Wrapper funcional para conveniência
export function withSafety<P extends object>(
  WrappedComponent: React.ComponentType<P>,
  name?: string
) {
  return function SafeWrappedComponent(props: P) {
    return (
      <SafeComponent name={name || WrappedComponent.displayName || WrappedComponent.name}>
        <WrappedComponent {...props} />
      </SafeComponent>
    );
  };
}
