import {NextResponse} from "next/server";
import {makeDonationRequest} from "@/utils/donation";
import {logDonation} from "@/lib/discordLogger";

export async function POST(request) {
    try {
        const donation = JSON.parse(await request.text());
        console.log("Received bank donation intention: " + JSON.stringify(donation));

        // Log donation to Discord
        try {
            // Parse organization info
            const organizations = [];
            if (donation.organizationInfo) {
                const orgData = JSON.parse(donation.organizationInfo);
                Object.values(orgData).forEach(org => {
                    organizations.push({
                        name: org.name,
                        amount: org.amount || 0, // Use the exact amount
                        percentage: Math.round(org.percentage || 0), // Keep percentage for backwards compatibility
                        order: org.order // Include order for sorting
                    });
                });
            }

            // Log to dedicated Discord channel
            await logDonation(
                {
                    id: donation.id,
                    amount: donation.amount + donation.tipAmount,
                    tipOrganization: donation.tipOrganization,
                },
                'bank',
                null,
                organizations
            );
        } catch (logError) {
            console.error('Error logging donation to Discord:', logError);
        }

        // Log donation to strapi
        const strapiResponse = await makeDonationRequest(donation);
        if (!strapiResponse.ok) {
            const error = await strapiResponse.json();
            console.error('Error sending donation to Strapi:', error);
            return NextResponse.error();
        } else {
            console.log("Successfully sent donation to Strapi: " + JSON.stringify(donation));
        }
    } catch (error) {
        console.error('Error processing donation:', error);
    }
    return NextResponse.json({ received: true });
}
