'use client';

import { useEffect, useState } from 'react';
import { useSearchParams } from 'next/navigation';

export default function SuccessPage({
                                        title = "Paldies par ziedojumu!",
                                        description = "Tavs ziedojums ir veiksmīgi saņemts.",
                                        recurringDescription = "Tavs pirmais regulārā ziedojuma maksājums ir saņemts. Lai atceltu vai veiktu izmainas regularājam ziedojumam, sazinieties ar mums!",
                                    }) {
    const searchParams = useSearchParams();
    const [loading, setLoading] = useState(true);
    const [session, setSession] = useState(null);

    useEffect(() => {
        const sessionId = searchParams.get('session_id');
        if (sessionId) {
            fetch(`/api/checkout-session?session_id=${sessionId}`)
                .then((res) => res.json())
                .then((data) => {
                    setSession(data);
                    setLoading(false);
                    
                    // Log the donation to Discord with status "pending"
                    if (data.metadata) {
                        logDonationToDiscord(data);
                    }
                })
                .catch((err) => {
                    console.error('Error:', err);
                    setLoading(false);
                });
        } else {
            setLoading(false);
        }
    }, [searchParams]);

    // Function to log the donation to Discord
    const logDonationToDiscord = async (sessionData) => {
        try {
            const metadata = sessionData.metadata;
            const amount = sessionData.amount_total / 100; // Convert cents to euros
            
            // Parse organization info from the session metadata
            const organizations = [];
            if (metadata.organizationInfo) {
                const orgData = JSON.parse(metadata.organizationInfo);
                Object.values(orgData).forEach(org => {
                    organizations.push({
                        name: org.name,
                        amount: org.amount || 0,
                        percentage: Math.round(org.percentage || 0),
                        order: org.order
                    });
                });
            }
            
            // Calculate tip amount (if any) - assuming it's included in the organization info
            let tipAmount = 0;
            if (organizations.length > 0) {
                const tipOrg = organizations.find(org => org.name === metadata.tipOrganization);
                if (tipOrg) {
                    tipAmount = tipOrg.amount || 0;
                }
            }
            
            // Prepare the donation data for logging
            const donationData = {
                id: metadata.donationId || sessionData.payment_intent,
                amount: amount,
                tipAmount: tipAmount,
                tipOrganization: metadata.tipOrganization
            };
            
            // Send the log request to the API
            await fetch('/api/log-donation', {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json',
                },
                body: JSON.stringify({
                    donation: donationData,
                    paymentId: sessionData.payment_intent,
                    organizations
                }),
            });
            
            console.log('Donation logged to Discord');
        } catch (error) {
            console.error('Error logging donation to Discord:', error);
        }
    };

    if (loading) {
        return (
            <div className="flex min-h-screen items-center justify-center">
                <div className="animate-spin rounded-full h-12 w-12 border-t-2 border-b-2 border-primary-600"></div>
            </div>
        );
    }

    return (
        <div className="flex min-h-screen items-center justify-center bg-slate-50 p-4">
            <div className="bg-white rounded-lg shadow-lg p-8 max-w-lg w-full text-center">
                <div className="text-green-500 text-6xl mb-4">✓</div>
                <h1 className="text-2xl font-bold text-primary-700 mb-4">
                    {title}
                </h1>
                <p className="text-gray-600 mb-4">
                    {session?.subscription ? recurringDescription : description}
                </p>
                {session && (
                    <div className="mt-6 text-sm text-gray-500">
                        <p>Payment ID: {session.payment_intent}</p>
                    </div>
                )}
            </div>
        </div>
    );
}
