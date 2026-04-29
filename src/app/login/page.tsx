import { LoginForm } from "@/components/auth/login-form";
import { Button } from "@/components/ui/button";
import { ShieldCheck } from "lucide-react";
import Link from "next/link";

export default function LoginPage() {
  return (
    <main className="flex min-h-screen flex-col items-center justify-center p-8 bg-muted/20">
      <div className="flex flex-col items-center gap-4 text-center mb-8">
        <div className="rounded-full bg-primary/10 p-4 border border-primary/30">
          <ShieldCheck className="h-12 w-12 text-primary" />
        </div>
        <h1 className="text-4xl font-black tracking-tight text-foreground uppercase italic">Guardian</h1>
        <p className="max-w-md text-muted-foreground font-medium">
          Acesso Seguro ao Painel Administrativo.
        </p>
      </div>
      
      <div className="bg-background p-8 rounded-2xl shadow-xl shadow-primary/5 border-2 border-primary/10 w-full max-w-md">
        <LoginForm />
      </div>

      <div className="mt-8">
        <Button asChild variant="link" className="text-muted-foreground font-bold hover:text-primary">
            <Link href="/">
                &larr; Voltar para a página inicial
            </Link>
        </Button>
      </div>
    </main>
  );
}
