import "./globals.css";
import { getGlobal } from "../utils/strapi";
import { buildMetadata } from "../utils/seo";
import { GCScript } from "next-goatcounter";
import "@fontsource-variable/inter/opsz-italic.css";
import Navbar from "@/components/Navbar";
import Footer from "@/components/Footer";

export async function generateMetadata() {
  const global = await getGlobal();

  return buildMetadata(global, {});
}

export default async function RootLayout({ children }) {
  const goatCounterCode = process.env.GOATCOUNTER_CODE;
  const global = await getGlobal();

  return (
    <html lang="lv" className="h-full">
      {goatCounterCode && (
        <head>
          <GCScript siteUrl={`https://${goatCounterCode}.goatcounter.com/count`} />
        </head>
      )}
      <body className="flex min-h-full flex-col">
        <Navbar global={global} />
        {children}
        <Footer global={global} />
      </body>
    </html>
  );
}
