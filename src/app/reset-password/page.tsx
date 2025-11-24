"use client";

import { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { z } from 'zod';
import { Lock, Loader2, AlertCircle, CheckCircle } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Input } from '@/components/ui/input';
import { Form, FormControl, FormField, FormItem, FormLabel, FormMessage } from '@/components/ui/form';
import { Alert, AlertDescription, AlertTitle } from "@/components/ui/alert";
import { RoleHubAnimatedLogo } from '@/components/RoleHubAnimatedLogo';
import { supabase } from '@/lib/supabase';
import { useToast } from '@/hooks/use-toast';
import { AppLayout } from '@/components/layout/AppLayout';

const resetPasswordSchema = z.object({
    password: z.string().min(6, { message: "A senha deve ter pelo menos 6 caracteres." }),
    confirmPassword: z.string(),
}).refine((data) => data.password === data.confirmPassword, {
    message: "As senhas não coincidem.",
    path: ["confirmPassword"],
});

type ResetPasswordFormValues = z.infer<typeof resetPasswordSchema>;

export default function ResetPasswordPage() {
    const router = useRouter();
    const { toast } = useToast();
    const [isLoading, setIsLoading] = useState(false);
    const [error, setError] = useState<string | null>(null);
    const [success, setSuccess] = useState(false);

    const form = useForm<ResetPasswordFormValues>({
        resolver: zodResolver(resetPasswordSchema),
        defaultValues: {
            password: '',
            confirmPassword: '',
        },
    });

    // Check if we have a session (which means the magic link worked)
    useEffect(() => {
        const checkSession = async () => {
            const { data: { session } } = await supabase.auth.getSession();
            if (!session) {
                // If no session, maybe the link expired or was invalid
                // But we allow rendering the form anyway, Supabase might handle the recovery token internally
                // or we might be in a state where we need to re-authenticate.
                // For now, let's just let them try to reset.
            }
        };
        checkSession();
    }, []);

    const onSubmit = async (data: ResetPasswordFormValues) => {
        setIsLoading(true);
        setError(null);

        try {
            const { error: updateError } = await supabase.auth.updateUser({
                password: data.password
            });

            if (updateError) throw updateError;

            setSuccess(true);
            toast({
                title: "Senha atualizada!",
                description: "Sua senha foi redefinida com sucesso.",
            });

            // Redirect to login or events after a delay
            setTimeout(() => {
                router.push('/events');
            }, 2000);

        } catch (err: any) {
            console.error("Error resetting password:", err);
            setError(err.message || "Erro ao redefinir senha. O link pode ter expirado.");
        } finally {
            setIsLoading(false);
        }
    };

    return (
        <AppLayout>
            <div className="flex items-center justify-center min-h-screen bg-background p-4 relative overflow-hidden">
                {/* Background effects similar to login page */}
                <div className="absolute -top-1/2 -left-1/4 w-full h-full bg-primary/10 rounded-full filter blur-3xl animate-pulse opacity-20"></div>
                <div className="absolute -bottom-1/2 -right-1/4 w-full h-full bg-secondary/10 rounded-full filter blur-3xl animate-pulse opacity-20 animation-delay-4000"></div>

                <div className="relative z-10 w-full max-w-sm">
                    <div className="flex justify-center items-center mb-6 relative">
                        <RoleHubAnimatedLogo className="w-[200px] h-[60px]" />
                    </div>

                    <Card className="bg-card/60 backdrop-blur-lg border-border/20 shadow-xl shadow-primary/5">
                        <CardHeader className="text-center">
                            <CardTitle className="text-2xl font-headline">Redefinir Senha</CardTitle>
                            <CardDescription>Crie uma nova senha para sua conta.</CardDescription>
                        </CardHeader>
                        <CardContent>
                            {success ? (
                                <div className="text-center space-y-4 py-4">
                                    <div className="flex justify-center">
                                        <CheckCircle className="w-16 h-16 text-green-500" />
                                    </div>
                                    <h3 className="text-xl font-semibold">Sucesso!</h3>
                                    <p className="text-muted-foreground">Sua senha foi atualizada. Você será redirecionado em instantes...</p>
                                    <Button onClick={() => router.push('/events')} className="w-full mt-4">
                                        Ir para o App
                                    </Button>
                                </div>
                            ) : (
                                <Form {...form}>
                                    <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-6">
                                        {(error) && (
                                            <Alert variant="destructive">
                                                <AlertCircle className="h-4 w-4" />
                                                <AlertTitle>Erro</AlertTitle>
                                                <AlertDescription>{error}</AlertDescription>
                                            </Alert>
                                        )}

                                        <FormField
                                            control={form.control}
                                            name="password"
                                            render={({ field }) => (
                                                <FormItem>
                                                    <FormLabel>Nova Senha</FormLabel>
                                                    <FormControl>
                                                        <div className="relative">
                                                            <Lock className="absolute left-3 top-1/2 -translate-y-1/2 w-5 h-5 text-muted-foreground" />
                                                            <Input {...field} placeholder="••••••••" type="password" className="pl-10" />
                                                        </div>
                                                    </FormControl>
                                                    <FormMessage />
                                                </FormItem>
                                            )}
                                        />

                                        <FormField
                                            control={form.control}
                                            name="confirmPassword"
                                            render={({ field }) => (
                                                <FormItem>
                                                    <FormLabel>Confirmar Nova Senha</FormLabel>
                                                    <FormControl>
                                                        <div className="relative">
                                                            <Lock className="absolute left-3 top-1/2 -translate-y-1/2 w-5 h-5 text-muted-foreground" />
                                                            <Input {...field} placeholder="••••••••" type="password" className="pl-10" />
                                                        </div>
                                                    </FormControl>
                                                    <FormMessage />
                                                </FormItem>
                                            )}
                                        />

                                        <Button type="submit" className="w-full font-bold h-12" disabled={isLoading}>
                                            {isLoading ? (
                                                <Loader2 className="animate-spin mr-2" />
                                            ) : null}
                                            {isLoading ? "Salvando..." : "Redefinir Senha"}
                                        </Button>
                                    </form>
                                </Form>
                            )}
                        </CardContent>
                    </Card>
                </div>
            </div>
        </AppLayout>
    );
}
