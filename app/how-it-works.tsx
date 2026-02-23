import { Code, Package, RefreshCw, Zap } from "lucide-react"

import { Card, CardContent } from "@/components/ui/card"

export const HowItWorks = () => {
  return (
    <section>
      <div className="space-y-3 text-center mb-10">
        <h2 className="text-3xl font-semibold tracking-tight">How It Works</h2>
        <p className="text-muted-foreground text-lg max-w-2xl mx-auto">
          A quick overview of the extraction process.
        </p>
      </div>
      <div className="grid grid-cols-1 sm:grid-cols-2 gap-6 lg:gap-8">
        <Card className="bg-card/70 border-border/50 shadow-sm hover:shadow-md transition-shadow duration-200">
          <CardContent>
            <div className="flex items-center gap-3 mb-3">
              <div className="p-2 bg-emerald-100 dark:bg-emerald-900/40 rounded-lg">
                <Code
                  size={20}
                  className="text-emerald-600 dark:text-emerald-400"
                />
              </div>
              <h3 className="font-semibold text-base">1. Paste Text</h3>
            </div>
            <p className="text-muted-foreground text-sm leading-relaxed">
              Paste text containing code blocks (from ChatGPT, Gemini, Claude,
              etc.) into the input area. Use "Demo" for an example.
            </p>
          </CardContent>
        </Card>
        <Card className="bg-card/70 border-border/50 shadow-sm hover:shadow-md transition-shadow duration-200">
          <CardContent>
            <div className="flex items-center gap-3 mb-3">
              <div className="p-2 bg-blue-100 dark:bg-blue-900/40 rounded-lg">
                <Zap size={20} className="text-blue-600 dark:text-blue-400" />
              </div>
              <h3 className="font-semibold text-base">
                2. Automatic Extraction
              </h3>
            </div>
            <p className="text-muted-foreground text-sm leading-relaxed">
              The tool instantly parses the text, identifies file paths and
              code, and builds an interactive file tree in the right panel.
            </p>
          </CardContent>
        </Card>
        <Card className="bg-card/70 border-border/50 shadow-sm hover:shadow-md transition-shadow duration-200">
          <CardContent>
            <div className="flex items-center gap-3 mb-3">
              <div className="p-2 bg-purple-100 dark:bg-purple-900/40 rounded-lg">
                <RefreshCw
                  size={20}
                  className="text-purple-600 dark:text-purple-400"
                />
              </div>
              <h3 className="font-semibold text-base">3. Transform Paths</h3>
            </div>
            <p className="text-muted-foreground text-sm leading-relaxed">
              Use "Transform Paths" to convert file/directory names (e.g., to
              `kebab-case`). Import paths referencing transformed files are
              automatically updated.
            </p>
          </CardContent>
        </Card>
        <Card className="bg-card/70 border-border/50 shadow-sm hover:shadow-md transition-shadow duration-200">
          <CardContent>
            <div className="flex items-center gap-3 mb-3">
              <div className="p-2 bg-orange-100 dark:bg-orange-900/40 rounded-lg">
                <Package
                  size={20}
                  className="text-orange-600 dark:text-orange-400"
                />
              </div>
              <h3 className="font-semibold text-base">4. Download</h3>
            </div>
            <p className="text-muted-foreground text-sm leading-relaxed">
              Download individual files, specific directories (as .zip), or the
              entire project structure.
            </p>
          </CardContent>
        </Card>
      </div>
    </section>
  )
}
