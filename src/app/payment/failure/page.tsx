"use client";

import { AppLayout } from "@/components/layout/AppLayout";
import { Button } from "@/components/ui/button";
import { XCircle } from "lucide-react";
import Link from "next/link";
// import { useSearchParams } from "next/navigation";

export default function PaymentFailurePage() {
    // const searchParams = useSearchParams();
    // const error = searchParams.get('error');

    return (
        <AppLayout>
            <div className="flex flex-col items-center justify-center min-h-[60vh] px-4 text-center space-y-6">
                <div className="w-20 h-20 rounded-full bg-red-100 dark:bg-red-900/20 flex items-center justify-center">
                    <XCircle className="w-10 h-10 text-red-600 dark:text-red-400" />
                </div>

                <div className="space-y-2">
                    <h1 className="text-2xl font-bold text-foreground">Pagamento não concluído</h1>
                    <p className="text-muted-foreground max-w-sm mx-auto">
                        Houve um problema ao processar seu pagamento no Mercado Pago. Nenhuma cobrança deve ter sido feita.
                    </p>
                </div>

                <div className="flex flex-col sm:flex-row gap-3 w-full max-w-sm">
                    <Button asChild variant="default" className="w-full">
                        <Link href="/events">Tentar Novamente</Link>
                    </Button>
                    <Button asChild variant="outline" className="w-full">
                        <Link href="/tickets">Ver Meus Ingressos</Link>
                    </Button>
                </div>
            </div>
        </AppLayout>
    );
}
