import { useState, useEffect, useCallback } from 'react';
import { supabase } from '@/lib/supabase';
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import {
    Dialog,
    DialogContent,
    DialogDescription,
    DialogHeader,
    DialogTitle,
    DialogTrigger,
} from "@/components/ui/dialog";
import {
    AlertDialog,
    AlertDialogAction,
    AlertDialogCancel,
    AlertDialogContent,
    AlertDialogDescription,
    AlertDialogFooter,
    AlertDialogHeader,
    AlertDialogTitle,
    AlertDialogTrigger
} from "@/components/ui/alert-dialog";
import { Switch } from "@/components/ui/switch";
import { Plus, Trash2, DollarSign, Users, Pencil, Settings2, Loader2, Save } from "lucide-react";
import { useToast } from "@/hooks/use-toast";

import { EventLot } from '@/lib/types';

interface EventLotsEditorProps {
    eventId: string;
    currency?: string;
}

export function EventLotsEditor({ eventId, currency = 'BRL' }: EventLotsEditorProps) {
    const { toast } = useToast();
    const [open, setOpen] = useState(false);
    const [loading, setLoading] = useState(false);
    const [lots, setLots] = useState<EventLot[]>([]);

    // Form Stats
    const [isEditing, setIsEditing] = useState(false);
    const [editingId, setEditingId] = useState<string | null>(null);
    const [formData, setFormData] = useState({
        name: '',
        price: 0,
        quantity: 100,
        startDate: new Date().toISOString().split('T')[0],
        active: true
    });

    const fetchLots = useCallback(async () => {
        setLoading(true);
        const { data, error } = await supabase
            .from('event_lots')
            .select('*')
            .eq('event_id', eventId)
            .order('price', { ascending: true });

        if (error) {
            console.error('Error fetching lots:', error);
            toast({ variant: 'destructive', title: 'Erro ao carregar lotes' });
        } else {
            setLots(data || []);
        }
        setLoading(false);
    }, [eventId, toast]);

    useEffect(() => {
        if (open) {
            fetchLots();
        }
    }, [open, fetchLots]);

    const resetForm = () => {
        setFormData({
            name: '',
            price: 0,
            quantity: 100,
            startDate: new Date().toISOString().split('T')[0],
            active: true
        });
        setIsEditing(false);
        setEditingId(null);
    };

    const handleEdit = (lot: EventLot) => {
        setFormData({
            name: lot.name,
            price: lot.price,
            quantity: lot.quantity,
            startDate: lot.start_date ? lot.start_date.split('T')[0] : new Date().toISOString().split('T')[0],
            active: lot.active
        });
        setEditingId(lot.id);
        setIsEditing(true);
    };

    const handleSave = async () => {
        if (!formData.name) return;

        setLoading(true);

        try {
            if (isEditing && editingId) {
                // UPDATE
                const { error } = await supabase
                    .from('event_lots')
                    .update({
                        name: formData.name,
                        price: formData.price,
                        quantity: formData.quantity,
                        start_date: formData.startDate,
                        active: formData.active
                    })
                    .eq('id', editingId);

                if (error) throw error;
                toast({ title: "Lote atualizado!" });

            } else {
                // CREATE
                const { error } = await supabase
                    .from('event_lots')
                    .insert({
                        event_id: eventId,
                        name: formData.name,
                        price: formData.price,
                        quantity: formData.quantity,
                        start_date: formData.startDate,
                        active: formData.active
                    });

                if (error) throw error;
                toast({ title: "Lote criado!" });
            }

            await fetchLots();
            resetForm();

        } catch (error) {
            console.error('Error saving lot:', error);
            toast({ variant: 'destructive', title: 'Erro ao salvar lote' });
        } finally {
            setLoading(false);
        }
    };

    const handleDelete = async (id: string) => {
        try {
            const { error } = await supabase
                .from('event_lots')
                .delete()
                .eq('id', id);

            if (error) throw error;

            toast({ title: "Lote removido" });
            fetchLots();
        } catch (error) {
            console.error('Error deleting lot:', error);
            toast({ variant: 'destructive', title: 'Erro ao deletar' });
        }
    };

    const handleToggleActive = async (lot: EventLot) => {
        // Optimistic update
        const updatedLots = lots.map(l => l.id === lot.id ? { ...l, active: !l.active } : l);
        setLots(updatedLots);

        try {
            const { error } = await supabase
                .from('event_lots')
                .update({ active: !lot.active })
                .eq('id', lot.id);

            if (error) {
                // Revert if error
                setLots(lots);
                throw error;
            }
        } catch (error) {
            console.error('Error toggling active:', error);
            toast({ variant: 'destructive', title: 'Erro ao atualizar status' });
        }
    };

    return (
        <Dialog open={open} onOpenChange={(val) => {
            setOpen(val);
            if (!val) resetForm();
        }}>
            <DialogTrigger asChild>
                <Button variant="outline" className="gap-2">
                    <Settings2 className="w-4 h-4" />
                    Gerenciar Lotes
                </Button>
            </DialogTrigger>
            <DialogContent className="max-w-2xl max-h-[90vh] overflow-y-auto">
                <DialogHeader>
                    <DialogTitle>Gerenciar Lotes de Ingressos</DialogTitle>
                    <DialogDescription>
                        Crie, edite e ative os lotes disponíveis para venda.
                    </DialogDescription>
                </DialogHeader>

                <div className="space-y-6 py-4">
                    {/* Add/Edit Form */}
                    <div className="p-4 border rounded-lg bg-muted/30 space-y-4">
                        <div className="font-semibold flex items-center gap-2">
                            {isEditing ? <Pencil className="w-4 h-4" /> : <Plus className="w-4 h-4" />}
                            {isEditing ? 'Editar Lote' : 'Novo Lote'}
                        </div>
                        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                            <div className="space-y-2">
                                <Label>Nome</Label>
                                <Input
                                    placeholder="Ex: 1º Lote"
                                    value={formData.name}
                                    onChange={e => setFormData({ ...formData, name: e.target.value })}
                                />
                            </div>
                            <div className="space-y-2">
                                <Label>Preço ({currency})</Label>
                                <Input
                                    type="number"
                                    min="0"
                                    step="0.01"
                                    value={formData.price}
                                    onChange={e => setFormData({ ...formData, price: parseFloat(e.target.value) })}
                                />
                            </div>
                            <div className="space-y-2">
                                <Label>Quantidade</Label>
                                <Input
                                    type="number"
                                    min="1"
                                    value={formData.quantity}
                                    onChange={e => setFormData({ ...formData, quantity: parseInt(e.target.value) })}
                                />
                            </div>
                            <div className="space-y-2">
                                <Label>Início das Vendas</Label>
                                <Input
                                    type="date"
                                    value={formData.startDate}
                                    onChange={e => setFormData({ ...formData, startDate: e.target.value })}
                                />
                            </div>
                        </div>
                        <div className="flex items-center justify-between pt-2">
                            <div className="flex items-center gap-2">
                                <Switch
                                    checked={formData.active}
                                    onCheckedChange={(c) => setFormData({ ...formData, active: c })}
                                    id="active-switch"
                                />
                                <Label htmlFor="active-switch" className="cursor-pointer">
                                    Ativo para venda imediata
                                </Label>
                            </div>
                            <div className="flex gap-2">
                                {isEditing && (
                                    <Button variant="ghost" onClick={resetForm} size="sm">
                                        Cancelar
                                    </Button>
                                )}
                                <Button onClick={handleSave} disabled={loading || !formData.name} size="sm">
                                    {loading && <Loader2 className="w-3 h-3 animate-spin mr-2" />}
                                    <Save className="w-3 h-3 mr-2" />
                                    {isEditing ? 'Atualizar' : 'Salvar Lote'}
                                </Button>
                            </div>
                        </div>
                    </div>

                    <div className="space-y-3">
                        <Label>Lotes Existentes</Label>
                        {loading && !lots.length ? (
                            <div className="flex justify-center py-4"><Loader2 className="animate-spin text-muted-foreground" /></div>
                        ) : lots.length === 0 ? (
                            <div className="text-center py-8 text-muted-foreground bg-muted/20 rounded-lg">
                                Nenhum lote criado ainda.
                            </div>
                        ) : (
                            lots.map(lot => (
                                <div key={lot.id} className={`flex flex-col sm:flex-row sm:items-center justify-between gap-4 p-4 border rounded-lg transition-colors ${!lot.active ? 'opacity-60 bg-muted/40' : 'bg-card'}`}>
                                    <div className="space-y-1">
                                        <div className="flex items-center gap-2">
                                            <span className="font-bold text-lg">{lot.name}</span>
                                            {!lot.active && (
                                                <span className="text-[10px] uppercase bg-muted text-muted-foreground px-2 py-0.5 rounded font-bold">
                                                    Inativo
                                                </span>
                                            )}
                                        </div>
                                        <div className="flex items-center gap-3 text-sm text-muted-foreground">
                                            <span className="flex items-center gap-1">
                                                <DollarSign className="w-3 h-3" />
                                                {new Intl.NumberFormat('pt-BR', { style: 'currency', currency: currency }).format(lot.price)}
                                            </span>
                                            <span className="flex items-center gap-1">
                                                <Users className="w-3 h-3" />
                                                {lot.quantity} un.
                                            </span>
                                        </div>
                                    </div>

                                    <div className="flex items-center gap-2 self-end sm:self-center">
                                        <div className="flex items-center gap-2 mr-2 border-r pr-4">
                                            <Label className="text-xs text-muted-foreground">Vendas:</Label>
                                            <Switch
                                                checked={lot.active}
                                                onCheckedChange={() => handleToggleActive(lot)}
                                            />
                                        </div>

                                        <Button variant="ghost" size="icon" onClick={() => handleEdit(lot)}>
                                            <Pencil className="w-4 h-4 text-muted-foreground" />
                                        </Button>

                                        <AlertDialog>
                                            <AlertDialogTrigger asChild>
                                                <Button variant="ghost" size="icon" className="text-destructive hover:text-destructive hover:bg-destructive/10">
                                                    <Trash2 className="w-4 h-4" />
                                                </Button>
                                            </AlertDialogTrigger>
                                            <AlertDialogContent>
                                                <AlertDialogHeader>
                                                    <AlertDialogTitle>Excluir lote?</AlertDialogTitle>
                                                    <AlertDialogDescription>
                                                        Tem certeza que deseja excluir o lote <strong>{lot.name}</strong>? Esta ação não pode ser desfeita.
                                                    </AlertDialogDescription>
                                                </AlertDialogHeader>
                                                <AlertDialogFooter>
                                                    <AlertDialogCancel>Mudar de ideia</AlertDialogCancel>
                                                    <AlertDialogAction onClick={() => handleDelete(lot.id)} className="bg-destructive hover:bg-destructive/90">
                                                        Excluir
                                                    </AlertDialogAction>
                                                </AlertDialogFooter>
                                            </AlertDialogContent>
                                        </AlertDialog>
                                    </div>
                                </div>
                            ))
                        )}
                    </div>
                </div>
            </DialogContent>
        </Dialog>
    );
}
