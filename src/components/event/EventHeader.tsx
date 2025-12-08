"use client";

import Image from 'next/image';
import Link from 'next/link';
import { ArrowLeft, Trash2 } from 'lucide-react';
import { Button } from '@/components/ui/button';
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
  AlertDialogTrigger,
} from "@/components/ui/alert-dialog";
import { motion } from 'framer-motion';
import type { Event } from '@/lib/types';

interface EventHeaderProps {
  event: Event;
  isOrganizer: boolean;
  onDelete: () => void;
}

export function EventHeader({ event, isOrganizer, onDelete }: EventHeaderProps) {
  return (
    <div className="relative h-72 md:h-96">
      <Image
        src={event.image}
        alt={event.title}
        fill
        className="object-cover"
        data-ai-hint={event.imageHint}
        priority
      />
      <div className="absolute inset-0 bg-gradient-to-t from-background via-background/80 to-transparent" />
      <div className="absolute top-4 left-4 z-10">
        <Link href="/events">
          <Button variant="ghost" size="icon" className="bg-background/50 hover:bg-background/80 rounded-full h-9 w-9 text-foreground">
            <ArrowLeft className="w-5 h-5" />
          </Button>
        </Link>
      </div>
      {isOrganizer && (
        <div className="absolute top-4 right-4 z-10">
          <AlertDialog>
            <AlertDialogTrigger asChild>
              <Button variant="destructive" size="icon" className="bg-destructive/50 hover:bg-destructive/80 rounded-full h-9 w-9">
                <Trash2 className="w-4 h-4" />
              </Button>
            </AlertDialogTrigger>
            <AlertDialogContent>
              <AlertDialogHeader>
                <AlertDialogTitle>Tem certeza?</AlertDialogTitle>
                <AlertDialogDescription>
                  Esta ação não pode ser desfeita. Isso excluirá permanentemente o evento
                  <strong className="text-destructive-foreground"> {event.title} </strong>
                  e removerá seus dados de nossos servidores.
                </AlertDialogDescription>
              </AlertDialogHeader>
              <AlertDialogFooter>
                <AlertDialogCancel>Cancelar</AlertDialogCancel>
                <AlertDialogAction onClick={onDelete}>Excluir</AlertDialogAction>
              </AlertDialogFooter>
            </AlertDialogContent>
          </AlertDialog>
        </div>
      )}
      <div className="absolute bottom-0 left-0 p-4 md:p-6 w-full">
        <motion.h1
          className="text-4xl md:text-6xl font-headline font-bold text-transparent bg-clip-text animate-gradient"
          style={{
            backgroundImage: `linear-gradient(45deg, hsl(var(--page-primary)), hsl(var(--page-secondary)), hsl(var(--page-primary)))`,
            backgroundSize: '200% 200%',
          }}
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.8, delay: 0.2 }}
        >
          {event.title}
        </motion.h1>
      </div>
    </div>
  );
}
