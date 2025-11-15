import {NextResponse} from "next/server";
import { makeDonationRequest } from "@/utils/strapi";

// TODO: unused, revise when implementing bank transfers.

export async function POST(request) {
    let loggedToDiscord = false;
    let loggedToStrapi = false;
    try {
        const donation = JSON.parse(await request.text());
        console.log("Received bank donation intention: " + JSON.stringify(donation));

        // First, always log donation to Discord
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
            // await logDonation(
            //     {
            //         id: donation.id,
            //         amount: donation.amount + donation.tipAmount,
            //         tipOrganization: donation.tipOrganization,
            //     },
            //     'bank',
            //     null,
            //     organizations
            // );
            // loggedToDiscord = true;
        } catch (logError) {
            console.error('Error logging donation to Discord:', logError);
        }

        // Then try to log donation to Strapi
        try {
            const strapiResponse = await makeDonationRequest(donation);
            if (!strapiResponse.ok) {
                const error = await strapiResponse.json();
                console.error('Error sending donation to Strapi:', error);
            } else {
                loggedToStrapi = true;
                console.log("Successfully sent donation to Strapi: " + JSON.stringify(donation));
            }
        } catch (strapiError) {
            console.error('Error calling Strapi API:', strapiError);
        }
    } catch (error) {
        console.error('Error processing donation:', error);
    }
    if (!(loggedToDiscord || loggedToStrapi)) {
        return NextResponse.error();
    }

    return NextResponse.json({ received: true });
}
