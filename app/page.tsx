import { ArrowRight, FileCode2, FileText } from "lucide-react"

import { siteConfig } from "@/config/site"

import FileExtractor from "./file-extractor"
import { PostHogProvider } from "./providers"

export default function Home() {
  return (
    <main
      id="main-content"
      className="mx-auto flex min-h-[calc(100dvh-56px)] max-w-[1600px] flex-col px-3 pt-4 sm:px-6"
    >
      <section
        aria-labelledby="intro-title"
        className="grid items-center gap-6 pb-8 pt-5 sm:grid-cols-[minmax(0,1fr)_240px] sm:gap-10 sm:pb-10 sm:pt-7 lg:grid-cols-[minmax(0,1fr)_300px]"
      >
        <div>
          <h1
            id="intro-title"
            className="text-[34px] leading-[1.08] font-medium tracking-[-0.045em] sm:text-[42px] lg:text-[48px]"
          >
            Out of the chat.
            <br />
            <span className="text-muted-foreground">Into your project.</span>
          </h1>
          <p className="mt-4 max-w-[440px] text-[14px] leading-6 text-pretty text-muted-foreground sm:text-[15px]">
            Turn code blocks from an AI response into files.{" "}
            <br className="hidden lg:block" />
            Paste, review, and download. Folder structure included.
          </p>
        </div>
        <div
          aria-hidden="true"
          className="hidden items-center justify-end gap-4 pr-2 sm:flex lg:gap-6"
        >
          <div className="w-[76px] shrink-0 -rotate-6 rounded-lg border border-border/80 bg-card p-3 shadow-xs">
            <FileText
              className="mb-4 size-5 text-muted-foreground"
              strokeWidth={1.5}
            />
            <div className="space-y-2">
              <div className="h-1 w-full rounded-full bg-foreground/15" />
              <div className="h-1 w-3/4 rounded-full bg-foreground/15" />
              <div className="rounded-sm bg-muted px-1.5 py-2 font-mono text-[10px] leading-none text-muted-foreground">
                {"{ … }"}
              </div>
            </div>
          </div>
          <ArrowRight
            className="size-4 shrink-0 text-muted-foreground/60"
            strokeWidth={1.5}
          />
          <div className="space-y-3 font-mono text-[11px] text-muted-foreground">
            <div className="flex items-center gap-2">
              <FileCode2 className="size-4" strokeWidth={1.5} />
              index.html
            </div>
            <div className="flex items-center gap-2">
              <FileCode2 className="size-4" strokeWidth={1.5} />
              styles.css
            </div>
            <div className="flex items-center gap-2">
              <FileCode2 className="size-4" strokeWidth={1.5} />
              app.js
            </div>
          </div>
        </div>
      </section>
      <div className="flex-1">
        <PostHogProvider>
          <FileExtractor />
        </PostHogProvider>
      </div>
      <footer className="flex flex-wrap items-center justify-between gap-4 py-4 text-[11px] text-muted-foreground">
        <span>
          Made by{" "}
          <a
            className="hover:text-foreground focus-visible:outline-2 focus-visible:outline-offset-4"
            href="https://bernaferrari.com"
          >
            Bernardo Ferrari
          </a>
        </span>
        <div className="flex gap-6">
          <a className="hover:text-foreground" href={siteConfig.links.github}>
            Source code
          </a>
          <a
            className="hover:text-foreground"
            href={siteConfig.links.github + "/issues"}
          >
            Report an issue
          </a>
        </div>
      </footer>
    </main>
  )
}
