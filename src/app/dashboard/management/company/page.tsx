
'use client';

import { CompanyForm } from "@/components/dashboard/management/company/company-form";

export default function CompanyManagementPage() {
  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-3xl font-bold tracking-tight uppercase italic">Configurações do Gestor</h1>
        <p className="text-muted-foreground">Gerencie os dados da sua transportadora e informações de faturamento.</p>
      </div>
      <CompanyForm />
    </div>
  );
}
