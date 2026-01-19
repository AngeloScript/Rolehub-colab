import { useState, useEffect } from 'react';
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Card, CardContent } from "@/components/ui/card";
import { Plus, Trash2, Tag, Calendar, DollarSign, Users } from "lucide-react";
import { format } from "date-fns";
import { ptBR } from "date-fns/locale";

export type TicketLotInput = {
    id: string; // Temporary ID for frontend management
    name: string;
    price: number;
    quantity: number;
    startDate: string; // ISO date string
    active: boolean;
};

interface TicketLotsManagerProps {
    lots: TicketLotInput[];
    onChange: (lots: TicketLotInput[]) => void;
    currency?: string;
}

export function TicketLotsManager({ lots, onChange, currency = 'R$' }: TicketLotsManagerProps) {
    const [isAdding, setIsAdding] = useState(false);
    const [newLot, setNewLot] = useState<Partial<TicketLotInput>>({
        name: '',
        price: 0,
        quantity: 100,
        active: true,
        startDate: new Date().toISOString().split('T')[0] // Default to today
    });

    // Ensure initial state handling
    useEffect(() => {
        // Optional: if lots prop changes externally (e.g. fetch), component updates naturally 
    }, [lots]);

    const handleAddLot = () => {
        if (!newLot.name || newLot.price === undefined || !newLot.quantity) return;

        const lot: TicketLotInput = {
            id: Math.random().toString(36).substring(7),
            name: newLot.name,
            price: Number(newLot.price),
            quantity: Number(newLot.quantity),
            active: true,
            startDate: newLot.startDate || new Date().toISOString()
        };

        onChange([...lots, lot]);
        setNewLot({
            name: '',
            price: 0,
            quantity: 100,
            active: true,
            startDate: new Date().toISOString().split('T')[0]
        });
        setIsAdding(false);
    };

    const handleRemoveLot = (id: string) => {
        onChange(lots.filter(lot => lot.id !== id));
    };

    return (
        <div className="space-y-4">
            <div className="flex items-center justify-between">
                <Label className="text-base font-semibold flex items-center gap-2">
                    <Tag className="w-4 h-4" />
                    Lotes de Ingressos
                </Label>
                <Button
                    variant="outline"
                    size="sm"
                    onClick={() => setIsAdding(true)}
                    disabled={isAdding}
                >
                    <Plus className="w-4 h-4 mr-2" />
                    Adicionar Lote
                </Button>
            </div>

            <div className="space-y-3">
                {lots.map((lot) => (
                    <Card key={lot.id}>
                        <CardContent className="p-4 flex items-center justify-between">
                            <div>
                                <div className="font-semibold text-base">{lot.name}</div>
                                <div className="flex items-center gap-3 text-sm text-muted-foreground mt-1">
                                    <span className="flex items-center gap-1">
                                        <DollarSign className="w-3 h-3" />
                                        {currency} {Number(lot.price).toFixed(2)}
                                    </span>
                                    <span className="flex items-center gap-1">
                                        <Users className="w-3 h-3" />
                                        {lot.quantity}
                                    </span>
                                    <span className="flex items-center gap-1">
                                        <Calendar className="w-3 h-3" />
                                        {format(new Date(lot.startDate), "dd/MM/yy", { locale: ptBR })}
                                    </span>
                                </div>
                            </div>
                            <Button
                                type="button"
                                variant="ghost"
                                size="icon"
                                onClick={() => handleRemoveLot(lot.id)}
                                className="text-destructive hover:text-destructive/90 hover:bg-destructive/10"
                            >
                                <Trash2 className="w-4 h-4" />
                            </Button>
                        </CardContent>
                    </Card>
                ))}
            </div>

            {
                isAdding && (
                    <Card className="border-dashed">
                        <CardContent className="p-4 space-y-4">
                            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                                <div className="space-y-2">
                                    <Label htmlFor="lotAmount">Nome do Lote</Label>
                                    <Input
                                        id="lotName"
                                        placeholder="Ex: Lote Promocional"
                                        value={newLot.name}
                                        onChange={e => setNewLot({ ...newLot, name: e.target.value })}
                                    />
                                </div>
                                <div className="space-y-2">
                                    <Label htmlFor="lotPrice">Preço ({currency})</Label>
                                    <Input
                                        id="lotPrice"
                                        type="number"
                                        min="0"
                                        step="0.01"
                                        value={newLot.price}
                                        onChange={e => setNewLot({ ...newLot, price: parseFloat(e.target.value) })}
                                    />
                                </div>
                                <div className="space-y-2">
                                    <Label htmlFor="lotQuantity">Quantidade Disponível</Label>
                                    <Input
                                        id="lotQuantity"
                                        type="number"
                                        min="1"
                                        step="1"
                                        value={newLot.quantity}
                                        onChange={e => setNewLot({ ...newLot, quantity: parseInt(e.target.value) })}
                                    />
                                </div>
                                <div className="space-y-2">
                                    <Label htmlFor="lotStartDate">Início das Vendas</Label>
                                    <Input
                                        id="lotStartDate"
                                        type="date"
                                        value={newLot.startDate}
                                        onChange={e => setNewLot({ ...newLot, startDate: e.target.value })}
                                    />
                                </div>
                            </div>
                            <div className="flex justify-end gap-2 pt-2">
                                <Button
                                    type="button"
                                    variant="ghost"
                                    onClick={() => setIsAdding(false)}
                                >
                                    Cancelar
                                </Button>
                                <Button
                                    type="button"
                                    onClick={handleAddLot}
                                    disabled={!newLot.name || newLot.price === undefined || !newLot.quantity}
                                >
                                    Adicionar
                                </Button>
                            </div>
                        </CardContent>
                    </Card>
                )
            }
        </div >
    );
}
