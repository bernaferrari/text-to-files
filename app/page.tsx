import { About } from "./about"
import { FAQ } from "./faq"
import FileExtractor from "./file-extractor"
import { HowItWorks } from "./how-it-works"
import { PostHogProvider } from "./providers"

export default function Home() {
  return (
    <div className="flex min-h-screen flex-col">
      <main className="flex-1 py-8 px-4 md:px-8">
        <div className="mx-auto w-full max-w-7xl space-y-12">
          <div className="text-center space-y-3 pb-6">
            <h1 className="text-4xl font-bold tracking-tight sm:text-5xl bg-gradient-to-r from-primary via-primary/80 to-primary bg-clip-text text-transparent">
              Text to Files
            </h1>
            <p className="text-muted-foreground max-w-[650px] mx-auto text-lg leading-relaxed">
              Turn AI chat outputs into files with just a paste.
            </p>
          </div>

          <PostHogProvider>
            <FileExtractor />
          </PostHogProvider>

          <div className="container max-w-4xl mx-auto pt-16 pb-10 space-y-16">
            <HowItWorks />
            <FAQ />
            <About />
          </div>
        </div>
      </main>
    </div>
  )
}
