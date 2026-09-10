import type { Metadata } from "next";
import "./globals.css";

export const metadata: Metadata = {
  metadataBase: new URL("https://earnnova.site"),

  title: {
    default: "EarnNova — Earn • Grow • Repeat",
    template: "%s | EarnNova",
  },

  description:
    "EarnNova is an online earning platform where members can access tasks, watch videos, referrals and membership opportunities.",

  applicationName: "EarnNova",

  keywords: [
    "EarnNova",
    "Earn Nova",
    "online earning",
    "earn money",
    "tasks",
    "watch videos",
    "referrals",
    "earning platform",
    "membership",
  ],

  authors: [
    {
      name: "EarnNova Team",
    },
  ],

  creator: "EarnNova Team",
  publisher: "EarnNova Team",

  category: "finance",

  icons: {
    icon: [
      {
        url: "/favicon.ico",
        type: "image/x-icon",
      },
    ],

    shortcut: "/favicon.ico",

    apple: [
      {
        url: "/favicon.ico",
      },
    ],
  },

  openGraph: {
    type: "website",
    locale: "en_US",
    url: "https://earnnova.site",
    siteName: "EarnNova",
    title: "EarnNova — Earn • Grow • Repeat",
    description:
      "Access tasks, videos, referrals and membership opportunities with EarnNova.",
  },

  twitter: {
    card: "summary",
    title: "EarnNova — Earn • Grow • Repeat",
    description:
      "Access tasks, videos, referrals and membership opportunities with EarnNova.",
  },

  robots: {
    index: true,
    follow: true,
  },

  manifest: "/manifest.webmanifest",
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="en">
      <head>
        <meta
          name="theme-color"
          content="#050b16"
        />

        <meta
          name="color-scheme"
          content="dark"
        />

        <meta
          name="mobile-web-app-capable"
          content="yes"
        />

        <meta
          name="apple-mobile-web-app-capable"
          content="yes"
        />

        <meta
          name="apple-mobile-web-app-status-bar-style"
          content="black-translucent"
        />

        <meta
          name="apple-mobile-web-app-title"
          content="EarnNova"
        />
      </head>

      <body className="min-h-screen bg-[#050b16] text-white antialiased">
        {children}
      </body>
    </html>
  );
}