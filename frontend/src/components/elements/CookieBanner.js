'use client';
import { useEffect } from 'react';
import { useReactiveGetCookie, useReactiveHasCookie, useReactiveSetCookie } from 'cookies-next';
import { facebookConsent } from './FacebookPixel';

export default function CookieBannerInner() {
  const hasCookie = useReactiveHasCookie();
  const getCookie = useReactiveGetCookie();
  const setCookie = useReactiveSetCookie();
  const consent = hasCookie('cookie_consent') ? getCookie('cookie_consent') : null;

  useEffect(() => {
    if (consent === 'denied') {
      facebookConsent('revoke');
    }
    if (consent === 'granted') {
      facebookConsent('grant');
    }
  }, [consent]);

  const handleAccept = () => {
    setCookie('cookie_consent', 'granted', { maxAge: 60 * 60 * 24 * 365 });
  };

  const handleDecline = () => {
    setCookie('cookie_consent', 'denied', { maxAge: 60 * 60 * 24 * 365 });
  };

  if(consent !== null) return

  return (
    <aside>
      <div className="fixed bottom-0 left-0 right-0 bg-cyan-900 text-white p-4 z-50 flex justify-between items-center">
      <p>
        Šajā vietnē tiek izmantotas statistikas un mārketinga sīkdatnes.
        Uzzini vairāk <a href='/privatuma-politika' className='text-teal-400'>Privātuma politikā</a>.
      </p>
      <div className="space-x-4">
        <button onClick={handleDecline} className="px-4 py-2 text-gray-200 hover:text-white font-bold">Noraidīt</button>
        <button onClick={handleAccept} className="bg-teal-700 px-4 py-2 rounded text-white font-bold">Apstiprināt</button>
      </div>
      </div>
    </aside>
  );
}
