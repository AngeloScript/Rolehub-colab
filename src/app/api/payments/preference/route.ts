import { NextRequest, NextResponse } from "next/server";
import MercadoPagoConfig, { Preference } from "mercadopago";
import { createClient } from "@supabase/supabase-js";

// Initialize Supabase Admin Client (to fetch accurate prices securely if needed, though here we trust the passed data for MVP speed, 
// IDEALLY we should fetch price from DB using eventId to prevent frontend tampering)
// const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL!;
// const supabaseServiceKey = process.env.SUPABASE_SERVICE_ROLE_KEY || process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!; // Fallback for dev
// const supabase = createClient(supabaseUrl, supabaseServiceKey);

// Initialize Mercado Pago
// NOTE: User needs to set MP_ACCESS_TOKEN in .env.local
const client = new MercadoPagoConfig({
    accessToken: process.env.MP_ACCESS_TOKEN || 'TEST-00000000-0000-0000-0000-000000000000',
    options: { timeout: 5000 }
});

export async function POST(req: NextRequest) {
    try {
        const body = await req.json();
        const { eventId, title, quantity, userId, email, payerFirstName, payerLastName, lotId } = body;

        // Initialize Supabase Admin Client
        const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL!;
        const supabaseServiceKey = process.env.SUPABASE_SERVICE_ROLE_KEY || process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!;
        const supabase = createClient(supabaseUrl, supabaseServiceKey);

        let validatedPrice = 0;
        let finalTitle = title;

        // 1. Validate Price Server-Side
        if (lotId) {
            // If buying a specific lot, fetch that lot's price
            const { data: lot, error: lotError } = await supabase
                .from('event_lots')
                .select('price, name')
                .eq('id', lotId)
                .single();

            if (lotError || !lot) {
                return NextResponse.json({ error: "Lote de ingresso inválido ou não encontrado." }, { status: 400 });
            }
            validatedPrice = Number(lot.price);
            finalTitle = `${title.split(' - ')[0]} - ${lot.name}`; // Enforce correct name too
        } else {
            // Fallback to base event price (if no lots)
            const { data: event, error: eventError } = await supabase
                .from('events')
                .select('price')
                .eq('id', eventId)
                .single();

            if (eventError || !event) {
                return NextResponse.json({ error: "Evento inválido." }, { status: 400 });
            }
            validatedPrice = Number(event.price);
        }

        // Security Check: Block if validated price is missing (unless free event, but flow assumes payment)
        if (validatedPrice < 0) {
            return NextResponse.json({ error: "Preço inválido." }, { status: 400 });
        }

        /* 
           OPTIONAL: We could compare with req.body.price and error out if mismatch, 
           but it's safer to just overwrite with the correct price.
           The user will see the correct price at checkout.
        */

        let appUrl = process.env.NEXT_PUBLIC_APP_URL || req.headers.get('origin') || 'http://localhost:9002';
        appUrl = appUrl.replace(/\/$/, "");

        if (!appUrl.startsWith("http")) {
            appUrl = "http://localhost:9002";
        }

        const preference = new Preference(client);

        const preferenceData = {
            body: {
                items: [
                    {
                        id: eventId,
                        title: finalTitle.substring(0, 255),
                        quantity: Number(quantity) || 1,
                        unit_price: validatedPrice, // USE VALIDATED PRICE
                        currency_id: 'BRL',
                    }
                ],
                payer: {
                    email: email || 'test_user_123@test.com',
                    name: payerFirstName || 'Guest',
                    surname: payerLastName || 'User'
                },
                back_urls: {
                    success: `${appUrl}/payment/success`,
                    failure: `${appUrl}/payment/failure`,
                    pending: `${appUrl}/payment/failure`,
                },
                auto_return: appUrl.includes('localhost') ? undefined : 'approved',
                metadata: {
                    user_id: userId,
                    event_id: eventId,
                    lot_id: lotId || null
                }
            }
        };

        const result = await preference.create(preferenceData);

        return NextResponse.json({
            id: result.id,
            init_point: result.init_point,
            sandbox_init_point: result.sandbox_init_point
        });

    } catch (error) {
        console.error("Error creating preference:", error);
        return NextResponse.json({ error: "Error creating payment preference" }, { status: 500 });
    }
}
