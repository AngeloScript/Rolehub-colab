
"use client";

import { useState } from 'react';
import Link from 'next/link';
import { useRouter } from 'next/navigation';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { z } from 'zod';
import { AtSign, Lock, User, LogIn, Loader2, AlertCircle } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle } from '@/components/ui/card';
import { Input } from '@/components/ui/input';
import { Form, FormControl, FormField, FormItem, FormLabel, FormMessage } from '@/components/ui/form';
import { Alert, AlertDescription, AlertTitle } from "@/components/ui/alert";
import { RoleHubAnimatedLogo } from '@/components/RoleHubAnimatedLogo';
import { useToast } from '@/hooks/use-toast';
import { supabase } from '@/lib/supabase';
import { AppLayout } from '@/components/layout/AppLayout';

const registerSchema = z.object({
  name: z.string().min(3, { message: "O nome deve ter pelo menos 3 caracteres." }),
  email: z.string().email({ message: "Por favor, insira um email válido." }),
  password: z.string().min(6, { message: "A senha deve ter pelo menos 6 caracteres." }),
});

type RegisterFormValues = z.infer<typeof registerSchema>;

export default function RegisterPage() {
  const router = useRouter();
  const { toast } = useToast();
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);


  const form = useForm<RegisterFormValues>({
    resolver: zodResolver(registerSchema),
    defaultValues: {
      name: '',
      email: '',
      password: '',
    },
  });

  const onSubmit = async (data: RegisterFormValues) => {
    setIsLoading(true);
    setError(null);

    try {
      const { data: authData, error: authError } = await supabase.auth.signUp({
        email: data.email,
        password: data.password,
        options: {
          data: {
            name: data.name,
            avatar_url: `https://placehold.co/128x128.png?text=${data.name.charAt(0).toUpperCase()}`,
          }
        }
      });

      if (authError) throw authError;

      // Note: User creation in 'users' table is handled by Supabase Trigger (handle_new_user)
      // We don't need to manually insert into 'users' table here anymore.

      toast({
        title: "Cadastro realizado com sucesso!",
        description: "Sua conta foi criada. Verifique seu email para confirmar.",
      });
      router.push('/login');

    } catch (err: any) {
      if (err.message === 'User already registered') {
        setError("Este email já está em uso. Tente fazer login.");
      } else {
        setError("Ocorreu um erro inesperado durante o cadastro.");
        console.error(err);
      }
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <AppLayout>
      <div className="flex items-center justify-center min-h-screen bg-background p-4 relative overflow-hidden">
        <div className="absolute -top-1/2 -left-1/4 w-full h-full bg-primary/10 rounded-full filter blur-3xl animate-pulse opacity-20"></div>
        <div className="absolute -bottom-1/2 -right-1/4 w-full h-full bg-secondary/10 rounded-full filter blur-3xl animate-pulse opacity-20 animation-delay-4000"></div>

        <div className="relative z-10 w-full max-w-sm">
          <Link href="/">
            <div className="flex justify-center items-center mb-6 relative">
              <RoleHubAnimatedLogo className="w-[250px] h-[80px]" />
            </div>
          </Link>
          <Card className="bg-card/60 backdrop-blur-lg border-border/20 shadow-xl shadow-primary/5">
            <CardHeader className="text-center">
              <CardTitle className="text-2xl font-headline">Crie Sua Conta</CardTitle>
              <CardDescription>Junte-se à comunidade e encontre seu próximo rolê.</CardDescription>
            </CardHeader>
            <CardContent>
              <Form {...form}>
                <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-6">
                  {(error) && (
                    <Alert variant="destructive">
                      <AlertCircle className="h-4 w-4" />
                      <AlertTitle>Erro no Cadastro</AlertTitle>
                      <AlertDescription>{error}</AlertDescription>
                    </Alert>
                  )}
                  <FormField
                    control={form.control}
                    name="name"
                    render={({ field }) => (
                      <FormItem>
                        <FormLabel className="sr-only">Nome</FormLabel>
                        <FormControl>
                          <div className="relative">
                            <User className="absolute left-3 top-1/2 -translate-y-1/2 w-5 h-5 text-muted-foreground" />
                            <Input {...field} placeholder="Seu nome" type="text" className="pl-10 h-12 text-base bg-background/50 focus:bg-background" />
                          </div>
                        </FormControl>
                        <FormMessage />
                      </FormItem>
                    )}
                  />
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
                        Cadastrar
                      </>
                    )}
                  </Button>
                </form>
              </Form>
            </CardContent>
            <CardFooter className="flex flex-col gap-2 mt-4">
              <div className="flex justify-center w-full items-center">
                <Button variant="link" asChild className="text-sm px-0 text-muted-foreground hover:text-primary">
                  <Link href="/login">Já tem uma conta? Entre</Link>
                </Button>
              </div>
            </CardFooter>
          </Card>
        </div>
      </div>
    </AppLayout>
  );
}
