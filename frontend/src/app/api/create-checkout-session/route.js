import { NextResponse } from 'next/server';
import Stripe from 'stripe';

// This route is called after the user presses the donate button. We collect all the form inputs from them, and redirect
// them to stripe's checkout page.

const stripe = new Stripe(process.env.STRIPE_SECRET_KEY);

export async function POST(request) {
    try {
        const data = await request.json();

        // Create line items for the donation
        const lineItems = [{
            price_data: {
                currency: "eur",
                product_data: {
                    name: data.type === 'recurring' ? 'Monthly Donation' : 'One-time Donation',
                    description: `Donation from ${data.firstName} ${data.lastName}`,
                },
                unit_amount: data.amount,
                ...(data.type === 'recurring' && {
                    recurring: {
                        interval: 'month',
                    },
                }),
            },
            quantity: 1,
        }];

        // Get the base URL from environment or use the current request origin
        const baseUrl = process.env.NEXT_PUBLIC_SITE_URL || new URL(request.url).origin;

        // Create the checkout session
        const session = await stripe.checkout.sessions.create({
            line_items: lineItems,
            mode: data.type === 'recurring' ? 'subscription' : 'payment',
            success_url: `${baseUrl}/donation/success?session_id={CHECKOUT_SESSION_ID}`,
            cancel_url: `${baseUrl}/donation/cancel`,
            customer_email: data.email,
            metadata: {
                donationType: data.type,
                firstName: data.firstName,
                lastName: data.lastName,
                idCode: data.idCode,
                amounts: JSON.stringify(data.amounts),
                ...(data.companyName && {
                    companyName: data.companyName,
                    companyCode: data.companyCode,
                }),
                ...(data.dedicationName && {
                    dedicationName: data.dedicationName,
                    dedicationEmail: data.dedicationEmail,
                    dedicationMessage: data.dedicationMessage,
                }),
                ...(data.tracking?.fbc && {fbc: data.tracking?.fbc}),
                ...(data.tracking?.fbp && {fbp: data.tracking?.fbp}),
            },
        });

        return NextResponse.json({ url: session.url });
    } catch (error) {
        console.error('Error:', error);
        return NextResponse.json(
            { error: error.message },
            { status: error.statusCode || 500 }
        );
    }
}
