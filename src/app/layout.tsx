import type { Metadata } from "next";
import { Geist, Geist_Mono } from "next/font/google";
import Script from "next/script";
import "./globals.css";
import { ThemeProvider } from "@/components/theme-provider";

const GA_MEASUREMENT_ID = "G-ZFNETY4EY0";

const geistSans = Geist({
  variable: "--font-geist-sans",
  subsets: ["latin"],
});

const geistMono = Geist_Mono({
  variable: "--font-geist-mono",
  subsets: ["latin"],
});

export const metadata: Metadata = {
  title: "One More Rep - Replay past Opens",
  description: "Simulate your CrossFit Open scores and see your estimated percentile and rank",
  metadataBase: new URL("https://onemorerep.nathanallen.com"),
  openGraph: {
    title: "One More Rep - Replay past Opens",
    description: "Simulate your CrossFit Open scores and see your estimated percentile and rank",
    url: "https://onemorerep.nathanallen.com",
    siteName: "One More Rep",
    type: "website",
  },
  twitter: {
    card: "summary",
    title: "One More Rep - Replay past Opens",
    description: "Simulate your CrossFit Open scores and see your estimated percentile and rank",
  },
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="en" suppressHydrationWarning>
      <head>
        <Script
          src={`https://www.googletagmanager.com/gtag/js?id=${GA_MEASUREMENT_ID}`}
          strategy="afterInteractive"
        />
        <Script id="google-analytics" strategy="afterInteractive">
          {`
            window.dataLayer = window.dataLayer || [];
            function gtag(){dataLayer.push(arguments);}
            gtag('js', new Date());
            gtag('config', '${GA_MEASUREMENT_ID}');
          `}
        </Script>
      </head>
      <body
        className={`${geistSans.variable} ${geistMono.variable} antialiased`}
      >
        <ThemeProvider
          attribute="class"
          defaultTheme="dark"
          enableSystem
          disableTransitionOnChange
        >
          {children}
        </ThemeProvider>
      </body>
    </html>
  );
}
