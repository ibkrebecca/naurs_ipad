// imports
import "bootstrap/dist/css/bootstrap.css";
import "@/app/_components/styles.globals.css";
import BootstrapClient from "@/app/_components/bootstrap_client";
import {
  getLBSchema,
  getWPSchema,
  getWSSchema,
  description,
  keywords,
  title,
  url,
} from "@/app/_components/seo";
import { ToastContainer } from "react-toastify";
import "react-toastify/dist/ReactToastify.css";
import { Inter } from "next/font/google";
import "react-phone-number-input/style.css";
import { AuthProvider } from "@/app/_components/backend/auth_context";

const inter = Inter({ variable: "--font-inter", subsets: ["latin"] });

// metadata
export const metadata = {
  title: title,
  description: description,
  keywords: keywords,
  openGraph: {
    title: title,
    description: description,
    type: "website",
    url: url,
    images: [
      {
        url: "/logos/og.png",
        width: 1277,
        height: 473,
        alt: title,
      },
    ],
  },
  twitterCard: {
    card: "summary_large_image",
    title: title,
    description: description,
    url: url,
    images: "/logos/og.png",
  },
  metadataBase: new URL(url),
  manifest: "/logos/site.webmanifest",
  icons: {
    icon: ["/logos/favicon.ico"],
    apple: ["/logos/favicon.png"],
    shortcut: ["/logos/favicon.png"],
  },
};

// web site schema
const wSSchema = getWSSchema(url);

// web page schema
const wPSchema = getWPSchema(title, description, url, [
  {
    "@type": "ListItem",
    position: 1,
    name: title,
    item: url,
  },
]);

// local business schema
const lBSchema = getLBSchema(
  title,
  {
    streetAddress: "Bay Avenue Mall, Door F43 & F44, Business Bay",
    addressLocality: "Dubai",
    addressRegion: "Dubai",
    postalCode: "24536",
    addressCountry: "United Arab Emirates",
  },
  "+971048357237",
  "info@naurs.me",
  url,
  `${url}logos/logo.png`,
  "Cash, Credit Card, Transfer",
  "LIRA, USD, EURO",
  "Mo-Fr 09:00-17:00",
  {
    latitude: "25.190582",
    longitude: "55.265999",
  }
);

// root layout
const RootLayout = ({ children }) => {
  return (
    <AuthProvider>
      <html lang="en">
        <head>
          <meta property="og:site_name" content={title} />
          <meta name="theme-color" content="#ffffff" />
          <meta name="author" content={title} />
          <script
            type="application/ld+json"
            dangerouslySetInnerHTML={{ __html: JSON.stringify(wSSchema) }}
          />
          <script
            type="application/ld+json"
            dangerouslySetInnerHTML={{ __html: JSON.stringify(wPSchema) }}
          />
          <script
            type="application/ld+json"
            dangerouslySetInnerHTML={{ __html: JSON.stringify(lBSchema) }}
          />
        </head>

        <body className={inter.className}>
          {children}
          <BootstrapClient />
          <ToastContainer position="bottom-center" autoClose={3000} />
        </body>
      </html>
    </AuthProvider>
  );
};

export default RootLayout;
