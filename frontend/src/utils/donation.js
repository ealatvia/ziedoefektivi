import { getStrapiURL } from "./strapi";

/**
 * @param {{amount: number,type: 'onetime' | 'recurring',firstName: string,lastName: string,email: string,idCode: string,amounts: { organizationId: number, amount: number }[],paymentMethod: 'paymentInitiation'|'cardPayments',stripeSessionId?: string}} donation
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
