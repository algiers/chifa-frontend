import "./globals.css";
import React from "react";
import { Providers } from './providers';
import { ThemeProvider } from '@/components/theme-provider';
import { Toaster } from '@/components/ui/sonner';

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="fr" suppressHydrationWarning>
      <head>
        <title>Chifa.ai - Assistant IA pour Pharmacies</title>
        <meta name="description" content="Interrogez votre base de données pharmacie en langage naturel avec Chifa.ai, votre assistant intelligent." />
        <meta name="keywords" content="pharmacie, IA, assistant, base de données, langage naturel, Chifa.ai" />
        <meta name="author" content="Chifa.ai" />
        <meta name="viewport" content="width=device-width, initial-scale=1" />
        <meta name="theme-color" content="#238636" />
        <link rel="icon" href="/favicon.svg" type="image/svg+xml" />
        <link rel="apple-touch-icon" href="/apple-touch-icon.svg" />
      </head>
      <body className="antialiased" suppressHydrationWarning>
        <ThemeProvider
          attribute="class"
          defaultTheme="dark"
          enableSystem
          disableTransitionOnChange
        >
          <Providers>
            {children}
            <Toaster />
          </Providers>
        </ThemeProvider>
      </body>
    </html>
  );
}
