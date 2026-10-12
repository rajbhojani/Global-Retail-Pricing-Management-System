import type { Metadata } from "next";
import "./globals.css";
import { Header } from "../components/Header";
import { Toast } from "../components/Toast";

export const metadata: Metadata = {
  title: "Retail Pricing Hub | Global Multi-Store Pricing Feed Governance",
  description: "Enterprise retail pricing management system for 3,000 stores across international regions. Upload, search, audit, and govern pricing feeds with PostgreSQL and FastAPI.",
};

export default function RootLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <html lang="en">
      <head>
        <meta name="viewport" content="width=device-width, initial-scale=1.0" />
      </head>
      <body className="bg-slate-950 text-slate-100 min-h-screen">
        <div className="max-w-[1520px] mx-auto px-4 sm:px-6 lg:px-8 py-6">
          <Header />
          <main>{children}</main>
        </div>
        <Toast />
      </body>
    </html>
  );
}
