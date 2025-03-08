import "./globals.css";
import Link from "next/link";
import { Inter } from "next/font/google";

// Optimize font loading
const inter = Inter({ 
  subsets: ["latin"],
  variable: "--font-inter",
  display: "swap",
  preload: true,
  fallback: ['system-ui', 'sans-serif']
});

// Enhanced metadata for better SEO and performance
export const metadata = {
  title: "Qdrant Quill - Smart Document Capture & Search",
  description: "Upload, process, and search your handwritten notes and reference materials powered by Qdrant search and Mistral OCR.",
  metadataBase: new URL(process.env.VERCEL_URL ? `https://${process.env.VERCEL_URL}` : 'http://localhost:3000'),
  icons: {
    icon: [
      { url: '/logomark.svg', type: 'image/svg+xml' }
    ],
    shortcut: '/logomark.svg',
    apple: '/logomark.svg',
  },
  // Add performance boost with preconnect
  other: {
    "preconnect": "https://danek-api.fly.dev"
  }
};

// Separate viewport export as recommended by Next.js
export const viewport = {
  width: 'device-width',
  initialScale: 1,
  maximumScale: 1,
  themeColor: '#ffffff',
};

export default function RootLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <html lang="en" className={`${inter.variable} font-sans`}>
      <head>
        {/* Preconnect to API endpoint for faster initial load */}
        <link rel="preconnect" href="https://danek-api.fly.dev" crossOrigin="anonymous" />
        <link rel="dns-prefetch" href="https://danek-api.fly.dev" />
        
        {/* Add link to favicon */}
        <link rel="icon" href="/logomark.svg" type="image/svg+xml" />
      </head>
      <body className="antialiased">
        <div className="min-h-screen flex flex-col">
          {/* Header - optimized with content-visibility */}
          <header className="border-b border-gray-200 bg-background">
            <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
              <div className="flex justify-between items-center h-16">
                <div className="flex items-center">
                  <div className="font-semibold text-xl text-foreground flex items-center">
                    <a href="https://qdrant.tech" target="_blank" rel="noopener noreferrer" className="font-bold mr-1 text-amaranth hover:text-amaranth/80">Qdrant</a>
                    <Link href="/" className="font-bold mr-1 hover:text-gray-600 transition-colors">Quill</Link>
                    <span className="text-gray-500 font-normal text-lg hidden md:inline">Smart Document Capture & Search</span>
                  </div>
                </div>
                
                <nav className="flex space-x-4 items-center">
                  <a 
                    href="https://qdrant.tech" 
                    target="_blank" 
                    rel="noopener noreferrer"
                    className="px-3 py-2 text-sm font-medium text-gray-700 hover:text-amaranth hover:bg-gray-50 rounded-md transition-colors"
                  >
                    Qdrant
                  </a>
                  <a 
                    href="https://discord.gg/qdrant" 
                    target="_blank" 
                    rel="noopener noreferrer"
                    className="flex items-center px-3 py-2 text-sm font-medium text-gray-700 hover:text-amaranth hover:bg-gray-50 rounded-md transition-colors"
                    title="Qdrant Discord"
                  >
                    <svg className="h-4 w-4" fill="currentColor" viewBox="0 0 24 24">
                      <path d="M20.317 4.37a19.791 19.791 0 0 0-4.885-1.515.074.074 0 0 0-.079.037c-.21.375-.444.864-.608 1.25a18.27 18.27 0 0 0-5.487 0 12.64 12.64 0 0 0-.617-1.25.077.077 0 0 0-.079-.037A19.736 19.736 0 0 0 3.677 4.37a.07.07 0 0 0-.032.027C.533 9.046-.32 13.58.099 18.057a.082.082 0 0 0 .031.057 19.9 19.9 0 0 0 5.993 3.03.078.078 0 0 0 .084-.028c.462-.63.874-1.295 1.226-1.994a.076.076 0 0 0-.041-.106 13.107 13.107 0 0 1-1.872-.892.077.077 0 0 1-.008-.128 10.2 10.2 0 0 0 .372-.292.074.074 0 0 1 .077-.01c3.928 1.793 8.18 1.793 12.062 0a.074.074 0 0 1 .078.01c.12.098.246.198.373.292a.077.077 0 0 1-.006.127 12.299 12.299 0 0 1-1.873.892.077.077 0 0 0-.041.107c.36.698.772 1.362 1.225 1.993a.076.076 0 0 0 .084.028 19.839 19.839 0 0 0 6.002-3.03.077.077 0 0 0 .032-.054c.5-5.177-.838-9.674-3.549-13.66a.061.061 0 0 0-.031-.03zM8.02 15.33c-1.183 0-2.157-1.085-2.157-2.419 0-1.333.956-2.419 2.157-2.419 1.21 0 2.176 1.096 2.157 2.42 0 1.333-.956 2.418-2.157 2.418zm7.975 0c-1.183 0-2.157-1.085-2.157-2.419 0-1.333.955-2.419 2.157-2.419 1.21 0 2.176 1.096 2.157 2.42 0 1.333-.946 2.418-2.157 2.418z" />
                    </svg>
                  </a>
                  <a 
                    href="https://www.linkedin.com/company/qdrant/" 
                    target="_blank" 
                    rel="noopener noreferrer"
                    className="flex items-center px-3 py-2 text-sm font-medium text-gray-700 hover:text-amaranth hover:bg-gray-50 rounded-md transition-colors"
                    title="Qdrant LinkedIn"
                  >
                    <svg className="h-4 w-4" fill="currentColor" viewBox="0 0 24 24">
                      <path d="M20.447 20.452h-3.554v-5.569c0-1.328-.027-3.037-1.852-3.037-1.853 0-2.136 1.445-2.136 2.939v5.667H9.351V9h3.414v1.561h.046c.477-.9 1.637-1.85 3.37-1.85 3.601 0 4.267 2.37 4.267 5.455v6.286zM5.337 7.433c-1.144 0-2.063-.926-2.063-2.065 0-1.138.92-2.063 2.063-2.063 1.14 0 2.064.925 2.064 2.063 0 1.139-.925 2.065-2.064 2.065zm1.782 13.019H3.555V9h3.564v11.452zM22.225 0H1.771C.792 0 0 .774 0 1.729v20.542C0 23.227.792 24 1.771 24h20.451C23.2 24 24 23.227 24 22.271V1.729C24 .774 23.2 0 22.222 0h.003z" />
                    </svg>
                  </a>
                  <a 
                    href="https://www.youtube.com/@qdrant" 
                    target="_blank" 
                    rel="noopener noreferrer"
                    className="flex items-center px-3 py-2 text-sm font-medium text-gray-700 hover:text-amaranth hover:bg-gray-50 rounded-md transition-colors"
                    title="Qdrant YouTube"
                  >
                    <svg className="h-4 w-4" fill="currentColor" viewBox="0 0 24 24">
                      <path d="M23.498 6.186a3.016 3.016 0 0 0-2.122-2.136C19.505 3.545 12 3.545 12 3.545s-7.505 0-9.377.505A3.017 3.017 0 0 0 .502 6.186C0 8.07 0 12 0 12s0 3.93.502 5.814a3.016 3.016 0 0 0 2.122 2.136c1.871.505 9.376.505 9.376.505s7.505 0 9.377-.505a3.015 3.015 0 0 0 2.122-2.136C24 15.93 24 12 24 12s0-3.93-.502-5.814zM9.545 15.568V8.432L15.818 12l-6.273 3.568z" />
                    </svg>
                  </a>
                  <a 
                    href="https://twitter.com/ptdamiba" 
                    target="_blank" 
                    rel="noopener noreferrer"
                    className="flex items-center px-3 py-2 text-sm font-medium text-gray-700 hover:text-[#2F6FF0] hover:bg-gray-50 rounded-md transition-colors"
                    title="@ptdamiba on X"
                  >
                    <svg className="h-4 w-4" fill="currentColor" viewBox="0 0 24 24">
                      <path d="M18.901 1.153h3.68l-8.04 9.19L24 22.846h-7.406l-5.8-7.584-6.638 7.584H.474l8.6-9.83L0 1.154h7.594l5.243 6.932ZM17.61 20.644h2.039L6.486 3.24H4.298Z" />
                    </svg>
                  </a>
                  <a 
                    href="https://github.com/thierrydamiba" 
                    target="_blank" 
                    rel="noopener noreferrer"
                    className="flex items-center px-3 py-2 text-sm font-medium text-gray-700 hover:text-[#2F6FF0] hover:bg-gray-50 rounded-md transition-colors"
                  >
                    <svg className="mr-1.5 h-4 w-4" fill="currentColor" viewBox="0 0 24 24" aria-hidden="true">
                      <path fillRule="evenodd" d="M12 2C6.477 2 2 6.484 2 12.017c0 4.425 2.865 8.18 6.839 9.504.5.092.682-.217.682-.483 0-.237-.008-.868-.013-1.703-2.782.605-3.369-1.343-3.369-1.343-.454-1.158-1.11-1.466-1.11-1.466-.908-.62.069-.608.069-.608 1.003.07 1.531 1.032 1.531 1.032.892 1.53 2.341 1.088 2.91.832.092-.647.35-1.088.636-1.338-2.22-.253-4.555-1.113-4.555-4.951 0-1.093.39-1.988 1.029-2.688-.103-.253-.446-1.272.098-2.65 0 0 .84-.27 2.75 1.026A9.564 9.564 0 0112 6.844c.85.004 1.705.115 2.504.337 1.909-1.296 2.747-1.027 2.747-1.027.546 1.379.202 2.398.1 2.651.64.7 1.028 1.595 1.028 2.688 0 3.848-2.339 4.695-4.566 4.943.359.309.678.92.678 1.855 0 1.338-.012 2.419-.012 2.747 0 .268.18.58.688.482A10.019 10.019 0 0022 12.017C22 6.484 17.522 2 12 2z" clipRule="evenodd" />
                    </svg>
                    GitHub
                  </a>
                </nav>
              </div>
            </div>
          </header>
          
          {/* Main content */}
          <main className="flex-grow bg-gray-100">
            {children}
          </main>
          
          {/* Footer - using content-visibility for performance */}
          <footer className="bg-background border-t border-gray-200 py-6 content-visibility-auto">
            <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
              <div className="text-center text-gray-500 text-sm">
                <p>Built with <a href="https://nextjs.org" target="_blank" rel="noopener noreferrer" className="text-[#2F6FF0] hover:underline">Next.js</a>, <a href="https://fastapi.tiangolo.com" target="_blank" rel="noopener noreferrer" className="text-[#2F6FF0] hover:underline">FastAPI</a>, <a href="https://mistral.ai/en/news/mistral-ocr" target="_blank" rel="noopener noreferrer" className="text-[#2F6FF0] hover:underline">Mistral</a>, <a href="https://github.com/qdrant/fastembed" target="_blank" rel="noopener noreferrer" className="text-[#2F6FF0] hover:underline">FastEmbed</a>, and <a href="https://qdrant.tech" target="_blank" rel="noopener noreferrer" className="text-amaranth font-medium hover:underline">Qdrant</a></p>
                <p className="mt-2">Deployed on <a href="https://fly.io" target="_blank" rel="noopener noreferrer" className="text-[#2F6FF0] hover:underline">Fly.io</a> • Developed with <a href="https://cursor.sh" target="_blank" rel="noopener noreferrer" className="text-[#2F6FF0] hover:underline">Cursor</a> • Powered by <a href="https://claude.ai" target="_blank" rel="noopener noreferrer" className="text-[#2F6FF0] hover:underline">Claude</a></p>
                <p className="mt-1">© {new Date().getFullYear()} Qdrant Quill. All rights reserved.</p>
              </div>
            </div>
          </footer>
        </div>
      </body>
    </html>
  );
}
