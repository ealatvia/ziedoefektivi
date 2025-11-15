import { NextResponse } from 'next/server';
import Stripe from 'stripe';

// API route used by the success page to fetch the result of the stripe session and display some info I guess.

const stripe = new Stripe(process.env.STRIPE_SECRET_KEY);

export async function GET(request) {
    const { searchParams } = new URL(request.url);
    const sessionId = searchParams.get('session_id');

    try {
        if (sessionId) {
            const session = await stripe.checkout.sessions.retrieve(sessionId, {
                expand: ['payment_intent', 'subscription'],
            });

            return NextResponse.json({
                paymentIntentId: session.payment_intent?.id,
                customer_email: session.customer_email,
                amount_total: session.amount_total,
                subscriptionId: session.subscription?.id,
                metadata: session.metadata, // Include the metadata from the session for logging
            });
        } else {
            return NextResponse.json(
                { error: 'Session ID is required' },
                { status: 400 }
            );
        }
    } catch (error) {
        console.error('Error:', error);
        return NextResponse.json(
            { error: error.message },
            { status: error.statusCode || 500 }
        );
    }
}
