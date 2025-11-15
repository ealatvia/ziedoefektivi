// Your Discord webhook URLs
const DISCORD_WEBHOOK_BACKEND_CONSOLE = process.env.DISCORD_WEBHOOK_BACKEND_CONSOLE;
const DISCORD_WEBHOOK_DONATIONS = process.env.DISCORD_WEBHOOK_DONATIONS;

const IS_PROD = process.env.NODE_ENV === 'production'

// TODO: Move to variables
const STRAPI_URL = `http://${IS_PROD ? 'splendid-sunshine-fb3754d635.strapiapp.com' : 'localhost:1337'}/admin`
const STRIPE_URL = `https://dashboard.stripe.com/acct_1Qg6lABalMjw6J28${IS_PROD ? '' : '/test'}`

let _singleton
class DiscordLogger {
  /**
   * @type {DiscordLogger}
   */
  static get singleton() {
    if (!_singleton && typeof window === 'undefined') { // Only initialize on the server side
      _singleton = new DiscordLogger();
      if (!DISCORD_WEBHOOK_BACKEND_CONSOLE) {
        console.warn('DiscordLogger: No `DISCORD_WEBHOOK_BACKEND_CONSOLE` configured, skipping console.* overrides.')
      };
    }
    return _singleton;
  }

  /**
   * @param {Error} error
   */
  error(error) {
    console.error(error)
    return this._postToDiscord(DISCORD_WEBHOOK_BACKEND_CONSOLE, this._formatConsoleMessage('error', [error]))
  }
  /**
   * @param {unknown[]} args
   */
  warn(...args) {
    console.warn(...args)
    return this._postToDiscord(DISCORD_WEBHOOK_BACKEND_CONSOLE, this._formatConsoleMessage('warn', args))
  }
  /**
   * @param {unknown[]} args
   */
  info(...args) {
    console.info(...args)
    return this._postToDiscord(DISCORD_WEBHOOK_BACKEND_CONSOLE, this._formatConsoleMessage('info', args))
  }

  /**
   * Stop errors here, in order not to fail otherwise successful donations.
   */
  async _postToDiscord(webhook, data) {
    try {
      await fetch(webhook, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify(data),
      });
    } catch (error) {
      this._originalConsole.error('Failed to send log to Discord:', data, error);
    }
  }

  _formatConsoleMessage(level, args) {
    // Get server information
    const environment = process.env.NODE_ENV || 'development';
    const serverName = process.env.SERVER_NAME || 'NextJS Server';

    // Format arguments into a string
    const messageContent = args.map(arg => {
      if (arg === null) return 'null';
      if (arg === undefined) return 'undefined';

      if (arg instanceof Error) {
        try {
          return arg.stack?.split('\n').slice(0, 5).join('\n')
        } catch (e) {
          return '[Error.stack is not a string]';
        }
      }

      if (typeof arg === 'object') {
        try {
          return JSON.stringify(arg, null, 2);
        } catch (e) {
          return '[Circular Object]';
        }
      }
      return String(arg);
    }).join(' ');

    // Create color based on log level
    const colors = {
      error: 0xFF0000,  // Red
      warn: 0xFFA500,   // Orange
      info: 0x0000FF,   // Blue
      debug: 0x808080,  // Gray
      log: 0x008000,    // Green
    };

    // Format as Discord embed
    return {
      content: `**[${environment}]** ${level}:`,
      embeds: [{
        title: undefined,
        description: `\`\`\`\n${messageContent.substring(0, 4000)}\n\`\`\``,
        color: colors[level] || 0x000000,
        timestamp: new Date().toISOString(),
      }]
    };
  }

  /**
   * @param {{amount: number, paymentMethod: 'paymentInitiation'|'cardPayments', companyName?: string, donationId: string, stripePaymentIntentId: string, subscriptionId?: string, stripeSubscriptionId?: string}} donation
   */
  _formatDonationMessage({amount, paymentMethod, companyName, donationId, stripePaymentIntentId, subscriptionId, stripeSubscriptionId}) {
    if(paymentMethod === 'cardPayments') {
      const prefix = !IS_PROD ? '[TEST] ' : ''

      const amountText = `**${(amount/100).toFixed(2)}**€`;
      const actor = companyName ? 'corporate' : 'private'
      const strapiDonation = `[strapi](${STRAPI_URL}/content-manager/collection-types/api::donation.donation/${donationId})`
      const stripeDonation = `[stripe](${STRIPE_URL}/payments/${stripePaymentIntentId})`

      const strapiSubscription = `[strapi](${STRAPI_URL}/content-manager/collection-types/api::recurring-donation.recurring-donation/${subscriptionId})`
      const stripeSubscription = `[stripe](${STRIPE_URL}/subscriptions/${stripeSubscriptionId})`
      const sourceText = subscriptionId ? ` from a subscription (${strapiSubscription}/${stripeSubscription})` : ', one-off'

      return `${prefix}${amountText} ${actor} stripe donation (${strapiDonation}/${stripeDonation})${sourceText}.`
    }
  }

  /**
   * @param {{amount: number, paymentMethod: 'paymentInitiation'|'cardPayments', companyName?: string, donationId: string, stripePaymentIntentId: string, subscriptionId?: string, stripeSubscriptionId?: string}} donation
   */
  async logDonation(params) {
    if (!DISCORD_WEBHOOK_DONATIONS) return;
    const content = this._formatDonationMessage(params)
    this._postToDiscord(DISCORD_WEBHOOK_DONATIONS, { content })
  }

  /**
   * @param {{amount: number, paymentMethod: 'paymentInitiation'|'cardPayments', companyName?: string, donationId: string, stripePaymentIntentId: string, subscriptionId?: string, stripeSubscriptionId?: string, disputeId: string}} params
   */
  async disputeDonation(params) {
    if (!DISCORD_WEBHOOK_DONATIONS) return;
    const stripeDispute = `**[DISPUTED](${STRIPE_URL}/disputes/${params.disputeId}/respond)**: `
    const content = stripeDispute + this._formatDonationMessage(params)
    this._postToDiscord(DISCORD_WEBHOOK_DONATIONS, { content })
  }

  async logStripeChargeback(donation, paymentMethod, paymentId = null) {
    if (!DISCORD_WEBHOOK_DONATIONS) {
      return;
    }

    try {
      const amountText = `${donation.amount.toFixed(2)}€`;
      let message = `Chargeback ${amountText}`;

      // Add payment method info
      if (paymentMethod === 'stripe' && paymentId) {
        message += ` via Stripe (ID: ${paymentId})`;
      } else if (paymentMethod === 'stripe (pending)' && paymentId) {
        message += ` via Stripe (ID: ${paymentId}, pending)`;
      } else if (paymentMethod === 'bank') {
        message += ` via bank transfer`;
      } else {
        message += ` via ${paymentMethod}`;
      }

      // Send to Discord webhook
      await fetch(DISCORD_WEBHOOK_DONATIONS, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          content: message
        }),
      });
    } catch (error) {
      // Use original console to avoid infinite loops
      this._originalConsole.error('Failed to send donation log to Discord:', error);
    }
  }
}

module.exports = {
  DiscordLogger,
}
