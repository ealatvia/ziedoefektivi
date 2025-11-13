import { getStrapiURL } from "./strapi";

/**
 * @param {{amount: number,type: 'onetime' | 'recurring',firstName: string,lastName: string,email: string,idCode: string,amounts: { organizationId: number, amount: number }[],paymentMethod: 'paymentInitiation'|'cardPayments',stripePaymentIntentId?: string, stripeSubscriptionId?: string}} donation
 */
export function makeDonationRequest(donation) {
  return fetch(getStrapiURL("/api/donate"), {
    method: "POST",
    headers: {
      "Content-Type": "application/json",
    },
    body: JSON.stringify(donation),
  });
}

/**
 * @param {Pick<import("stripe").Stripe.Invoice, 'subscription'|'payment_intent'|'created'|'amount_paid'>} recurringDonation
 */
export function makeStripeRecurringDonationRequest({ subscription, payment_intent, created, amount_paid }) {
  return fetch(getStrapiURL("/api/donateStripeRecurring"), {
    method: "POST",
    headers: {
      "Content-Type": "application/json",
    },
    body: JSON.stringify({ subscription, payment_intent, created, amount_paid }),
  });
}

/**
 * @param {Pick<import("stripe").Stripe.Dispute, 'id'|'created'|'payment_intent'} disputeFundsWithdrawnEvent
 */
export function makeDisputeRequest({id, created, payment_intent}) {
  return fetch(getStrapiURL("/api/donations/donateStripeRecurring"), {
    method: "POST",
    headers: {
      "Content-Type": "application/json",
    },
    body: JSON.stringify({
      id, created, payment_intent
    }),
  });
}
