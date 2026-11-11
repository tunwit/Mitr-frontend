import { Prompt } from "next/font/google";
import "./globals.css";
import { ClerkProvider } from "@clerk/nextjs";
import { Suspense } from "react";

const prompt = Prompt({
  subsets: ["thai", "latin"],
  weight: ["100", "200", "300", "400", "500", "600", "700"],
  variable: "--font-prompt",
});

export default async function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html className={`${prompt.variable} antialiased`}>
      <body className={`${prompt.className} antialiased flex`}>
        <ClerkProvider signInUrl="/th/sign-in">
          <Suspense>{children}</Suspense>
        </ClerkProvider>
      </body>
    </html>
  );
}
