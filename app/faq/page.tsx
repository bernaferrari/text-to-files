import type { Metadata } from "next"
import Link from "next/link"
import { ArrowLeft } from "lucide-react"

import { siteConfig } from "@/config/site"

import { FAQ } from "../faq"

const description =
  "Learn how to extract files from AI responses: code block formatting, folder paths, live editing, renaming, ZIP downloads, and browser storage."

export const metadata: Metadata = {
  title: "Help & FAQ",
  description,
  alternates: { canonical: "/faq" },
  openGraph: {
    title: "Help & FAQ — Text to Files",
    description,
    url: "/faq",
    siteName: siteConfig.name,
    images: "/opengraph-image.png",
  },
}

export default function FAQPage() {
  return (
    <main id="main-content" className="mx-auto max-w-3xl px-6 py-10 sm:py-14">
      <Link
        href="/"
        className="inline-flex items-center gap-2 text-sm text-muted-foreground hover:text-foreground focus-visible:outline-2 focus-visible:outline-offset-4"
      >
        <ArrowLeft className="size-4" /> Back to the tool
      </Link>
      <header className="mb-10 mt-8">
        <h1 className="text-4xl font-medium tracking-tight">
          A little help, if you need it.
        </h1>
        <p className="mt-4 max-w-xl text-base leading-7 text-muted-foreground">
          How to turn an AI response into files, keep your folders organized,
          and take the result into your project.
        </p>
      </header>
      <FAQ />
      <footer className="mt-10 flex flex-wrap items-center justify-between gap-4 border-t pt-6 text-sm">
        <Link href="/" className="font-medium underline underline-offset-4">
          Start extracting files
        </Link>
        <a
          href={siteConfig.links.github + "/issues"}
          className="text-muted-foreground hover:text-foreground"
        >
          Report an issue
        </a>
      </footer>
    </main>
  )
}
