import type { Metadata } from "next";
import { Geist, Geist_Mono } from "next/font/google";
import localFont from "next/font/local";
import "./globals.css";
import LinkGuard from "@/components/LinkGuard";
import MuxController from "@/components/MuxController";
import Sidebar from "@/components/Sidebar";
import StatusBar from "@/components/StatusBar";

const geistSans = Geist({
  variable: "--font-geist-sans",
  subsets: ["latin"],
});

const geistMono = Geist_Mono({
  variable: "--font-geist-mono",
  subsets: ["latin"],
});

// Geist Pixel ships one weight per shape variant (SIL OFL, see src/fonts/).
// Line carries the masthead, Square the sidebar wordmark; Iosevka is the
// bio-pane prose voice.
const pixelLine = localFont({
  src: "../fonts/GeistPixel-Line.woff2",
  variable: "--font-pixel-line",
  weight: "400",
});

const pixelSquare = localFont({
  src: "../fonts/GeistPixel-Square.woff2",
  variable: "--font-pixel-square",
  weight: "400",
});

const iosevka = localFont({
  src: "../fonts/iosevka-latin-400-normal.woff2",
  variable: "--font-iosevka",
  weight: "400",
});

const SITE_URL = process.env.VERCEL_PROJECT_PRODUCTION_URL
  ? `https://${process.env.VERCEL_PROJECT_PRODUCTION_URL}`
  : "https://portfolio-builder-ochre-six.vercel.app";

const DESCRIPTION =
  "Ibraheem Amin builds systems at the intersection of AI tooling, web infrastructure, and developer experience. Princeton B.S.E. Computer Science, Class of 2028.";

export const metadata: Metadata = {
  metadataBase: new URL(SITE_URL),
  title: "Ibraheem Amin — Princeton CS '28",
  description: DESCRIPTION,
  openGraph: {
    siteName: "ibraheem amin — terminal portfolio",
    type: "website",
    title: "Ibraheem Amin — Princeton CS '28",
    description: DESCRIPTION,
  },
  twitter: {
    card: "summary_large_image",
  },
};

// Stamp the stored theme before first paint so there is no flash.
const themeInit = `try{var t=localStorage.getItem("theme");if(t==="dark"||t==="light")document.documentElement.dataset.theme=t}catch(e){}`;

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html
      lang="en"
      suppressHydrationWarning
      className={`${geistSans.variable} ${geistMono.variable} ${pixelLine.variable} ${pixelSquare.variable} ${iosevka.variable} antialiased`}
    >
      <body>
        <script dangerouslySetInnerHTML={{ __html: themeInit }} />
        <Sidebar />
        <main className="main">{children}</main>
        <StatusBar />
        <MuxController />
        <LinkGuard />
      </body>
    </html>
  );
}
