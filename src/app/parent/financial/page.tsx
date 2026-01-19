'use client';

import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { DollarSign, ArrowLeft } from "lucide-react";
import { Button } from "@/components/ui/button";
import Link from "next/link";

export default function ParentFinancialPage() {
  return (
    <div className="min-h-screen bg-background text-foreground p-4">
      <div className="max-w-4xl mx-auto">
        <div className="flex items-center gap-4 mb-6">
            <Button asChild variant="outline" size="icon">
                <Link href="/parent/tracking"><ArrowLeft /></Link>
            </Button>
            <h1 className="text-3xl font-bold tracking-tight">Meu Financeiro</h1>
        </div>
        <Card className="flex flex-col items-center justify-center text-center p-12 min-h-[400px]">
            <DollarSign className="h-16 w-16 text-muted-foreground mb-4" />
            <CardHeader>
            <CardTitle>Histórico de Faturas</CardTitle>
            </CardHeader>
            <CardContent>
            <p className="max-w-md mx-auto text-muted-foreground">Em breve: aqui você poderá visualizar seu histórico de pagamentos, baixar faturas e realizar pagamentos online.</p>
            </CardContent>
        </Card>
      </div>
    </div>
  );
}
