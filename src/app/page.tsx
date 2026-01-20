import { LoginForm } from "@/components/auth/login-form";
import { GuardianLogo } from "@/components/icons/guardian-logo";
import { Presentation } from "lucide-react";
import Link from 'next/link';
import { Button } from '@/components/ui/button';

export default function Home() {
  return (
    <main className="flex min-h-screen flex-col items-center justify-center p-8">
       <div className="absolute top-4 right-4 z-10">
          <Button asChild variant="outline">
              <Link href="/presentation"><Presentation className="mr-2 h-4 w-4"/> Ver Apresentação</Link>
          </Button>
      </div>
      <div className="flex flex-col items-center gap-4 text-center mb-8">
        <div className="rounded-full bg-secondary p-4 border-2 border-primary/50">
          <GuardianLogo className="h-12 w-12" shieldClassName="text-primary" pinClassName="text-primary/50" pinDotClassName="text-primary" />
        </div>
        <h1 className="text-4xl font-bold text-foreground">Guardian</h1>
        <p className="max-w-md text-muted-foreground">
          A plataforma para gestão do transporte escolar. Segurança, eficiência e tranquilidade.
        </p>
      </div>
      <LoginForm />
    </main>
  );
}
