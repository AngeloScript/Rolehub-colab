import { NextRequest, NextResponse } from "next/server";
import MercadoPagoConfig, { Preference } from "mercadopago";
// import { createClient } from "@supabase/supabase-js";

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
        const { eventId, title, price, quantity, userId, email, payerFirstName, payerLastName } = body;

        // Security Check: Verify price from DB (Optional but recommended)
        /*
        const { data: event } = await supabase.from('events').select('price').eq('id', eventId).single();
        if (event && event.price !== price) {
            return NextResponse.json({ error: "Price mismatch" }, { status: 400 });
        }
        */

        let appUrl = process.env.NEXT_PUBLIC_APP_URL || req.headers.get('origin') || 'http://localhost:9002';
        // Ensure appUrl doesn't have trailing slash
        appUrl = appUrl.replace(/\/$/, "");

        if (!appUrl.startsWith("http")) {
            console.warn("WARNING: appUrl does not start with http/https. Fallback to localhost.");
            appUrl = "http://localhost:9002";
        }

        const preference = new Preference(client);

        const preferenceData = {
            body: {
                items: [
                    {
                        id: eventId,
                        title: title.substring(0, 255), // limit title length
                        quantity: Number(quantity) || 1,
                        unit_price: Number(price), // Ensure it's a number
                        currency_id: 'BRL',
                    }
                ],
                payer: {
                    email: email || 'test_user_123@test.com', // MP requires valid email format
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
