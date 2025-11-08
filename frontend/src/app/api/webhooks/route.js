import { NextResponse } from 'next/server';
import Stripe from 'stripe';
import { headers } from 'next/headers';
import { makeDonationRequest } from '@/utils/donation';
import { logDonation } from '@/utils/discordLogger';

// This webhook gets called by Stripe whenever a payment goes through. Also recurring payments I believe.

const stripe = new Stripe(process.env.STRIPE_SECRET_KEY);
const webhookSecret = process.env.STRIPE_WEBHOOK_SECRET;

// Configure the runtime
export const runtime = 'nodejs';

export async function POST(request) {
    const body = await request.text();
    const headersList = headers();
    const sig = headersList.get('stripe-signature');

    let event;

    try {
        event = stripe.webhooks.constructEvent(body, sig, webhookSecret);
    } catch (err) {
        console.error(`Webhook Error: ${err.message}`);
        return NextResponse.json(
            { error: `Webhook Error: ${err.message}` },
            { status: 400 }
        );
    }
    // Handle the event
    console.log("STRIPE WEBHOOK " + event.type);
    switch (event.type) {
        case 'checkout.session.completed': {
            const session = event.data.object;

            // Extract metadata
            const {
                donationType,
                firstName,
                lastName,
                idCode,
                amounts,
                companyName,
                companyCode,
                dedicationName,
                dedicationEmail,
                dedicationMessage,
            } = session.metadata;

            // Prepare donation data in the same format as the original request
            const donationData = {
                amount: session.amount_total, // Use correct Stripe field
                type: donationType,
                firstName,
                lastName,
                email: session.customer_details?.email,
                idCode,
                amounts: JSON.parse(amounts),
                paymentMethod: "cardPayments",
                stripePaymentIntent: session.payment_intent,
                finalized: true, // Event "checkout.session.completed" implies the payment is finalized.
            };

            // Add optional fields if they exist
            if (companyName) {
                donationData.companyName = companyName;
                donationData.companyCode = companyCode;
            }

            if (dedicationName && donationType === 'onetime') {
                donationData.dedicationName = dedicationName;
                donationData.dedicationEmail = dedicationEmail;
                donationData.dedicationMessage = dedicationMessage;
            }

            try {
                // First, log the donation to Discord regardless of Strapi success
                try {
                    await logDonation(
                        {
                            amount: donationData.amount / 100, // Convert from cents
                        },
                        'stripe',
                        session.payment_intent,
                    );
                } catch (logError) {
                    console.error('Error logging donation to Discord:', logError);
                }

                // Then try to send the donation to Strapi
                const response = await makeDonationRequest(donationData);

                if (!response.ok) {
                    const error = await response.json();
                    console.error('Error sending donation to Strapi:', error);
                    // We don't throw here as we don't want Stripe to retry the webhook
                    // Just log the error and continue
                } else {
                    console.log("Successfully sent donation to Strapi.");
                }
            } catch (error) {
                console.error('Error processing donation:', error);
            }
            break;
        }

        case 'charge.failed': {
            // TODO: collect emails even if payment failed?
            // const paymentIntent = event.data.object;
            // console.error('event.data.object:', JSON.stringify(event.data.object));
            break;
        }

        case 'charge.dispute.funds_withdrawn': {
            try {
                // First, log the donation to Discord regardless of Strapi success
                try {
                    await logDonation(
                        {
                            amount: event.data.object.amount_total / 100, // Convert from cents
                        },
                        'stripe',
                        event.data.object.payment_intent,
                    );
                } catch (logError) {
                    console.error('Error logging donation to Discord:', logError);
                }

                // Then unconfirm the donation
                // TODO
                // const response = await makeDonationRequest(donationData);
                // if (!response.ok) {
                //     const error = await response.json();
                //     console.error('Error updating donation to Strapi:', error);
                // } else {
                //     console.log("Successfully updated donation to Strapi.");
                // }
            } catch (error) {
                console.error('Error processing donation:', error);
            }
            break;
        }

        case 'charge.succeeded':
        case 'charge.updated':
        case 'payment_intent.succeeded':
        case 'payment_intent.created':
        case 'charge.dispute.created':
        case 'payment_intent.payment_failed':
        case 'customer.subscription.deleted':
        default: {
            console.error('event.data.object:', JSON.stringify(event.data.object));
            break;
        }
    }

    return NextResponse.json({ received: true });
}
