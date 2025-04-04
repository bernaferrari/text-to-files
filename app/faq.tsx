import { BookOpen } from "lucide-react"

import {
  Accordion,
  AccordionContent,
  AccordionItem,
  AccordionTrigger,
} from "@/components/ui/accordion"

export const FAQ = () => {
  return (
    <section>
      <div className="flex items-center gap-3 mb-8 justify-center pt-8">
        <div className="p-2 text-amber-600 dark:text-amber-400 bg-amber-100 dark:bg-amber-900/40 rounded-lg">
          <BookOpen size={20} />
        </div>
        <h2 className="text-2xl font-semibold tracking-tight">
          Frequently Asked Questions
        </h2>
      </div>
      <Accordion type="single" collapsible className="w-full">
        <AccordionItem value="item-1">
          <AccordionTrigger className="text-start font-medium hover:no-underline">
            What formats are recognized for file paths?
          </AccordionTrigger>
          <AccordionContent className="text-muted-foreground text-sm leading-relaxed pt-2">
            The tool is designed to be flexible and recognizes paths provided in
            various common ways just before a code block:
            <ul className="list-disc pl-5 mt-2 space-y-1">
              <li>Markdown Bold: `**path/to/your/file.ts**`</li>
              <li>Markdown Bold+Ticks: `**\`path/to/your/file.ts\`**`</li>
              <li>Markdown Ticks: `\`path/to/your/file.ts\``</li>
              <li>
                Code Comments: `// filename: path/to/file.py` or `# path:
                path/to/file.css` (must be on its own line)
              </li>
              <li>
                Simple Path Line: A line containing just `path/to/file.html`.
              </li>
              <li>
                Code Fence Language Hint: If the language hint looks like a path
                (contains `/` or `.`), e.g., `\`\`\`src/styles.css` (less
                reliable, prefers explicit paths).
              </li>
            </ul>
            Descriptions in parentheses like `**file.ts (updated)**` are
            automatically ignored. Place the path on the line directly preceding
            the ` ``` ` marker.
          </AccordionContent>
        </AccordionItem>
        <AccordionItem value="item-2">
          <AccordionTrigger className="text-start font-medium hover:no-underline">
            How well does the import path transformation work?
          </AccordionTrigger>
          <AccordionContent className="text-muted-foreground text-sm leading-relaxed pt-2">
            The automatic import path updating works for many standard
            JavaScript/TypeScript imports (ESM `import ... from`, CJS
            `require()`, dynamic `import()`) as well as Python imports (`import
            module`, `from package import module`). It correctly changes the
            *path string* within the import/require statement when the
            corresponding filename or directory structure is transformed.
            <br />
            <br />
            <strong>Limitations:</strong>
            <ul className="list-disc pl-5 mt-2 space-y-1">
              <li>
                It <strong>does not</strong> rename the *imported variable*
                itself (e.g., changing `import MyComponent` to `import
                myComponent` if the file was renamed). You might need to adjust
                variable names manually.
              </li>
              <li>
                Complex relative path calculations (e.g.,
                `../siblingFolder/file`) when *directories* are renamed might
                not always be perfectly resolved across all files. Review
                imports if you significantly restructure directories.
              </li>
              <li>
                While it handles basic Python imports, more complex Python
                import patterns or other languages may require manual
                adjustments.
              </li>
            </ul>
          </AccordionContent>
        </AccordionItem>
        <AccordionItem value="item-3">
          <AccordionTrigger className="text-start font-medium hover:no-underline">
            What happens if the same file path appears multiple times?
          </AccordionTrigger>
          <AccordionContent className="text-muted-foreground text-sm leading-relaxed pt-2">
            If the same file path is detected multiple times in the input, the
            tool creates unique entries in the file tree. It appends a counter
            to subsequent filenames (e.g., `utils.ts`, then `utils (1).ts`,
            `utils (2).ts`, etc.) to avoid overwriting. Each will contain the
            content from its respective code block in the input.
          </AccordionContent>
        </AccordionItem>
        <AccordionItem value="item-4">
          <AccordionTrigger className="text-start font-medium hover:no-underline">
            Can I edit the code in the preview editor?
          </AccordionTrigger>
          <AccordionContent className="text-muted-foreground text-sm leading-relaxed pt-2">
            No, the code editor panel on the right is <strong>read-only</strong>
            . It's designed for quickly viewing the extracted code with syntax
            highlighting and for copying or downloading individual files. To
            make edits, please download the file or the full project ZIP and
            open it in your preferred code editor or IDE.
          </AccordionContent>
        </AccordionItem>
        <AccordionItem value="item-5">
          <AccordionTrigger className="text-start font-medium hover:no-underline">
            Is my data safe? Where is it stored?
          </AccordionTrigger>
          <AccordionContent className="text-muted-foreground text-sm leading-relaxed pt-2">
            Your data is processed <strong>entirely within your browser</strong>
            .
            <ul className="list-disc pl-5 mt-2 space-y-1">
              <li>
                The text you paste and the extracted file structure are{" "}
                <strong>not</strong> sent to any external server.
              </li>
              <li>
                For convenience, the input text, extracted file list, and your
                last transformation setting are saved in your browser's
                localStorage. This means your work can persist if you refresh or
                close the tab, but it remains local to your machine and browser
                profile.
              </li>
            </ul>
          </AccordionContent>
        </AccordionItem>
        <AccordionItem value="item-6">
          <AccordionTrigger className="text-start font-medium hover:no-underline">
            Where can I find the source code or report issues?
          </AccordionTrigger>
          <AccordionContent className="text-muted-foreground text-sm leading-relaxed pt-2">
            This tool is open source! You can find the code repository, report
            bugs, or suggest features on GitHub. Look for the GitHub icon link
            in the site header. Contributions and feedback are welcome!
          </AccordionContent>
        </AccordionItem>
      </Accordion>
    </section>
  )
}
