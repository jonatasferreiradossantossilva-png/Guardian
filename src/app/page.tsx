import { LoginForm } from "@/components/auth/login-form";
import { Button } from "@/components/ui/button";
import { Rocket } from "lucide-react";
import Link from "next/link";

export default function Page() {
  return (
    <main className="flex min-h-screen flex-col items-center justify-center p-8">
      <div className="flex flex-col items-center gap-4 text-center mb-8">
        <div className="rounded-full bg-secondary p-4 border-2 border-primary/50">
          <Rocket className="h-12 w-12 text-primary" />
        </div>
        <h1 className="text-4xl font-bold text-foreground">Guardian</h1>
        <p className="max-w-md text-muted-foreground">
          Acesse sua conta para gerenciar sua operação.
        </p>
      </div>
      <LoginForm />
      <div className="mt-6 flex flex-col sm:flex-row gap-4">
        <Button asChild variant="link" className="text-muted-foreground">
            <Link href="/login">
                Conheça a plataforma &rarr;
            </Link>
        </Button>
        <Button asChild variant="link" className="text-muted-foreground">
            <Link href="/presentation">
                Ver Apresentação (Pitch Deck) &rarr;
            </Link>
        </Button>
      </div>
    </main>
  );
}
