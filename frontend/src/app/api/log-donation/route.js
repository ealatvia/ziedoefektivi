import { NextResponse } from 'next/server';
import { logDonation } from '@/utils/discordLogger';

// Helper function to log to discord when user returns from a successful Stripe checkout page.
// Because this can be spoofed, we mention this is a pending donation, and wait for Stripe to call our webhook.
export async function POST(request) {
    try {
        const { donation, paymentId, organizations } = await request.json();
        
        if (!donation) {
            return NextResponse.json(
                { error: 'Donation data is required' },
                { status: 400 }
            );
        }
        
        // Always set payment method to 'stripe (pending)' for security
        // This ensures users can't manipulate the payment method from the client
        const paymentMethod = 'stripe (pending)';
        
        // Log the donation to Discord
        await logDonation(
            donation,
            paymentMethod,
            paymentId,
            organizations || []
        );
        
        return NextResponse.json({ success: true });
    } catch (error) {
        console.error('Error logging donation:', error);
        return NextResponse.json(
            { error: error.message },
            { status: 500 }
        );
    }
}
