import type { Metadata } from "next";
import { Crimson_Text, Inter } from "next/font/google";
import "./globals.css";
import SyncStatusBanner from "@/components/SyncStatusBanner";

const crimsonText = Crimson_Text({
  variable: "--font-crimson",
  subsets: ["latin"],
  weight: ["400", "600", "700"],
});

const inter = Inter({
  variable: "--font-inter",
  subsets: ["latin"],
});

export const metadata: Metadata = {
  title: "The Beatles Archive",
  description: "A comprehensive archive of Beatles albums, tracks, and releases",
  keywords: ["The Beatles", "music", "archive", "albums", "discography"],
  authors: [{ name: "Bodhin Industries" }],
  openGraph: {
    title: "The Beatles Archive",
    description: "A comprehensive archive of Beatles albums, tracks, and releases",
    url: "https://thebeatlesarchive.com",
    siteName: "The Beatles Archive",
    locale: "en_US",
    type: "website",
  },
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="en">
      <body
        className={`${crimsonText.variable} ${inter.variable} antialiased`}
      >
        <SyncStatusBanner />
        <div className="min-h-screen flex flex-col">
          <header className="border-b border-neutral-200 dark:border-neutral-800 bg-white dark:bg-neutral-900">
            <div className="container mx-auto px-4 py-6">
              <h1 className="text-3xl md:text-4xl font-bold tracking-tight">
                <a href="/" className="hover:opacity-70 transition-opacity">
                  The Beatles Archive
                </a>
              </h1>
              <nav className="mt-4 flex gap-6 text-sm">
                <a href="/" className="hover:underline">
                  Home
                </a>
                <div className="relative group">
                  <button className="hover:underline cursor-pointer">
                    Solo Careers ▾
                  </button>
                  <div className="hidden group-hover:block absolute top-full left-0 mt-2 bg-white dark:bg-neutral-800 border border-neutral-200 dark:border-neutral-700 rounded-md shadow-lg py-2 min-w-[180px] z-10">
                    <a href="/solo/john-lennon" className="block px-4 py-2 hover:bg-neutral-100 dark:hover:bg-neutral-700">
                      John Lennon
                    </a>
                    <a href="/solo/paul-mccartney" className="block px-4 py-2 hover:bg-neutral-100 dark:hover:bg-neutral-700">
                      Paul McCartney
                    </a>
                    <a href="/solo/george-harrison" className="block px-4 py-2 hover:bg-neutral-100 dark:hover:bg-neutral-700">
                      George Harrison
                    </a>
                    <a href="/solo/ringo-starr" className="block px-4 py-2 hover:bg-neutral-100 dark:hover:bg-neutral-700">
                      Ringo Starr
                    </a>
                  </div>
                </div>
                <a href="/about" className="hover:underline">
                  About
                </a>
                <a href="/stats" className="hover:underline">
                  Statistics
                </a>
                <a href="/compare" className="hover:underline">
                  Compare
                </a>
              </nav>
            </div>
          </header>

          <main className="flex-1 container mx-auto px-4 py-8">
            {children}
          </main>

          <footer className="border-t border-neutral-200 dark:border-neutral-800 bg-white dark:bg-neutral-900 mt-auto">
            <div className="container mx-auto px-4 py-8">
              <div className="grid grid-cols-1 md:grid-cols-4 gap-8 text-sm">
                <div>
                  <h3 className="font-semibold mb-2">The Beatles Archive</h3>
                  <p className="text-neutral-600 dark:text-neutral-400">
                    A comprehensive archive of Beatles and solo discographies
                  </p>
                </div>
                <div>
                  <h3 className="font-semibold mb-2">Data Sources</h3>
                  <div className="space-y-1 text-neutral-600 dark:text-neutral-400">
                    <p>MusicBrainz</p>
                    <p>Cover Art Archive</p>
                    <p>Discogs</p>
                  </div>
                </div>
                <div>
                  <h3 className="font-semibold mb-2">Tools</h3>
                  <div className="space-y-1">
                    <a href="/stats" className="block text-neutral-600 dark:text-neutral-400 hover:text-purple-600 dark:hover:text-purple-400">
                      Archive Statistics
                    </a>
                    <a href="/compare" className="block text-neutral-600 dark:text-neutral-400 hover:text-purple-600 dark:hover:text-purple-400">
                      Compare Albums
                    </a>
                  </div>
                </div>
                <div>
                  <h3 className="font-semibold mb-2">Project</h3>
                  <div className="space-y-1 text-neutral-600 dark:text-neutral-400">
                    <p>Non-commercial educational archive</p>
                    <p>Open data sources</p>
                    <p>A Bodhin Industries creation</p>
                  </div>
                </div>
              </div>
              <div className="mt-6 pt-6 border-t border-neutral-200 dark:border-neutral-800 text-center text-neutral-600 dark:text-neutral-400">
                <p>© {new Date().getFullYear()} thebeatlesarchive.com</p>
              </div>
            </div>
          </footer>
        </div>
      </body>
    </html>
  );
}
