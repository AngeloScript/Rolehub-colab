'use client'

import { useEffect } from 'react'
import { Button } from '@/components/ui/button'
import { AlertCircle } from 'lucide-react'

export default function Error({
    error,
    reset,
}: {
    error: Error & { digest?: string }
    reset: () => void
}) {
    useEffect(() => {
        // Log the error to an error reporting service
        console.error(error)
    }, [error])

    return (
        <div className="h-full flex flex-col items-center justify-center p-4 text-center">
            <div className="bg-destructive/10 p-4 rounded-full mb-4">
                <AlertCircle className="w-10 h-10 text-destructive" />
            </div>
            <h2 className="text-xl font-bold mb-2">Ops! Algo deu errado no Chat.</h2>
            <p className="text-muted-foreground mb-6 max-w-sm">
                Não foi possível carregar suas mensagens. Isso pode ser um problema temporário de conexão.
            </p>
            <Button onClick={() => reset()}>
                Tentar novamente
            </Button>
        </div>
    )
}
