
'use client';

import { CompanyForm } from "@/components/dashboard/management/company/company-form";

export default function CompanyManagementPage() {
  return (
    <div className="flex flex-col items-center justify-center w-full space-y-8 pb-20">
      <div className="text-center max-w-2xl">
        <h1 className="text-3xl font-bold tracking-tight uppercase italic text-primary">Perfil da Empresa</h1>
        <p className="text-muted-foreground mt-2">
          Gerencie os dados oficiais da sua transportadora e configure as informações de recebimento (Pix/Banco) que aparecerão nos contratos dos pais.
        </p>
      </div>
      <div className="w-full max-w-3xl">
        <CompanyForm />
      </div>
    </div>
  );
}
