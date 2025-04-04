import "@/styles/globals.css"

import { Metadata, Viewport } from "next"
import { Toaster } from "sonner"

import { siteConfig } from "@/config/site"
import { fontSans } from "@/lib/fonts"
import { cn } from "@/lib/utils"
import { TooltipProvider } from "@/components/ui/tooltip"
import GridPattern from "@/components/magicui/grid-pattern"
import { SiteHeader } from "@/components/site-header"
import { TailwindIndicator } from "@/components/tailwind-indicator"
import { ThemeProvider } from "@/components/theme-provider"

export const metadata: Metadata = {
  title: {
    default: siteConfig.name,
    template: `%s - ${siteConfig.name}`,
  },
  description: siteConfig.description,
  openGraph: {
    siteName: siteConfig.name,
    images: "/opengraph-image.png",
  },
  icons: {
    icon: "/favicon.ico",
    shortcut: "/favicon-16x16.png",
    apple: "/apple-touch-icon.png",
  },
}

export const viewport: Viewport = {
  themeColor: [
    { media: "(prefers-color-scheme: light)", color: "white" },
    { media: "(prefers-color-scheme: dark)", color: "black" },
  ],
}

interface RootLayoutProps {
  children: React.ReactNode
}

export default function RootLayout({ children }: RootLayoutProps) {
  return (
    <>
      <html lang="en" suppressHydrationWarning>
        <head />
        <body
          className={cn(
            "min-h-screen bg-background font-sans antialiased",
            fontSans.variable
          )}
        >
          <TooltipProvider>
            <ThemeProvider attribute="class" defaultTheme="system" enableSystem>
              <div className="relative flex min-h-screen flex-col">
                <SiteHeader />
                <div className="flex-1 relative flex flex-col">
                  <div
                    className="w-full h-full absolute top-0 left-0 right-0 bottom-0"
                    style={{
                      opacity: 0.4,
                      backgroundImage: `radial-gradient(circle at 20% 20%, rgba(124, 58, 237, 0.18) 0px, transparent 40%),
                      radial-gradient(circle at 75% 5%, rgba(234, 179, 8, 0.15) 0px, transparent 35%),
                      radial-gradient(circle at 5% 50%, rgba(16, 185, 129, 0.15) 0px, transparent 40%),
                      radial-gradient(circle at 75% 60%, rgba(244, 63, 94, 0.15) 0px, transparent 45%),
                      radial-gradient(circle at 10% 90%, rgba(37, 99, 235, 0.18) 0px, transparent 40%),
                      radial-gradient(circle at 90% 85%, rgba(59, 130, 246, 0.15) 0px, transparent 35%),
                      radial-gradient(ellipse at 50% 50%, rgba(8, 145, 178, 0.08) 0px, transparent 70%)`,
                    }}
                  />

                  <GridPattern
                    width={50}
                    height={50}
                    x={-1}
                    y={-1}
                    strokeDasharray={"4 2"}
                    className={cn("opacity-20")}
                  />
                  <div className="z-10 w-full h-full flex flex-col">
                    {children}
                  </div>
                </div>
              </div>
              <TailwindIndicator />
              <Toaster richColors />
            </ThemeProvider>
          </TooltipProvider>
        </body>
      </html>
    </>
  )
}
