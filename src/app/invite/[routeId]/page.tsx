'use client';

import { useEffect } from 'react';
import { useParams, useRouter } from 'next/navigation';
import { Loader2 } from 'lucide-react';

export default function RedirectInvitePage() {
    const params = useParams();
    const router = useRouter();
    const routeId = params?.routeId as string;

    useEffect(() => {
        if (routeId) {
            router.replace(`/register?routeId=${routeId}&isTesting=true`);
        }
    }, [routeId, router]);

    return (
        <div className="min-h-screen flex flex-col items-center justify-center bg-secondary/30 gap-4">
            <Loader2 className="animate-spin h-10 w-10 text-primary" />
            <p className="font-black uppercase text-xs tracking-widest text-muted-foreground animate-pulse">
                Carregando Experiência Segura...
            </p>
        </div>
    );
}
