import type { Metadata, Viewport } from "next";
import { Josefin_Sans } from "next/font/google";
import "./globals.css";

const josefin = Josefin_Sans({
  variable: "--font-josefin",
  subsets: ["latin"],
  weight: ["300", "400", "600", "700"],
  display: "swap",
});

// DEPLOY STEP: sostituire con l'URL di produzione quando il dominio e' definitivo
const SITE_URL = process.env.NEXT_PUBLIC_SITE_URL ?? "https://ristorantehoteloldriver.com";

const JSON_LD = {
  "@context": "https://schema.org",
  "@type": "Hotel",
  name: "Old River Hotel & Ristorante",
  url: SITE_URL,
  image: `${SITE_URL}/og.jpg`,
  telephone: "+39 0522 838401",
  starRating: { "@type": "Rating", ratingValue: 3 },
  petsAllowed: true,
  address: {
    "@type": "PostalAddress",
    streetAddress: "Viale Po 2",
    postalCode: "42016",
    addressLocality: "Guastalla",
    addressRegion: "RE",
    addressCountry: "IT",
  },
  amenityFeature: [
    { "@type": "LocationFeatureSpecification", name: "Ristorante", value: true },
    { "@type": "LocationFeatureSpecification", name: "Wi-Fi", value: true },
    { "@type": "LocationFeatureSpecification", name: "Parcheggio custodito", value: true },
    { "@type": "LocationFeatureSpecification", name: "Sala congressi", value: true },
  ],
};

export const metadata: Metadata = {
  metadataBase: new URL(SITE_URL),
  title: "Old River Hotel & Ristorante | Guastalla, sul Po",
  description:
    "Hotel 3 stelle e ristorante a Guastalla, nella Bassa reggiana. Camere, ristorante, sala congressi e soggiorni per aziende. Prenota direttamente con noi.",
  openGraph: {
    title: "Old River Hotel & Ristorante, Guastalla",
    description:
      "Una sosta sul Po, a Guastalla. Camere, ristorante e sale per chi viaggia per lavoro e per chi cerca un posto dove fermarsi.",
    type: "website",
    locale: "it_IT",
    images: [{ url: "/og.jpg", width: 1200, height: 630, alt: "Facciata dell'Old River Hotel a Guastalla" }],
  },
  icons: {
    icon:
      "data:image/svg+xml,%3Csvg xmlns='http://www.w3.org/2000/svg' viewBox='0 0 32 32'%3E%3Crect width='32' height='32' fill='%230B0A0A'/%3E%3Ctext x='16' y='22' font-family='Georgia,serif' font-size='15' font-weight='700' text-anchor='middle' fill='%23D3CECE'%3EOR%3C/text%3E%3C/svg%3E",
  },
};

export const viewport: Viewport = {
  themeColor: "#0B0A0A",
  width: "device-width",
  initialScale: 1,
};

export default function RootLayout({ children }: { children: React.ReactNode }) {
  return (
    <html lang="it" className={`${josefin.variable} h-full antialiased`}>
      <body className="min-h-full bg-ink font-sans text-white">
        {children}
        <script
          type="application/ld+json"
          dangerouslySetInnerHTML={{ __html: JSON.stringify(JSON_LD) }}
        />
      </body>
    </html>
  );
}
