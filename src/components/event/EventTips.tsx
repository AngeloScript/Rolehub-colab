import {
    Accordion,
    AccordionContent,
    AccordionItem,
    AccordionTrigger,
} from "@/components/ui/accordion"
import { Lightbulb } from "lucide-react"

export function EventTips() {
    return (
        <div className="space-y-4">
            <h3 className="text-lg font-semibold flex items-center gap-2">
                <Lightbulb className="w-5 h-5 text-yellow-500" />
                Dicas do Rolê
            </h3>
            <Accordion type="single" collapsible className="w-full">
                <AccordionItem value="item-1">
                    <AccordionTrigger>Como chegar?</AccordionTrigger>
                    <AccordionContent>
                        Use aplicativos de transporte ou verifique as linhas de ônibus que passam perto. Se for beber, não dirija!
                    </AccordionContent>
                </AccordionItem>
                <AccordionItem value="item-2">
                    <AccordionTrigger>O que levar?</AccordionTrigger>
                    <AccordionContent>
                        Documento com foto, ingresso (se houver), dinheiro/cartão e muita animação. Evite levar objetos de valor desnecessários.
                    </AccordionContent>
                </AccordionItem>
                <AccordionItem value="item-3">
                    <AccordionTrigger>Segurança</AccordionTrigger>
                    <AccordionContent>
                        Fique atento aos seus pertences. Combine um ponto de encontro com seus amigos caso se percam.
                    </AccordionContent>
                </AccordionItem>
            </Accordion>
        </div>
    )
}
