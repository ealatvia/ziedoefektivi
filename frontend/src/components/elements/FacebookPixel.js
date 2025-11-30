'use client'

import { usePathname } from 'next/navigation'
import { useEffect } from 'react'

export const FacebookPixel = ({pixelId}) => {
  const pathname = usePathname()

  useEffect(() => {
    if (!pixelId) return;

    // This is the Facebook Pixel tracking code
    !function(f,b,e,v,n,t,s)
    {if(f.fbq)return;n=f.fbq=function(){n.callMethod?
    n.callMethod.apply(n,arguments):n.queue.push(arguments)};
    if(!f._fbq)f._fbq=n;n.push=n;n.loaded=!0;n.version='2.0';
    n.queue=[];t=b.createElement(e);t.async=!0;
    t.src=v;s=b.getElementsByTagName(e)[0];
    s.parentNode.insertBefore(t,s)}(window, document,'script',
    'https://connect.facebook.net/en_US/fbevents.js');

    facebookConsent('revoke'); // As per GDPR, by default revoke.
    facebookInit(pixelId);
  }, [pixelId]);

  useEffect(() => {
    facebookPageView();
  }, [pathname, pixelId]);

  return null;
}

const facebookInit = (pixelId) => {
  if (typeof window.fbq !== 'function') return;
  window.fbq('init', pixelId);
}
const facebookPageView = () => {
  if (typeof window.fbq !== 'function') return;
  window.fbq('track', 'PageView');
}

/**
 * @param {'grant' | 'revoke'} value
 */
export const facebookConsent = (value) => {
  if (typeof window.fbq !== 'function') return;
  window.fbq('consent', value);
}

/**
 * Event codes: https://www.facebook.com/business/help/402791146561655?id=1205376682832142
 *
 * @param {'ViewContent'|'InitiateCheckout'|'Donate'|'Purchase'|'Subscribe'} name
 * @param {{value: string, currency: 'EUR', predicted_ltv?: string}} [options]
 */
export const facebookEvent = (name, options = {}) => {
  if (typeof window.fbq !== 'function') return;
  window.fbq('track', name, options);
}
