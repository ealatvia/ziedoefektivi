import "./globals.css";
import { getGlobal } from "../utils/strapi";
import { buildMetadata } from "../utils/seo";
import { GCScript } from "next-goatcounter";
import "@fontsource-variable/inter/opsz-italic.css";
import Navbar from "@/components/Navbar";
import Footer from "@/components/Footer";
import CookieBanner from "@/components/elements/CookieBanner";
import { CookiesNextProvider } from "cookies-next";
import { FacebookPixel } from "@/components/elements/FacebookPixel";

export async function generateMetadata() {
  const global = await getGlobal();

  return buildMetadata(global, {});
}

export default async function RootLayout({ children }) {
  const global = await getGlobal();

  return (
    <html lang="lv" className="h-full">
      <CookiesNextProvider pollingOptions={{ enabled: true, intervalMs: 1000 }}>
        <head>
          {global.goatcounterId && (
            <GCScript siteUrl={`https://${global.goatcounterId}.goatcounter.com/count`} />
          )}
          {global.facebookPixelId && (
            <FacebookPixel pixelId={global.facebookPixelId} />
          )}
        </head>
        <body className="flex min-h-full flex-col">
          <Navbar global={global} />
          {children}
          <Footer global={global} />
          <CookieBanner facebookPixelId={global.trackersFacebookPixelId} />
        </body>
      </CookiesNextProvider>
    </html>
  );
}
