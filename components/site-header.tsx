import Link from "next/link"

import { siteConfig } from "@/config/site"
import { buttonVariants } from "@/components/ui/button"
import { Icons } from "@/components/icons"
import { ThemeToggle } from "@/components/theme-toggle"

export function SiteHeader() {
  return (
    <header className="sticky top-0 z-40 border-b bg-background/95 backdrop-blur-sm">
      <div className="mx-auto flex h-14 max-w-[1600px] items-center justify-between px-4 sm:px-7">
        <Link href="/" className="text-sm font-medium tracking-tight">
          Text to Files
        </Link>
        <nav
          aria-label="Main navigation"
          className="flex items-center gap-2 text-muted-foreground"
        >
          <Link
            href={siteConfig.links.github}
            target="_blank"
            rel="noreferrer"
            aria-label="Source code on GitHub"
            className={buttonVariants({ size: "icon", variant: "ghost" })}
          >
            <Icons.gitHub className="size-4" />
          </Link>
          <ThemeToggle />
        </nav>
      </div>
    </header>
  )
}
