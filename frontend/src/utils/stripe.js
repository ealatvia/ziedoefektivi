export const initiateStripeCheckout = async (donationData) => {
  try {
    const response = await fetch('/api/create-checkout-session', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify(donationData),
    });

    const session = await response.json();

    if (session.url) {
      window.location.href = session.url;
    } else {
      throw new Error('Failed to create checkout session');
    }
  } catch (error) {
    console.error('Error:', error);
    throw error;
  }
};