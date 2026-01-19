
"use client";

import { useState } from 'react';
import Link from 'next/link';
import { useRouter } from 'next/navigation';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { z } from 'zod';
import { AtSign, Lock, LogIn, Loader2, AlertCircle } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle } from '@/components/ui/card';
import { Input } from '@/components/ui/input';
import { Form, FormControl, FormField, FormItem, FormLabel, FormMessage } from '@/components/ui/form';
import { Alert, AlertDescription, AlertTitle } from "@/components/ui/alert";
import { RoleHubAnimatedLogo } from '@/components/RoleHubAnimatedLogo';
import { supabase } from '@/lib/supabase';
import { useToast } from '@/hooks/use-toast';
import { AppLayout } from '@/components/layout/AppLayout';

const loginSchema = z.object({
  email: z.string().email({ message: "Por favor, insira um email válido." }),
  password: z.string().min(6, { message: "A senha deve ter pelo menos 6 caracteres." }),
});

type LoginFormValues = z.infer<typeof loginSchema>;

export default function LoginPage() {
  const router = useRouter();
  const { toast } = useToast();
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);


  const form = useForm<LoginFormValues>({
    resolver: zodResolver(loginSchema),
    defaultValues: {
      email: '',
      password: '',
    },
  });

  const onSubmit = async (data: LoginFormValues) => {
    setIsLoading(true);
    setError(null);

    try {
      const { error } = await supabase.auth.signInWithPassword({
        email: data.email,
        password: data.password,
      });

      if (error) throw error;

      router.push('/events');
      // eslint-disable-next-line @typescript-eslint/no-explicit-any
    } catch (error: any) {
      if (error.message === 'Invalid login credentials') {
        setError("Email ou senha inválidos. Por favor, tente novamente.");
      } else {
        setError("Ocorreu um erro inesperado. Tente novamente mais tarde.");
        console.error(error);
      }
    } finally {
      setIsLoading(false);
    }
  };

  const handlePasswordReset = async () => {
    const email = form.getValues("email");
    if (!email) {
      form.setError("email", { message: "Por favor, insira seu email para redefinir a senha." });
      return;
    }
    try {
      const { error: resetError } = await supabase.auth.resetPasswordForEmail(email, {
        redirectTo: `${window.location.origin}/auth/callback?next=/reset-password`,
      });

      if (resetError) throw resetError;

      toast({
        title: "Email de redefinição enviado",
        description: "Verifique sua caixa de entrada para redefinir sua senha.",
      });
    } catch {
      toast({
        variant: "destructive",
        title: "Erro ao enviar email",
        description: "Verifique se o email está correto e tente novamente.",
      });
    }
  };

  const handleSocialLogin = async (provider: 'google' | 'apple') => {
    try {
      setIsLoading(true);
      const { error } = await supabase.auth.signInWithOAuth({
        provider,
        options: {
          redirectTo: `${window.location.origin}/auth/callback`,
        },
      });

      if (error) throw error;

    } catch (error) {
      console.error(error);
      toast({
        variant: "destructive",
        title: "Erro no login social",
        description: "Não foi possível conectar com o provedor. Tente novamente.",
      });
    } finally {
      // Reset loading state after a delay or if we detect focus returning to the window 
      // (which happens when popup closes or user cancels)
      const handleFocus = () => {
        setIsLoading(false);
        window.removeEventListener('focus', handleFocus);
      };
      window.addEventListener('focus', handleFocus);

      // Fallback timeout just in case
      setTimeout(() => setIsLoading(false), 5000);
    }
  };

  return (
    <AppLayout>
      <div className="flex items-center justify-center min-h-screen bg-background p-4 relative overflow-hidden">
        <div className="absolute -top-1/2 -left-1/4 w-full h-full bg-primary/10 rounded-full filter blur-3xl animate-pulse opacity-20"></div>
        <div className="absolute -bottom-1/2 -right-1/4 w-full h-full bg-secondary/10 rounded-full filter blur-3xl animate-pulse opacity-20 animation-delay-4000"></div>

        <div className="absolute inset-0 z-0">
          <div className="absolute top-0 left-0 w-1/4 h-1/4 bg-primary/20 animate-crackle-1 rounded-full filter blur-2xl opacity-30"></div>
          <div className="absolute bottom-0 right-0 w-1/3 h-1/3 bg-secondary/20 animate-crackle-2 rounded-full filter blur-2xl opacity-30"></div>
          <div className="absolute top-1/3 right-1/4 w-24 h-24 bg-primary/10 animate-crackle-3 rounded-full filter blur-xl opacity-40"></div>
          <div className="absolute bottom-1/4 left-1/4 w-20 h-20 bg-secondary/10 animate-crackle-4 rounded-full filter blur-xl opacity-40"></div>
        </div>

        <div className="relative z-10 w-full max-w-sm">
          <Link href="/">
            <div className="flex justify-center items-center mb-6 relative">
              <RoleHubAnimatedLogo className="w-[250px] h-[80px]" />
            </div>
          </Link>
          <Card className="bg-card/60 backdrop-blur-lg border-border/20 shadow-xl shadow-primary/5">
            <CardHeader className="text-center">
              <CardTitle className="text-2xl font-headline">Acesse Sua Conta</CardTitle>
              <CardDescription>Insira suas credenciais para continuar sua jornada.</CardDescription>
            </CardHeader>
            <CardContent>
              <Form {...form}>
                <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-6">
                  {(error) && (
                    <Alert variant="destructive">
                      <AlertCircle className="h-4 w-4" />
                      <AlertTitle>Erro de Autenticação</AlertTitle>
                      <AlertDescription>{error}</AlertDescription>
                    </Alert>
                  )}
                  <FormField
                    control={form.control}
                    name="email"
                    render={({ field }) => (
                      <FormItem>
                        <FormLabel className="sr-only">Email</FormLabel>
                        <FormControl>
                          <div className="relative">
                            <AtSign className="absolute left-3 top-1/2 -translate-y-1/2 w-5 h-5 text-muted-foreground" />
                            <Input {...field} placeholder="voce@exemplo.com" type="email" className="pl-10 h-12 text-base bg-background/50 focus:bg-background" />
                          </div>
                        </FormControl>
                        <FormMessage />
                      </FormItem>
                    )}
                  />
                  <FormField
                    control={form.control}
                    name="password"
                    render={({ field }) => (
                      <FormItem>
                        <FormLabel className="sr-only">Senha</FormLabel>
                        <FormControl>
                          <div className="relative">
                            <Lock className="absolute left-3 top-1/2 -translate-y-1/2 w-5 h-5 text-muted-foreground" />
                            <Input {...field} placeholder="••••••••" type="password" className="pl-10 h-12 text-base bg-background/50 focus:bg-background" />
                          </div>
                        </FormControl>
                        <FormMessage />
                      </FormItem>
                    )}
                  />
                  <Button type="submit" className="w-full font-bold text-lg h-12 bg-primary text-primary-foreground hover:bg-primary/90 transition-transform hover:scale-105" disabled={isLoading}>
                    {isLoading ? (
                      <Loader2 className="animate-spin" />
                    ) : (
                      <>
                        <LogIn className="mr-2" />
                        Entrar
                      </>
                    )}
                  </Button>
                </form>
              </Form>

              <div className="relative my-6">
                <div className="absolute inset-0 flex items-center">
                  <span className="w-full border-t border-muted/30" />
                </div>
                <div className="relative flex justify-center text-xs uppercase">
                  <span className="bg-card px-2 text-muted-foreground">Ou continue com</span>
                </div>
              </div>

              <div className="grid grid-cols-2 gap-4">
                <Button variant="outline" onClick={() => handleSocialLogin('google')} disabled={isLoading}>
                  <svg className="mr-2 h-4 w-4" aria-hidden="true" focusable="false" data-prefix="fab" data-icon="google" role="img" xmlns="http://www.w3.org/2000/svg" viewBox="0 0 488 512">
                    <path fill="currentColor" d="M488 261.8C488 403.3 391.1 504 248 504 110.8 504 0 393.2 0 256S110.8 8 248 8c66.8 0 123 24.5 166.3 64.9l-67.5 64.9C258.5 52.6 94.3 116.6 94.3 256c0 86.5 69.1 156.6 153.7 156.6 98.2 0 135-70.4 140.8-106.9H248v-85.3h236.1c2.3 12.7 3.9 24.9 3.9 41.4z"></path>
                  </svg>
                  Google
                </Button>
                <Button variant="outline" onClick={() => handleSocialLogin('apple')} disabled={isLoading}>
                  <svg className="mr-2 h-4 w-4" aria-hidden="true" focusable="false" data-prefix="fab" data-icon="apple" role="img" xmlns="http://www.w3.org/2000/svg" viewBox="0 0 384 512">
                    <path fill="currentColor" d="M318.7 268.7c-.2-36.7 16.4-64.4 50-84.8-18.8-26.9-47.2-41.7-84.7-44.6-35.5-2.8-74.3 20.7-88.5 20.7-15 0-49.4-19.7-76.4-19.7C63.3 141.2 4 184.8 4 273.5q0 39.3 14.4 81.2c12.8 36.7 59 126.7 107.2 125.2 25.2-.6 43-17.9 75.8-17.9 31.8 0 48.3 17.9 76.4 17.9 48.6-.7 90.4-82.5 102.6-119.3-65.2-30.7-61.7-90-61.7-91.9zm-56.6-164.2c27.3-32.4 24.8-61.9 24-72.5-24.1 1.4-52 16.4-67.9 34.9-17.5 19.8-27.8 44.3-25.6 71.9 26.1 2 49.9-11.4 69.5-34.3z"></path>
                  </svg>
                  Apple
                </Button>
              </div>
            </CardContent>
            <CardFooter className="flex flex-col gap-2 mt-4">
              <div className="flex justify-between w-full items-center">
                <Button variant="link" onClick={handlePasswordReset} className="text-sm px-0 text-muted-foreground hover:text-primary">
                  Esqueceu a senha?
                </Button>
                <Button variant="link" asChild className="text-sm px-0 text-muted-foreground hover:text-primary">
                  <Link href="/register">Cadastre-se</Link>
                </Button>
              </div>
            </CardFooter>
          </Card>
        </div>
      </div>
    </AppLayout>
  );
}
