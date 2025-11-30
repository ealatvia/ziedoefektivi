'use strict';

const FACEBOOK_API_VERSION='v17.0'
const FACEBOOK_API_URL='https://graph.facebook.com'


async function trackFacebook(strapi, event) {
  try {
    const global = await strapi.db.query("api::global.global").findOne();

    const payload = {
      data: [event],
    };
    const facebookUrl = [
      FACEBOOK_API_URL,
      FACEBOOK_API_VERSION,
      global.facebookPixelId,
      `events?access_token=${global.facebookAccessToken}`
    ].join('/')
    strapi.log.info(facebookUrl + ' - ' + JSON.stringify(payload))

    if (!global.facebookPixelId) {
      strapi.log.warn('`facebookPixelId` not set. Skipping event tracking.');
      return;
    }
    if (!global.facebookAccessToken) {
      strapi.log.warn('`facebookAccessToken` not set. Skipping event tracking.');
      return;
    }

    const response = await fetch(facebookUrl, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify(payload),
    });

    const responseData = await response.json();

    if (!response.ok) {
      strapi.log.error('Error sending event to Facebook Conversions API:', responseData);
    } else {
      strapi.log.info('Event sent to Facebook Conversions API:', JSON.stringify(event));
    }
  } catch (error) {
    strapi.log.error('Error sending event to Facebook Conversions API:', error);
  }
}

module.exports = {
  trackFacebook,
};
