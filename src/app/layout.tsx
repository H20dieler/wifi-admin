import type { Metadata } from "next";
import { Bricolage_Grotesque, Courier_Prime } from "next/font/google";
import "./globals.css";

const bricolageGrotesque = Bricolage_Grotesque({
  variable: "--font-bricolage",
  subsets: ["latin"],
});

const courierPrime = Courier_Prime({
  variable: "--font-courier",
  subsets: ["latin"],
  weight: ["400", "700"],
});

export const metadata: Metadata = {
  title: "WiFi Admin",
  description: "Customer, billing, and operations admin for a WiFi/ISP reseller business.",
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="en">
      <body
        className={`${bricolageGrotesque.variable} ${courierPrime.variable} font-sans antialiased`}
      >
        {children}
      </body>
    </html>
  );
}
