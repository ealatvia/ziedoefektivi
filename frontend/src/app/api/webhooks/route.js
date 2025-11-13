import { NextResponse } from 'next/server';
import Stripe from 'stripe';
import { headers } from 'next/headers';
import { makeDisputeRequest, makeDonationRequest, makeStripeRecurringDonationRequest } from '@/utils/donation';
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
        case 'checkout.session.completed': { // Both single and first time recurring.
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
                stripePaymentIntentId: session.payment_intent,
                stripeSubscriptionId: session.subscription,
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
                        'stripe (onetime)',
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
                const response = await makeDisputeRequest(event.data.object);
                if (!response.ok) {
                    const error = await response.json();
                    console.error('Error disputing donation in Strapi:', error);
                } else {
                    console.log("Successfully disputed donation in Strapi.");
                }
            } catch (error) {
                console.error('Error processing donation:', error);
            }
            break;
        }

        case 'invoice.payment_succeeded': {// Recurring only.
            try {
                // First, log the donation to Discord regardless of Strapi success
                try {
                    await logDonation(
                        {
                            amount: event.data.object.amount_total / 100, // Convert from cents
                        },
                        'stripe (recurring)',
                        event.data.object.payment_intent,
                    );
                } catch (logError) {
                    console.error('Error sending recurring donation to Discord:', logError);
                }

                const response = await makeStripeRecurringDonationRequest(event.data.object);
                if (!response.ok) {
                    const error = await response.json();
                    console.error('Error sending recurring donation in Strapi:', error);
                } else {
                    console.log("Successfully sent recurring donation in Strapi.");
                }
            } catch (error) {
                console.error('Error processing recurring donation:', error);
            }
            break;
        }
        case 'charge.succeeded': // Both single and recurring
        case 'charge.updated': // Both single and recurring
        case 'payment_intent.succeeded': // Both single and recurring
        case 'payment_intent.created': // Both single and recurring
        case 'charge.dispute.created': // Both single and recurring
        case 'payment_intent.payment_failed': // Both single and recurring
        case 'customer.subscription.deleted': // ?
        case 'invoice_payment.paid': // Recurring only.
        case 'invoice.created': // Recurring only.
        case 'invoice.finalized': // Recurring only.
        case 'invoice.paid': // Recurring only.
        case 'invoice.upcoming': // Recurring only (except first time).
        case 'invoice.updated': // Recurring only.
        case 'customer.created': // Recurring only (first time only, optional).
        case 'customer.updated': // Recurring only.
        case 'customer.subscription.updated': // Recurring only.
        case 'customer.subscription.created': // Recurring only (first time only).
        case 'customer.updated': // Recurring only.
        case 'customer.subscription.updated': // Recurring only.
        default: {
            console.error('event.data.object:', JSON.stringify(event.data.object));
            break;
        }
    }

    return NextResponse.json({ received: true });
}
