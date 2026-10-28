'use client';

import React from 'react';
import { ShieldAlert } from 'lucide-react';
import { TableRow, TableCell } from '@/components/ui/table';

interface SafeTableProps {
  children: React.ReactNode;
  fallback?: React.ReactNode;
  name?: string;
  isTableRow?: boolean;
}

/**
 * [QUALITY SPECIALIST COMPONENT]
 * Wrapper que protege o conteúdo de tabelas contra erros de renderização 
 * comuns em atualizações massivas de DOM.
 */
export class SafeTable extends React.Component<SafeTableProps, { hasError: boolean }> {
  constructor(props: SafeTableProps) {
    super(props);
    this.state = { hasError: false };
  }

  static getDerivedStateFromError() {
    return { hasError: true };
  }

  componentDidCatch(error: Error, errorInfo: React.ErrorInfo) {
    console.error(`[SafeTable:${this.props.name || 'Generic'}] Error caught:`, error, errorInfo);
    
    // Log via Relay Global (Black Box)
    if (typeof window !== 'undefined' && (window as any).__guardian_log_error) {
        (window as any).__guardian_log_error({
            description: `Erro crítico na UI (${this.props.name || 'Generic'}): ${error.message}`,
            metadata: { 
                componentStack: errorInfo.componentStack,
                errorName: error.name
            }
        });
    }
  }

  render() {
    if (this.state.hasError) {
      if (this.props.isTableRow) {
        return (
            <TableRow className="bg-red-50/30">
              <TableCell colSpan={10} className="py-4 text-center text-red-500 text-xs italic flex items-center justify-center gap-2">
                <ShieldAlert className="h-3 w-3" />
                Erro na linha: {this.props.name || 'Sem Identificação'}
              </TableCell>
            </TableRow>
          );
      }
      return this.props.fallback || null;
    }

    return this.props.children;
  }
}


import { SafeComponent } from './safe-component';

/**
 * SafeRow: Agora utiliza o SafeComponent genérico para evitar o erro removeChild 
 * causado por <tr> órfãs em grids que não são tabelas.
 */
export function SafeRow({ children, name, className }: { children: React.ReactNode, name?: string, className?: string }) {
    if (className) {
        return (
            <SafeComponent name={name}>
                <div className={className}>
                    {children}
                </div>
            </SafeComponent>
        );
    }
    return (
        <SafeComponent name={name}>
            {children}
        </SafeComponent>
    );
}

/**
 * SafeTableRow: Versão específica para o corpo de tabelas <tbody>.
 */
export function SafeTableRow({ children, name }: { children: React.ReactNode, name?: string }) {
    return (
        <SafeTable name={name} isTableRow>
            {children}
        </SafeTable>
    );
}
