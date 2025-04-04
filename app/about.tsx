import Link from "next/link"
import { ArrowRightIcon, FileCode, Github, Mail, Star } from "lucide-react"

import { cn } from "@/lib/utils"
import { buttonVariants } from "@/components/ui/button"
import { Card } from "@/components/ui/card"
import { XLogo } from "@/components/x-logo"

export const About = () => {
  return (
    <Card className="w-full max-w-5xl bg-card/50 p-6">
      <div className="flex flex-col items-center text-center">
        <h2 className="text-2xl font-bold mb-2">About Text to Files</h2>
        <p className="text-neutral-600 dark:text-neutral-300 mb-4">
          Streamlining the workflow of turning text outputs into working
          projects.
        </p>
        <div className="flex gap-3">
          <a
            href="https://github.com/bernaferrari"
            target="_blank"
            rel="noopener noreferrer"
            className="p-2 rounded-full bg-neutral-100 dark:bg-neutral-700 hover:bg-neutral-200 dark:hover:bg-neutral-600 transition-colors border dark:border-none"
            aria-label="GitHub Profile"
          >
            <Github size={18} />
          </a>
          <a
            href="https://x.com/bernaferrari"
            target="_blank"
            rel="noopener noreferrer"
            className="p-2 rounded-full bg-neutral-100 dark:bg-neutral-700 hover:bg-neutral-200 dark:hover:bg-neutral-600 transition-colors border dark:border-none"
            aria-label="X Profile"
          >
            <XLogo />
          </a>
          <a
            href="mailto:bernaferrari2@gmail.com"
            target="_blank"
            rel="noopener noreferrer"
            className="p-2 rounded-full bg-neutral-100 dark:bg-neutral-700 hover:bg-neutral-200 dark:hover:bg-neutral-600 transition-colors border dark:border-none"
            aria-label="Email"
          >
            <Mail size={18} />
          </a>
        </div>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
        {/* Tool Description and Features Card */}
        <div className="bg-white dark:bg-neutral-800 h-full rounded-xl p-5 border border-neutral-200 dark:border-neutral-700 hover:border-blue-300 dark:hover:border-blue-700 transition-colors mb-4">
          <div className="flex items-center gap-3 mb-3">
            <div className="p-2 bg-blue-100 dark:bg-blue-900/40 rounded-lg">
              <FileCode
                size={20}
                className="text-blue-600 dark:text-blue-400"
              />
            </div>
            <h3 className="font-semibold text-base">Text to Files</h3>
          </div>
          <p className="text-neutral-600 dark:text-neutral-300 leading-relaxed mb-4">
            Built for developers working with AI assistants, this tool bridges
            the gap between text-generated code blocks and organized project
            structures, saving you time and manual file creation.
          </p>
          <h4 className="font-semibold text-sm mb-2">Features</h4>
          <ul className="text-neutral-600 dark:text-neutral-300 space-y-2 leading-relaxed">
            <li className="flex items-start gap-2">
              <div className="mt-1.5">
                <ArrowRightIcon size={12} />
              </div>
              <span>Intelligent extraction of file paths and code blocks</span>
            </li>
            <li className="flex items-start gap-2">
              <div className="mt-1.5">
                <ArrowRightIcon size={12} />
              </div>
              <span>Interactive file tree with syntax highlighting</span>
            </li>
            <li className="flex items-start gap-2">
              <div className="mt-1.5">
                <ArrowRightIcon size={12} />
              </div>
              <span>Path transformation with automatic import updating</span>
            </li>
            <li className="flex items-start gap-2">
              <div className="mt-1.5">
                <ArrowRightIcon size={12} />
              </div>
              <span>Export as individual files or complete project ZIP</span>
            </li>
          </ul>
        </div>

        {/* Open Source and Contact Card */}
        <div className="bg-white dark:bg-neutral-800 h-full rounded-xl p-5 border border-neutral-200 dark:border-neutral-700 hover:border-amber-300 dark:hover:border-amber-700 transition-colors">
          <div className="flex items-center gap-3 mb-3">
            <div className="p-2 text-amber-600 dark:text-amber-400 bg-amber-100 dark:bg-amber-900/40 rounded-lg">
              <Github size={20} />
            </div>
            <h3 className="font-semibold text-base">Open Source & Contact</h3>
          </div>
          <p className="text-neutral-600 dark:text-neutral-300 leading-relaxed mb-3">
            This tool is open source and available on GitHub. Contributions,
            feature requests, and bug reports are welcome!
          </p>
          <Link
            href="https://github.com/bernaferrari/text-to-files"
            target="_blank"
            rel="noopener noreferrer"
            className={cn(
              buttonVariants({
                variant: "outline",
              })
            )}
          >
            <Star size={14} className="text-yellow-500 fill-yellow-500" />
            <span>View on GitHub</span>
          </Link>
          <h4 className="font-semibold text-sm mb-2 mt-4">Get in Touch</h4>
          <p className="text-neutral-600 dark:text-neutral-300 leading-relaxed mb-3">
            Have feedback, questions, or feature suggestions? Reach out through
            any of these channels:
          </p>
          <div className="space-y-2">
            <a
              href="mailto:bernaferrari2@gmail.com"
              target="_blank"
              rel="noopener noreferrer"
              className="flex items-center gap-2 text-blue-600 dark:text-blue-400 hover:underline"
            >
              <Mail size={16} />
              <span>bernaferrari2@gmail.com</span>
            </a>
            <a
              href="https://github.com/bernaferrari/text-to-files/issues"
              target="_blank"
              rel="noopener noreferrer"
              className="flex items-center gap-2 text-blue-600 dark:text-blue-400 hover:underline"
            >
              <Github size={16} />
              <span>Report an issue on GitHub</span>
            </a>
          </div>
        </div>
      </div>
    </Card>
  )
}
